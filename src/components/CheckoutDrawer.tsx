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
    applyTierDiscount, setApplyTierDiscount,
    validateCouponCode
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

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');

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
  
  let couponDiscountAmount = 0;
  if (appliedCoupon) {
    let template = appliedCoupon.template_type === 'promotion' ? appliedCoupon.promotion_templates : appliedCoupon.coupon_templates;
    // Handle case where Supabase returns an array for the relationship
    if (Array.isArray(template)) {
      template = template[0];
    }
    
    if (template) {
      if (template.discount_type === 'percent') {
        couponDiscountAmount = round2(((subtotal - tierDiscountAmount) * (Number(template.discount_value) || 0)) / 100);
      } else {
        couponDiscountAmount = Number(template.discount_value) || 0;
      }
    }
  }
  
  const discountableSubtotal = Math.max(0, round2(subtotal - tierDiscountAmount - couponDiscountAmount));
  
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

  const currentSelectedPkg = paymentMethod === 'Package'
    ? selectedOwner?.packages?.find(p => p.id === selectedPackageId) || availablePackages[0]
    : null;

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

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    setCouponError('');
    try {
      const result = await validateCouponCode(couponCode.trim());
      setAppliedCoupon(result);
      toast.success(language === 'th' ? "ใช้คูปองสำเร็จ" : "Coupon applied successfully");
    } catch (err: any) {
      setCouponError(err.message || 'Invalid coupon');
      setAppliedCoupon(null);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleInitiatePayment = () => {
    if (cart.length === 0 || !selectedOwner) return;

    if (!paymentMethod) {
      setPaymentError(true);
      setTimeout(() => setPaymentError(false), 500);
      return;
    }
    
    if (paymentMethod === 'Package') {
      if (!selectedPackageId) {
        toast.error("Please select a service package to use");
        return;
      }
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

  const handleCompletePayment = async (details: any) => {
    if (!selectedOwner || !paymentMethod) return;
    const txDate = isBackdated ? new Date(customDate) : new Date();
    const isPackage = paymentMethod === 'Package';
    const isStoreCredit = paymentMethod === 'Store Credit';
    const prefix = isPackage ? 'PKG' : isStoreCredit ? 'CRD' : 'ABB';
    const txId = `${prefix}-${format(txDate, 'yyyyMMdd')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const isPrepaid = isPackage || isStoreCredit;
    const selectedPkg = isPackage ? selectedOwner.packages?.find(p => p.id === selectedPackageId) : null;
    const finalAmount = isPrepaid ? 0 : total;
    const finalSubtotal = isPrepaid ? 0 : subtotalBeforeTax;
    const finalVat = isPrepaid ? 0 : tax;
    const finalDiscount = isPrepaid ? 0 : (totalItemDiscounts + tierDiscountAmount + couponDiscountAmount);

    const finalDetails = {
      ...details,
      receiptNo: txId,
      note: orderNote,
      packageId: isPackage ? selectedPackageId : undefined,
      packageName: selectedPkg?.name,
      packageRemainingSlots: selectedPkg ? Math.max(0, selectedPkg.remainingSlots - 1) : undefined,
      packageTotalSlots: selectedPkg?.totalSlots,
      deductedCredit: isStoreCredit ? total : undefined,
      remainingCredit: isStoreCredit ? Math.max(0, (selectedOwner.creditBalance || 0) - total) : undefined,
      originalAmount: total,
      memberDiscount: tierDiscountAmount,
      couponDiscount: couponDiscountAmount,
      usedCouponCode: appliedCoupon?.code,
      itemDiscounts: totalItemDiscounts
    };

    const finalCart = cart.map(item => ({
      ...item,
      finalPrice: getItemPriceAfterDiscount(item)
    }));

    const earnRate = useStore.getState().pointsEarnRate || 10;
    const earnedPoints = (selectedOwner.id !== 'walk-in' && !isPrepaid) ? Math.floor(finalAmount / earnRate) : 0;
    const accumulatedPoints = selectedOwner.id !== 'walk-in' ? (selectedOwner.points || 0) + earnedPoints : 0;

    const txData = {
      id: txId,
      date: format(txDate, "yyyy-MM-dd'T'HH:mm:ssXXX"),
      customerId: selectedOwner.id,
      customerName: selectedOwner.name,
      customerPhone: selectedOwner.phone,
      items: finalCart,
      amount: finalAmount,
      discountAmount: finalDiscount,
      subtotal: finalSubtotal,
      vatAmount: finalVat,
      vatRate: isPrepaid ? 0 : vatRateVal,
      isTaxInvoice: isTaxInvoice,
      paymentMethod: paymentMethod,
      details: {
        ...finalDetails,
        vatInclusive: vatInclusive,
        pointsEarned: earnedPoints,
        accumulatedPoints: accumulatedPoints
      }
    };

    try {
      await processPayment(
        selectedOwner.id, 
        finalAmount, 
        finalDiscount, 
        finalCart, 
        paymentMethod, 
        finalDetails, 
        isTaxInvoice,
        undefined, 
        finalSubtotal,
        finalVat,
        isPrepaid ? 0 : vatRateVal,
        isBackdated ? format(txDate, "yyyy-MM-dd'T'HH:mm:ssXXX") : undefined,
        appliedCoupon?.id
      );
      cart.forEach(item => { if (item.queueItemId) markAsPaid(item.queueItemId); });
      
      toast.success("Transaction Complete!");
      
      setCompletedTransaction(txData);
      
      clearCart();
      setIsPaymentModalOpen(false);
    } catch (err: any) {
      console.error("Payment error:", err);
      toast.error("Payment failed: " + (err?.message || "Unknown error"));
    }
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

              <div className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-[0_8px_24px_rgba(2,13,53,0.03)]">
                 <div className="flex items-center gap-3">
                    <FileText size={18} className="text-[#45464E]" />
                    <div>
                      <span className="text-[11px] font-bold uppercase text-[#020D35] tracking-wider block">{language === 'th' ? 'ขอใบกำกับภาษี' : 'Tax Invoice'}</span>
                      <span className="text-[10px] font-medium text-[#76767F]">Issue full tax invoice</span>
                    </div>
                 </div>
                 <Switch checked={isTaxInvoice && vatEnabled} onCheckedChange={setIsTaxInvoice} disabled={!vatEnabled} className="data-[state=checked]:bg-[#020D35]" />
              </div>

              <div className="pt-1">
                <label className="text-[11px] font-bold uppercase text-[#45464E] tracking-wider px-1 mb-2 block">{language === 'th' ? 'หมายเหตุ' : 'Note'}</label>
                <input 
                  type="text"
                  value={orderNote}
                  onChange={e => setOrderNote(e.target.value)}
                  placeholder={language === 'th' ? 'เพิ่มหมายเหตุสำหรับบิลนี้...' : 'Add a note for this bill...'}
                  className="w-full bg-white border-none shadow-[0_4px_20px_rgba(2,13,53,0.03)] rounded-2xl px-4 py-3.5 text-sm font-medium text-[#1A1C1C] placeholder:text-[#76767F] focus:ring-2 focus:ring-[#18234A]/15 outline-none transition-all"
                />
              </div>

              <div className="bg-white rounded-[2rem] p-6 shadow-[0_12px_36px_rgba(2,13,53,0.04)] space-y-3.5">
                <div className="flex justify-between items-center text-sm font-medium text-[#45464E]">
                  <span>{language === 'th' ? 'ยอดรวม' : 'Subtotal'}</span>
                  <span className="text-[#1A1C1C] font-bold">{currency}{round2(cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)).toFixed(2)}</span>
                </div>

                {totalItemDiscounts > 0 && (
                  <div className="flex justify-between items-center text-sm text-[#8E171D] font-bold">
                    <span className="flex items-center gap-1.5"><Tag size={14}/> {language === 'th' ? 'ส่วนลดสินค้า' : 'Item Discounts'}</span>
                    <span>-{currency}{totalItemDiscounts.toFixed(2)}</span>
                  </div>
                )}

                {tierDiscountPercent > 0 && paymentMethod !== 'Package' && (
                  <div className={cn("flex justify-between items-center text-sm font-bold", applyTierDiscount ? "text-[#18234A]" : "text-[#76767F]")}>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5"><ArrowDownCircle size={14}/> {t.discount} ({tierDiscountPercent}%)</span>
                      <Switch 
                        checked={applyTierDiscount} 
                        onCheckedChange={setApplyTierDiscount} 
                        className="data-[state=checked]:bg-[#18234A] scale-75 origin-left" 
                      />
                    </div>
                    {applyTierDiscount ? (
                      <span className="text-[#18234A]">-{currency}{tierDiscountAmount.toFixed(2)}</span>
                    ) : (
                      <span className="line-through text-[#76767F]">-{currency}{calculatedTierDiscount.toFixed(2)}</span>
                    )}
                  </div>
                )}

                {/* Coupon Code Input Area */}
                {paymentMethod !== 'Package' && (
                  <div className="py-2">
                    {appliedCoupon ? (
                      <div className="flex justify-between items-center bg-[#F3F3F3] p-3 rounded-2xl">
                        <div>
                          <div className="text-xs font-bold text-[#18234A] flex items-center gap-1.5"><Tag size={12}/> {appliedCoupon.code}</div>
                          <div className="text-[10px] text-[#45464E]">
                            {(() => {
                              const template = appliedCoupon.template_type === 'promotion' ? appliedCoupon.promotion_templates : appliedCoupon.coupon_templates;
                              const t = Array.isArray(template) ? template[0] : template;
                              return t?.title || '';
                            })()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#18234A]">-{currency}{Number(couponDiscountAmount || 0).toFixed(2)}</span>
                          <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="p-1 hover:bg-[#e2e2e2] rounded-full text-[#45464E]">
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            placeholder={language === 'th' ? "รหัสคูปอง" : "Coupon Code"}
                            value={couponCode}
                            onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                            onKeyDown={(e) => { if(e.key === 'Enter') handleApplyCoupon(); }}
                            className={cn(
                              "flex-1 bg-[#F3F3F3] border-none rounded-2xl px-4 py-2.5 text-xs font-bold uppercase placeholder:text-[#76767F] outline-none",
                              couponError ? "ring-2 ring-[#8E171D]/30 text-[#8E171D]" : "focus:bg-white focus:ring-2 focus:ring-[#18234A]/15"
                            )}
                          />
                          <button 
                            onClick={handleApplyCoupon}
                            disabled={!couponCode || isApplyingCoupon}
                            className="bg-[#18234A] text-white px-4 py-2.5 rounded-2xl text-xs font-bold disabled:opacity-50"
                          >
                            {isApplyingCoupon ? (language === 'th' ? 'กำลังตรวจสอบ...' : 'Applying...') : (language === 'th' ? 'ใช้คูปอง' : 'Apply')}
                          </button>
                        </div>
                        {couponError && <div className="text-[10px] text-[#8E171D] font-bold px-2">{couponError}</div>}
                      </div>
                    )}
                  </div>
                )}

                {serviceChargeEnabled && paymentMethod !== 'Package' && paymentMethod !== 'Store Credit' && (
                  <div className="flex justify-between items-center text-sm text-[#45464E] font-medium">
                    <span className="flex items-center gap-1.5">Service Charge ({serviceChargeRate || 10}%)</span>
                    <span className="font-bold text-[#1A1C1C]">+{currency}{serviceChargeAmount.toFixed(2)}</span>
                  </div>
                )}

                {vatEnabled && (
                  <div className="flex justify-between items-center text-sm text-[#76767F]">
                    <span>{language === 'th' ? 'ยอดก่อนภาษี' : 'Subtotal Before VAT'}</span>
                    <span className="font-medium text-[#45464E]">{currency}{paymentMethod === 'Package' || paymentMethod === 'Store Credit' ? '0.00' : subtotalBeforeTax.toFixed(2)}</span>
                  </div>
                )}

                {vatEnabled && (
                  <div className="flex justify-between items-center text-xs text-[#76767F]">
                    <span>{vatInclusive ? (language === 'th' ? `VAT (${vatRateVal}% รวมในราคา)` : `VAT (${vatRateVal}% Incl.)`) : (language === 'th' ? `ภาษีมูลค่าเพิ่ม VAT (${vatRateVal}%)` : `VAT (${vatRateVal}%)`)}</span>
                    <span className="font-medium">{currency}{paymentMethod === 'Package' || paymentMethod === 'Store Credit' ? '0.00' : tax.toFixed(2)}</span>
                  </div>
                )}

                {/* Package Deduction Breakdown */}
                {paymentMethod === 'Package' && (
                  <div className="flex justify-between items-center bg-[#F4F3FD] p-3.5 rounded-2xl mt-2 transition-all gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-[#D9D6FE] flex items-center justify-center text-[#5D5C7E] shrink-0 shadow-sm">
                        <Package size={17} />
                      </div>
                      <div className="flex flex-col text-left min-w-0 flex-1">
                        <span className="text-xs font-extrabold text-[#1A1C1C] truncate">{language === 'th' ? 'หักสิทธิ์แพ็กเกจ' : 'Deduct from Package'}</span>
                        {currentSelectedPkg && (
                          <span className="text-[11px] text-[#45464E] font-medium truncate" title={`${currentSelectedPkg.name} (คงเหลือ ${currentSelectedPkg.remainingSlots} ครั้ง)`}>
                            {currentSelectedPkg.name} ({language === 'th' ? `คงเหลือ ${currentSelectedPkg.remainingSlots} ครั้ง` : `${currentSelectedPkg.remainingSlots} left`})
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-black text-[#18234A] bg-white px-3 py-1.5 rounded-xl shadow-xs whitespace-nowrap shrink-0">
                      -{currency}{total.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Store Credit Deduction Breakdown */}
                {paymentMethod === 'Store Credit' && (
                  <div className="flex justify-between items-center bg-[#F9FAEC] p-3.5 rounded-2xl mt-2 transition-all gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-[#DAED5B] flex items-center justify-center text-[#1A1E00] shrink-0 shadow-sm">
                        <Wallet size={17} />
                      </div>
                      <div className="flex flex-col text-left min-w-0 flex-1">
                        <span className="text-xs font-extrabold text-[#1A1C1C] truncate">{language === 'th' ? 'หักจากเครดิต' : 'Deduct from Credit'}</span>
                        <span className="text-[11px] text-[#45464E] font-medium truncate">
                          {language === 'th' 
                            ? `คงเหลือหลังหัก: ${currency}${Math.max(0, (selectedOwner?.creditBalance || 0) - total).toLocaleString()}` 
                            : `Remaining: ${currency}${Math.max(0, (selectedOwner?.creditBalance || 0) - total).toLocaleString()}`}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-black text-[#1A1E00] bg-white px-3 py-1.5 rounded-xl shadow-xs whitespace-nowrap shrink-0">
                      -{currency}{Math.min(total, selectedOwner?.creditBalance || 0).toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="pt-4 border-t border-[#18234A]/8 flex justify-between items-end mt-2">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold uppercase text-[#45464E] tracking-wider">
                      {language === 'th' ? 'ยอดสุทธิ' : 'Total'}
                    </span>
                    {paymentMethod === 'Package' && (
                      <span className="inline-flex items-center w-fit px-2 py-0.5 mt-1 rounded-full bg-[#D9D6FE]/70 text-[#5D5C7E] text-[10px] font-bold">
                        {language === 'th' ? 'ใช้ 1 สิทธิ์ (ไม่ต้องชำระเพิ่ม)' : '1 session used (0 cash due)'}
                      </span>
                    )}
                    {paymentMethod === 'Store Credit' && (
                      <span className="inline-flex items-center w-fit px-2 py-0.5 mt-1 rounded-full bg-[#DAED5B]/70 text-[#1A1E00] text-[10px] font-bold">
                        {language === 'th' ? 'หักเครดิตเต็มจำนวน (ไม่ต้องชำระเพิ่ม)' : 'Paid by credit (0 cash due)'}
                      </span>
                    )}
                  </div>
                  <span className="text-4xl font-extrabold text-[#020D35] tracking-tight">
                    {paymentMethod === 'Package' || paymentMethod === 'Store Credit'
                      ? "0.00" 
                      : `${currency}${total.toFixed(2)}`}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase text-[#45464E] tracking-wider px-1 mb-3">{t.paymentMethod}</p>
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
                          if (method === 'Package' && availablePackages.length > 0 && !selectedPackageId) {
                            setSelectedPackageId(availablePackages[0].id);
                          }
                        }} 
                        animate={paymentError ? { x: [-4, 4, -4, 4, -4, 4, 0] } : { x: 0 }}
                        transition={{ duration: 0.4 }}
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 py-4 rounded-2xl transition-all", 
                          paymentMethod === method 
                            ? "bg-[#020D35] text-[#DAED5B] shadow-[0_8px_24px_rgba(2,13,53,0.15)]" 
                            : paymentError
                              ? "bg-red-50 text-red-500 shadow-sm"
                              : "bg-white text-[#45464E] hover:bg-[#F3F3F3] shadow-[0_4px_16px_rgba(2,13,53,0.02)]", 
                          isDisabled && "opacity-30 cursor-not-allowed grayscale"
                        )}
                      >
                        <Icon size={20} />
                        <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                          {method === 'Credit Card' ? 'CARD' : method === 'Package' ? 'PKG' : method === 'Store Credit' ? 'CREDIT' : method.toUpperCase()}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
                {paymentMethod === 'Package' && availablePackages.length > 0 && (
                  <div className="mt-4">
                    <label className="text-[11px] font-bold uppercase text-[#45464E] tracking-wider px-1 mb-2 block">{language === 'th' ? 'เลือกแพ็กเกจ' : 'Select Package'}</label>
                    <select
                      value={selectedPackageId || ''}
                      onChange={(e) => setSelectedPackageId(e.target.value)}
                      className="w-full bg-[#F3F3F3] border-none rounded-2xl px-4 py-3.5 text-sm font-semibold text-[#1A1C1C] focus:bg-white focus:ring-2 focus:ring-[#18234A]/20 outline-none transition-all"
                    >
                      {availablePackages.map(pkg => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} ({pkg.remainingSlots} {language === 'th' ? 'ครั้ง' : 'slots left'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border-t border-[#18234A]/8 shrink-0 shadow-[0_-8px_24px_rgba(2,13,53,0.03)]">
            <motion.button 
              onClick={handleInitiatePayment} 
              disabled={cart.length === 0} 
              animate={paymentError ? { x: [-4, 4, -4, 4, -4, 4, 0] } : { x: 0 }}
              transition={{ duration: 0.4 }}
              className={cn(
                "w-full font-black py-5 rounded-3xl flex items-center justify-center gap-3 transition-all",
                paymentError 
                  ? "bg-[#8E171D] text-white shadow-[#8E171D]/20" 
                  : "bg-[#DAED5B] text-[#020D35] shadow-[0_12px_28px_rgba(218,237,91,0.25)] hover:bg-[#EAFD69] hover:scale-[1.02] active:scale-[0.98]"
              )}
            >
              <Banknote size={24} /> 
              <span className="text-lg">
                {paymentMethod === 'Package' 
                  ? (language === 'th' ? 'หักสิทธิ์แพ็กเกจ (0 บาท)' : 'Deduct from Package')
                  : paymentMethod === 'Store Credit' 
                    ? (language === 'th' ? 'หักเครดิตร้านค้า (0 บาท)' : 'Deduct Store Credit (0 due)')
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
          total={total} 
          method={paymentMethod!} 
          packageInfo={currentSelectedPkg}
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
