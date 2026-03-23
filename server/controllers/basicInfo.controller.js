import successResponse from "../utils/successResponse.js";
import * as basicInfoService from "../services/basicInfo.service.js";

export const getBasicInfo = async (req, res, next) => {
  try {
    const result = await basicInfoService.getBasicInfo();
    if (!result.success) return res.status(500).json(result);
    return successResponse(res, 200, result.data, "Basic info retrieved");
  } catch (error) {
    next(error);
  }
};

export const updateBasicInfo = async (req, res, next) => {
  try {
    const result = await basicInfoService.updateBasicInfo(
      req.body,
      req.user?._id || null,
    );
    if (!result.success) return res.status(500).json(result);
    return successResponse(res, 200, result.data, "Basic info updated");
  } catch (error) {
    next(error);
  }
};
