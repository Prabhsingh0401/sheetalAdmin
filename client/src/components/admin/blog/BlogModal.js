"use client";

import { useState, useEffect } from "react";
import { X, Newspaper, Edit3, Loader2, Info } from "lucide-react";
import { addBlog, updateBlog } from "@/services/blogService";
import { toast } from "react-hot-toast";
import { IMAGE_BASE_URL } from "@/services/api";
import TiptapEditor from "@/components/TiptapEditor";

export default function BlogModal({ isOpen, onClose, onSuccess, initialData = null }) {
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);

    const [formData, setFormData] = useState({
        title: "",
        content: "",
        excerpt: "",
        category: "",
        tags: "",
        isPublished: true,
        status: "Active",
        bannerImage: null,
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                title: initialData?.title || "",
                content: initialData?.content || "",
                excerpt: initialData?.excerpt || "",
                category: initialData?.category || "",
                tags: initialData?.tags?.join(", ") || "",
                isPublished: initialData?.isPublished ?? true,
                status: initialData?.status || "Active",
                bannerImage: null,
            });

            if (initialData?.bannerImage) {
                const fullUrl = `${IMAGE_BASE_URL}/${initialData.bannerImage.replace(/\\/g, '/')}`.replace(/([^:]\/)\/+/g, "$1");
                setPreview(fullUrl);
            } else {
                setPreview(null);
            }
        }
    }, [isOpen, initialData]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 3 * 1024 * 1024) return toast.error("File size should be less than 3MB");
            setFormData({ ...formData, bannerImage: file });
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.content || formData.content === '<p></p>') return toast.error("Content is required");

        setLoading(true);
        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (key === 'bannerImage') {
                if (formData[key]) data.append(key, formData[key]);
            } else {
                data.append(key, formData[key]);
            }
        });

        try {
            const res = initialData ? await updateBlog(initialData._id, data) : await addBlog(data);
            if (res.success) {
                toast.success(initialData ? "Blog Updated!" : "Blog Published!");
                onSuccess();
                onClose();
            }
        } catch (err) {
            // toast.error(err.response?.data?.message || "Something went wrong");
            const errorMessage = err.message || "Something went wrong";

            toast.error(errorMessage);
            console.error("Submission error:", err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[95vh]">

                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 ${initialData ? 'bg-blue-600' : 'bg-slate-900'} text-white rounded-lg`}>
                            {initialData ? <Edit3 size={18} /> : <Newspaper size={18} />}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 leading-tight">
                                {initialData ? "Edit Blog Post" : "Add New Blog"}
                            </h2>
                            <p className="text-xs text-slate-500 font-medium">
                                {initialData ? "Modify existing blog content and settings" : "Create a new story for your audience"}
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

                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Cover Image</label>
                        <div className="flex items-center gap-4">
                            <div className="w-24 h-24 rounded-lg border border-slate-400 overflow-hidden bg-slate-50 flex-shrink-0">
                                {preview ? (
                                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-300">
                                        <Newspaper size={24} />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-black cursor-pointer"
                                />
                                <p className="text-[10px] text-slate-400 mt-2 italic font-medium">Recommended size: 1200x630px (Max 3MB)</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Blog Title</label>
                        <input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. 5 Tips for Better Web Design"
                            className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Category</label>
                            <input
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                placeholder="e.g. Technology"
                                className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none cursor-pointer transition appearance-none"
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Short Summary (Excerpt)</label>
                        <textarea
                            rows="2"
                            value={formData.excerpt}
                            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                            placeholder="Briefly describe what this blog is about..."
                            className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 shadow-sm"
                            maxLength={200}
                        />
                        <p className="text-[10px] text-right text-slate-400 mt-1">
                            {formData.excerpt.length}/200 characters
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Main Content</label>
                        <div className="border border-slate-400 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-slate-900 focus-within:border-slate-900 transition">
                            <TiptapEditor
                                value={formData.content}
                                onChange={(html) => setFormData({ ...formData, content: html })}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Tags</label>
                            <input
                                value={formData.tags}
                                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                placeholder="react, tailwind, coding..."
                                className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition"
                            />
                        </div>

                        <div className="flex items-center gap-2 px-1">
                            <input
                                type="checkbox"
                                id="isPublished"
                                checked={formData.isPublished}
                                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                                className="w-4 h-4 accent-slate-900 cursor-pointer"
                            />
                            <label htmlFor="isPublished" className="text-xs font-bold text-slate-900 uppercase tracking-wider cursor-pointer">
                                Publish to website immediately
                            </label>
                        </div>
                    </div>
                </form>

                <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-3 bg-white">
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
                        onClick={handleSubmit}
                        className={`flex-[2] ${initialData ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-black'} text-white py-2.5 rounded-lg font-bold text-sm transition shadow-lg active:scale-[0.98] disabled:opacity-70 flex items-center justify-center`}
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : (initialData ? "Update Blog" : "Confirm & Add Blog")}
                    </button>
                </div>
            </div>
        </div>
    );
}