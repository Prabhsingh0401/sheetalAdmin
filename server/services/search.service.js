import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import { searchAlgolia } from "./algolia.service.js";
import dotenv from "dotenv";

dotenv.config();

export const searchService = async ({ query, limit, page }) => {
  // Use Algolia if configured
  if (process.env.ALGOLIA_APP_ID && process.env.ALGOLIA_ADMIN_API_KEY) {
    try {
      const algoliaResult = await searchAlgolia(query, { limit, page });

      return algoliaResult.hits.map(hit => ({
        type: hit.type,
        data: {
          ...hit,
          _id: hit.objectID, // Map objectID back to _id for frontend compatibility
        }
      }));
    } catch (error) {
      console.error("Algolia search failed, falling back to MongoDB:", error);
      // Fallback to Mongo below
    }
  }

  // MongoDB Fallback Implementation
  const skip = (page - 1) * limit;
  const searchRegex = new RegExp(query, "i");

  const productPromise = Product.find({
    $or: [{ name: { $regex: searchRegex } }, { sku: { $regex: searchRegex } }],
  })
    .skip(skip)
    .limit(limit)
    .populate("category")
    .lean()
    .exec();

  const categoryPromise = Category.find({
    name: { $regex: query, $options: "i" },
  })
    .skip(skip)
    .limit(limit)
    .lean()
    .exec();

  const [products, categories] = await Promise.all([
    productPromise,
    categoryPromise,
  ]);

  const formattedProducts = products.map((product) => ({
    type: "product",
    data: product,
  }));
  const formattedCategories = categories.map((category) => ({
    type: "category",
    data: category,
  }));

  const combinedResults = [...formattedProducts, ...formattedCategories];

  return combinedResults;
};

