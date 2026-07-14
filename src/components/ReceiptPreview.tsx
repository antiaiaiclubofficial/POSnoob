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
    customerId?: string;
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
    // New fields for the receipt
    memberCode?: string;
    customerPhone?: string;
    pointsEarned?: number;
    accumulatedPoints?: number;
    memberDiscount?: number;
    percentDiscount?: number;
    feeAmount?: number;
    cardNumber?: string;
    cardExp?: string;
    appCode?: string;
    cashier?: string;
    terminalId?: string;
  } | null;
}

const ReceiptPreview = ({ 
  shopName, shopLogo, shopAddress, shopPhone, 
  header, footer, paperSize, onClose, transaction 
}: ReceiptPreviewProps) => {
  
  const { vatEnabled, vatRate, vatInclusive, companyTaxId, customers, serviceChargeEnabled, serviceChargeRate } = useStore();

  const is80mm = paperSize === '80mm';
  
  // Use real data or demo data
  const isDemo = !transaction;
  const txId = transaction?.id || "000101000109";
  // Thai year format for demo
  const txDate = transaction?.date ? format(new Date(transaction.date), 'dd/MM/yyyy HH:mm') : format(new Date(), 'dd/MM/yyyy HH:mm');
  
  const customerName = transaction?.customerName || "นายบัณฑิตา มีเจริญ";
  
  // Find customer to get their phone number
  const customerInfo = transaction?.customerId ? customers.find(c => c.id === transaction.customerId) : null;
  const memberCode = customerInfo?.phone || transaction?.customerPhone || transaction?.memberCode || (isDemo ? "0812345678" : "-");
  const pointsEarned = transaction?.pointsEarned ?? (isDemo ? 2020.00 : 0);
  const accumulatedPoints = transaction?.accumulatedPoints ?? (isDemo ? 0.00 : 0);
  
  const paymentMethod = transaction?.paymentMethod || "TFB CARD";
  const cardNumber = transaction?.cardNumber || "1234543215667";
  const cardExp = transaction?.cardExp || "1223";
  const appCode = transaction?.appCode || "8888";
  const cashier = transaction?.cashier || "BUSINESS";
  const terminalId = transaction?.terminalId || "000101000109";
  
  const items = transaction?.items || [
    { title: "น้ำยารีดอัดกลีบผ้า Hi-Cl", price: 2520.00, quantity: 99, isVat: true },
    { title: "นมสดโฟร์โมสต์ UHTแบบกล่อง", price: 140.00, quantity: 1, isVat: false }
  ];

  const rawSubtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalItems = items.length;
  
  const memberDiscount = transaction?.memberDiscount ?? (isDemo ? 24962.00 : 0);
  const percentDiscount = transaction?.percentDiscount ?? (isDemo ? 22465.80 : 0);
  const discountAmountVal = transaction?.discountAmount ?? (memberDiscount + percentDiscount);
  
  const subtotalAfterDiscount = rawSubtotal - memberDiscount - percentDiscount;
  
  const currentVatRate = transaction?.vatRate ?? vatRate ?? 7;
  const activeServiceChargeRate = serviceChargeRate || 10;
  
  const demoFeeAmount = serviceChargeEnabled ? subtotalAfterDiscount * (activeServiceChargeRate / 100) : 0;
  const feeAmount = transaction?.feeAmount ?? (isDemo ? demoFeeAmount : 0);
  
  // Calculate VAT based on item isVat flag if available
  let nonVatableAmount = 0;
  let vatableAmount = 0;
  let vatAmount = 0;
  let totalAmount = 0;

  if (isDemo) {
    nonVatableAmount = 0;
    vatableAmount = subtotalAfterDiscount + feeAmount;
    vatAmount = vatEnabled ? vatableAmount * (currentVatRate / 100) : (vatableAmount * 0.07); // Fallback to 7% if vatEnabled is false but demo still shows it
    totalAmount = vatableAmount + vatAmount;
  } else if (transaction) {
    totalAmount = transaction.amount;
    vatAmount = transaction.vatAmount || 0;
    vatableAmount = transaction.subtotal !== undefined ? transaction.subtotal : (totalAmount - vatAmount);
    nonVatableAmount = 0; // fallback
  }

  const formatNumber = (num: number, decimals = 2) => 
    num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

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
              "bg-white shadow-xl h-fit min-h-full p-4 flex flex-col font-sans text-black transition-all duration-500 print:shadow-none",
              is80mm ? "w-[380px]" : "w-[300px]"
            )}
            style={{ fontSize: is80mm ? '13px' : '11px', fontFamily: "'IBM Plex Sans Thai', sans-serif" }}
          >
            {/* Header Area */}
            <div className="text-center space-y-1 mb-2">
              {shopLogo ? (
                <img src={shopLogo} alt="Logo" className="h-12 mx-auto object-contain mb-2" />
              ) : (
                <div className="h-12 w-12 mx-auto mb-2 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center text-[10px] text-gray-500 print:hidden">
                  Logo
                </div>
              )}
              <h2 className="text-2xl font-bold mb-2 uppercase">{shopName || "MAGURO"}</h2>
              
              <p className="whitespace-pre-wrap">{shopAddress}</p>
              <div className="flex justify-center gap-4 mt-1">
                <span>Tax ID : {companyTaxId || "0107566000453"}</span>
              </div>
            </div>

            <div className="border-t border-b border-black py-1 my-2 text-center font-bold">
              ใบเสร็จรับเงิน/ใบกำกับภาษี
            </div>
            
            {/* Meta Info */}
            <div className="grid grid-cols-[130px_1fr] gap-x-2 w-full mb-2">
              <span>ใบเสร็จรับเงินเลขที่:</span>
              <span className="text-right">{txId}</span>
              <span>วันที่:</span>
              <span className="text-right">{txDate}</span>
              <span>Staff:</span>
              <span className="text-right truncate">{cashier}</span>
            </div>



            <div className="border-t border-dashed border-gray-400 my-2" />
            {/* Items Header */}
            <div className="flex justify-between w-full mb-1 font-bold">
              <span className="flex-1">รายการ</span>
              <span className="w-14 text-center">จำนวน</span>
              <span className="w-24 text-right">ราคา</span>
            </div>
            <div className="border-t border-dashed border-gray-400 my-2" />

            {/* Items Table */}
            <div className="w-full mb-2">
              <div className="space-y-1">
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start leading-normal gap-1 py-0.5">
                    <span className="flex-1 truncate">{item.title}</span>
                    <span className="w-14 text-center">{item.quantity}</span>
                    <span className="w-24 text-right">{formatNumber(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="font-bold my-1">Items : {totalItems}</div>
            <div className="border-t border-dashed border-gray-400 my-2" />

            {/* Calculations */}
            <div className="space-y-1 w-full mb-2">
              <div className="flex justify-between">
                <span>Sub Total</span>
                <span className="text-right">{formatNumber(rawSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span className="text-right">{formatNumber(discountAmountVal)}</span>
              </div>
              {!vatInclusive && (
                <div className="flex justify-between">
                  <span>Net Amount Ex. VAT</span>
                  <span className="text-right">{formatNumber(subtotalAfterDiscount)}</span>
                </div>
              )}
              {serviceChargeEnabled && (
                <div className="flex justify-between">
                  <span>Service Charge {activeServiceChargeRate}%</span>
                  <span className="text-right">{formatNumber(feeAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Amount Ex. VAT</span>
                <span className="text-right">{formatNumber(vatableAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT {currentVatRate}%</span>
                <span className="text-right">{formatNumber(vatAmount)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 font-bold">
                <span>Grand Total(Amount Inc. VAT)</span>
                <span className="text-base">{formatNumber(totalAmount)}</span>
              </div>
            </div>

            {/* Member Details */}
            {((customerName && customerName !== 'ลูกค้าทั่วไป' && customerName !== 'Walk-in Customer') || (memberCode && memberCode !== '-') || pointsEarned > 0 || accumulatedPoints > 0) && (
              <div className="border-t border-dashed border-gray-400 my-2" />
            )}
            <div className="space-y-1 w-full mb-2">
              {customerName && customerName !== 'ลูกค้าทั่วไป' && customerName !== 'Walk-in Customer' && (
                <div className="grid grid-cols-[120px_1fr]">
                  <span>ชื่อสมาชิก:</span>
                  <span className="text-right truncate">{customerName}</span>
                </div>
              )}
              {memberCode && memberCode !== '-' && (
                <div className="grid grid-cols-[120px_1fr]">
                  <span>รหัสสมาชิก:</span>
                  <span className="text-right">{memberCode}</span>
                </div>
              )}
              {(pointsEarned > 0 || accumulatedPoints > 0 || customerInfo) && (
                <>
                  <div className="grid grid-cols-[120px_1fr]">
                    <span>แต้มที่ได้รับ:</span>
                    <span className="text-right">{formatNumber(pointsEarned)}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr]">
                    <span>แต้มสะสม:</span>
                    <span className="text-right">{formatNumber(accumulatedPoints)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Payment Details */}
            <div className="space-y-1 w-full mb-4">
              <div>ชำระเงิน</div>
              <div className="flex justify-between">
                <span>{paymentMethod}</span>
                <span className="text-right">{formatNumber(totalAmount)}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-400 my-4 w-full" />

            {/* Footer */}
            <div className="text-center space-y-1 pb-4 text-[10px] md:text-[11px]">
              <p>ขอบคุณที่ใช้บริการ</p>
              <p>เรียนลูกค้าทุกท่าน</p>
              <p>สินค้ามีปัญหานำใบเสร็จกลับมาแจ้งภายใน3วัน</p>
              <p>รับเปลี่ยนหรือคืนสินค้าภายใน7วัน</p>
              <p>****หากไม่มีใบเสร็จไม่รับเปลี่ยนหรือคืนทุกกรณี****</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPreview;