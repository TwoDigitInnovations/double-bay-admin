import React, { useEffect, useState } from 'react'
import { useRouter } from "next/router";
import { useSelector, useDispatch } from 'react-redux';
import { Users, DollarSign, BarChart2, HelpCircle, TrendingUp, Package, ShoppingCart, Layers, MessageCircleQuestion } from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip
} from "recharts";

import isAuth from '@/components/isAuth';
import ModernStatsCard from '@/components/modernstatcard';
import {
  fetchDashboardOverview,
  fetchSalesChart,
  fetchTopProducts,
  fetchLowStock,
} from '@/redux/actions/dashboardActions';

function Home(props) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { overview, salesChart, topProducts, lowStock, loading } = useSelector(
    (state) => state.dashboard
  );
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [period, setPeriod] = useState('monthly');

  // Years up to the current one — there is no revenue in the future.
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  useEffect(() => {
    dispatch(fetchDashboardOverview(router));
    dispatch(fetchTopProducts(router, 8));
    dispatch(fetchLowStock(router, 10, 5));
  }, [dispatch, router]);

  useEffect(() => {
    dispatch(fetchSalesChart(router, period, selectedYear));
  }, [period, selectedYear, dispatch, router]);

  const COLORS = ['#1a1a1a', '#1a1a1a', '#00A657', '#FFFFFF'];

  return (
    <section className="min-h-screen bg-gray-50 p-4 md:p-6 h-full overflow-y-scroll scrollbar-hide overflow-scroll md:pb-24 pb-24 ">
      <div className="max-w-7xl mx-auto space-y-6">

        <div className="relative overflow-hidden bg-white rounded-xl md:p-8 p-4 shadow-lg border border-gray-200">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#1a1a1a]/5 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#1a1a1a]/5 rounded-full translate-y-24 -translate-x-24"></div>

          <div className="relative z-10 flex justify-between items-center">
            <div>
              <div className="flex items-center mb-2">
                <div className="w-1.5 h-10 bg-[#1a1a1a] rounded-full mr-4"></div>
                <h1 className="text-2xl md:text-2xl font-bold tracking-tight text-gray-900">
                  Double Bay <span className="text-[#1a1a1a]">Dashboard</span>
                </h1>
              </div>
              <p className="text-gray-600 text-sm font-normal">
                Transform your business with intelligent insights
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="bg-gray-100 rounded-xl px-6 py-3 border border-gray-200">
                <div className="text-[#1a1a1a] font-bold text-sm">LIVE STATUS</div>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 bg-[#1a1a1a] rounded-full mr-2"></div>
                  <span className="text-gray-700 text-sm">All Systems Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ModernStatsCard
            title="Active Users"
            value={overview?.users?.total || "0"}
            icon={<Users size={28} />}
            change={overview?.users?.thisMonth ? { type: "increase", value: `+${overview.users.thisMonth}` } : null}
          />
          <ModernStatsCard
            title="Total Orders"
            value={overview?.orders?.total || "0"}
            icon={<ShoppingCart size={28} />}
            change={overview?.orders?.growth ? { type: overview.orders.growth > 0 ? "increase" : "decrease", value: Math.abs(overview.orders.growth) + "%" } : null}
          />
          <ModernStatsCard
            title="Revenue"
            value={`$${(overview?.revenue?.total || 0).toLocaleString()}`}
            icon={<DollarSign size={28} />}
            change={overview?.revenue?.growth ? { type: overview.revenue.growth > 0 ? "increase" : "decrease", value: Math.abs(overview.revenue.growth) + "%" } : null}
          />
          <ModernStatsCard
            title="Remaining Query"
            value={overview?.questions?.pending ?? "0"}
            icon={<MessageCircleQuestion size={28} />}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Revenue Analytics</h2>
                <p className="text-gray-500 mt-0.5 text-sm font-normal">Track your business performance</p>
              </div>
              <div className="flex items-center space-x-4">
                {period === 'monthly' && (
                  <select
                    className="bg-white text-gray-900 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                )}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {[
                    { id: 'monthly', label: 'Monthly' },
                    { id: 'yearly', label: 'Yearly' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setPeriod(option.id)}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${period === option.id
                        ? 'bg-[#1a1a1a] text-white'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={Array.isArray(salesChart) ? salesChart : []}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a1a1a" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#1a1a1a" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" tickFormatter={(value) => `$${value}`} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    color: '#374151'
                  }}
                  formatter={(value) => [`$${value}`, "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1a1a1a"
                  strokeWidth={3}
                  fill="url(#salesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </section>
  );
}

export default isAuth(Home);