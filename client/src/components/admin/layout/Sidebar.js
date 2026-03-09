"use client";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Settings,
  X,
  LogOut,
  ShoppingCart,
  ListTree,
  Star,
  TicketPercent,
  Monitor,
  Newspaper,
  ChartNoAxesCombined,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useLogoutModal from "@/hooks/useLogoutModal";

export default function Sidebar({ storeName = "Admin", isOpen, setIsOpen }) {
  const pathname = usePathname();
  const { openModal, LogoutModal } = useLogoutModal();

  const menuItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/admin" },
    { icon: ListTree, label: "Categories", href: "/admin/categories" },
    { icon: ShoppingBag, label: "Products", href: "/admin/products" },
    { icon: Users, label: "Customers", href: "/admin/customers" },
    { icon: TicketPercent, label: "Coupons", href: "/admin/coupons" },
    { icon: ShoppingCart, label: "Orders", href: "/admin/orders" },
    { icon: ChartNoAxesCombined, label: "Sales & Reports", href: "/admin/sales-report" },
    { icon: Newspaper, label: "Blogs", href: "/admin/blogs" },
    { icon: Monitor, label: "Navbar & Footer", href: "/admin/navbar-footer" },
    { icon: Monitor, label: "Site Content", href: "/admin/cms" },
    { icon: ListTree, label: "Size Chart", href: "/admin/size-chart" },
    { icon: Star, label: "Reviews", href: "/admin/reviews" },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 text-slate-600 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">

          {/* Logo */}
          <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="font-bold text-base text-white leading-none">S</span>
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900">
                {storeName}
                <span className="text-indigo-500">Panel</span>
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
            {menuItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                      : "text-slate-500 font-medium hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <Icon
                    size={17}
                    className={
                      isActive
                        ? "text-white"
                        : "text-slate-400 group-hover:text-slate-600 transition-colors"
                    }
                  />
                  <span className="flex-1">{item.label}</span>
                </Link>
              );
            })}
          </nav>

        </div>
      </aside>

      <LogoutModal />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </>
  );
}