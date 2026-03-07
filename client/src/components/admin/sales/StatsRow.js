import { TrendingUp, TrendingDown, CreditCard } from "lucide-react";

export default function StatsRow({ stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon; // capitalize so React treats it as a component

        return (
          <div
            key={stat.label}
            className="bg-white flex flex-col gap-3 rounded-xl p-6 border border-slate-200 shadow-sm"
          >
            <div className="flex justify-between items-center">
              <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
              <span className={`p-2 ${stat.accentColor} rounded-lg`}>
                <Icon size={20} /> {/* ✅ render the component */}
              </span>
            </div>

            <p className="text-slate-900 text-3xl font-bold">{stat.value}</p>

            <div
              className={`flex items-center gap-1 text-sm font-bold ${
                stat.trend === "up" ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {stat.trend === "up" ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {stat.change}
            </div>
          </div>
        );
      })}
    </div>
  );
}