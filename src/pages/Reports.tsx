"use client";

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, DollarSign, Dog, Cat, 
  CreditCard, Wallet, Filter, 
  ArrowDownCircle, Users, Activity, 
  Scissors, Edit3, Trash2, X, Lock, CheckCircle2
} from 'lucide-react';
import { useStore, PaymentMethod, BookingType, Transaction } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { toast } from 'sonner';

const Reports = () => {
  const { transactions, currency, verifyPassword, updateTransaction, deleteTransaction } = useStore();
  const [dateRange, setDateRange] = useState<'today' | '7days' | 'month' | 'all'>('all');
  const [speciesFilter, setSpeciesFilter] = useState<'All' | 'Dog' | 'Cat'>('All');
  
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);
  const [passConfirmOpen, setPassConfirmOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [pendingAction, setPendingAction] = useState<'edit' | 'delete' | null>(null);

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

    return data;
  }, [transactions, dateRange, speciesFilter]);

  const stats = useMemo(() => {
    const totalRevenue = filteredData.reduce((acc, t) => acc + t.amount, 0);
    const totalOrders = filteredData.length;
    const dogCount = filteredData.filter(t => t.species.includes('Dog')).length;
    const catCount = filteredData.filter(t => t.species.includes('Cat')).length;
    
    const dailyMap: Record<string, number> = {};
    filteredData.forEach(t => {
      dailyMap[t.date] = (dailyMap[t.date] || 0) + t.amount;
    });
    
    const chartData = Object.entries(dailyMap)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { totalRevenue, totalOrders, dogCount, catCount, chartData };
  }, [filteredData]);

  const handleVerify = () => {
    if (verifyPassword(password)) {
      if (pendingAction === 'delete' && deletingTxId) {
        deleteTransaction(deletingTxId);
        toast.success("Deleted");
        setDeletingTxId(null);
      }
      setPassConfirmOpen(false);
      setPassword('');
      setPendingAction(null);
    } else {
      toast.error("Invalid");
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8F9FD]">
      <header className="px-6 lg:px-12 py-6 lg:py-8 bg-white border-b border-gray-100 shrink-0">
        <div className="pl-14 lg:pl-0 flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity size={14} className="text-[#D9ED5F]" />
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Analytics</p>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-[#1A1F3D]">Reports</h1>
          </div>
          
          <div className="flex overflow-x-auto scrollbar-hide gap-2 bg-[#F5F6FA] p-1.5 rounded-2xl">
            {(['today', '7days', 'month', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={cn(
                  "px-4 py-2 text-[10px] font-black uppercase rounded-xl transition-all whitespace-nowrap",
                  dateRange === r ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 lg:p-12 scrollbar-hide">
        <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: DollarSign, color: 'green', label: 'Revenue', value: `${currency}${stats.totalRevenue.toLocaleString()}` },
              { icon: Users, color: 'purple', label: 'Sessions', value: stats.totalOrders },
              { icon: Dog, color: 'blue', label: 'Dogs', value: stats.dogCount },
              { icon: Cat, color: 'pink', label: 'Cats', value: stats.catCount }
            ].map((s, i) => (
              <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-4", `bg-${s.color}-50 text-${s.color}-500`)}>
                  <s.icon size={20} />
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">{s.label}</p>
                <h2 className="text-2xl font-black text-[#1A1F3D]">{s.value}</h2>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-white p-6 lg:p-10 rounded-[32px] lg:rounded-[48px] border border-gray-100 shadow-sm">
            <h3 className="text-lg lg:text-xl font-black mb-6">Revenue Trend</h3>
            <div className="h-[250px] lg:h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F1" />
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                  <Area type="monotone" dataKey="amount" stroke="#1A1F3D" strokeWidth={3} fill="#1A1F3D" fillOpacity={0.05} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Transaction Table */}
          <div className="bg-white rounded-[32px] lg:rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50">
              <h3 className="text-lg font-black text-[#1A1F3D]">Ledger</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Date</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Customer</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-gray-400">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredData.slice(-10).map((tx) => (
                    <tr key={tx.id} className="text-xs">
                      <td className="px-6 py-4 font-medium text-gray-400">{tx.date}</td>
                      <td className="px-6 py-4 font-black text-[#1A1F3D]">{tx.customerName}</td>
                      <td className="px-6 py-4 text-right font-black">{currency}{tx.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {passConfirmOpen && (
        <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[150] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl">
            <h3 className="text-lg font-black mb-4 text-center">Verify Access</h3>
            <input 
              type="password" 
              className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-center mb-6 font-black"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={() => setPassConfirmOpen(false)} className="flex-1 py-3 text-xs font-black text-gray-400">CANCEL</button>
              <button onClick={handleVerify} className="flex-1 bg-[#1A1F3D] text-white py-3 rounded-xl text-xs font-black">VERIFY</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;