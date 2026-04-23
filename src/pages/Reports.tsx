"use client";

import React, { useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar, 
  Filter, 
  Dog, 
  Cat, 
  CreditCard, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown
} from 'lucide-react';
import { useStore, PaymentMethod } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';

const Reports = () => {
  const { transactions } = useStore();
  
  // States สำหรับ Filter
  const [dateRange, setDateRange] = useState<'today' | '7days' | 'month' | 'all'>('all');
  const [speciesFilter, setSpeciesFilter] = useState<'All' | 'Dog' | 'Cat'>('All');
  const [paymentFilter, setPaymentFilter] = useState<'All' | PaymentMethod>('All');

  // Logic สำหรับ Filter ข้อมูล
  const filteredData = useMemo(() => {
    let data = [...transactions];
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    // Filter วันที่
    if (dateRange === 'today') data = data.filter(t => t.date === today);
    if (dateRange === '7days') data = data.filter(t => new Date(t.date) >= sevenDaysAgo);
    if (dateRange === 'month') data = data.filter(t => new Date(t.date) >= monthAgo);

    // Filter สายพันธุ์
    if (speciesFilter !== 'All') {
      data = data.filter(t => t.species.includes(speciesFilter as any));
    }

    // Filter วิธีชำระเงิน
    if (paymentFilter !== 'All') {
      data = data.filter(t => t.paymentMethod === paymentFilter);
    }

    return data;
  }, [transactions, dateRange, speciesFilter, paymentFilter]);

  // คำนวณ Stats
  const stats = useMemo(() => {
    const totalRevenue = filteredData.reduce((acc, t) => acc + t.amount, 0);
    const totalOrders = filteredData.length;
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // เตรียมข้อมูลสำหรับกราฟรายวัน
    const dailyMap: Record<string, number> = {};
    filteredData.forEach(t => {
      dailyMap[t.date] = (dailyMap[t.date] || 0) + t.amount;
    });
    
    const chartData = Object.entries(dailyMap)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { totalRevenue, totalOrders, avgOrder, chartData };
  }, [filteredData]);

  return (
    <div className="flex h-screen bg-[#F5F6FA] text-[#1A1F3D] overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header & Filters */}
        <header className="px-10 py-8 shrink-0 bg-white border-b border-gray-100">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-3xl font-black mb-1">Financial Insights</h1>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Performance tracking & Analytics</p>
            </div>
            <div className="flex gap-3">
              <div className="bg-[#F5F6FA] p-1 rounded-2xl flex gap-1">
                {(['today', '7days', 'month', 'all'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setDateRange(r)}
                    className={cn(
                      "px-4 py-2 text-[10px] font-black uppercase rounded-xl transition-all",
                      dateRange === r ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            {/* Species Filter */}
            <div className="flex items-center gap-2 bg-[#F5F6FA] px-4 py-2.5 rounded-2xl border border-transparent hover:border-gray-200 transition-all">
              <Dog size={16} className="text-gray-400" />
              <select 
                value={speciesFilter}
                onChange={(e) => setSpeciesFilter(e.target.value as any)}
                className="bg-transparent border-none text-xs font-bold focus:ring-0 outline-none cursor-pointer pr-8"
              >
                <option value="All">All Species</option>
                <option value="Dog">Dogs Only</option>
                <option value="Cat">Cats Only</option>
              </select>
            </div>

            {/* Payment Filter */}
            <div className="flex items-center gap-2 bg-[#F5F6FA] px-4 py-2.5 rounded-2xl border border-transparent hover:border-gray-200 transition-all">
              <CreditCard size={16} className="text-gray-400" />
              <select 
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as any)}
                className="bg-transparent border-none text-xs font-bold focus:ring-0 outline-none cursor-pointer pr-8"
              >
                <option value="All">All Payments</option>
                <option value="Cash">Cash</option>
                <option value="Transfer">Transfer</option>
                <option value="Credit Card">Credit Card</option>
              </select>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
          <div className="max-w-6xl mx-auto space-y-10">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-50 rounded-full opacity-50 group-hover:scale-110 transition-transform" />
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6 relative z-10">
                  <DollarSign size={24} />
                </div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Total Revenue</p>
                <h2 className="text-3xl font-black">${stats.totalRevenue.toFixed(2)}</h2>
                <div className="mt-4 flex items-center gap-1.5 text-green-500 text-[10px] font-bold">
                  <ArrowUpRight size={14} /> +4.5% vs prev. period
                </div>
              </div>

              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full opacity-50 group-hover:scale-110 transition-transform" />
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 relative z-10">
                  <BarChart3 size={24} />
                </div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Total Orders</p>
                <h2 className="text-3xl font-black">{stats.totalOrders}</h2>
                <p className="mt-4 text-[10px] font-bold text-gray-400">Bills processed successfully</p>
              </div>

              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-50 rounded-full opacity-50 group-hover:scale-110 transition-transform" />
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 relative z-10">
                  <TrendingUp size={24} />
                </div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Avg. Order Value</p>
                <h2 className="text-3xl font-black">${stats.avgOrder.toFixed(2)}</h2>
                <div className="mt-4 flex items-center gap-1.5 text-purple-500 text-[10px] font-bold">
                  <Users size={14} /> Optimized per customer
                </div>
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-xl font-black">Revenue Timeline</h3>
                  <p className="text-xs text-gray-400 font-medium">Earnings across the selected timeframe</p>
                </div>
              </div>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1A1F3D" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#1A1F3D" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F1" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#1A1F3D" 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Transaction List */}
            <div className="bg-white rounded-[48px] border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-10 border-b border-gray-50">
                <h3 className="text-xl font-black">Recent Transactions</h3>
                <p className="text-xs text-gray-400 font-medium">Detailed log of all financial activities</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-10 py-5 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">Transaction ID</th>
                      <th className="px-10 py-5 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">Customer</th>
                      <th className="px-10 py-5 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">Details</th>
                      <th className="px-10 py-5 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">Method</th>
                      <th className="px-10 py-5 text-right text-[10px] font-black uppercase text-gray-400 tracking-widest">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-10 py-20 text-center text-gray-400 font-bold italic">
                          No transactions found for the current filters.
                        </td>
                      </tr>
                    ) : (
                      [...filteredData].reverse().map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-10 py-6">
                            <span className="text-xs font-black text-[#1A1F3D]">{tx.id}</span>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{tx.date}</p>
                          </td>
                          <td className="px-10 py-6">
                            <span className="text-sm font-bold text-[#1A1F3D]">{tx.customerName}</span>
                          </td>
                          <td className="px-10 py-6">
                            <div className="flex gap-1.5">
                              {tx.species.map(s => (
                                <span key={s} className={cn(
                                  "text-[8px] font-black px-2 py-0.5 rounded-full uppercase",
                                  s === 'Dog' ? "bg-blue-50 text-blue-600" : "bg-pink-50 text-pink-600"
                                )}>
                                  {s}
                                </span>
                              ))}
                              <span className="text-[8px] font-bold text-gray-400 uppercase leading-relaxed">
                                • {tx.itemsCount} items
                              </span>
                            </div>
                          </td>
                          <td className="px-10 py-6">
                            <div className="flex items-center gap-2">
                              {tx.paymentMethod === 'Cash' ? <Wallet size={14} className="text-orange-400" /> : <CreditCard size={14} className="text-blue-400" />}
                              <span className="text-xs font-bold text-gray-600">{tx.paymentMethod}</span>
                            </div>
                          </td>
                          <td className="px-10 py-6 text-right">
                            <span className="text-lg font-black text-[#1A1F3D]">${tx.amount.toFixed(2)}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reports;