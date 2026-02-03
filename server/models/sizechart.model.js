import mongoose from "mongoose";

const sizeChartSchema = new mongoose.Schema(
  {
    table: [
      {
        label: { type: String, required: true },
        bust: { type: String },
        waist: { type: String },
        hip: { type: String },
        shoulder: { type: String },
        length: { type: String },
      },
    ],
    howToMeasureImage: {
      type: String,
    },
  },
  { timestamps: true },
);

const SizeChart =
  mongoose.models.SizeChart || mongoose.model("SizeChart", sizeChartSchema);
export default SizeChart;
