import * as orderService from "../services/order.service.js";
import successResponse from "../utils/successResponse.js";

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
