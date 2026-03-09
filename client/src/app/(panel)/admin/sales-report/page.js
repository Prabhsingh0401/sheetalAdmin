"use client";

import { useEffect, useState } from "react";
import { CreditCard, ShoppingBag, BarChart2, ShoppingCart } from "lucide-react";
import SalesPageHeader from "@/components/admin/sales/SalesPageHeader";
import AbandonedCarts from "@/components/admin/sales/AbandonedCarts";
import BestSellingProducts from "@/components/admin/sales/BestSellingProducts";
import FiltersBar from "@/components/admin/sales/FiltersBar";
import MostViewedItems from "@/components/admin/sales/MostViewedItems";
import SalesTrendsChart from "@/components/admin/sales/SalesTrendsChart";
import StatsRow from "@/components/admin/sales/StatsRow";
import TrafficSources from "@/components/admin/sales/TrafficSource";

import { getBestSellingItems } from "@/services/salesService";
import { getOrderStats } from "@/services/orderService";

// ─────────────────────────────────────────────────────────────────────────────
// Mock data — swap each for a real API call when ready
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_STATS = [
  {
    label: "Total Sales",
    value: "$128,430.00",
    change: "+12.5% vs last month",
    trend: "up",
    icon: CreditCard,
    accentColor: "bg-primary/10 text-black",
  },
  {
    label: "Total Orders",
    value: "1,240",
    change: "-2.1% vs last month",
    trend: "down",
    icon: ShoppingBag,
    accentColor: "bg-emerald-500/10 text-emerald-600",
  },
  {
    label: "Average Order Value",
    value: "$103.57",
    change: "+4.3% vs last month",
    trend: "up",
    icon: BarChart2,
    accentColor: "bg-amber-500/10 text-amber-600",
  },
  {
    label: "Abandoned Cart Rate",
    value: "12.4%",
    change: "0.8% decrease",
    trend: "down",
    icon: ShoppingCart,
    accentColor: "bg-indigo-500/10 text-indigo-600",
  },
];

const MOCK_WEEKLY_DATA = [
  { label: "Mon", revenue: 12000 },
  { label: "Tue", revenue: 18000 },
  { label: "Wed", revenue: 14000 },
  { label: "Thu", revenue: 24000 },
  { label: "Fri", revenue: 21000 },
  { label: "Sat", revenue: 27000 },
  { label: "Sun", revenue: 30000 },
];

const MOCK_MONTHLY_DATA = [
  { label: "Jan", revenue: 52000 },
  { label: "Feb", revenue: 47000 },
  { label: "Mar", revenue: 61000 },
  { label: "Apr", revenue: 55000 },
  { label: "May", revenue: 70000 },
  { label: "Jun", revenue: 68000 },
  { label: "Jul", revenue: 74000 },
  { label: "Aug", revenue: 80000 },
  { label: "Sep", revenue: 77000 },
  { label: "Oct", revenue: 90000 },
  { label: "Nov", revenue: 85000 },
  { label: "Dec", revenue: 95000 },
];

const MOCK_MOST_VIEWED = [
  {
    rank: 1,
    name: "Leather Messenger Bag",
    category: "Fashion & Accessories",
    views: 12400,
  },
  {
    rank: 2,
    name: "Mechanical Keyboard Pro",
    category: "PC Peripherals",
    views: 8900,
  },
  { rank: 3, name: "Ultralight Backpack", category: "Outdoor", views: 6200 },
  { rank: 4, name: "Silk Sleep Mask", category: "Lifestyle", views: 4100 },
];

const MOCK_TRAFFIC_SOURCES = [
  { label: "Direct", percentage: 45, color: "bg-primary" },
  { label: "Search", percentage: 30, color: "bg-emerald-500" },
  { label: "Social", percentage: 15, color: "bg-amber-500" },
  { label: "Referral", percentage: 10, color: "bg-slate-300" },
];

const MOCK_ABANDONED_CARTS = [
  {
    initials: "JD",
    email: "jessica.d@outlook.com",
    date: "Oct 28, 2023 11:20 AM",
    cartValue: 245.0,
  },
  {
    initials: "MK",
    email: "mike.k@gmail.com",
    date: "Oct 27, 2023 09:15 PM",
    cartValue: 1020.5,
  },
  {
    initials: "SR",
    email: "sarah.r@me.com",
    date: "Oct 27, 2023 02:45 PM",
    cartValue: 65.25,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Page — async Server Component, fetches real data on every request
// ─────────────────────────────────────────────────────────────────────────────

export default function SalesPage() {
  const [bestSellingProducts, setBestSellingProducts] = useState([]);
  const [stats, setStats] = useState([]);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getBestSellingItems();
        setBestSellingProducts(data);
      } catch (err) {
        setFetchError(err.message);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchRevenue = async () => {
      const order = await getOrderStats();
      setStats([
        {
          label: "Total Sales",
          value: formatCurrency(order.data.totalRevenue),
          change: "12%",
          trend: "up",
          icon: CreditCard,
          accentColor: "bg-primary/10 text-black",
        },
        {
          label: "Total Orders",
          value: order.data.totalOrders,
          change: "15%",
          trend: "up",
          icon: ShoppingBag,
          accentColor: "bg-emerald-500/10 text-emerald-600",
        },
        {
          label: "Average Order Value",
          value: formatCurrency(order.data.totalRevenue/order.data.totalOrders),
          change: "10%",
          trend: "up",
          icon: BarChart2,
          accentColor: "bg-amber-500/10 text-amber-600",
        },
        {
          label: "Abandoned Cart Rate",
          value: "12.4%",
          change: "0.8%",
          trend: "down",
          icon: ShoppingCart,
          accentColor: "bg-indigo-500/10 text-indigo-600",
        },
      ]);
    };

    fetchRevenue();
  }, []);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <main className="flex-1 px-4 lg:px-10 max-w-350 mx-auto w-full">

      <StatsRow stats={stats} />

      <FiltersBar />

      <SalesTrendsChart
        weeklyData={MOCK_WEEKLY_DATA}
        monthlyData={MOCK_MONTHLY_DATA}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Real data from Express backend */}
        <BestSellingProducts
          products={bestSellingProducts.data}
          error={fetchError}
        />
        <MostViewedItems items={MOCK_MOST_VIEWED} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <TrafficSources sources={MOCK_TRAFFIC_SOURCES} />
        <AbandonedCarts carts={MOCK_ABANDONED_CARTS} />
      </div>
    </main>
  );
}
