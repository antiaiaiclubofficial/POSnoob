import React, { useState } from 'react';
import { useStore, AccountCode, AccountCategory } from '@/store/useStore';
import { Plus, Edit2, Search, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES: { id: AccountCategory, label: string, color: string }[] = [
  { id: 'Assets', label: 'สินทรัพย์ (Assets)', color: 'bg-blue-50 text-blue-600' },
  { id: 'Liabilities', label: 'หนี้สิน (Liabilities)', color: 'bg-red-50 text-red-600' },
  { id: 'Equity', label: 'ทุน (Equity)', color: 'bg-purple-50 text-purple-600' },
  { id: 'Revenue', label: 'รายได้ (Revenue)', color: 'bg-green-50 text-green-600' },
  { id: 'Expenses', label: 'ค่าใช้จ่าย (Expenses)', color: 'bg-orange-50 text-orange-600' }
];

const ChartOfAccounts = () => {
  const { accountCodes, addAccountCode, deleteAccountCode } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [codeToDelete, setCodeToDelete] = useState<string | null>(null);
  const [newCode, setNewCode] = useState({ code: '', name: '', category: 'Assets' as AccountCategory, description: '', isActive: true });

  const filteredCodes = accountCodes.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.code.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-[#1A1F3D]">ผังบัญชี (Chart of Accounts)</h2>
          <p className="text-sm text-gray-500">จัดการรหัสบัญชีมาตรฐาน 5 หมวด</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              placeholder="ค้นหารหัส หรือ ชื่อบัญชี..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl border-none bg-white shadow-sm focus:ring-2 focus:ring-[#1A1F3D]/20 text-sm"
            />
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 bg-gradient-to-br from-[#18234a] to-[#020d35] text-white rounded-2xl text-sm font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <Plus size={16} /> <span className="hidden sm:inline">เพิ่มรหัสบัญชี</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {CATEGORIES.map(category => {
          const categoryCodes = filteredCodes.filter(c => c.category === category.id).sort((a, b) => a.code.localeCompare(b.code));
          
          return (
            <motion.div 
              key={category.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100/50"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${category.color}`}>
                  {category.label}
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-gray-100 to-transparent"></div>
              </div>

              {categoryCodes.length > 0 ? (
                <div className="space-y-2">
                  {categoryCodes.map(code => (
                    <div key={code.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#F9F9F9] transition-colors group cursor-pointer">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-[#1A1F3D] bg-gray-100 px-2 py-1 rounded-lg">{code.code}</span>
                        <span className="text-sm font-medium text-gray-700">{code.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${code.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        <button className="text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => {
                            setCodeToDelete(code.id);
                            setIsDeleteModalOpen(true);
                          }}
                          className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
                  ไม่มีข้อมูลรหัสบัญชีในหมวดนี้
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Add Account Modal */}
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
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-xl font-black text-[#1A1F3D]">เพิ่มรหัสบัญชี</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">หมวดบัญชี (Category)</label>
                  <select 
                    value={newCode.category}
                    onChange={(e) => setNewCode({ ...newCode, category: e.target.value as AccountCategory })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  >
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">รหัสบัญชี (Account Code)</label>
                  <input 
                    type="text" 
                    value={newCode.code}
                    onChange={(e) => setNewCode({ ...newCode, code: e.target.value })}
                    placeholder="เช่น 1101"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">ชื่อบัญชี (Account Name)</label>
                  <input 
                    type="text" 
                    value={newCode.name}
                    onChange={(e) => setNewCode({ ...newCode, name: e.target.value })}
                    placeholder="เช่น เงินสด (Cash)"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">คำอธิบายเพิ่มเติม (Optional)</label>
                  <input 
                    type="text" 
                    value={newCode.description}
                    onChange={(e) => setNewCode({ ...newCode, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input 
                    type="checkbox" 
                    id="isActive"
                    checked={newCode.isActive}
                    onChange={(e) => setNewCode({ ...newCode, isActive: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">เปิดใช้งาน (Active)</label>
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
                  onClick={() => {
                    if (!newCode.code || !newCode.name) return;
                    addAccountCode({
                      id: '',
                      code: newCode.code,
                      name: newCode.name,
                      category: newCode.category,
                      description: newCode.description,
                      isActive: newCode.isActive
                    });
                    setIsAddModalOpen(false);
                    setNewCode({ code: '', name: '', category: 'Assets', description: '', isActive: true });
                  }}
                  disabled={!newCode.code || !newCode.name}
                  className="px-6 py-2.5 rounded-xl bg-[#1A1F3D] text-white font-bold text-sm hover:bg-[#2A3158] transition-colors disabled:opacity-50"
                >
                  บันทึกรหัสบัญชี
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
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
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-xl font-black text-red-600">ยืนยันการลบ</h3>
                <button 
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setCodeToDelete(null);
                  }} 
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 text-center">
                  คุณแน่ใจหรือไม่ว่าต้องการลบรหัสบัญชีนี้? การกระทำนี้ไม่สามารถย้อนกลับได้
                </p>
              </div>
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                <button 
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setCodeToDelete(null);
                  }}
                  className="px-6 py-2.5 rounded-xl text-gray-500 hover:bg-gray-200 font-bold text-sm transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  onClick={() => {
                    if (codeToDelete) {
                      deleteAccountCode(codeToDelete);
                    }
                    setIsDeleteModalOpen(false);
                    setCodeToDelete(null);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors"
                >
                  ลบข้อมูล
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChartOfAccounts;
