import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { BarChart3, TrendingUp, TrendingDown, Scale, Download } from 'lucide-react';
import { motion } from 'framer-motion';

const FinancialReports = () => {
  const { journalEntries, accountCodes, transactions } = useStore();
  const [reportType, setReportType] = useState<'TRIAL' | 'PL' | 'BALANCE'>('TRIAL');

  // Filter posted entries
  const postedEntries = journalEntries.filter(e => e.status === 'Posted');

  // Calculate Account Balances for Trial Balance
  const accountBalances = accountCodes.map(acc => {
    let debitSum = 0;
    let creditSum = 0;

    postedEntries.forEach(entry => {
      (entry.lines || []).forEach(line => {
        if (line.accountId === acc.id || line.accountCodeId === acc.id) {
          debitSum += Number(line.debit || 0);
          creditSum += Number(line.credit || 0);
        }
      });
    });

    const net = acc.category === 'Assets' || acc.category === 'Expenses'
      ? debitSum - creditSum
      : creditSum - debitSum;

    return {
      ...acc,
      debitSum,
      creditSum,
      net
    };
  });

  // Dynamic Revenue & Expense Calculations
  const revenueAccounts = accountBalances.filter(a => a.category === 'Revenue');
  const expenseAccounts = accountBalances.filter(a => a.category === 'Expenses');

  let totalRevenue = revenueAccounts.reduce((sum, a) => sum + a.net, 0);
  let totalExpenses = expenseAccounts.reduce((sum, a) => sum + a.net, 0);

  // Fallback to POS transactions if journal entries haven't been auto-posted yet
  if (totalRevenue === 0 && transactions.length > 0) {
    totalRevenue = transactions.reduce((sum, t) => sum + (t.subtotal || t.amount || 0), 0);
  }

  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-[#1A1F3D]">งบการเงินและรายงาน (Financial Reports)</h2>
          <p className="text-sm text-gray-500">เรียกดูงบทดลอง, งบกำไรขาดทุน, งบดุล</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1 rounded-[2rem] shadow-sm border border-gray-100">
          <button 
            onClick={() => setReportType('TRIAL')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${reportType === 'TRIAL' ? 'bg-[#1A1F3D] text-white' : 'text-gray-500 hover:text-gray-800'}`}
          >
            งบทดลอง
          </button>
          <button 
            onClick={() => setReportType('PL')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${reportType === 'PL' ? 'bg-[#1A1F3D] text-white' : 'text-gray-500 hover:text-gray-800'}`}
          >
            งบกำไรขาดทุน
          </button>
          <button 
            onClick={() => setReportType('BALANCE')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${reportType === 'BALANCE' ? 'bg-[#1A1F3D] text-white' : 'text-gray-500 hover:text-gray-800'}`}
          >
            งบแสดงฐานะการเงิน
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-[#18234a] to-[#020d35] rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden group">
          <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-500">
            <TrendingUp size={120} />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md mb-6 border border-white/10">
            <TrendingUp size={24} className="text-[#EAFD69]" />
          </div>
          <p className="text-white/70 text-sm font-bold uppercase tracking-widest mb-1">รายได้รวม (Total Revenue)</p>
          <h3 className="text-3xl font-black text-white">
            ฿{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute right-0 top-0 opacity-5 transform translate-x-1/4 -translate-y-1/4 text-red-500 group-hover:scale-110 transition-transform duration-500">
            <TrendingDown size={120} />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-6">
            <TrendingDown size={24} className="text-red-500" />
          </div>
          <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">ค่าใช้จ่ายรวม (Total Expenses)</p>
          <h3 className="text-3xl font-black text-[#1A1F3D]">
            ฿{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
        </div>

        <div className="bg-[#EAFD69] rounded-[2rem] p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 opacity-20 transform translate-x-1/4 -translate-y-1/4 text-[#1A1F3D] group-hover:scale-110 transition-transform duration-500">
            <Scale size={120} />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#1A1F3D]/10 flex items-center justify-center mb-6">
            <Scale size={24} className="text-[#1A1F3D]" />
          </div>
          <p className="text-[#1A1F3D]/60 text-sm font-bold uppercase tracking-widest mb-1">กำไรสุทธิ (Net Profit)</p>
          <h3 className="text-3xl font-black text-[#1A1F3D]">
            ฿{netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100/50 p-6 overflow-hidden">
        {accountBalances.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-[#F9F9F9]/50">
                  <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider">รหัสบัญชี</th>
                  <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider">ชื่อบัญชี</th>
                  <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider">หมวดหมู่</th>
                  <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider text-right">เดบิต (Dr.)</th>
                  <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider text-right">เครดิต (Cr.)</th>
                  <th className="p-4 text-xs font-black text-[#1A1F3D] uppercase tracking-wider text-right">ยอดสุทธิ</th>
                </tr>
              </thead>
              <tbody>
                {accountBalances.map((acc) => (
                  <tr key={acc.id} className="border-b border-gray-50 hover:bg-[#F9F9F9] transition-colors">
                    <td className="p-4 text-sm font-bold text-[#1A1F3D]">{acc.code}</td>
                    <td className="p-4 text-sm text-gray-700">{acc.name}</td>
                    <td className="p-4 text-sm">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg font-bold text-xs">
                        {acc.category}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-700 text-right">
                      {acc.debitSum > 0 ? acc.debitSum.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="p-4 text-sm text-gray-700 text-right">
                      {acc.creditSum > 0 ? acc.creditSum.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="p-4 text-sm font-bold text-[#1A1F3D] text-right bg-blue-50/20">
                      ฿{acc.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 flex flex-col items-center justify-center text-center text-gray-400">
            <BarChart3 size={48} className="text-gray-200 mb-4" />
            <h3 className="text-lg font-bold text-gray-400 mb-2">ยังไม่มีผังบัญชีสำหรับแสดงผล</h3>
            <p className="text-sm text-gray-400 max-w-md text-center mb-6">
              โปรดเพิ่มรหัสบัญชีในผังบัญชีเพื่อเรียกดูงบการเงิน
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialReports;
