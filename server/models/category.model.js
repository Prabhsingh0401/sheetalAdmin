import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
    {
        name: { 
            type: String, 
            required: [true, "Category name is required"], 
            trim: true, 
            unique: true,
            maxlength: [50, "Name cannot be more than 50 characters"]
        },
        slug: { 
            type: String, 
            required: true, 
            unique: true, 
            lowercase: true,
            index: true
        },
        description: { type: String },
        image: { 
            url: { type: String, default: "" }, 
            public_id: { type: String } 
        },
        parentCategory: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Category", 
            default: null 
        },
        categoryBanner: { type: String },
        isFeatured: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
        status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
        metaTitle: { type: String, trim: true },
        metaDescription: { type: String, trim: true }
    },
    { timestamps: true }
);
const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);
export default Category;
