"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  ShoppingCart,
  IndianRupee,
  Package,
  Mail,
  ArrowRight,
  Calendar,
  Download,
} from "lucide-react";
import PageHeader from "@/components/admin/layout/PageHeader.js";
import SalesRevenueChart from "@/components/admin/layout/SalesRevenueChart";
import { getDashboardStats } from "@/services/adminService";
import BestSellingProducts from "@/components/admin/sales/BestSellingProducts";
import { getBestSellingItems } from "@/services/salesService";
import { getAllOrders, getOrderStats } from "@/services/orderService";
import { convertSegmentPathToStaticExportFilename } from "next/dist/shared/lib/segment-cache/segment-value-encoding";
import TopReviews from "@/components/admin/layout/TopReviews";

const statusStyles = {
  Shipped: "bg-emerald-100 text-emerald-700",
  Pending: "bg-amber-100 text-amber-700",
  Cancelled: "bg-red-100 text-red-700",
  Processing: "bg-blue-100 text-blue-700",
};

export default function AdminDashboard() {
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
  const [bestSellingProducts, setBestSellingProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getBestSellingItems();
        setBestSellingProducts(data);
      } catch (err) {
        console.error("Error fetching best selling items", err);
      }
    };

    fetchData();
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
    const getTotalRevenue = async ()=>{
      setLoading(true)
      try {
        const res = await getOrderStats()
        setTotalRevenue(res.data.totalRevenue)
      } catch (error) {
        console.log("Error in fetching revenue:", error)
      }finally{
        setLoading(false)
      }
    }

    getTotalRevenue()
  }, [])
  

  useEffect(() => {
    const fetchOrders = async (isRefresh = false) => {
      setLoading(true);
      try {
        const res = await getAllOrders();
        if (res.success) {
          setOrders(res.data.orders);
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

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

  const topStats = [
    {
      label: "Total Sales",
      val: loading ? "..." : formatCurrency(totalRevenue),
      change: "+12.5%",
      positive: true,
    },
    {
      label: "Average Revenue",
      val: loading
        ? "..."
        : formatCurrency(
            stats.totalOrders > 0
              ? (totalRevenue) / stats.totalOrders
              : 3840,
          ),
      change: "-2.4%",
      positive: false,
    },
    {
      label: "Active Customers",
      val: loading ? "..." : stats.activeUsers.toLocaleString() || "0",
      change: "+5.7%",
      positive: true,
    },
    {
      label: "Total Products",
      val: loading ? "..." : stats.totalProducts?.toLocaleString() || "0",
      change: "-0.8%",
      positive: true,
    },
  ];

  return (
    <div className="min-h-screen w-full animate-in fade-in duration-500">
      <div className="max-w-400 mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Overview Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Visualizing performance metrics and customer trends.
            </p>
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
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm hover:shadow-md transition-all"
            >
              <p className="text-xs font-medium text-slate-400 mb-2">
                {stat.label}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-wide leading-none">
                  {stat.val}
                </h2>
                <span
                  className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
                    stat.positive
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-red-50 text-red-500"
                  }`}
                >
                  {stat.positive ? "↑" : "↓"}
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Middle Row: Chart + New Users */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          {/* Sales & Revenue Chart */}
          <div className="lg:col-span-2">
            <SalesRevenueChart />
          </div>

          {/* New Users */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base">New Users</h3>
              <Link
                href="/admin/customers"
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {stats.latestUsers && stats.latestUsers.length > 0
                ? stats.latestUsers.slice(0, 5).map((user, i) => (
                    <div
                      key={user._id || i}
                      className="flex items-center gap-3 py-1.5"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white flex items-center justify-center font-bold text-sm uppercase flex-shrink-0">
                        {user.name ? user.name.charAt(0) : "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {user.name || "New Customer"}
                        </p>
                        <p className="text-xs text-slate-400">
                          Joined {formatTimeAgo(user.createdAt)}
                        </p>
                      </div>
                      <button className="text-slate-300 hover:text-indigo-500 transition-colors">
                        <Mail size={15} />
                      </button>
                    </div>
                  ))
                : // Fallback dummy users matching the screenshot
                  [
                    { name: "Sarah Johnson", time: "26 days ago" },
                    { name: "Mike Ross", time: "28 days ago" },
                    { name: "Elena Gilbert", time: "yesterday" },
                    { name: "David Chen", time: "yesterday" },
                  ].map((u, i) => (
                    <div key={i} className="flex items-center gap-3 py-1.5">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0 ${
                          [
                            "bg-rose-400",
                            "bg-blue-400",
                            "bg-amber-400",
                            "bg-teal-400",
                          ][i]
                        }`}
                      >
                        {u.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">
                          {u.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          Joined {u.time}
                        </p>
                      </div>
                      <button className="text-slate-300 hover:text-indigo-500 transition-colors">
                        <Mail size={15} />
                      </button>
                    </div>
                  ))}
            </div>
          </div>
        </div>

        {/* Bottom Row: Trending Products + Recent Orders */}
        <div className="grid grid-cols1 lg:grid-cols-2 gap-5 pb-10">
          {/* Best Selling Products */}
          <BestSellingProducts products={bestSellingProducts?.data} />

          {/* Recent Orders */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-900 text-lg">
                Recent Orders
              </h3>
              <Link
                href="/admin/orders"
                className="text-sm font-semibold text-indigo-500 hover:text-indigo-700 flex items-center gap-1 transition-colors"
              >
                See all orders <ArrowRight size={14} />
              </Link>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                    Order ID
                  </th>
                  <th className="pb-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                    Customer
                  </th>
                  <th className="pb-3 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                    Amount
                  </th>
                  <th className="pb-3 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders?.slice(0, 5).map((order) => (
                  <tr
                    key={order._id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-4 text-sm font-semibold text-indigo-500">
                      #{order._id.slice(-6)}
                    </td>

                    <td className="py-4 text-sm text-slate-700">
                      {order.user?.name}
                    </td>

                    <td className="py-4 text-right text-sm font-bold text-slate-800">
                      ₹{order.totalPrice}
                    </td>

                    <td className="py-4 text-right">
                      <span
                        className={`text-xs font-medium px-3 py-1 rounded-full ${
                          statusStyles[order.orderStatus] ||
                          "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Top Reviews */}
        <TopReviews/>
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
