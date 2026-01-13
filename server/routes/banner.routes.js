import express from "express";
import { createBanner, getAllBanners, getAdminBanners, getBannerStats, updateBanner, deleteBanner } from "../controllers/banner.controller.js";
import { isAuthenticated, isAdmin } from "../middlewares/auth.middleware.js";
import { uploadTo } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.get("/", getAllBanners);

router.get("/admin/all", isAuthenticated, isAdmin, getAdminBanners);
router.get("/admin/stats", isAuthenticated, isAdmin, getBannerStats);

router.post("/admin", isAuthenticated, isAdmin, uploadTo("banners").single("image"), createBanner);

router.route("/admin/:id")
    .put(isAuthenticated, isAdmin, uploadTo("banners").single("image"), updateBanner)
    .delete(isAuthenticated, isAdmin, deleteBanner);

export default router;