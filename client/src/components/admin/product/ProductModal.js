"use client";
import { useState, useEffect } from "react";
import { X, Package, Trash2, Save, Plus, Layers, Image as ImageIcon, Settings, Info, CheckCircle, Shirt, Search, Share2, Star, MousePointerClick, Video, LayoutDashboard, UploadCloud, MousePointer2, PlusSquare, Images, Film, CheckCircle2 } from "lucide-react";
import { createProduct, updateProduct } from "@/services/productService";
import { getCategories } from "@/services/categoryService";
import TiptapEditor from "@/components/TiptapEditor";
import toast from "react-hot-toast";
import { IMAGE_BASE_URL } from "@/services/api";

export default function ProductModal({ isOpen, onClose, onSuccess, initialData = null }) {
    const [activeTab, setActiveTab] = useState("basic");
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [imageFiles, setImageFiles] = useState([]);
    const [existingImages, setExistingImages] = useState([]);

    const emptyVariant = {
        v_sku: "",
        color: { name: "", code: "#000000", swatchImage: "" },
        sizes: [{ name: "", stock: 0 }],
        v_price: 0,
        v_discountPrice: 0,
        v_image: ""
    };

    const [formData, setFormData] = useState({
        name: "", sku: "", shortDescription: "", description: "", materialCare: "", price: 0, discountPrice: 0, gstPercent: 0,
        stock: 0, category: "", status: "Active", displayCollections: [], variants: [], specifications: [], keyBenefits: [], eventTags: [],
        brandInfo: "", metaTitle: "", metaDescription: "", metaKeywords: "", ogImage: "", canonicalUrl: "",
        brandInfo: "", returnPolicy: "7 Days Easy Return",
        mainImage: { url: "", alt: "" }, hoverImage: { url: "", alt: "" }, mainImageFile: null, hoverImageFile: null, videoFile: null,
    });

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
            if (initialData) {
                const variants = Array.isArray(initialData.variants) ? initialData.variants.map(v => ({...v, sizes: Array.isArray(v.sizes) ? v.sizes : []})) : [];
                setFormData({
                    ...initialData,
                    category: initialData.category?._id || initialData.category || "",
                    displayCollections: Array.isArray(initialData.displayCollections) ? initialData.displayCollections : [],
                    variants: variants,
                    specifications: Array.isArray(initialData.specifications) ? initialData.specifications : [],
                    keyBenefits: Array.isArray(initialData.keyBenefits) ? initialData.keyBenefits : [],
                    eventTags: Array.isArray(initialData.eventTags) ? initialData.eventTags : [],
                    returnPolicy: initialData.returnPolicy || "7 Days Easy Return"
                });
                setExistingImages(initialData.images || []);
                setImageFiles([]);
            } else {
                resetForm();
            }
        }
    }, [initialData, isOpen]);

    const fetchCategories = async () => {
        try {
            const res = await getCategories();
            const actualArray = res?.categories?.categories || res?.data?.categories || [];
            setCategories(Array.isArray(actualArray) ? actualArray : []);
        } catch (err) { setCategories([]); }
    };

    const resetForm = () => {
        setFormData({
            name: "", sku: "", shortDescription: "", description: "", price: 0, discountPrice: 0,
            gstPercent: 0, stock: 0, category: "", status: "Active", displayCollections: [], variants: [],
            specifications: [], keyBenefits: [], eventTags: [], brandInfo: "", returnPolicy: "7 Days Easy Return"
        });
        setImageFiles([]); setExistingImages([]);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const handleAddTag = (e, field) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = e.target.value.trim();
            if (value && !formData[field].includes(value)) {
                setFormData(prev => ({
                    ...prev,
                    [field]: [...prev[field], value]
                }));
                e.target.value = "";
            }
        }
    };

    const removeTag = (tagToRemove, field) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter(tag => tag !== tagToRemove)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Frontend validation for MRP vs Selling Price
        if (formData.price <= formData.discountPrice && formData.discountPrice > 0) {
            toast.error("MRP Price must be greater than Selling Price (Discount Price).");
            return;
        }

        setLoading(true);
        try {
            const data = new FormData();

            const excludedKeys = [
                "mainImage", "hoverImage", "video", "ogImage",
                "mainImageFile", "hoverImageFile", "videoFile",
                "images", "existingImages", "variants",
                "sizeChart", "category", "brand"
            ];

            Object.keys(formData).forEach(key => {
                if (['specifications', 'keyBenefits', 'eventTags', 'displayCollections'].includes(key)) {
                    data.append(key, JSON.stringify(formData[key] || []));
                }
                else if (!excludedKeys.includes(key)) {
                    if (formData[key] !== null && formData[key] !== undefined) {
                        data.append(key, formData[key]);
                    }
                }
            });

            ['sizeChart', 'category', 'brand'].forEach(field => {
                if (formData[field] && formData[field] !== "null" && formData[field] !== "") {
                    const value = typeof formData[field] === 'object' ? formData[field]._id : formData[field];
                    data.append(field, value);
                }
            });

            const cleanedVariants = formData.variants.map((v) => {
                if (v.v_image instanceof File) {
                    data.append("variantImages", v.v_image);
                    return { ...v, hasNewImage: true };
                }
                return { ...v, hasNewImage: false };
            });
            data.append("variants", JSON.stringify(cleanedVariants));

            if (formData.mainImageFile) {
                data.append("mainImage", formData.mainImageFile);
            } else if (formData.mainImage?.url) {
                data.append("existingMainImage", formData.mainImage.url);
            }
            data.append("mainImageAlt", formData.mainImage?.alt || "");

            if (formData.hoverImageFile) {
                data.append("hoverImage", formData.hoverImageFile);
            } else if (formData.hoverImage?.url) {
                data.append("existingHoverImage", formData.hoverImage.url);
            }
            data.append("hoverImageAlt", formData.hoverImage?.alt || "");

            if (formData.videoFile) {
                data.append("video", formData.videoFile);
            } else if (typeof formData.video === 'string') {
                data.append("existingVideo", formData.video);
            }

            if (imageFiles && imageFiles.length > 0) {
                imageFiles.forEach(file => data.append("images", file));
            }
            data.append("existingImages", JSON.stringify(existingImages || []));

            if (formData.ogImage instanceof File) {
                data.append("ogImage", formData.ogImage);
            } else if (typeof formData.ogImage === 'string' && formData.ogImage !== "") {
                data.append("existingOgImage", formData.ogImage);
            }

            const result = initialData
                ? await updateProduct(initialData._id, data)
                : await createProduct(data);

            if (result.success) {
                toast.success(result.message || (initialData ? "Product updated 🎉" : "Product created 🚀"));
                if (onSuccess) onSuccess();
                onClose();
            }
        } catch (error) {
            console.error("Product Save Error:", error);
            toast.error(error.message || "Failed to save product");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-[100] p-4 text-left">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">

                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 ${initialData ? 'bg-blue-600' : 'bg-slate-900'} text-white rounded-lg shadow-sm`}>
                            <Package size={18} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 leading-tight">
                                {initialData ? "Edit Product Details" : "Add New Inventory"}
                            </h2>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                                {initialData ? "Modify clothing item details" : "Add new clothes to store"}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 p-1.5 rounded-lg transition"><X size={20} /></button>
                </div>

                <div className="bg-white px-4 sm:px-8 border-b border-slate-100">
                    <div className="flex gap-4 sm:gap-8 overflow-x-auto no-scrollbar scroll-smooth snap-x">
                        {[
                            { id: 'basic', label: 'Basic', fullLabel: 'Basic Info', icon: <Settings size={16} /> },
                            { id: 'inventory', label: 'Stock', fullLabel: 'Variants & Stock', icon: <Layers size={16} /> },
                            { id: 'specs', label: 'Specs', fullLabel: 'Details & Care', icon: <Shirt size={16} /> },
                            { id: 'seo', label: 'SEO & Meta', fullLabel: 'SEO & Meta', icon: <Search size={14} /> },
                            { id: 'media', label: 'Media', fullLabel: 'Media Assets', icon: <ImageIcon size={16} /> }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-4 flex-shrink-0 flex items-center gap-2 transition-all relative snap-align-start${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <span className={`${activeTab === tab.id ? 'scale-110' : ''} transition-transform`}>{tab.icon}</span>
                                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest whitespace-nowrap">
                                    <span className="inline sm:hidden">{tab.label}</span>
                                    <span className="hidden sm:inline">{tab.fullLabel}</span>
                                </span>
                                {activeTab === tab.id && (<div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full animate-in fade-in slide-in-from-bottom-1 duration-300" />)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-white scrollbar-thin">
                    <form id="productForm" onSubmit={handleSubmit} className="space-y-6">

                        {activeTab === "basic" && (
                            <div className="space-y-5 animate-in fade-in duration-300">
                                <InputField label="Product Title" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Cotton Slim Fit Shirt" required maxLength={150} />

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Short Description (Summary)</label>
                                    <textarea name="shortDescription" value={formData.shortDescription} onChange={handleChange} placeholder="Write a brief summary for product cards..." className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 focus:border-slate-900 outline-none shadow-sm min-h-[80px]" required />
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Category</label>
                                        <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 focus:border-slate-900 outline-none cursor-pointer appearance-none shadow-sm">
                                            <option value="">Choose Category</option>
                                            {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Status</label>
                                        <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 focus:border-slate-900 outline-none shadow-sm">
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <InputField label="SKU Code" name="sku" value={formData.sku} onChange={handleChange} placeholder="CLOTH-001" required />
                                    <InputField label="GST %" name="gstPercent" type="number" value={formData.gstPercent} onChange={handleChange} />
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <InputField label="MRP Price (₹)" name="price" type="number" value={formData.price} onChange={handleChange} required />
                                    <InputField label="Selling Price (₹)" name="discountPrice" type="number" value={formData.discountPrice} onChange={handleChange} />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Full Description</label>
                                    <TiptapEditor
                                        value={formData.description}
                                        onChange={(content) => setFormData(prev => ({ ...prev, description: content }))}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Material & Care Instructions</label>
                                    <TiptapEditor
                                        value={formData.materialCare}
                                        onChange={(content) => setFormData(prev => ({ ...prev, materialCare: content }))}
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-5">
                                    {/* <div className="space-y-1.5 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300">
                                        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Display Collections (Press Enter to add)</label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {formData.displayCollections.map((tag, idx) => (
                                                <span key={idx} className="flex items-center gap-1 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                                                    {tag} <button type="button" onClick={() => removeTag(tag, 'displayCollections')}><X size={12} /></button>
                                                </span>
                                            ))}
                                        </div>
                                        <input
                                            type="text"
                                            onKeyDown={(e) => handleAddTag(e, 'displayCollections')}
                                            placeholder="e.g. Featured, Deal of Day..."
                                            className="w-full bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm outline-none"
                                        />
                                    </div> */}

                                    {/* <div className="space-y-1.5 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300">
                                        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Event Tags (Press Enter to add)</label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {formData.eventTags.map((tag, idx) => (
                                                <span key={idx} className="flex items-center gap-1 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                                                    {tag} <button type="button" onClick={() => removeTag(tag, 'eventTags')}><X size={12} /></button>
                                                </span>
                                            ))}
                                        </div>
                                        <input
                                            type="text"
                                            onKeyDown={(e) => handleAddTag(e, 'eventTags')}
                                            placeholder="Press Enter..."
                                            className="w-full bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm outline-none"
                                        />
                                    </div> */}
                                </div>
                            </div>
                        )}

                        {activeTab === "inventory" && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                {/* <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm">
                                    <InputField label="Total Master Stock" name="stock" type="number" value={formData.stock} onChange={handleChange} placeholder="Total units available" />
                                </div> */}

                                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-md">
                                    <div className="bg-slate-900 px-5 py-4 flex justify-between items-center text-white">
                                        <div className="flex items-center gap-3">
                                            <Layers size={20} className="text-blue-400" />
                                            <div>
                                                <h3 className="text-sm font-bold uppercase tracking-wider">Manage Variants</h3>
                                                <p className="text-[10px] text-slate-400">Configure size, color, and specific images</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(p => ({ ...p, variants: [...p.variants, { ...emptyVariant }] }))}
                                            className="bg-white text-slate-900 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition flex items-center gap-2 text-xs font-bold"
                                        >
                                            <Plus size={16} /> Add Variant
                                        </button>
                                    </div>

                                    <div className="p-5 space-y-6">
                                        {formData.variants.map((v, i) => (
                                            <div key={i} className="group p-5 bg-slate-50 border border-slate-200 rounded-2xl relative hover:border-slate-400 transition-all">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, variants: formData.variants.filter((_, idx) => idx !== i) })}
                                                    className="absolute -top-2 -right-2 bg-rose-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                                >
                                                    <Trash2 size={14} />
                                                </button>

                                                                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Variant SKU</label>
                                                        <input
                                                            className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-xs font-bold uppercase focus:ring-2 focus:ring-slate-900 outline-none"
                                                            placeholder="e.g. TSHIRT-RED"
                                                            value={v.v_sku}
                                                            onChange={(e) => {
                                                                const up = [...formData.variants];
                                                                up[i].v_sku = e.target.value.toUpperCase();
                                                                setFormData({ ...formData, variants: up });
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Color Name</label>
                                                        <input
                                                            className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-xs font-medium"
                                                            placeholder="Red, Navy..."
                                                            value={v.color?.name}
                                                            onChange={(e) => {
                                                                const up = [...formData.variants];
                                                                up[i].color.name = e.target.value;
                                                                setFormData({ ...formData, variants: up });
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Color Hex</label>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="color"
                                                                className="w-10 h-9 border-none bg-transparent cursor-pointer"
                                                                value={v.color?.code}
                                                                onChange={(e) => {
                                                                    const up = [...formData.variants];
                                                                    up[i].color.code = e.target.value;
                                                                    setFormData({ ...formData, variants: up });
                                                                }}
                                                            />
                                                            <input
                                                                className="flex-1 bg-white border border-slate-300 px-2 py-2 rounded-lg text-[10px] font-mono uppercase"
                                                                value={v.color?.code}
                                                                onChange={(e) => {
                                                                    const up = [...formData.variants];
                                                                    up[i].color.code = e.target.value;
                                                                    setFormData({ ...formData, variants: up });
                                                                }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Variant Image</label>
                                                        <div className="flex items-center gap-3">
                                                            {v.v_image ? (
                                                                <div className="relative w-10 h-10 rounded border border-slate-300 overflow-hidden bg-white">
                                                                    <img
                                                                        src={
                                                                            v.v_image instanceof File
                                                                                ? URL.createObjectURL(v.v_image)
                                                                                : v.v_image
                                                                                    ? `${IMAGE_BASE_URL}/${v.v_image.url || v.v_image}`
                                                                                    : "/placeholder.png"
                                                                        }
                                                                        className="w-full h-full object-cover"
                                                                        alt="variant-preview"
                                                                        onError={(e) => {
                                                                            e.target.onerror = null;
                                                                            e.target.src = "/placeholder.png";
                                                                        }}
                                                                    />
                                                                    <button
                                                                        onClick={() => {
                                                                            const up = [...formData.variants]; up[i].v_image = ""; setFormData({ ...formData, variants: up });
                                                                        }}
                                                                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition text-white"
                                                                    >
                                                                        <X size={12} />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <label className="w-10 h-10 flex items-center justify-center border-2 border-dashed border-slate-300 rounded cursor-pointer hover:bg-white transition text-slate-400">
                                                                    <Plus size={14} />
                                                                    <input
                                                                        type="file"
                                                                        className="hidden"
                                                                        onChange={(e) => {
                                                                            const up = [...formData.variants];
                                                                            up[i].v_image = e.target.files[0];
                                                                            setFormData({ ...formData, variants: up });
                                                                        }}
                                                                    />
                                                                </label>
                                                            )}
                                                            <span className="text-[9px] text-slate-400 leading-tight">Image for this color</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-4 pt-4 border-t border-slate-200">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Sizes for this variant</label>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const up = [...formData.variants];
                                                                up[i].sizes.push({ name: "", stock: 0 });
                                                                setFormData({ ...formData, variants: up });
                                                            }}
                                                            className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold"
                                                        >
                                                            Add Size
                                                        </button>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {v.sizes.map((s, s_idx) => (
                                                            <div key={s_idx} className="flex items-center gap-2">
                                                                <input
                                                                    className="w-1/2 bg-white border border-slate-300 px-3 py-2 rounded-lg text-xs"
                                                                    placeholder="e.g. M, L, XL"
                                                                    value={s.name}
                                                                    onChange={(e) => {
                                                                        const up = [...formData.variants];
                                                                        up[i].sizes[s_idx].name = e.target.value;
                                                                        setFormData({ ...formData, variants: up });
                                                                    }}
                                                                />
                                                                <input
                                                                    className="w-1/2 bg-white border border-slate-300 px-3 py-2 rounded-lg text-xs"
                                                                    placeholder="Stock"
                                                                    type="number"
                                                                    value={s.stock}
                                                                    onChange={(e) => {
                                                                        const up = [...formData.variants];
                                                                        up[i].sizes[s_idx].stock = Number(e.target.value);
                                                                        setFormData({ ...formData, variants: up });
                                                                    }}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const up = [...formData.variants];
                                                                        up[i].sizes.splice(s_idx, 1);
                                                                        setFormData({ ...formData, variants: up });
                                                                    }}
                                                                    className="text-red-500"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {formData.variants.length === 0 && (
                                            <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                                <Shirt size={48} className="mx-auto text-slate-300 mb-3" />
                                                <p className="text-slate-500 text-sm font-medium">No variants added yet</p>
                                                <p className="text-slate-400 text-xs">Click the button above to add sizes and colors</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "specs" && (
                            <div className="space-y-8 animate-in fade-in duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <InputField label="Brand Information" name="brandInfo" value={formData.brandInfo} onChange={handleChange} placeholder="e.g. Levi's Premium" />
                                    <InputField label="Return Policy" name="returnPolicy" value={formData.returnPolicy} onChange={handleChange} placeholder="e.g. 7 Days Return Policy" />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                        {/* <div className="bg-slate-900 px-5 py-3 flex justify-between items-center">
                                            <div className="flex items-center gap-2 text-white">
                                                <CheckCircle size={16} className="text-emerald-400" />
                                                <span className="text-xs font-bold uppercase tracking-wider">Key Benefits</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(p => ({ ...p, keyBenefits: [...p.keyBenefits, ""] }))}
                                                className="bg-white/10 hover:bg-white/20 text-white p-1 rounded-md transition"
                                            >
                                                <Plus size={18} />
                                            </button>
                                        </div> */}
                                        {/* <div className="p-5 space-y-3">
                                            {formData.keyBenefits.map((b, i) => (
                                                <div key={i} className="flex gap-2 items-center group">
                                                    <CheckCircle size={14} className="text-blue-600 flex-shrink-0" />
                                                    <input
                                                        className="flex-1 bg-slate-50 border border-slate-300 px-4 py-2 rounded-lg text-sm focus:bg-white focus:border-slate-900 outline-none transition"
                                                        placeholder="Benefit point..."
                                                        value={b}
                                                        onChange={(e) => {
                                                            const up = [...formData.keyBenefits];
                                                            up[i] = e.target.value;
                                                            setFormData({ ...formData, keyBenefits: up });
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, keyBenefits: formData.keyBenefits.filter((_, idx) => idx !== i) })}
                                                        className="text-slate-400 hover:text-rose-500 transition"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            ))}
                                            {formData.keyBenefits.length === 0 && (
                                                <p className="text-center text-[10px] text-slate-400 italic py-2">No benefits added yet</p>
                                            )}
                                        </div> */}
                                    </div>

                                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                        <div className="bg-slate-900 px-5 py-3 flex justify-between items-center">
                                            <div className="flex items-center gap-2 text-white">
                                                <Settings size={16} className="text-blue-400" />
                                                <span className="text-xs font-bold uppercase tracking-wider">Specifications</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(p => ({ ...p, specifications: [...p.specifications, { key: "", value: "" }] }))}
                                                className="bg-white/10 hover:bg-white/20 text-white p-1 rounded-md transition"
                                            >
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                        <div className="p-5 space-y-3">
                                            {formData.specifications.map((s, i) => (
                                                <div key={i} className="flex gap-2 items-center">
                                                    <input
                                                        className="w-1/3 bg-slate-50 border border-slate-300 px-3 py-2 rounded-lg text-xs font-bold focus:bg-white focus:border-slate-900 outline-none transition"
                                                        placeholder="Label (e.g. Fabric)"
                                                        value={s.key}
                                                        onChange={(e) => {
                                                            const up = [...formData.specifications];
                                                            up[i].key = e.target.value;
                                                            setFormData({ ...formData, specifications: up });
                                                        }}
                                                    />
                                                    <input
                                                        className="flex-1 bg-slate-50 border border-slate-300 px-3 py-2 rounded-lg text-xs focus:bg-white focus:border-slate-900 outline-none transition"
                                                        placeholder="Value (e.g. Cotton)"
                                                        value={s.value}
                                                        onChange={(e) => {
                                                            const up = [...formData.specifications];
                                                            up[i].value = e.target.value;
                                                            setFormData({ ...formData, specifications: up });
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, specifications: formData.specifications.filter((_, idx) => idx !== i) })}
                                                        className="text-slate-400 hover:text-rose-500 transition"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                            {formData.specifications.length === 0 && (
                                                <p className="text-center text-[10px] text-slate-400 italic py-2">No specs added yet</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "seo" && (
                            <div className="space-y-6 animate-in fade-in duration-300">

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <InputField label="Meta Title" name="metaTitle" value={formData.metaTitle || ""} onChange={handleChange} placeholder="SEO friendly title" />
                                    </div>

                                    <div className="md:col-span-2 space-y-2">
                                        <div className="flex justify-between">
                                            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Meta Description</label>
                                            <span className={`text-[10px] font-mono ${(formData.metaDescription?.length || 0) >= 160 ? 'text-rose-500' : 'text-slate-400'}`}>
                                                {formData.metaDescription?.length || 0}/160
                                            </span>
                                        </div>
                                        <textarea
                                            name="metaDescription" value={formData.metaDescription || ""} onChange={handleChange} rows="2" maxLength="160" placeholder="Brief summary for search results..."
                                            className={`w-full border p-3 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none transition border-slate-300`}
                                        />
                                    </div>

                                    <InputField label="Meta Keywords" name="metaKeywords" value={formData.metaKeywords || ""} onChange={handleChange} placeholder="fashion, shirt, summer (comma separated)" />

                                    <InputField label="Canonical URL" name="canonicalUrl" value={formData.canonicalUrl || ""} onChange={handleChange} placeholder="https://original-link.com" />

                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-bold uppercase text-slate-500 block mb-2">OG Image (Social Share)</label>
                                        <div className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl">
                                            <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center border border-dashed border-slate-300 overflow-hidden">
                                                {formData.ogImage ? (
                                                    <img
                                                        src={
                                                            formData.ogImage instanceof File
                                                                ? URL.createObjectURL(formData.ogImage)
                                                                : typeof formData.ogImage === 'string' && formData.ogImage.startsWith('http')
                                                                    ? formData.ogImage
                                                                    : `${IMAGE_BASE_URL}/${formData.ogImage}`
                                                        }
                                                        className="w-full h-full object-cover"
                                                        alt="OG Preview"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = "/placeholder.png";
                                                        }}
                                                    />
                                                ) : (
                                                    <ImageIcon className="text-slate-300" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-700 cursor-pointer"
                                                    onChange={(e) => {
                                                        if (e.target.files[0]) {
                                                            setFormData({ ...formData, ogImage: e.target.files[0] });
                                                        }
                                                    }}
                                                />
                                                <p className="text-[9px] text-slate-400 mt-2">Visible when product is shared on WhatsApp/Facebook</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "media" && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-400">

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                                                <LayoutDashboard size={16} />
                                            </div>
                                            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-700">Main Display Image</span>
                                        </div>

                                        <div className="relative group border-2 border-dashed border-slate-200 rounded-3xl p-2 bg-white hover:border-blue-500 hover:bg-blue-50/30 transition-all duration-300 aspect-[4/3] flex flex-col items-center justify-center overflow-hidden shadow-sm">
                                            {formData.mainImageFile || formData.mainImage?.url ? (
                                                <>
                                                    <img
                                                        src={
                                                            formData.mainImageFile
                                                                ? URL.createObjectURL(formData.mainImageFile)
                                                                : formData.mainImage?.url
                                                                    ? `${IMAGE_BASE_URL}/${formData.mainImage.url}`
                                                                    : "/placeholder.png"
                                                        }
                                                        className="w-full h-full object-cover rounded-2xl"
                                                        alt="Main"
                                                        onError={(e) => { e.target.src = "/placeholder.png"; }}
                                                    />

                                                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                                                        <label className="cursor-pointer bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-bold shadow-xl hover:scale-105 transition-transform">
                                                            Replace Image
                                                            <input type="file" className="hidden" onChange={(e) => setFormData({ ...formData, mainImageFile: e.target.files[0] })} />
                                                        </label>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center p-6">
                                                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                                        <UploadCloud className="text-slate-400 group-hover:text-blue-500" size={32} />
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-600 mb-1">Click or Drag to Upload</p>
                                                    <p className="text-[10px] text-slate-400">JPG, PNG up to 5MB</p>
                                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setFormData({ ...formData, mainImageFile: e.target.files[0] })} />
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            className="mt-3 w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                            placeholder="SEO Alt Text: e.g. Navy Blue Cotton Shirt Front"
                                            value={formData.mainImage?.alt || ""}
                                            onChange={(e) => setFormData({ ...formData, mainImage: { ...formData.mainImage, alt: e.target.value } })}
                                        />
                                    </div>

                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg">
                                                <MousePointer2 size={16} />
                                            </div>
                                            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-700">Secondary / Hover Image</span>
                                        </div>

                                        <div className="relative group border-2 border-dashed border-slate-200 rounded-3xl p-2 bg-white hover:border-purple-500 hover:bg-purple-50/30 transition-all duration-300 aspect-[4/3] flex flex-col items-center justify-center overflow-hidden shadow-sm">
                                            {formData.hoverImageFile || formData.hoverImage?.url ? (
                                                <>
                                                    <img
                                                        src={
                                                            formData.hoverImageFile
                                                                ? URL.createObjectURL(formData.hoverImageFile)
                                                                : formData.hoverImage?.url
                                                                    ? `${IMAGE_BASE_URL}/${formData.hoverImage.url}`
                                                                    : "/placeholder.png"
                                                        }
                                                        className="w-full h-full object-cover rounded-2xl"
                                                        alt="Hover"
                                                        onError={(e) => { e.target.src = "/placeholder.png"; }}
                                                    />

                                                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                        {/* <label className="cursor-pointer bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-bold shadow-xl">Replace</label> */}
                                                        <button onClick={() => setFormData({ ...formData, hoverImageFile: null, hoverImage: { url: "" } })} className="bg-rose-500 text-white p-2.5 rounded-xl shadow-xl hover:bg-rose-600"><Trash2 size={16} /></button>
                                                        <input type="file" className="hidden" id="hover-upload" onChange={(e) => setFormData({ ...formData, hoverImageFile: e.target.files[0] })} />
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center p-6">
                                                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                        <ImageIcon className="text-slate-300" size={32} />
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-600 mb-1">Hover Preview Image</p>
                                                    <p className="text-[10px] text-slate-400">Shows on mouse hover in shop</p>
                                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setFormData({ ...formData, hoverImageFile: e.target.files[0] })} />
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            className="mt-3 w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                                            placeholder="SEO Alt Text: e.g. Model wearing navy blue shirt"
                                            value={formData.hoverImage?.alt || ""}
                                            onChange={(e) => setFormData({ ...formData, hoverImage: { ...formData.hoverImage, alt: e.target.value } })}
                                        />
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200">
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <h3 className="text-sm font-black text-slate-900 uppercase">Product Gallery</h3>
                                            <p className="text-[10px] text-slate-500 mt-0.5">Add multiple angles and lifestyle shots</p>
                                        </div>
                                        <label className="group flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-2xl text-xs font-bold cursor-pointer transition-all shadow-lg active:scale-95">
                                            <PlusSquare size={18} className="text-slate-400 group-hover:text-white" />
                                            <span>Add Images</span>
                                            <input type="file" multiple className="hidden" onChange={(e) => setImageFiles([...imageFiles, ...Array.from(e.target.files)])} />
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                        {existingImages.map((img, i) => (
                                            <div key={`old-${i}`} className="aspect-square rounded-2xl overflow-hidden bg-white border border-slate-200 relative group shadow-sm ring-offset-2 hover:ring-2 hover:ring-slate-900 transition-all">
                                                <img src={`${IMAGE_BASE_URL}/${img.url}`} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => setExistingImages(existingImages.filter((_, idx) => idx !== i))}
                                                    className="absolute top-2 right-2 bg-white/90 backdrop-blur text-rose-500 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-rose-500 hover:text-white"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}

                                        {imageFiles.map((file, i) => (
                                            <div key={`new-${i}`} className="aspect-square rounded-2xl overflow-hidden bg-white border-2 border-blue-500 relative group shadow-md animate-in zoom-in-95 duration-200">
                                                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
                                                <div className="absolute top-2 left-2 bg-blue-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">New</div>
                                                <button
                                                    type="button"
                                                    onClick={() => setImageFiles(imageFiles.filter((_, idx) => idx !== i))}
                                                    className="absolute top-2 right-2 bg-rose-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}

                                        {existingImages.length === 0 && imageFiles.length === 0 && (
                                            <div className="col-span-full py-10 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-2xl">
                                                <Images size={40} strokeWidth={1} />
                                                <p className="text-[10px] font-bold mt-2 uppercase tracking-widest">No gallery images added</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                                            <Video size={18} />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-bold text-slate-900 uppercase">Product Video</h3>
                                            <p className="text-[10px] text-slate-500">Engage customers with a short demo clip</p>
                                        </div>
                                    </div>

                                    {(formData.videoFile || formData.video) && (
                                        <div className="mb-4 relative group">
                                            <video
                                                key={formData.videoFile ? formData.videoFile.name : formData.video}
                                                controls
                                                className="w-full h-48 rounded-2xl bg-black object-contain shadow-md"
                                            >
                                                <source
                                                    src={formData.videoFile
                                                        ? URL.createObjectURL(formData.videoFile)
                                                        : formData.video?.startsWith('http')
                                                            ? formData.video
                                                            : `${IMAGE_BASE_URL}/${formData.video}`
                                                    }
                                                    type="video/mp4"
                                                />
                                                Your browser does not support the video tag.
                                            </video>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, videoFile: null, video: "" })}
                                                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}

                                    <div className={`relative border-2 border-dashed rounded-2xl p-6 transition-all ${(formData.videoFile || formData.video) ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-200 bg-slate-50'}`}>
                                        <div className="flex flex-col md:flex-row items-center gap-6">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${(formData.videoFile || formData.video) ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 shadow-sm'}`}>
                                                {(formData.videoFile || formData.video) ? <CheckCircle2 size={24} /> : <Film size={24} />}
                                            </div>

                                            <div className="flex-1 text-center md:text-left">
                                                <p className="text-sm font-bold text-slate-700">
                                                    {formData.videoFile ? formData.videoFile.name : formData.video ? "Current Video" : 'Upload Demo Video'}
                                                </p>
                                                <p className="text-[10px] text-slate-500 mt-1 uppercase">MP4, WEBM (MAX 50MB)</p>
                                            </div>

                                            <label className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-800 cursor-pointer transition-all active:scale-95">
                                                {formData.videoFile || formData.video ? 'Change Video' : 'Select Video'}
                                                <input
                                                    type="file"
                                                    accept="video/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            if (file.size > 50 * 1024 * 1024) {
                                                                alert("File too large! Max 50MB.");
                                                                return;
                                                            }
                                                            setFormData({ ...formData, videoFile: file });
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </form>
                </div>

                <div className="p-6 border-t border-slate-100 bg-white flex items-center gap-3">
                    <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-400 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition uppercase tracking-wider">Cancel Action</button>
                    <button form="productForm" type="submit" disabled={loading} className={`flex-[2] ${initialData ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-black'} text-white py-2.5 rounded-lg font-bold text-sm transition shadow-lg active:scale-[0.98] uppercase tracking-widest flex items-center justify-center gap-2`}>
                        <Save size={16} /> {loading ? "Processing..." : initialData ? "Update Product" : "Publish Listing"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function InputField({ label, ...props }) {
    return (
        <div className="space-y-1.5 w-full text-left">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">{label}</label>
            <input className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition shadow-sm" {...props} />
        </div>
    );
}