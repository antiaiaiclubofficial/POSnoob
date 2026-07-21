import React, { useState } from 'react';
import { useStore, JournalEntry, JournalType, JournalEntryLine } from '@/store/useStore';
import { Plus, Search, FileText, CheckCircle2, XCircle, X, Trash2, Calendar, Hash, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const JOURNAL_TYPES: Record<JournalType, string> = {
  JV: 'สมุดรายวันทั่วไป (JV)',
  PJ: 'สมุดรายวันซื้อ (PJ)',
  SJ: 'สมุดรายวันขาย (SJ)',
  CR: 'สมุดรายวันรับเงิน (CR)',
  CP: 'สมุดรายวันจ่ายเงิน (CP)',
};

const JournalEntries = () => {
  const { journalEntries, accountCodes, addJournalEntry } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<JournalType | 'ALL'>('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  // New Journal Entry Form state
  const [entryForm, setEntryForm] = useState({
    date: new Date().toISOString().split('T')[0],
    journalType: 'JV' as JournalType,
    referenceNo: '',
    description: '',
    status: 'Posted' as 'Draft' | 'Posted' | 'Void'
  });

  const [lines, setLines] = useState<Array<{ accountId: string; description: string; debit: number; credit: number }>>([
    { accountId: '', description: '', debit: 0, credit: 0 },
    { accountId: '', description: '', debit: 0, credit: 0 }
  ]);

  const filteredEntries = journalEntries.filter(e => {
    const matchesSearch = e.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (e.referenceNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'ALL' || e.journalType === selectedType;
    return matchesSearch && matchesType;
  });

  // Calculate totals
  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleAddLine = () => {
    setLines([...lines, { accountId: '', description: '', debit: 0, credit: 0 }]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: string, value: any) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  };

  const handleSubmit = async () => {
    if (!entryForm.description || lines.some(l => !l.accountId)) return;

    const dateStr = entryForm.date.replace(/-/g, '');
    const generatedId = `${entryForm.journalType}-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;

    const journalLines: JournalEntryLine[] = lines.map(l => ({
      accountId: l.accountId,
      accountCodeId: l.accountId,
      description: l.description || entryForm.description,
      debit: Number(l.debit) || 0,
      credit: Number(l.credit) || 0
    }));

    await addJournalEntry({
      date: entryForm.date,
      journalType: entryForm.journalType,
      referenceNo: entryForm.referenceNo,
      description: entryForm.description,
      lines: journalLines,
      status: isBalanced ? 'Posted' : 'Draft',
      totalDebit,
      totalCredit,
      createdBy: 'Admin'
    });

    setIsAddModalOpen(false);
    // Reset form
    setEntryForm({
      date: new Date().toISOString().split('T')[0],
      journalType: 'JV',
      referenceNo: '',
      description: '',
      status: 'Posted'
    });
    setLines([
      { accountId: '', description: '', debit: 0, credit: 0 },
      { accountId: '', description: '', debit: 0, credit: 0 }
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-[#1A1F3D]">สมุดรายวัน (Journal Entries)</h2>
          <p className="text-sm text-gray-500">บันทึกรายการค้าและตรวจสอบรายการเดบิต/เครดิต</p>
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
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 bg-gradient-to-br from-[#18234a] to-[#020d35] text-white rounded-2xl text-sm font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={16} /> <span>ลงรายการสมุดรายวัน</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-[#F9F9F9]/50">
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
                    transition={{ delay: idx * 0.03 }}
                    key={entry.id} 
                    onClick={() => setSelectedEntry(entry)}
                    className="border-b border-gray-50 hover:bg-[#F9F9F9] transition-colors cursor-pointer group"
                  >
                    <td className="p-4 text-sm font-medium text-gray-600 whitespace-nowrap">{entry.date}</td>
                    <td className="p-4 text-sm font-bold text-blue-600 whitespace-nowrap group-hover:underline">{entry.id}</td>
                    <td className="p-4 text-sm">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg font-bold text-xs">
                        {entry.journalType}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-700 max-w-[250px] truncate">{entry.description}</td>
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
                  <td colSpan={6} className="p-12 text-center text-gray-400 text-sm">
                    ไม่มีรายการสมุดรายวัน
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Journal Entry Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-black text-[#1A1F3D]">ลงรายการสมุดรายวัน</h3>
                  <p className="text-xs text-gray-400">บันทึกรายการเดบิตและเครดิตตามหลักการบัญชีคู่</p>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">วันที่รายการ (Date)</label>
                    <input 
                      type="date"
                      value={entryForm.date}
                      onChange={(e) => setEntryForm({ ...entryForm, date: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">ประเภทสมุดรายวัน</label>
                    <select 
                      value={entryForm.journalType}
                      onChange={(e) => setEntryForm({ ...entryForm, journalType: e.target.value as JournalType })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                    >
                      {Object.entries(JOURNAL_TYPES).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">เลขที่อ้างอิง (Ref No.)</label>
                    <input 
                      type="text"
                      placeholder="เช่น INV-001"
                      value={entryForm.referenceNo}
                      onChange={(e) => setEntryForm({ ...entryForm, referenceNo: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">คำอธิบายรายการ (Description)</label>
                  <input 
                    type="text"
                    placeholder="เช่น บันทึกรายได้จากการขายสินค้าประจำวัน"
                    value={entryForm.description}
                    onChange={(e) => setEntryForm({ ...entryForm, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                  />
                </div>

                {/* Journal Entry Lines */}
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-bold text-[#1A1F3D]">ตารางเดบิต / เครดิต</h4>
                    <button 
                      type="button"
                      onClick={handleAddLine}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1"
                    >
                      <Plus size={14} /> เพิ่มแถว
                    </button>
                  </div>

                  <div className="space-y-2">
                    {lines.map((line, index) => (
                      <div key={index} className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-gray-50/70 rounded-2xl border border-gray-100">
                        <select 
                          value={line.accountId}
                          onChange={(e) => handleLineChange(index, 'accountId', e.target.value)}
                          className="flex-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">-- เลือกรหัสบัญชี --</option>
                          {accountCodes.map(acc => (
                            <option key={acc.id} value={acc.id}>
                              {acc.code} - {acc.name} ({acc.category})
                            </option>
                          ))}
                        </select>

                        <input 
                          type="text"
                          placeholder="คำอธิบายย่อย (ถ้ามี)"
                          value={line.description}
                          onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                          className="w-full sm:w-48 px-3 py-2 rounded-xl border border-gray-200 text-xs"
                        />

                        <input 
                          type="number"
                          placeholder="เดบิต (Dr.)"
                          value={line.debit || ''}
                          onChange={(e) => handleLineChange(index, 'debit', parseFloat(e.target.value) || 0)}
                          className="w-full sm:w-28 px-3 py-2 rounded-xl border border-gray-200 text-xs text-right font-bold text-blue-600"
                        />

                        <input 
                          type="number"
                          placeholder="เครดิต (Cr.)"
                          value={line.credit || ''}
                          onChange={(e) => handleLineChange(index, 'credit', parseFloat(e.target.value) || 0)}
                          className="w-full sm:w-28 px-3 py-2 rounded-xl border border-gray-200 text-xs text-right font-bold text-green-600"
                        />

                        <button 
                          type="button"
                          onClick={() => handleRemoveLine(index)}
                          disabled={lines.length <= 2}
                          className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Balance Summary Indicator */}
                  <div className="mt-4 p-4 rounded-2xl bg-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className="flex items-center gap-4 text-xs font-bold">
                      <div>เดบิตรวม: <span className="text-blue-600">฿{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                      <div>เครดิตรวม: <span className="text-green-600">฿{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                    </div>

                    <div>
                      {isBalanced ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 size={14} /> เดบิต = เครดิต (สมดุล)
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex items-center gap-1">
                          <FileText size={14} /> ยอดไม่สมดุล (บันทึกเป็น Draft)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl text-gray-500 hover:bg-gray-200 font-bold text-sm transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={!entryForm.description || lines.some(l => !l.accountId)}
                  className="px-6 py-2.5 rounded-xl bg-[#1A1F3D] text-white font-bold text-sm hover:bg-[#2A3158] transition-colors disabled:opacity-50"
                >
                  บันทึกสมุดรายวัน
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Entry Detail View Modal */}
      <AnimatePresence>
        {selectedEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-black text-[#1A1F3D]">รายละเอียดรายการสมุดรายวัน</h3>
                  <p className="text-xs text-gray-400">เลขที่: {selectedEntry.id}</p>
                </div>
                <button onClick={() => setSelectedEntry(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-2xl text-xs">
                  <div>
                    <span className="text-gray-400 block font-bold">วันที่</span>
                    <span className="font-bold text-gray-800">{selectedEntry.date}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-bold">ประเภท</span>
                    <span className="font-bold text-blue-600">{selectedEntry.journalType}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-bold">อ้างอิง</span>
                    <span className="font-bold text-gray-800">{selectedEntry.referenceNo || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-bold">สถานะ</span>
                    <span className={`font-bold ${selectedEntry.status === 'Posted' ? 'text-green-600' : 'text-amber-600'}`}>
                      {selectedEntry.status}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-gray-400 font-bold block mb-1">คำอธิบายรายการ</span>
                  <p className="text-sm font-medium text-gray-800 bg-gray-50 p-3 rounded-xl">{selectedEntry.description}</p>
                </div>

                <div>
                  <span className="text-xs text-gray-400 font-bold block mb-2">รายการเดบิต / เครดิต</span>
                  <div className="border border-gray-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-gray-100/70 border-b border-gray-100">
                          <th className="p-3 font-bold text-gray-500">บัญชี</th>
                          <th className="p-3 font-bold text-gray-500">คำอธิบาย</th>
                          <th className="p-3 font-bold text-gray-500 text-right">เดบิต (Dr.)</th>
                          <th className="p-3 font-bold text-gray-500 text-right">เครดิต (Cr.)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedEntry.lines || []).map((line: any, idx: number) => {
                          const acc = accountCodes.find(a => a.id === line.accountId || a.id === line.accountCodeId);
                          return (
                            <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="p-3 font-bold text-gray-800">
                                {acc ? `${acc.code} - ${acc.name}` : line.accountId || '-'}
                              </td>
                              <td className="p-3 text-gray-600">{line.description || '-'}</td>
                              <td className="p-3 text-right font-bold text-blue-600">
                                {Number(line.debit) > 0 ? Number(line.debit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                              </td>
                              <td className="p-3 text-right font-bold text-green-600">
                                {Number(line.credit) > 0 ? Number(line.credit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex justify-end bg-gray-50/50">
                <button 
                  onClick={() => setSelectedEntry(null)}
                  className="px-6 py-2.5 rounded-xl bg-[#1A1F3D] text-white font-bold text-sm hover:bg-[#2A3158] transition-colors"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JournalEntries;
