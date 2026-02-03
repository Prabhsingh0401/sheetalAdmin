import * as bannerService from "../services/banner.service.js";
import successResponse from "../utils/successResponse.js";
import fs from "fs";

const safeUnlink = (path) => {
  if (path && fs.existsSync(path)) fs.unlinkSync(path);
};

export const createBanner = async (req, res, next) => {
  try {
    const result = await bannerService.createBannerService(req.body, req.file);
    if (!result.success) {
      if (req.file) safeUnlink(req.file.path);
      return res.status(400).json(result);
    }
    return successResponse(
      res,
      201,
      result.data,
      "Banner created successfully",
    );
  } catch (error) {
    if (req.file) safeUnlink(req.file.path);
    next(error);
  }
};

export const getAllBanners = async (req, res, next) => {
  try {
    const result = await bannerService.getAllBannersService();
    return successResponse(
      res,
      200,
      result.data,
      "Banners retrieved successfully",
    );
  } catch (error) {
    next(error);
  }
};

export const getAdminBanners = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const result = await bannerService.getAdminBannersService({
      page: Number(page),
      limit: Number(limit),
      search,
    });
    return successResponse(
      res,
      200,
      result.data,
      "Admin banners retrieved successfully",
    );
  } catch (error) {
    next(error);
  }
};

export const getBannerStats = async (req, res, next) => {
  try {
    const result = await bannerService.getBannerStatsService();
    return successResponse(
      res,
      200,
      result.data,
      "Banner statistics retrieved successfully",
    );
  } catch (error) {
    next(error);
  }
};

export const updateBanner = async (req, res, next) => {
  try {
    const result = await bannerService.updateBannerService(
      req.params.id,
      req.body,
      req.file,
    );
    if (!result.success) {
      if (req.file) safeUnlink(req.file.path);
      return res.status(400).json(result);
    }
    return successResponse(
      res,
      200,
      result.data,
      "Banner updated successfully",
    );
  } catch (error) {
    if (req.file) safeUnlink(req.file.path);
    next(error);
  }
};

export const deleteBanner = async (req, res, next) => {
  try {
    const result = await bannerService.deleteBannerService(req.params.id);
    if (!result.success) return res.status(400).json(result);
    return successResponse(res, 200, null, "Banner deleted successfully");
  } catch (error) {
    next(error);
  }
};
