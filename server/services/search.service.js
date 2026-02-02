import Product from "../models/product.model.js";
import Category from "../models/category.model.js";

export const searchService = async ({ query, limit, page }) => {
    const skip = (page - 1) * limit;
    const searchRegex = new RegExp(query, 'i');

    const productPromise = Product.find({
        $or: [
            { name: { $regex: searchRegex } },
            { sku: { $regex: searchRegex } }
        ]
    })
    .skip(skip)
    .limit(limit)
    .populate("category")
    .lean()
    .exec();

    const categoryPromise = Category.find({ name: { $regex: query, $options: "i" } })
    .skip(skip)
    .limit(limit)
    .lean()
    .exec();

    const [products, categories] = await Promise.all([productPromise, categoryPromise]);

    const formattedProducts = products.map(product => ({ type: "product", data: product }));
    const formattedCategories = categories.map(category => ({ type: "category", data: category }));

    const combinedResults = [...formattedProducts, ...formattedCategories];
    
    return combinedResults;
};
