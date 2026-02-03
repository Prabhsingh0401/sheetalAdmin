import fs from "fs";
import slugify from "slugify";
import Blog from "../models/blog.model.js";

export const createBlogService = async (data, files, userId) => {
  const clearFiles = () => {
    if (!files) return;
    for (const key in files) {
      if (Array.isArray(files[key])) {
        files[key].forEach((file) => fs.unlinkSync(file.path));
      }
    }
  };

  try {
    const {
      title,
      content,
      category,
      tags,
      relatedProducts,
      status,
      isPublished,
    } = data;

    const bannerImageFile = files?.bannerImage?.[0];

    if (!title || !content || !category || !bannerImageFile) {
      clearFiles();
      return {
        success: false,
        message: "Title, Content, Category and Banner Image are required",
      };
    }

    const slug = slugify(title, { lower: true, strict: true });
    const excerpt =
      data.excerpt || content.substring(0, 160).replace(/<[^>]*>/g, "") + "...";

    const tagsArray = tags
      ? Array.isArray(tags)
        ? tags
        : tags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t !== "")
      : [];
    const productsArray = relatedProducts
      ? Array.isArray(relatedProducts)
        ? relatedProducts
        : []
      : [];

    const blog = await Blog.create({
      ...data,
      slug,
      excerpt,
      author: userId,
      bannerImage: bannerImageFile.path,
      contentImage: files?.contentImage?.[0]?.path || "",
      tags: tagsArray,
      relatedProducts: productsArray,
      status: status || "Active",
      isPublished: isPublished === "true" || isPublished === true,
      metaTitle: data.metaTitle || title,
    });

    return { success: true, data: blog };
  } catch (err) {
    clearFiles();
    if (err.code === 11000)
      return { success: false, message: "Blog title/slug already exists" };
    return { success: false, message: err.message };
  }
};

export const updateBlogService = async (id, data, files) => {
  const clearFiles = () => {
    if (!files) return;
    for (const key in files) {
      if (Array.isArray(files[key])) {
        files[key].forEach((file) => fs.unlinkSync(file.path));
      }
    }
  };

  try {
    const existingBlog = await Blog.findById(id);
    if (!existingBlog) {
      clearFiles();
      return { success: false, message: "Blog not found" };
    }

    let updateData = { ...data };

    if (data.title) {
      updateData.slug = slugify(data.title, { lower: true, strict: true });
    }

    if (data.tags) {
      updateData.tags =
        typeof data.tags === "string"
          ? data.tags
              .split(",")
              .map((t) => t.trim())
              .filter((t) => t !== "")
          : data.tags;
    }

    if (files?.bannerImage?.[0]) {
      if (existingBlog.bannerImage && fs.existsSync(existingBlog.bannerImage)) {
        fs.unlinkSync(existingBlog.bannerImage);
      }
      updateData.bannerImage = files.bannerImage[0].path;
    }

    if (files?.contentImage?.[0]) {
      if (
        existingBlog.contentImage &&
        fs.existsSync(existingBlog.contentImage)
      ) {
        fs.unlinkSync(existingBlog.contentImage);
      }
      updateData.contentImage = files.contentImage[0].path;
    }

    if (data.isPublished !== undefined) {
      updateData.isPublished =
        data.isPublished === "true" || data.isPublished === true;
    }

    const updatedBlog = await Blog.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    return { success: true, data: updatedBlog };
  } catch (err) {
    clearFiles();
    return { success: false, message: err.message };
  }
};

export const getAllBlogsService = async (query) => {
  const {
    page = 1,
    limit = 10,
    search,
    category,
    isPublished,
    status,
    isAdmin,
  } = query;
  const skip = (Number(page) - 1) * Number(limit);

  let filter = {};
  if (!isAdmin) {
    filter.status = "Active";
    // filter.isPublished = true; // Temporarily removed to show active but unpublished blogs
  } else {
    if (category) filter.category = category;
    if (status && status !== "All") filter.status = status;
    if (isPublished !== undefined) filter.isPublished = isPublished === "true";
  }

  if (search) filter.$text = { $search: search };

  try {
    const blogs = await Blog.find(filter)
      .populate("author", "name")
      .populate("relatedProducts", "name price image")
      .sort(search ? { score: { $meta: "textScore" } } : "-createdAt")
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Blog.countDocuments(filter);
    return {
      success: true,
      blogs,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
};

export const deleteBlogService = async (id) => {
  try {
    const blog = await Blog.findById(id);
    if (!blog) return { success: false, message: "Blog post not found" };

    if (blog.bannerImage && fs.existsSync(blog.bannerImage)) {
      fs.unlinkSync(blog.bannerImage);
    }
    if (blog.contentImage && fs.existsSync(blog.contentImage)) {
      fs.unlinkSync(blog.contentImage);
    }

    await blog.deleteOne();
    return { success: true, message: "Blog post deleted successfully" };
  } catch (err) {
    return { success: false, message: err.message };
  }
};

export const getBlogStatsService = async () => {
  try {
    const total = await Blog.countDocuments();
    const active = await Blog.countDocuments({ status: "Active" });
    const inactive = await Blog.countDocuments({ status: "Inactive" });
    const published = await Blog.countDocuments({ isPublished: true });

    return {
      success: true,
      data: { total, active, inactive, published },
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
};

export const getBlogBySlugService = async (slug) => {
  try {
    const blog = await Blog.findOneAndUpdate(
      { slug, status: "Active" },
      { $inc: { views: 1 } },
      { new: true },
    )
      .populate("author", "name")
      .populate("relatedProducts");
    if (!blog) return { success: false, message: "Blog post not found" };
    return { success: true, data: blog };
  } catch (err) {
    return { success: false, message: err.message };
  }
};
