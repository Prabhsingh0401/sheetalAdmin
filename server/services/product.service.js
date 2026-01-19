import Review from "../models/review.model.js";
import Product from "../models/product.model.js";
import SizeChart from "../models/sizechart.model.js";
import slugify from "slugify";
import { deleteFile } from "../utils/fileHelper.js";
import xlsx from "xlsx";

const parseJsonField = (field) => {
    if (typeof field === "string") {
        try {
            return JSON.parse(field);
        } catch (e) {
            return [];
        }
    }
    return field || [];
};

export const getAllProductsService = async (queryStr) => {
    const { page = 1, limit = 10, search, sort, category, status, color, brand } = queryStr;

    const skip = (Number(page) - 1) * Number(limit);

    let filter = {};

    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { sku: { $regex: search, $options: 'i' } }
        ];
    }

    if (category && category !== 'All') {
        filter.category = category;
    }

    if (brand && brand !== 'All') {
        filter.brand = brand;
    }

    if (status && status !== 'All') {
        filter.status = status;
    }

    if (color) {
        filter["variants.color.name"] = { $regex: color, $options: 'i' };
    }

    const [products, totalProducts] = await Promise.all([
        Product.find(filter).populate("category", "name slug").sort(sort || '-createdAt').skip(skip).limit(Number(limit)).lean(),
        Product.countDocuments(filter)
    ]);

    return {
        success: true,
        products,
        totalProducts,
        currentPage: Number(page),
        totalPages: Math.ceil(totalProducts / limit),
        resultsPerPage: Number(limit)
    };
};

export const getProductDetailsService = async (id) => {
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slug: id };
    const product = await Product.findOne(query)
        .populate("category", "name slug")
        .populate("sizeChart")
        .lean();
    return product ? { success: true, product } : { success: false, statusCode: 404 };
};

export const createProductService = async (data, files, userId) => {
    const parsedData = {
        ...data,
        variants: typeof data.variants === 'string' ? JSON.parse(data.variants) : data.variants,
        specifications: typeof data.specifications === 'string' ? JSON.parse(data.specifications) : data.specifications,
        keyBenefits: typeof data.keyBenefits === 'string' ? JSON.parse(data.keyBenefits) : data.keyBenefits,
        eventTags: typeof data.eventTags === 'string' ? JSON.parse(data.eventTags) : data.eventTags,
        displayCollections: typeof data.displayCollections === 'string' ? JSON.parse(data.displayCollections) : data.displayCollections,
    };

    if (parsedData.sizeChart === "null" || !parsedData.sizeChart) parsedData.sizeChart = null;
    if (parsedData.category === "null" || !parsedData.category) parsedData.category = null;
    if (parsedData.brand === "null" || !parsedData.brand) parsedData.brand = null;

    const mainImage = {
        url: files?.mainImage ? files.mainImage[0].path.replace(/\\/g, '/') : "",
        alt: data.mainImageAlt || `${parsedData.name} main image`
    };

    const hoverImage = {
        url: files?.hoverImage ? files.hoverImage[0].path.replace(/\\/g, '/') : "",
        alt: data.hoverImageAlt || `${parsedData.name} hover image`
    };

    const ogImage = files?.ogImage ? files.ogImage[0].path.replace(/\\/g, '/') : "";

    let galleryImages = [];
    if (files?.images) {
        galleryImages = files.images.map((file, index) => ({
            url: file.path.replace(/\\/g, '/'),
            alt: `${parsedData.name} gallery ${index + 1}`,
            isDefault: false
        }));
    }

    let totalStock = 0;
    if (parsedData.variants && Array.isArray(parsedData.variants)) {
        let variantFileIndex = 0;
        const uploadedVariantFiles = files?.variantImages || [];

        parsedData.variants = parsedData.variants.map((v) => {
            // Calculate stock for each variant based on its sizes
            const variantStock = v.sizes.reduce((sum, s) => sum + (s.stock || 0), 0);
            totalStock += variantStock; // Add to master stock

            if (v.hasNewImage === true && uploadedVariantFiles[variantFileIndex]) {
                const filePath = uploadedVariantFiles[variantFileIndex].path.replace(/\\/g, '/');
                variantFileIndex++;
                const { hasNewImage, ...rest } = v;
                return { ...rest, v_image: filePath };
            }
            const { hasNewImage, ...rest } = v;
            return rest;
        });
    }

    const product = await Product.create({
        ...parsedData,
        slug: slugify(parsedData.name || "product", { lower: true, strict: true }),
        mainImage,
        hoverImage,
        ogImage,
        images: galleryImages,
        video: files?.video ? files.video[0].path.replace(/\\/g, '/') : "",
        stock: totalStock, // Set master stock
        createdBy: userId
    });

    return { success: true, product };
};

export const updateProductService = async (id, data, files) => {
    const product = await Product.findById(id);
    if (!product) return { success: false, statusCode: 404, message: "Product not found" };

    const parsedData = {
        ...data,
        variants: typeof data.variants === 'string' ? JSON.parse(data.variants) : data.variants,
        specifications: typeof data.specifications === 'string' ? JSON.parse(data.specifications) : data.specifications,
        keyBenefits: typeof data.keyBenefits === 'string' ? JSON.parse(data.keyBenefits) : data.keyBenefits,
        displayCollections: typeof data.displayCollections === 'string' ? JSON.parse(data.displayCollections) : data.displayCollections,
        eventTags: typeof data.eventTags === 'string' ? JSON.parse(data.eventTags) : data.eventTags
    };

    if (parsedData.sizeChart === "null" || !parsedData.sizeChart) parsedData.sizeChart = null;
    if (parsedData.category === "null" || !parsedData.category) parsedData.category = null;
    if (parsedData.brand === "null" || !parsedData.brand) parsedData.brand = null;

    if (parsedData.name) {
        parsedData.slug = slugify(parsedData.name, { lower: true, strict: true });
    }

    if (files && files['mainImage']?.[0]) {
        parsedData.mainImage = {
            url: files['mainImage'][0].path.replace(/\\/g, '/'),
            alt: data.mainImageAlt || parsedData.name
        };
    } else if (data.mainImageAlt) {
        parsedData.mainImage = { ...product.mainImage, alt: data.mainImageAlt };
    }

    if (files && files['hoverImage']?.[0]) {
        parsedData.hoverImage = {
            url: files['hoverImage'][0].path.replace(/\\/g, '/'),
            alt: data.hoverImageAlt || parsedData.name
        };
    } else if (data.hoverImageAlt) {
        parsedData.hoverImage = { ...product.hoverImage, alt: data.hoverImageAlt };
    }

    if (files && files['video']?.[0]) {
        parsedData.video = files['video'][0].path.replace(/\\/g, '/');
    } else if (data.existingVideo) {
        parsedData.video = data.existingVideo;
    }

    if (files && files['ogImage']?.[0]) {
        parsedData.ogImage = files['ogImage'][0].path.replace(/\\/g, '/');
    } else if (data.existingOgImage) {
        parsedData.ogImage = data.existingOgImage;
    }

    let totalStock = 0;
    if (parsedData.variants && Array.isArray(parsedData.variants)) {
        let variantFileIndex = 0;
        const uploadedVariantFiles = files['variantImages'] || [];

        parsedData.variants = parsedData.variants.map((v) => {
            // Calculate stock for each variant based on its sizes
            const variantStock = v.sizes.reduce((sum, s) => sum + (s.stock || 0), 0);
            totalStock += variantStock; // Add to master stock

            if (v.hasNewImage === true && uploadedVariantFiles[variantFileIndex]) {
                const filePath = uploadedVariantFiles[variantFileIndex].path.replace(/\\/g, '/');
                variantFileIndex++;
                const { hasNewImage, ...rest } = v;
                return { ...rest, v_image: filePath };
            }
            const { hasNewImage, ...rest } = v;
            return rest;
        });
    }

    const existingImages = typeof data.existingImages === 'string'
        ? JSON.parse(data.existingImages)
        : (Array.isArray(data.existingImages) ? data.existingImages : (product.images || []));

    let newGalleryImages = [];
    if (files && files['images']) {
        newGalleryImages = files['images'].map((file, index) => ({
            url: file.path.replace(/\\/g, '/'),
            alt: `${parsedData.name} gallery ${existingImages.length + index + 1}`,
            isDefault: false
        }));
    }
    parsedData.images = [...existingImages, ...newGalleryImages];

    const updatedProduct = await Product.findByIdAndUpdate(
        id,
        { $set: { ...parsedData, stock: totalStock } },
        { new: true, runValidators: true }
    );

    return { success: true, product: updatedProduct };
};

export const deleteProductService = async (id) => {
    const product = await Product.findById(id);
    if (!product) return { success: false, statusCode: 404 };

    if (product.mainImage?.url) deleteFile(product.mainImage.url);
    if (product.hoverImage?.url) deleteFile(product.hoverImage.url);
    product.images?.forEach(img => deleteFile(img.url));

    await product.deleteOne();
    return { success: true };
};

export const getProductReviewsService = async (productId) => {
    const reviews = await Review.find({ product: productId, isApproved: true })
        .sort("-createdAt")
        .populate("user", "name profileImage");

    return reviews ? { success: true, reviews } : { success: false, statusCode: 404 };
};


export const bulkImportService = async (filePath, userId) => {
    const workbook = xlsx.readFile(filePath);
    const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

    const productsToInsert = rawData.map(item => ({
        ...item,
        sku: item.SKU?.toString().toUpperCase(),
        slug: slugify(item.Name || "product", { lower: true, strict: true }),
        createdBy: userId,
        status: "Active",
        price: Number(item.Price || 0),
        stock: Number(item.Stock || 0),
        category: item.CategoryId,
        sizeChart: item.SizeChartId || null
    }));

    const data = await Product.insertMany(productsToInsert);
    return { success: true, data };
};

export const addReviewService = async (productId, user, rating, comment) => {
    const product = await Product.findById(productId);
    if (!product) return { success: false, statusCode: 404 };

    const existingReview = await Review.findOne({ user: user._id, product: productId });
    if (existingReview) {
        return { success: false, statusCode: 400, message: "You have already reviewed this product" };
    }

    const newReview = await Review.create({
        user: user._id,
        product: productId,
        userName: user.name,
        rating: Number(rating),
        comment,
        isVerifiedPurchase: true
    });

    const reviews = await Review.find({ product: productId, isApproved: true });

    product.totalReviews = reviews.length;
    product.averageRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

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
                lowStock: { $sum: { $cond: [{ $and: [{ $gt: ["$stock", 0] }, { $lte: ["$stock", 10] }] }, 1, 0] } },
                outOfStock: { $sum: { $cond: [{ $eq: ["$stock", 0] }, 1, 0] } }
            }
        }
    ]);
    return { success: true, data: stats[0] || { total: 0, active: 0, inactive: 0, lowStock: 0, outOfStock: 0 } };
};

export const deleteReviewService = async (productId, reviewId) => {
    const review = await Review.findById(reviewId);
    if (!review) return { success: false, statusCode: 404 };

    await review.deleteOne();

    const reviews = await Review.find({ product: productId, isApproved: true });
    const product = await Product.findById(productId);

    if (product) {
        product.totalReviews = reviews.length;
        product.averageRating = reviews.length > 0
            ? reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length
            : 0;
        await product.save();
    }

    return { success: true };
};