import mongoose from "mongoose";

const pageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, default: "" },
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    metaKeywords: { type: String },
    ogImage: { type: String },
    canonicalUrl: { type: String },
    seoSchema: { type: String },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

const Page = mongoose.models.Page || mongoose.model("Page", pageSchema);

export default Page;
