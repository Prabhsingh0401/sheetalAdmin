import * as orderService from "../services/order.service.js";
import successResponse from "../utils/successResponse.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import { createShiprocketOrder } from "../services/shiprocket.service.js";

// --- 1. CREATE ORDER ---
export const createOrder = async (req, res, next) => {
  try {
    const data = await orderService.createOrderService(req.body, req.user._id);
    return successResponse(res, 201, data, "Order place ho gaya successfully!");
  } catch (error) {
    next(error);
  }
};

// --- 2. GET MY ORDERS (Paginated) ---
export const getMyOrders = async (req, res, next) => {
  try {
    const result = await orderService.getAllOrdersService(
      req.query,
      req.user._id,
    );

    // Yahan 'result' mein orders aur pagination dono hain
    // Hum pura result hi bhej denge taaki frontend ko page numbers mil sakein
    return successResponse(
      res,
      200,
      result,
      "Your orders fetched successfully",
    );
  } catch (error) {
    next(error);
  }
};

// --- 3. ADMIN: GET ALL ORDERS (Paginated + Filters) ---
export const adminGetAllOrders = async (req, res, next) => {
  try {
    const result = await orderService.getAllOrdersService(req.query);
    return successResponse(res, 200, result, "All orders fetched for admin");
  } catch (error) {
    next(error);
  }
};

// --- 4. UPDATE ORDER STATUS (Admin) ---
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, trackingId, courierPartner } = req.body;
    const data = await orderService.updateOrderStatusService(
      req.params.id,
      status,
      { trackingId, courierPartner },
    );
    return successResponse(res, 200, data, `Order status updated to ${status}`);
  } catch (error) {
    next(error);
  }
};
// --- 5. ADMIN: Manually Push Order to Shiprocket ---
/**
 * POST /api/v1/orders/admin/push-to-shiprocket/:orderId
 *
 * Manually pushes an existing order to Shiprocket.
 * Useful for:
 *  - Testing the Shiprocket integration without ngrok
 *  - Re-pushing orders that failed to sync automatically
 *  - Forcing a sync for Online orders before webhook is configured
 *
 * @returns Shiprocket order ID, shipment ID, and order details
 */
export const pushToShiprocket = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Warn if already on Shiprocket but still allow re-push (for testing)
    if (order.shiprocketOrderId) {
      console.warn(
        `[Admin] Order ${order._id} already has SR ID: ${order.shiprocketOrderId}. Re-pushing...`
      );
    }

    const user = await User.findById(order.user).lean();
    const { shiprocketOrderId, shipmentId } = await createShiprocketOrder(order, user);

    // Save Shiprocket IDs back to the order
    await Order.findByIdAndUpdate(order._id, { shiprocketOrderId, shipmentId });

    return successResponse(res, 200, {
      orderId: order._id,
      shiprocketOrderId,
      shipmentId,
    }, `Order successfully pushed to Shiprocket`);
  } catch (error) {
    next(error);
  }
};
