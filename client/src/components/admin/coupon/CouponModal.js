"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Ticket, Edit3, Zap, Gift, Info } from "lucide-react";
import { addCoupon, updateCoupon } from "@/services/couponService";
import { getCategories } from "@/services/categoryService";
import { toast } from "react-hot-toast";

export default function CouponModal({
  isOpen,
  onClose,
  onSuccess,
  initialData = null,
}) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]); // State for categories

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    couponType: "CouponCode",
    offerType: "Percentage",
    offerValue: "",
    buyQuantity: 1,
    getQuantity: 1,
    scope: "All", // New field
    applicableIds: [], // New field
    minOrderAmount: "",
    maxDiscountAmount: "",
    startDate: "",
    endDate: "",
    totalUsageLimit: "",
    usageLimitPerUser: 1,
    status: "Active",
  });

  // Fetch categories when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchCategories = async () => {
        try {
          const res = await getCategories();
          const actualArray =
            res?.categories?.categories || res?.data?.categories || [];
          setCategories(Array.isArray(actualArray) ? actualArray : []);
        } catch (err) {
          setCategories([]);
        }
      };
      fetchCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        code: initialData?.code || "",
        description: initialData?.description || "",
        couponType: initialData?.couponType || "CouponCode",
        offerType: initialData?.offerType || "Percentage",
        offerValue: initialData?.offerValue || "",
        buyQuantity: initialData?.buyQuantity || 1,
        getQuantity: initialData?.getQuantity || 1,
        scope: initialData?.scope || "All",
        applicableIds: initialData?.applicableIds
          ? initialData.applicableIds.map((id) =>
            typeof id === "object" ? id._id : id,
          )
          : [],
        minOrderAmount: initialData?.minOrderAmount || "",
        maxDiscountAmount: initialData?.maxDiscountAmount || "",
        startDate: initialData?.startDate
          ? new Date(initialData.startDate).toISOString().split("T")[0]
          : "",
        endDate: initialData?.endDate
          ? new Date(initialData.endDate).toISOString().split("T")[0]
          : "",
        totalUsageLimit: initialData?.totalUsageLimit || "",
        usageLimitPerUser: initialData?.usageLimitPerUser || 1,
        status: initialData?.isActive !== false ? "Active" : "Inactive",
      });
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      code:
        formData.couponType === "FestiveSale"
          ? `AUTO-${Date.now()}`
          : formData.code,
      isActive: formData.status === "Active",
      offerValue:
        formData.offerType === "BOGO" ? 0 : Number(formData.offerValue),
      buyQuantity: Number(formData.buyQuantity),
      getQuantity: Number(formData.getQuantity),
      minOrderAmount: Number(formData.minOrderAmount) || 0,
      totalUsageLimit: Number(formData.totalUsageLimit),
      usageLimitPerUser: Number(formData.usageLimitPerUser),
      maxDiscountAmount: formData.maxDiscountAmount
        ? Number(formData.maxDiscountAmount)
        : undefined,
    };

    try {
      const res = initialData
        ? await updateCoupon(initialData._id, payload)
        : await addCoupon(payload);

      if (res.success) {
        toast.success(initialData ? "Coupon Updated!" : "Coupon Created!");
        onSuccess();
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-[100] p-4 transition-all">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        {/* Header Section */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 ${formData.couponType === "FestiveSale" ? "bg-orange-600" : initialData ? "bg-blue-600" : "bg-slate-900"} text-white rounded-lg transition-colors`}
            >
              {formData.couponType === "FestiveSale" ? (
                <Zap size={18} />
              ) : initialData ? (
                <Edit3 size={18} />
              ) : (
                <Ticket size={18} />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                {formData.couponType === "FestiveSale"
                  ? "Festive Sale Configuration"
                  : initialData
                    ? "Edit Coupon Details"
                    : "Add New Coupon"}
              </h2>
              <p className="text-xs text-slate-500 font-medium italic">
                {formData.couponType === "FestiveSale"
                  ? "Auto-applied for all customers"
                  : "Code-based promotional logic"}
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

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar"
        >
          {/* Type Selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Campaign Type
              </label>
              <select
                value={formData.couponType}
                onChange={(e) =>
                  setFormData({ ...formData, couponType: e.target.value })
                }
                className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 font-medium focus:border-slate-900 outline-none transition"
              >
                <option value="CouponCode">Coupon Code</option>
                <option value="FestiveSale">Festive Sale (Auto)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Offer Type
              </label>
              <select
                value={formData.offerType}
                onChange={(e) =>
                  setFormData({ ...formData, offerType: e.target.value })
                }
                className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 font-medium focus:border-slate-900 outline-none transition"
              >
                <option value="Percentage">Percentage (%)</option>
                <option value="FixedAmount">Fixed Amount (₹)</option>
                <option value="BOGO">BOGO (Buy/Get)</option>
              </select>
            </div>
          </div>

          {/* Coupon Code: Sirf tab dikhega jab Festive Sale NA HO */}
          {formData.couponType === "CouponCode" ? (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Coupon Code
              </label>
              <input
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                placeholder="e.g. FESTIVE50"
                className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm font-bold text-slate-900 focus:border-slate-900 outline-none"
                required={formData.couponType === "CouponCode"}
              />
            </div>
          ) : (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-300">
              <Info size={18} className="text-orange-600 mt-0.5" />
              <p className="text-xs text-orange-800 leading-relaxed">
                <strong>Auto-Apply Mode:</strong> Customers don't need to enter
                a code. This discount will be automatically applied based on the
                rules below.
              </p>
            </div>
          )}

          {/* Scope and Category Selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Coupon Scope
              </label>
              <select
                value={formData.scope}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    scope: e.target.value,
                    applicableIds: [],
                  })
                }
                className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 font-medium focus:border-slate-900 outline-none transition"
              >
                <option value="All">All Products</option>
                <option value="Category">Specific Category</option>
              </select>
            </div>
            {formData.scope === "Category" && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Select Category
                </label>
                <select
                  value={formData.applicableIds[0] || ""} // Assuming one category per coupon for simplicity
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      applicableIds: [e.target.value],
                    })
                  }
                  className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 font-medium focus:border-slate-900 outline-none transition"
                  required
                >
                  <option value="" disabled>
                    -- Select a category --
                  </option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {/* BOGO Logic vs Offer Value Logic */}
          {formData.offerType === "BOGO" ? (
            <div className="grid grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Buy Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.buyQuantity}
                  onChange={(e) =>
                    setFormData({ ...formData, buyQuantity: e.target.value })
                  }
                  className="w-full bg-white border border-blue-300 px-4 py-2.5 rounded-lg text-sm text-slate-900 focus:border-blue-600 outline-none shadow-sm"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Get Free Qty
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.getQuantity}
                  onChange={(e) =>
                    setFormData({ ...formData, getQuantity: e.target.value })
                  }
                  className="w-full bg-white border border-blue-300 px-4 py-2.5 rounded-lg text-sm text-slate-900 focus:border-blue-600 outline-none shadow-sm"
                  required
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Discount Value{" "}
                  {formData.offerType === "Percentage" ? "(%)" : "(₹)"}
                </label>
                <input
                  type="number"
                  value={formData.offerValue}
                  onChange={(e) => {
                    let value = e.target.value;
                    if (
                      formData.offerType === "Percentage" &&
                      Number(value) > 100
                    ) {
                      toast.error(
                        "Discount percentage cannot exceed 100%. Setting to 100.",
                      );
                      value = "100"; // Cap at 100
                    }
                    setFormData({ ...formData, offerValue: value });
                  }}
                  className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 focus:border-slate-900 outline-none font-bold"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Max Discount (₹)
                </label>
                <input
                  type="number"
                  value={formData.maxDiscountAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxDiscountAmount: e.target.value,
                    })
                  }
                  placeholder="Optional"
                  className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 focus:border-slate-900 outline-none"
                />
              </div>
            </div>
          )}

          {/* Limits and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Min Order (₹)
              </label>
              <input
                type="number"
                value={formData.minOrderAmount}
                onChange={(e) =>
                  setFormData({ ...formData, minOrderAmount: e.target.value })
                }
                className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 focus:border-slate-900 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 font-bold focus:border-slate-900 outline-none"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Usage Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Total Usage Limit
              </label>
              <input
                type="number"
                value={formData.totalUsageLimit}
                onChange={(e) =>
                  setFormData({ ...formData, totalUsageLimit: e.target.value })
                }
                className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 focus:border-slate-900 outline-none"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Limit Per User
              </label>
              <input
                type="number"
                value={formData.usageLimitPerUser}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    usageLimitPerUser: e.target.value,
                  })
                }
                className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 focus:border-slate-900 outline-none"
                required
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 focus:border-slate-900 outline-none transition"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 focus:border-slate-900 outline-none transition"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Sale/Coupon Description
            </label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe the offer (e.g., Get 50% off on orders above ₹500)"
              className="w-full bg-white border border-slate-400 px-4 py-2.5 rounded-lg text-sm text-slate-900 focus:border-slate-900 outline-none transition"
              required
            ></textarea>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-400 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-[2] ${formData.couponType === "FestiveSale" ? "bg-orange-600 hover:bg-orange-700" : initialData ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-900 hover:bg-black"} text-white py-3 rounded-lg font-bold text-sm transition shadow-lg flex items-center justify-center active:scale-[0.98] disabled:opacity-70`}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : initialData ? (
                "Update Campaign"
              ) : (
                "Launch Campaign"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
