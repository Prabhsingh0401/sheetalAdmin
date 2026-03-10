"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Search,
  Trash2,
  X,
  MapPin,
  Phone,
  Mail,
  Calendar,
  FileText,
  ChevronDown,
  User,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { API_BASE_URL } from "@/services/api";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700 border border-amber-200",
  confirmed: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  cancelled: "bg-rose-100 text-rose-500 border border-rose-200",
};

const STATUS_OPTIONS = ["all", "pending", "confirmed", "cancelled"];

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${STATUS_STYLES[status]}`}
    >
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

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null); // for modal
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
  });


  // Update fetchAppointments to derive counts after fetching
  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/appointments`, {
        params: { status: statusFilter, search },
        withCredentials: true,
      });
      if (data.success) {
        setAppointments(data.appointments);
      }

      // Always fetch unfiltered counts
      const { data: allData } = await axios.get(
        `${API_BASE_URL}/appointments`,
        {
          params: { status: "all" },
          withCredentials: true,
        },
      );
      if (allData.success) {
        const all = allData.appointments;
        setCounts({
          total: all.length,
          pending: all.filter((a) => a.status === "pending").length,
          confirmed: all.filter((a) => a.status === "confirmed").length,
          cancelled: all.filter((a) => a.status === "cancelled").length,
        });
      }
    } catch (err) {
      toast.error("Failed to load appointments");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, search]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAppointments();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchAppointments]);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      const { data } = await axios.delete(
        `${API_BASE_URL}/appointments/${id}`,
        { withCredentials: true },
      );
      if (data.success) {
        setAppointments((prev) => prev.filter((a) => a._id !== id));
        if (selected?._id === id) setSelected(null);
        toast.success("Appointment deleted");
      }
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusChange = async (id, status) => {
    setUpdatingId(id);
    try {
      const { data } = await axios.patch(
        `${API_BASE_URL}/appointments/${id}/status`,
        { status },
        { withCredentials: true },
      );
      if (data.success) {
        setAppointments((prev) =>
          prev.map((a) => (a._id === id ? data.appointment : a)),
        );
        if (selected?._id === id) setSelected(data.appointment);
        toast.success("Status updated");
      }
    } catch {
      toast.error("Failed to update status");
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
              bg: "bg-slate-50",
              text: "text-black",
              sub: "text-slate-600",
              icon: "🗓️",
            },
            {
              label: "Pending",
              value: counts.pending,
              bg: "bg-amber-50",
              text: "text-amber-700",
              sub: "text-amber-400",
              border: "border border-amber-200",
              icon: "⏳",
            },
            {
              label: "Confirmed",
              value: counts.confirmed,
              bg: "bg-emerald-50",
              text: "text-emerald-700",
              sub: "text-emerald-400",
              border: "border border-emerald-200",
              icon: "✅",
            },
            {
              label: "Cancelled",
              value: counts.cancelled,
              bg: "bg-rose-50",
              text: "text-rose-500",
              sub: "text-rose-300",
              border: "border border-rose-200",
              icon: "✕",
            },
          ].map((card) => (
            <button
              key={card.label}
              onClick={() =>
                setStatusFilter(
                  card.label === "Total" ? "all" : card.label.toLowerCase(),
                )
              }
              className={`${card.bg} ${card.border ?? ""} rounded-3xl p-5 text-left shadow-sm hover:scale-[1.02] transition-transform active:scale-95 cursor-pointer`}
            >
              <p className={`text-2xl font-black ${card.text}`}>{card.value}</p>
              <div className="flex items-center justify-between mt-1">
                <p
                  className={`text-[11px] font-black uppercase tracking-widest ${card.text} opacity-70`}
                >
                  {card.label}
                </p>
                <span className="text-base">{card.icon}</span>
              </div>
            </button>
          ))}
        </div>
      {/* Header + Filters */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase">
              Appointments
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {appointments.length} appointment
              {appointments.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>
        

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-8 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition placeholder:text-slate-300"
            />
          </div>

          {/* Status filter */}
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
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-300">
            <Calendar size={40} strokeWidth={1} />
            <p className="text-[10px] font-bold mt-2 uppercase tracking-widest text-slate-400">
              No appointments found
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {[
                    "Name",
                    "Email",
                    "Contact",
                    "City",
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
                {appointments.map((a) => (
                  <tr
                    key={a._id}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => setSelected(a)}
                        className="font-semibold text-slate-800 hover:text-slate-900 hover:underline text-left"
                      >
                        {a.name}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{a.email}</td>
                    <td className="px-5 py-3.5 text-slate-500">{a.contact}</td>
                    <td className="px-5 py-3.5 text-slate-500">{a.city}</td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                      {formatDate(a.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelected(a)}
                          className="text-[10px] cursor-pointer font-bold text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1 hover:border-slate-400 transition"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(a._id)}
                          disabled={deletingId === a._id}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500 hover:text-white border border-slate-200 hover:border-rose-500 transition disabled:opacity-50"
                        >
                          {deletingId === a._id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Trash2 size={12} className="cursor-pointer" />
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
              <DetailRow icon={User} label="Full Name" value={selected.name} />
              <DetailRow icon={Mail} label="Email" value={selected.email} />
              <DetailRow
                icon={Phone}
                label="Contact"
                value={selected.contact}
              />
              <DetailRow
                icon={MapPin}
                label="Address"
                value={selected.address}
              />
              <DetailRow icon={MapPin} label="City" value={selected.city} />
              <DetailRow
                icon={MapPin}
                label="Pincode"
                value={selected.pincode}
              />
              {selected.requirements && (
                <DetailRow
                  icon={FileText}
                  label="Requirements"
                  value={selected.requirements}
                />
              )}
            </div>

            {/* Status + Actions */}
            <div className="px-6 pb-6 space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Update Status
              </p>
              <div className="flex gap-2 flex-wrap">
                {["pending", "confirmed", "cancelled"].map((s) => (
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
                Delete Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
