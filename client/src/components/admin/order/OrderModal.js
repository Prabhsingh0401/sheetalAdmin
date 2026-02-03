"use client";
import { useState, useEffect } from "react";
import {
  X,
  Truck,
  Loader2,
  CheckCircle,
  AlertCircle,
  Package,
} from "lucide-react";
import { updateOrderStatus } from "@/services/orderService";
import toast from "react-hot-toast";

export default function OrderModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) {
  const [status, setStatus] = useState("Processing");
  const [loading, setLoading] = useState(false);

  const [shippingInfo, setShippingInfo] = useState({
    carrier: "",
    trackingId: "",
    estimatedDelivery: "",
  });

  // Reset and Load data when modal opens
  useEffect(() => {
    if (isOpen && initialData) {
      setStatus(initialData.orderStatus || "Processing");
      setShippingInfo({
        carrier: initialData.shippingInfo?.carrier || "",
        trackingId: initialData.shippingInfo?.trackingId || "",
        estimatedDelivery: initialData.shippingInfo?.estimatedDelivery || "",
      });
    }
  }, [initialData, isOpen]);

  const handleUpdate = async () => {
    // Validation: Shipped status ke liye details mandatory hain
    if (status === "Shipped") {
      if (!shippingInfo.carrier.trim() || !shippingInfo.trackingId.trim()) {
        return toast.error(
          "Courier Name and Tracking ID are required for shipping.",
        );
      }
    }

    setLoading(true);
    try {
      const payload = {
        status,
        // Shipping info tabhi bhejte hain jab status Shipped ya Delivered ho
        shippingInfo:
          status === "Shipped" || status === "Delivered" ? shippingInfo : null,
        shippedAt: status === "Shipped" ? new Date() : initialData?.shippedAt,
        deliveredAt:
          status === "Delivered" ? new Date() : initialData?.deliveredAt,
      };

      const res = await updateOrderStatus(initialData._id, payload);

      if (res.success || res.status === 200) {
        toast.success(`Order status updated to ${status}`);
        onSuccess(); // Refresh parents data
        onClose();
      }
    } catch (err) {
      console.error("Update Error:", err);
      toast.error(
        err.response?.data?.message || "Failed to update order status",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[600] flex justify-center items-center p-4 transition-all">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-xl text-white">
              <Package size={20} />
            </div>
            <div>
              <h2 className="font-black text-slate-800 tracking-tight leading-none">
                Manage Order
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">
                ID: #{initialData?._id?.slice(-10)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-rose-50 rounded-full text-slate-400 hover:text-rose-500 transition-all border border-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-7 space-y-6">
          {/* Status Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Process Step
            </label>
            <div className="relative group">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-4.5 bg-slate-100 border-2 border-transparent rounded-2xl text-sm font-bold outline-none focus:border-slate-900 focus:bg-white transition-all appearance-none cursor-pointer pr-10"
              >
                <option value="Processing">🟡 Accept & Processing</option>
                <option value="Shipped">📦 Out for Shipping (AWB)</option>
                <option value="Delivered">✅ Mark as Delivered</option>
                <option value="Cancelled">❌ Cancel Order</option>
                <option value="Return Requested">🔄 Return Requested</option>
                <option value="Returned">🔙 Item Returned</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-slate-900 transition-colors">
                <AlertCircle size={18} />
              </div>
            </div>
          </div>

          {/* Conditional Tracking Section */}
          {status === "Shipped" ? (
            <div className="p-5 bg-blue-50/50 rounded-[2rem] border-2 border-blue-100 space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 text-blue-700 mb-1">
                <Truck size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Logistics Details
                </span>
              </div>

              <div className="space-y-3">
                <input
                  className="w-full p-4 bg-white border border-blue-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="Courier Partner Name"
                  value={shippingInfo.carrier}
                  onChange={(e) =>
                    setShippingInfo({
                      ...shippingInfo,
                      carrier: e.target.value,
                    })
                  }
                />
                <input
                  className="w-full p-4 bg-white border border-blue-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="Tracking ID / AWB Number"
                  value={shippingInfo.trackingId}
                  onChange={(e) =>
                    setShippingInfo({
                      ...shippingInfo,
                      trackingId: e.target.value,
                    })
                  }
                />
                <input
                  className="w-full p-4 bg-white border border-blue-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="Estimated Delivery (e.g., 12 Oct)"
                  value={shippingInfo.estimatedDelivery}
                  onChange={(e) =>
                    setShippingInfo({
                      ...shippingInfo,
                      estimatedDelivery: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          ) : status === "Delivered" ? (
            <div className="p-5 bg-emerald-50 rounded-2xl border-2 border-emerald-100 flex items-start gap-3 text-emerald-700 animate-in fade-in slide-in-from-top-2">
              <CheckCircle size={20} className="shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold">Ready for delivery?</p>
                <p className="text-[10px] opacity-80 mt-1 font-medium italic underline underline-offset-2">
                  Customer will receive an automated delivery confirmation
                  email.
                </p>
              </div>
            </div>
          ) : status === "Cancelled" ? (
            <div className="p-5 bg-rose-50 rounded-2xl border-2 border-rose-100 flex items-start gap-3 text-rose-700 animate-in fade-in">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-rose-800">
                  Warning: Cancellation
                </p>
                <p className="text-[10px] opacity-80 mt-1">
                  This action cannot be undone. Refund will be initiated if paid
                  online.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="flex-[2] py-4 bg-slate-900 text-white rounded-[1.25rem] font-black text-xs uppercase tracking-[2px] hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Updating...</span>
              </>
            ) : (
              "Confirm Change"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
