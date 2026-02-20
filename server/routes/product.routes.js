import express from "express";
import {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
  createProductReview,
  getProductReviews,
  deleteReview,
  getProductDetails,
  getProductStats,
  bulkImportProducts,
  getNewArrivals,
  getLowStockProducts,
  getTrendingProducts,
  incrementViewCount,
  getSampleExcel,
  checkCanReview,
  getAllReviews,
  updateReviewStatus,
} from "../controllers/product.controller.js";

import { isAuthenticated, isAdmin } from "../middlewares/auth.middleware.js";
import { uploadTo } from "../middlewares/multer.middleware.js";

const router = express.Router();

// public routes
router.get("/", getAllProducts);
router.get("/all", getAllProducts);
router.get("/new-arrivals", getNewArrivals);
router.get("/trending", getTrendingProducts);
router.post("/view/:id", incrementViewCount);
router.get("/detail/:id", getProductDetails);
router.get("/reviews", getProductReviews);
router.get("/can-review", isAuthenticated, checkCanReview);
router.get("/:id", getProductDetails);

// protected routes
router.put("/review", isAuthenticated, createProductReview);

// admin routes
router.get("/admin/stats", isAuthenticated, isAdmin, getProductStats);
router.post(
  "/admin/import",
  isAuthenticated,
  isAdmin,
  uploadTo("temp/bulk").fields([
    { name: "file", maxCount: 1 },
    { name: "images", maxCount: 50 }, // Allow up to 50 images
  ]),
  bulkImportProducts,
);

router.get("/admin/sample-excel", isAuthenticated, isAdmin, getSampleExcel);

router.post(
  "/admin/new",
  isAuthenticated,
  isAdmin,
  uploadTo("products").fields([
    { name: "mainImage", maxCount: 1 },
    { name: "hoverImage", maxCount: 1 },
    { name: "video", maxCount: 1 },
    { name: "ogImage", maxCount: 1 },
    { name: "images", maxCount: 10 },
    { name: "variantImages", maxCount: 20 },
  ]),
  createProduct,
);

router.put(
  "/admin/:id",
  isAuthenticated,
  isAdmin,
  uploadTo("products").fields([
    { name: "mainImage", maxCount: 1 },
    { name: "hoverImage", maxCount: 1 },
    { name: "video", maxCount: 1 },
    { name: "ogImage", maxCount: 1 },
    { name: "images", maxCount: 10 },
    { name: "variantImages", maxCount: 20 },
  ]),
  updateProduct,
);

router.delete("/admin/:id", isAuthenticated, isAdmin, deleteProduct);
router.get("/admin/reviews", isAuthenticated, isAdmin, getAllReviews);
router.put("/admin/reviews/:id", isAuthenticated, isAdmin, updateReviewStatus);
router.delete("/admin/reviews", isAuthenticated, isAdmin, deleteReview);
router.get("/admin/low-stock", isAuthenticated, isAdmin, getLowStockProducts);

export default router;
