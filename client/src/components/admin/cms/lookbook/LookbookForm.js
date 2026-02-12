import React, { useState, useEffect } from "react";
import { PlusSquare, Trash2, Images, Save, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { API_BASE_URL } from "@/services/api";

export default function LookbookForm() {
    const [leftSliderImages, setLeftSliderImages] = useState([]);
    const [rightSliderImages, setRightSliderImages] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const SLUG = "timeless-women";

    // Fetch initial data
    useEffect(() => {
        const fetchLookbook = async () => {
            try {
                const { data } = await axios.get(
                    `${API_BASE_URL}/lookbooks/${SLUG}`,
                    { withCredentials: true } // Important for cookies
                );
                if (data.success && data.lookbook) {
                    setLeftSliderImages(data.lookbook.leftSliderImages || []);
                    setRightSliderImages(data.lookbook.rightSliderImages || []);
                }
            } catch (error) {
                console.error("Error fetching lookbook:", error);
                // Don't show error toast on 404/null as it might be new
            } finally {
                setIsLoading(false);
            }
        };

        fetchLookbook();
    }, []);

    // Helper to handle file uploads
    const handleImageUpload = (e, setImages) => {
        const newFiles = Array.from(e.target.files);
        if (newFiles.length > 0) {
            const newImages = newFiles.map((file) => ({
                url: URL.createObjectURL(file), // Temporary preview URL
                file: file, // Keep the file for upload later
                isNew: true,
            }));
            setImages((prev) => [...prev, ...newImages]);
            toast.success(`${newFiles.length} image(s) added`);
        }
    };

    // Helper to remove images
    const removeImage = (index, setImages) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setIsSaving(true);
        const formData = new FormData();

        // Separate existing vs new files
        const existingLeft = leftSliderImages.filter((img) => !img.isNew);
        const newLeft = leftSliderImages.filter((img) => img.isNew);

        const existingRight = rightSliderImages.filter((img) => !img.isNew);
        const newRight = rightSliderImages.filter((img) => img.isNew);

        // Append existing images as JSON string
        formData.append("existingLeftImages", JSON.stringify(existingLeft));
        formData.append("existingRightImages", JSON.stringify(existingRight));

        // Append new files
        newLeft.forEach((img) => {
            formData.append("leftImages", img.file);
        });

        newRight.forEach((img) => {
            formData.append("rightImages", img.file);
        });

        formData.append("title", "Timeless Women Collection");

        try {
            const { data } = await axios.post(
                `${API_BASE_URL}/lookbooks/${SLUG}`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                    withCredentials: true, // Send cookies
                }
            );

            if (data.success) {
                toast.success("Lookbook updated successfully!");
                // Update state with returned data to clear "isNew" flags and get real URLs
                setLeftSliderImages(data.lookbook.leftSliderImages);
                setRightSliderImages(data.lookbook.rightSliderImages);

                // Revoke old object URLs to avoid memory leaks (optional but good practice)
                // Note: In a real app we might want to track looking for created URLs
            }
        } catch (error) {
            console.error("Error saving lookbook:", error);
            toast.error(
                error.response?.data?.message || "Failed to update lookbook"
            );
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-slate-400" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Left Slider Section */}
            <ImageSection
                title="Left Slider Images"
                description="Manage images for the left-side carousel in the lookbook."
                images={leftSliderImages}
                setImages={setLeftSliderImages}
                onUpload={(e) => handleImageUpload(e, setLeftSliderImages)}
                onRemove={(index) => removeImage(index, setLeftSliderImages)}
                color="blue"
            />

            {/* Right Slider Section */}
            <ImageSection
                title="Right Slider Images"
                description="Manage images for the right-side carousel in the lookbook."
                images={rightSliderImages}
                setImages={setRightSliderImages}
                onUpload={(e) => handleImageUpload(e, setRightSliderImages)}
                onRemove={(index) => removeImage(index, setRightSliderImages)}
                color="purple"
            />

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-slate-200">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
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
        </div>
    );
}

function ImageSection({
    title,
    description,
    images,
    onUpload,
    onRemove,
    color,
}) {
    const colors = {
        blue: "border-blue-500 ring-blue-500",
        purple: "border-purple-500 ring-purple-500",
    };

    // Dynamic color classes for badges/buttons
    const btnColor =
        color === "blue"
            ? "bg-blue-600 hover:bg-blue-700"
            : "bg-purple-600 hover:bg-purple-700";

    return (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase">
                        {title}
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">{description}</p>
                </div>
                <label
                    className={`group flex items-center gap-2 ${btnColor} text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md active:scale-95`}
                >
                    <PlusSquare
                        size={16}
                        className="text-white/80 group-hover:text-white"
                    />
                    <span>Add Images</span>
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={onUpload}
                    />
                </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {images.map((img, i) => (
                    <div
                        key={i}
                        className={`aspect-square rounded-2xl overflow-hidden bg-white border-2 relative group shadow-sm transition-all animate-in zoom-in-95 duration-200 ${colors[color] ? colors[color] : "border-slate-200"}`}
                    >
                        <img
                            src={img.url}
                            alt={`Upload ${i}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                        {img.isNew && (
                            <div
                                className={`absolute top-2 left-2 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase shadow-sm ${color === "blue" ? "bg-blue-500" : "bg-purple-500"}`}
                            >
                                New
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => onRemove(i)}
                            className="absolute top-2 right-2 bg-white/90 backdrop-blur text-rose-500 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-rose-500 hover:text-white"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}

                {images.length === 0 && (
                    <div className="col-span-full py-10 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        <Images size={40} strokeWidth={1} />
                        <p className="text-[10px] font-bold mt-2 uppercase tracking-widest text-slate-400">
                            No images added
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
