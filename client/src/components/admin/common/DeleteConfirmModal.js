"use client";
import { X, AlertTriangle } from "lucide-react";

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 relative">

                {/* Close */}
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
                    <X size={18} />
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-4">
                    <div className="bg-rose-100 text-rose-600 p-3 rounded-full">
                        <AlertTriangle size={24} />
                    </div>
                </div>

                <h2 className="text-lg font-bold text-center text-slate-900">
                    Delete User?
                </h2>
                <p className="text-sm text-slate-500 text-center mt-2">
                    Are you sure you want to delete this user?
                    This action cannot be undone.
                </p>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 border border-slate-300 text-slate-700 py-2 rounded hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 bg-rose-600 text-white py-2 rounded hover:bg-rose-700"
                    >
                        Yes, Delete
                    </button>
                </div>
            </div>
        </div>
    );
}
