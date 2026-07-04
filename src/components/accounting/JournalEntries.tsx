import React, { useState } from 'react';
import { useStore, JournalEntry, JournalType } from '@/store/useStore';
import { Plus, Search, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const JOURNAL_TYPES: Record<JournalType, string> = {
  JV: 'สมุดรายวันทั่วไป (JV)',
  PJ: 'สมุดรายวันซื้อ (PJ)',
  SJ: 'สมุดรายวันขาย (SJ)',
  CR: 'สมุดรายวันรับเงิน (CR)',
  CP: 'สมุดรายวันจ่ายเงิน (CP)',
};

const JournalEntries = () => {
  const { journalEntries } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<JournalType | 'ALL'>('ALL');

  const filteredEntries = journalEntries.filter(e => {
    const matchesSearch = e.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (e.referenceNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'ALL' || e.journalType === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-[#1A1F3D]">สมุดรายวัน (Journal Entries)</h2>
          <p className="text-sm text-gray-500">บันทึกรายการค้า เดบิต/เครดิต</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <select 
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="px-4 py-2.5 rounded-2xl border-none bg-white shadow-sm focus:ring-2 focus:ring-[#1A1F3D]/20 text-sm font-medium text-gray-700 outline-none"
          >
            <option value="ALL">ทุกสมุดรายวัน</option>
            {Object.entries(JOURNAL_TYPES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <div className="relative flex-1 md:w-64 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              placeholder="ค้นหาเลขที่, คำอธิบาย..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl border-none bg-white shadow-sm focus:ring-2 focus:ring-[#1A1F3D]/20 text-sm"
            />
          </div>
          <button className="px-5 py-2.5 bg-gradient-to-br from-[#18234a] to-[#020d35] text-white rounded-2xl text-sm font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 whitespace-nowrap">
            <Plus size={16} /> <span>ลงรายการสมุดรายวัน</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider">วันที่</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider">เลขที่รายการ</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider">ประเภท</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider">คำอธิบาย</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider text-right">ยอดรวม (THB)</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length > 0 ? (
                filteredEntries.map((entry, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={entry.id} 
                    className="border-b border-gray-50 hover:bg-[#F9F9F9] transition-colors cursor-pointer group"
                  >
                    <td className="p-4 text-sm font-medium text-gray-600 whitespace-nowrap">{entry.date}</td>
                    <td className="p-4 text-sm font-bold text-[#1A1F3D] whitespace-nowrap">{entry.id}</td>
                    <td className="p-4 text-sm">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg font-bold text-xs">
                        {entry.journalType}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600 max-w-[200px] truncate">{entry.description}</td>
                    <td className="p-4 text-sm font-bold text-[#1A1F3D] text-right">
                      {entry.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-center">
                      {entry.status === 'Posted' ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-600 text-xs font-bold">
                          <CheckCircle2 size={12} /> Posted
                        </div>
                      ) : entry.status === 'Draft' ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-bold">
                          <FileText size={12} /> Draft
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold">
                          <XCircle size={12} /> Void
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400 text-sm">
                    ไม่มีรายการสมุดรายวันที่ค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default JournalEntries;
