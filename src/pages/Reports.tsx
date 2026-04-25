"use client";

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, DollarSign, Dog, Cat, 
  CreditCard, Wallet, Calendar as CalendarIcon, Filter, 
  ArrowDownCircle, Users, Activity, 
  Scissors, UserCheck, History, Edit3, Trash2, X, Lock, CheckCircle2
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
  
  // Filter States
  const [dateRange, setDateRange] = useState<'today' | '7days' | 'month' | 'all'>('all');
  const [speciesFilter, setSpeciesFilter] = useState<'All' | 'Dog' | 'Cat'>('All');
  const [paymentFilter, setPaymentFilter] = useState<'All' | PaymentMethod>('All');
  const [bookingFilter, setBookingFilter] = useState<'All' | BookingType>('All');

  // Edit/Delete States
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

    if (paymentFilter !== 'All') {
      data = data.filter(t => t.paymentMethod === paymentFilter);
    }

    if (bookingFilter !== 'All') {
      data = data.filter(t => t.bookingType === bookingFilter);
    }

    return data;
  }, [transactions, dateRange, speciesFilter, paymentFilter, bookingFilter]);

  const stats = useMemo(() => {
    const totalRevenue = filteredData.reduce((acc, t) => acc + t.amount, 0);
    const totalDiscounts = filteredData.reduce((acc, t) => acc + (t.discountAmount || 0), 0);
    const totalOrders = filteredData.length;
    const dogCount = filteredData.filter(t => t.species.includes('Dog')).length;
    const catCount = filteredData.filter(t => t.species.includes('Cat')).length;
    const apptCount = filteredData.filter(t => t.bookingType === 'Appointment').length;
    const walkInCount = filteredData.filter(t => t.bookingType === 'Walk-in').length;
    
    const dailyMap: Record<string, number> = {};
    filteredData.forEach(t => {
      dailyMap[t.date] = (dailyMap[t.date] || 0) + t.amount;
    });
    
    const chartData = Object.entries(dailyMap)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { 
      totalRevenue, totalDiscounts, totalOrders, dogCount, 
      catCount, apptCount, walkInCount, chartData 
    };
  }, [filteredData]);

  const handleVerify = () => {
    if (verifyPassword(password)) {
      if (pendingAction === 'delete' && deletingTxId) {
        deleteTransaction(deletingTxId);
        toast.success("Transaction deleted successfully");
        setDeletingTxId(null);
      } else if (pendingAction === 'edit' && editingTx) {
        // Logic will continue in the Edit Modal
        setPassConfirmOpen(false);
        setPassword('');
        return;
      }
      setPassConfirmOpen(false);
      setPassword('');
      setPendingAction(null);
    } else {
      toast.error("Incorrect password");
    }
  };

  const startEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setPendingAction('edit');
    setPassConfirmOpen(true);
  };

  const startDelete = (id: string) => {
    setDeletingTxId(id);
    setPendingAction('delete');
    setPassConfirmOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="px-6 lg:px-12 py-8 shrink-0 bg-white border-b border-gray-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 gap-6 pl-14 lg:pl-0">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Activity size={14} className="text-[#D9ED5F]" />
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Business Analytics</p>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-[#1A1F3D]">Sanctuary Insights</h1>
          </div>
          
          <div className="flex flex-wrap gap-2 bg-[#F5F6FA] p-1.5 rounded-[20px] lg:rounded-[24px]">
            {(['today', '7days', 'month', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={cn(
                  "px-4 lg:px-6 py-2.5 text-[9px] lg:text-[10px] font-black uppercase rounded-[16px] lg:rounded-[18px] transition-all whitespace-nowrap",
                  dateRange === r ? "bg-white text-[#1A1F3D] shadow-lg" : "text-gray-400 hover:text-gray-600"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center pl-14 lg:pl-0">
          <div className="flex items-center gap-3 bg-[#F5F6FA] px-4 py-3 rounded-2xl border border-transparent hover:border-gray-200 transition-all cursor-pointer">
            <Filter size={14} className="text-gray-400" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-200 pr-3">Species</span>
            <select value={speciesFilter} onChange={(e) => setSpeciesFilter(e.target.value as any)} className="bg-transparent border-none text-[11px] font-black outline-none pr-6">
              <option value="All">Mixed</option>
              <option value="Dog">🐶 Dogs</option>
              <option value="Cat">🐱 Cats</option>
            </select>
          </div>
          <div className="flex items-center gap-3 bg-[#F5F6FA] px-4 py-3 rounded-2xl border border-transparent hover:border-gray-200 transition-all cursor-pointer">
            <CreditCard size={14} className="text-gray-400" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-200 pr-3">Method</span>
            <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as any)} className="bg-transparent border-none text-[11px] font-black outline-none pr-6">
              <option value="All">All Methods</option>
              <option value="Cash">Cash</option>
              <option value="Transfer">Transfer</option>
              <option value="Credit Card">Card</option>
            </select>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 lg:p-12 bg-[#F8F9FD] scrollbar-hide">
        <div className="max-w-7xl mx-auto space-y-8 lg:space-y-12">
          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mb-6"><DollarSign size={24} /></div>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Total Revenue</p>
              <h2 className="text-4xl font-black text-[#1A1F3D]">{currency}{stats.totalRevenue.toLocaleString()}</h2>
            </div>
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-6"><ArrowDownCircle size={24} /></div>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Total Discounts</p>
              <h2 className="text-4xl font-black text-[#1A1F3D]">{currency}{stats.totalDiscounts.toLocaleString()}</h2>
            </div>
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-6">
                 <div className="flex gap-2">
                   <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center"><Dog size={20}/></div>
                   <div className="w-10 h-10 bg-pink-50 text-pink-500 rounded-xl flex items-center justify-center"><Cat size={20}/></div>
                 </div>
              </div>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Pet Counts</p>
              <h2 className="text-4xl font-black text-[#1A1F3D]">{stats.dogCount + stats.catCount}</h2>
            </div>
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mb-6"><Users size={24} /></div>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Total Sessions</p>
              <h2 className="text-4xl font-black text-[#1A1F3D]">{stats.totalOrders}</h2>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white p-8 lg:p-12 rounded-[48px] border border-gray-100 shadow-sm">
            <h3 className="text-2xl font-black text-[#1A1F3D] mb-10">Revenue Performance</h3>
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
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }} />
                  <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px -10px rgb(0 0 0 / 0.1)', padding: '16px', fontWeight: 'bold' }} formatter={(value) => [`${currency}${value}`, 'Revenue']} />
                  <Area type="monotone" dataKey="amount" stroke="#1A1F3D" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" animationDuration={2000} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-[48px] border border-gray-100 shadow-sm overflow-hidden mb-10">
            <div className="p-10 border-b border-gray-50 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-[#1A1F3D]">Transaction Ledger</h3>
                <p className="text-xs text-gray-400 font-medium">Record of business operations</p>
              </div>
            </div>
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-10 py-6 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">Transaction ID</th>
                    <th className="px-10 py-6 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">Customer</th>
                    <th className="px-10 py-6 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">Staff</th>
                    <th className="px-10 py-6 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">Method</th>
                    <th className="px-10 py-6 text-right text-[10px] font-black uppercase text-gray-400 tracking-widest">Amount</th>
                    <th className="px-10 py-6 text-center text-[10px] font-black uppercase text-gray-400 tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[...filteredData].reverse().map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#F8F9FD] transition-colors group">
                      <td className="px-10 py-8">
                        <span className="text-xs font-black text-[#1A1F3D]">{tx.id}</span>
                        <div className="text-[9px] text-gray-400 font-bold uppercase mt-1">{tx.date}</div>
                      </td>
                      <td className="px-10 py-8">
                        <p className="text-sm font-black text-[#1A1F3D]">{tx.customerName}</p>
                        <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 uppercase tracking-tighter">
                          {tx.bookingType}
                        </span>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-2">
                          <Scissors size={10} className="text-gray-300" />
                          <span className="text-[10px] font-bold text-[#1A1F3D]">{tx.staffName}</span>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-white", tx.paymentMethod === 'Cash' ? "bg-orange-400" : "bg-blue-400")}>
                            {tx.paymentMethod === 'Cash' ? <Wallet size={12}/> : <CreditCard size={12}/>}
                          </div>
                          <span className="text-[10px] font-bold text-gray-600">{tx.paymentMethod}</span>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-right font-black text-[#1A1F3D]">
                        {currency}{tx.amount.toFixed(2)}
                      </td>
                      <td className="px-10 py-8 text-center">
                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(tx)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Edit3 size={16}/></button>
                          <button onClick={() => startDelete(tx.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Confirmation Modal */}
      {passConfirmOpen && (
        <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[150] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock size={24} />
              </div>
              <h3 className="text-lg font-black text-[#1A1F3D]">Verification Required</h3>
              <p className="text-xs text-gray-400 font-medium">Enter your password to continue</p>
            </div>
            <input 
              type="password" 
              autoFocus
              className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-black text-center mb-6 focus:ring-4 focus:ring-[#1A1F3D]/5"
              placeholder="••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleVerify()}
            />
            <div className="flex gap-3">
              <button onClick={() => setPassConfirmOpen(false)} className="flex-1 py-3 text-xs font-black text-gray-400 uppercase">Cancel</button>
              <button onClick={handleVerify} className="flex-1 bg-[#1A1F3D] text-white py-3 rounded-xl text-xs font-black shadow-lg">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTx && !passConfirmOpen && (
        <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[140] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-[#1A1F3D]">Edit Transaction</h3>
                <p className="text-xs text-gray-400 font-bold">{editingTx.id}</p>
              </div>
              <button onClick={() => setEditingTx(null)} className="p-2 hover:bg-gray-50 rounded-xl"><X size={20} className="text-gray-400"/></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Bill Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-black">{currency}</span>
                    <input 
                      type="number"
                      className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-6 py-4 text-sm font-black"
                      value={editingTx.amount}
                      onChange={e => setEditingTx({...editingTx, amount: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Payment Method</label>
                  <select 
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-black appearance-none"
                    value={editingTx.paymentMethod}
                    onChange={e => setEditingTx({...editingTx, paymentMethod: e.target.value as PaymentMethod})}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Transfer">Transfer</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>
              </div>
              <button 
                onClick={() => {
                  updateTransaction(editingTx.id, { amount: editingTx.amount, paymentMethod: editingTx.paymentMethod });
                  toast.success("Bill updated and stats recalculated");
                  setEditingTx(null);
                }}
                className="w-full bg-[#1A1F3D] text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-[#1A1F3D]/10"
              >
                <CheckCircle2 size={18} /> Update Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;