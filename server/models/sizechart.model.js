import mongoose from "mongoose";

const sizeChartSchema = new mongoose.Schema(
    {
        name: { type: String, required: [true, "Chart name is required"], trim: true },
        table: [
            {
                label: { type: String, required: true },
                bust: { type: String },
                waist: { type: String },
                hip: { type: String },
                shoulder: { type: String },
                length: { type: String }
            }
        ],
        howToMeasure: {
            guideImage: { type: String, required: [true, "Please provide a guide image path"] },
            steps: [
                {
                    title: { type: String },
                    desc: { type: String }
                }
            ]
        },
        unit: { type: String, enum: ["IN", "CM"], default: "IN" },
        tip: { type: String, default: "Tip: For a better fit, choose a size 2 inches larger than your body measurement." }
    },
    { timestamps: true }
);

const SizeChart = mongoose.models.SizeChart || mongoose.model("SizeChart", sizeChartSchema);
export default SizeChart;