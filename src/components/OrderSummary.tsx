"use client";

import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Dog, ArrowDownCircle, Banknote, Check, CreditCard, Wallet, X, Trash2, Package, Plus, Minus, FileText, Landmark, Percent, Tag, Save, ClipboardList
} from 'lucide-react';
import { format } from 'date-fns';
import { useStore, PaymentMethod } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import PaymentModal from './PaymentModal';
import ReceiptPreview from './ReceiptPreview';
import { translations } from '@/utils/translations';
import { Switch } from "@/components/ui/switch";

interface OrderSummaryProps {
  isMobile?: boolean;
  onOpenSavedBills?: () => void;
}

const OrderSummary = ({ isMobile, onOpenSavedBills }: OrderSummaryProps) => {
  const { 
    cart, removeFromCart, updateCartQuantity, updateCartItemDiscount, clearCart, 
    selectedOwner, activePet, markAsPaid, processPayment, tierRules, inventory, 
    addToCart, currency, language, shopName, shopLogo, shopAddress, shopPhone,
    receiptHeader, receiptFooter, receiptPaperSize, vatEnabled, vatRate, vatInclusive,
    holdBill, heldBills, queue
  } = useStore();
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayQueue = queue?.filter(q => q.date === today && !q.isPaid) || [];
  
  const t = translations[language];
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [isTaxInvoice, setIsTaxInvoice] = useState(false);
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [activeDiscountIndex, setActiveDiscountIndex] = useState<number | null>(null);
  const [tempDiscountVal, setTempDiscountVal] = useState('');
  const [tempDiscountType, setTempDiscountType] = useState<'percent' | 'amount'>('percent');

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

  const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

  // คำนวณราคาสินค้าแต่ละรายการหลังหักส่วนลดรายรายการ
  const getItemPriceAfterDiscount = (item: any) => {
    if (!item.discountType || !item.discountValue) return item.price;
    let price = item.price;
    if (item.discountType === 'percent') {
      price = item.price * (1 - item.discountValue / 100);
    } else {
      price = item.price - item.discountValue;
    }
    return Math.max(0, round2(price));
  };

  // คำนวณยอดรวมของตะกร้า
  const subtotal = round2(cart.reduce((acc, item) => {
    const finalPrice = getItemPriceAfterDiscount(item);
    return acc + round2(finalPrice * item.quantity);
  }, 0));

  // คำนวณส่วนลดรวมของตะกร้า (จากส่วนลดรายรายการ)
  const totalItemDiscounts = round2(cart.reduce((acc, item) => {
    if (!item.discountType || !item.discountValue) return acc;
    const originalTotal = round2(item.price * item.quantity);
    const discountedTotal = round2(getItemPriceAfterDiscount(item) * item.quantity);
    return acc + round2(originalTotal - discountedTotal);
  }, 0));

  // ส่วนลดระดับสมาชิก (Tier Discount) จะคำนวณจากยอดรวมหลังหักส่วนลดรายรายการแล้ว
  const userTier = selectedOwner ? tierRules.find(r => r.level === selectedOwner.membership) : null;
  const tierDiscountPercent = userTier?.discount || 0;
  const tierDiscountAmount = round2((subtotal * tierDiscountPercent) / 100);
  
  // ยอดรวมหลังหักส่วนลดสมาชิก
  const discountableSubtotal = round2(subtotal - tierDiscountAmount);

  // คำนวณภาษีและยอดสุทธิ
  const vatRateVal = vatRate || 7;
  let tax = 0;
  let total = 0;
  let subtotalBeforeTax = discountableSubtotal;

  if (vatEnabled) {
    if (vatInclusive) {
      total = discountableSubtotal;
      tax = round2(total * vatRateVal / (100 + vatRateVal));
      subtotalBeforeTax = round2(total - tax);
    } else {
      tax = round2(discountableSubtotal * vatRateVal / 100);
      total = round2(discountableSubtotal + tax);
      subtotalBeforeTax = discountableSubtotal;
    }
  } else {
    total = discountableSubtotal;
    tax = 0;
    subtotalBeforeTax = total;
  }

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

  const handleHoldBill = () => {
    if (cart.length === 0) return;
    const customerId = selectedOwner?.id || 'walk-in';
    const customerName = selectedOwner?.name || 'Walk-in Customer';
    holdBill(customerId, customerName, cart);
    toast.success(language === 'th' ? "พักบิลสำเร็จ" : "Bill put on hold");
  };

  const handleCompletePayment = (details: any) => {
    if (!selectedOwner) return;
    const finalDetails = {
      ...details,
      packageId: paymentMethod === 'Package' ? selectedPackageId : undefined
    };

    const finalCart = cart.map(item => ({
      ...item,
      finalPrice: getItemPriceAfterDiscount(item)
    }));

    // สร้างข้อมูลจำลองของ Transaction เพื่อส่งให้ ReceiptPreview แสดงผล
    const txId = `TX-${Date.now()}`;
    const txData = {
      id: txId,
      date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX"),
      customerName: selectedOwner.name,
      items: finalCart,
      amount: total,
      discountAmount: totalItemDiscounts + tierDiscountAmount,
      subtotal: subtotalBeforeTax,
      vatAmount: tax,
      vatRate: vatRateVal,
      isTaxInvoice: isTaxInvoice,
      paymentMethod: paymentMethod,
      details: {
        ...finalDetails,
        vatInclusive: vatInclusive
      }
    };

    processPayment(
      selectedOwner.id, 
      total, 
      totalItemDiscounts + tierDiscountAmount, 
      finalCart, 
      paymentMethod, 
      finalDetails, 
      isTaxInvoice,
      undefined, 
      subtotalBeforeTax,
      tax,
      vatRateVal
    );
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

  const getTierColorClass = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'vip': return 'bg-purple-100 text-purple-700';
      case 'platinum': return 'bg-indigo-100 text-indigo-700';
      case 'gold': return 'bg-amber-100 text-amber-700';
      case 'silver': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-600';
    }
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
              <span className={cn(
                "text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter",
                getTierColorClass(selectedOwner.membership)
              )}>
                {selectedOwner.membership} MEMBER
              </span>
              <span className="text-[8px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">
                CREDIT: {currency}{(selectedOwner.creditBalance || 0).toLocaleString()}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-[9px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors">
              {t.clearAll}
            </button>
          )}
          
          <button 
            onClick={onOpenSavedBills}
            className="flex items-center gap-2 bg-[#D9ED5F] text-[#1A1F3D] px-3 py-2 rounded-xl shadow-sm text-[10px] font-black hover:brightness-95 hover:scale-105 active:scale-95 transition-all"
          >
            <ClipboardList size={14} />
            <span className="hidden sm:inline">{language === 'th' ? 'บิลที่พัก/คิว' : 'Saved Bills/Queue'}</span>
            {((heldBills?.length || 0) > 0 || todayQueue.length > 0) && (
              <span className="bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full ml-0.5">
                {(heldBills?.length || 0) + todayQueue.length}
              </span>
            )}
          </button>
        </div>
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
         <div className="bg-[#F8F9FD] p-4 rounded-2xl flex items-center justify-between border border-gray-100">
            <div className="flex items-center gap-2">
               <FileText size={16} className="text-gray-400" />
               <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{language === 'th' ? 'ขอใบกำกับภาษี' : 'Tax Invoice'}</span>
            </div>
            <Switch checked={isTaxInvoice && vatEnabled} onCheckedChange={setIsTaxInvoice} disabled={!vatEnabled} className="data-[state=checked]:bg-[#1A1F3D]" />
         </div>

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

      <div className="pt-6 space-y-2 border-t border-dashed border-gray-200 mt-auto">
        <div className="flex justify-between items-center text-xs text-gray-500 px-2 py-0.5">
          <span>{language === 'th' ? 'ยอดรวม' : 'Subtotal'}</span>
          <span>{currency}{round2(cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)).toFixed(2)}</span>
        </div>

        {totalItemDiscounts > 0 && (
          <div className="flex justify-between items-center text-xs text-red-500 font-medium px-2 py-0.5">
            <span className="flex items-center gap-1.5"><Tag size={12}/> {language === 'th' ? 'ส่วนลดสินค้า' : 'Item Discounts'}</span>
            <span>-{currency}{totalItemDiscounts.toFixed(2)}</span>
          </div>
        )}

        {tierDiscountPercent > 0 && paymentMethod !== 'Package' && (
          <div className="flex justify-between items-center text-xs text-green-600 font-medium px-2 py-0.5">
            <span className="flex items-center gap-1.5"><ArrowDownCircle size={12}/> {t.discount} ({tierDiscountPercent}%)</span>
            <span>-{currency}{tierDiscountAmount.toFixed(2)}</span>
          </div>
        )}

        {vatEnabled && !vatInclusive && (
          <div className="flex justify-between items-center text-xs text-gray-500 px-2 py-0.5">
            <span>{language === 'th' ? 'ยอดก่อนภาษี' : 'Subtotal Before VAT'}</span>
            <span>{currency}{discountableSubtotal.toFixed(2)}</span>
          </div>
        )}

        {vatEnabled && (
          <div className="flex justify-between items-center text-xs text-gray-400 px-2 py-0.5">
            <span>{vatInclusive ? (language === 'th' ? `VAT (${vatRateVal}% รวมในราคา)` : `VAT (${vatRateVal}% Incl.)`) : (language === 'th' ? `ภาษีมูลค่าเพิ่ม VAT (${vatRateVal}%)` : `VAT (${vatRateVal}%)`)}</span>
            <span>{currency}{tax.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between items-end pt-2 px-2 border-t border-gray-50 mt-2">
          <span className="text-xl font-bold text-[#1A1F3D]">{t.total}</span>
          <span className="text-3xl font-extrabold text-[#1A1F3D]">{paymentMethod === 'Package' ? "0.00" : `${currency}${total.toFixed(2)}`}</span>
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        <button 
          onClick={handleHoldBill} 
          disabled={cart.length === 0} 
          className="flex-1 bg-white border border-[#1A1F3D] text-[#1A1F3D] font-extrabold py-5 rounded-[28px] flex items-center justify-center gap-2 shadow-sm hover:bg-gray-50 transition-all"
        >
          <Save size={20} /> {language === 'th' ? 'พักบิล' : 'Hold'}
        </button>
        <button 
          onClick={handleInitiatePayment} 
          disabled={cart.length === 0} 
          className="flex-[2] bg-[#D9ED5F] text-[#1A1F3D] font-extrabold py-5 rounded-[28px] flex items-center justify-center gap-3 shadow-xl transition-all"
        >
          <Banknote size={20} /> {paymentMethod === 'Package' ? "Deduct from Package" : paymentMethod === 'Store Credit' ? "Deduct Credit" : t.checkout}
        </button>
      </div>

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