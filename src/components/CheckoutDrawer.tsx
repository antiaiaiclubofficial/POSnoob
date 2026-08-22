import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, PaymentMethod } from '@/store/useStore';
import { translations } from '@/utils/translations';
import { 
  X, Banknote, CreditCard, Wallet, Package, Landmark, 
  ArrowDownCircle, Tag, FileText, Dog, Cat
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';
import { format } from 'date-fns';
import ReceiptPreview from './ReceiptPreview';
import PaymentModal from './PaymentModal';

interface CheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isBackdated?: boolean;
}

export default function CheckoutDrawer({ isOpen, onClose, isBackdated }: CheckoutDrawerProps) {
  const { 
    cart, selectedOwner, tierRules, inventory, currency, language, 
    processPayment, markAsPaid, clearCart, 
    shopName, shopLogo, shopAddress, shopPhone,
    receiptHeader, receiptFooter, receiptPaperSize, 
    vatEnabled, vatRate, vatInclusive,
    serviceChargeEnabled, serviceChargeRate,
    applyTierDiscount, setApplyTierDiscount
  } = useStore();

  const t = translations[language];

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentError, setPaymentError] = useState(false);
  const [orderNote, setOrderNote] = useState('');
  const [isTaxInvoice, setIsTaxInvoice] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState<any | null>(null);
  const [customDate, setCustomDate] = useState<string>(format(new Date(), "yyyy-MM-dd'T'HH:mm"));

  const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

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

  const subtotal = round2(cart.reduce((acc, item) => {
    const finalPrice = getItemPriceAfterDiscount(item);
    return acc + round2(finalPrice * item.quantity);
  }, 0));

  const totalItemDiscounts = round2(cart.reduce((acc, item) => {
    if (!item.discountType || !item.discountValue) return acc;
    const originalTotal = round2(item.price * item.quantity);
    const discountedTotal = round2(getItemPriceAfterDiscount(item) * item.quantity);
    return acc + round2(originalTotal - discountedTotal);
  }, 0));

  const userTier = (selectedOwner && selectedOwner.id !== 'walk-in') ? tierRules.find(r => 
    (r.tier_key && r.tier_key.toLowerCase() === selectedOwner.membership?.toLowerCase()) || 
    r.level.toLowerCase() === selectedOwner.membership?.toLowerCase()
  ) : null;
  const tierDiscountPercent = userTier?.discount || 0;
  const calculatedTierDiscount = round2((subtotal * tierDiscountPercent) / 100);
  const tierDiscountAmount = applyTierDiscount ? calculatedTierDiscount : 0;
  
  const discountableSubtotal = round2(subtotal - tierDiscountAmount);
  
  const serviceChargeAmount = serviceChargeEnabled ? round2(discountableSubtotal * (serviceChargeRate || 10) / 100) : 0;
  const subtotalAfterServiceCharge = discountableSubtotal + serviceChargeAmount;

  const vatRateVal = vatRate || 7;
  let tax = 0;
  let total = 0;
  let subtotalBeforeTax = subtotalAfterServiceCharge;

  if (vatEnabled) {
    if (vatInclusive) {
      total = subtotalAfterServiceCharge;
      tax = round2(total * vatRateVal / (100 + vatRateVal));
      subtotalBeforeTax = round2(total - tax);
    } else {
      tax = round2(subtotalAfterServiceCharge * vatRateVal / 100);
      total = round2(subtotalAfterServiceCharge + tax);
      subtotalBeforeTax = subtotalAfterServiceCharge;
    }
  } else {
    total = subtotalAfterServiceCharge;
    tax = 0;
    subtotalBeforeTax = total;
  }

  const availablePackages = selectedOwner?.packages?.filter(pkg => {
    return cart.some(item => pkg.targetServiceId === item.id && pkg.remainingSlots > 0);
  }) || [];

  useEffect(() => {
    if (!isOpen) {
      setPaymentMethod(null);
      setPaymentError(false);
      setOrderNote('');
      setIsTaxInvoice(false);
      setSelectedPackageId(null);
      setCustomDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    }
  }, [isOpen]);

  const handleInitiatePayment = () => {
    if (cart.length === 0 || !selectedOwner) return;

    if (!paymentMethod) {
      setPaymentError(true);
      setTimeout(() => setPaymentError(false), 500);
      return;
    }
    
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
    if (!selectedOwner || !paymentMethod) return;
    const txDate = isBackdated ? new Date(customDate) : new Date();
    const txId = `ABB-${format(txDate, 'yyyyMMdd')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalDetails = {
      ...details,
      note: orderNote,
      packageId: paymentMethod === 'Package' ? selectedPackageId : undefined,
      receiptNo: txId,
      memberDiscount: tierDiscountAmount,
      itemDiscounts: totalItemDiscounts
    };

    const finalCart = cart.map(item => ({
      ...item,
      finalPrice: getItemPriceAfterDiscount(item)
    }));

    const earnRate = useStore.getState().pointsEarnRate || 10;
    const earnedPoints = selectedOwner.id !== 'walk-in' ? Math.floor(total / earnRate) : 0;
    const accumulatedPoints = selectedOwner.id !== 'walk-in' ? (selectedOwner.points || 0) + earnedPoints : 0;

    const txData = {
      id: txId,
      date: format(txDate, "yyyy-MM-dd'T'HH:mm:ssXXX"),
      customerId: selectedOwner.id,
      customerName: selectedOwner.name,
      customerPhone: selectedOwner.phone,
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
        vatInclusive: vatInclusive,
        pointsEarned: earnedPoints,
        accumulatedPoints: accumulatedPoints
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
      vatRateVal,
      isBackdated ? format(txDate, "yyyy-MM-dd'T'HH:mm:ssXXX") : undefined
    );
    cart.forEach(item => { if (item.queueItemId) markAsPaid(item.queueItemId); });
    
    toast.success("Transaction Complete!");
    
    setCompletedTransaction(txData);
    
    clearCart();
    setIsPaymentModalOpen(false);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm" 
              onClick={onClose} 
            />

            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[95%] md:w-[85%] lg:w-[1000px] bg-[#F8F9FD] z-[100] shadow-2xl flex flex-col md:flex-row overflow-hidden"
            >
              <div className="flex-1 bg-white border-r border-gray-100 flex flex-col h-full overflow-hidden shrink-0 w-full md:w-1/2">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-2xl font-black text-[#1A1F3D]">{t.orderSummary}</h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-[#1A1F3D] bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors md:hidden">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            <div className="space-y-4">
              {cart.map((item, idx) => {
                const hasDiscount = item.discountType && item.discountValue > 0;
                const finalPrice = getItemPriceAfterDiscount(item);
                
                return (
                  <div key={`${item.id}-${idx}`} className="flex flex-col gap-3 p-4 bg-white border border-gray-100 rounded-[24px] shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#F5F6FA] rounded-xl flex items-center justify-center shrink-0">
                        <Dog className="text-[#1A1F3D] w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-[#1A1F3D] text-[16px] leading-normal truncate py-0.5">{item.title}</h4>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="text-[10px] text-gray-400 font-black uppercase">{item.petName || 'Retail Item'}</span>
                          {item.type === 'Service' && (
                            <>
                              {item.targetSpecies && (
                                <span className={cn(
                                  "px-2 py-1 rounded-md text-[10px] font-black flex items-center gap-1 border",
                                  item.targetSpecies === 'Dog' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-orange-50 text-orange-600 border-orange-100"
                                )}>
                                  {item.targetSpecies === 'Dog' ? <Dog size={10} /> : <Cat size={10} />}
                                  {language === 'th' 
                                    ? (item.targetSpecies === 'Dog' ? 'สุนัข' : item.targetSpecies === 'Cat' ? 'แมว' : item.targetSpecies)
                                    : item.targetSpecies}
                                </span>
                              )}
                              <span className="px-2 py-1 rounded-md text-[10px] font-black flex items-center gap-1 border bg-gray-50 text-gray-600 border-gray-200">
                                {(!item.coatType || item.coatType === 'All') 
                                  ? (language === 'th' ? 'ทุกประเภทขน' : 'All Coats')
                                  : (language === 'th' 
                                      ? (item.coatType === 'Short' ? 'ขนสั้น' : item.coatType === 'Long' ? 'ขนยาว' : item.coatType)
                                      : `${item.coatType} Coat`)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {hasDiscount && (
                           <p className="text-[12px] text-gray-300 line-through font-bold">
                             {currency}{(item.price * item.quantity).toFixed(2)}
                           </p>
                        )}
                        <span className="font-black text-[20px] text-[#1A1F3D]">
                          {currency}{(finalPrice * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase">QTY:</span>
                        <span className="text-[14px] font-black text-[#1A1F3D] bg-gray-50 px-2 py-0.5 rounded-md">{item.quantity}</span>
                      </div>
                      {hasDiscount && (
                        <span className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded-md font-black">
                          Discount: -{item.discountType === 'percent' ? `${item.discountValue}%` : `${currency}${item.discountValue}`}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="w-full md:w-[450px] shrink-0 bg-[#F8F9FD] flex flex-col h-full overflow-hidden relative">
          <div className="absolute top-6 right-6 hidden md:block">
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-[#1A1F3D] bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-8 pb-4 flex-1 overflow-y-auto scrollbar-hide pt-16 md:pt-8">
            <h3 className="text-xl font-black text-[#1A1F3D] mb-6">{language === 'th' ? 'รายละเอียดชำระเงิน' : 'Payment Details'}</h3>
            
            <div className="space-y-6">
              {isBackdated && (
                <div className="bg-amber-50 p-4 rounded-2xl flex flex-col gap-2 border border-amber-200 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-black uppercase text-amber-700 tracking-widest block">{language === 'th' ? 'วันที่/เวลา ทำรายการ (ย้อนหลัง)' : 'Backdated Transaction Time'}</span>
                  </div>
                  <input 
                    type="datetime-local" 
                    value={customDate} 
                    onChange={(e) => setCustomDate(e.target.value)} 
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-sm text-[#1A1F3D] focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>
              )}

              <div className="bg-white p-4 rounded-2xl flex items-center justify-between border border-gray-100 shadow-sm">
                 <div className="flex items-center gap-2">
                    <FileText size={18} className="text-gray-400" />
                    <div>
                      <span className="text-[12px] font-black uppercase text-[#1A1F3D] tracking-widest block">{language === 'th' ? 'ขอใบกำกับภาษี' : 'Tax Invoice'}</span>
                      <span className="text-[10px] font-medium text-gray-400">Issue full tax invoice</span>
                    </div>
                 </div>
                 <Switch checked={isTaxInvoice && vatEnabled} onCheckedChange={setIsTaxInvoice} disabled={!vatEnabled} className="data-[state=checked]:bg-[#1A1F3D]" />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1 mb-3">{t.paymentMethod}</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['Cash', 'Transfer', 'Credit Card', 'Package', 'Store Credit'] as const).map((method) => {
                    const Icon = method === 'Cash' ? Wallet : method === 'Transfer' ? Landmark : method === 'Credit Card' ? CreditCard : method === 'Package' ? Package : Wallet;
                    const isDisabled = (method === 'Package' && availablePackages.length === 0) || (method === 'Store Credit' && (!selectedOwner || (selectedOwner.creditBalance || 0) < total));
                    return (
                      <motion.button 
                        key={method} 
                        disabled={isDisabled} 
                        onClick={() => {
                          setPaymentMethod(method);
                          setPaymentError(false);
                        }} 
                        animate={paymentError ? { x: [-4, 4, -4, 4, -4, 4, 0] } : { x: 0 }}
                        transition={{ duration: 0.4 }}
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-colors", 
                          paymentMethod === method 
                            ? "bg-[#1A1F3D] border-[#1A1F3D] text-[#D9ED5F] shadow-lg" 
                            : paymentError
                              ? "bg-red-50 border-red-500 text-red-500 shadow-sm"
                              : "bg-white border-transparent shadow-sm text-gray-400 hover:border-gray-200", 
                          isDisabled && "opacity-30 cursor-not-allowed grayscale"
                        )}
                      >
                        <Icon size={20} />
                        <span className="text-[9px] font-black uppercase whitespace-nowrap">{method === 'Package' ? "PKG" : method === 'Store Credit' ? "CREDIT" : method.split(' ')[0]}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1 mb-2 block">{language === 'th' ? 'หมายเหตุ' : 'Note'}</label>
                <input 
                  type="text"
                  value={orderNote}
                  onChange={e => setOrderNote(e.target.value)}
                  placeholder={language === 'th' ? 'เพิ่มหมายเหตุสำหรับบิลนี้...' : 'Add a note for this bill...'}
                  className="w-full bg-white border-none shadow-sm rounded-2xl px-4 py-4 text-sm font-bold focus:ring-2 focus:ring-[#1A1F3D] outline-none"
                />
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-3">
                <div className="flex justify-between items-center text-sm font-bold text-gray-500">
                  <span>{language === 'th' ? 'ยอดรวม' : 'Subtotal'}</span>
                  <span>{currency}{round2(cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)).toFixed(2)}</span>
                </div>

                {totalItemDiscounts > 0 && (
                  <div className="flex justify-between items-center text-sm text-red-500 font-bold">
                    <span className="flex items-center gap-1.5"><Tag size={14}/> {language === 'th' ? 'ส่วนลดสินค้า' : 'Item Discounts'}</span>
                    <span>-{currency}{totalItemDiscounts.toFixed(2)}</span>
                  </div>
                )}

                {tierDiscountPercent > 0 && paymentMethod !== 'Package' && (
                  <div className={cn("flex justify-between items-center text-sm font-bold", applyTierDiscount ? "text-green-600" : "text-gray-400")}>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5"><ArrowDownCircle size={14}/> {t.discount} ({tierDiscountPercent}%)</span>
                      <Switch 
                        checked={applyTierDiscount} 
                        onCheckedChange={setApplyTierDiscount} 
                        className="data-[state=checked]:bg-green-500 border border-black/10 scale-75 origin-left" 
                      />
                    </div>
                    {applyTierDiscount ? (
                      <span>-{currency}{tierDiscountAmount.toFixed(2)}</span>
                    ) : (
                      <span className="line-through">-{currency}{calculatedTierDiscount.toFixed(2)}</span>
                    )}
                  </div>
                )}

                {serviceChargeEnabled && paymentMethod !== 'Package' && (
                  <div className="flex justify-between items-center text-sm text-indigo-500 font-bold">
                    <span className="flex items-center gap-1.5">Service Charge ({serviceChargeRate || 10}%)</span>
                    <span>+{currency}{serviceChargeAmount.toFixed(2)}</span>
                  </div>
                )}

                {vatEnabled && (
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>{language === 'th' ? 'ยอดก่อนภาษี' : 'Subtotal Before VAT'}</span>
                    <span>{currency}{subtotalBeforeTax.toFixed(2)}</span>
                  </div>
                )}

                {vatEnabled && (
                  <div className="flex justify-between items-center text-sm text-gray-400">
                    <span>{vatInclusive ? (language === 'th' ? `VAT (${vatRateVal}% รวมในราคา)` : `VAT (${vatRateVal}% Incl.)`) : (language === 'th' ? `ภาษีมูลค่าเพิ่ม VAT (${vatRateVal}%)` : `VAT (${vatRateVal}%)`)}</span>
                    <span>{currency}{tax.toFixed(2)}</span>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-100 flex justify-between items-end mt-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{language === 'th' ? 'ยอดสุทธิ' : 'Total'}</span>
                  </div>
                  <span className="text-4xl font-black text-[#1A1F3D] tracking-tight">{paymentMethod === 'Package' ? "0.00" : `${currency}${total.toFixed(2)}`}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border-t border-gray-100 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
            <motion.button 
              onClick={handleInitiatePayment} 
              disabled={cart.length === 0} 
              animate={paymentError ? { x: [-4, 4, -4, 4, -4, 4, 0] } : { x: 0 }}
              transition={{ duration: 0.4 }}
              className={cn(
                "w-full font-extrabold py-5 rounded-3xl flex items-center justify-center gap-3 shadow-lg transition-colors",
                paymentError ? "bg-red-500 text-white shadow-red-500/20" : "bg-[#D9ED5F] text-[#1A1F3D] shadow-[#D9ED5F]/20 hover:scale-[1.02] active:scale-[0.98]"
              )}
            >
              <Banknote size={24} /> 
              <span className="text-lg">
                {paymentMethod === 'Package' 
                  ? "Deduct from Package" 
                  : paymentMethod === 'Store Credit' 
                    ? "Deduct Credit" 
                    : paymentMethod
                      ? (language === 'th' ? `ชำระด้วย ${paymentMethod}` : `Pay with ${paymentMethod}`)
                      : (language === 'th' ? 'เลือกวิธีชำระเงิน' : 'Select Method')}
              </span>
            </motion.button>
          </div>
        </div>
        </motion.div>
          </>
        )}
      </AnimatePresence>

      {isPaymentModalOpen && (
        <PaymentModal 
          total={paymentMethod === 'Package' || paymentMethod === 'Store Credit' ? 0 : total} 
          method={paymentMethod === 'Store Credit' ? 'Cash' : paymentMethod!} 
          onClose={() => setIsPaymentModalOpen(false)} 
          onComplete={handleCompletePayment} 
        />
      )}
      
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
          onClose={() => {
            setCompletedTransaction(null);
            onClose(); // Close drawer after receipt is closed
          }}
        />
      )}
    </>
  );
}
