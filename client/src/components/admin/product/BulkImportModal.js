"use client";

import { useState, useRef } from "react";
import { X, UploadCloud, FileSpreadsheet, Image as ImageIcon, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { bulkImportProducts } from "@/services/productService";

export default function BulkImportModal({ isOpen, onClose, onSuccess }) {
    const [step, setStep] = useState(1); // 1: Upload, 2: Review/Processing, 3: Success
    const [excelFile, setExcelFile] = useState(null);
    const [imageFiles, setImageFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);

    const excelInputRef = useRef(null);
    const imagesInputRef = useRef(null);

    const handleExcelChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
                toast.error("Please upload a valid Excel or CSV file");
                return;
            }
            setExcelFile(file);
        }
    };

    const handleImagesChange = (e) => {
        const files = Array.from(e.target.files);
        // Filter for images
        const validImages = files.filter(file => file.type.startsWith('image/'));

        if (validImages.length !== files.length) {
            toast.error("Some files were skipped because they are not images");
        }

        setImageFiles(prev => [...prev, ...validImages]);
    };

    const removeImage = (index) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!excelFile) {
            toast.error("Please select an Excel file");
            return;
        }

        setUploading(true);
        setStep(2);

        try {
            const formData = new FormData();
            formData.append("file", excelFile);

            // Append all images
            imageFiles.forEach(file => {
                formData.append("images", file);
            });

            // Simulation of progress for better UX
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(interval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 500);

            const res = await bulkImportProducts(formData);

            clearInterval(interval);
            setProgress(100);

            if (res.success) {
                setResult({
                    success: true,
                    count: res.data?.length || 0,
                    message: res.message || "Products imported successfully"
                });
                setStep(3);
                onSuccess?.();
            } else {
                throw new Error(res.message || "Import failed");
            }

        } catch (error) {
            setResult({
                success: false,
                message: error.message || "Failed to import products."
            });
            setStep(3);
        } finally {
            setUploading(false);
        }
    };

    const resetForm = () => {
        setExcelFile(null);
        setImageFiles([]);
        setStep(1);
        setProgress(0);
        setResult(null);
    };

    const handleClose = () => {
        if (uploading) return;
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Bulk Import Products</h2>
                        <p className="text-sm text-slate-500">Upload Excel sheet and associated images</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                        disabled={uploading}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">

                    {/* Step 1: Upload */}
                    {step === 1 && (
                        <div className="space-y-8">

                            {/* Excel Upload Section */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <span className="bg-slate-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">1</span>
                                    Upload Product Sheet
                                </label>

                                <div
                                    onClick={() => excelInputRef.current?.click()}
                                    className={`
                        border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all
                        ${excelFile ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'}
                    `}
                                >
                                    {excelFile ? (
                                        <div className="text-center">
                                            <FileSpreadsheet className="w-12 h-12 text-emerald-600 mb-2 mx-auto" />
                                            <p className="font-medium text-slate-900">{excelFile.name}</p>
                                            <p className="text-xs text-slate-500 mt-1">{(excelFile.size / 1024).toFixed(1)} KB</p>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setExcelFile(null);
                                                }}
                                                className="mt-3 text-xs text-red-600 hover:underline"
                                            >
                                                Remove file
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center group">
                                            <UploadCloud className="w-12 h-12 text-slate-300 group-hover:text-blue-500 transition-colors mb-2 mx-auto" />
                                            <p className="font-medium text-slate-700">Click to upload Excel file</p>
                                            <p className="text-xs text-slate-400 mt-1">Supported: .xlsx, .xls, .csv</p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={excelInputRef}
                                        className="hidden"
                                        accept=".xlsx, .xls, .csv"
                                        onChange={handleExcelChange}
                                    />
                                </div>
                                <div className="flex justify-between items-center text-xs px-1">
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            try {
                                                const { downloadSampleExcel } = await import("@/services/productService");
                                                const blob = await downloadSampleExcel();
                                                const url = window.URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = "product_import_template.xlsx";
                                                document.body.appendChild(a);
                                                a.click();
                                                a.remove();
                                            } catch (err) {
                                                toast.error("Failed to download sample file");
                                            }
                                        }}
                                        className="text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                        Download Sample Template
                                    </button>
                                    <span className="text-slate-400">Max file size: 10MB</span>
                                </div>
                            </div>

                            {/* Images Upload Section */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <span className="bg-slate-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">2</span>
                                    Upload Product Images
                                </label>

                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                                        <div
                                            onClick={() => imagesInputRef.current?.click()}
                                            className="aspect-square border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-white transition-all bg-white"
                                        >
                                            <ImageIcon className="w-8 h-8 text-slate-300 mb-1" />
                                            <span className="text-xs font-medium text-slate-500">Add Images</span>
                                        </div>

                                        {imageFiles.map((file, idx) => (
                                            <div key={idx} className="aspect-square relative rounded-lg overflow-hidden border border-slate-200 bg-white group">
                                                <img
                                                    src={URL.createObjectURL(file)}
                                                    className="w-full h-full object-cover"
                                                    alt="preview"
                                                />
                                                <button
                                                    onClick={() => removeImage(idx)}
                                                    className="absolute top-1 right-1 bg-white/90 p-1 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-white"
                                                >
                                                    <X size={12} />
                                                </button>
                                                <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5 truncate">
                                                    {file.name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-slate-500">{imageFiles.length} images selected</p>
                                        <button
                                            onClick={() => setImageFiles([])}
                                            className={`text-xs text-red-600 hover:underline ${imageFiles.length === 0 ? 'invisible' : ''}`}
                                        >
                                            Clear all
                                        </button>
                                    </div>
                                    <input
                                        type="file"
                                        ref={imagesInputRef}
                                        className="hidden"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImagesChange}
                                    />
                                </div>
                                <p className="text-xs text-slate-400 italic">
                                    Note: Image filenames must match exactly with the names provided in the Excel sheet.
                                </p>
                            </div>

                        </div>
                    )}

                    {/* Step 2: Processing */}
                    {step === 2 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                            <div className="relative w-24 h-24">
                                <svg className="w-full h-full" viewBox="0 0 100 100">
                                    <circle
                                        className="text-slate-100 stroke-current"
                                        strokeWidth="8"
                                        cx="50"
                                        cy="50"
                                        r="40"
                                        fill="transparent"
                                    ></circle>
                                    <circle
                                        className="text-blue-600 progress-ring__circle stroke-current transition-all duration-300"
                                        strokeWidth="8"
                                        strokeLinecap="round"
                                        cx="50"
                                        cy="50"
                                        r="40"
                                        fill="transparent"
                                        strokeDasharray="251.2"
                                        strokeDashoffset={251.2 - (251.2 * progress) / 100}
                                        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                                    ></circle>
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xl font-bold text-slate-700">{progress}%</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-slate-900">Importing Products...</h3>
                                <p className="text-slate-500 text-sm max-w-xs mx-auto">
                                    Please wait while we parse the Excel file and upload your images securely.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Result */}
                    {step === 3 && result && (
                        <div className="flex flex-col items-center justify-center py-8 text-center space-y-6">
                            <div className={`
                    w-20 h-20 rounded-full flex items-center justify-center mb-4
                    ${result.success ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}
                `}>
                                {result.success ? <CheckCircle size={40} /> : <AlertCircle size={40} />}
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-slate-900">
                                    {result.success ? 'Import Complete!' : 'Import Failed'}
                                </h3>
                                <p className={`text-sm max-w-sm mx-auto ${result.success ? 'text-slate-600' : 'text-red-600'}`}>
                                    {result.message}
                                </p>
                                {result.success && (
                                    <p className="text-sm font-medium text-emerald-700">
                                        Successfully added {result.count} products to the catalog.
                                    </p>
                                )}
                            </div>

                            <div className="pt-6">
                                <button
                                    onClick={handleClose}
                                    className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all"
                                >
                                    {result.success ? 'Done' : 'Try Again'}
                                </button>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                {step === 1 && (
                    <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                        <button
                            onClick={handleClose}
                            className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!excelFile}
                            className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200 transition-all text-sm flex items-center gap-2"
                        >
                            <UploadCloud size={18} />
                            Start Import
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
