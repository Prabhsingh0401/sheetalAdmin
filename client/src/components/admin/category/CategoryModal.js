"use client";

import { useState, useEffect } from "react";
import { X, Upload, Loader2, LayoutGrid, Edit3 } from "lucide-react";
import {
  addCategory,
  updateCategory,
  getCategories,
} from "@/services/categoryService";
import { toast } from "react-hot-toast";
import { IMAGE_BASE_URL } from "@/services/api";

export default function CategoryModal({
  isOpen,
  onClose,
  onSuccess,
  initialData = null,
}) {
  const [loading, setLoading] = useState(false);
  const [parentCategories, setParentCategories] = useState([]);
  const [previewMainImage, setPreviewMainImage] = useState(null);
  const [previewBannerImage, setPreviewBannerImage] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parentCategory: "",
    isFeatured: false,
    status: "Active",
    categoryBanner: "",
    subCategories: [],
    mainImage: null,
    bannerImage: null,
  });

  // Jab modal khule ya initialData change ho
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialData?.name || "",
        description: initialData?.description || "",
        parentCategory: initialData?.parentCategory?._id || "",
        isFeatured: initialData?.isFeatured || false,
        status: initialData?.isActive !== false ? "Active" : "Inactive",
        categoryBanner: initialData?.categoryBanner || "",
        subCategories: initialData?.subCategories || [],
        mainImage: null,
        bannerImage: null,
      });


      if (initialData?.mainImage?.url) {
        const url = initialData.mainImage.url;
        const fullUrl = url.startsWith("http")
          ? url
          : `${IMAGE_BASE_URL}/${url.replace(/\\/g, "/")}`.replace(
            /([^:]\/)\/+/g,
            "$1",
          );
        setPreviewMainImage(fullUrl);
      } else {
        setPreviewMainImage(null);
      }

      if (initialData?.bannerImage?.url) {
        const url = initialData.bannerImage.url;
        const fullUrl = url.startsWith("http")
          ? url
          : `${IMAGE_BASE_URL}/${url.replace(/\\/g, "/")}`.replace(
            /([^:]\/)\/+/g,
            "$1",
          );
        setPreviewBannerImage(fullUrl);
      } else {
        setPreviewBannerImage(null);
      }
      fetchParents();
    }
  }, [isOpen, initialData]);

  const fetchParents = async () => {
    try {
      const res = await getCategories(1, 100);
      const filtered = res.data.categories.filter(
        (c) => c._id !== initialData?._id,
      );
      setParentCategories(filtered);
    } catch (err) {
      console.error("Failed to fetch parents:", err);
    }
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024)
        return toast.error("File size should be less than 2MB");

      setFormData((prev) => ({ ...prev, [fieldName]: file }));

      if (fieldName === "mainImage") {
        setPreviewMainImage(URL.createObjectURL(file));
      } else if (fieldName === "bannerImage") {
        setPreviewBannerImage(URL.createObjectURL(file));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description);
    data.append("parentCategory", formData.parentCategory || "");
    data.append("isFeatured", formData.isFeatured);
    data.append("status", formData.status);
    data.append("categoryBanner", formData.categoryBanner); // Append categoryBanner text field
    data.append("subCategories", JSON.stringify(formData.subCategories));


    if (formData.mainImage) data.append("mainImage", formData.mainImage);
    if (formData.bannerImage) data.append("bannerImage", formData.bannerImage);

    try {
      const res = initialData
        ? await updateCategory(initialData._id, data)
        : await addCategory(data);

      if (res.success) {
        toast.success(initialData ? "Category Updated!" : "Category Created!");
        onSuccess();
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-[100] p-4 transition-all">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200">
        {/* --- HEADER --- */}
        <div className="px-6 py-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 ${initialData ? "bg-blue-600" : "bg-slate-900"} text-white rounded-lg`}
            >
              {initialData ? <Edit3 size={18} /> : <LayoutGrid size={18} />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                {initialData ? "Edit Category Details" : "Add New Category"}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {initialData
                  ? "Modify the existing category information"
                  : "Create a new category profile"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 p-1.5 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* --- FORM --- */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Image Upload Boxes */}
          <div className="flex space-x-20">
            <div className="grid grid-cols-1 gap-4 pb-2 ml-2">
              {/* Main Image Upload Box */}
              <div className="flex flex-col items-center">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 text-center">
                  Main Image
                </label>
                <div className="relative group w-24 h-24">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "mainImage")}
                    className="hidden"
                    id="main-cat-img"
                  />
                  <label
                    htmlFor="main-cat-img"
                    className="block w-full h-full rounded-lg border border-slate-400 hover:border-slate-900 transition-all cursor-pointer overflow-hidden relative bg-slate-50"
                  >
                    {previewMainImage ? (
                      <img
                        src={previewMainImage}
                        alt="Main Image Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <Upload size={20} />
                        <span className="text-[9px] mt-1 font-bold uppercase">
                          Main Image
                        </span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Banner Image Upload Box */}
              <div className="flex flex-col items-center">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 text-center">
                  Banner Image
                </label>
                <div className="relative group w-24 h-24">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "bannerImage")}
                    className="hidden"
                    id="banner-cat-img"
                  />
                  <label
                    htmlFor="banner-cat-img"
                    className="block w-full h-full rounded-lg border border-slate-400 hover:border-slate-900 transition-all cursor-pointer overflow-hidden relative bg-slate-50"
                  >
                    {previewBannerImage ? (
                      <img
                        src={previewBannerImage}
                        alt="Banner Image Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <Upload size={20} />
                        <span className="text-[9px] mt-1 font-bold uppercase">
                          Banner Image
                        </span>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>
            <div className="w-full">
              {/* Category Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Category Name
                </label>
                <input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Mens Fashion"
                  className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition"
                  required
                />
              </div>

              {/* Category Banner Text Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Category Banner Text
                </label>
                <input
                  value={formData.categoryBanner}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryBanner: e.target.value })
                  }
                  placeholder="e.g. Elegant Sarees for Every Occasion"
                  className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition"
                />
              </div>

              {/* Parent & Status Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none cursor-pointer appearance-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Briefly describe the category..."
                  className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition"
                ></textarea>
              </div>

              {/* Subcategories */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Subcategories
                </label>
                <div className="flex gap-2">
                  <input
                    id="subcategory-input"
                    placeholder="Add subcategory..."
                    className="flex-1 bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const val = e.target.value.trim();
                        if (val && !formData.subCategories.includes(val)) {
                          setFormData((prev) => ({
                            ...prev,
                            subCategories: [...prev.subCategories, val],
                          }));
                          e.target.value = "";
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById("subcategory-input");
                      const val = input.value.trim();
                      if (val && !formData.subCategories.includes(val)) {
                        setFormData((prev) => ({
                          ...prev,
                          subCategories: [...prev.subCategories, val],
                        }));
                        input.value = "";
                      }
                    }}
                    className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black transition"
                  >
                    Add
                  </button>
                </div>
                {formData.subCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.subCategories.map((sub, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full text-xs font-medium text-slate-700 border border-slate-200"
                      >
                        {sub}
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              subCategories: prev.subCategories.filter(
                                (_, i) => i !== index,
                              ),
                            }))
                          }
                          className="ml-1 text-slate-400 hover:text-rose-500"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* --- ACTIONS --- */}
              <div className="pt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-slate-400 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-[2] ${initialData ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-900 hover:bg-black"} text-white py-2.5 rounded-lg font-bold text-sm transition shadow-lg flex items-center justify-center active:scale-[0.98] disabled:opacity-70`}
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : initialData ? (
                    "Update Details"
                  ) : (
                    "Confirm & Add"
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
