import express from "express";
import {
  createOrder,
  getMyOrders,
  adminGetAllOrders,
  updateOrderStatus,
  pushToShiprocket,
} from "../controllers/order.controller.js";
import { isAuthenticated, isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// --- USER ROUTES ---
// 1. Naya order place karne ke liye
router.post("/create", isAuthenticated, createOrder);

// 2. User ko apne purane orders dikhane ke liye (With Pagination)
router.get("/my-orders", isAuthenticated, getMyOrders);

// --- ADMIN ROUTES ---
// 3. Admin ko poori website ke saare orders dikhane ke liye
router.get("/admin/all", isAuthenticated, isAdmin, adminGetAllOrders);

// 4. Admin order ka status (Shipped/Delivered/Return) update karne ke liye
router.put("/admin/update/:id", isAuthenticated, isAdmin, updateOrderStatus);

// 5. Admin: Manually push an order to Shiprocket (testing + manual sync)
router.post("/admin/push-to-shiprocket/:orderId", isAuthenticated, isAdmin, pushToShiprocket);

export default router;
