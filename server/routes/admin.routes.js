import express from "express";
import { getAdminDashboardStats } from "../controllers/admin.controller.js";
import { isAuthenticated, isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get(
  "/dashboard-stats",
  isAuthenticated,
  isAdmin,
  getAdminDashboardStats,
);

export default router;
