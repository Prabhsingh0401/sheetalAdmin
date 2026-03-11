"use client";
import { useState, useEffect } from "react";
import { Star, ThumbsUp, AlertCircle } from "lucide-react";
import PageHeader from "@/components/admin/layout/PageHeader.js";
import {
  getAdminReviews,
  updateReviewStatusAdmin,
  deleteReviewAdmin,
} from "@/services/productService";
import toast from "react-hot-toast";
import ReviewModal from "@/components/admin/reviews/ReviewModal";
import ReviewTable from "@/components/admin/reviews/ReviewTable";
import {
  StatCard,
  FilterTab,
  StarRow,
} from "@/components/admin/reviews/ReviewShared";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ average: 0, approved: 0, pending: 0 });
  const [filter, setFilter] = useState("all");

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    comment: "",
    rating: 5,
    userName: "",
  });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await getAdminReviews(1, 100, "all");
      if (res.success) {
        const fetched = res.data || [];
        setReviews(fetched);
        let approved = 0,
          pending = 0,
          totalRating = 0;
        fetched.forEach((r) => {
          if (r.isApproved) {
            approved++;
            totalRating += r.rating;
          } else pending++;
        });
        setStats({
          average: approved > 0 ? (totalRating / approved).toFixed(1) : 0,
          approved,
          pending,
        });
      }
    } catch {
      toast.error("Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  };

  // Modal handlers
  const openEdit = (review) => {
    setEditingId(review._id);
    setEditForm({
      comment: review.comment,
      rating: review.rating,
      userName: review.userName,
    });
  };
  const closeEdit = () => {
    setEditingId(null);
    setEditForm({ comment: "", rating: 5, userName: "" });
  };
  const handleFormChange = (field, value) =>
    setEditForm((p) => ({ ...p, [field]: value }));

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await updateReviewStatusAdmin(editingId, editForm);
      if (res.success) {
        toast.success("Review updated");
        fetchReviews();
        closeEdit();
      } else toast.error(res.message || "Failed to update");
    } catch {
      toast.error("Error updating review");
    }
  };

  const handleStatus = async (id, isApproved) => {
    try {
      const res = await updateReviewStatusAdmin(id, { isApproved });
      if (res.success) {
        toast.success(`Review ${isApproved ? "approved" : "rejected"}`);
        fetchReviews();
      } else toast.error(res.message || "Failed to update status");
    } catch {
      toast.error("Error updating status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      const res = await deleteReviewAdmin(id);
      if (res.success) {
        toast.success("Review deleted");
        fetchReviews();
      } else toast.error(res.message || "Failed to delete");
    } catch {
      toast.error("Error deleting review");
    }
  };

  const filtered = reviews.filter((r) => {
    if (filter === "approved") return r.isApproved;
    if (filter === "pending") return !r.isApproved;
    return true;
  });

  return (
    <div className="w-full animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Customer Reviews"
        subtitle="Monitor and moderate product feedback"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 mb-6">
        <StatCard
          icon={<Star size={18} />}
          label="Average Rating"
          value={stats.average}
          color="#f59e0b"
          subtext={<StarRow rating={Math.round(stats.average)} />}
        />
        <StatCard
          icon={<ThumbsUp size={18} />}
          label="Approved"
          value={stats.approved}
          color="#10b981"
          subtext={
            <p className="text-xs text-slate-400">
              {reviews.length > 0
                ? Math.round((stats.approved / reviews.length) * 100)
                : 0}
              % of total
            </p>
          }
        />
        <StatCard
          icon={<AlertCircle size={18} />}
          label="Awaiting Review"
          value={stats.pending}
          color="#f97316"
          subtext={
            <p className="text-xs text-slate-400">
              {stats.pending > 0 ? "Action required" : "All caught up!"}
            </p>
          }
        />
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1 w-fit mb-5 border border-slate-100">
        <FilterTab
          label="All"
          active={filter === "all"}
          count={reviews.length}
          onClick={() => setFilter("all")}
        />
        <FilterTab
          label="Approved"
          active={filter === "approved"}
          count={stats.approved}
          onClick={() => setFilter("approved")}
        />
        <FilterTab
          label="Pending"
          active={filter === "pending"}
          count={stats.pending}
          onClick={() => setFilter("pending")}
        />
      </div>

      {/* Table */}
      <ReviewTable
        reviews={filtered}
        loading={loading}
        total={reviews.length}
        onEdit={openEdit}
        onStatus={handleStatus}
        onDelete={handleDelete}
      />

      {/* Edit Modal */}
      <ReviewModal
        isOpen={!!editingId}
        editForm={editForm}
        onChange={handleFormChange}
        onSubmit={handleEditSubmit}
        onClose={closeEdit}
      />
    </div>
  );
}
