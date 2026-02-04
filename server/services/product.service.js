import Review from "../models/review.model.js";
import Product from "../models/product.model.js";
import slugify from "slugify";
import { deleteFile, deleteS3File } from "../utils/fileHelper.js";
import { config } from "../config/config.js";
import xlsx from "xlsx";
import mongoose from "mongoose";

export const getAllProductsService = async (queryStr) => {
  const {
    page = 1,
    limit = 10,
    search,
    sort,
    category,
    subCategory,
    status,
    color,
    brand,
    wearType,
    occasion,
    tags,
  } = queryStr;

  const skip = (Number(page) - 1) * Number(limit);
  const lowStockThreshold = 5;

  let filter = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
    ];
  }

  if (category && category !== "All") {
    // Convert string to ObjectId for proper MongoDB comparison
    filter.category = new mongoose.Types.ObjectId(category);
  }

  if (subCategory && subCategory !== "All") {
    filter.subCategory = subCategory;
  }

  if (brand && brand !== "All") {
    filter.brand = brand;
  }

  if (status && status !== "All") {
    filter.status = status;
  }

  if (color) {
    filter["variants.color.name"] = { $regex: color, $options: "i" };
  }

  if (wearType) {
    filter.wearType = { $in: Array.isArray(wearType) ? wearType : [wearType] };
  }

  if (occasion) {
    filter.occasion = { $in: Array.isArray(occasion) ? occasion : [occasion] };
  }

  if (tags) {
    filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };
  }

  const pipeline = [
    { $match: filter },
    {
      $addFields: {
        lowStockVariantCount: {
          $size: {
            $filter: {
              input: "$variants",
              as: "variant",
              cond: {
                $anyElementTrue: {
                  $map: {
                    input: "$$variant.sizes",
                    as: "size",
                    in: {
                      $and: [
                        { $lte: ["$$size.stock", lowStockThreshold] },
                        { $gt: ["$$size.stock", 0] },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    {
      $addFields: {
        isLowStock: {
          $gt: ["$lowStockVariantCount", 0],
        },
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $unwind: {
        path: "$category",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $sort: sort || { createdAt: -1 },
    },
  ];

  const [result] = await Product.aggregate([
    {
      $facet: {
        products: [...pipeline, { $skip: skip }, { $limit: Number(limit) }],
        totalProducts: [{ $match: filter }, { $count: "count" }],
      },
    },
  ]);

  const products = result.products;
  const totalProducts = result.totalProducts[0]?.count || 0;

  return {
    success: true,
    products,
    totalProducts,
    currentPage: Number(page),
    totalPages: Math.ceil(totalProducts / limit),
    resultsPerPage: Number(limit),
  };
};

export const getNewArrivalsService = async () => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const products = await Product.find({
    isActive: true,
    createdAt: { $gte: sevenDaysAgo },
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("category", "name slug")
    .lean();

  return {
    success: true,
    products,
  };
};

export const getProductDetailsService = async (id) => {
  const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slug: id };
  const product = await Product.findOne(query)
    .populate("category", "name slug")
    .populate("sizeChart")
    .lean();
  return product
    ? { success: true, product }
    : { success: false, statusCode: 404 };
};

export const createProductService = async (data, files, userId) => {
  const parsedData = {
    ...data,
    variants:
      typeof data.variants === "string"
        ? JSON.parse(data.variants)
        : data.variants,
    specifications:
      typeof data.specifications === "string"
        ? JSON.parse(data.specifications)
        : data.specifications,
    keyBenefits:
      typeof data.keyBenefits === "string"
        ? JSON.parse(data.keyBenefits)
        : data.keyBenefits,
    eventTags:
      typeof data.eventTags === "string"
        ? JSON.parse(data.eventTags)
        : data.eventTags,
    displayCollections:
      typeof data.displayCollections === "string"
        ? JSON.parse(data.displayCollections)
        : data.displayCollections,
    wearType:
      typeof data.wearType === "string"
        ? JSON.parse(data.wearType)
        : data.wearType,
    occasion:
      typeof data.occasion === "string"
        ? JSON.parse(data.occasion)
        : data.occasion,
    tags:
      typeof data.tags === "string"
        ? JSON.parse(data.tags)
        : data.tags,
  };

  if (parsedData.sizeChart === "null" || !parsedData.sizeChart)
    parsedData.sizeChart = null;
  if (parsedData.category === "null" || !parsedData.category)
    parsedData.category = null;
  if (parsedData.subCategory === "null" || !parsedData.subCategory)
    parsedData.subCategory = null;
  if (parsedData.brand === "null" || !parsedData.brand) parsedData.brand = null;

  const mainImage = {
    url: files?.mainImage ? (files.mainImage[0].location || files.mainImage[0].path) : "",
    public_id: files?.mainImage ? (files.mainImage[0].key || files.mainImage[0].filename) : "",
    alt: data.mainImageAlt || `${parsedData.name} main image`,
  };

  const hoverImage = {
    url: files?.hoverImage ? (files.hoverImage[0].location || files.hoverImage[0].path) : "",
    public_id: files?.hoverImage ? (files.hoverImage[0].key || files.hoverImage[0].filename) : "",
    alt: data.hoverImageAlt || `${parsedData.name} hover image`,
  };

  const ogImage = files?.ogImage
    ? (files.ogImage[0].location || files.ogImage[0].path)
    : "";

  let galleryImages = [];
  if (files?.images) {
    galleryImages = files.images.map((file, index) => ({
      url: file.location || file.path,
      public_id: file.key || file.filename,
      alt: `${parsedData.name} gallery ${index + 1}`,
      isDefault: false,
    }));
  }

  let totalStock = 0;
  if (parsedData.variants && Array.isArray(parsedData.variants)) {
    let variantFileIndex = 0;
    const uploadedVariantFiles = files["variantImages"] || [];
    parsedData.variants = parsedData.variants.map((v) => {
      // Process sizes to ensure numerical types for stock, price, and discountPrice
      const processedSizes = v.sizes.map((s) => ({
        ...s,
        name: s.name, // Keep name as is
        stock: Number(s.stock || 0),
        price: Number(s.price || 0), // Explicitly convert to Number
        discountPrice: Number(s.discountPrice || 0), // Explicitly convert to Number
      }));

      // Calculate stock for each variant based on its processed sizes
      const variantStock = processedSizes.reduce(
        (sum, s) => sum + (s.stock || 0),
        0,
      );
      totalStock += variantStock; // Add to master stock

      if (v.hasNewImage === true && uploadedVariantFiles[variantFileIndex]) {
        const file = uploadedVariantFiles[variantFileIndex];
        const v_image = {
          url: file.location || file.path,
          public_id: file.key || file.filename,
        };
        variantFileIndex++;
        const { hasNewImage, ...rest } = v;
        return { ...rest, sizes: processedSizes, v_image: v_image };
      }

      const { hasNewImage, ...rest } = v;
      return { ...rest, sizes: processedSizes }; // Return variant with processed sizes
    });
  }

  const product = await Product.create({
    ...parsedData,
    slug: slugify(parsedData.name || "product", { lower: true, strict: true }),
    mainImage,
    hoverImage,
    ogImage,
    images: galleryImages,
    video: files?.video ? {
      url: files.video[0].location || files.video[0].path,
      public_id: files.video[0].key || files.video[0].filename
    } : null,
    stock: totalStock, // Set master stock
    createdBy: userId,
  });

  return { success: true, product };
};

export const updateProductService = async (id, data, files) => {
  const product = await Product.findById(id);
  if (!product)
    return { success: false, statusCode: 404, message: "Product not found" };

  const parsedData = {
    ...data,
    variants:
      typeof data.variants === "string"
        ? JSON.parse(data.variants)
        : data.variants,
    specifications:
      typeof data.specifications === "string"
        ? JSON.parse(data.specifications)
        : data.specifications,
    keyBenefits:
      typeof data.keyBenefits === "string"
        ? JSON.parse(data.keyBenefits)
        : data.keyBenefits,
    displayCollections:
      typeof data.displayCollections === "string"
        ? JSON.parse(data.displayCollections)
        : data.displayCollections,
    eventTags:
      typeof data.eventTags === "string"
        ? JSON.parse(data.eventTags)
        : data.eventTags,
    wearType:
      typeof data.wearType === "string"
        ? JSON.parse(data.wearType)
        : data.wearType,
    occasion:
      typeof data.occasion === "string"
        ? JSON.parse(data.occasion)
        : data.occasion,
    tags:
      typeof data.tags === "string"
        ? JSON.parse(data.tags)
        : data.tags,
  };

  if (parsedData.sizeChart === "null" || !parsedData.sizeChart)
    parsedData.sizeChart = null;
  if (parsedData.category === "null" || !parsedData.category)
    parsedData.category = null;
  if (parsedData.subCategory === "null" || !parsedData.subCategory)
    parsedData.subCategory = null;
  if (parsedData.brand === "null" || !parsedData.brand) parsedData.brand = null;

  if (parsedData.name) {
    parsedData.slug = slugify(parsedData.name, { lower: true, strict: true });
  }

  if (files && files["mainImage"]?.[0]) {
    // Delete old
    if (product.mainImage?.public_id) await deleteS3File(product.mainImage.public_id);
    else if (product.mainImage?.url && !product.mainImage.url.startsWith("http")) await deleteFile(product.mainImage.url);

    parsedData.mainImage = {
      url: files["mainImage"][0].location || files["mainImage"][0].path,
      public_id: files["mainImage"][0].key || files["mainImage"][0].filename,
      alt: data.mainImageAlt || parsedData.name,
    };
  } else if (data.mainImageAlt) {
    parsedData.mainImage = { ...product.mainImage, alt: data.mainImageAlt };
  }

  if (files && files["hoverImage"]?.[0]) {
    // Delete old
    if (product.hoverImage?.public_id) await deleteS3File(product.hoverImage.public_id);
    else if (product.hoverImage?.url && !product.hoverImage.url.startsWith("http")) await deleteFile(product.hoverImage.url);

    parsedData.hoverImage = {
      url: files["hoverImage"][0].location || files["hoverImage"][0].path,
      public_id: files["hoverImage"][0].key || files["hoverImage"][0].filename,
      alt: data.hoverImageAlt || parsedData.name,
    };
  } else if (data.hoverImageAlt) {
    parsedData.hoverImage = { ...product.hoverImage, alt: data.hoverImageAlt };
  }

  if (files && files["video"]?.[0]) {
    if (product.video?.public_id) await deleteS3File(product.video.public_id);
    else if (product.video?.url && !product.video.url.startsWith("http")) await deleteFile(product.video.url);

    parsedData.video = {
      url: files["video"][0].location || files["video"][0].path,
      public_id: files["video"][0].key || files["video"][0].filename
    };
  } else if (data.existingVideo) {
    // Keep existing
  }

  if (files && files["ogImage"]?.[0]) {
    parsedData.ogImage = files["ogImage"][0].location || files["ogImage"][0].path;
  } else if (data.existingOgImage) {
    parsedData.ogImage = data.existingOgImage;
  }

  let totalStock = 0;
  if (parsedData.variants && Array.isArray(parsedData.variants)) {
    let variantFileIndex = 0;
    const uploadedVariantFiles = files["variantImages"] || [];

    parsedData.variants = parsedData.variants.map((v) => {
      // Process sizes to ensure numerical types for stock, price, and discountPrice
      const processedSizes = v.sizes.map((s) => ({
        ...s,
        name: s.name, // Keep name as is
        stock: Number(s.stock || 0),
        price: Number(s.price || 0), // Explicitly convert to Number
        discountPrice: Number(s.discountPrice || 0), // Explicitly convert to Number
      }));

      // Calculate stock for each variant based on its processed sizes
      const variantStock = processedSizes.reduce(
        (sum, s) => sum + (s.stock || 0),
        0,
      );
      totalStock += variantStock; // Add to master stock

      if (v.hasNewImage === true && uploadedVariantFiles[variantFileIndex]) {
        const file = uploadedVariantFiles[variantFileIndex];
        const v_image = {
          url: file.location || file.path,
          public_id: file.key || file.filename,
        };
        variantFileIndex++;
        const { hasNewImage, ...rest } = v;
        return { ...rest, sizes: processedSizes, v_image: v_image };
      }

      const { hasNewImage, ...rest } = v;
      return { ...rest, sizes: processedSizes }; // Return variant with processed sizes
    });
  }

  const existingImages =
    typeof data.existingImages === "string"
      ? JSON.parse(data.existingImages)
      : Array.isArray(data.existingImages)
        ? data.existingImages
        : product.images || [];

  let newGalleryImages = [];
  if (files && files["images"]) {
    newGalleryImages = files["images"].map((file, index) => ({
      url: file.location || file.path,
      public_id: file.key || file.filename,
      alt: `${parsedData.name} gallery ${existingImages.length + index + 1}`,
      isDefault: false,
    }));
  }
  parsedData.images = [...existingImages, ...newGalleryImages];

  const updatedProduct = await Product.findByIdAndUpdate(
    id,
    { $set: { ...parsedData, stock: totalStock } },
    { new: true, runValidators: true },
  );

  return { success: true, product: updatedProduct };
};

export const deleteProductService = async (id) => {
  const product = await Product.findById(id);
  if (!product) return { success: false, statusCode: 404 };

  if (product.mainImage?.public_id) await deleteS3File(product.mainImage.public_id);
  else if (product.mainImage?.url && !product.mainImage.url.startsWith("http")) await deleteFile(product.mainImage.url);

  if (product.hoverImage?.public_id) await deleteS3File(product.hoverImage.public_id);
  else if (product.hoverImage?.url && !product.hoverImage.url.startsWith("http")) await deleteFile(product.hoverImage.url);

  if (product.images) {
    for (const img of product.images) {
      if (img.public_id) await deleteS3File(img.public_id);
      else if (img.url && !img.url.startsWith("http")) await deleteFile(img.url);
    }
  }

  if (product.video?.public_id) await deleteS3File(product.video.public_id);
  else if (product.video?.url && !product.video.url.startsWith("http")) await deleteFile(product.video.url);

  await product.deleteOne();
  return { success: true };
};

export const getLowStockProductsService = async () => {
  const lowStockThreshold = 5;

  const lowStockProducts = await Product.aggregate([
    {
      $unwind: "$variants",
    },
    {
      $unwind: "$variants.sizes",
    },
    {
      $match: {
        "variants.sizes.stock": { $lte: lowStockThreshold, $gt: 0 },
      },
    },
    {

      $group: {
        _id: {
          productId: "$_id",
          name: "$name",
          color: "$variants.color.name",
          v_sku: "$variants.v_sku",
        },
        mainImage: { $first: "$mainImage" },
        sizes: {
          $push: {
            name: "$variants.sizes.name",
            stock: "$variants.sizes.stock",
          },
        },
      },
    },
    {
      $group: {
        _id: "$_id.productId",
        name: { $first: "$_id.name" },
        mainImage: { $first: "$mainImage" },
        lowStockVariants: {
          $push: {
            color: "$_id.color",
            v_sku: "$_id.v_sku",
            sizes: "$sizes",
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        mainImage: 1,
        lowStockVariants: 1,
      },
    },
  ]);

  return { success: true, data: lowStockProducts };
};

export const getProductReviewsService = async (productId) => {
  const reviews = await Review.find({ product: productId, isApproved: true })
    .sort("-createdAt")
    .populate("user", "name profileImage");

  return reviews
    ? { success: true, reviews }
    : { success: false, statusCode: 404 };
};

export const bulkImportService = async (filePath, userId) => {
  const workbook = xlsx.readFile(filePath);
  const rawData = xlsx.utils.sheet_to_json(
    workbook.Sheets[workbook.SheetNames[0]],
  );

  const productsToInsert = rawData.map((item) => ({
    ...item,
    sku: item.SKU?.toString().toUpperCase(),
    slug: slugify(item.Name || "product", { lower: true, strict: true }),
    createdBy: userId,
    status: "Active",
    price: Number(item.Price || 0),
    stock: Number(item.Stock || 0),
    category: item.CategoryId,
    sizeChart: item.SizeChartId || null,
  }));

  const data = await Product.insertMany(productsToInsert);
  return { success: true, data };
};

export const addReviewService = async (productId, user, rating, comment) => {
  const product = await Product.findById(productId);
  if (!product) return { success: false, statusCode: 404 };

  const existingReview = await Review.findOne({
    user: user._id,
    product: productId,
  });
  if (existingReview) {
    return {
      success: false,
      statusCode: 400,
      message: "You have already reviewed this product",
    };
  }

  const newReview = await Review.create({
    user: user._id,
    product: productId,
    userName: user.name,
    rating: Number(rating),
    comment,
    isVerifiedPurchase: true,
  });

  const reviews = await Review.find({ product: productId, isApproved: true });

  product.totalReviews = reviews.length;
  product.averageRating =
    reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

  await product.save();

  return { success: true, review: newReview };
};

export const getProductStatsService = async () => {
  const stats = await Product.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] } },
        inactive: { $sum: { $cond: [{ $eq: ["$status", "Inactive"] }, 1, 0] } },
        lowStock: {
          $sum: {
            $cond: [
              { $and: [{ $gt: ["$stock", 0] }, { $lte: ["$stock", 10] }] },
              1,
              0,
            ],
          },
        },
        outOfStock: { $sum: { $cond: [{ $eq: ["$stock", 0] }, 1, 0] } },
      },
    },
  ]);
  return {
    success: true,
    data: stats[0] || {
      total: 0,
      active: 0,
      inactive: 0,
      lowStock: 0,
      outOfStock: 0,
    },
  };
};

export const deleteReviewService = async (productId, reviewId) => {
  const review = await Review.findById(reviewId);
  if (!review) return { success: false, statusCode: 404 };

  await review.deleteOne();

  const reviews = await Review.find({ product: productId, isApproved: true });
  const product = await Product.findById(productId);

  if (product) {
    product.totalReviews = reviews.length;
    product.averageRating =
      reviews.length > 0
        ? reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length
        : 0;
    await product.save();
  }

  return { success: true };
};