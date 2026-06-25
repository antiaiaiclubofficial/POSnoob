"use client";

import React from 'react';
import { X, Printer, Scissors, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useStore } from '@/store/useStore';

interface ReceiptPreviewProps {
  shopName: string;
  shopLogo: string | null;
  shopAddress: string;
  shopPhone: string;
  header: string;
  footer: string;
  paperSize: '58mm' | '80mm';
  onClose: () => void;
  transaction?: {
    id: string;
    date: string;
    customerName: string;
    items: any[];
    amount: number;
    discountAmount: number;
    paymentMethod: string;
    subtotal?: number;
    vatAmount?: number;
    vatRate?: number;
    isTaxInvoice?: boolean;
    details?: any;
  } | null;
}

const ReceiptPreview = ({ 
  shopName, shopLogo, shopAddress, shopPhone, 
  header, footer, paperSize, onClose, transaction 
}: ReceiptPreviewProps) => {
  
  const { vatEnabled, vatRate, vatInclusive } = useStore();

  const is80mm = paperSize === '80mm';
  
  // ใช้ข้อมูลจริงจากธุรกรรม หรือใช้ข้อมูลจำลองหากไม่มีการส่งเข้ามา
  const isDemo = !transaction;
  const txId = transaction?.id || "INV-2024-001";
  const txDate = transaction?.date ? format(new Date(transaction.date), 'dd/MM/yyyy HH:mm') : format(new Date(), 'dd/MM/yyyy HH:mm');
  const customerName = transaction?.customerName || "Admin User";
  const paymentMethod = transaction?.paymentMethod || "Cash";
  
  const items = transaction?.items || [
    { title: "Full Grooming (Large)", price: 1200, quantity: 1, petName: "Buddy (Golden Retriever)" },
    { title: "Pet Shampoo (Sensitive)", price: 350, quantity: 1, petName: "Retail Item" }
  ];

  // 1. Calculate raw subtotal (sum of original prices * quantities)
  const rawSubtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  // 2. Get discount amount
  const discountAmountVal = transaction?.discountAmount ?? (isDemo ? 155.00 : 0);
  
  // 3. Get tax rate and check if VAT is enabled
  const currentVatRate = transaction?.vatRate ?? vatRate ?? 7;
  const isVatEnabled = transaction 
    ? (transaction.vatAmount !== undefined && transaction.vatAmount > 0) || (transaction.subtotal !== undefined && transaction.subtotal < transaction.amount)
    : vatEnabled;
  const isVatInclusive = transaction?.details?.vatInclusive ?? vatInclusive ?? true;

  // 4. Determine tax and net amount
  let taxVal = 0;
  let totalVal = 0;
  let preTaxVal = 0;

  if (transaction) {
    totalVal = transaction.amount;
    taxVal = transaction.vatAmount || 0;
    preTaxVal = transaction.subtotal !== undefined ? transaction.subtotal : (totalVal - taxVal);
  } else {
    // Demo Mode
    const netAfterDiscount = Math.max(0, rawSubtotal - discountAmountVal);
    if (isVatEnabled) {
      if (isVatInclusive) {
        totalVal = netAfterDiscount;
        taxVal = totalVal * currentVatRate / (100 + currentVatRate);
        preTaxVal = totalVal - taxVal;
      } else {
        taxVal = netAfterDiscount * currentVatRate / 100;
        totalVal = netAfterDiscount + taxVal;
        preTaxVal = netAfterDiscount;
      }
    } else {
      totalVal = netAfterDiscount;
      taxVal = 0;
      preTaxVal = totalVal;
    }
  }

  const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;
  
  const displaySubtotal = round2(rawSubtotal).toFixed(2);
  const displayDiscount = round2(discountAmountVal).toFixed(2);
  const displayPreTax = round2(preTaxVal).toFixed(2);
  const displayTax = round2(taxVal).toFixed(2);
  const displayTotal = round2(totalVal).toFixed(2);

  const electronicReceiptUrl = `https://e-receipt.tactilesanctuary.com/view/${txId}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[200] flex items-center justify-center p-6 print:p-0 print:bg-white">
      <div className="bg-[#E5E7EB] w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:shadow-none print:rounded-none print:w-auto print:h-auto print:max-h-none">
        
        {/* Toolbar */}
        <div className="p-6 bg-white border-b border-gray-100 flex justify-between items-center shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-xl text-gray-400">
              <Printer size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#1A1F3D]">Receipt Preview</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{paperSize} Thermal Print</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrint}
              className="bg-[#1A1F3D] text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-[#2A3152] transition-all"
            >
              Print Receipt
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl transition-all">
              <X size={20} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Paper Container */}
        <div className="flex-1 overflow-y-auto p-10 flex justify-center bg-[#D1D5DB] scrollbar-hide print:bg-white print:p-0">
          <div 
            className={cn(
              "bg-white shadow-xl h-fit min-h-full p-6 sm:p-8 flex flex-col font-mono text-[#1A1F3D] transition-all duration-500 print:shadow-none print:p-4",
              is80mm ? "w-[380px]" : "w-[280px]"
            )}
            style={{ fontSize: is80mm ? '13px' : '11px' }}
          >
            {/* Header Area */}
            <div className="text-center space-y-2 mb-6">
              {shopLogo && (
                <img src={shopLogo} alt="Logo" className="w-16 h-16 mx-auto rounded-xl object-cover mb-4" />
              )}
              <h4 className="font-bold text-base uppercase leading-tight">{shopName}</h4>
              <p className="opacity-60 text-[9px] leading-relaxed max-w-[200px] mx-auto">{shopAddress}</p>
              <p className="opacity-60 text-[10px]">Tel: {shopPhone}</p>
              
              <div className="border-t border-dashed border-gray-300 my-4" />
              <p className="font-bold uppercase tracking-widest leading-relaxed">
                {header || 'Tax Invoice / Receipt'}
              </p>
            </div>

            {/* Meta Info */}
            <div className="space-y-1 mb-6 opacity-80 text-[10px]">
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{txDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Receipt:</span>
                <span>#{txId}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span>{customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment:</span>
                <span>{paymentMethod}</span>
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
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span>{item.title} {item.quantity > 1 ? `x${item.quantity}` : ''}</span>
                      <span className="text-[9px] opacity-60">
                        {item.petName ? `Pet: ${item.petName}` : 'Retail Item'}
                      </span>
                    </div>
                    <span>{((item.finalPrice ?? item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-dashed border-gray-300 my-4" />

            {/* Calculations */}
            <div className="space-y-1.5 mb-8">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{displaySubtotal}</span>
              </div>
              {discountAmountVal > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Discount</span>
                  <span>-{displayDiscount}</span>
                </div>
              )}
              {isVatEnabled && (
                <>
                  <div className="flex justify-between opacity-60">
                    <span>Before VAT</span>
                    <span>{displayPreTax}</span>
                  </div>
                  <div className="flex justify-between opacity-60">
                    <span>VAT ({currentVatRate}%) {isVatInclusive ? '(Incl.)' : ''}</span>
                    <span>{displayTax}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between font-bold text-base pt-2">
                <span>TOTAL</span>
                <span>{displayTotal}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-300 my-4" />

            {/* Footer & E-Receipt QR */}
            <div className="text-center space-y-4 pt-2">
              <p className="whitespace-pre-wrap leading-relaxed opacity-80">{footer || 'Thank you for your visit!'}</p>
              
              <div className="py-4 flex flex-col items-center gap-3 print:hidden">
                <div className="p-2 bg-white border border-gray-100 rounded-xl shadow-sm">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(electronicReceiptUrl)}`} 
                    className="w-24 h-24"
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
              <p className="text-[7px] opacity-30 font-bold uppercase tracking-tighter">Powered by Elmony POS</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPreview;