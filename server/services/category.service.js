import Category from "../models/category.model.js";
import Product from "../models/product.model.js";
import slugify from "slugify";
import fs from "fs";

export const createCategoryService = async (data, file) => {
    const { name, description, parentCategory, isFeatured, metaTitle, metaDescription, status } = data;

    if (!name) return { success: false, message: "Category name is required" };

    const exists = await Category.findOne({ name });
    if (exists) return { success: false, message: "Category already exists" };

    const slug = slugify(name, { lower: true });

    const newCategory = await Category.create({
        name,
        slug,
        description,
        parentCategory: parentCategory || null,
        isFeatured: isFeatured === 'true' || isFeatured === true,
        status: status || "Active",
        isActive: status === "Active",
        metaTitle,
        metaDescription,
        image: file ? { url: file.path, public_id: file.filename } : null,
    });

    return { success: true, data: newCategory, message: "Category created successfully" };
};

export const getAllCategoriesService = async () => {
    const categories = await Category.find({ isActive: true })
        .select("name slug image parentCategory")
        .populate("parentCategory", "name")
        .sort({ createdAt: -1 });

    return { success: true, data: categories };
};

export const getAdminCategoriesService = async ({ page, limit, search }) => {
    const query = search ? { name: { $regex: search, $options: "i" } } : {};

    const total = await Category.countDocuments(query);
    const categories = await Category.find(query)
        .populate("parentCategory", "name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    return {
        success: true,
        data: {
            categories,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        }
    };
};


export const getCategoryStatsService = async () => {
    const total = await Category.countDocuments();
    const active = await Category.countDocuments({ status: "Active" });
    const inactive = await Category.countDocuments({ status: "Inactive" });

    const linkedProducts = await Product.countDocuments({ category: { $exists: true, $ne: null } });

    return {
        success: true,
        data: { total, active, inactive, products: linkedProducts }
    };
};

export const updateCategoryService = async (id, data, file) => {
    const category = await Category.findById(id);
    if (!category) return { success: false, message: "Category not found" };

    let parentId = data.parentCategory;
    if (!parentId || parentId === "" || parentId === "null" || parentId === "undefined") {
        parentId = null;
    }

    if (parentId && parentId.toString() === id.toString()) {
        return { success: false, message: "Category cannot be its own parent" };
    }

    const updateData = {
        name: data.name,
        description: data.description,
        parentCategory: parentId,
        status: data.status,
        isActive: data.status === "Active"
    };

    if (data.name) {
        updateData.slug = slugify(data.name, { lower: true });
    }

    if (data.isFeatured !== undefined) {
        updateData.isFeatured = data.isFeatured === "true" || data.isFeatured === true;
    }

    if (file) {
        if (category.image?.url && fs.existsSync(category.image.url)) {
            try { fs.unlinkSync(category.image.url); } catch (e) { console.error("File deletion error"); }
        }
        updateData.image = {
            url: file.path,
            public_id: file.filename,
        };
    }

    const updated = await Category.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
    );

    return { success: true, data: updated, message: "Category updated successfully" };
};

export const deleteCategoryService = async (id) => {
    const category = await Category.findById(id);
    if (!category) return { success: false, message: "Category not found" };

    const hasSubCategories = await Category.findOne({ parentCategory: id });
    if (hasSubCategories) {
        return { success: false, message: "Cannot delete category with existing sub-categories" };
    }

    const productsCount = await Product.countDocuments({ category: id });
    if (productsCount > 0) {
        return { success: false, message: "Cannot delete category linked to active products" };
    }

    if (category.image?.url && fs.existsSync(category.image.url)) {
        try { fs.unlinkSync(category.image.url); } catch (e) { }
    }

    await category.deleteOne();
    return { success: true, message: "Category deleted successfully" };
};