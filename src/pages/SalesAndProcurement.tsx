"use client";

import React, { useState } from 'react';
import { ShoppingCart, FileText, Briefcase, TrendingUp, ArrowLeft, ChevronRight, ClipboardCheck } from 'lucide-react';
import QuotationSystem from '@/components/QuotationSystem';
import SOSystem from '@/components/SOSystem';
import PRSystem from '@/components/PRSystem';
import POSystem from '@/components/POSystem';
import GRSystem from '@/components/GRSystem';
import SalesDashboard from '@/components/SalesDashboard';
import ProcurementDashboard from '@/components/ProcurementDashboard';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

type Department = 'none' | 'sales' | 'procurement';
type SalesTab = 'dashboard' | 'quotation' | 'so';
type ProcurementTab = 'dashboard' | 'pr' | 'po' | 'gr';

const SalesAndProcurement = () => {
  const [department, setDepartment] = useState<Department>('none');
  const [salesTab, setSalesTab] = useState<SalesTab>('dashboard');
  const [procTab, setProcTab] = useState<ProcurementTab>('dashboard');

  const [salesAction, setSalesAction] = useState<'list' | 'create'>('list');
  const [procAction, setProcAction] = useState<'list' | 'create'>('list');

  const location = useLocation();

  React.useEffect(() => {
    if (location.state?.action === 'pr') {
      setDepartment('procurement');
      setProcTab('pr');
      setProcAction('create');
    }
  }, [location.state]);

  const salesMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'quotation', label: 'Quotation', icon: FileText },
    { id: 'so', label: 'Sales Order', icon: FileText },
  ];

  const procMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Briefcase },
    { id: 'pr', label: 'Purchase Request', icon: FileText },
    { id: 'po', label: 'Purchase Order', icon: ShoppingCart },
    { id: 'gr', label: 'Goods Receipt', icon: ClipboardCheck },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#F9F9F9] overflow-hidden">
      <header className="px-10 py-8 bg-white/70 backdrop-blur-xl border-b border-gray-100/50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pl-20 lg:pl-10 shrink-0 z-10 sticky top-0 transition-all duration-300">
        <div className="flex items-center gap-4">
          <AnimatePresence>
            {department !== 'none' && (
              <motion.button
                initial={{ opacity: 0, x: -20, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 'auto' }}
                exit={{ opacity: 0, x: -20, width: 0 }}
                onClick={() => setDepartment('none')}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors shrink-0"
              >
                <ArrowLeft size={18} />
              </motion.button>
            )}
          </AnimatePresence>
          <div>
            <h1 className="text-3xl font-black text-[#1A1F3D] mb-1">
              {department === 'none' ? 'Sales & Procurement' : department === 'sales' ? 'Sales Department' : 'Procurement Department'}
            </h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
              {department === 'none' ? 'Choose a department' : 'Financial Management System'}
            </p>
          </div>
        </div>

        {department === 'sales' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex bg-[#F3F3F3]/80 p-1.5 rounded-[28px] border border-white shadow-sm gap-1 overflow-x-auto scrollbar-hide w-full lg:w-auto backdrop-blur-md"
          >
            {salesMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSalesTab(item.id as SalesTab);
                  setSalesAction('list');
                }}
                className={cn(
                  "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap",
                  salesTab === item.id
                    ? "bg-[#1A1F3D] text-white shadow-xl shadow-[#1A1F3D]/20"
                    : "text-gray-400 hover:bg-white/80 hover:text-[#1A1F3D]"
                )}
              >
                <item.icon size={16} /> {item.label}
              </button>
            ))}
          </motion.div>
        )}

        {department === 'procurement' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex bg-[#F3F3F3]/80 p-1.5 rounded-[28px] border border-white shadow-sm gap-1 overflow-x-auto scrollbar-hide w-full lg:w-auto backdrop-blur-md"
          >
            {procMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setProcTab(item.id as ProcurementTab);
                  setProcAction('list');
                }}
                className={cn(
                  "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap",
                  procTab === item.id
                    ? "bg-[#1A1F3D] text-white shadow-xl shadow-[#1A1F3D]/20"
                    : "text-gray-400 hover:bg-white/80 hover:text-[#1A1F3D]"
                )}
              >
                <item.icon size={16} /> {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide p-6 lg:p-10 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30 pointer-events-none" />

        <div className="relative z-10 h-full">
          <AnimatePresence mode="wait">
            {department === 'none' ? (
              <motion.div
                key="landing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mt-10"
              >
                {/* Sales Card */}
                <div
                  onClick={() => setDepartment('sales')}
                  className="bg-white rounded-[40px] p-10 cursor-pointer group hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300 border border-gray-100 flex flex-col items-center text-center relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 text-blue-900 pointer-events-none select-none z-0 transform group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500">
                    <TrendingUp size={120} />
                  </div>
                  <div className="w-24 h-24 bg-blue-50 rounded-[32px] flex items-center justify-center text-blue-600 mb-8 relative z-10 group-hover:scale-110 transition-transform duration-500">
                    <TrendingUp size={48} />
                  </div>
                  <h2 className="text-3xl font-black text-[#1A1F3D] mb-4 relative z-10">Sales</h2>
                  <p className="text-gray-500 text-sm leading-relaxed mb-10 relative z-10 max-w-sm">
                    Manage outbound operations, create quotations for clients, and track sales performance.
                  </p>
                  <div className="mt-auto flex items-center gap-2 text-blue-600 font-bold text-sm bg-blue-50 px-6 py-3 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors relative z-10">
                    Enter Sales <ChevronRight size={16} />
                  </div>
                </div>

                {/* Procurement Card */}
                <div
                  onClick={() => setDepartment('procurement')}
                  className="bg-white rounded-[40px] p-10 cursor-pointer group hover:shadow-2xl hover:shadow-purple-900/5 transition-all duration-300 border border-gray-100 flex flex-col items-center text-center relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 text-purple-900 pointer-events-none select-none z-0 transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                    <Briefcase size={120} />
                  </div>
                  <div className="w-24 h-24 bg-purple-50 rounded-[32px] flex items-center justify-center text-purple-600 mb-8 relative z-10 group-hover:scale-110 transition-transform duration-500">
                    <Briefcase size={48} />
                  </div>
                  <h2 className="text-3xl font-black text-[#1A1F3D] mb-4 relative z-10">Procurement</h2>
                  <p className="text-gray-500 text-sm leading-relaxed mb-10 relative z-10 max-w-sm">
                    Manage inbound operations, purchase orders, vendor relations, and restock supplies.
                  </p>
                  <div className="mt-auto flex items-center gap-2 text-purple-600 font-bold text-sm bg-purple-50 px-6 py-3 rounded-full group-hover:bg-purple-600 group-hover:text-white transition-colors relative z-10">
                    Enter Procurement <ChevronRight size={16} />
                  </div>
                </div>
              </motion.div>
            ) : department === 'sales' ? (
              <motion.div
                key="sales"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {salesTab === 'dashboard' && (
                  <SalesDashboard
                    onCreateQuotation={() => { setSalesAction('create'); setSalesTab('quotation'); }}
                    onCreateSO={() => { setSalesAction('create'); setSalesTab('so'); }}
                  />
                )}
                {salesTab === 'quotation' && <QuotationSystem initialView={salesAction} onViewChange={setSalesAction} />}
                {salesTab === 'so' && <SOSystem initialView={salesAction} onViewChange={setSalesAction} />}
              </motion.div>
            ) : (
              <motion.div
                key="procurement"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {procTab === 'dashboard' && (
                  <ProcurementDashboard
                    onCreatePR={() => { setProcAction('create'); setProcTab('pr'); }}
                    onCreatePO={() => { setProcAction('create'); setProcTab('po'); }}
                    onCreateGR={() => { setProcAction('create'); setProcTab('gr'); }}
                  />
                )}
                {procTab === 'pr' && <PRSystem reorderItem={location.state?.reorderItem} clearReorderItem={() => window.history.replaceState({}, '')} initialView={procAction} onViewChange={setProcAction} />}
                {procTab === 'po' && <POSystem initialView={procAction} onViewChange={setProcAction} />}
                {procTab === 'gr' && <GRSystem initialView={procAction} onViewChange={setProcAction} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SalesAndProcurement;
