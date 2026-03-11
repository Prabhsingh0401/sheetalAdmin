"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  TrendingUp,
  Package,
  RefreshCw,
  LayoutList,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import PageHeader from "@/components/admin/layout/PageHeader";
import MostViewedItems from "@/components/admin/sales/MostViewedItems";
import { getMostViewedProducts } from "@/services/productService";
import { getPaginationRange } from "@/utils/pagination";

const LIMIT_OPTIONS = [5, 10, 25];

export default function MostViewedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const limitFromUrl = parseInt(searchParams.get("limit")) || 10;
  const pageFromUrl = parseInt(searchParams.get("page")) || 1;

  const [limit, setLimit] = useState(
    LIMIT_OPTIONS.includes(limitFromUrl) ? limitFromUrl : 10,
  );
  const [currentPage, setCurrentPage] = useState(pageFromUrl);

  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalViews: 0,
    topProduct: "—",
    topCategory: "—",
  });

  const fetchData = useCallback(async (currentLimit) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch max (25) always, paginate client-side
      const data = await getMostViewedProducts(25);
      setAllItems(data);

      const totalViews = data.reduce((sum, p) => sum + (p.views || 0), 0);
      const categoryMap = data.reduce((acc, p) => {
        acc[p.category] = (acc[p.category] || 0) + p.views;
        return acc;
      }, {});
      const topCategory =
        Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

      setStats({ totalViews, topProduct: data[0]?.name || "—", topCategory });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync state → URL
  const syncUrl = (newLimit, newPage) => {
    router.replace(
      `/admin/sales-report/most-viewed?limit=${newLimit}&page=${newPage}`,
    );
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setCurrentPage(1);
    syncUrl(newLimit, 1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    syncUrl(limit, newPage);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Client-side pagination
  const totalPages = Math.ceil(allItems.length / limit);
  const paginatedItems = allItems.slice(
    (currentPage - 1) * limit,
    currentPage * limit,
  );

  return (
    <div className="min-h-screen w-full animate-in fade-in duration-500">
      <PageHeader
        title="Most Viewed Products"
        subtitle="Monitor which products are getting the most attention from your customers"
        action={
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-sm font-bold transition-all cursor-pointer disabled:opacity-50 active:scale-95"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Showing"
          value={`Top ${limit}`}
          icon={<LayoutList size={20} />}
          color="indigo"
          isText
        />
        <StatCard
          title="Total Views"
          value={stats.totalViews.toLocaleString()}
          icon={<Eye size={20} />}
          color="emerald"
        />
        <StatCard
          title="Most Viewed"
          value={stats.topProduct}
          icon={<TrendingUp size={20} />}
          color="amber"
          isText
        />
        <StatCard
          title="Top Category"
          value={stats.topCategory}
          icon={<Package size={20} />}
          color="blue"
          isText
        />
      </div>

      {/* Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Widget */}
        <MostViewedItems
          items={paginatedItems}
          loading={loading}
          error={error}
        />

        {/* Footer Pagination */}
        {!loading && !error && allItems.length > 0 && (
          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Rows selector */}
            <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Rows
              </span>
              <select
                value={limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="text-xs font-black text-slate-900 bg-transparent outline-none cursor-pointer"
              >
                {LIMIT_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {/* Pagination */}
            <div className="flex items-center gap-1">
              {getPaginationRange(currentPage, totalPages).map((page, i) =>
                page === "..." ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="h-9 min-w-[36px] flex items-center justify-center text-xs font-black text-slate-400"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`h-9 min-w-[36px] cursor-pointer rounded-xl text-xs font-black transition-all ${
                      currentPage === page
                        ? "bg-slate-900 text-white shadow-lg"
                        : "bg-white border border-slate-200 text-slate-500 hover:border-slate-400"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, isText = false }) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
  };

  return (
    <div className="bg-white p-5 border border-slate-200 rounded-xl flex items-center gap-4 hover:shadow-md transition-shadow duration-300">
      <div className={`p-3 rounded-lg border flex-shrink-0 ${colors[color]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
          {title}
        </p>
        <p
          className={`font-black text-slate-900 mt-1.5 leading-none truncate ${isText ? "text-sm" : "text-2xl"}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
