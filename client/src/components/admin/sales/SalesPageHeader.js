"use client";

import { ChevronLeft, ChevronRight, Download } from "lucide-react";

export default function SalesPageHeader({
  title = "Sales Report",
  subtitle = "Detailed overview of your store's performance metrics.",
  dateRange = "Oct 1 - Oct 31, 2023",
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
      <div>
        <h1 className="text-slate-900 text-4xl font-black leading-tight tracking-tight">
          {title}
        </h1>
        <p className="text-slate-500 mt-1">{subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white p-1.5 border border-slate-200 rounded-lg shadow-sm">
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-lg text-slate-900"><ChevronLeft /></span>
          </button>
          <span className="text-sm font-bold px-4 text-slate-700">
            {dateRange}
          </span>
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-lg text-slate-900"><ChevronRight /></span>
          </button>
        </div>

        <button className="flex items-center gap-2 bg-blue-600 text-white text-sm font-bold py-2.5 px-5 rounded-lg shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
          <span className="material-symbols-outlined text-sm"><Download/></span>
          Export Report
        </button>
      </div>
    </div>
  );
}