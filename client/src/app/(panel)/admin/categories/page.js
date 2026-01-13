"use client";

import { useState, useEffect, useCallback } from "react";
import CategoryTable from "@/components/admin/category/CategoryTable"; 
import PageHeader from "@/components/admin/layout/PageHeader";
import { Layers, Box, CheckCircle2, XCircle } from "lucide-react"; 
import { getCategoryStats } from "@/services/categoryService";

export default function CategoriesPage() {
    const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, products: 0 });

    const fetchStats = useCallback(async () => {
        try {
            const res = await getCategoryStats();
            if (res.success) setStats(res.data);
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return (
        <div className="min-h-screen w-full animate-in fade-in duration-500">
            <PageHeader
                title="Category Management"
                subtitle="Manage categories, add new ones, and edit existing"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard 
                    title="Total Categories" 
                    count={stats.total} 
                    icon={<Layers size={20} />} 
                    color="indigo" 
                />
                <StatCard 
                    title="Active" 
                    count={stats.active} 
                    icon={<CheckCircle2 size={20} />} 
                    color="emerald" 
                />
                <StatCard 
                    title="Inactive" 
                    count={stats.inactive} 
                    icon={<XCircle size={20} />} 
                    color="rose" 
                />
                <StatCard 
                    title="Linked Products" 
                    count={stats.products} 
                    icon={<Box size={20} />} 
                    color="amber" 
                />
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <CategoryTable refreshStats={fetchStats} />
            </div>
        </div>
    );
}

function StatCard({ title, count, icon, color }) {
    const colors = {
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        rose: "bg-rose-50 text-rose-600 border-rose-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100",
    };

    return (
        <div className="bg-white p-5 border border-slate-200 rounded-xl flex items-center gap-4 hover:shadow-md transition-shadow duration-300">
            <div className={`p-3 rounded-lg border ${colors[color]}`}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                    {title}
                </p>
                <p className="text-2xl font-black text-slate-900 mt-1.5 leading-none">
                    {count.toLocaleString()}
                </p>
            </div>
        </div>
    );
}