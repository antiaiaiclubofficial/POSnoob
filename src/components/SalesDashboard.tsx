import React from 'react';
import { useStore } from '@/store/useStore';
import { FileText, TrendingUp, Plus, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface SalesDashboardProps {
  onCreateQuotation: () => void;
  onCreateSO: () => void;
}

const SalesDashboard: React.FC<SalesDashboardProps> = ({ onCreateQuotation, onCreateSO }) => {
  const { quotations, salesOrders } = useStore();

  const totalQuotations = quotations.length;
  const pendingQuotations = quotations.filter(q => q.status === 'Pending').length;
  const completedQuotations = quotations.filter(q => q.status === 'Completed').length;

  const totalSO = salesOrders.length;
  const pendingSO = salesOrders.filter(so => so.status === 'Pending').length;
  const completedSO = salesOrders.filter(so => so.status === 'Completed').length;

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-500 pb-10">

      {/* Welcome & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Create Quotation Card */}
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white rounded-[3rem] p-10 shadow-[0_20px_40px_rgba(24,35,74,0.04)] relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 text-[#18234a] pointer-events-none select-none z-0 transform translate-x-4 -translate-y-4">
            <FileText size={160} />
          </div>

          <div className="relative z-10 mb-8">
            <div className="w-16 h-16 bg-[#18234a]/5 rounded-[2rem] flex items-center justify-center text-[#18234a] mb-6">
              <FileText size={32} />
            </div>
            <h2 className="text-3xl font-black text-[#1A1F3D] mb-2" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>New Quotation</h2>
            <p className="text-gray-500 font-medium max-w-xs leading-relaxed">Create a new price quote for a potential client. Details will be saved in the system.</p>
          </div>

          <button
            onClick={onCreateQuotation}
            className="relative z-10 bg-gradient-to-br from-[#18234a] to-[#020d35] text-white px-8 py-5 rounded-[3rem] font-black text-sm flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)] hover:shadow-[0_20px_40px_rgba(24,35,74,0.2)]"
          >
            <Plus size={20} /> Create Quotation
          </button>
        </motion.div>

        {/* Create SO Card */}
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white rounded-[3rem] p-10 shadow-[0_20px_40px_rgba(234,253,105,0.15)] relative overflow-hidden flex flex-col justify-between border-2 border-transparent hover:border-[#EAFD69]/30 transition-all"
        >
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-black pointer-events-none select-none z-0 transform translate-x-4 -translate-y-4">
            <TrendingUp size={160} />
          </div>

          <div className="relative z-10 mb-8">
            <div className="w-16 h-16 bg-[#EAFD69]/30 rounded-[2rem] flex items-center justify-center text-[#1A1F3D] mb-6">
              <TrendingUp size={32} />
            </div>
            <h2 className="text-3xl font-black text-[#1A1F3D] mb-2" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>New Sales Order</h2>
            <p className="text-gray-500 font-medium max-w-xs leading-relaxed">Confirm a sale and generate an order. Link items directly from inventory.</p>
          </div>

          <button
            onClick={onCreateSO}
            className="relative z-10 bg-[#EAFD69] text-[#1A1F3D] px-8 py-5 rounded-[3rem] font-black text-sm flex items-center justify-center gap-2 hover:bg-[#dff349] transition-all shadow-sm hover:shadow-[0_20px_40px_rgba(234,253,105,0.3)]"
          >
            <Plus size={20} /> Create Sales Order
          </button>
        </motion.div>
      </div>

      {/* Stats Section */}
      <h3 className="text-xl font-black text-[#1A1F3D] mt-10 mb-4 px-2" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Quotation Stats */}
        <div className="bg-[#f3f3f3] rounded-[2rem] p-8 shadow-inner">
          <div className="flex items-center gap-3 mb-6">
            <FileText size={24} className="text-[#1A1F3D]" />
            <h4 className="text-lg font-black text-[#1A1F3D]">Quotations Overview</h4>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-[2rem] p-6 shadow-sm flex flex-col items-center justify-center">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Total</p>
              <p className="text-3xl font-black text-[#1A1F3D]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{totalQuotations}</p>
            </div>
            <div className="bg-white rounded-[2rem] p-6 shadow-sm flex flex-col items-center justify-center text-orange-500">
              <p className="text-xs text-orange-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1"><Clock size={12} /> Pending</p>
              <p className="text-3xl font-black" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{pendingQuotations}</p>
            </div>
            <div className="bg-white rounded-[2rem] p-6 shadow-sm flex flex-col items-center justify-center text-green-500">
              <p className="text-xs text-green-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1"><CheckCircle size={12} /> Done</p>
              <p className="text-3xl font-black" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{completedQuotations}</p>
            </div>
          </div>
        </div>

        {/* SO Stats */}
        <div className="bg-[#f3f3f3] rounded-[2rem] p-8 shadow-inner">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp size={24} className="text-[#1A1F3D]" />
            <h4 className="text-lg font-black text-[#1A1F3D]">Sales Orders Overview</h4>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-[2rem] p-6 shadow-sm flex flex-col items-center justify-center">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Total</p>
              <p className="text-3xl font-black text-[#1A1F3D]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{totalSO}</p>
            </div>
            <div className="bg-white rounded-[2rem] p-6 shadow-sm flex flex-col items-center justify-center text-orange-500">
              <p className="text-xs text-orange-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1"><Clock size={12} /> Pending</p>
              <p className="text-3xl font-black" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{pendingSO}</p>
            </div>
            <div className="bg-white rounded-[2rem] p-6 shadow-sm flex flex-col items-center justify-center text-green-500">
              <p className="text-xs text-green-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1"><CheckCircle size={12} /> Done</p>
              <p className="text-3xl font-black" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{completedSO}</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default SalesDashboard;
