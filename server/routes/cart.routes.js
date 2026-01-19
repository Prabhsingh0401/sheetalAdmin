import express from "express";
import { getCart, addToCart, removeFromCart } from "../controllers/cart.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.route("/").get(isAuthenticated, getCart).post(isAuthenticated, addToCart);
router.route("/:id").delete(isAuthenticated, removeFromCart); // New DELETE route

export default router;
