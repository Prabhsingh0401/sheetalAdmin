import Link from "next/link";
import PageHeader from "@/components/admin/layout/PageHeader";

export default function PagesCMS() {
  return (
    <div className="min-h-screen w-full animate-in fade-in duration-500 pb-20">
      <PageHeader
        title="Pages Management"
        subtitle="Edit static site content"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Link
          href="/admin/cms/pages/about"
          className="group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
        >
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4 transition-colors group-hover:bg-amber-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
            About Us
          </h3>
          <p className="text-sm text-slate-500 mt-2">
            Edit founder story, mission, and vision
          </p>
        </Link>

        {/* Add more pages here later e.g. Contact, Privacy Policy */}
      </div>
    </div>
  );
}
