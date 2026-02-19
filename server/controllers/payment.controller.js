import * as paymentService from "../services/payment.service.js";
import successResponse from "../utils/successResponse.js";
import ErrorResponse from "../utils/ErrorResponse.js";

export const createPaymentLink = async (req, res, next) => {
    try {
        const { addressId, callbackUrl, items, shippingAddress } = req.body;

        // Validate inputs
        if (!shippingAddress) {
            return next(ErrorResponse("Shipping address is required", 400));
        }

        if (!callbackUrl) {
            return next(ErrorResponse("Callback URL is required", 400));
        }

        // Format address if needed
        const formattedAddress = {
            ...shippingAddress,
            fullName: shippingAddress.fullName || `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        };

        // Call service to create payment link
        const paymentLink = await paymentService.createPaymentLinkService(
            req.user._id,
            formattedAddress,
            callbackUrl
        );

        return successResponse(
            res,
            200,
            paymentLink,
            "Payment link created successfully"
        );
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/v1/payment/verify
 *
 * Called by the frontend after Razorpay redirects back to /checkout/success.
 * Verifies signature, marks order as Paid, clears cart, pushes to Shiprocket.
 * Works without webhooks — works in local dev AND production.
 */
export const verifyPayment = async (req, res, next) => {
    try {
        const order = await paymentService.verifyOnlinePaymentService(req.body);
        return successResponse(res, 200, order, 'Payment verified and order confirmed');
    } catch (err) {
        next(err);
    }
};
