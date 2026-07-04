import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { BarChart3, TrendingUp, TrendingDown, Scale, Download } from 'lucide-react';
import { motion } from 'framer-motion';

const FinancialReports = () => {
  const { journalEntries, accountCodes } = useStore();
  const [reportType, setReportType] = useState<'TRIAL' | 'PL' | 'BALANCE'>('TRIAL');

  // Logic for calculations would typically go here based on posted journalEntries
  // For UI demonstration, we'll assume calculated totals
  
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
          <h3 className="text-3xl font-black text-white">฿0.00</h3>
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute right-0 top-0 opacity-5 transform translate-x-1/4 -translate-y-1/4 text-red-500 group-hover:scale-110 transition-transform duration-500">
            <TrendingDown size={120} />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-6">
            <TrendingDown size={24} className="text-red-500" />
          </div>
          <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">ค่าใช้จ่ายรวม (Total Expenses)</p>
          <h3 className="text-3xl font-black text-[#1A1F3D]">฿0.00</h3>
        </div>

        <div className="bg-[#EAFD69] rounded-[2rem] p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 opacity-20 transform translate-x-1/4 -translate-y-1/4 text-[#1A1F3D] group-hover:scale-110 transition-transform duration-500">
            <Scale size={120} />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#1A1F3D]/10 flex items-center justify-center mb-6">
            <Scale size={24} className="text-[#1A1F3D]" />
          </div>
          <p className="text-[#1A1F3D]/60 text-sm font-bold uppercase tracking-widest mb-1">กำไรสุทธิ (Net Profit)</p>
          <h3 className="text-3xl font-black text-[#1A1F3D]">฿0.00</h3>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100/50 p-8 min-h-[400px] flex flex-col items-center justify-center">
        <BarChart3 size={48} className="text-gray-200 mb-4" />
        <h3 className="text-lg font-bold text-gray-400 mb-2">ยังไม่มีข้อมูลเพียงพอสำหรับแสดงงบ</h3>
        <p className="text-sm text-gray-400 max-w-md text-center mb-6">
          โปรดบันทึกรายการบัญชีในสมุดรายวัน และทำการ Post รายการ เพื่อให้ระบบคำนวณงบการเงินอัตโนมัติ
        </p>
        <button className="px-6 py-3 bg-gray-50 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-100 transition-colors flex items-center gap-2" disabled>
          <Download size={16} /> ส่งออกเป็น PDF
        </button>
      </div>
    </div>
  );
};

export default FinancialReports;
