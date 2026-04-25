"use client";

import React from 'react';
import { X, Printer, Scissors } from 'lucide-react';
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
  onClose: () => void;
}

const ReceiptPreview = ({ 
  shopName, shopLogo, shopAddress, shopPhone, 
  header, footer, paperSize, onClose 
}: ReceiptPreviewProps) => {
  
  const is80mm = paperSize === '80mm';
  
  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
      <div className="bg-[#E5E7EB] w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Toolbar */}
        <div className="p-6 bg-white border-b border-gray-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-xl text-gray-400">
              <Printer size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#1A1F3D]">Receipt Preview</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{paperSize} Thermal Print</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl transition-all">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Paper Container */}
        <div className="flex-1 overflow-y-auto p-10 flex justify-center bg-[#D1D5DB] scrollbar-hide">
          <div 
            className={cn(
              "bg-white shadow-xl h-fit min-h-full p-6 sm:p-8 flex flex-col font-mono text-[#1A1F3D] transition-all duration-500",
              is80mm ? "w-[380px]" : "w-[280px]"
            )}
            style={{ fontSize: is80mm ? '13px' : '11px' }}
          >
            {/* Header */}
            <div className="text-center space-y-2 mb-6">
              {shopLogo && (
                <img src={shopLogo} alt="Logo" className="w-16 h-16 mx-auto rounded-xl object-cover mb-4" />
              )}
              <h4 className="font-bold text-base uppercase leading-tight">{shopName}</h4>
              <p className="opacity-60 text-[10px] leading-relaxed">{shopAddress}</p>
              <p className="opacity-60 text-[10px]">Tel: {shopPhone}</p>
              
              <div className="border-t border-dashed border-gray-300 my-4" />
              <p className="font-bold uppercase tracking-widest">{header || 'Tax Invoice / Receipt'}</p>
            </div>

            {/* Meta */}
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
              <div className="space-y-1">
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
              <div className="flex justify-between">
                <span>Vat (7%)</span>
                <span>97.65</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2">
                <span>TOTAL</span>
                <span>1,492.65</span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-300 my-4" />

            {/* Footer */}
            <div className="text-center space-y-4">
              <p className="whitespace-pre-wrap leading-relaxed opacity-80">{footer || 'Thank you for your visit!'}</p>
              
              {/* QR Placeholder */}
              <div className="w-24 h-24 bg-gray-50 border border-gray-100 mx-auto flex flex-col items-center justify-center rounded-lg opacity-40">
                <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                   <span className="text-[8px] font-bold">QR CODE</span>
                </div>
              </div>
              
              <div className="pt-4 flex items-center justify-center gap-2 text-[9px] opacity-40">
                <Scissors size={10} />
                <div className="flex-1 border-t border-dotted border-gray-300" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPreview;