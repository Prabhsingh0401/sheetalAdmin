import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
    {
        platformFee: { type: Number, default: 0 },
        shippingFee: { type: Number, default: 0 },
        freeShippingThreshold: { type: Number, default: 0 },
        taxPercentage: { type: Number, default: 0 },
    },
    { timestamps: true },
);

const Settings =
    mongoose.models.Settings || mongoose.model("Settings", settingsSchema);
export default Settings;
