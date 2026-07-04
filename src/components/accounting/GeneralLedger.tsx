import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Search, Filter, BookOpen } from 'lucide-react';

const GeneralLedger = () => {
  const { accountCodes, journalEntries } = useStore();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  const activeAccount = accountCodes.find(c => c.id === selectedAccountId);
  
  // Filter only posted entries
  const postedEntries = journalEntries.filter(e => e.status === 'Posted');
  
  // Get lines related to the selected account
  const ledgerLines = postedEntries.flatMap(entry => 
    entry.lines
      .filter(line => line.accountId === selectedAccountId)
      .map(line => ({
        date: entry.date,
        journalId: entry.id,
        journalType: entry.journalType,
        description: line.description || entry.description,
        debit: line.debit,
        credit: line.credit
      }))
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate running balance
  // Assume normal balance: Assets/Expenses -> Debit (Dr), Liabilities/Equity/Revenue -> Credit (Cr)
  let balance = 0;
  const isDebitNormal = activeAccount?.category === 'Assets' || activeAccount?.category === 'Expenses';

  const ledgerWithBalance = ledgerLines.map(line => {
    if (isDebitNormal) {
      balance += line.debit - line.credit;
    } else {
      balance += line.credit - line.debit;
    }
    return { ...line, balance };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-[#1A1F3D]">บัญชีแยกประเภท (General Ledger)</h2>
          <p className="text-sm text-gray-500">ตรวจสอบประวัติและรายการเคลื่อนไหวของแต่ละบัญชี</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 md:w-64 min-w-[200px]">
            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <select 
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl border-none bg-white shadow-sm focus:ring-2 focus:ring-[#1A1F3D]/20 text-sm appearance-none outline-none font-medium"
            >
              <option value="" disabled>-- เลือกรหัสบัญชี --</option>
              {accountCodes.map(code => (
                <option key={code.id} value={code.id}>{code.code} - {code.name}</option>
              ))}
            </select>
          </div>
          <button className="px-5 py-2.5 bg-white text-gray-700 rounded-2xl text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2">
            <Filter size={16} /> ตัวกรองวันที่
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100/50 overflow-hidden">
        {selectedAccountId ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-[#F9F9F9]/50">
                  <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider">วันที่</th>
                  <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider">อ้างอิง</th>
                  <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider">คำอธิบาย</th>
                  <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider text-right">เดบิต (Dr.)</th>
                  <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider text-right">เครดิต (Cr.)</th>
                  <th className="p-4 text-xs font-black text-[#1A1F3D] uppercase tracking-wider text-right">
                    ยอดยกไป {isDebitNormal ? '(Dr.)' : '(Cr.)'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {ledgerWithBalance.length > 0 ? (
                  ledgerWithBalance.map((line, idx) => (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-[#F9F9F9] transition-colors">
                      <td className="p-4 text-sm font-medium text-gray-600 whitespace-nowrap">{line.date}</td>
                      <td className="p-4 text-sm font-bold text-blue-600 whitespace-nowrap cursor-pointer hover:underline">
                        {line.journalId}
                      </td>
                      <td className="p-4 text-sm text-gray-600">{line.description}</td>
                      <td className="p-4 text-sm text-gray-700 text-right">
                        {line.debit > 0 ? line.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                      </td>
                      <td className="p-4 text-sm text-gray-700 text-right">
                        {line.credit > 0 ? line.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                      </td>
                      <td className="p-4 text-sm font-bold text-[#1A1F3D] text-right bg-blue-50/30">
                        {line.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400 text-sm">
                      ไม่มีรายการเคลื่อนไหวสำหรับบัญชีนี้
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 flex flex-col items-center justify-center text-center text-gray-400">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <BookOpen size={32} className="text-gray-300" />
            </div>
            <p className="font-bold text-gray-500 mb-1">ยังไม่ได้เลือกบัญชี</p>
            <p className="text-sm">กรุณาเลือกรหัสบัญชีจากเมนูด้านบนเพื่อดูรายการแยกประเภท</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneralLedger;
