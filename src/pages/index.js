import React, { useEffect, useState } from 'react'
import { useRouter } from "next/router";
import { useSelector, useDispatch } from 'react-redux';
import { Users, DollarSign, BarChart2, HelpCircle, TrendingUp, Package, ShoppingCart, AlertTriangle, Layers } from 'lucide-react';
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
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Generate years dynamically
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  useEffect(() => {
    dispatch(fetchDashboardOverview(router));
    dispatch(fetchSalesChart(router, 'monthly', 30));
    dispatch(fetchTopProducts(router, 8));
    dispatch(fetchLowStock(router, 10, 5));
  }, [dispatch, router]);

  useEffect(() => {
    dispatch(fetchSalesChart(router, 'monthly', 30));
  }, [selectedYear, dispatch, router]);

  const COLORS = ['#1a1a1a', '#1a1a1a', '#00A657', '#FFFFFF'];

  return (
    <section className="min-h-screen bg-gray-50 p-4 md:p-6 h-full overflow-y-scroll scrollbar-hide overflow-scroll md:pb-24 pb-24 ">
      <div className="max-w-7xl mx-auto space-y-6">

        <div className="relative overflow-hidden bg-white rounded-2xl md:p-8 p-4 shadow-lg border border-gray-200">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#1a1a1a]/5 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#1a1a1a]/5 rounded-full translate-y-24 -translate-x-24"></div>

          <div className="relative z-10 flex justify-between items-center">
            <div>
              <div className="flex items-center mb-2">
                <div className="w-1.5 h-10 bg-[#1a1a1a] rounded-full mr-4"></div>
                <h1 className="text-2xl md:text-2xl font-bold tracking-tight text-gray-900">
                  DoubleBay <span className="text-[#1a1a1a]">Dashboard</span>
                </h1>
              </div>
              <p className="text-gray-600 text-sm font-normal">
                Transform your business with intelligent insights
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="bg-gray-100 rounded-2xl px-6 py-3 border border-gray-200">
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
            value={`$${overview?.revenue?.thisMonth?.toLocaleString() || "0"}`}
            icon={<DollarSign size={28} />}
            change={overview?.revenue?.growth ? { type: "increase", value: overview.revenue.growth + "%" } : null}
          />
          <ModernStatsCard
            title="Low Stock Items"
            value={overview?.products?.lowStock || "0"}
            icon={<AlertTriangle size={28} />}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
 
          <div className="xl:col-span-2 bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Revenue Analytics</h2>
                  <p className="text-gray-500 mt-0.5 text-sm font-normal">Track your business performance</p>
                </div>
                <div className="flex items-center space-x-4">
                  <select
                    className="bg-white text-gray-900 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <div className="flex  bg-[#1a1a1a] rounded-lg">
                    <button className=" text-white px-4 py-2 text-sm font-medium">
                      Monthly
                    </button>
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

          <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden md:h-full h-[28rem]">
            <div className="p-6">
              <h2 className="text-lg text-gray-900 font-semibold">Product Mix</h2>
              <p className="text-gray-500 mt-0.5 text-sm font-normal">Top performers</p>
            </div>
            <div className="p-6 md:h-64 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={(Array.isArray(topProducts) ? topProducts : []).slice(0, 4)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="totalSold"
                  >
                    {(Array.isArray(topProducts) ? topProducts : []).slice(0, 4).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value, name) => [value, "Sold"]}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      color: '#374151'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {(Array.isArray(topProducts) ? topProducts : []).slice(0, 4).map((product, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-700">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: COLORS[index] }}
                    ></div>
                    <span className="truncate">{product?.product?.name || 'Product'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-20">

          {/* Top Products Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-[#2a2a2a] p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold flex items-center">
                    <TrendingUp className="mr-2" size={20} />
                    Bestsellers
                  </h2>
                  <p className="text-gray-300 text-sm mt-0.5">Your top performing products</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg">
                  <span className="text-sm font-medium text-[#1a1a1a]">Live Data</span>
                </div>
              </div>
            </div>

            <div className="overflow-y-scroll scrollbar-hide overflow-scroll md:h-[36rem] h-[36rem] ">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">Product</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">Sold</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(Array.isArray(topProducts) ? topProducts : []).map((product, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <div className="font-medium truncate max-w-xs text-gray-900">
                          {product?.product?.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#1a1a1a]/10 text-[#1a1a1a]">
                          {product?.totalSold}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${product?.product?.stock < 10 ? 'bg-red-100 text-red-700' : 'bg-[#1a1a1a]/10 text-[#1a1a1a]'
                          }`}>
                          {product?.product?.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900 font-semibold">
                        ${product?.product?.finalPrice || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-[#2a2a2a] p-5 text-white">
              <h2 className="text-lg font-bold flex items-center">
                <AlertTriangle className="mr-2" size={20} />
                Stock Alert
              </h2>
              <p className="text-gray-300 text-sm mt-0.5">Items running low</p>
            </div>

            <div className="p-6 space-y-4 max-h-full overflow-y-auto">
              {(Array.isArray(lowStock) ? lowStock : []).map((product, index) => (
                <div key={index} className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex-shrink-0">
                    <img
                      src={product?.images?.[0] || '/api/placeholder/48/48'}
                      alt={product?.name}
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200 shadow-sm"
                      onError={(e) => {
                        e.target.src = '/api/placeholder/48/48';
                      }}
                    />
                  </div>
                  <div className="ml-4 flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {product?.name}
                    </p>
                    <div className="flex items-center mt-1">
                      <Package size={14} className="text-gray-500 mr-1" />
                      <p className="text-xs text-gray-500 font-medium">
                        Only {product?.stock} left
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-red-500 text-white">
                      LOW
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

export default isAuth(Home);