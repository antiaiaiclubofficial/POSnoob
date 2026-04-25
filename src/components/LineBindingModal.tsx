"use client";

import React, { useState, useEffect } from 'react';
import { X, MessageSquare, QrCode, CheckCircle2, Copy, ShieldCheck } from 'lucide-react';
import { useStore, Customer } from '@/store/useStore';
import { toast } from 'sonner';

interface LineBindingModalProps {
  customer: Customer;
  onClose: () => void;
}

const LineBindingModal = ({ customer, onClose }: LineBindingModalProps) => {
  const { shopName, bindLineToCustomer } = useStore();
  const [bindingToken, setBindingToken] = useState('');
  
  useEffect(() => {
    // จำลองการสร้าง Token สำหรับ Binding
    setBindingToken(`BIND_${customer.id}_${Math.random().toString(36).substr(2, 9)}`);
  }, [customer.id]);

  const bindingUrl = `https://line.me/R/oaMessage/${bindingToken}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(bindingUrl);
    toast.success("Binding link copied to clipboard");
  };

  const simulateSuccess = () => {
    // จำลองเมื่อลูกค้าสแกนและกดปุ่มยืนยันจากทาง LINE
    bindLineToCustomer(customer.id, `U${Math.random().toString(16).substr(2, 32)}`);
    toast.success(`${customer.name} connected to LINE successfully!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-10 border-b border-gray-50 flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <MessageSquare size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1A1F3D]">LINE Connect</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Connect CRM to LINE Profile</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl transition-all">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-10 space-y-8 text-center">
          <div className="space-y-2">
            <h4 className="text-sm font-black text-[#1A1F3D]">Scan to Link Profile</h4>
            <p className="text-xs text-gray-400 font-medium leading-relaxed">
              Ask {customer.name} to scan this QR with their LINE app to receive notifications and check points.
            </p>
          </div>

          <div className="relative group mx-auto w-fit">
            <div className="p-6 bg-white border-2 border-green-100 rounded-[40px] shadow-xl shadow-green-500/5 group-hover:scale-105 transition-transform">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(bindingUrl)}`} 
                className="w-48 h-48"
                alt="LINE Binding QR"
              />
            </div>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
              Individual Link
            </div>
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleCopyLink}
              className="w-full py-4 rounded-2xl bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-100 transition-all"
            >
              <Copy size={14} /> Copy Direct Link
            </button>

            <div className="pt-6 border-t border-gray-50">
              <button 
                onClick={simulateSuccess}
                className="text-[10px] font-black text-gray-300 uppercase tracking-widest hover:text-green-500 transition-colors"
              >
                (Simulate Customer Click)
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-[9px] text-gray-400 font-bold uppercase">
            <ShieldCheck size={12} className="text-green-500" />
            SECURE BINDING VIA {shopName}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LineBindingModal;