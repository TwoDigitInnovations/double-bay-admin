import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const ModernStatsCard = ({ title, value, icon, gradient, change }) => {
  return (
    <div className="group relative bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50 overflow-hidden transform transition-all duration-500 hover:scale-105 hover:shadow-2xl">
      {/* Background gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/20 to-transparent rounded-full -translate-y-10 translate-x-10"></div>

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-slate-600 text-sm font-semibold tracking-wide uppercase">{title}</p>
            <p className="text-3xl font-black text-slate-800 mt-2 leading-none flex-wrap">{value}</p>
          </div>
          <div className={`p-3 rounded-2xl bg-[#127300] text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
        </div>

        {change && (
          <div className="mt-4 flex items-center">
            <div className={`flex items-center px-3 py-1 rounded-full text-sm font-bold ${
              change.type === "increase"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}>
              {change.type === "increase" ? (
                <ArrowUpRight size={16} className="mr-1" />
              ) : (
                <ArrowDownRight size={16} className="mr-1" />
              )}
              {change.value}
            </div>
            <span className="text-slate-500 text-sm ml-2 font-medium">vs last month</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernStatsCard;
