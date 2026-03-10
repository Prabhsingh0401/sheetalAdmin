"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Search,
  Trash2,
  X,
  Phone,
  Mail,
  ChevronDown,
  User,
  Package,
  Ruler,
  MessageSquare,
  Calendar,
  AlertCircle,
  BookOpen,
  CheckCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { API_BASE_URL } from "@/services/api";

const STATUS_STYLES = {
  new: "bg-blue-100 text-blue-700 border border-blue-200",
  read: "bg-slate-100 text-slate-600 border border-slate-200",
  replied: "bg-emerald-100 text-emerald-700 border border-emerald-200",
};

const STATUS_OPTIONS = ["all", "new", "read", "replied"];

const STATUS_ICONS = {
  new: AlertCircle,
  read: BookOpen,
  replied: CheckCheck,
};

function StatusBadge({ status }) {
  const Icon = STATUS_ICONS[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${STATUS_STYLES[status]}`}
    >
      <Icon size={10} />
      {status}
    </span>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={13} className="text-slate-500" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {label}
        </p>
        <p className="text-sm text-slate-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [counts, setCounts] = useState({
    total: 0,
    new: 0,
    read: 0,
    replied: 0,
  });

  const fetchEnquiries = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/enquiries`, {
        params: { status: statusFilter, search },
        withCredentials: true,
      });
      if (data.success) setEnquiries(data.enquiries);

      // Unfiltered counts
      const { data: allData } = await axios.get(`${API_BASE_URL}/enquiry`, {
        params: { status: "all" },
        withCredentials: true,
      });
      if (allData.success) {
        const all = allData.enquiries;
        setCounts({
          total: all.length,
          new: all.filter((e) => e.status === "new").length,
          read: all.filter((e) => e.status === "read").length,
          replied: all.filter((e) => e.status === "replied").length,
        });
      }
    } catch {
      toast.error("Failed to load enquiries");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => fetchEnquiries(), 300);
    return () => clearTimeout(timer);
  }, [fetchEnquiries]);

  // Auto-mark as read when modal opens
  const handleSelect = async (enquiry) => {
    setSelected(enquiry);
    if (enquiry.status === "new") {
      await handleStatusChange(enquiry._id, "read", true);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      const { data } = await axios.delete(`${API_BASE_URL}/enquiries/${id}`, {
        withCredentials: true,
      });
      if (data.success) {
        setEnquiries((prev) => prev.filter((e) => e._id !== id));
        if (selected?._id === id) setSelected(null);
        toast.success("Enquiry deleted");
      }
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusChange = async (id, status, silent = false) => {
    setUpdatingId(id);
    try {
      const { data } = await axios.patch(
        `${API_BASE_URL}/enquiries/${id}/status`,
        { status },
        { withCredentials: true },
      );
      if (data.success) {
        setEnquiries((prev) =>
          prev.map((e) => (e._id === id ? data.enquiry : e)),
        );
        if (selected?._id === id) setSelected(data.enquiry);
        if (!silent) toast.success("Status updated");
      }
    } catch {
      if (!silent) toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total",
            value: counts.total,
            sub: "All enquiries",
            icon: MessageSquare,
            iconBg: "bg-slate-100",
            iconColor: "text-slate-500",
            filter: "all",
          },
          {
            label: "New",
            value: counts.new,
            sub: counts.total
              ? `${Math.round((counts.new / counts.total) * 100)}% of total`
              : "0% of total",
            icon: AlertCircle,
            iconBg: "bg-blue-100",
            iconColor: "text-blue-500",
            filter: "new",
          },
          {
            label: "Read",
            value: counts.read,
            sub: counts.total
              ? `${Math.round((counts.read / counts.total) * 100)}% of total`
              : "0% of total",
            icon: BookOpen,
            iconBg: "bg-slate-100",
            iconColor: "text-slate-500",
            filter: "read",
          },
          {
            label: "Replied",
            value: counts.replied,
            sub:
              counts.replied === 0
                ? "None yet"
                : `${Math.round((counts.replied / counts.total) * 100)}% of total`,
            icon: CheckCheck,
            iconBg: "bg-emerald-100",
            iconColor: "text-emerald-500",
            filter: "replied",
          },
        ].map((card) => (
          <button
            key={card.label}
            onClick={() => setStatusFilter(card.filter)}
            className={`bg-white border rounded-2xl p-5 text-left shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer ${
              statusFilter === card.filter
                ? "border-slate-400"
                : "border-slate-200"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`${card.iconBg} p-2.5 rounded-xl shrink-0`}>
                <card.icon size={18} className={card.iconColor} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  {card.label}
                </p>
                <p className="text-3xl font-black text-slate-900 mt-1 leading-none">
                  {card.value}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">{card.sub}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-sm font-black text-slate-900 uppercase">
            Enquiries
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {enquiries.length} enquir{enquiries.length !== 1 ? "ies" : "y"}{" "}
            found
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or product..."
              className="w-full pl-8 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition placeholder:text-slate-300"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-8 py-2.5 outline-none focus:ring-2 focus:ring-slate-400 transition cursor-pointer font-medium capitalize"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s === "all" ? "All Statuses" : s}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="animate-spin text-slate-400" size={28} />
          </div>
        ) : enquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-300">
            <MessageSquare size={40} strokeWidth={1} />
            <p className="text-[10px] font-bold mt-2 uppercase tracking-widest text-slate-400">
              No enquiries found
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {[
                    "Name",
                    "Product",
                    "Size",
                    "Email",
                    "Phone",
                    "Date",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-5 py-3.5"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enquiries.map((e) => (
                  <tr
                    key={e._id}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleSelect(e)}
                        className="font-semibold text-slate-800 hover:underline text-left flex items-center gap-1.5"
                      >
                        {e.status === "new" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        )}
                        {e.name}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">
                      {e.productName}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                        {e.size}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{e.email}</td>
                    <td className="px-5 py-3.5 text-slate-500">{e.phone}</td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                      {formatDate(e.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={e.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleSelect(e)}
                          className="text-[10px] cursor-pointer font-bold text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1 hover:border-slate-400 transition"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(e._id)}
                          disabled={deletingId === e._id}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500 hover:text-white border border-slate-200 hover:border-rose-500 transition disabled:opacity-50"
                        >
                          {deletingId === e._id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Trash2 size={12} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-hide animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-500 text-base">
                  {selected.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-black text-slate-900">{selected.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {formatDate(selected.createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 rounded-xl cursor-pointer hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <DetailRow icon={User} label="Name" value={selected.name} />
              <DetailRow icon={Mail} label="Email" value={selected.email} />
              <DetailRow icon={Phone} label="Phone" value={selected.phone} />
              <DetailRow
                icon={Package}
                label="Product"
                value={selected.productName}
              />
              <DetailRow icon={Ruler} label="Size" value={selected.size} />
              {selected.message && (
                <DetailRow
                  icon={MessageSquare}
                  label="Message"
                  value={selected.message}
                />
              )}
            </div>

            {/* Status + Actions */}
            <div className="px-6 pb-6 space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Update Status
              </p>
              <div className="flex gap-2 flex-wrap">
                {["new", "read", "replied"].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(selected._id, s)}
                    disabled={
                      selected.status === s || updatingId === selected._id
                    }
                    className={`px-4 cursor-pointer py-2 rounded-xl text-xs font-bold capitalize transition-all border disabled:cursor-not-allowed
                                            ${
                                              selected.status === s
                                                ? STATUS_STYLES[s] +
                                                  " opacity-100"
                                                : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-400"
                                            }`}
                  >
                    {updatingId === selected._id && selected.status !== s ? (
                      <Loader2 size={12} className="animate-spin inline" />
                    ) : (
                      s
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleDelete(selected._id)}
                disabled={deletingId === selected._id}
                className="w-full cursor-pointer flex items-center justify-center gap-2 mt-2 border border-rose-200 text-rose-500 hover:bg-rose-500 hover:text-white py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {deletingId === selected._id ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Trash2 size={13} />
                )}
                Delete Enquiry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
