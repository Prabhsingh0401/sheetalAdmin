"use client";
import { useCallback, useEffect, useState } from "react";
import {
  Store,
  Bell,
  ShieldCheck,
  CreditCard,
  Save,
  Globe,
  User,
  Camera,
  Plus,
  Loader2,
  RefreshCw,
  BadgeIndianRupee,
  Truck,
  ReceiptText,
  MapPin,
} from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "@/components/admin/layout/PageHeader.js";
import { getBasicInfo } from "@/services/basicInfoService";
import { normalizeAddress } from "../utils/normalizeAddress";

export default function SettingsPage() {
  const inputStyle =
    "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all";
  const labelStyle =
    "text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block";
  const [basicInfo, setBasicInfo] = useState({
    gstNumber: "",
    shippingAddress: {
      addressLine: "",
      pincode: "",
      city: "",
      state: "",
      country: "",
    },
    billingAddress: {
      addressLine: "",
      pincode: "",
      city: "",
      state: "",
      country: "",
    },
  });
  const [isLoadingBasicInfo, setIsLoadingBasicInfo] = useState(true);
  const [isRefreshingBasicInfo, setIsRefreshingBasicInfo] = useState(false);

  const loadBasicInfo = useCallback(async (showToast = false) => {
    setIsRefreshingBasicInfo(true);
    try {
      const response = await getBasicInfo();
      if (response?.success && response?.data) {
        setBasicInfo({
          gstNumber: response.data.gstNumber || "",
          shippingAddress: normalizeAddress(response.data.shippingAddress),
          billingAddress: normalizeAddress(response.data.billingAddress),
        });
        if (showToast) toast.success("Basic info loaded");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to load basic info",
      );
    } finally {
      setIsLoadingBasicInfo(false);
      setIsRefreshingBasicInfo(false);
    }
  }, []);

  useEffect(() => {
    loadBasicInfo();
  }, [loadBasicInfo]);

  return (
    <div className="w-full animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Store Settings"
        subtitle="Manage your store configuration and security"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* --- Left Sidebar: Settings Navigation --- */}
        <div className="lg:col-span-4 space-y-4">
          {[
            {
              icon: <Store size={20} />,
              label: "General Information",
              desc: "Store name, email, and address",
            },
            {
              icon: <ShieldCheck size={20} />,
              label: "Security & Access",
              desc: "Password and permissions",
            },
            {
              icon: <Bell size={20} />,
              label: "Notifications",
              desc: "Email and push alerts",
            },
            {
              icon: <CreditCard size={20} />,
              label: "Payments & Tax",
              desc: "Gateway and GST settings",
            },
          ].map((tab, i) => (
            <button
              key={i}
              className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center gap-4 ${i === 0 ? "bg-white border-emerald-500 shadow-sm shadow-emerald-100" : "bg-transparent border-transparent text-slate-400 hover:bg-white hover:border-slate-200"}`}
            >
              <div
                className={`${i === 0 ? "text-emerald-500" : "text-slate-400"}`}
              >
                {tab.icon}
              </div>
              <div>
                <h4
                  className={`text-sm font-black tracking-tight ${i === 0 ? "text-slate-900" : ""}`}
                >
                  {tab.label}
                </h4>
                <p className="text-[10px] font-bold opacity-70">{tab.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* --- Right Content: General Settings Form --- */}
        <div className="lg:col-span-8 space-y-6">
          {/* Store Identity */}
          <div className="bg-white p-6 md:p-8 rounded-[28px] border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <User size={18} className="text-emerald-500" /> Store Identity
            </h3>

            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="relative group">
                <div className="w-24 h-24 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 group-hover:bg-slate-200 transition-all cursor-pointer overflow-hidden">
                  <Camera size={24} />
                </div>
                <button className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-lg shadow-lg border-2 border-white">
                  <Plus size={14} />
                </button>
                <p className="text-[9px] font-black text-slate-400 uppercase mt-3 text-center tracking-widest leading-none">
                  Logo
                </p>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                <div>
                  <label className={labelStyle}>Store Name</label>
                  <input
                    type="text"
                    defaultValue="Sagar Store"
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelStyle}>Support Email</label>
                  <input
                    type="email"
                    defaultValue="support@sagarstore.com"
                    className={inputStyle}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelStyle}>Store Description</label>
                  <textarea
                    rows="3"
                    className={inputStyle}
                    defaultValue="Premium gadgets and lifestyle products."
                  ></textarea>
                </div>
              </div>
            </div>
          </div>

          {/* Regional Settings */}
          <div className="bg-white p-6 md:p-8 rounded-[28px] border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <Globe size={18} className="text-indigo-500" /> Regional &
              Currency
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelStyle}>Default Currency</label>
                <select className={inputStyle}>
                  <option>INR (₹) - Indian Rupee</option>
                  <option>USD ($) - US Dollar</option>
                </select>
              </div>
              <div>
                <label className={labelStyle}>Store Timezone</label>
                <select className={inputStyle}>
                  <option>(GMT+05:30) India Standard Time</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-[28px] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-6">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <BadgeIndianRupee size={18} className="text-emerald-500" />
                GST & Address Snapshot
              </h3>
              <button
                type="button"
                onClick={() => loadBasicInfo(true)}
                disabled={isRefreshingBasicInfo}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-white hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isRefreshingBasicInfo ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Refreshing
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    Refresh
                  </>
                )}
              </button>
            </div>

            {isLoadingBasicInfo ? (
              <div className="flex h-48 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50">
                <div className="text-center">
                  <Loader2
                    size={22}
                    className="mx-auto animate-spin text-slate-400"
                  />
                  <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Loading saved business details
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    <BadgeIndianRupee size={14} className="text-emerald-500" />
                    GST Number
                  </p>
                  <p className="text-base font-black text-slate-900">
                    {basicInfo.gstNumber || "Not configured"}
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <AddressSummaryCard
                    title="Shipping Address"
                    icon={<Truck size={16} />}
                    iconClassName="bg-emerald-50 text-emerald-600"
                    address={basicInfo.shippingAddress}
                  />
                  <AddressSummaryCard
                    title="Billing Address"
                    icon={<ReceiptText size={16} />}
                    iconClassName="bg-amber-50 text-amber-600"
                    address={basicInfo.billingAddress}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end items-center gap-4">
            <button className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all">
              Discard Changes
            </button>
            <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-100 flex items-center gap-2 transition-all active:scale-95">
              <Save size={16} /> Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddressSummaryCard({ title, icon, iconClassName, address }) {
  const lines = [
    address?.addressLine,
    [address?.city, address?.state].filter(Boolean).join(", "),
    [address?.pincode, address?.country].filter(Boolean).join(" "),
  ].filter(Boolean);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-2xl ${iconClassName}`}
        >
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-900">{title}</h4>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Pulled from server
          </p>
        </div>
      </div>

      {lines.length > 0 ? (
        <div className="space-y-1.5 text-sm font-medium text-slate-600">
          {lines.map((line, idx) => (
            <p key={`${line}-${idx}`} className="flex items-start gap-2">
              <MapPin size={14} className="mt-0.5 shrink-0 text-slate-400" />
              <span>{line}</span>
            </p>
          ))}
        </div>
      ) : (
        <p className="text-sm font-medium text-slate-400">
          No address has been saved yet.
        </p>
      )}
    </div>
  );
}
