import SizeChart from "../models/sizechart.model.js";
import { deleteFile } from "../utils/fileHelper.js";

// Upload how to measure image
export const uploadHowToMeasureImageService = async (filePath) => {
  let sizeChart = await getSizeChartService();

  // If an old image exists, delete it
  if (sizeChart.howToMeasureImage) {
    deleteFile(sizeChart.howToMeasureImage);
  }

  sizeChart.howToMeasureImage = filePath.replace(/\\/g, "/");
  await sizeChart.save();
  return sizeChart;
};

// Get the size chart, create if it doesn't exist
export const getSizeChartService = async () => {
  let sizeChart = await SizeChart.findOne();
  if (!sizeChart) {
    sizeChart = await SizeChart.create({ table: [] });
  }
  return sizeChart;
};

// Add a new size to the table
export const addSizeService = async (sizeData) => {
  const sizeChart = await getSizeChartService();
  sizeChart.table.push(sizeData);
  await sizeChart.save();
  return sizeChart;
};

// Update a size in the table
export const updateSizeService = async (sizeId, sizeData) => {
  const sizeChart = await getSizeChartService();
  const sizeIndex = sizeChart.table.findIndex(
    (size) => size._id.toString() === sizeId,
  );
  if (sizeIndex === -1) {
    throw new Error("Size not found");
  }
  sizeChart.table[sizeIndex] = { ...sizeChart.table[sizeIndex], ...sizeData };
  await sizeChart.save();
  return sizeChart;
};

// Delete a size from the table
export const deleteSizeService = async (sizeId) => {
  const sizeChart = await getSizeChartService();
  sizeChart.table = sizeChart.table.filter(
    (size) => size._id.toString() !== sizeId,
  );
  await sizeChart.save();
  return sizeChart;
};
