"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShoppingCart,
  IndianRupee,
  Users,
  Send,
  RefreshCw,
  CheckCircle,
  Loader2,
  AlertCircle,
  Clock,
} from "lucide-react";
import PageHeader from "@/components/admin/layout/PageHeader";
import { getAbandonedCarts, sendCartRecoveryEmail } from "@/services/salesService";
import { getPaginationRange } from "@/utils/pagination";
import toast from "react-hot-toast";

const LIMIT_OPTIONS = [5, 10, 25];

export default function AbandonedCartsPage() {
  const router      = useRouter();
  const searchParams = useSearchParams();

  const limitFromUrl = parseInt(searchParams.get("limit")) || 10;
  const pageFromUrl  = parseInt(searchParams.get("page"))  || 1;

  const [limit, setLimit]           = useState(LIMIT_OPTIONS.includes(limitFromUrl) ? limitFromUrl : 10);
  const [currentPage, setCurrentPage] = useState(pageFromUrl);
  const [allCarts, setAllCarts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  // per-email: "idle" | "sending" | "sent" | "error"
  const [recoveryState, setRecoveryState] = useState({});
  const [stats, setStats]           = useState({
    total: 0,
    totalValue: 0,
    avgValue: 0,
    oldestDays: 0,
  });

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAbandonedCarts(100); // fetch all, paginate client-side
      const data = res.data || [];
      setAllCarts(data);

      const totalValue = data.reduce((s, c) => s + c.cartValue, 0);
      const oldest = data.reduce((max, c) => {
        const days = Math.floor((Date.now() - new Date(c.lastUpdated)) / 86_400_000);
        return days > max ? days : max;
      }, 0);

      setStats({
        total:      data.length,
        totalValue: Math.round(totalValue * 100) / 100,
        avgValue:   data.length ? Math.round((totalValue / data.length) * 100) / 100 : 0,
        oldestDays: oldest,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── URL sync ───────────────────────────────────────────────────
  const syncUrl = (l, p) =>
    router.replace(`/admin/sales-report/abandoned-carts?limit=${l}&page=${p}`);

  const handleLimitChange = (l) => { setLimit(l); setCurrentPage(1); syncUrl(l, 1); };
  const handlePageChange  = (p) => { setCurrentPage(p); syncUrl(limit, p); };

  // ── Recovery email ─────────────────────────────────────────────
  const handleSendRecovery = async (email) => {
    setRecoveryState((p) => ({ ...p, [email]: "sending" }));
    try {
      const res = await sendCartRecoveryEmail(email);
      if (res.success) {
        setRecoveryState((p) => ({ ...p, [email]: "sent" }));
        toast.success(res.message);
        // Remove from list — no longer needs attention
        setAllCarts((p) => p.filter((c) => c.email !== email));
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      setRecoveryState((p) => ({ ...p, [email]: "error" }));
      toast.error(err.message || "Failed to send recovery email");
      setTimeout(() => setRecoveryState((p) => ({ ...p, [email]: "idle" })), 3000);
    }
  };

  // ── Pagination ─────────────────────────────────────────────────
  const totalPages       = Math.ceil(allCarts.length / limit);
  const paginatedCarts   = allCarts.slice((currentPage - 1) * limit, currentPage * limit);

  return (
    <div className="min-h-screen w-full animate-in fade-in duration-500">
      <PageHeader
        title="Abandoned Carts"
        subtitle="Customers who added items but didn't complete their purchase in the last 7+ days"
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

      {/* ── Stat Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Abandoned Carts"
          value={stats.total}
          icon={<ShoppingCart size={20} />}
          color="rose"
        />
        <StatCard
          title="Total Cart Value"
          value={`₹${stats.totalValue.toLocaleString()}`}
          icon={<IndianRupee size={20} />}
          color="amber"
        />
        <StatCard
          title="Avg Cart Value"
          value={`₹${stats.avgValue.toLocaleString()}`}
          icon={<Users size={20} />}
          color="indigo"
        />
        <StatCard
          title="Oldest Cart"
          value={stats.oldestDays ? `${stats.oldestDays}d ago` : "—"}
          icon={<Clock size={20} />}
          color="slate"
        />
      </div>

      {/* ── Table Card ─────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

        {/* Table header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "linear-gradient(135deg,#fb7185,#e11d48)",
              boxShadow: "0 0 8px rgba(225,29,72,0.4)",
            }} />
            <span className="text-xs font-black text-rose-600 uppercase tracking-widest">
              Needs Attention
            </span>
          </div>
          {!loading && (
            <span className="text-xs font-bold text-slate-400">
              {allCarts.length} cart{allCarts.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* States */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={24} className="animate-spin text-indigo-500" />
            <p className="text-sm font-semibold text-slate-400">Loading carts…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <AlertCircle size={28} className="text-rose-500" />
            <p className="text-sm font-semibold text-rose-500">{error}</p>
            <button
              onClick={fetchData}
              className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-2 hover:bg-indigo-100 transition-colors"
            >
              Try again
            </button>
          </div>
        ) : allCarts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="bg-slate-50 rounded-2xl p-4">
              <ShoppingCart size={28} className="text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-400">No abandoned carts</p>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div className="grid grid-cols-12 px-6 py-3 bg-slate-50 border-b border-slate-100">
              <div className="col-span-1  text-[10px] font-black text-slate-400 uppercase tracking-widest">#</div>
              <div className="col-span-4  text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</div>
              <div className="col-span-2  text-[10px] font-black text-slate-400 uppercase tracking-widest">Items</div>
              <div className="col-span-2  text-[10px] font-black text-slate-400 uppercase tracking-widest">Cart Value</div>
              <div className="col-span-2  text-[10px] font-black text-slate-400 uppercase tracking-widest">Abandoned</div>
              <div className="col-span-1  text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</div>
            </div>

            {/* Rows */}
            {paginatedCarts.map((cart, idx) => (
              <CartRow
                key={cart.email}
                cart={cart}
                index={(currentPage - 1) * limit + idx + 1}
                state={recoveryState[cart.email] || "idle"}
                onSend={handleSendRecovery}
              />
            ))}
          </>
        )}

        {/* ── Footer Pagination ───────────────────────────────── */}
        {!loading && !error && allCarts.length > 0 && (
          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Rows selector */}
            <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rows</span>
              <select
                value={limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="text-xs font-black text-slate-900 bg-transparent outline-none cursor-pointer"
              >
                {LIMIT_OPTIONS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {/* Page info */}
            <span className="text-xs font-bold text-slate-400">
              {(currentPage - 1) * limit + 1}–{Math.min(currentPage * limit, allCarts.length)} of {allCarts.length}
            </span>

            {/* Page buttons */}
            <div className="flex items-center gap-1">
              {getPaginationRange(currentPage, totalPages).map((page, i) =>
                page === "..." ? (
                  <span key={`e-${i}`} className="h-9 min-w-9 flex items-center justify-center text-xs font-black text-slate-400">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`h-9 min-w-9 cursor-pointer rounded-xl text-xs font-black transition-all ${
                      currentPage === page
                        ? "bg-slate-900 text-white shadow-lg"
                        : "bg-white border border-slate-200 text-slate-500 hover:border-slate-400"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Cart Row ───────────────────────────────────────────────────────────────────

function CartRow({ cart, index, state, onSend }) {
  return (
    <div className="grid grid-cols-12 items-center px-6 py-4 border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
      {/* Index */}
      <div className="col-span-1">
        <span className="text-xs font-black text-slate-300">{String(index).padStart(2, "0")}</span>
      </div>

      {/* Customer */}
      <div className="col-span-4 flex items-center gap-3 min-w-0">
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: "linear-gradient(135deg,#e0e7ff,#ede9fe)",
          border: "1px solid #e0e7ff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: 12, color: "#4f46e5",
        }}>
          {cart.initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">{cart.email}</p>
          <p className="text-xs text-slate-400 font-medium truncate">{cart.name}</p>
        </div>
      </div>

      {/* Items */}
      <div className="col-span-2">
        <span className="text-xs font-bold text-slate-500">
          {cart.itemCount} item{cart.itemCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Cart value */}
      <div className="col-span-2">
        <span style={{
          fontSize: 13, fontWeight: 800, color: "#e11d48",
          fontFamily: "monospace",
          background: "#fff1f2", border: "1px solid #ffe4e6",
          borderRadius: 7, padding: "3px 9px", whiteSpace: "nowrap",
        }}>
          ₹{cart.cartValue.toFixed(2)}
        </span>
      </div>

      {/* Abandoned date */}
      <div className="col-span-2">
        <span className="text-xs font-semibold text-slate-400">{cart.date}</span>
      </div>

      {/* Action */}
      <div className="col-span-1 flex justify-end">
        <RecoveryButton email={cart.email} state={state} onSend={onSend} />
      </div>
    </div>
  );
}

// ── Recovery Button ────────────────────────────────────────────────────────────

function RecoveryButton({ email, state, onSend }) {
  const configs = {
    idle: {
      icon: <Send size={11} />,
      label: "Send",
      style: { color: "#4f46e5", background: "#eef2ff", border: "1px solid #e0e7ff" },
      hover: { background: "#e0e7ff", border: "1px solid #c7d2fe" },
      disabled: false,
    },
    sending: {
      icon: <Loader2 size={11} className="animate-spin" />,
      label: "Sending",
      style: { color: "#94a3b8", background: "#f8fafc", border: "1px solid #e2e8f0" },
      hover: null,
      disabled: true,
    },
    sent: {
      icon: <CheckCircle size={11} />,
      label: "Sent",
      style: { color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0" },
      hover: null,
      disabled: true,
    },
    error: {
      icon: <AlertCircle size={11} />,
      label: "Retry",
      style: { color: "#e11d48", background: "#fff1f2", border: "1px solid #ffe4e6" },
      hover: { background: "#ffe4e6", border: "1px solid #fecdd3" },
      disabled: false,
    },
  };

  const c = configs[state];

  return (
    <button
      onClick={() => !c.disabled && onSend(email)}
      disabled={c.disabled}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        fontSize: 11, fontWeight: 700, borderRadius: 8,
        padding: "6px 11px", cursor: c.disabled ? "default" : "pointer",
        transition: "all 0.15s ease", letterSpacing: "0.02em",
        ...c.style,
      }}
      onMouseEnter={(e) => {
        if (c.hover) Object.assign(e.currentTarget.style, c.hover);
      }}
      onMouseLeave={(e) => {
        if (c.hover) Object.assign(e.currentTarget.style, c.style);
      }}
    >
      {c.icon}
      {c.label}
    </button>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({ title, value, icon, color }) {
  const colors = {
    rose:   "bg-rose-50   text-rose-500   border-rose-100",
    amber:  "bg-amber-50  text-amber-600  border-amber-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    slate:  "bg-slate-100 text-slate-500  border-slate-200",
  };

  return (
    <div className="bg-white p-5 border border-slate-200 rounded-xl flex items-center gap-4 hover:shadow-md transition-shadow duration-300">
      <div className={`p-3 rounded-lg border shrink-0 ${colors[color]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
          {title}
        </p>
        <p className="text-2xl font-black text-slate-900 mt-1.5 leading-none truncate">
          {value}
        </p>
      </div>
    </div>
  );
}