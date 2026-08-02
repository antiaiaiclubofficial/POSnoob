"use client";

import React, { useState } from 'react';
import { X, Package, Wallet } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from 'framer-motion';
import PackageModal from './PackageModal';
import CreditPackageModal from './CreditPackageModal';

interface PackagesAndCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PackagesAndCreditsModal({ isOpen, onClose }: PackagesAndCreditsModalProps) {
  const [activeTab, setActiveTab] = useState('bundles');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[150] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#F8F9FD] w-full max-w-4xl h-[85vh] rounded-[48px] shadow-2xl flex flex-col overflow-hidden"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col overflow-hidden">
            <div className="px-8 py-6 flex items-center bg-white border-b border-gray-100 shrink-0 gap-6">
              <div>
                <h2 className="text-xl font-black text-[#1A1F3D]">จัดการแพ็กเกจและเครดิต</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Manage Package Bundles & Credits</p>
              </div>

              <TabsList className="bg-gray-50/80 p-1 rounded-2xl border border-gray-100 shadow-sm flex gap-1 h-auto shrink-0 ml-auto mr-4">
                <TabsTrigger value="bundles" className="px-5 py-2 rounded-xl data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white text-[11px] font-bold transition-all">
                  <Package size={14} className="mr-2" /> แพ็กเกจบริการ (Bundles)
                </TabsTrigger>
                <TabsTrigger value="credits" className="px-5 py-2 rounded-xl data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white text-[11px] font-bold transition-all">
                  <Wallet size={14} className="mr-2" /> แพ็กเกจเครดิต (Credits)
                </TabsTrigger>
              </TabsList>

              <button onClick={onClose} className="w-10 h-10 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-2xl flex items-center justify-center transition-all shrink-0">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-hidden p-6 flex flex-col">
              <TabsContent value="bundles" className="m-0 flex-1 overflow-hidden rounded-[32px] bg-white border border-gray-100 shadow-sm p-4">
                 <PackageModal onClose={() => {}} embedded={true} />
              </TabsContent>

              <TabsContent value="credits" className="m-0 flex-1 overflow-hidden rounded-[32px] bg-white border border-gray-100 shadow-sm p-4">
                 <CreditPackageModal onClose={() => {}} embedded={true} />
              </TabsContent>
            </div>
          </Tabs>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
