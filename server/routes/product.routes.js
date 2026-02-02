import express from "express";
import { createProduct, getAllProducts, updateProduct, deleteProduct, createProductReview, getProductReviews, deleteReview, getProductDetails, getProductStats, bulkImportProducts, getNewArrivals } from "../controllers/product.controller.js";

import { isAuthenticated, isAdmin } from "../middlewares/auth.middleware.js";
import { uploadTo } from "../middlewares/multer.middleware.js";

const router = express.Router();

// public routes
router.get("/", getAllProducts);
router.get("/all", getAllProducts);
router.get("/new-arrivals", getNewArrivals);
router.get("/detail/:id", getProductDetails);
router.get("/reviews", getProductReviews);
router.get("/:id", getProductDetails); // Allow fetching by ID/Slug directly

// protected routes
router.put("/review", isAuthenticated, createProductReview);

// admin routes
router.get("/admin/stats", isAuthenticated, isAdmin, getProductStats);
router.post("/admin/import", isAuthenticated, isAdmin, uploadTo("temp/excel").single("file"), bulkImportProducts);

router.post("/admin/new", isAuthenticated, isAdmin,
    uploadTo("products").fields([
        { name: "mainImage", maxCount: 1 },
        { name: "hoverImage", maxCount: 1 },
        { name: "video", maxCount: 1 },
        { name: "ogImage", maxCount: 1 },
        { name: "images", maxCount: 10 },
        { name: 'variantImages', maxCount: 20 }
    ]),
    createProduct
);

router.put("/admin/:id", isAuthenticated, isAdmin,
    uploadTo("products").fields([
        { name: "mainImage", maxCount: 1 },
        { name: "hoverImage", maxCount: 1 },
        { name: "video", maxCount: 1 },
        { name: "ogImage", maxCount: 1 },
        { name: "images", maxCount: 10 },
        { name: 'variantImages', maxCount: 20 }
    ]),
    updateProduct
);

router.delete("/admin/:id", isAuthenticated, isAdmin, deleteProduct);
router.delete("/admin/reviews", isAuthenticated, isAdmin, deleteReview);

export default router;