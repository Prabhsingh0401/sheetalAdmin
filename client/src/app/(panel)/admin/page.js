"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  Star,
  UserPlus,
  ArrowRight,
} from "lucide-react";
import PageHeader from "@/components/admin/layout/PageHeader.js";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getDashboardStats } from "@/services/adminService";

const dataOptions = {
  weekly: [
    { name: "Mon", sales: 4000 },
    { name: "Tue", sales: 3000 },
    { name: "Wed", sales: 5000 },
    { name: "Thu", sales: 2780 },
    { name: "Fri", sales: 1890 },
    { name: "Sat", sales: 6390 },
    { name: "Sun", sales: 7490 },
  ],
  monthly: [
    { name: "Week 1", sales: 25000 },
    { name: "Week 2", sales: 32000 },
    { name: "Week 3", sales: 28000 },
    { name: "Week 4", sales: 45000 },
  ],
};

export default function AdminDashboard() {
  const [view, setView] = useState("weekly");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalOrders: 0,
    todayOrders: 0,
    totalProducts: 0,
    latestUsers: [],
    stockData: [],
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getDashboardStats();
        if (res.success) {
          setStats(res.data);
        }
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const scrollStyle = "overflow-y-auto pr-2 custom-scrollbar";


  return (
    <div className="min-h-screen w-full animate-in fade-in duration-500 ">
      <div className="max-w-[1600px] mx-auto ">
        <PageHeader
          title="Executive Dashboard"
          subtitle="Real-time Store Insights & Analytics"
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
          {[
            {
              label: "Total Revenue",
              val: formatCurrency(stats.totalOrders * 2499),
              status: "Live Estimate",
              icon: <DollarSign size={20} />,
              color: "text-emerald-700",
              bg: "bg-emerald-100",
            },
            // {
            //   label: "Total Orders",
            //   val: stats.totalOrders.toLocaleString(),
            //   status: `+${stats.todayOrders} Today`,
            //   icon: <ShoppingCart size={20} />,
            //   color: "text-blue-700",
            //   bg: "bg-blue-100",
            // },
            {
              label: "Active Users",
              val: stats.activeUsers.toLocaleString(),
              status: "Currently Online",
              icon: <Users size={20} />,
              color: "text-indigo-700",
              bg: "bg-indigo-100",
            },
            {
              label: "Total Products",
              val: stats.totalProducts?.toLocaleString() || "0",
              status: "In Inventory",
              icon: <Package size={20} />,
              color: "text-orange-700",
              bg: "bg-orange-100",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all group"
            >
              <div className="flex justify-between items-start">
                <div
                  className={`p-3 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}
                >
                  {stat.icon}
                </div>
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                  {stat.status}
                </span>
              </div>
              <div className="mt-6">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  {stat.label}
                </p>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                  {loading ? "..." : stat.val}
                </h2>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Row Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 pb-10">
          {/* Registrations */}
          <div className="bg-white p-7 rounded-[32px] border border-slate-200 shadow-sm h-[400px] flex flex-col">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2 text-lg">
              <UserPlus size={20} className="text-indigo-600" /> New
              Registrations
            </h3>
            <div className={`flex-1 ${scrollStyle} space-y-4`}>
              {stats.latestUsers && stats.latestUsers.length > 0 ? (
                stats.latestUsers.map((user, i) => (
                  <div
                    key={user._id || i}
                    className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm uppercase">
                      {user.name ? user.name.charAt(0) : "U"}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {user.name || "New Customer"}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        Joined {formatTimeAgo(user.createdAt)}
                      </p>
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-500 text-sm py-4">
                  No new registrations
                </p>
              )}
            </div>
          </div>

          {/* Stock */}
          <div className="bg-white p-7 rounded-[32px] border border-slate-200 shadow-sm h-[400px] flex flex-col">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2 text-lg">
              <Package size={20} className="text-blue-500" /> Stock Analytics
            </h3>
            <div className={`flex-1 ${scrollStyle} space-y-5`}>
              {stats.stockData && stats.stockData.length > 0 ? (
                stats.stockData.map((product, i) => (
                  <div
                    key={product._id || i}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-100"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-sm font-bold text-slate-800 truncate max-w-[150px]">
                        {product.name}
                      </p>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${product.stock < 10
                            ? "text-red-700 bg-red-100"
                            : product.stock < 50
                              ? "text-orange-700 bg-orange-100"
                              : "text-emerald-700 bg-emerald-100"
                          }`}
                      >
                        {product.stock < 10
                          ? "Low Stock"
                          : product.stock < 50
                            ? "Medium"
                            : "Healthy"}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full w-full rounded-full transition-all duration-500 ${product.stock < 10
                            ? "bg-red-500"
                            : product.stock < 50
                              ? "bg-orange-500"
                              : "bg-emerald-500"
                          }`}
                        style={{
                          width: `${Math.min((product.stock / 100) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 font-medium text-right">
                      {product.stock} units available
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-500 text-sm py-4">
                  No stock data available
                </p>
              )}
            </div>
          </div>

          {/* Feedback */}
          {/* <div className="bg-white p-7 rounded-[32px] border border-slate-200 shadow-sm h-[400px] flex flex-col">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2 text-lg">
              <Star size={20} className="text-orange-500" /> Recent Feedback
            </h3>
            <div className={`flex-1 ${scrollStyle} space-y-4`}>
              <div className="p-5 bg-orange-50/50 border border-orange-100 rounded-2xl">
                <div className="flex gap-1 mb-3 text-orange-500">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} size={14} fill="currentColor" />
                  ))}
                </div>
                <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                  "Excellent service and fast delivery. The product quality
                  exceeded my expectations!"
                </p>
                <p className="text-xs font-bold text-slate-900 mt-4 uppercase">
                  — Verified Buyer
                </p>
              </div>
            </div>
          </div> */}
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
