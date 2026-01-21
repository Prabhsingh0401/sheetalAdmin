import express from "express";
import { getCart, addToCart, removeFromCart } from "../controllers/cart.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.route("/").get(isAuthenticated, getCart);
router.route("/add").post(isAuthenticated, addToCart);
router.route("/remove/:id").delete(isAuthenticated, removeFromCart);

export default router;
