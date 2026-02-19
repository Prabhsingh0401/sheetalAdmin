import { searchNgram } from "./ngram.search.service.js";

/**
 * Searches products and categories using the custom n-gram index.
 *
 * @param {{ query: string, limit: number, page: number }} params
 * @returns {Promise<Array<{ type: string, data: Object }>>}
 */
export const searchService = async ({ query, limit, page }) => {
  const result = await searchNgram(query, { limit, page });

  return result.hits.map((hit) => ({
    type: hit.type,
    data: {
      ...hit,
      _id: hit.id, // Map id back to _id for frontend compatibility
    },
  }));
};
