"use client";

import { useState } from "react";
import PageHeader from "@/components/admin/layout/PageHeader";
import { FileText, Edit3, Globe, ShieldCheck, Info, FileStack, Clock } from "lucide-react";
import PageModal from "@/components/admin/pages/PageModal";

export default function TextPagesManager() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPage, setSelectedPage] = useState(null);

    const pages = [
        { id: "about", title: "About Us", description: "Company history and mission", slug: "about-us", icon: <Info size={24} />, color: "blue" },
        { id: "terms", title: "Terms & Conditions", description: "Usage rules and legal agreements", slug: "terms-and-conditions", icon: <FileStack size={24} />, color: "amber" },
        { id: "privacy", title: "Privacy Policy", description: "Data protection and cookies policy", slug: "privacy-policy", icon: <ShieldCheck size={24} />, color: "emerald" },
    ];

    return (
        <div className="min-h-screen w-full animate-in fade-in duration-500 pb-10">
            {/* Header Section */}
            <PageHeader
                title="Page Editor"
                subtitle="Modify legal and informational content"
                backLink="/admin/cms"
                backLabel="Back to CMS"
            />

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 mt-8">
                <StatCard title="Total Pages" count={3} icon={<FileText size={20} />} color="indigo" />
                <StatCard title="Status" count="Live" icon={<Globe size={20} />} color="emerald" />
                <StatCard title="Visibility" count="Public" icon={<ShieldCheck size={20} />} color="amber" />
                <StatCard title="Last Edit" count="Today" icon={<Clock size={20} />} color="rose" />
            </div>

            {/* Page List Cards */}
            <div className="space-y-4">
                {pages.map((page) => (
                    <div key={page.id} className="bg-white p-5 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between hover:border-slate-900 transition-all group shadow-sm">
                        <div className="flex items-center gap-5">
                            <div className={`p-4 rounded-xl shadow-sm ${page.color === 'blue' ? 'bg-blue-50 text-blue-600' : page.color === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                {page.icon}
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="font-bold text-slate-900 text-lg tracking-tight">{page.title}</h3>
                                    <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 uppercase">Public</span>
                                </div>
                                <p className="text-sm text-slate-500 mt-1 max-w-md">{page.description}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => { setSelectedPage(page); setIsModalOpen(true); }} 
                            className="mt-4 sm:mt-0 flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-md active:scale-95"
                        >
                            <Edit3 size={16} /> Update Page
                        </button>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <PageModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    initialData={selectedPage} 
                />
            )}
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
        <div className="bg-white p-5 border border-slate-200 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`p-3 rounded-xl border ${colors[color]}`}>{icon}</div>
            <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">{title}</p>
                <p className="text-2xl font-black text-slate-900 mt-2 leading-none">{count}</p>
            </div>
        </div>
    );
}