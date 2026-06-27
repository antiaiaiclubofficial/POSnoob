"use client";

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, DollarSign, Dog, Cat, 
  CreditCard, Wallet, Calendar as CalendarIcon, Filter, 
  ArrowDownCircle, Users, Activity, 
  Scissors, UserCheck, History, Edit3, Trash2, X, Lock, CheckCircle2, Package, ArrowUpRight
} from 'lucide-react';
import { useStore, PaymentMethod, BookingType, Transaction } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { translations } from '@/utils/translations';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell
} from 'recharts';
import { toast } from 'sonner';

const Reports = () => {
  const { transactions, currency, verifyPassword, deleteTransaction, language, partners, inventory } = useStore();
  const t = translations[language];
  
  const [dateRange, setDateRange] = useState<'today' | '7days' | 'month' | 'all'>('all');
  const [activeReport, setActiveTab] = useState<'general' | 'consignment'>('general');

  // Processed transactions to filter only products (exclude services),
  // and set price to negative for products deleted from inventory.
  const processedTransactions = useMemo(() => {
    return transactions.map(t => {
      const productItems = (t.items || [])
        .filter((item: any) => item.type === 'Product')
        .map((item: any) => {
          const exists = (inventory || []).some((inv: any) => inv.id === item.id);
          const price = item.finalPrice !== undefined ? item.finalPrice : item.price;
          // If deleted, price/finalPrice should be negative
          const adjustedPrice = exists ? price : -Math.abs(price);
          return {
            ...item,
            price: adjustedPrice,
            finalPrice: adjustedPrice
          };
        });

      // Recalculate amount as sum of adjusted product items
      const newAmount = productItems.reduce((sum, item) => {
        const qty = item.quantity || 1;
        return sum + (item.finalPrice * qty);
      }, 0);

      return {
        ...t,
        items: productItems,
        amount: newAmount
      };
    }).filter(t => t.items.length > 0);
  }, [transactions, inventory]);

  const filteredData = useMemo(() => {
    let data = [...processedTransactions];
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    if (dateRange === 'today') data = data.filter(t => t.date === today);
    if (dateRange === '7days') data = data.filter(t => new Date(t.date) >= sevenDaysAgo);
    if (dateRange === 'month') data = data.filter(t => new Date(t.date) >= monthAgo);

    return data;
  }, [processedTransactions, dateRange]);

  const consignmentStats = useMemo(() => {
    const report: Record<string, { total: number, payout: number, profit: number, items: number }> = {};
    
    const getItemPriceAfterDiscount = (item: any) => {
      if (item.finalPrice !== undefined) return item.finalPrice;
      if (!item.discountType || !item.discountValue) return item.price;
      let price = item.price;
      if (item.discountType === 'percent') {
        price = item.price * (1 - item.discountValue / 100);
      } else {
        price = item.price - item.discountValue;
      }
      return Math.max(0, Math.round((price + Number.EPSILON) * 100) / 100);
    };

    filteredData.forEach(tx => {
      tx.items.forEach(item => {
        if (item.isConsignment && item.partnerId) {
          if (!report[item.partnerId]) {
            report[item.partnerId] = { total: 0, payout: 0, profit: 0, items: 0 };
          }
          const actualPrice = getItemPriceAfterDiscount(item);
          const qty = item.quantity || 1;
          const lineTotal = actualPrice * qty;
          
          const partner = partners.find(p => p.id === item.partnerId);
          const rate = item.consignmentRate || (partner ? partner.gpRate : 0);
          const payout = (lineTotal * rate) / 100;
          const profit = lineTotal - payout;
          
          report[item.partnerId].total += lineTotal;
          report[item.partnerId].payout += payout;
          report[item.partnerId].profit += profit;
          report[item.partnerId].items += qty;
        }
      });
    });

    return Object.entries(report).map(([partnerId, data]) => ({
      vendorId: partnerId,
      vendorName: partners.find(p => p.id === partnerId)?.companyName || 'Unknown Vendor',
      ...data
    }));
  }, [filteredData, partners]);

  const stats = useMemo(() => {
    const totalRevenue = filteredData.reduce((acc, t) => acc + t.amount, 0);
    const totalDiscounts = filteredData.reduce((acc, t) => acc + (t.discountAmount || 0), 0);
    const totalOrders = filteredData.length;
    
    const dailyMap: Record<string, number> = {};
    filteredData.forEach(t => {
      dailyMap[t.date] = (dailyMap[t.date] || 0) + t.amount;
    });
    
    const chartData = Object.entries(dailyMap)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { totalRevenue, totalDiscounts, totalOrders, chartData };
  }, [filteredData]);

  const bestSellers = useMemo(() => {
    const counts: Record<string, { id: string; title: string; quantity: number; totalRevenue: number }> = {};
    filteredData.forEach(tx => {
      tx.items.forEach(item => {
        if (!counts[item.id]) {
          counts[item.id] = { id: item.id, title: item.title || 'Unknown Product', quantity: 0, totalRevenue: 0 };
        }
        const qty = item.quantity || 1;
        counts[item.id].quantity += qty;
        counts[item.id].totalRevenue += (item.finalPrice || item.price || 0) * qty;
      });
    });
    return Object.values(counts)
      .sort((a, b) => b.quantity - a.quantity || b.totalRevenue - a.totalRevenue)
      .slice(0, 5);
  }, [filteredData]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="px-6 lg:px-12 py-8 shrink-0 bg-white border-b border-gray-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 gap-6 pl-14 lg:pl-0">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Activity size={14} className="text-[#D9ED5F]" />
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">{t.analytics}</p>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-[#1A1F3D]">{t.businessInsights}</h1>
          </div>
          
          <div className="flex flex-wrap gap-2 bg-[#F5F6FA] p-1.5 rounded-[20px] lg:rounded-[24px]">
            {(['today', '7days', 'month', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={cn(
                  "px-6 py-2.5 text-[10px] font-black uppercase rounded-[18px] transition-all",
                  dateRange === r ? "bg-white text-[#1A1F3D] shadow-lg" : "text-gray-400 hover:text-gray-600"
                )}
              >
                {r === 'today' ? 'Today' : r === '7days' ? '7 Days' : r === 'month' ? '30 Days' : 'All Time'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4 border-t border-gray-50 pt-6">
          <button 
            onClick={() => setActiveTab('general')}
            className={cn("text-xs font-black uppercase tracking-widest pb-4 transition-all relative", activeReport === 'general' ? "text-[#1A1F3D]" : "text-gray-300")}
          >
            General Revenue
            {activeReport === 'general' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1A1F3D] rounded-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('consignment')}
            className={cn("text-xs font-black uppercase tracking-widest pb-4 transition-all relative", activeReport === 'consignment' ? "text-[#1A1F3D]" : "text-gray-300")}
          >
            {t.consignmentReport}
            {activeReport === 'consignment' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1A1F3D] rounded-full" />}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 lg:p-12 bg-[#F8F9FD] scrollbar-hide">
        <div className="max-w-7xl mx-auto space-y-8">
          {activeReport === 'general' ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                  <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mb-6"><DollarSign size={24} /></div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">{t.totalRevenue}</p>
                  <h2 className={cn("text-4xl font-black", stats.totalRevenue < 0 ? "text-red-500" : "text-[#1A1F3D]")}>
                    {stats.totalRevenue < 0 ? `-${currency}${Math.abs(stats.totalRevenue).toLocaleString()}` : `${currency}${stats.totalRevenue.toLocaleString()}`}
                  </h2>
                </div>
                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                  <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-6"><ArrowDownCircle size={24} /></div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">{t.totalDiscounts}</p>
                  <h2 className="text-4xl font-black text-[#1A1F3D]">{currency}{stats.totalDiscounts.toLocaleString()}</h2>
                </div>
                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                  <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mb-6"><Users size={24} /></div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">{t.totalSessions}</p>
                  <h2 className="text-4xl font-black text-[#1A1F3D]">{stats.totalOrders}</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Trend - Reduced to Half Width */}
                <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-black text-[#1A1F3D] mb-10">Revenue Trend</h3>
                  </div>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.chartData}>
                        <defs>
                          <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1A1F3D" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#1A1F3D" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 10, fontWeight: 700}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 10, fontWeight: 700}} />
                        <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                        <Area type="monotone" dataKey="amount" stroke="#1A1F3D" strokeWidth={4} fillOpacity={1} fill="url(#colorAmt)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Best-Selling Products Ranking */}
                <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm flex flex-col">
                  <div className="mb-6">
                    <h3 className="text-xl font-black text-[#1A1F3D]">
                      {language === 'th' ? 'ลำดับสินค้าขายดี' : 'Best-Selling Products'}
                    </h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                      {language === 'th' ? '5 อันดับสินค้าที่ขายได้มากที่สุด' : 'Top 5 products by sales volume'}
                    </p>
                  </div>

                  <div className="flex-1 flex flex-col justify-start space-y-4">
                    {bestSellers.length === 0 ? (
                      <div className="text-center py-20 opacity-25">
                        <Package size={48} className="mx-auto mb-4" />
                        <p className="font-black text-sm">{language === 'th' ? 'ไม่มีข้อมูลการขายสินค้า' : 'No product sales recorded'}</p>
                      </div>
                    ) : (
                      bestSellers.map((item, index) => {
                        const rankColors = [
                          'bg-amber-100 text-amber-700 border-amber-200', // 1st
                          'bg-slate-100 text-slate-700 border-slate-200', // 2nd
                          'bg-orange-100 text-orange-700 border-orange-200', // 3rd
                          'bg-gray-50 text-gray-500 border-gray-100', // 4th
                          'bg-gray-50 text-gray-500 border-gray-100', // 5th
                        ];

                        return (
                          <div 
                            key={item.id} 
                            className="flex items-center gap-4 p-4 rounded-3xl border border-gray-50 hover:border-gray-100 hover:bg-[#F8F9FD]/50 transition-all group"
                          >
                            <div className={cn(
                              "w-10 h-10 rounded-2xl flex items-center justify-center font-black border text-sm shrink-0",
                              rankColors[index]
                            )}>
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-black text-[#1A1F3D] text-sm truncate group-hover:text-indigo-600 transition-colors">
                                {item.title}
                              </h4>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">
                                {language === 'th' ? 'ยอดขายรวม' : 'Total Revenue'}: {currency}{item.totalRevenue.toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="bg-indigo-50 text-indigo-700 font-black text-xs px-3.5 py-1.5 rounded-full">
                                {item.quantity} {language === 'th' ? 'ชิ้น' : 'Units'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {consignmentStats.map(vendor => (
                  <div key={vendor.vendorId} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                        <Users size={20} />
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-gray-400 uppercase">Vendor Share</p>
                        <p className="text-lg font-black text-indigo-600">{currency}{vendor.payout.toLocaleString()}</p>
                      </div>
                    </div>
                    <h4 className="text-xl font-black text-[#1A1F3D] mb-6">{vendor.vendorName}</h4>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-[#F5F6FA] p-4 rounded-2xl">
                        <span className="text-[10px] font-black uppercase text-gray-400">Shop Profit</span>
                        <span className="text-sm font-black text-green-600">+{currency}{vendor.profit.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between px-2">
                        <span className="text-[9px] font-black uppercase text-gray-300">Items Sold</span>
                        <span className="text-[10px] font-black text-[#1A1F3D]">{vendor.items} Units</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {consignmentStats.length === 0 && (
                <div className="py-20 text-center opacity-20 border-2 border-dashed border-gray-200 rounded-[48px]">
                  <Package size={48} className="mx-auto mb-4" />
                  <p className="font-black">No consignment sales recorded for this period</p>
                </div>
              )}
            </div>
          )}

          {/* Transaction List at bottom */}
          <div className="bg-white rounded-[48px] border border-gray-100 shadow-sm overflow-hidden mb-10">
            <div className="p-10 border-b border-gray-50 flex justify-between items-center">
              <h3 className="text-2xl font-black text-[#1A1F3D]">{t.transactionLedger}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-10 py-6 text-left text-[10px] font-black uppercase text-gray-400">Date / ID</th>
                    <th className="px-10 py-6 text-left text-[10px] font-black uppercase text-gray-400">Items</th>
                    <th className="px-10 py-6 text-left text-[10px] font-black uppercase text-gray-400">Customer</th>
                    <th className="px-10 py-6 text-right text-[10px] font-black uppercase text-gray-400">Total</th>
                    <th className="px-10 py-6 text-center text-[10px] font-black uppercase text-gray-400">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[...filteredData].reverse().map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#F8F9FD] transition-colors">
                      <td className="px-10 py-8">
                        <p className="text-xs font-black">{tx.date}</p>
                        <p className="text-[9px] text-gray-300 font-bold uppercase">{tx.id}</p>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex flex-wrap gap-1">
                          {tx.items.map((item, idx) => (
                            <span key={idx} className={cn(
                              "text-[8px] font-black px-2 py-0.5 rounded-full uppercase",
                              item.type === 'Product' ? (item.isConsignment ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700") : "bg-gray-100 text-gray-600"
                            )}>
                              {item.title}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-10 py-8 font-black text-sm">{tx.customerName}</td>
                      <td className={cn("px-10 py-8 text-right font-black", tx.amount < 0 ? "text-red-500" : "text-[#1A1F3D]")}>
                        {tx.amount < 0 ? `-${currency}${Math.abs(tx.amount).toFixed(2)}` : `${currency}${tx.amount.toFixed(2)}`}
                      </td>
                      <td className="px-10 py-8 text-center">
                        <button onClick={() => { if(confirm('Delete?')) deleteTransaction(tx.id); }} className="p-2 text-red-400 hover:bg-red-50 rounded-xl"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))}
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