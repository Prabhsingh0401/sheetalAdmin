"use client";
import { useState, useEffect, useRef } from "react";
import { Search, Bell, Menu, User, Settings, LogOut, CheckCircle2, X } from "lucide-react";
import useLogoutModal from "@/hooks/useLogoutModal";

export default function TopNav({ storeName = "Admin", setIsOpen }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearchDrop, setShowSearchDrop] = useState(false);
    const [showUserDrop, setShowUserDrop] = useState(false);
    const [showNotifyDrop, setShowNotifyDrop] = useState(false);

    const navRef = useRef(null);
    const { openModal, LogoutModal } = useLogoutModal();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (navRef.current && !navRef.current.contains(event.target)) {
                setShowSearchDrop(false);
                setShowUserDrop(false);
                setShowNotifyDrop(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const suggestions = [
        { title: "iPhone 15 Pro", category: "Products" },
        { title: "New Orders", category: "Sales" },
        { title: "Customer Support", category: "Tickets" },
    ].filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <>
            <header ref={navRef} className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">

                <div className="flex items-center gap-6 flex-1">
                    <button onClick={() => setIsOpen(true)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                        <Menu size={22} />
                    </button>

                    <div className="relative hidden md:block w-full max-w-md">
                        <div className="flex items-center bg-slate-100 px-4 py-2 rounded-xl border border-transparent focus-within:border-emerald-500 focus-within:bg-white transition-all group">
                            <Search size={18} className="text-slate-400 group-focus-within:text-emerald-600" />
                            <input
                                type="text"
                                placeholder="Search analytics, orders..."
                                className="bg-transparent border-none outline-none ml-3 text-sm w-full text-slate-900 placeholder:text-slate-400"
                                value={searchQuery}
                                onFocus={() => {
                                    if (searchQuery.length > 0) setShowSearchDrop(true);
                                    setShowUserDrop(false);
                                    setShowNotifyDrop(false);
                                }}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowSearchDrop(e.target.value.length > 0);
                                }}
                            />
                        </div>

                        {showSearchDrop && (
                            <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                                <div className="p-2">
                                    {suggestions.length > 0 ? suggestions.map((s, i) => (
                                        <button key={i} className="w-full flex items-center justify-between px-4 py-3 hover:bg-emerald-50 rounded-lg text-sm text-left transition-colors">
                                            <span className="text-slate-700 font-medium">{s.title}</span>
                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider">{s.category}</span>
                                        </button>
                                    )) : <p className="p-4 text-xs text-slate-400 text-center">No results found</p>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">

                    {/* 
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowNotifyDrop(!showNotifyDrop);
                                setShowUserDrop(false);
                                setShowSearchDrop(false);
                            }}
                            className={`p-2.5 rounded-xl transition-all ${showNotifyDrop ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            <Bell size={20} />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white shadow-[0_0_5px_#10b981]"></span>
                        </button>

                        {showNotifyDrop && (
                            <div className="absolute top-full right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <h4 className="font-bold text-sm text-slate-800 tracking-tight">Recent Notifications</h4>
                                    <button onClick={() => setShowNotifyDrop(false)}><X size={14} className="text-slate-400" /></button>
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {[1, 2, 3].map((_, i) => (
                                        <div key={i} className="p-4 hover:bg-slate-50 border-b border-slate-50 last:border-0 flex gap-4 cursor-pointer transition-colors">
                                            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                                <CheckCircle2 size={18} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-slate-800 tracking-tight leading-none">New Order #44321</p>
                                                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">Rahul Verma just purchased iPhone 15 Pro.</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                */}

                    <div className="relative border-l border-slate-200 pl-4 ml-2">
                        <button
                            onClick={() => {
                                setShowUserDrop(!showUserDrop);
                                setShowNotifyDrop(false);
                                setShowSearchDrop(false);
                            }}
                            className="flex items-center gap-3 group"
                        >
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors leading-none mb-1">{storeName}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{storeName} Panel</p>
                            </div>
                            <div className="h-9 w-9 bg-[#111827] rounded-xl flex items-center justify-center text-emerald-400 font-bold text-sm shadow-lg shadow-slate-200 group-hover:scale-105 transition-transform">
                                SS
                            </div>
                        </button>

                        {showUserDrop && (
                            <div className="absolute top-full right-0 mt-3 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                {/* <button className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl text-sm font-medium transition-all group">
                                    <Settings size={16} className="text-slate-400 group-hover:text-emerald-500" /> Dashboard Settings
                                </button> */}
                                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl text-sm font-medium transition-all group">
                                    <User size={16} className="text-slate-400 group-hover:text-emerald-500" /> Change Password
                                </button>
                                <div className="h-px bg-slate-100 my-1.5 mx-2"></div>
                                <button onClick={openModal} className="w-full flex items-center gap-3 px-4 py-2.5 text-red-500 hover:bg-red-50 rounded-xl text-sm font-bold transition-all">
                                    <LogOut size={16} /> Logout System
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <LogoutModal />
        </>
    );
}
