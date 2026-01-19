import express from "express";
import { getCart, addToCart } from "../controllers/cart.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.route("/").get(isAuthenticated, getCart).post(isAuthenticated, addToCart);

export default router;
