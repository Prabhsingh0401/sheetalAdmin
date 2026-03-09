"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mail,
  ArrowRight,
  Calendar,
  Download,
} from "lucide-react";
import SalesRevenueChart from "@/components/admin/layout/SalesRevenueChart";
import BestSellingProducts from "@/components/admin/sales/BestSellingProducts";
import TopReviews from "@/components/admin/layout/TopReviews";
import { getDashboardStats } from "@/services/adminService";
import { getBestSellingItems, getChartData } from "@/services/salesService";
import { getAllOrders } from "@/services/orderService";

const statusStyles = {
  Shipped:    "bg-emerald-100 text-emerald-700",
  Pending:    "bg-amber-100 text-amber-700",
  Cancelled:  "bg-red-100 text-red-700",
  Processing: "bg-blue-100 text-blue-700",
};

export default function AdminDashboard() {
  const [loading, setLoading]             = useState(true);
  const [stats, setStats]                 = useState({
    totalUsers: 0, activeUsers: 0, totalOrders: 0,
    todayOrders: 0, totalProducts: 0, latestUsers: [], stockData: [],
  });
  const [bestSellingProducts, setBestSellingProducts] = useState([]);
  const [orders, setOrders]               = useState([]);
  const [period, setPeriod]               = useState("weekly");
  const [chartTotals, setChartTotals]     = useState({ sales: 0, revenue: 0 });
  const [totalsLoading, setTotalsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getBestSellingItems();
        setBestSellingProducts(data);
      } catch (err) {
        console.error("Error fetching best selling items", err);
      }
    };
    fetch();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await getDashboardStats();
        if (res.success) setStats(res.data);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await getAllOrders();
        if (res.success) setOrders(res.data.orders);
      } catch (err) {
        console.error("Error fetching orders:", err);
      }
    };
    fetchOrders();
  }, []);

  // Refetch totals whenever period changes — drives the stat cards
  useEffect(() => {
    const fetchTotals = async () => {
      setTotalsLoading(true);
      try {
        const res = await getChartData({ period });
        if (res.success) setChartTotals(res.totals || { sales: 0, revenue: 0 });
      } catch (err) {
        console.error("Error fetching chart totals:", err);
      } finally {
        setTotalsLoading(false);
      }
    };
    fetchTotals();
  }, [period]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency", currency: "INR", maximumFractionDigits: 0,
    }).format(amount || 0);

  const formatTimeAgo = (dateString) => {
    const diffInSeconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (diffInSeconds < 60)     return "Just now";
    if (diffInSeconds < 3600)   return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)  return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return new Date(dateString).toLocaleDateString();
  };

  const PERIOD_LABEL = { weekly: "This week", monthly: "This month", yearly: "This year" };

  const topStats = [
    {
      label: "Total Sales",
      val:    totalsLoading ? "..." : formatCurrency(chartTotals.revenue),
      change: PERIOD_LABEL[period],
      positive: true,
    },
    {
      label: "Total Orders",
      val:    totalsLoading ? "..." : chartTotals.sales.toLocaleString(),
      change: PERIOD_LABEL[period],
      positive: true,
    },
    {
      label: "Active Customers",
      val:    loading ? "..." : (stats.activeUsers?.toLocaleString() || "0"),
      change: "+5.7%",
      positive: true,
    },
    {
      label: "Total Products",
      val:    loading ? "..." : (stats.totalProducts?.toLocaleString() || "0"),
      change: "+0.8%",
      positive: true,
    },
  ];

  return (
    <div className="min-h-screen w-full animate-in fade-in duration-500">
      <div className="max-w-400 mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Overview Dashboard</h1>
            <p className="text-sm text-slate-500 mt-0.5">Visualizing performance metrics and customer trends.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">
              <Calendar size={15} />
              Last 30 Days
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all">
              <Download size={15} />
              Export Report
            </button>
          </div>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {topStats.map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm hover:shadow-md transition-all">
              <p className="text-xs font-medium text-slate-400 mb-2">{stat.label}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-wide leading-none">
                  {stat.val}
                </h2>
                <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
                  stat.positive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                }`}>
                  {stat.positive ? "↑" : "↓"}{stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Middle Row: Chart + New Users */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          <div className="lg:col-span-2">
            <SalesRevenueChart onPeriodChange={setPeriod} />
          </div>

          {/* New Users */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base">New Users</h3>
              <Link href="/admin/customers" className="text-xs font-semibold text-indigo-600 hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {stats.latestUsers?.length > 0
                ? stats.latestUsers.slice(0, 5).map((user, i) => (
                    <div key={user._id || i} className="flex items-center gap-3 py-1.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white flex items-center justify-center font-bold text-sm uppercase flex-shrink-0">
                        {user.name?.charAt(0) || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{user.name || "New Customer"}</p>
                        <p className="text-xs text-slate-400">Joined {formatTimeAgo(user.createdAt)}</p>
                      </div>
                      <button className="text-slate-300 hover:text-indigo-500 transition-colors">
                        <Mail size={15} />
                      </button>
                    </div>
                  ))
                : [
                    { name: "Sarah Johnson", time: "26 days ago" },
                    { name: "Mike Ross",     time: "28 days ago" },
                    { name: "Elena Gilbert", time: "yesterday"   },
                    { name: "David Chen",    time: "yesterday"   },
                  ].map((u, i) => (
                    <div key={i} className="flex items-center gap-3 py-1.5">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0 ${["bg-rose-400","bg-blue-400","bg-amber-400","bg-teal-400"][i]}`}>
                        {u.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{u.name}</p>
                        <p className="text-xs text-slate-400">Joined {u.time}</p>
                      </div>
                      <button className="text-slate-300 hover:text-indigo-500 transition-colors">
                        <Mail size={15} />
                      </button>
                    </div>
                  ))
              }
            </div>
          </div>
        </div>

        {/* Bottom Row: Best Selling + Recent Orders + Top Reviews */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_280px] gap-5 pb-10">
          <BestSellingProducts products={bestSellingProducts?.data} />

          {/* Recent Orders */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-900 text-lg">Recent Orders</h3>
              <Link href="/admin/orders" className="text-sm font-semibold text-indigo-500 hover:text-indigo-700 flex items-center gap-1 transition-colors">
                See all orders <ArrowRight size={14} />
              </Link>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Order ID", "Customer", "Amount", "Status"].map((h, i) => (
                    <th key={h} className={`pb-3 text-[11px] font-semibold text-slate-400 uppercase tracking-widest ${i > 1 ? "text-right" : "text-left"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders?.slice(0, 5).map((order) => (
                  <tr key={order._id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 text-sm font-semibold text-indigo-500">#{order._id.slice(-6)}</td>
                    <td className="py-4 text-sm text-slate-700">{order.user?.name}</td>
                    <td className="py-4 text-right text-sm font-bold text-slate-800">₹{order.totalPrice}</td>
                    <td className="py-4 text-right">
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusStyles[order.orderStatus] || "bg-slate-100 text-slate-500"}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <TopReviews />
        </div>

      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}