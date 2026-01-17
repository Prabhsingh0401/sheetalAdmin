"use client";
import { LayoutDashboard, ShoppingBag, Users, Settings, X, LogOut, ShoppingCart, ListTree, Star, TicketPercent, Monitor, Newspaper  } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useLogoutModal from "@/hooks/useLogoutModal";

export default function Sidebar({ storeName = "Admin", isOpen, setIsOpen }) {
    const pathname = usePathname();
    const { openModal, LogoutModal } = useLogoutModal();


    // Ecommerce Standard Menu Items
    const menuItems = [
        { icon: LayoutDashboard, label: "Overview", href: "/admin" },
        { icon: ListTree, label: "Categories", href: "/admin/categories" },
        { icon: ShoppingBag, label: "Products", href: "/admin/products" },
        { icon: Users, label: "Customers", href: "/admin/customers" },
        { icon: TicketPercent, label: "Coupons", href: "/admin/coupons" },
        { icon: ShoppingCart, label: "Orders", href: "/admin/orders" },
        { icon: Newspaper, label: "Blogs", href: "/admin/blogs" },
        { icon: Monitor , label: "Site Content", href: "/admin/cms" },
        // { icon: Star, label: "Reviews", href: "/admin/reviews" },
        // { icon: Settings, label: "Settings", href: "/admin/settings" },
    ];

    return (
        <>
            {isOpen && (<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity" onClick={() => setIsOpen(false)} />)}

            {/* Sidebar Container */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#111827] border-r border-white/5 text-slate-300 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="h-full flex flex-col">

                    {/* Logo Area */}
                    <div className="p-6 h-16 flex items-center justify-between border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-[#111827] shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                                <span className="font-bold text-lg leading-none text-emerald-950">S</span>
                            </div>
                            <span className="text-lg font-bold tracking-tighter text-white uppercase">
                                {storeName}<span className="text-emerald-500">Panel</span>
                            </span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="lg:hidden p-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Menu Links */}
                    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                        ? "bg-emerald-500/10 text-emerald-400 font-semibold shadow-sm"
                                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                                        }`}
                                >
                                    <Icon size={18} className={isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-emerald-400 transition-colors"} />
                                    <span className="text-sm flex-1">{item.label}</span>
                                    {isActive && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]" />}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Bottom Logout Card */}
                    <div className="p-4 border-t border-white/5 bg-black/10">
                        <button onClick={openModal} className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all font-semibold text-sm group">
                            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>
            <LogoutModal />

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            `}</style>
        </>
    );
}