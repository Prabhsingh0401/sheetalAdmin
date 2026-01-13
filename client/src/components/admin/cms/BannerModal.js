"use client";

import { useState, useEffect } from "react";
import { X, Upload, Loader2, ImageIcon, Edit3, Smartphone, Monitor, CheckCircle2 } from "lucide-react";
import { addBanner, updateBanner } from "@/services/bannerService";
import toast from "react-hot-toast";
import { IMAGE_BASE_URL } from "@/services/api";

export default function BannerModal({ isOpen, onClose, onSuccess, initialData }) {
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);

    const isEdit = !!initialData;

    const [formData, setFormData] = useState({
        title: "",
        link: "/",
        order: 0,
        status: "Active",
        deviceType: "Desktop"
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    title: initialData.title || "",
                    link: initialData.link || "/",
                    order: initialData.order || 0,
                    status: initialData.status || "Active",
                    deviceType: initialData.deviceType || "Desktop"
                });
                if (initialData?.image?.url) {
                    const fullUrl = `${IMAGE_BASE_URL}/${initialData.image.url.replace(/\\/g, '/')}`.replace(/([^:]\/)\/+/g, "$1");
                    setPreview(fullUrl);
                } else {
                    setPreview(null);
                }
            } else {
                setFormData({ title: "", link: "/", order: 0, status: "Active", deviceType: "Desktop" });
                setPreview("");
                setSelectedFile(null);
            }
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) return toast.error("File too large (Max 5MB)");
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        data.append("title", formData.title);
        data.append("link", formData.link);
        data.append("order", formData.order);
        data.append("status", formData.status);
        data.append("deviceType", formData.deviceType);

        if (selectedFile) data.append("image", selectedFile);

        try {
            const res = isEdit ? await updateBanner(initialData._id, data) : await addBanner(data);
            if (res.success) {
                toast.success(isEdit ? "Banner Updated!" : "Banner Created!");
                onSuccess();
                onClose();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Operation failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-[100] p-4 transition-all">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">

                {/* --- HEADER (Category Style) --- */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 ${isEdit ? 'bg-blue-600' : 'bg-slate-900'} text-white rounded-lg`}>
                            {isEdit ? <Edit3 size={18} /> : <ImageIcon size={18} />}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 leading-tight">
                                {isEdit ? "Edit Banner Details" : "Add New Banner"}
                            </h2>
                            <p className="text-xs text-slate-500 font-medium">
                                {isEdit ? "Modify existing slide information" : "Create a new homepage slider"}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 p-1.5 rounded-lg transition">
                        <X size={20} />
                    </button>
                </div>

                {/* --- FORM --- */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* Image Preview Area (Sharp Style) */}
                    <div className="flex justify-center pb-2">
                        <div className="relative group w-full aspect-video max-w-[280px]">
                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="banner-img-input" />
                            <label htmlFor="banner-img-input" className="block w-full h-full rounded-lg border border-slate-400 hover:border-slate-900 transition-all cursor-pointer overflow-hidden relative bg-slate-50 shadow-inner">
                                {preview ? (
                                    <img src={preview} alt="preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        <Upload size={24} />
                                        <span className="text-[10px] mt-2 font-bold uppercase tracking-wider">Select Banner Image</span>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Banner Title */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Banner Title</label>
                        <input
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Summer Collection Sale"
                            className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition"
                        />
                    </div>

                    {/* Device & Status Row */}
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Device Visibility</label>
                            <select
                                value={formData.deviceType}
                                onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })}
                                className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 focus:border-slate-900 outline-none cursor-pointer appearance-none"
                            >
                                <option value="Desktop">Desktop Only</option>
                                <option value="Mobile">Mobile Only</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 focus:border-slate-900 outline-none cursor-pointer appearance-none"
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    {/* Order & Link Row */}
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Sort Order</label>
                            <input
                                type="number"
                                value={formData.order}
                                onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                                className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 focus:border-slate-900 outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Redirect Link</label>
                            <input
                                value={formData.link}
                                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                placeholder="/"
                                className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 focus:border-slate-900 outline-none transition"
                            />
                        </div>
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
                            className={`flex-[2] ${isEdit ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-black'} text-white py-2.5 rounded-lg font-bold text-sm transition shadow-lg flex items-center justify-center active:scale-[0.98] disabled:opacity-70`}
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                isEdit ? "Update Details" : "Confirm & Add"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}