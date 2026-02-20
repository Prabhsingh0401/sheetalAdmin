"use client";
import React, { useState, useEffect } from "react";
import {
  Star,
  Trash2,
  CheckCircle2,
  Package,
  XCircle,
  Clock,
} from "lucide-react";
import PageHeader from "@/components/admin/layout/PageHeader.js";
import { getAdminReviews, updateReviewStatusAdmin, deleteReviewAdmin } from "@/services/productService";
import toast from "react-hot-toast";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ average: 0, approved: 0, pending: 0 });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      // Fetch all reviews
      const resAll = await getAdminReviews(1, 100, "all");
      if (resAll.success) {
        const fetchedReviews = resAll.data || []; // Use resAll.data instead of resAll.reviews
        setReviews(fetchedReviews);

        let approvedCount = 0;
        let pendingCount = 0;
        let totalRating = 0;

        fetchedReviews.forEach(r => {
          if (r.isApproved) {
            approvedCount++;
            totalRating += r.rating;
          } else {
            pendingCount++;
          }
        });

        const avg = approvedCount > 0 ? (totalRating / approvedCount).toFixed(1) : 0;
        setStats({ average: avg, approved: approvedCount, pending: pendingCount });
      }
    } catch (error) {
      toast.error("Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, isApproved) => {
    try {
      const res = await updateReviewStatusAdmin(id, isApproved);
      if (res.success) {
        toast.success(`Review ${isApproved ? 'approved' : 'rejected'} successfully`);
        fetchReviews(); // Refresh
      } else {
        toast.error(res.message || "Failed to update review status");
      }
    } catch (error) {
      toast.error("Error updating status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      const res = await deleteReviewAdmin(id);
      if (res.success) {
        toast.success("Review deleted");
        fetchReviews(); // Refresh
      } else {
        toast.error(res.message || "Failed to delete review");
      }
    } catch (error) {
      toast.error("Error deleting review");
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={14}
        className={
          i < rating ? "fill-orange-400 text-orange-400" : "text-slate-200"
        }
      />
    ));
  };

  return (
    <div className="w-full animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Customer Reviews"
        subtitle="Monitor and moderate product feedback"
      />

      {/* --- Stats Summary --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 mb-8">
        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 font-black text-xl">
            {stats.average}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Average Rating
            </p>
            <div className="flex gap-1 mt-1">{renderStars(Math.round(stats.average))}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm flex items-center gap-4 text-emerald-600">
          <CheckCircle2 size={32} className="opacity-20" />
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Total Approved
            </p>
            <h4 className="text-xl font-black text-slate-900 leading-none mt-1">
              {stats.approved}
            </h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm flex items-center gap-4 text-orange-500">
          <Clock size={32} className="opacity-20" />
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Pending Review
            </p>
            <h4 className="text-xl font-black text-slate-900 leading-none mt-1">
              {stats.pending}
            </h4>
          </div>
        </div>
      </div>

      {/* --- Review Feed --- */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-slate-500 py-10">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-center text-slate-500 py-10">No reviews found.</p>
        ) : (
          reviews.map((review) => {
            const isApproved = review.isApproved;
            return (
              <div
                key={review._id}
                className="bg-white p-6 md:p-8 rounded-[28px] border border-slate-200 shadow-sm hover:border-indigo-200 transition-all group"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left: Customer Info */}
                  <div className="flex md:flex-col items-center md:items-start gap-4 md:w-48 shrink-0">
                    <div className="w-12 h-12 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center font-black text-xs shadow-lg uppercase">
                      {review.userName?.substring(0, 2) || "U"}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 leading-none">
                        {review.userName || "Unknown"}
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1 uppercase tracking-tighter">
                        <Clock size={10} /> {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Center: Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex gap-0.5">
                        {renderStars(review.rating)}
                      </div>
                      <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                      <p className="text-xs font-black text-indigo-600 flex items-center gap-1.5 uppercase tracking-tight">
                        <Package size={12} /> {review.product?.name || "Deleted Product"}
                      </p>
                    </div>
                    <p className="text-slate-700 font-medium text-[15px] leading-relaxed italic">
                      "{review.comment}"
                    </p>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex md:flex-col justify-end md:justify-start gap-2">
                    <span
                      className={`self-start px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border mb-2 ${isApproved
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : "bg-orange-50 text-orange-600 border-orange-100"
                        }`}
                    >
                      {isApproved ? "Approved" : "Pending"}
                    </span>
                    <div className="flex gap-2">
                      {!isApproved ? (
                        <button
                          title="Approve"
                          onClick={() => handleStatusChange(review._id, true)}
                          className="p-2.5 bg-slate-50 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                        >
                          <CheckCircle2 size={18} />
                        </button>
                      ) : (
                        <button
                          title="Reject / Unapprove"
                          onClick={() => handleStatusChange(review._id, false)}
                          className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <XCircle size={18} />
                        </button>
                      )}
                      <button
                        title="Delete"
                        onClick={() => handleDelete(review._id)}
                        className="p-2.5 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
