import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        name: { type: String, required: [true, "Product name is required"], trim: true, maxlength: [150, "Name cannot be more than 150 characters"] },
        slug: { type: String, required: true, unique: true, lowercase: true, index: true },
        sku: { type: String, required: [true, "SKU is required"], unique: true, uppercase: true },

        shortDescription: { type: String, required: true },
        description: { type: String, required: true },
        materialCare: { type: String, required: [true, "Material and Care instructions are required"] },

        price: { type: Number, required: true, min: 0 },
        discountPrice: { type: Number, default: 0 },
        gstPercent: { type: Number, default: 0 },

        status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
        stock: { type: Number, required: true, default: 0 },

        displayCollections: { type: [String], default: [], index: true },
        eventTags: { type: [String], default: [], index: true },

        variants: [
            {
                v_sku: { type: String, uppercase: true, sparse: true },
                size: { type: String },
                color: {
                    name: { type: String },
                    code: { type: String },
                    swatchImage: { type: String }
                },
                v_price: { type: Number },
                v_discountPrice: { type: Number },
                stock: { type: Number, default: 0 },
                v_image: { type: String }
            }
        ],

        brandInfo: { type: String, trim: true },
        warranty: { type: String, default: "No Warranty" },
        returnPolicy: { type: String, default: "7 Days Return Policy" },
        specifications: [{ key: { type: String }, value: { type: String } }],
        keyBenefits: { type: [String], default: [] },

        metaTitle: { type: String, trim: true },
        metaDescription: { type: String, trim: true },
        metaKeywords: { type: String },
        ogImage: { type: String },
        canonicalUrl: { type: String },

        mainImage: {
            url: { type: String, required: true },
            alt: { type: String, default: "product main image" }
        },
        hoverImage: {
            url: { type: String },
            alt: { type: String, default: "product hover image" }
        },
        images: [
            {
                url: { type: String, required: true },
                alt: { type: String, default: "product gallery image" },
                isDefault: { type: Boolean, default: false }
            }
        ],
        video: {
            url: { type: String },
            mimeType: { type: String, default: "video/mp4" },
            size: { type: Number }
        },

        averageRating: { type: Number, default: 0 },
        totalReviews: { type: Number, default: 0 },

        isActive: { type: Boolean, default: true },

        category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
        sizeChart: { type: mongoose.Schema.Types.ObjectId, ref: "SizeChart", default: null },
    },
    { timestamps: true }
);

productSchema.index({ name: 'text', sku: 'text', eventTags: 'text', metaKeywords: 'text', materialCare: 'text' });

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
export default Product;