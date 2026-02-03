import Category from "../models/category.model.js";
import Product from "../models/product.model.js";
import slugify from "slugify";
import fs from "fs";
import { config } from "../config/config.js";

export const createCategoryService = async (data, files) => {
  const {
    name,
    description,
    parentCategory,
    isFeatured,
    metaTitle,
    metaDescription,
    status,
    categoryBanner,
  } = data;

  if (!name) return { success: false, message: "Category name is required" };

  const exists = await Category.findOne({ name });
  if (exists) return { success: false, message: "Category already exists" };

  const slug = slugify(name, { lower: true });

  const newCategoryData = {
    name,
    slug,
    description,
    parentCategory: parentCategory || null,
    isFeatured: isFeatured === "true" || isFeatured === true,
    status: status || "Active",
    isActive: status === "Active",
    metaTitle,
    metaDescription,
    categoryBanner,
  };

  if (files && files.mainImage) {
    newCategoryData.mainImage = {
      url: files.mainImage[0].path,
      public_id: files.mainImage[0].filename,
    };
  }
  if (files && files.bannerImage) {
    newCategoryData.bannerImage = {
      url: files.bannerImage[0].path,
      public_id: files.bannerImage[0].filename,
    };
  }

  const newCategory = await Category.create(newCategoryData);

  return {
    success: true,
    data: newCategory,
    message: "Category created successfully",
  };
};

export const getAllCategoriesService = async () => {
  const categories = await Category.find({ isActive: true })
    .select("name slug mainImage bannerImage parentCategory")
    .populate("parentCategory", "name")
    .sort({ order: 1 });

  const categoriesWithFullUrls = categories.map((category) => {
    const data = category.toObject();
    if (data.mainImage && data.mainImage.url) {
      data.mainImage.url = `${config.baseUrl}/${data.mainImage.url.replace(/\\/g, "/")}`;
    }
    if (data.bannerImage && data.bannerImage.url) {
      data.bannerImage.url = `${config.baseUrl}/${data.bannerImage.url.replace(/\\/g, "/")}`;
    }
    return data;
  });

  return { success: true, data: categoriesWithFullUrls };
};

export const reorderCategoriesService = async (orderedIds) => {
  try {
    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order: index + 1 } },
      },
    }));

    if (bulkOps.length === 0) {
      return { success: true, message: "No categories to reorder." };
    }

    await Category.bulkWrite(bulkOps);
    return { success: true, message: "Categories reordered successfully." };
  } catch (error) {
    console.error("Error reordering categories:", error);
    return {
      success: false,
      statusCode: 500,
      message: "An error occurred while reordering categories.",
    };
  }
};

export const getCategoryBySlugService = async (slug) => {
  const category = await Category.findOne({ slug, isActive: true }).populate(
    "parentCategory",
    "name",
  );

  if (!category) return { success: false, message: "Category not found" };

  return { success: true, data: category };
};

export const getAdminCategoriesService = async ({ page, limit, search }) => {
  const query = search ? { name: { $regex: search, $options: "i" } } : {};

  const total = await Category.countDocuments(query);
  const categories = await Category.find(query)
    .populate("parentCategory", "name")
    .sort({ order: 1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    success: true,
    data: {
      categories,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    },
  };
};

export const getCategoryStatsService = async () => {
  const total = await Category.countDocuments();
  const active = await Category.countDocuments({ status: "Active" });
  const inactive = await Category.countDocuments({ status: "Inactive" });

  const linkedProducts = await Product.countDocuments({
    category: { $exists: true, $ne: null },
  });

  return {
    success: true,
    data: { total, active, inactive, products: linkedProducts },
  };
};

export const updateCategoryService = async (id, data, files) => {
  const category = await Category.findById(id);
  if (!category) return { success: false, message: "Category not found" };

  let parentId = data.parentCategory;
  if (
    !parentId ||
    parentId === "" ||
    parentId === "null" ||
    parentId === "undefined"
  ) {
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
    isActive: data.status === "Active",
    categoryBanner: data.categoryBanner,
    metaTitle: data.metaTitle,
    metaDescription: data.metaDescription,
  };

  if (data.name) {
    updateData.slug = slugify(data.name, { lower: true });
  }

  if (data.isFeatured !== undefined) {
    updateData.isFeatured =
      data.isFeatured === "true" || data.isFeatured === true;
  }

  if (files && files.mainImage) {
    if (category.mainImage?.url && fs.existsSync(category.mainImage.url)) {
      try {
        fs.unlinkSync(category.mainImage.url);
      } catch (e) {
        console.error("File deletion error for mainImage");
      }
    }
    updateData.mainImage = {
      url: files.mainImage[0].path,
      public_id: files.mainImage[0].filename,
    };
  }

  if (files && files.bannerImage) {
    if (category.bannerImage?.url && fs.existsSync(category.bannerImage.url)) {
      try {
        fs.unlinkSync(category.bannerImage.url);
      } catch (e) {
        console.error("File deletion error for bannerImage");
      }
    }
    updateData.bannerImage = {
      url: files.bannerImage[0].path,
      public_id: files.bannerImage[0].filename,
    };
  }

  const updated = await Category.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true },
  );

  return {
    success: true,
    data: updated,
    message: "Category updated successfully",
  };
};

export const deleteCategoryService = async (id) => {
  const category = await Category.findById(id);
  if (!category) return { success: false, message: "Category not found" };

  const hasSubCategories = await Category.findOne({ parentCategory: id });
  if (hasSubCategories) {
    return {
      success: false,
      message: "Cannot delete category with existing sub-categories",
    };
  }

  const productsCount = await Product.countDocuments({ category: id });
  if (productsCount > 0) {
    return {
      success: false,
      message: "Cannot delete category linked to active products",
    };
  }

  // Delete main image if it exists
  if (category.mainImage?.url && fs.existsSync(category.mainImage.url)) {
    try {
      fs.unlinkSync(category.mainImage.url);
    } catch (e) {
      console.error("Main image deletion error:", e);
    }
  }

  // Delete banner image if it exists
  if (category.bannerImage?.url && fs.existsSync(category.bannerImage.url)) {
    try {
      fs.unlinkSync(category.bannerImage.url);
    } catch (e) {
      console.error("Banner image deletion error:", e);
    }
  }

  await category.deleteOne();
  return { success: true, message: "Category deleted successfully" };
};
