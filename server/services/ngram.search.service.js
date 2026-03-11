/**
 * @fileoverview N-Gram Search Service
 *
 * A self-contained, in-process search engine that replaces Algolia.
 * Uses a trigram (n=3) inverted index for fast prefix + partial matching,
 * suitable for large product datasets without any external dependency.
 *
 * Architecture:
 *  - In-memory index: Map<ngram, Set<docId>>
 *  - Document store:  Map<docId, IndexedDocument>
 *  - Scoring:        TF-style — ranked by how many unique n-grams of the
 *                    query match a document (intersection count / query ngrams).
 *  - Hydration:      On first search or explicit rebuild, loads all active
 *                    products & categories from MongoDB.
 *  - Fuzzy matching: Levenshtein distance for typo tolerance ("suts" → "suits")
 *  - Phonetic matching: Soundex for sound-alike words ("saris" → "sarees", "lahenga" → "lehenga")
 *  - Category boost: Categories always ranked above products for same score
 *
 * Public API:
 *  - syncToIndex(item, type)        — upsert a document into the index
 *  - deleteFromIndex(objectId)      — remove a document from the index
 *  - searchNgram(query, options)    — search and return ranked hits
 *  - rebuildIndex()                 — full rebuild from MongoDB (admin use)
 */

import Product from "../models/product.model.js";
import Category from "../models/category.model.js";

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

const N = 3;                          // trigram
const MAX_HITS = 100;                 // hard cap on returned hits before pagination
const INDEX_TTL_MS = 15 * 60 * 1000; // 15 minutes — auto-rebuild stale index

// ---------------------------------------------------------------------------
// In-Memory Index State
// ---------------------------------------------------------------------------

/** @type {Map<string, Set<string>>} ngram -> Set of document IDs */
const invertedIndex = new Map();

/** @type {Map<string, Object>} docId -> document */
const documentStore = new Map();

let isHydrated = false;
let lastHydratedAt = 0;
let hydrationPromise = null; // prevents concurrent rebuilds

// ---------------------------------------------------------------------------
// N-Gram Helpers
// ---------------------------------------------------------------------------

/**
 * Normalises a string for indexing or querying.
 * Lowercases, removes punctuation, trims extra whitespace.
 */
const normalise = (text) => {
    if (!text || typeof text !== "string") return "";
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
};

/**
 * Generates all overlapping n-grams from a string.
 * Also adds individual words for whole-word matching.
 */
const generateNgrams = (text, n = N) => {
    const normalised = normalise(text);
    const grams = new Set();
    if (!normalised) return grams;

    // Word-level tokens (important for exact word hits)
    const words = normalised.split(" ");
    words.forEach((w) => {
        if (w.length > 0) grams.add(w);
    });

    // Character-level n-grams over the full normalised string (no spaces)
    const compact = normalised.replace(/\s/g, "");
    for (let i = 0; i <= compact.length - n; i++) {
        grams.add(compact.slice(i, i + n));
    }

    return grams;
};

/**
 * Extracts all searchable text from a document and converts to an n-gram set.
 */
const documentNgrams = (doc) => {
    const fields = [
        doc.name,
        doc.description,
        doc.shortDescription,
        doc.category,
        ...(doc.tags || []),
        ...(doc.fabric || []),
        ...(doc.style || []),
        ...(doc.work || []),
        ...(doc.occasion || []),
        ...(doc.wearType || []),
        ...(doc.colors || []),
    ]
        .filter(Boolean)
        .join(" ");

    return generateNgrams(fields);
};

// ---------------------------------------------------------------------------
// Fuzzy Matching Helpers  (defined BEFORE searchNgram which calls them)
// ---------------------------------------------------------------------------

/**
 * Calculates Levenshtein distance between two strings.
 * Used for typo-tolerance / fuzzy matching.
 *
 * Examples:
 *   "suts"  vs "suits"  → 1
 *   "soot"  vs "suit"   → 2
 *   "shurt" vs "shirt"  → 1
 */
const levenshteinDistance = (a, b) => {
    if (a === b) return 0;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
    matrix[0] = Array.from({ length: a.length + 1 }, (_, i) => i);

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            matrix[i][j] = b[i - 1] === a[j - 1]
                ? matrix[i - 1][j - 1]
                : Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,      // insertion
                    matrix[i - 1][j] + 1        // deletion
                );
        }
    }

    return matrix[b.length][a.length];
};

/**
 * Returns a fuzzy match bonus score based on how close the query words
 * are to the document name words using Levenshtein distance.
 *
 * Bonus tiers:
 *   distance === 1, lenDiff <= 1  → +150  e.g. "suts"  → "suits"
 *   distance === 2, lenDiff <= 1,
 *                  maxLen >= 5    → +60   e.g. "soots" → "suits"
 */
const getFuzzyBonus = (normalisedQuery, normalisedName) => {
    const queryWords = normalisedQuery.split(" ");
    const nameWords = normalisedName.split(" ");

    let maxBonus = 0;

    queryWords.forEach((qWord) => {
        if (qWord.length < 4) return;

        nameWords.forEach((nWord) => {
            if (nWord.length < 4) return;

            const distance = levenshteinDistance(qWord, nWord);
            const maxLen = Math.max(qWord.length, nWord.length);
            const lenDiff = Math.abs(qWord.length - nWord.length);

            if (distance === 1 && lenDiff <= 1) {
                maxBonus = Math.max(maxBonus, 150);
            } else if (distance === 2 && lenDiff <= 1 && maxLen >= 5) {
                maxBonus = Math.max(maxBonus, 60);
            }
        });
    });

    return maxBonus;
};

// ---------------------------------------------------------------------------
// Phonetic Matching (Soundex)
// ---------------------------------------------------------------------------

/**
 * Generates a Soundex code for a word.
 * Maps similar-sounding characters to the same digit code.
 *
 * Examples:
 *   "saree"   → S600
 *   "sari"    → S600  ✓ match
 *   "saris"   → S620
 *   "sarees"  → S620  ✓ match
 *   "lehenga" → L520
 *   "lahenga" → L520  ✓ match
 *   "kurta"   → K630
 *   "kurtha"  → K630  ✓ match
 *   "dupatta" → D130
 *   "dupata"  → D130  ✓ match
 */
const soundex = (word) => {
    if (!word || word.length === 0) return "";

    const map = {
        b: 1, f: 1, p: 1, v: 1,
        c: 2, g: 2, j: 2, k: 2, q: 2, s: 2, x: 2, z: 2,
        d: 3, t: 3,
        l: 4,
        m: 5, n: 5,
        r: 6,
    };

    const w = word.toLowerCase();
    let code = w[0].toUpperCase();
    let prev = map[w[0]] || 0;

    for (let i = 1; i < w.length && code.length < 4; i++) {
        const curr = map[w[i]];
        if (curr && curr !== prev) {
            code += curr;
        }
        prev = curr || 0;
    }

    return code.padEnd(4, "0");
};

/**
 * Returns a phonetic bonus if any query word sounds like any document name word.
 * Uses Soundex codes — same code means same-sounding word.
 *
 * Examples:
 *   "saris" → S620,  "sarees" → S620  → +120
 *   "lahenga" → L520, "lehenga" → L520 → +120
 *   "salwar" → S460,  "shalwar" → S460 → +120
 */
const getPhoneticBonus = (normalisedQuery, normalisedName) => {
    const queryWords = normalisedQuery.split(" ").filter((w) => w.length >= 3);
    const nameWords = normalisedName.split(" ").filter((w) => w.length >= 3);

    let maxBonus = 0;

    queryWords.forEach((qWord) => {
        const qCode = soundex(qWord);
        nameWords.forEach((nWord) => {
            const nCode = soundex(nWord);
            if (qCode === nCode) {
                maxBonus = Math.max(maxBonus, 120);
            }
        });
    });

    return maxBonus;
};

// ---------------------------------------------------------------------------
// Index Mutation Helpers
// ---------------------------------------------------------------------------

/**
 * Adds or replaces a document in the inverted index and document store.
 */
const upsertDocumentIntoIndex = (doc) => {
    if (documentStore.has(doc.id)) {
        removeDocumentFromIndex(doc.id);
    }

    const grams = documentNgrams(doc);
    grams.forEach((gram) => {
        if (!invertedIndex.has(gram)) {
            invertedIndex.set(gram, new Set());
        }
        invertedIndex.get(gram).add(doc.id);
    });

    documentStore.set(doc.id, doc);
};

/**
 * Removes a document from the inverted index and document store.
 */
const removeDocumentFromIndex = (docId) => {
    if (!documentStore.has(docId)) return;

    const doc = documentStore.get(docId);
    const grams = documentNgrams(doc);

    grams.forEach((gram) => {
        const bucket = invertedIndex.get(gram);
        if (bucket) {
            bucket.delete(docId);
            if (bucket.size === 0) invertedIndex.delete(gram);
        }
    });

    documentStore.delete(docId);
};

// ---------------------------------------------------------------------------
// Document Builders (MongoDB doc -> IndexedDocument)
// ---------------------------------------------------------------------------

/**
 * Converts a Mongoose Product document into an IndexedDocument.
 */
const buildProductDoc = (product) => {
    const doc = {
        id: product._id.toString(),
        type: "product",
        name: product.name || "",
        slug: product.slug || "",
        description: product.description || "",
        shortDescription: product.shortDescription || "",
        mainImage: product.mainImage || null,
        category: product.category?.name || (typeof product.category === "string" ? product.category : ""),
        tags: product.tags || [],
        fabric: product.fabric || [],
        style: product.style || [],
        work: product.work || [],
        occasion: product.occasion || [],
        wearType: product.wearType || [],
        stock: product.stock,
        status: product.status,
        colors: product.variants
            ? [...new Set(product.variants.map((v) => v.color?.name).filter(Boolean))]
            : [],
    };

    // Compute min effective price from variants
    if (product.variants && product.variants.length > 0) {
        let minPrice = Infinity;
        let relatedMrp = 0;

        product.variants.forEach((v) => {
            v.sizes?.forEach((s) => {
                const effective =
                    s.discountPrice && s.discountPrice > 0 ? s.discountPrice : s.price;
                if (effective < minPrice) {
                    minPrice = effective;
                    relatedMrp = s.price;
                }
            });
        });

        if (minPrice !== Infinity) {
            doc.minPrice = minPrice;
            doc.mrp = relatedMrp;
            if (relatedMrp > minPrice) {
                doc.discount = Math.round(((relatedMrp - minPrice) / relatedMrp) * 100);
            }
        }
    }

    return doc;
};

/**
 * Converts a Mongoose Category document into an IndexedDocument.
 */
const buildCategoryDoc = (category) => ({
    id: category._id.toString(),
    type: "category",
    name: category.name || "",
    slug: category.slug || "",
    description: category.description || "",
    image: category.mainImage || null,
    status: category.status,
});

// ---------------------------------------------------------------------------
// Hydration (Load from MongoDB)
// ---------------------------------------------------------------------------

/**
 * Clears the index and rebuilds it from MongoDB.
 * Uses a guard (`hydrationPromise`) to prevent concurrent rebuilds.
 */
const hydrateIndex = async () => {
    if (hydrationPromise) {
        return hydrationPromise;
    }

    hydrationPromise = (async () => {
        invertedIndex.clear();
        documentStore.clear();

        // Load products (active only)
        const products = await Product.find({ status: "Active" })
            .populate("category", "name")
            .lean();
        products.forEach((p) => upsertDocumentIntoIndex(buildProductDoc(p)));

        // Load categories (active only)
        const categories = await Category.find({ status: "Active" }).lean();
        categories.forEach((c) => upsertDocumentIntoIndex(buildCategoryDoc(c)));

        isHydrated = true;
        lastHydratedAt = Date.now();
        hydrationPromise = null;
    })();

    return hydrationPromise;
};

/**
 * Ensures the index is hydrated and not stale before a search.
 */
const ensureHydrated = async () => {
    const isStale = Date.now() - lastHydratedAt > INDEX_TTL_MS;
    if (!isHydrated || isStale) {
        await hydrateIndex();
    }
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Upserts an item (product or category) into the in-memory n-gram index.
 * Call this after every create/update in product.service.js / category.service.js.
 */
export const syncToIndex = async (item, type) => {
    try {
        let doc;
        if (type === "product") {
            doc = buildProductDoc(item);
        } else if (type === "category") {
            doc = buildCategoryDoc(item);
        } else {
            return;
        }
        upsertDocumentIntoIndex(doc);
    } catch (error) {
        console.error("[NGramSearch] Error syncing to index:", error);
    }
};

/**
 * Removes a document from the in-memory n-gram index by its MongoDB _id string.
 */
export const deleteFromIndex = async (objectId) => {
    try {
        removeDocumentFromIndex(objectId.toString());
    } catch (error) {
        console.error("[NGramSearch] Error deleting from index:", error);
    }
};

/**
 * Searches the n-gram index and returns ranked results.
 *
 * Scoring strategy:
 *  1. Base score      — number of query n-grams that match a document
 *  2. Fuzzy expand    — typo'd query words get +0.5 per close gram match
 *  3. Category boost  — categories score x10 to always outrank products
 *  4. Name bonuses    — exact (+1000), startsWith (+500), contains (+200)
 *  5. Fuzzy bonus     — typo distance 1 (+150), distance 2 (+60)
 *  6. Phonetic bonus  — Soundex match (+120) e.g. "saris" → "sarees"
 */
export const searchNgram = async (query, options = {}) => {
    await ensureHydrated();

    const limit = Math.min(options.limit || 10, MAX_HITS);
    const page = Math.max(options.page || 1, 1);

    if (!query || query.trim().length === 0) {
        return { hits: [], total: 0, page, totalPages: 0 };
    }

    const queryGrams = generateNgrams(query);
    const normalisedQuery = normalise(query);

    // --- Step 1: Base scoring via inverted index ---
    const scores = new Map();

    queryGrams.forEach((gram) => {
        const bucket = invertedIndex.get(gram);
        if (!bucket) return;
        bucket.forEach((docId) => {
            scores.set(docId, (scores.get(docId) || 0) + 1);
        });
    });

    // --- Step 2: Fuzzy query expansion ---
    // For each query word, scan index grams at distance 1 and add partial credit.
    // ±1 length tolerance catches "soots"(5) vs "suit"(4) style typos.
    const queryWords = normalisedQuery.split(" ").filter((w) => w.length >= 3);
    queryWords.forEach((qWord) => {
        invertedIndex.forEach((bucket, gram) => {
            if (gram.length < 3 || Math.abs(gram.length - qWord.length) > 1) return;
            const distance = levenshteinDistance(qWord, gram);
            if (distance === 1) {
                bucket.forEach((docId) => {
                    scores.set(docId, (scores.get(docId) || 0) + 0.5);
                });
            }
        });
    });

    if (scores.size === 0) {
        return { hits: [], total: 0, page, totalPages: 0 };
    }

    // Filter out low-confidence matches before boosting
    // A doc must match at least 2 query grams OR have score > 1 to be considered
    const minBaseScore = Math.max(1.5, queryGrams.size * 0.15);
    scores.forEach((score, docId) => {
        if (score < minBaseScore) scores.delete(docId);
    });

    if (scores.size === 0) {
        return { hits: [], total: 0, page, totalPages: 0 };
    }

    // --- Step 3: Apply boosts and sort ---
    const ranked = [...scores.entries()]
        .map(([docId, score]) => {
            const doc = documentStore.get(docId);
            if (!doc) return [docId, score];

            let boostedScore = score;
            const normalisedName = normalise(doc.name);

            // Category type boost — guarantees categories outrank products
            if (doc.type === "category") {
                boostedScore *= 50;
            }

            // Name proximity boosts
            if (normalisedName === normalisedQuery) {
                boostedScore += 1000;
            } else if (normalisedName.startsWith(normalisedQuery)) {
                boostedScore += 500;
            } else if (normalisedName.includes(normalisedQuery)) {
                boostedScore += 200;
            } else {
                // Fuzzy: "suts" → "suits", "soots" → "suits"
                const fuzzyBonus = getFuzzyBonus(normalisedQuery, normalisedName);
                // Phonetic: "saris" → "sarees", "lahenga" → "lehenga"
                const phoneticBonus = getPhoneticBonus(normalisedQuery, normalisedName);
                boostedScore += Math.max(fuzzyBonus, phoneticBonus);
            }

            return [docId, boostedScore];
        })
        .sort((a, b) => {
            const docA = documentStore.get(a[0]);
            const docB = documentStore.get(b[0]);
            const aIsCategory = docA?.type === "category" ? 1 : 0;
            const bIsCategory = docB?.type === "category" ? 1 : 0;
            // Categories always first, then sort by score within each group
            if (bIsCategory !== aIsCategory) return bIsCategory - aIsCategory;
            return b[1] - a[1];
        })
        .slice(0, MAX_HITS);

    const total = ranked.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const hits = ranked
        .slice(skip, skip + limit)
        .map(([docId]) => documentStore.get(docId))
        .filter(Boolean);

    return { hits, total, page, totalPages };
};

/**
 * Triggers a full index rebuild from MongoDB.
 * Useful for an admin endpoint to warm up or re-sync the index after bulk imports.
 */
export const rebuildIndex = async () => {
    const start = Date.now();
    await hydrateIndex();
    return {
        success: true,
        documents: documentStore.size,
        ngrams: invertedIndex.size,
        durationMs: Date.now() - start,
    };
};