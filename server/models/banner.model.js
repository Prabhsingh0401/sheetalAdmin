import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Banner title is required"],
            trim: true,
            maxlength: [100, "Title cannot be more than 100 characters"]
        },
        image: {
            url: { type: String, required: [true, "Banner image URL is required"] },
            public_id: { type: String, required: [true, "Public ID is required for deletion"] }
        },
        link: { type: String, default: "/", trim: true },
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
        status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
        deviceType: { type: String, enum: ["All", "Desktop", "Mobile"], default: "All" }
    },
    { timestamps: true }
);

const Banner = mongoose.models.Banner || mongoose.model("Banner", bannerSchema);

export default Banner;