import { searchNgram } from "./ngram.search.service.js";

/**
 * Searches products and categories using the custom n-gram index.
 *
 * Scoping behaviour:
 *  - If the top result is a CATEGORY → return that category first, then only
 *    return products whose `category` field (name string) matches that category's
 *    name. This gives "search sarees → saree products only" UX.
 *  - If the top result is a PRODUCT → return all results as-is (no scoping),
 *    since the user is looking for a specific item, not browsing a category.
 *
 * @param {{ query: string, limit: number, page: number }} params
 * @returns {Promise<Array<{ type: string, data: Object }>>}
 */
export const searchService = async ({ query, limit, page }) => {
  const result = await searchNgram(query, { limit, page });

  const hits = result.hits.map((hit) => ({
    type: hit.type,
    data: {
      ...hit,
      _id: hit.id,
    },
  }));

  if (hits.length === 0) return hits;

  const topHit = hits[0];

  // ── Category-scoped mode ────────────────────────────────────────────────────
  // Top result is a category → scope all product results to that category.
  if (topHit.type === "category") {
    const categoryName = normalise(topHit.data.name);

    const scoped = hits.filter((hit) => {
      // Always keep the matched category itself
      if (hit.type === "category") return true;

      // Keep products only if their category name matches the top category
      const productCategory = normalise(hit.data.category ?? "");
      return productCategory === categoryName;
    });

    return scoped;
  }

  // ── Product-scoped mode ─────────────────────────────────────────────────────
  // Top result is a product → scope remaining products to the same parent category
  // so the results stay contextually related. Categories are still shown.
  const parentCategory = normalise(topHit.data.category ?? "");

  if (!parentCategory) return hits; // no category info — return unfiltered

  const scoped = hits.filter((hit) => {
    if (hit.type === "category") return true;
    const productCategory = normalise(hit.data.category ?? "");
    return productCategory === parentCategory;
  });

  return scoped;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Lowercases and trims a string for case-insensitive comparison.
 * Mirrors the normalise() logic in ngram.search.service.js.
 */
const normalise = (text) => {
  if (!text || typeof text !== "string") return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};