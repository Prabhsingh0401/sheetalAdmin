"use client";

import React, { useState, useEffect } from "react";
import { Save, Loader2, UploadCloud, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { API_BASE_URL } from "@/services/api";

export default function AboutUsForm() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        bannerImage: null,
        bannerImagePreview: "",
        bannerTitle: "",
        founderImage: null,
        founderImagePreview: "",
        journeyTitle: "",
        journeyDescription: "",
        missionImage: null,
        missionImagePreview: "",
        missionTitle: "",
        missionDescription: "",
        craftImage: null,
        craftImagePreview: "",
        craftTitle: "",
        craftDescription: "",
    });

    useEffect(() => {
        fetchAboutData();
    }, []);

    const fetchAboutData = async () => {
        try {
            const { data } = await axios.get(`${API_BASE_URL}/pages/about`, {
                withCredentials: true
            });
            if (data.success && data.page) {
                const page = data.page;
                setFormData({
                    bannerImage: null,
                    bannerImagePreview: page.banner?.image || "",
                    bannerTitle: page.banner?.title || "",
                    founderImage: null,
                    founderImagePreview: page.journey?.image || "",
                    journeyTitle: page.journey?.title || "",
                    journeyDescription: page.journey?.description || "",
                    missionImage: null,
                    missionImagePreview: page.mission?.image || "",
                    missionTitle: page.mission?.title || "",
                    missionDescription: page.mission?.description || "",
                    craftImage: null,
                    craftImagePreview: page.craft?.image || "",
                    craftTitle: page.craft?.title || "",
                    craftDescription: page.craft?.description || "",
                });
            }
        } catch (error) {
            console.error("Error fetching about page data", error);
            // toast.error("Failed to load data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e, fieldName) => {
        const file = e.target.files[0];
        if (file) {
            setFormData((prev) => ({
                ...prev,
                [fieldName]: file,
                [`${fieldName}Preview`]: URL.createObjectURL(file),
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const data = new FormData();

            // Banner
            if (formData.bannerImage) data.append("bannerImage", formData.bannerImage);
            data.append("bannerTitle", formData.bannerTitle);

            // Journey
            if (formData.founderImage) data.append("founderImage", formData.founderImage);
            data.append("journeyTitle", formData.journeyTitle);
            data.append("journeyDescription", formData.journeyDescription);

            // Mission
            if (formData.missionImage) data.append("missionImage", formData.missionImage);
            data.append("missionTitle", formData.missionTitle);
            data.append("missionDescription", formData.missionDescription);

            // Craft
            if (formData.craftImage) data.append("craftImage", formData.craftImage);
            data.append("craftTitle", formData.craftTitle);
            data.append("craftDescription", formData.craftDescription);

            const res = await axios.post(`${API_BASE_URL}/pages/about`, data, {
                headers: { "Content-Type": "multipart/form-data" },
                withCredentials: true,
            });

            if (res.data.success) {
                toast.success("About Us page updated successfully!");
                fetchAboutData(); // Refresh data to get real URLs
            }
        } catch (error) {
            console.error("Error saving about page", error);
            toast.error(error.response?.data?.message || "Failed to update page");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin" size={32} />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-5xl mx-auto pb-20 text-black">

            {/* Banner Section */}
            <SectionCard title="Hero Banner">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ImageUpload
                        label="Banner Image"
                        preview={formData.bannerImagePreview}
                        onChange={(e) => handleFileChange(e, "bannerImage")}
                    />
                    <div className="space-y-4">
                        <Input
                            label="Banner Title"
                            name="bannerTitle"
                            value={formData.bannerTitle}
                            onChange={handleInputChange}
                            placeholder="e.g. Our Story"
                        />
                    </div>
                </div>
            </SectionCard>

            {/* Journey Section */}
            <SectionCard title="Our Journey (Founder Section)">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ImageUpload
                        label="Founder Image"
                        preview={formData.founderImagePreview}
                        onChange={(e) => handleFileChange(e, "founderImage")}
                    />
                    <div className="space-y-4">
                        <Input
                            label="Section Title"
                            name="journeyTitle"
                            value={formData.journeyTitle}
                            onChange={handleInputChange}
                            placeholder="e.g. Our Journey"
                        />
                        <TextArea
                            label="Description"
                            name="journeyDescription"
                            value={formData.journeyDescription}
                            onChange={handleInputChange}
                            rows={6}
                        />
                    </div>
                </div>
            </SectionCard>

            {/* Mission Section */}
            <SectionCard title="Growth & Mission">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ImageUpload
                        label="Growth Image"
                        preview={formData.missionImagePreview}
                        onChange={(e) => handleFileChange(e, "missionImage")}
                    />
                    <div className="space-y-4">
                        <Input
                            label="Section Title"
                            name="missionTitle"
                            value={formData.missionTitle}
                            onChange={handleInputChange}
                            placeholder="e.g. Custom handpicked styles..."
                        />
                        <TextArea
                            label="Description"
                            name="missionDescription"
                            value={formData.missionDescription}
                            onChange={handleInputChange}
                            rows={6}
                        />
                    </div>
                </div>
            </SectionCard>

            {/* Craftsmanship Section */}
            <SectionCard title="Craftsmanship">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ImageUpload
                        label="Craft Image"
                        preview={formData.craftImagePreview}
                        onChange={(e) => handleFileChange(e, "craftImage")}
                    />
                    <div className="space-y-4">
                        <Input
                            label="Section Title"
                            name="craftTitle"
                            value={formData.craftTitle}
                            onChange={handleInputChange}
                            placeholder="e.g. Craftsmanship At The Core"
                        />
                        <TextArea
                            label="Description"
                            name="craftDescription"
                            value={formData.craftDescription}
                            onChange={handleInputChange}
                            rows={6}
                        />
                    </div>
                </div>
            </SectionCard>

            {/* Save Button */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 md:pl-72 z-10 flex justify-end">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            <span>Saving...</span>
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            <span>Save Changes</span>
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}

// Reusable Components

function SectionCard({ title, children }) {
    return (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-6 border-b border-slate-100 pb-2">
                {title}
            </h3>
            {children}
        </div>
    );
}

function ImageUpload({ label, preview, onChange }) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-bold">{label}</label>
            <div className="relative group border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-all aspect-video flex flex-col items-center justify-center overflow-hidden cursor-pointer">
                {preview ? (
                    <>
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-xs font-bold bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                                Change Image
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center">
                        <UploadCloud size={32} className="mb-2" />
                        <span className="text-xs font-medium">Click to upload</span>
                    </div>
                )}
                <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={onChange}
                />
            </div>
        </div>
    );
}

function Input({ label, name, value, onChange, placeholder }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold">{label}</label>
            <input
                type="text"
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
        </div>
    );
}

function TextArea({ label, name, value, onChange, rows }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold">{label}</label>
            <textarea
                name={name}
                value={value}
                onChange={onChange}
                rows={rows}
                className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
        </div>
    );
}
