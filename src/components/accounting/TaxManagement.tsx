import React, { useState } from 'react';
import { useStore, TaxType } from '@/store/useStore';
import { Search, Filter, Receipt, FileCheck, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const TAX_TYPES: Record<TaxType, string> = {
  Input: 'ภาษีซื้อ (Input Tax)',
  Output: 'ภาษีขาย (Output Tax)',
  Withholding: 'ภาษีหัก ณ ที่จ่าย (Withholding Tax)',
};

const TaxManagement = () => {
  const { taxRecords } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<TaxType | 'ALL'>('ALL');

  const filteredRecords = taxRecords.filter(r => {
    const matchesSearch = r.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.taxId.includes(searchTerm);
    const matchesType = selectedType === 'ALL' || r.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-[#1A1F3D]">จัดการภาษี (Tax Management)</h2>
          <p className="text-sm text-gray-500">บันทึกและออกรายงานภาษีซื้อ ภาษีขาย ภาษีหัก ณ ที่จ่าย</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <select 
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="px-4 py-2.5 rounded-2xl border-none bg-white shadow-sm focus:ring-2 focus:ring-[#1A1F3D]/20 text-sm font-medium text-gray-700 outline-none"
          >
            <option value="ALL">ทุกประเภทภาษี</option>
            {Object.entries(TAX_TYPES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <div className="relative flex-1 md:w-64 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              placeholder="ค้นหาชื่อ, เลขที่เอกสาร, เลขผู้เสียภาษี..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl border-none bg-white shadow-sm focus:ring-2 focus:ring-[#1A1F3D]/20 text-sm"
            />
          </div>
          <button className="px-5 py-2.5 bg-white text-gray-700 rounded-2xl text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2">
            <Filter size={16} /> ตัวกรองเดือน/ปี
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-[#F9F9F9]/50">
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center whitespace-nowrap">วันที่</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center whitespace-nowrap">ประเภท</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center whitespace-nowrap">เลขที่อ้างอิง</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center whitespace-nowrap">คู่ค้า/ลูกค้า</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center whitespace-nowrap">มูลค่าฐาน (THB)</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center whitespace-nowrap">ยอดภาษี (THB)</th>
                <th className="p-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center whitespace-nowrap">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={record.id} 
                    className="border-b border-gray-50 hover:bg-[#F9F9F9] transition-colors cursor-pointer group"
                  >
                    <td className="p-4 text-sm font-medium text-gray-600 text-center whitespace-nowrap">{record.date}</td>
                    <td className="p-4 text-sm text-center whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-lg font-bold text-xs ${
                        record.type === 'Input' ? 'bg-blue-50 text-blue-600' :
                        record.type === 'Output' ? 'bg-green-50 text-green-600' :
                        'bg-purple-50 text-purple-600'
                      }`}>
                        {TAX_TYPES[record.type]}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-bold text-[#1A1F3D] text-center whitespace-nowrap">{record.referenceNo}</td>
                    <td className="p-4 text-sm text-gray-600 text-center whitespace-nowrap">
                      <div>{record.partnerName}</div>
                      <div className="text-xs text-gray-400">เลขผู้เสียภาษี: {record.taxId}</div>
                    </td>
                    <td className="p-4 text-sm text-gray-700 text-center whitespace-nowrap">
                      {record.baseAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-sm font-bold text-[#1A1F3D] text-center whitespace-nowrap">
                      {record.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      <div className="text-xs font-normal text-gray-400">({record.taxRate}%)</div>
                    </td>
                    <td className="p-4 text-center whitespace-nowrap">
                      {record.status === 'Filed' ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-600 text-xs font-bold">
                          <FileCheck size={12} /> ยื่นแล้ว
                        </div>
                      ) : record.status === 'Pending' ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-bold">
                          <Receipt size={12} /> รอยื่นแบบ
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold">
                          <XCircle size={12} /> ยกเลิก
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-16 text-center text-gray-400 text-sm">
                    <div className="flex flex-col items-center justify-center">
                      <Receipt size={32} className="text-gray-200 mb-4" />
                      <p>ไม่มีรายการภาษีที่ค้นหา</p>
                    </div>
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

export default TaxManagement;
