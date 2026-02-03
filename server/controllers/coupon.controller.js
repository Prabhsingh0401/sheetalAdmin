import * as couponService from "../services/coupon.service.js";
import successResponse from "../utils/successResponse.js";

export const createCoupon = async (req, res, next) => {
  try {
    const result = await couponService.createCouponService(req.body);
    if (!result.success) return res.status(result.statusCode).json(result);
    return successResponse(
      res,
      201,
      result.data,
      "Coupon created successfully",
    );
  } catch (error) {
    next(error);
  }
};

export const updateCoupon = async (req, res, next) => {
  try {
    const result = await couponService.updateCouponService(
      req.params.id,
      req.body,
    );
    if (!result.success) return res.status(result.statusCode).json(result);
    return successResponse(
      res,
      200,
      result.data,
      "Coupon updated successfully",
    );
  } catch (err) {
    next(err);
  }
};

export const getAllCoupons = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const result = await couponService.getAllCouponsService({
      page: Number(page),
      limit: Number(limit),
      search,
    });
    if (!result.success)
      return res.status(result.statusCode || 500).json(result);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const applyCoupon = async (req, res, next) => {
  try {
    const { code, cartTotal, cartItems } = req.body;
    const result = await couponService.applyCouponService(
      code,
      cartTotal,
      req.user._id,
      cartItems,
    );
    if (!result.success) return res.status(result.statusCode).json(result);
    return successResponse(
      res,
      200,
      result.data,
      "Coupon applied successfully",
    );
  } catch (error) {
    next(error);
  }
};

export const deleteCoupon = async (req, res, next) => {
  try {
    const result = await couponService.deleteCouponService(req.params.id);
    if (!result.success) return res.status(result.statusCode).json(result);
    return successResponse(res, 200, null, "Coupon deleted successfully");
  } catch (error) {
    next(error);
  }
};

export const getCouponStats = async (req, res, next) => {
  try {
    const result = await couponService.getCouponStatsService();
    if (!result.success) return res.status(500).json(result);
    return successResponse(res, 200, result.data, "Coupon stats retrieved");
  } catch (error) {
    next(error);
  }
};
