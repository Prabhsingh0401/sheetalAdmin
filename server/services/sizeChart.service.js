import SizeChart from "../models/sizeChart.model.js";
import { deleteFile } from "../utils/fileHelper.js";

const parseJsonField = (field) => {
    if (typeof field === "string") {
        try { return JSON.parse(field); }
        catch (e) { return []; }
    }
    return field || [];
};

export const getAllChartsService = async (queryStr) => {
    const { page = 1, limit = 10, search } = queryStr;
    const skip = (Number(page) - 1) * Number(limit);

    let filter = {};
    if (search) {
        filter.name = { $regex: search, $options: 'i' };
    }

    const [charts, totalCharts] = await Promise.all([
        SizeChart.find(filter)
            .sort("-createdAt")
            .skip(skip)
            .limit(Number(limit))
            .lean(),
        SizeChart.countDocuments(filter)
    ]);

    return {
        charts,
        totalCharts,
        currentPage: Number(page),
        totalPages: Math.ceil(totalCharts / limit)
    };
};

export const getChartDetailsService = async (id) => {
    const chart = await SizeChart.findById(id).lean();
    return chart ? { success: true, data: chart } : { success: false, statusCode: 404 };
};

export const createSizeChartService = async (data, filePath) => {
    const table = parseJsonField(data.table);
    const steps = parseJsonField(data.steps);

    const newChart = await SizeChart.create({
        name: data.name,
        unit: data.unit || "IN",
        tip: data.tip,
        table: table,
        howToMeasure: {
            guideImage: filePath ? filePath.replace(/\\/g, '/') : "",
            steps: steps
        }
    });

    return { success: true, data: newChart };
};

export const updateSizeChartService = async (id, data, filePath) => {
    const chart = await SizeChart.findById(id);
    if (!chart) return { success: false, statusCode: 404 };

    const updateData = { ...data };

    if (data.table) updateData.table = parseJsonField(data.table);
    if (data.steps) {
        updateData["howToMeasure.steps"] = parseJsonField(data.steps);
    }

    if (filePath) {
        if (chart.howToMeasure?.guideImage) {
            deleteFile(chart.howToMeasure.guideImage);
        }
        updateData["howToMeasure.guideImage"] = filePath.replace(/\\/g, '/');
    }

    const updatedChart = await SizeChart.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
    );

    return { success: true, data: updatedChart };
};

export const deleteSizeChartService = async (id) => {
    const chart = await SizeChart.findById(id);
    if (!chart) return { success: false, statusCode: 404 };

    if (chart.howToMeasure?.guideImage) {
        deleteFile(chart.howToMeasure.guideImage);
    }

    await chart.deleteOne();
    return { success: true };
};