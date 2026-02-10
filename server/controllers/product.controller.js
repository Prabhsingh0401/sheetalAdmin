import * as productService from "../services/product.service.js";
import successResponse from "../utils/successResponse.js";
import ErrorResponse from "../utils/ErrorResponse.js";
import { deleteFile, deleteS3File } from "../utils/fileHelper.js";

const clearFiles = async (files) => {
  if (!files) return;

  try {
    const filesToClear = Array.isArray(files)
      ? files
      : Object.values(files).flat();

    await Promise.all(
      filesToClear.map(async (file) => {
        if (file.key) {
          await deleteS3File(file.key);
        } else if (file.path) {
          await deleteFile(file.path);
        }
      }),
    );
  } catch (error) {
    console.error("ClearFiles Error:", error);
  }
};

export const getAllProducts = async (req, res, next) => {
  try {
    const result = await productService.getAllProductsService(req.query);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getNewArrivals = async (req, res, next) => {
  try {
    const result = await productService.getNewArrivalsService();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getProductDetails = async (req, res, next) => {
  try {
    const result = await productService.getProductDetailsService(req.params.id);
    if (!result.success) return res.status(result.statusCode).json(result);
    return successResponse(res, 200, result.product, "Fetched");
  } catch (error) {
    next(error);
  }
};

export const getProductReviews = async (req, res, next) => {
  try {
    const result = await productService.getProductReviewsService(req.query.id);
    if (!result.success) return res.status(result.statusCode).json(result);
    return successResponse(res, 200, result.reviews, "Reviews fetched");
  } catch (error) {
    next(error);
  }
};

export const createProductReview = async (req, res, next) => {
  try {
    const { rating, comment, productId } = req.body;
    const result = await productService.addReviewService(
      productId,
      req.user,
      rating,
      comment,
    );
    if (!result.success) return res.status(result.statusCode).json(result);
    return successResponse(res, 200, null, "Review added");
  } catch (error) {
    next(error);
  }
};

export const getProductStats = async (req, res, next) => {
  try {
    const result = await productService.getProductStatsService();
    return successResponse(res, 200, result.data, "Stats fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const bulkImportProducts = async (req, res, next) => {
  try {
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "Excel file is required" });

    const result = await productService.bulkImportService(
      req.file.path,
      req.user._id,
    );
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    return successResponse(
      res,
      200,
      result.data,
      "Bulk products imported successfully",
    );
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    if (req.files) {
      const allFiles = Object.values(req.files).flat();

      for (const file of allFiles) {
        const isVideo =
          file.fieldname === "video" || file.mimetype.startsWith("video/");
        const limit = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;

        if (file.size > limit) {
          clearFiles(req.files);
          return next(
            ErrorResponse(
              `${file.fieldname} (${file.originalname}) size exceeds the ${isVideo ? "50MB" : "5MB"} limit.`,
              400,
            ),
          );
        }
      }
    }

    const result = await productService.createProductService(
      req.body,
      req.files,
      req.user._id,
    );
    if (!result.success) {
      clearFiles(req.files);
      return res.status(result.statusCode).json(result);
    }
    return successResponse(res, 201, result.product, "Product created");
  } catch (error) {
    clearFiles(req.files);
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const result = await productService.updateProductService(
      req.params.id,
      req.body,
      req.files,
    );
    if (!result.success) {
      clearFiles(req.files);
      return res.status(result.statusCode).json(result);
    }
    return successResponse(res, 200, result.product, "Product updated");
  } catch (error) {
    clearFiles(req.files);
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const result = await productService.deleteProductService(req.params.id);
    if (!result.success) return res.status(result.statusCode).json(result);
    return successResponse(res, 200, null, "Product deleted");
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const result = await productService.deleteReviewService(
      req.query.productId,
      req.query.id,
    );

    if (!result.success) return res.status(result.statusCode).json(result);

    return successResponse(res, 200, null, "Review deleted");
  } catch (error) {
    next(error);
  }
};

export const getLowStockProducts = async (req, res, next) => {
  try {
    const result = await productService.getLowStockProductsService();

    return successResponse(
      res,
      200,
      result.data,
      "Low stock products fetched successfully",
    );
  } catch (error) {
    next(error);
  }
};

export const getTrendingProducts = async (req, res, next) => {
  try {
    const result = await productService.getTrendingProductsService();
    return successResponse(res, 200, result.products, "Trending products fetched");
  } catch (error) {
    next(error);
  }
};

export const incrementViewCount = async (req, res, next) => {
  try {
    const result = await productService.incrementViewCountService(req.params.id);
    if (!result.success) return res.status(result.statusCode).json(result);
    return successResponse(res, 200, null, "View count incremented");
  } catch (error) {
    next(error);
  }
};
