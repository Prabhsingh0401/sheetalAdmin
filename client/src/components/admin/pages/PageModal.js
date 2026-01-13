"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2, Edit3 } from "lucide-react";
import TiptapEditor from "../../TiptapEditor";
import toast from "react-hot-toast";

export default function PageModal({ isOpen, onClose, onSuccess, initialData }) {
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState("");
    const [title, setTitle] = useState("");

    useEffect(() => {
        if (isOpen && initialData) {
            setTitle(initialData.title || "");
            setContent(initialData.content || "");
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content || content === "<p></p>") {
            return toast.error("Content is empty!");
        }

        setLoading(true);
        try {
            // Yahan aapki API call aayegi (e.g., updateCMSPage)
            console.log("Saving Content for:", title, content);

            toast.success(`${title} Updated!`);
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            toast.error("Failed to save changes");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-[150] p-4 transition-all">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 animate-in zoom-in duration-200">

                {/* --- HEADER --- */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 text-white rounded-lg">
                            <Edit3 size={18} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 leading-tight">Edit {title}</h2>
                            <p className="text-xs text-slate-500 font-medium">Update website content using rich text editor</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 p-1.5 rounded-lg transition">
                        <X size={20} />
                    </button>
                </div>

                {/* --- FORM & EDITOR --- */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Page Content</label>
                        {/* Aapka Tiptap Editor */}
                        <div className="min-h-[300px] max-h-[500px] overflow-y-auto">
                            <TiptapEditor value={content} onChange={setContent} />
                        </div>
                    </div>

                    {/* --- ACTIONS --- */}
                    <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 border border-slate-400 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-2.5 bg-slate-900 text-white rounded-lg font-bold text-sm transition shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 hover:bg-black"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}