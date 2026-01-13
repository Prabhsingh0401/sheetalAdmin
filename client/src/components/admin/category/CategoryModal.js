"use client";

import { useState, useEffect } from "react";
import { X, Upload, Loader2, LayoutGrid, Edit3 } from "lucide-react";
import { addCategory, updateCategory, getCategories } from "@/services/categoryService";
import { toast } from "react-hot-toast";
import { IMAGE_BASE_URL } from "@/services/api";

export default function CategoryModal({ isOpen, onClose, onSuccess, initialData = null }) {
    const [loading, setLoading] = useState(false);
    const [parentCategories, setParentCategories] = useState([]);
    const [preview, setPreview] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        parentCategory: "",
        isFeatured: false,
        status: "Active",
        image: null,
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
                image: null,
            });

            if (initialData?.image?.url) {
                // Image URL path fix
                const fullUrl = `${IMAGE_BASE_URL}/${initialData.image.url.replace(/\\/g, '/')}`.replace(/([^:]\/)\/+/g, "$1");
                setPreview(fullUrl);
            } else {
                setPreview(null);
            }
            fetchParents();
        }
    }, [isOpen, initialData]);

    const fetchParents = async () => {
        try {
            const res = await getCategories(1, 100);
            // Current category ko parent list se hatana taaki recursion na ho
            const filtered = res.data.categories.filter(c => c._id !== initialData?._id);
            setParentCategories(filtered);
        } catch (err) { 
            console.error("Failed to fetch parents:", err); 
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) return toast.error("File size should be less than 2MB");
            setFormData({ ...formData, image: file });
            setPreview(URL.createObjectURL(file));
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
        
        // Status ko boolean string mein bhejna taaki backend parse kar sake
        data.append("status", formData.status);

        if (formData.image) data.append("image", formData.image);

        try {
            const res = initialData 
                ? await updateCategory(initialData._id, data) 
                : await addCategory(data);
                
            if (res.success) {
                toast.success(initialData ? "Category Updated!" : "Category Created!");
                onSuccess(); // Table refresh karne ke liye
                onClose();   // Modal close karne ke liye
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
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">

                {/* --- HEADER --- */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 ${initialData ? 'bg-blue-600' : 'bg-slate-900'} text-white rounded-lg`}>
                            {initialData ? <Edit3 size={18} /> : <LayoutGrid size={18} />}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 leading-tight">
                                {initialData ? "Edit Category Details" : "Add New Category"}
                            </h2>
                            <p className="text-xs text-slate-500 font-medium">
                                {initialData ? "Modify the existing category information" : "Create a new category profile"}
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
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    
                    {/* Image Upload Box */}
                    <div className="flex justify-center pb-2">
                        <div className="relative group w-24 h-24">
                            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="cat-img-sharp" />
                            <label htmlFor="cat-img-sharp" className="block w-full h-full rounded-lg border border-slate-400 hover:border-slate-900 transition-all cursor-pointer overflow-hidden relative bg-slate-50">
                                {preview ? (
                                    <img src={preview} alt="preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        <Upload size={20} />
                                        <span className="text-[9px] mt-1 font-bold uppercase">Upload</span>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Category Name */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Category Name</label>
                        <input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Mens Fashion"
                            className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition"
                            required
                        />
                    </div>

                    {/* Parent & Status Row */}
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Parent Category</label>
                            <select
                                value={formData.parentCategory}
                                onChange={(e) => setFormData({ ...formData, parentCategory: e.target.value })}
                                className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none cursor-pointer appearance-none"
                            >
                                <option value="">Main Category</option>
                                {parentCategories.map((cat) => (
                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none cursor-pointer appearance-none"
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    {/* Featured Checkbox */}
                    <div className="flex items-center gap-2 px-1">
                        <input
                            type="checkbox"
                            id="feat-cat"
                            checked={formData.isFeatured}
                            onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                            className="w-4 h-4 accent-slate-900 cursor-pointer"
                        />
                        <label htmlFor="feat-cat" className="text-xs font-bold text-slate-900 uppercase tracking-wider cursor-pointer">
                            Mark as Featured Category
                        </label>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Description</label>
                        <textarea
                            rows="2"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Briefly describe the category..."
                            className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition"
                        ></textarea>
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
                            className={`flex-[2] ${initialData ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-black'} text-white py-2.5 rounded-lg font-bold text-sm transition shadow-lg flex items-center justify-center active:scale-[0.98] disabled:opacity-70`}
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                initialData ? "Update Details" : "Confirm & Add"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}