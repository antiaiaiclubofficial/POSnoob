"use client";

import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Dog, ArrowDownCircle, Banknote, Check, CreditCard, Wallet, X, Trash2, Package, Plus, Minus, FileText, Landmark, Percent, Tag
} from 'lucide-react';
import { useStore, PaymentMethod } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import PaymentModal from './PaymentModal';
import ReceiptPreview from './ReceiptPreview';
import { translations } from '@/utils/translations';
import { Switch } from "@/components/ui/switch";

interface OrderSummaryProps {
  isMobile?: boolean;
}

const OrderSummary = ({ isMobile }: OrderSummaryProps) => {
  const { 
    cart, removeFromCart, updateCartQuantity, updateCartItemDiscount, clearCart, 
    selectedOwner, activePet, markAsPaid, processPayment, tierRules, inventory, 
    addToCart, currency, language, shopName, shopLogo, shopAddress, shopPhone,
    receiptHeader, receiptFooter, receiptPaperSize, vatEnabled
  } = useStore();
  
  const t = translations[language];
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [isTaxInvoice, setIsTaxInvoice] = useState(false);
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [activeDiscountIndex, setActiveDiscountIndex] = useState<number | null>(null);
  const [tempDiscountVal, setTempDiscountVal] = useState('');
  const [tempDiscountType, setTempDiscountType] = useState<'percent' | 'amount' | 'percent'>('percent');

  // เก็บข้อมูลธุรกรรมที่เพิ่งทำเสร็จเพื่อแสดงใบเสร็จ
  const [completedTransaction, setCompletedTransaction] = useState<any | null>(null);

  useEffect(() => {
    setSelectedPackageId(null);
  }, [activePet]);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOwner) {
      toast.error("Please select a customer first");
      setBarcodeQuery('');
      return;
    }
    const product = inventory.find(i => i.barcode === barcodeQuery);
    if (product) {
      addToCart({
        id: product.id,
        title: product.name,
        price: product.price,
        quantity: 1,
        ownerName: selectedOwner.name,
        type: 'Product'
      });
      toast.success(`Scanned: ${product.name}`);
    } else {
      toast.error("Barcode not found");
    }
    setBarcodeQuery('');
  };

  // คำนวณราคาสินค้าแต่ละรายการหลังหักส่วนลดรายรายการ
  const getItemPriceAfterDiscount = (item: any) => {
    if (!item.discountType || !item.discountValue) return item.price;
    if (item.discountType === 'percent') {
      return Math.max(0, item.price * (1 - item.discountValue / 100));
    } else {
      return Math.max(0, item.price - item.discountValue);
    }
  };

  // คำนวณยอดรวมของตะกร้า
  const subtotal = cart.reduce((acc, item) => {
    const finalPrice = getItemPriceAfterDiscount(item);
    return acc + (finalPrice * item.quantity);
  }, 0);

  // คำนวณส่วนลดรวมของตะกร้า (จากส่วนลดรายรายการ)
  const totalItemDiscounts = cart.reduce((acc, item) => {
    if (!item.discountType || !item.discountValue) return acc;
    const originalTotal = item.price * item.quantity;
    const discountedTotal = getItemPriceAfterDiscount(item) * item.quantity;
    return acc + (originalTotal - discountedTotal);
  }, 0);

  // ส่วนลดระดับสมาชิก (Tier Discount) จะคำนวณจากยอดรวมหลังหักส่วนลดรายรายการแล้ว
  const userTier = selectedOwner ? tierRules.find(r => r.level === selectedOwner.membership) : null;
  const tierDiscountPercent = userTier?.discount || 0;
  const tierDiscountAmount = (subtotal * tierDiscountPercent) / 100;
  
  // คำนวณภาษีเฉพาะเมื่อเปิดสวิตช์ขอใบกำกับภาษี (isTaxInvoice) และเปิดใช้งาน VAT ในระบบ (vatEnabled) เท่านั้น
  const tax = (isTaxInvoice && vatEnabled) ? (subtotal - tierDiscountAmount) * 0.07 : 0;
  const total = subtotal - tierDiscountAmount + tax;

  const availablePackages = selectedOwner?.packages?.filter(pkg => {
    return cart.some(item => pkg.targetServiceId === item.id && pkg.remainingSlots > 0);
  }) || [];

  const handleInitiatePayment = () => {
    if (cart.length === 0 || !selectedOwner) return;
    
    if (paymentMethod === 'Package' && !selectedPackageId) {
      toast.error("Please select a service package to use");
      return;
    }

    if (paymentMethod === 'Store Credit') {
      const balance = selectedOwner.creditBalance || 0;
      if (balance < total) {
        toast.error(`Insufficient credits. Balance: ${currency}${balance.toLocaleString()}`);
        return;
      }
    }

    setIsPaymentModalOpen(true);
  };

  const handleCompletePayment = (details: any) => {
    if (!selectedOwner) return;
    const finalDetails = {
      ...details,
      packageId: paymentMethod === 'Package' ? selectedPackageId : undefined
    };

    // สร้างข้อมูลจำลองของ Transaction เพื่อส่งให้ ReceiptPreview แสดงผล
    const txId = `TX-${Date.now()}`;
    const txData = {
      id: txId,
      date: new Date().toISOString(),
      customerName: selectedOwner.name,
      items: [...cart],
      amount: total,
      discountAmount: totalItemDiscounts + tierDiscountAmount,
      paymentMethod: paymentMethod
    };

    processPayment(selectedOwner.id, total, totalItemDiscounts + tierDiscountAmount, cart, paymentMethod, finalDetails, isTaxInvoice);
    cart.forEach(item => { if (item.queueItemId) markAsPaid(item.queueItemId); });
    
    toast.success("Transaction Complete!");
    
    // แสดงใบเสร็จรับเงินทันที
    setCompletedTransaction(txData);
    
    clearCart();
    setIsPaymentModalOpen(false);
    setSelectedPackageId(null);
  };

  const handleApplyDiscount = (index: number) => {
    const val = Number(tempDiscountVal);
    if (isNaN(val) || val < 0) {
      toast.error("Invalid discount value");
      return;
    }
    updateCartItemDiscount(index, tempDiscountType, val);
    setActiveDiscountIndex(null);
    setTempDiscountVal('');
    toast.success("Discount applied to item");
  };

  const handleRemoveDiscount = (index: number) => {
    updateCartItemDiscount(index, null, 0);
    toast.info("Discount removed");
  };

  return (
    <div className={cn(
      "bg-white h-full flex flex-col shrink-0",
      isMobile ? "w-full p-6" : "w-96 p-8 border-l border-gray-100"
    )}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1F3D]">{t.orderSummary}</h2>
          {selectedOwner && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[8px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">
                {selectedOwner.membership} MEMBER
              </span>
              <span className="text-[8px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">
                CREDIT: {currency}{(selectedOwner.creditBalance || 0).toLocaleString()}
              </span>
            </div>
          )}
        </div>
        {cart.length > 0 && (
          <button onClick={clearCart} className="text-[9px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors">
            {t.clearAll}
          </button>
        )}
      </div>

      {/* Barcode Input */}
      <form onSubmit={handleBarcodeSubmit} className="mb-6">
        <div className="relative">
          <Package size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
          <input 
            className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-10 pr-4 py-3 text-[10px] font-bold focus:ring-2 focus:ring-[#1A1F3D]/5"
            placeholder="Scan Barcode / Enter code..."
            value={barcodeQuery}
            onChange={e => setBarcodeQuery(e.target.value)}
          />
        </div>
      </form>

      <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-10">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4"><ShoppingBag size={32} className="text-gray-400" /></div>
            <p className="text-sm font-bold text-gray-500">Cart is empty</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">{t.services}</p>
            {cart.map((item, idx) => {
              const hasDiscount = item.discountType && item.discountValue > 0;
              const finalPrice = getItemPriceAfterDiscount(item);
              
              return (
                <div key={`${item.id}-${idx}`} className="flex flex-col gap-3 p-4 bg-white border border-gray-100 rounded-[24px] shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#F5F6FA] rounded-xl flex items-center justify-center shrink-0">
                      <Dog className="text-[#1A1F3D] w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[#1A1F3D] text-[12px] leading-tight truncate">{item.title}</h4>
                      <p className="text-[8px] text-gray-400 font-black uppercase mt-0.5">{item.petName || 'Retail Item'}</p>
                    </div>
                    <button onClick={() => removeFromCart(idx)} className="p-1.5 text-red-200 hover:text-red-500"><X size={14} /></button>
                  </div>

                  {/* ส่วนลดรายรายการ */}
                  <div className="px-2 py-1 bg-gray-50 rounded-xl flex flex-col gap-2">
                    {activeDiscountIndex === idx ? (
                      <div className="flex items-center gap-2 animate-in slide-in-from-top-1">
                        <div className="flex bg-white p-0.5 rounded-lg border border-gray-100 gap-0.5">
                          <button 
                            type="button"
                            onClick={() => setTempDiscountType('percent')}
                            className={cn("px-2 py-1 rounded-md text-[9px] font-black", tempDiscountType === 'percent' ? "bg-[#1A1F3D] text-white" : "text-gray-400")}
                          >
                            %
                          </button>
                          <button 
                            type="button"
                            onClick={() => setTempDiscountType('amount')}
                            className={cn("px-2 py-1 rounded-md text-[9px] font-black", tempDiscountType === 'amount' ? "bg-[#1A1F3D] text-white" : "text-gray-400")}
                          >
                            {currency}
                          </button>
                        </div>
                        <input 
                          type="number"
                          className="w-16 bg-white border border-gray-100 rounded-lg px-2 py-1 text-[10px] font-bold text-center"
                          placeholder="0"
                          value={tempDiscountVal}
                          onChange={e => setTempDiscountVal(e.target.value)}
                        />
                        <button 
                          type="button"
                          onClick={() => handleApplyDiscount(idx)}
                          className="bg-green-500 text-white px-2 py-1 rounded-lg text-[9px] font-black"
                        >
                          Apply
                        </button>
                        <button 
                          type="button"
                          onClick={() => setActiveDiscountIndex(null)}
                          className="text-gray-400 text-[9px] font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        {hasDiscount ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] bg-red-50 text-red-600 px-2 py-0.5 rounded-md font-black">
                              Discount: -{item.discountType === 'percent' ? `${item.discountValue}%` : `${currency}${item.discountValue}`}
                            </span>
                            <button 
                              type="button"
                              onClick={() => handleRemoveDiscount(idx)}
                              className="text-[8px] text-red-400 hover:text-red-600 font-bold uppercase"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <button 
                            type="button"
                            onClick={() => {
                              setActiveDiscountIndex(idx);
                              setTempDiscountType('percent');
                              setTempDiscountVal('');
                            }}
                            className="text-[9px] text-blue-500 hover:text-blue-700 font-black flex items-center gap-1"
                          >
                            <Tag size={10} /> Add Item Discount
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                     <div className="flex items-center bg-[#F5F6FA] rounded-xl p-1 gap-3">
                        <button onClick={() => updateCartQuantity(idx, -1)} className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-gray-400 hover:text-[#1A1F3D]"><Minus size={12} /></button>
                        <span className="text-[10px] font-black w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateCartQuantity(idx, 1)} className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-gray-400 hover:text-[#1A1F3D]"><Plus size={12} /></button>
                     </div>
                     <div className="text-right">
                       {hasDiscount && (
                         <p className="text-[9px] text-gray-300 line-through font-bold">
                           {currency}{(item.price * item.quantity).toFixed(2)}
                         </p>
                       )}
                       <span className="font-black text-[12px] text-[#1A1F3D]">
                         {currency}{(finalPrice * item.quantity).toFixed(2)}
                       </span>
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-6 mb-6 space-y-4">
        {vatEnabled && (
          <div className="bg-[#F8F9FD] p-4 rounded-2xl flex items-center justify-between border border-gray-100 animate-in fade-in duration-300">
             <div className="flex items-center gap-2">
                <FileText size={16} className="text-gray-400" />
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{language === 'th' ? 'ขอใบกำกับภาษี' : 'Tax Invoice'}</span>
             </div>
             <Switch checked={isTaxInvoice} onCheckedChange={setIsTaxInvoice} className="data-[state=checked]:bg-[#1A1F3D]" />
          </div>
        )}

        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">{t.paymentMethod}</p>
        <div className="grid grid-cols-5 gap-1.5">
          {(['Cash', 'Transfer', 'Credit Card', 'Package', 'Store Credit'] as const).map((method) => {
            const Icon = method === 'Cash' ? Wallet : method === 'Transfer' ? Landmark : method === 'Credit Card' ? CreditCard : method === 'Package' ? Package : Wallet;
            const isDisabled = (method === 'Package' && availablePackages.length === 0) || (method === 'Store Credit' && (!selectedOwner || (selectedOwner.creditBalance || 0) < total));
            return (
              <button key={method} disabled={isDisabled} onClick={() => setPaymentMethod(method)} className={cn("flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all", paymentMethod === method ? "bg-[#1A1F3D] border-[#1A1F3D] text-[#D9ED5F] shadow-lg" : "bg-white border-gray-100 text-gray-400", isDisabled && "opacity-20 cursor-not-allowed grayscale")}>
                <Icon size={14} />
                <span className="text-[7px] font-black uppercase whitespace-nowrap">{method === 'Package' ? "PKG" : method === 'Store Credit' ? "CREDIT" : method.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-6 space-y-3 border-t border-dashed border-gray-200 mt-auto">
        {totalItemDiscounts > 0 && (
          <div className="flex justify-between items-center text-xs text-red-500 font-bold bg-red-50 px-4 py-2.5 rounded-2xl">
            <span className="flex items-center gap-2"><ArrowDownCircle size={12}/> Item Discounts</span>
            <span>-{currency}{totalItemDiscounts.toFixed(2)}</span>
          </div>
        )}
        {tierDiscountPercent > 0 && paymentMethod !== 'Package' && (
          <div className="flex justify-between items-center text-xs text-green-600 font-bold bg-green-50 px-4 py-2.5 rounded-2xl">
            <span className="flex items-center gap-2"><ArrowDownCircle size={12}/> {t.discount} ({tierDiscountPercent}%)</span>
            <span>-{currency}{tierDiscountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between items-end pt-2 px-2">
          <span className="text-xl font-bold text-[#1A1F3D]">{t.total}</span>
          <span className="text-3xl font-extrabold text-[#1A1F3D]">{paymentMethod === 'Package' ? "0.00" : `${currency}${total.toFixed(2)}`}</span>
        </div>
      </div>

      <button onClick={handleInitiatePayment} disabled={cart.length === 0} className="w-full bg-[#D9ED5F] text-[#1A1F3D] font-extrabold py-5 rounded-[28px] flex items-center justify-center gap-3 mt-6 shadow-xl transition-all">
        <Banknote size={20} /> {paymentMethod === 'Package' ? "Deduct from Package" : paymentMethod === 'Store Credit' ? "Deduct Credit" : t.checkout}
      </button>

      {isPaymentModalOpen && <PaymentModal total={paymentMethod === 'Package' || paymentMethod === 'Store Credit' ? 0 : total} method={paymentMethod === 'Store Credit' ? 'Cash' : paymentMethod} onClose={() => setIsPaymentModalOpen(false)} onComplete={handleCompletePayment} />}
      
      {/* แสดงใบเสร็จรับเงินทันทีหลังชำระเงินเสร็จสิ้น */}
      {completedTransaction && (
        <ReceiptPreview 
          shopName={shopName}
          shopLogo={shopLogo}
          shopAddress={shopAddress}
          shopPhone={shopPhone}
          header={receiptHeader}
          footer={receiptFooter}
          paperSize={receiptPaperSize}
          transaction={completedTransaction}
          onClose={() => setCompletedTransaction(null)}
        />
      )}
    </div>
  );
};

export default OrderSummary;