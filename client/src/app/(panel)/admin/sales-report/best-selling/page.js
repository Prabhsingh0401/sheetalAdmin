"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShoppingBag,
  TrendingUp,
  PackageCheck,
  IndianRupee,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import PageHeader from "@/components/admin/layout/PageHeader";
import BestSellingProducts from "@/components/admin/sales/BestSellingProducts";
import { getBestSellingItems } from "@/services/salesService";
import { getPaginationRange } from "@/utils/pagination";

const LIMIT_OPTIONS = [5, 10, 25];

export default function BestSellingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const limitFromUrl = parseInt(searchParams.get("limit")) || 5;
  const pageFromUrl = parseInt(searchParams.get("page")) || 1;

  const [limit, setLimit] = useState(
    LIMIT_OPTIONS.includes(limitFromUrl) ? limitFromUrl : 10,
  );
  const [currentPage, setCurrentPage] = useState(pageFromUrl);

  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalUnitsSold: 0,
    totalRevenue: 0,
    topProduct: "—",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getBestSellingItems();
      const data = res.data || [];
      setAllProducts(data);

      setStats({
        totalProducts: data.length,
        totalUnitsSold: data.reduce((sum, p) => sum + (p.unitsSold || 0), 0),
        totalRevenue: data.reduce((sum, p) => sum + (p.totalRevenue || 0), 0),
        topProduct: data[0]?.name || "—",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const syncUrl = (newLimit, newPage) => {
    router.replace(
      `/admin/sales-report/best-selling?limit=${newLimit}&page=${newPage}`,
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
  const totalPages = Math.ceil(allProducts.length / limit);
  const paginatedProducts = allProducts.slice(
    (currentPage - 1) * limit,
    currentPage * limit,
  );

  return (
    <div className="min-h-screen w-full animate-in fade-in duration-500">
      <PageHeader
        title="Best Selling Products"
        subtitle="Track top performing products by units sold and revenue generated"
        action={
          <button
            onClick={fetchData}
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
          title="Total Products"
          value={stats.totalProducts}
          icon={<ShoppingBag size={20} />}
          color="indigo"
        />
        <StatCard
          title="Total Units Sold"
          value={stats.totalUnitsSold.toLocaleString()}
          icon={<PackageCheck size={20} />}
          color="emerald"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          icon={<IndianRupee size={20} />}
          color="amber"
        />
        <StatCard
          title="Top Product"
          value={stats.topProduct}
          icon={<TrendingUp size={20} />}
          color="blue"
          isText
        />
      </div>

      {/* Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <BestSellingProducts
          products={paginatedProducts}
          isLoading={loading}
          error={error}
        />

        {/* Footer Pagination */}
        {!loading && !error && allProducts.length > 0 && (
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
          className={`font-black text-slate-900 mt-1.5 leading-none truncate ${
            isText ? "text-sm" : "text-2xl"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
