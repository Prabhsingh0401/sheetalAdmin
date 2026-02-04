import React from "react";
import { X } from "lucide-react";
import InputField from "./InputField";
import TiptapEditor from "@/components/TiptapEditor";

export default function BasicInfoParams({
    formData,
    handleChange,
    setFormData,
    categories,
    handleAddTag,
    removeTag,
}) {
    return (
        <div className="space-y-5 animate-in fade-in duration-300">
            <InputField
                label="Product Title"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Cotton Slim Fit Shirt"
                required
                maxLength={150}
            />

            <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Short Description (Summary)
                </label>
                <textarea
                    name="shortDescription"
                    value={formData.shortDescription}
                    onChange={handleChange}
                    placeholder="Write a brief summary for product cards..."
                    className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 focus:border-slate-900 outline-none shadow-sm min-h-[80px]"
                    required
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Category
                    </label>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 focus:border-slate-900 outline-none cursor-pointer appearance-none shadow-sm"
                    >
                        <option value="">Choose Category</option>
                        {categories.map((cat) => (
                            <option key={cat._id} value={cat._id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Sub Category
                    </label>
                    <select
                        name="subCategory"
                        value={formData.subCategory}
                        onChange={handleChange}
                        disabled={!formData.category}
                        className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 focus:border-slate-900 outline-none cursor-pointer appearance-none shadow-sm disabled:bg-slate-100 disabled:text-slate-400"
                    >
                        <option value="">Choose Sub Category</option>
                        {categories
                            .find((c) => c._id === formData.category)
                            ?.subCategories?.map((sub, idx) => (
                                <option key={idx} value={sub}>
                                    {sub}
                                </option>
                            ))}
                    </select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Status
                    </label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 focus:border-slate-900 outline-none shadow-sm"
                    >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
                <InputField
                    label="SKU Code"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    placeholder="CLOTH-001"
                    required
                />
                <InputField
                    label="GST %"
                    name="gstPercent"
                    type="number"
                    value={formData.gstPercent}
                    onChange={handleChange}
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Full Description
                </label>
                <TiptapEditor
                    value={formData.description}
                    onChange={(content) =>
                        setFormData((prev) => ({ ...prev, description: content }))
                    }
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Material & Care Instructions
                </label>
                <TiptapEditor
                    value={formData.materialCare}
                    onChange={(content) =>
                        setFormData((prev) => ({
                            ...prev,
                            materialCare: content,
                        }))
                    }
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Wear Type */}
                <div className="space-y-1.5 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Wear Type (Press Enter)
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {formData.wearType.map((tag, idx) => (
                            <span
                                key={idx}
                                className="flex items-center gap-1 bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider"
                            >
                                {tag}{" "}
                                <button
                                    type="button"
                                    onClick={() => removeTag(tag, "wearType")}
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                    <input
                        type="text"
                        onKeyDown={(e) => handleAddTag(e, "wearType")}
                        placeholder="e.g. Office Wear, Party Wear..."
                        className="w-full bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm outline-none"
                    />
                </div>

                {/* Occasion */}
                <div className="space-y-1.5 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Occasion (Press Enter)
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {formData.occasion.map((tag, idx) => (
                            <span
                                key={idx}
                                className="flex items-center gap-1 bg-pink-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider"
                            >
                                {tag}{" "}
                                <button
                                    type="button"
                                    onClick={() => removeTag(tag, "occasion")}
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                    <input
                        type="text"
                        onKeyDown={(e) => handleAddTag(e, "occasion")}
                        placeholder="e.g. Wedding, Birthday..."
                        className="w-full bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm outline-none"
                    />
                </div>

                {/* General Tags */}
                <div className="space-y-1.5 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Tags (Press Enter)
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {formData.tags.map((tag, idx) => (
                            <span
                                key={idx}
                                className="flex items-center gap-1 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider"
                            >
                                {tag}{" "}
                                <button type="button" onClick={() => removeTag(tag, "tags")}>
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                    <input
                        type="text"
                        onKeyDown={(e) => handleAddTag(e, "tags")}
                        placeholder="e.g. Trending, Premium..."
                        className="w-full bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm outline-none"
                    />
                </div>
            </div>
        </div>
    );
}
