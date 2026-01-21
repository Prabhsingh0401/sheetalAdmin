"use client";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { logout } from "@/store/slices/authSlice";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { adminLogout } from "@/services/authService";

export default function useLogoutModal() {
    const [isOpen, setIsOpen] = useState(false);
    const dispatch = useDispatch();
    const router = useRouter();

    const openModal = () => setIsOpen(true);
    const closeModal = () => setIsOpen(false);

    const handleConfirmLogout = async () => {
        try {
            await adminLogout();
            toast.success("Logged out successfully");
        } catch (err) {
            console.error("Logout error:", err);
            // Continue with local logout anyway
        } finally {
            document.cookie = "token=; path=/; max-age=0";
            dispatch(logout());
            router.push("/admin/login");
            closeModal();
        }
    };

    const LogoutModal = () => (
        isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white rounded-xl shadow-xl w-96 p-6">
                    <h3 className="text-lg font-semibold text-slate-900">Confirm Logout</h3>
                    <p className="mt-2 text-sm text-slate-500">Are you sure you want to logout?</p>
                    <div className="mt-4 flex justify-end gap-3">
                        <button
                            onClick={closeModal}
                            className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmLogout}
                            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        )
    );

    return { openModal, LogoutModal };
}
