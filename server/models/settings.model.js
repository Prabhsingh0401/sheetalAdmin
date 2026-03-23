import mongoose from "mongoose";

const navbarItemSchema = new mongoose.Schema({
    id:          { type: String, required: true },
    label:       { type: String, required: true },
    href:        { type: String },
    type:        { type: String, enum: ['link', 'category', 'custom'], default: 'link' },
    isDroppable: { type: Boolean, default: false },
    children:    [mongoose.Schema.Types.Mixed]
}, { _id: false });

const footerLinkSchema = new mongoose.Schema({
    id:     { type: String, required: true },
    label:  { type: String, required: true },
    href:   { type: String, required: true },
    hidden: { type: Boolean, default: false },
}, { _id: false });

const footerSubColumnSchema = new mongoose.Schema({
    id:     { type: String, required: true },
    hidden: { type: Boolean, default: false },
    links:  { type: [footerLinkSchema], default: [] },
}, { _id: false });

const settingsSchema = new mongoose.Schema({
    platformFee:           { type: Number, default: 0 },
    shippingFee:           { type: Number, default: 0 },
    freeShippingThreshold: { type: Number, default: 0 },
    taxPercentage:         { type: Number, default: 0 },
    navbarLayout:          { type: [navbarItemSchema], default: [] },
    footerLayout:          { type: [mongoose.Schema.Types.Mixed], default: [] },
}, { timestamps: true });

const Settings =
    mongoose.models.Settings || mongoose.model("Settings", settingsSchema);
export default Settings;