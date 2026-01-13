import * as sizeChartService from "../services/sizeChart.service.js";
import successResponse from "../utils/successResponse.js";

export const createSizeChart = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Guide image is required" });
        }

        const result = await sizeChartService.createSizeChartService(req.body, req.file.path);
        return successResponse(res, 201, result.data, "Size Chart Created");
    } catch (error) {
        next(error);
    }
};

export const getAllSizeCharts = async (req, res, next) => {
    try {
        const result = await sizeChartService.getAllChartsService(req.query);
        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

export const getSizeChartDetails = async (req, res, next) => {
    try {
        const result = await sizeChartService.getChartDetailsService(req.params.id);
        if (!result.success) return res.status(result.statusCode).json(result);

        return successResponse(res, 200, result.data, "Size chart fetched");
    } catch (error) {
        next(error);
    }
};

export const updateSizeChart = async (req, res, next) => {
    try {
        const result = await sizeChartService.updateSizeChartService(
            req.params.id,
            req.body,
            req.file?.path
        );

        if (!result.success) return res.status(result.statusCode).json(result);
        return successResponse(res, 200, result.data, "Size Chart updated successfully");
    } catch (error) {
        next(error);
    }
};

export const deleteSizeChart = async (req, res, next) => {
    try {
        const result = await sizeChartService.deleteSizeChartService(req.params.id);
        if (!result.success) return res.status(result.statusCode).json(result);

        return successResponse(res, 200, null, "Size Chart deleted successfully");
    } catch (error) {
        next(error);
    }
};