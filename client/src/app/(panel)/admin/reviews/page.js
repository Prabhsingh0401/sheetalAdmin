"use client";
import {
  Star,
  Search,
  Trash2,
  CheckCircle2,
  MessageSquare,
  Package,
  User,
  Filter,
  ThumbsUp,
  XCircle,
  Clock,
} from "lucide-react";
import PageHeader from "@/components/admin/layout/PageHeader.js";

export default function ReviewsPage() {
  const reviews = [
    {
      id: 1,
      customer: "Amit Singh",
      product: "MacBook Pro M3 Max",
      rating: 5,
      comment:
        "Ekdum jabardast product hai! Delivery thodi late thi par quality ne dil jeet liya. Recommended for developers.",
      date: "2 hours ago",
      status: "Approved",
      avatar: "AS",
    },
    {
      id: 2,
      customer: "Sana Khan",
      product: "Nike Air Jordan 1",
      rating: 4,
      comment:
        "Shoes are original and very comfortable. However, the box was slightly damaged during shipping.",
      date: "Yesterday",
      status: "Pending",
      avatar: "SK",
    },
    {
      id: 3,
      customer: "Rahul Verma",
      product: "Sony WH-1000XM5",
      rating: 2,
      comment:
        "ANC is good but the touch controls are not working properly. Want to initiate a replacement.",
      date: "2 days ago",
      status: "Rejected",
      avatar: "RV",
    },
  ];

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
            4.8
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Average Rating
            </p>
            <div className="flex gap-1 mt-1">{renderStars(5)}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm flex items-center gap-4 text-emerald-600">
          <CheckCircle2 size={32} className="opacity-20" />
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Total Approved
            </p>
            <h4 className="text-xl font-black text-slate-900 leading-none mt-1">
              1,240
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
              18
            </h4>
          </div>
        </div>
      </div>

      {/* --- Review Feed --- */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-white p-6 md:p-8 rounded-[28px] border border-slate-200 shadow-sm hover:border-indigo-200 transition-all group"
          >
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left: Customer Info */}
              <div className="flex md:flex-col items-center md:items-start gap-4 md:w-48 shrink-0">
                <div className="w-12 h-12 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center font-black text-xs shadow-lg">
                  {review.avatar}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 leading-none">
                    {review.customer}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1 uppercase tracking-tighter">
                    <Clock size={10} /> {review.date}
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
                    <Package size={12} /> {review.product}
                  </p>
                </div>
                <p className="text-slate-700 font-medium text-[15px] leading-relaxed italic">
                  "{review.comment}"
                </p>
              </div>

              {/* Right: Actions */}
              <div className="flex md:flex-col justify-end md:justify-start gap-2">
                <span
                  className={`self-start px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border mb-2 ${
                    review.status === "Approved"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                      : review.status === "Pending"
                        ? "bg-orange-50 text-orange-600 border-orange-100"
                        : "bg-red-50 text-red-600 border-red-100"
                  }`}
                >
                  {review.status}
                </span>
                <div className="flex gap-2">
                  <button
                    title="Approve"
                    className="p-2.5 bg-slate-50 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                  >
                    <CheckCircle2 size={18} />
                  </button>
                  <button
                    title="Reject"
                    className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <XCircle size={18} />
                  </button>
                  <button
                    title="Delete"
                    className="p-2.5 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
