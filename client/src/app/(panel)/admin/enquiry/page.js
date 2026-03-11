"use client";

import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

import EnquiryStatsCards from "@/components/admin/enquiry/EnquiryStatsCards";
import EnquiryFilters from "@/components/admin/enquiry/EnquiryFilters";
import EnquiryTable from "@/components/admin/enquiry/EnquiryTable";
import EnquiryModal from "@/components/admin/enquiry/EnquiryModal";

import {
  fetchEnquiries,
  deleteEnquiry,
  updateEnquiryStatus,
  sendAvailabilityEmail,
  deriveEnquiryCounts,
} from "@/services/enquiryService";

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [sendingId, setSendingId] = useState(null);
  const [counts, setCounts] = useState({ total: 0, new: 0, read: 0, replied: 0 });

  // ── Data fetching ──────────────────────────────────────────────────────────

  const loadEnquiries = useCallback(async () => {
    setIsLoading(true);
    try {
      const [filtered, all] = await Promise.all([
        fetchEnquiries({ status: statusFilter, search }),
        fetchEnquiries({ status: "all" }),
      ]);
      setEnquiries(filtered);
      setCounts(deriveEnquiryCounts(all));
    } catch {
      toast.error("Failed to load enquiries");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => loadEnquiries(), 300);
    return () => clearTimeout(timer);
  }, [loadEnquiries]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSelect = async (enquiry) => {
    setSelected(enquiry);
    if (enquiry.status === "new") {
      await handleStatusChange(enquiry._id, "read", true);
    }
  };

  const handleStatusChange = async (id, status, silent = false) => {
    setUpdatingId(id);
    try {
      const updated = await updateEnquiryStatus(id, status);
      setEnquiries((prev) => prev.map((e) => (e._id === id ? updated : e)));
      if (selected?._id === id) setSelected(updated);
      if (!silent) toast.success("Status updated");
    } catch {
      if (!silent) toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteEnquiry(id);
      setEnquiries((prev) => prev.filter((e) => e._id !== id));
      if (selected?._id === id) setSelected(null);
      toast.success("Enquiry deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSendAvailability = async (enquiry) => {
    setSendingId(enquiry._id);
    try {
      await sendAvailabilityEmail(enquiry._id);
      await handleStatusChange(enquiry._id, "replied", true);
      toast.success("Availability email sent!");
    } catch {
      toast.error("Failed to send email");
    } finally {
      setSendingId(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <EnquiryStatsCards
        counts={counts}
        statusFilter={statusFilter}
        onFilterChange={setStatusFilter}
      />

      <EnquiryFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        count={enquiries.length}
      />

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <EnquiryTable
          enquiries={enquiries}
          isLoading={isLoading}
          deletingId={deletingId}
          onSelect={handleSelect}
          onDelete={handleDelete}
        />
      </div>

      {selected && (
        <EnquiryModal
          enquiry={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onSendAvailability={handleSendAvailability}
          updatingId={updatingId}
          deletingId={deletingId}
          sendingId={sendingId}
        />
      )}
    </div>
  );
}