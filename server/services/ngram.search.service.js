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
 *
 * Public API (mirrors algolia.service.js exports):
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

const N = 3; // trigram
const MAX_HITS = 100; // hard cap on returned hits before pagination
const INDEX_TTL_MS = 15 * 60 * 1000; // 15 minutes — auto-rebuild stale index

/**
 * @typedef {Object} IndexedDocument
 * @property {string} id
 * @property {'product'|'category'} type
 * @property {string} name
 * @property {string} slug
 * @property {string} [description]
 * @property {string} [shortDescription]
 * @property {Object} [mainImage]
 * @property {string} [category]
 * @property {string[]} [tags]
 * @property {string[]} [fabric]
 * @property {string[]} [style]
 * @property {string[]} [work]
 * @property {string[]} [occasion]
 * @property {string[]} [wearType]
 * @property {string[]} [colors]
 * @property {number}  [stock]
 * @property {string}  [status]
 * @property {number}  [minPrice]
 * @property {number}  [mrp]
 * @property {number}  [discount]
 * @property {Object}  [image]  — only for categories
 */

// ---------------------------------------------------------------------------
// In-Memory Index State
// ---------------------------------------------------------------------------

/** @type {Map<string, Set<string>>} ngram -> Set of document IDs */
const invertedIndex = new Map();

/** @type {Map<string, IndexedDocument>} docId -> document */
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
 *
 * @param {string} text
 * @returns {string}
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
 *
 * @param {string} text
 * @param {number} [n=N]
 * @returns {Set<string>}
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
 *
 * @param {IndexedDocument} doc
 * @returns {Set<string>}
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
// Index Mutation Helpers
// ---------------------------------------------------------------------------

/**
 * Adds or replaces a document in the inverted index and document store.
 *
 * @param {IndexedDocument} doc
 */
const upsertDocumentIntoIndex = (doc) => {
    // If updating, first remove old n-grams for this doc
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
 *
 * @param {string} docId
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
 *
 * @param {Object} product
 * @returns {IndexedDocument}
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
 *
 * @param {Object} category
 * @returns {IndexedDocument}
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
 *
 * @returns {Promise<void>}
 */
const hydrateIndex = async () => {
    // If a rebuild is already in flight, wait for it
    if (hydrationPromise) {
        return hydrationPromise;
    }

    hydrationPromise = (async () => {
        const start = Date.now();

        // Clear existing state
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
 *
 * @returns {Promise<void>}
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
 *
 * @param {Object} item   — A Mongoose document (populated or lean)
 * @param {'product'|'category'} type
 * @returns {Promise<void>}
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
 *
 * @param {string} objectId
 * @returns {Promise<void>}
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
 *  - For each query n-gram, collect candidate document IDs
 *  - Count how many query n-grams matched each candidate (intersection size)
 *  - Rank by score DESC, then apply pagination
 *
 * @param {string} query
 * @param {{ limit?: number, page?: number }} [options]
 * @returns {Promise<{ hits: IndexedDocument[], total: number, page: number, totalPages: number }>}
 */
export const searchNgram = async (query, options = {}) => {
    await ensureHydrated();

    const limit = Math.min(options.limit || 10, MAX_HITS);
    const page = Math.max(options.page || 1, 1);

    if (!query || query.trim().length === 0) {
        return { hits: [], total: 0, page, totalPages: 0 };
    }

    const queryGrams = generateNgrams(query);

    // Score map: docId -> number of matching n-grams
    const scores = new Map();

    queryGrams.forEach((gram) => {
        const bucket = invertedIndex.get(gram);
        if (!bucket) return;
        bucket.forEach((docId) => {
            scores.set(docId, (scores.get(docId) || 0) + 1);
        });
    });

    if (scores.size === 0) {
        return { hits: [], total: 0, page, totalPages: 0 };
    }

    // Sort by score descending
    const ranked = [...scores.entries()]
        .sort((a, b) => b[1] - a[1])
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
 *
 * @returns {Promise<{ success: boolean, documents: number, ngrams: number, durationMs: number }>}
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
