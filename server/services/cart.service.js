import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import ErrorResponse from "../utils/ErrorResponse.js";

export const getCartByUserIdService = async (userId) => {
    const cart = await Cart.findOne({ user: userId }).populate({
        path: "items.product",
        model: "Product",
        select: "name price discountPrice mainImage.url",
    });

    if (!cart) {
        // If no cart, create one
        const newCart = await Cart.create({ user: userId, items: [] });
        return {
            success: true,
            data: newCart,
        };
    }

    return {
        success: true,
        data: cart,
    };
};

export const addToCartService = async (userId, productId, quantity, size, color) => {
    const cart = await Cart.findOne({ user: userId });
    const product = await Product.findById(productId);

    if (!product) {
        throw new ErrorResponse("Product not found", 404);
    }

    if (!cart) {
        const newCart = await Cart.create({
            user: userId,
            items: [{ product: productId, quantity, size, color }],
        });
        return {
            success: true,
            data: newCart,
        };
    }

    const existingItem = cart.items.find(
        (item) => item.product.toString() === productId && item.size === size && item.color === color
    );

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.items.push({ product: productId, quantity, size, color });
    }

    await cart.save();
    return {
        success: true,
        data: cart,
    };
};
