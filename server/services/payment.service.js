import razorpay from '../config/razorpay.js';
import ErrorResponse from '../utils/ErrorResponse.js';
import Order from '../models/order.model.js';
import Cart from '../models/cart.model.js';
import User from '../models/user.model.js';
import Settings from '../models/settings.model.js';

export const createPaymentLinkService = async (userId, shippingAddress, frontendCallbackUrl) => {
    // 1. Fetch Cart and User
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    const user = await User.findById(userId);

    if (!cart || cart.items.length === 0) {
        throw ErrorResponse('Cart is empty', 400);
    }

    if (!user) {
        throw ErrorResponse('User not found', 404);
    }

    // 2. Calculate Total Amount
    let totalPrice = 0;
    const orderItems = [];

    for (const item of cart.items) {
        if (!item.product) continue;

        let productPrice = 0;

        if (item.discountPrice && item.discountPrice > 0) {
            productPrice = item.discountPrice;
        } else if (item.price && item.price > 0) {
            productPrice = item.price;
        } else {
            productPrice = 0;
        }

        // Ensure price is a number
        productPrice = Number(productPrice);
        if (isNaN(productPrice)) {
            productPrice = 0;
        }

        totalPrice += productPrice * item.quantity;

        orderItems.push({
            product: item.product._id,
            name: item.product.name,
            image: item.product.mainImage?.url || "",
            price: productPrice,
            quantity: item.quantity,
            variant: {
                size: item.size,
                color: item.color
            }
        });
    }

    // Ensure totalPrice is a valid number
    if (isNaN(totalPrice)) {
        totalPrice = 0;
    }

    // --- Calculate Fees ---
    let shippingPrice = 0;
    let platformFee = 0;

    const settings = await Settings.findOne(); // Fetch global settings
    if (settings) {
        platformFee = settings.platformFee || 0;

        // Shipping Logic check
        const freeShippingThreshold = settings.freeShippingThreshold || 0;
        const baseShippingFee = settings.shippingFee || 0;

        if (totalPrice > freeShippingThreshold && freeShippingThreshold > 0) {
            shippingPrice = 0;
        } else {
            shippingPrice = baseShippingFee;
        }
    }

    const finalAmount = totalPrice + shippingPrice + platformFee;

    // 3. Create Order in Database (Pending Payment)
    const order = await Order.create({
        user: userId,
        orderItems,
        shippingAddress,
        paymentInfo: {
            id: `pay_${Date.now()}`,
            status: "Pending",
            method: "Online"
        },
        itemsPrice: totalPrice,
        shippingPrice: shippingPrice,
        taxPrice: platformFee, // Using taxPrice field for platformFee if no specific field exists, or add to schema
        totalPrice: finalAmount,
        orderStatus: "Processing"
    });

    // Ensure minimum amount for Razorpay (100 paise = 1 INR)
    if (finalAmount < 1) {
        throw ErrorResponse("Total amount must be at least ₹1", 400);
    }

    // Validate Customer Details
    const customerName = user.name || "Customer";
    const customerEmail = user.email || "void@razorpay.com";

    // Prioritize shipping address phone, then user phone.
    let rawContact = shippingAddress.phoneNumber || shippingAddress.phone || user.phoneNumber || "";

    // Sanitize contact (keep only digits)
    let customerContact = String(rawContact).replace(/\D/g, "");

    // Razorpay requires contact to be between 8 and 15 digits roughly for INR
    if (!customerContact || customerContact.length < 10) {
        throw ErrorResponse("Valid 10-digit phone number is required for payment", 400);
    }

    // Auto-append +91 if user provided only 10 digits (common for India context)
    // This helps avoid "international" detection in some cases
    if (customerContact.length === 10) {
        customerContact = `+91${customerContact}`;
    } else {
        // If it already has country code, ensure it starts with + if it's missing (usually handled by replace, but here we want to ensure format)
        // Actually, Razorpay API is flexible, but E.164 prefers +, let's stick to sanitized digits if > 10 assuming user added code
        // Or if it's 12 digits (9198...), handle that too.
        if (customerContact.length === 12 && customerContact.startsWith("91")) {
            customerContact = `+${customerContact}`;
        }
    }

    // 4. Create Razorpay Payment Link
    const paymentLinkOptions = {
        amount: Math.round(finalAmount * 100), // Amount in paise
        currency: "INR",
        accept_partial: false,
        reference_id: order._id.toString(),
        description: `Payment for Order #${order._id}`,
        customer: {
            name: customerName,
            email: customerEmail,
            contact: customerContact
        },
        notify: {
            sms: true,
            email: true
        },
        reminder_enable: true,
        callback_url: `${frontendCallbackUrl}?order_id=${order._id}`,
        callback_method: "get"
    };

    try {
        const paymentLink = await razorpay.paymentLink.create(paymentLinkOptions);

        // Update order with payment link ID just in case
        order.paymentInfo.id = paymentLink.id;
        await order.save();

        return paymentLink;
    } catch (error) {
        // If payment link creation fails, maybe delete the order or update status
        await Order.findByIdAndDelete(order._id);
        throw ErrorResponse(error.error?.description || error.message, 500);
    }
};
