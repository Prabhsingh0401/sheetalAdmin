import * as sizeChartService from "../services/sizeChart.service.js";
import successResponse from "../utils/successResponse.js";
import { deleteFile } from "../utils/fileHelper.js"; // Needed for cleanup if the service handles old image deletion

export const uploadHowToMeasureImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No image file uploaded." });
    }
    const sizeChart = await sizeChartService.uploadHowToMeasureImageService(
      req.file.path,
    );
    return successResponse(
      res,
      200,
      sizeChart,
      "How to measure image uploaded successfully",
    );
  } catch (error) {
    // If an error occurs during processing, clean up the uploaded file
    if (req.file) {
      deleteFile(req.file.path);
    }
    next(error);
  }
};

export const getSizeChart = async (req, res, next) => {
  try {
    const sizeChart = await sizeChartService.getSizeChartService();
    return successResponse(res, 200, sizeChart, "Size chart fetched");
  } catch (error) {
    next(error);
  }
};

export const addSize = async (req, res, next) => {
  try {
    const sizeChart = await sizeChartService.addSizeService(req.body);
    return successResponse(res, 201, sizeChart, "Size added to chart");
  } catch (error) {
    next(error);
  }
};

export const updateSize = async (req, res, next) => {
  try {
    const sizeChart = await sizeChartService.updateSizeService(
      req.params.id,
      req.body,
    );
    return successResponse(res, 200, sizeChart, "Size updated in chart");
  } catch (error) {
    next(error);
  }
};

export const deleteSize = async (req, res, next) => {
  try {
    const sizeChart = await sizeChartService.deleteSizeService(req.params.id);
    return successResponse(res, 200, sizeChart, "Size deleted from chart");
  } catch (error) {
    next(error);
  }
};
