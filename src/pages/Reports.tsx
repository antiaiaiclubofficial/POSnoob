"use client";

import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Dog, 
  CreditCard, 
  Wallet,
} from 'lucide-react';
import { useStore, PaymentMethod } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';

const Reports = () => {
  const { transactions, currency } = useStore();
  
  const [dateRange, setDateRange] = useState<'today' | '7days' | 'month' | 'all'>('all');
  const [speciesFilter, setSpeciesFilter] = useState<'All' | 'Dog' | 'Cat'>('All');
  const [paymentFilter, setPaymentFilter] = useState<'All' | PaymentMethod>('All');

  const filteredData = useMemo(() => {
    let data = [...transactions];
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    if (dateRange === 'today') data = data.filter(t => t.date === today);
    if (dateRange === '7days') data = data.filter(t => new Date(t.date) >= sevenDaysAgo);
    if (dateRange === 'month') data = data.filter(t => new Date(t.date) >= monthAgo);

    if (speciesFilter !== 'All') {
      data = data.filter(t => t.species.includes(speciesFilter as any));
    }

    if (paymentFilter !== 'All') {
      data = data.filter(t => t.paymentMethod === paymentFilter);
    }

    return data;
  }, [transactions, dateRange, speciesFilter, paymentFilter]);

  const stats = useMemo(() => {
    const totalRevenue = filteredData.reduce((acc, t) => acc + t.amount, 0);
    const totalOrders = filteredData.length;
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
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
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="px-6 lg:px-10 py-6 lg:py-8 shrink-0 bg-white border-b border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 lg:mb-8 gap-4 pl-14 lg:pl-0">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black mb-1">Insights</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Performance tracking</p>
          </div>
          <div className="w-full sm:w-auto">
            <div className="bg-[#F5F6FA] p-1 rounded-2xl flex gap-1 overflow-x-auto scrollbar-hide">
              {(['today', '7days', 'month', 'all'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setDateRange(r)}
                  className={cn(
                    "px-3 lg:px-4 py-2 text-[9px] lg:text-[10px] font-black uppercase rounded-xl transition-all whitespace-nowrap",
                    dateRange === r ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 lg:gap-4">
          <div className="flex items-center gap-2 bg-[#F5F6FA] px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl lg:rounded-2xl border border-transparent hover:border-gray-200 transition-all">
            <Dog size={14} className="text-gray-400" />
            <select 
              value={speciesFilter}
              onChange={(e) => setSpeciesFilter(e.target.value as any)}
              className="bg-transparent border-none text-[10px] lg:text-xs font-bold focus:ring-0 outline-none cursor-pointer pr-6"
            >
              <option value="All">All Species</option>
              <option value="Dog">Dogs</option>
              <option value="Cat">Cats</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-[#F5F6FA] px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl lg:rounded-2xl border border-transparent hover:border-gray-200 transition-all">
            <CreditCard size={14} className="text-gray-400" />
            <select 
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="bg-transparent border-none text-[10px] lg:text-xs font-bold focus:ring-0 outline-none cursor-pointer pr-6"
            >
              <option value="All">All Payments</option>
              <option value="Cash">Cash</option>
              <option value="Transfer">Transfer</option>
              <option value="Credit Card">Card</option>
            </select>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 lg:p-10 scrollbar-hide">
        <div className="max-w-6xl mx-auto space-y-6 lg:space-y-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8">
            <div className="bg-white p-6 lg:p-8 rounded-[32px] lg:rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-4 lg:mb-6 relative z-10">
                <DollarSign className="w-5 h-5 lg:w-6 lg:h-6" />
              </div>
              <p className="text-[9px] lg:text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Revenue</p>
              <h2 className="text-2xl lg:text-3xl font-black">{currency}{stats.totalRevenue.toFixed(2)}</h2>
            </div>

            <div className="bg-white p-6 lg:p-8 rounded-[32px] lg:rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4 lg:mb-6 relative z-10">
                <BarChart3 className="w-5 h-5 lg:w-6 lg:h-6" />
              </div>
              <p className="text-[9px] lg:text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Orders</p>
              <h2 className="text-2xl lg:text-3xl font-black">{stats.totalOrders}</h2>
            </div>

            <div className="bg-white p-6 lg:p-8 rounded-[32px] lg:rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group sm:col-span-2 lg:col-span-1">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-4 lg:mb-6 relative z-10">
                <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6" />
              </div>
              <p className="text-[9px] lg:text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Avg. Order</p>
              <h2 className="text-2xl lg:text-3xl font-black">{currency}{stats.avgOrder.toFixed(2)}</h2>
            </div>
          </div>

          <div className="bg-white p-6 lg:p-10 rounded-[32px] lg:rounded-[48px] border border-gray-100 shadow-sm">
            <div className="mb-6 lg:mb-10">
              <h3 className="text-lg lg:text-xl font-black">Revenue Timeline</h3>
              <p className="text-[10px] lg:text-xs text-gray-400 font-medium">Earnings across timeframe</p>
            </div>
            <div className="h-[250px] lg:h-[350px] w-full">
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
                    tick={{ fill: '#9CA3AF', fontSize: 8, fontWeight: 700 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9CA3AF', fontSize: 8, fontWeight: 700 }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 20px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold', fontSize: '10px' }}
                    formatter={(value) => [`${currency}${value}`, 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#1A1F3D" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-[32px] lg:rounded-[48px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 lg:p-10 border-b border-gray-50">
              <h3 className="text-lg lg:text-xl font-black">Recent Transactions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 lg:px-10 py-4 text-left text-[8px] lg:text-[10px] font-black uppercase text-gray-400 tracking-widest">ID</th>
                    <th className="px-6 lg:px-10 py-4 text-left text-[8px] lg:text-[10px] font-black uppercase text-gray-400 tracking-widest">Customer</th>
                    <th className="px-6 lg:px-10 py-4 text-left text-[8px] lg:text-[10px] font-black uppercase text-gray-400 tracking-widest">Method</th>
                    <th className="px-6 lg:px-10 py-4 text-right text-[8px] lg:text-[10px] font-black uppercase text-gray-400 tracking-widest">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-10 py-10 text-center text-gray-400 font-bold italic text-xs">
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    [...filteredData].reverse().map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 lg:px-10 py-4 lg:py-6">
                          <span className="text-[10px] lg:text-xs font-black text-[#1A1F3D]">{tx.id}</span>
                          <p className="text-[8px] text-gray-400 font-bold uppercase mt-0.5">{tx.date}</p>
                        </td>
                        <td className="px-6 lg:px-10 py-4 lg:py-6">
                          <span className="text-xs lg:text-sm font-bold text-[#1A1F3D]">{tx.customerName}</span>
                        </td>
                        <td className="px-6 lg:px-10 py-4 lg:py-6">
                          <div className="flex items-center gap-2">
                            {tx.paymentMethod === 'Cash' ? <Wallet size={12} className="text-orange-400" /> : <CreditCard size={12} className="text-blue-400" />}
                            <span className="text-[10px] lg:text-xs font-bold text-gray-600">{tx.paymentMethod}</span>
                          </div>
                        </td>
                        <td className="px-6 lg:px-10 py-4 lg:py-6 text-right">
                          <span className="text-base lg:text-lg font-black text-[#1A1F3D]">{currency}{tx.amount.toFixed(2)}</span>
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
    </div>
  );
};

export default Reports;