import express from "express";
import { createCategory, getAllCategories, getCategoryBySlug, getAdminCategories, getCategoryStats, updateCategory, deleteCategory } from "../controllers/category.controller.js";
import { isAuthenticated, isAdmin } from "../middlewares/auth.middleware.js";
import { uploadTo } from "../middlewares/multer.middleware.js";

const router = express.Router();

// public routes
router.get("/", getAllCategories);
router.get("/:slug", getCategoryBySlug);

// admin routes
router.get("/admin/all", isAuthenticated, isAdmin, getAdminCategories);
router.get("/admin/stats", isAuthenticated, isAdmin, getCategoryStats);
router.post("/admin", isAuthenticated, isAdmin, uploadTo("categories").single("image"), createCategory);
router.route("/admin/:id")
    .put(isAuthenticated, isAdmin, uploadTo("categories").single("image"), updateCategory)
    .delete(isAuthenticated, isAdmin, deleteCategory);

export default router;