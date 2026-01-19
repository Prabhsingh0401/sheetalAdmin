import * as cartService from "../services/cart.service.js";
import successResponse from "../utils/successResponse.js";

export const getCart = async (req, res, next) => {
    try {
        const result = await cartService.getCartByUserIdService(req.user._id);
        return successResponse(res, 200, result.data, "Cart retrieved successfully");
    } catch (err) {
        next(err);
    }
};

export const addToCart = async (req, res, next) => {
    try {
        const { productId, quantity, size, color } = req.body;
        const result = await cartService.addToCartService(
            req.user._id,
            productId,
            quantity,
            size,
            color
        );
        return successResponse(res, 200, result.data, "Product added to cart successfully");
    } catch (err) {
        next(err);
    }
};
