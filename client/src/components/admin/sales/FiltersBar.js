"use client";

import { useState } from "react";
import { Mail, Phone, Filter } from "lucide-react";

const CATEGORIES = [
  "All Categories",
  "Electronics",
  "Fashion",
  "Home & Decor",
  "Gadgets",
  "Audio",
  "Wearables",
];

export default function FiltersBar({ onApply }) {
  const [filters, setFilters] = useState({
    email: "",
    mobile: "",
    category: "All Categories",
  });

  const handleApply = () => {
    onApply?.(filters);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        {/* Email search */}
        <div className="flex flex-col gap-2">
          <label className="text-slate-700 text-sm font-bold">
            Search by Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={filters.email}
              onChange={(e) => setFilters({ ...filters, email: e.target.value })}
              placeholder="customer@example.com"
              className="form-input text-slate-900 border-2 w-full pl-10 pr-4 py-2.5 bg-slate-50 border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-primary"
            />
          </div>
        </div>

        {/* Mobile search */}
        <div className="flex flex-col gap-2">
          <label className="text-slate-700 text-sm font-bold">
            Search by Mobile
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={filters.mobile}
              onChange={(e) => setFilters({ ...filters, mobile: e.target.value })}
              placeholder="+1 234 567 890"
              className="form-input text-slate-900 border-2 w-full pl-10 pr-4 py-2.5 bg-slate-50 border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-primary"
            />
          </div>
        </div>

        {/* Category */}
        <div className="flex flex-col gap-2">
          <label className="text-slate-700 text-sm font-bold">
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="form-select text-slate-900 border-2 w-full px-4 py-2.5 bg-slate-50 border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-primary"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Apply */}
        <button
          onClick={handleApply}
          className="bg-slate-900 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Filter size={16} />
          Apply Filters
        </button>
      </div>
    </div>
  );
}