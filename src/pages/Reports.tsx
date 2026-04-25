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
import { translations } from '@/utils/translations';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { toast } from 'sonner';

const Reports = () => {
  const { transactions, currency, verifyPassword, updateTransaction, deleteTransaction, language } = useStore();
  const t = translations[language];
  
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
    
    const dailyMap: Record<string, number> = {};
    filteredData.forEach(t => {
      dailyMap[t.date] = (dailyMap[t.date] || 0) + t.amount;
    });
    
    const chartData = Object.entries(dailyMap)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { 
      totalRevenue, totalDiscounts, totalOrders, dogCount, 
      catCount, chartData 
    };
  }, [filteredData]);

  const handleVerify = () => {
    if (verifyPassword(password)) {
      if (pendingAction === 'delete' && deletingTxId) {
        deleteTransaction(deletingTxId);
        toast.success(language === 'th' ? "ลบรายการเรียบร้อยแล้ว" : "Transaction deleted successfully");
        setDeletingTxId(null);
      }
      setPassConfirmOpen(false);
      setPassword('');
      setPendingAction(null);
    } else {
      toast.error(language === 'th' ? "รหัสผ่านไม่ถูกต้อง" : "Incorrect password");
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
                  "px-4 lg:px-6 py-2.5 text-[9px] lg:text-[10px] font-black uppercase rounded-[16px] lg:rounded-[18px] transition-all whitespace-nowrap",
                  dateRange === r ? "bg-white text-[#1A1F3D] shadow-lg" : "text-gray-400 hover:text-gray-600"
                )}
              >
                {r === 'today' ? 'Today' : r === '7days' ? '7 Days' : r === 'month' ? '30 Days' : 'All Time'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 lg:p-12 bg-[#F8F9FD] scrollbar-hide">
        <div className="max-w-7xl mx-auto space-y-8 lg:space-y-12">
          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
              <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mb-6"><DollarSign size={24} /></div>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">{t.totalRevenue}</p>
              <h2 className="text-4xl font-black text-[#1A1F3D]">{currency}{stats.totalRevenue.toLocaleString()}</h2>
            </div>
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
              <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-6"><ArrowDownCircle size={24} /></div>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">{t.totalDiscounts}</p>
              <h2 className="text-4xl font-black text-[#1A1F3D]">{currency}{stats.totalDiscounts.toLocaleString()}</h2>
            </div>
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                 <div className="flex gap-2">
                   <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center"><Dog size={20}/></div>
                   <div className="w-10 h-10 bg-pink-50 text-pink-500 rounded-xl flex items-center justify-center"><Cat size={20}/></div>
                 </div>
              </div>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">{t.petCounts}</p>
              <h2 className="text-4xl font-black text-[#1A1F3D]">{stats.dogCount + stats.catCount}</h2>
            </div>
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
              <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mb-6"><Users size={24} /></div>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">{t.totalSessions}</p>
              <h2 className="text-4xl font-black text-[#1A1F3D]">{stats.totalOrders}</h2>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-[48px] border border-gray-100 shadow-sm overflow-hidden mb-10">
            <div className="p-10 border-b border-gray-50">
              <h3 className="text-2xl font-black text-[#1A1F3D]">{t.transactionLedger}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-10 py-6 text-left text-[10px] font-black uppercase text-gray-400">Transaction ID</th>
                    <th className="px-10 py-6 text-left text-[10px] font-black uppercase text-gray-400">Customer</th>
                    <th className="px-10 py-6 text-left text-[10px] font-black uppercase text-gray-400">Staff</th>
                    <th className="px-10 py-6 text-left text-[10px] font-black uppercase text-gray-400">Method</th>
                    <th className="px-10 py-6 text-right text-[10px] font-black uppercase text-gray-400">Amount</th>
                    <th className="px-10 py-6 text-center text-[10px] font-black uppercase text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[...filteredData].reverse().map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#F8F9FD] transition-colors group">
                      <td className="px-10 py-8 text-xs font-black">{tx.id}</td>
                      <td className="px-10 py-8">
                        <p className="text-sm font-black">{tx.customerName}</p>
                        <span className="text-[8px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase">{tx.bookingType}</span>
                      </td>
                      <td className="px-10 py-8 text-[10px] font-bold">{tx.staffName}</td>
                      <td className="px-10 py-8">
                        <span className="text-[10px] font-bold">{tx.paymentMethod}</span>
                      </td>
                      <td className="px-10 py-8 text-right font-black">{currency}{tx.amount.toFixed(2)}</td>
                      <td className="px-10 py-8 text-center">
                        <button onClick={() => startDelete(tx.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                      </td>
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
            <div className="text-center mb-6">
              <Lock size={24} className="mx-auto mb-4 text-orange-500" />
              <h3 className="text-lg font-black">{t.verificationRequired}</h3>
              <p className="text-xs text-gray-400">{t.enterPassword}</p>
            </div>
            <input 
              type="password" 
              autoFocus
              className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-center mb-6"
              onChange={e => setPassword(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={() => setPassConfirmOpen(false)} className="flex-1 py-3 text-xs font-black">{t.cancel}</button>
              <button onClick={handleVerify} className="flex-1 bg-[#1A1F3D] text-white py-3 rounded-xl text-xs font-black">{t.confirm}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;