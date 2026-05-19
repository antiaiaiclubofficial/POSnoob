"use client";

import React from 'react';
import { X, Send, Smartphone, MessageSquare, CheckCircle2, ShieldCheck, Gem } from 'lucide-react';
import { useStore, Customer, CreditTransaction } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface CreditNotificationModalProps {
  customer: Customer;
  lastTx: CreditTransaction;
  onClose: () => void;
}

const CreditNotificationModal = ({ customer, lastTx, onClose }: CreditNotificationModalProps) => {
  const { currency, shopName } = useStore();

  const handleSend = () => {
    toast.success(`LINE Flex Message sent to ${customer.name} successfully!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[250] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-4xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Left Side: Detail */}
        <div className="flex-1 p-10 space-y-8 overflow-y-auto scrollbar-hide">
          <div>
            <h2 className="text-3xl font-black text-[#1A1F3D]">LINE Credit Alert</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Flex Message Notification</p>
          </div>

          <div className="space-y-6">
             <div className="bg-[#F5F6FA] p-6 rounded-[32px] space-y-4">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Transaction Detail</p>
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-1">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Customer</p>
                      <p className="text-sm font-black text-[#1A1F3D]">{customer.name}</p>
                   </div>
                   <div className="space-y-1 text-right">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Date</p>
                      <p className="text-sm font-black text-[#1A1F3D]">{format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Balance Before</p>
                      <p className="text-sm font-bold text-gray-500">{lastTx.previousBalance.toLocaleString()}</p>
                   </div>
                   <div className="space-y-1 text-right">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Used/Added Today</p>
                      <p className={cn("text-sm font-black", lastTx.type === 'Top-up' ? "text-green-600" : "text-red-500")}>
                        {lastTx.type === 'Top-up' ? '+' : '-'}{lastTx.amount.toLocaleString()}
                      </p>
                   </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                   <div className="flex justify-between items-center">
                      <p className="text-xs font-black text-[#1A1F3D] uppercase">Remaining Credits</p>
                      <p className="text-2xl font-black text-purple-600">{lastTx.remainingBalance.toLocaleString()}</p>
                   </div>
                </div>
             </div>
          </div>

          <button 
            onClick={handleSend}
            className="w-full bg-[#1A1F3D] text-white font-black py-5 rounded-[28px] flex items-center justify-center gap-3 shadow-xl shadow-[#1A1F3D]/10 active:scale-95 transition-all"
          >
            <Send size={18} /> Confirm & Send via LINE
          </button>
        </div>

        {/* Right Side: Visual Preview */}
        <div className="w-full md:w-[380px] bg-[#F8F9FD] p-10 flex flex-col items-center justify-center border-l border-gray-100 relative">
          <button onClick={onClose} className="absolute top-10 right-10 p-3 hover:bg-white rounded-2xl transition-all shadow-sm"><X size={20} className="text-gray-400"/></button>
          
          <div className="w-full max-w-[280px] space-y-6">
            <div className="text-center">
              <Smartphone className="mx-auto text-[#1A1F3D] mb-2" size={32} />
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Flex Message Preview</p>
            </div>

            {/* Simulated LINE Message Bubble */}
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
               {/* Flex Header */}
               <div className="bg-[#1A1F3D] p-5">
                  <div className="flex justify-between items-center">
                     <Gem size={20} className="text-[#D9ED5F]" />
                     <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Credit Update</span>
                  </div>
                  <h4 className="text-xl font-black text-white mt-4">{shopName}</h4>
                  <p className="text-[10px] font-bold text-white/60">Thank you for your visit!</p>
               </div>
               
               {/* Flex Body */}
               <div className="p-6 space-y-4">
                  <div className="flex justify-between">
                     <span className="text-[10px] font-bold text-gray-400">CREDIT BALANCE</span>
                     <span className="text-sm font-black text-purple-600">{lastTx.remainingBalance.toLocaleString()} pts</span>
                  </div>
                  
                  <div className="space-y-2 pt-4 border-t border-gray-100">
                     <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-gray-400">Previous</span>
                        <span className="text-gray-600">{lastTx.previousBalance.toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-gray-400">{lastTx.type === 'Usage' ? 'Used Today' : 'Topped Up'}</span>
                        <span className={lastTx.type === 'Usage' ? 'text-red-500' : 'text-green-600'}>
                          {lastTx.type === 'Usage' ? '-' : '+'}{lastTx.amount.toLocaleString()}
                        </span>
                     </div>
                  </div>
                  
                  <div className="mt-6 pt-4 bg-[#D9ED5F]/10 border border-[#D9ED5F]/20 rounded-xl p-3 flex items-center gap-2">
                     <CheckCircle2 size={12} className="text-[#1A1F3D]" />
                     <span className="text-[8px] font-black text-[#1A1F3D] uppercase">Verified Transaction</span>
                  </div>
               </div>
               
               {/* Flex Footer */}
               <div className="bg-gray-50 px-6 py-4 flex justify-center">
                  <button className="text-[9px] font-black text-blue-500 uppercase tracking-widest">View Member Profile</button>
               </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-[9px] text-gray-400 font-bold uppercase">
              <ShieldCheck size={12} className="text-green-500" />
              Secure Data Delivery
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditNotificationModal;