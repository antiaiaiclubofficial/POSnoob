"use client";

import React from 'react';
import { Printer, Scissors, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ReceiptPreviewProps {
  shopName: string;
  shopLogo: string | null;
  shopAddress: string;
  shopPhone: string;
  header: string;
  footer: string;
  paperSize: '58mm' | '80mm';
  isInline?: boolean; // เพิ่ม prop สำหรับแสดงผลในหน้าจอปกติ
}

const ReceiptPreview = ({ 
  shopName, shopLogo, shopAddress, shopPhone, 
  header, footer, paperSize, isInline = false
}: ReceiptPreviewProps) => {
  
  const is80mm = paperSize === '80mm';
  const electronicReceiptUrl = `https://e-receipt.tactilesanctuary.com/view/INV-2024-001`;

  const receiptContent = (
    <div 
      className={cn(
        "bg-white shadow-2xl h-fit p-6 sm:p-8 flex flex-col font-mono text-[#1A1F3D] transition-all duration-500 mx-auto",
        is80mm ? "w-full max-w-[380px]" : "w-full max-w-[280px]",
        isInline ? "border border-gray-100 rounded-[32px]" : ""
      )}
      style={{ fontSize: is80mm ? '13px' : '11px' }}
    >
      {/* Header Area */}
      <div className="text-center space-y-2 mb-6">
        {shopLogo && (
          <img src={shopLogo} alt="Logo" className="w-16 h-16 mx-auto rounded-xl object-cover mb-4 shadow-sm" />
        )}
        <h4 className="font-bold text-base uppercase leading-tight">{shopName || 'Shop Name'}</h4>
        <p className="opacity-60 text-[9px] leading-relaxed max-w-[200px] mx-auto">{shopAddress || 'Address details...'}</p>
        <p className="opacity-60 text-[10px]">Tel: {shopPhone || 'Phone number'}</p>
        
        <div className="border-t border-dashed border-gray-300 my-4" />
        <p className="font-bold uppercase tracking-widest leading-relaxed">
          {header || 'Tax Invoice / Receipt'}
        </p>
      </div>

      {/* Meta Info */}
      <div className="space-y-1 mb-6 opacity-80 text-[10px]">
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{format(new Date(), 'dd/MM/yyyy HH:mm')}</span>
        </div>
        <div className="flex justify-between">
          <span>Receipt:</span>
          <span>#INV-2024-001</span>
        </div>
        <div className="flex justify-between">
          <span>Staff:</span>
          <span>Admin User</span>
        </div>
      </div>

      <div className="border-t border-dashed border-gray-300 my-4" />

      {/* Items Table */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between font-bold">
          <span>Item</span>
          <span>Total</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span>Full Grooming (Large)</span>
              <span className="text-[9px] opacity-60">Pet: Buddy (Golden Retriever)</span>
            </div>
            <span>1,200.00</span>
          </div>
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span>Pet Shampoo (Sensitive)</span>
              <span className="text-[9px] opacity-60">Retail Item</span>
            </div>
            <span>350.00</span>
          </div>
        </div>
      </div>

      <div className="border-t border-dashed border-gray-300 my-4" />

      {/* Calculations */}
      <div className="space-y-1.5 mb-8">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>1,550.00</span>
        </div>
        <div className="flex justify-between text-red-500">
          <span>Discount (10%)</span>
          <span>-155.00</span>
        </div>
        <div className="flex justify-between font-bold text-base pt-2">
          <span>TOTAL</span>
          <span>1,492.65</span>
        </div>
      </div>

      <div className="border-t border-dashed border-gray-300 my-4" />

      {/* Footer & E-Receipt QR */}
      <div className="text-center space-y-4 pt-2">
        <p className="whitespace-pre-wrap leading-relaxed opacity-80">{footer || 'Thank you for your visit!'}</p>
        
        <div className="py-4 flex flex-col items-center gap-3">
          <div className="p-2 bg-white border border-gray-100 rounded-xl shadow-sm">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(electronicReceiptUrl)}`} 
              className="w-20 h-20"
              alt="E-Receipt QR"
            />
          </div>
          <div className="space-y-0.5">
            <p className="text-[8px] font-black uppercase tracking-widest text-[#1A1F3D]">Electronic Receipt</p>
            <p className="text-[7px] text-gray-400 font-bold">Scan to save your digital copy</p>
          </div>
        </div>
        
        <div className="pt-2 flex items-center justify-center gap-2 text-[9px] opacity-20">
          <Scissors size={10} />
          <div className="flex-1 border-t border-dotted border-gray-300" />
        </div>
      </div>
    </div>
  );

  if (isInline) {
    return (
      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm">
           <Printer size={12} /> Live Preview ({paperSize})
        </div>
        {receiptContent}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
      <div className="bg-[#E5E7EB] w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 bg-white border-b border-gray-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-xl text-gray-400"><Printer size={18} /></div>
            <div>
              <h3 className="text-sm font-black text-[#1A1F3D]">Receipt Preview</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{paperSize}</p>
            </div>
          </div>
          <button onClick={() => {}} className="p-2 hover:bg-gray-50 rounded-xl transition-all">
            <Printer size={20} className="text-gray-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-10 flex justify-center bg-[#D1D5DB] scrollbar-hide">
          {receiptContent}
        </div>
      </div>
    </div>
  );
};

export default ReceiptPreview;