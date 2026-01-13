import express from "express";
import { createCoupon, getAllCoupons, getCouponStats, deleteCoupon, applyCoupon, updateCoupon } from "../controllers/coupon.controller.js";
import { isAuthenticated, isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/apply", isAuthenticated, applyCoupon);

router.get("/admin/all", isAuthenticated, isAdmin, getAllCoupons);
router.get("/admin/stats", isAuthenticated, isAdmin, getCouponStats);
router.post("/admin", isAuthenticated, isAdmin, createCoupon);
router.route("/admin/:id")
    .put(isAuthenticated, isAdmin, updateCoupon)
    .delete(isAuthenticated, isAdmin, deleteCoupon);

export default router;