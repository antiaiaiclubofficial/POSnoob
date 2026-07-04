"use client";

import React, { useState } from 'react';
import { BookOpen, FileText, ClipboardList, BarChart3, Calculator, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// We will create these components next
import ChartOfAccounts from '@/components/accounting/ChartOfAccounts';
import JournalEntries from '@/components/accounting/JournalEntries';
import GeneralLedger from '@/components/accounting/GeneralLedger';
import FinancialReports from '@/components/accounting/FinancialReports';
import TaxManagement from '@/components/accounting/TaxManagement';
import BillingSystem from '@/components/accounting/BillingSystem';

type AccountingTab = 'chart' | 'journal' | 'ledger' | 'reports' | 'tax' | 'billing';

const Accounting = () => {
  const [activeTab, setActiveTab] = useState<AccountingTab>('chart');

  const menuItems = [
    { id: 'chart', label: 'ผังบัญชี', icon: BookOpen },
    { id: 'journal', label: 'สมุดรายวัน', icon: FileText },
    { id: 'ledger', label: 'บัญชีแยกประเภท', icon: ClipboardList },
    { id: 'reports', label: 'งบการเงิน', icon: BarChart3 },
    { id: 'tax', label: 'จัดการภาษี', icon: Receipt },
    { id: 'billing', label: 'เอกสารรับ/จ่าย', icon: FileText },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#F9F9F9] overflow-hidden">
      {/* Header & Navigation */}
      <header className="px-10 py-8 bg-white/70 backdrop-blur-xl border-b border-gray-100/50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pl-20 lg:pl-10 shrink-0 z-10 sticky top-0 transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <Calculator size={20} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#1A1F3D] mb-1">
              ระบบบัญชี (Accounting)
            </h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
              Financial Management & Bookkeeping
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex bg-[#F3F3F3]/80 p-1.5 rounded-[28px] border border-white shadow-sm gap-1 overflow-x-auto scrollbar-hide w-full lg:w-auto backdrop-blur-md"
        >
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as AccountingTab)}
              className={cn(
                "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap",
                activeTab === item.id
                  ? "bg-[#1A1F3D] text-white shadow-xl shadow-[#1A1F3D]/20"
                  : "text-gray-400 hover:bg-white/80 hover:text-[#1A1F3D]"
              )}
            >
              <item.icon size={16} /> {item.label}
            </button>
          ))}
        </motion.div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-6 lg:p-10 relative">
        {/* Ambient Liquid Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-purple-50/40 pointer-events-none" />

        <div className="relative z-10 h-full w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-full"
            >
              {activeTab === 'chart' && <ChartOfAccounts />}
              {activeTab === 'journal' && <JournalEntries />}
              {activeTab === 'ledger' && <GeneralLedger />}
              {activeTab === 'reports' && <FinancialReports />}
              {activeTab === 'tax' && <TaxManagement />}
              {activeTab === 'billing' && <BillingSystem />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Accounting;
