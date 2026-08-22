"use client";

import React, { useState } from 'react';
import { 
  ShoppingBag, Dog, Cat, Banknote, X, Plus, Minus, Package, Save, ClipboardList, Tag, ArrowDownCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useStore, walkInCustomer } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { translations } from '@/utils/translations';
import { toast } from 'sonner';
import { Switch } from "@/components/ui/switch";
import CheckoutDrawer from './CheckoutDrawer';

interface OrderSummaryProps {
  isMobile?: boolean;
  onOpenSavedBills?: () => void;
}

const OrderSummary = ({ isMobile, onOpenSavedBills }: OrderSummaryProps) => {
  const { 
    cart, removeFromCart, updateCartQuantity, updateCartItemDiscount, clearCart, 
    selectedOwner, tierRules, inventory, addToCart, currency, language,
    holdBill, heldBills, queue, vatEnabled, vatRate, vatInclusive,
    serviceChargeEnabled, serviceChargeRate,
    applyTierDiscount, setApplyTierDiscount
  } = useStore();
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayQueue = queue?.filter(q => q.date === today && !q.isPaid) || [];
  
  const t = translations[language];
  
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [activeDiscountIndex, setActiveDiscountIndex] = useState<number | null>(null);
  const [tempDiscountVal, setTempDiscountVal] = useState('');
  const [tempDiscountType, setTempDiscountType] = useState<'percent' | 'amount'>('percent');
  const [isCheckoutDrawerOpen, setIsCheckoutDrawerOpen] = useState(false);
  const [isBackdatedCheckout, setIsBackdatedCheckout] = useState(false);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = inventory.find(i => i.barcode === barcodeQuery);
    if (product) {
      addToCart({
        id: product.id,
        title: product.name,
        price: product.price,
        quantity: 1,
        ownerName: selectedOwner?.name || walkInCustomer.name,
        type: 'Product'
      });
      toast.success(`Scanned: ${product.name}`);
    } else {
      toast.error("Barcode not found");
    }
    setBarcodeQuery('');
  };

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

  const handleHoldBill = () => {
    if (cart.length === 0) return;
    const customerId = selectedOwner?.id || 'walk-in';
    const customerName = selectedOwner?.name || 'Walk-in Customer';
    holdBill(customerId, customerName, cart);
    toast.success(language === 'th' ? "พักบิลสำเร็จ" : "Bill put on hold");
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
      "bg-white h-full flex flex-col shrink-0 relative transition-all duration-300 border-l border-gray-100",
      isMobile ? "w-full p-6" : "w-96 p-6"
    )}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#1A1F3D]">{t.orderSummary}</h2>
          {selectedOwner && selectedOwner.id !== 'walk-in' && (
            <div className="flex items-center gap-2 mt-2">
              <span className={cn(
                "text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider whitespace-nowrap",
                getTierColorClass(selectedOwner.membership)
              )}>
                {selectedOwner.membership} MEMBER
              </span>
              <span className="text-[10px] bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider whitespace-nowrap">
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
            <span className="hidden sm:inline">{language === 'th' ? 'บิลที่พัก/คิว' : 'Saved Bills'}</span>
            {((heldBills?.length || 0) > 0 || todayQueue.length > 0) && (
              <span className="bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full ml-0.5">
                {(heldBills?.length || 0) + todayQueue.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleBarcodeSubmit} className="mb-4">
        <div className="relative">
          <Package size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
          <input 
            className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-10 pr-4 py-3 text-[10px] font-bold focus:ring-2 focus:ring-[#1A1F3D]/5 outline-none"
            placeholder="Scan Barcode / Enter code..."
            value={barcodeQuery}
            onChange={e => setBarcodeQuery(e.target.value)}
          />
        </div>
      </form>

      <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide -mx-2 px-2">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-10">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4"><ShoppingBag size={32} className="text-gray-400" /></div>
            <p className="text-sm font-bold text-gray-500">Cart is empty</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 pb-4">
            {['Service', 'Product', 'Package', 'Credit'].map(type => {
              const itemsOfType = cart.map((item, idx) => ({ item, idx })).filter(x => x.item.type === type || (!x.item.type && type === 'Product'));
              if (itemsOfType.length === 0) return null;
              
              let label = '';
              if (type === 'Service') label = t.services;
              else if (type === 'Product') label = language === 'th' ? 'สินค้า' : 'Products';
              else if (type === 'Package') label = language === 'th' ? 'แพ็กเกจ' : 'Packages';
              else if (type === 'Credit') label = language === 'th' ? 'เครดิต' : 'Credits';

              return (
                <div key={type} className="flex flex-col gap-4">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2 -mb-2 mt-2">{label}</p>
                  <AnimatePresence>
                    {itemsOfType.map(({ item, idx }) => {
                      const hasDiscount = item.discountType && item.discountValue > 0;
                const finalPrice = getItemPriceAfterDiscount(item);
                
                return (
                  <motion.div 
                    key={`${item.id}-${idx}`}
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    className="flex flex-col gap-3 p-4 bg-white border border-gray-100 rounded-[20px] shadow-sm"
                  >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#F5F6FA] rounded-xl flex items-center justify-center shrink-0">
                      <Dog className="text-[#1A1F3D] w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[#1A1F3D] text-[14px] leading-normal truncate py-0.5">{item.title}</h4>
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
                    <button onClick={() => removeFromCart(idx)} className="p-1.5 text-red-200 hover:text-red-500"><X size={14} /></button>
                  </div>

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
                          className="w-16 bg-white border border-gray-100 rounded-lg px-2 py-1 text-[10px] font-bold text-center outline-none"
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
                            <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-md font-black">
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
                            className="text-[10px] text-blue-500 hover:text-blue-700 font-black flex items-center gap-1.5"
                          >
                            <Tag size={10} /> Add Item Discount
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                     <div className="flex items-center bg-[#F5F6FA] rounded-xl p-1 gap-3">
                        <button onClick={() => updateCartQuantity(idx, -1)} className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-gray-400 hover:text-[#1A1F3D]"><Minus size={14} /></button>
                        <span className="text-[14px] font-black w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateCartQuantity(idx, 1)} className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-gray-400 hover:text-[#1A1F3D]"><Plus size={14} /></button>
                     </div>
                     <div className="text-right">
                       {hasDiscount && (
                         <p className="text-[12px] text-gray-300 line-through font-bold">
                           {currency}{(item.price * item.quantity).toFixed(2)}
                         </p>
                       )}
                       <span className="font-black text-[18px] text-[#1A1F3D]">
                         {currency}{(finalPrice * item.quantity).toFixed(2)}
                       </span>
                     </div>
                  </div>
                  </motion.div>
                );
              })}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 flex flex-col">
        <div className="pt-4 space-y-2 border-t border-dashed border-gray-200 mb-4">
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

          {tierDiscountPercent > 0 && (
            <div className={cn("flex justify-between items-center text-xs font-medium px-2 py-0.5", applyTierDiscount ? "text-green-600" : "text-gray-400")}>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5"><ArrowDownCircle size={12}/> {t.discount} ({tierDiscountPercent}%)</span>
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

          {serviceChargeEnabled && (
            <div className="flex justify-between items-center text-xs text-indigo-500 font-medium px-2 py-0.5">
              <span className="flex items-center gap-1.5">Service Charge ({serviceChargeRate || 10}%)</span>
              <span>+{currency}{serviceChargeAmount.toFixed(2)}</span>
            </div>
          )}

          {vatEnabled && (
            <div className="flex justify-between items-center text-xs text-gray-500 px-2 py-0.5">
              <span>{language === 'th' ? 'ยอดก่อนภาษี' : 'Subtotal Before VAT'}</span>
              <span>{currency}{subtotalBeforeTax.toFixed(2)}</span>
            </div>
          )}

          {vatEnabled && (
            <div className="flex justify-between items-center text-xs text-gray-400 px-2 py-0.5">
              <span>{vatInclusive ? (language === 'th' ? `VAT (${vatRateVal}% รวมในราคา)` : `VAT (${vatRateVal}% Incl.)`) : (language === 'th' ? `ภาษีมูลค่าเพิ่ม VAT (${vatRateVal}%)` : `VAT (${vatRateVal}%)`)}</span>
              <span>{currency}{tax.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-end px-2">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-[#1A1F3D]">{t.total}</span>
          </div>
          <span className="text-3xl font-extrabold text-[#1A1F3D]">{currency}{total.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        <button 
          onClick={handleHoldBill} 
          disabled={cart.length === 0} 
          className="flex-1 bg-white border border-[#1A1F3D] text-[#1A1F3D] font-extrabold py-5 rounded-[28px] flex items-center justify-center gap-2 shadow-sm hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={20} /> <span className="hidden sm:inline">{language === 'th' ? 'พักบิล' : 'Hold'}</span>
        </button>
        <button 
          onClick={() => {
            setIsBackdatedCheckout(false);
            setIsCheckoutDrawerOpen(true);
          }} 
          disabled={cart.length === 0} 
          className="flex-[2] bg-[#D9ED5F] text-[#1A1F3D] font-extrabold py-5 rounded-[28px] flex items-center justify-center gap-3 shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-95"
        >
          <Banknote size={20} /> {language === 'th' ? 'ชำระเงิน' : 'Checkout'}
        </button>
      </div>

      <div className="mt-4 text-center">
        <button
          onClick={() => {
            setIsBackdatedCheckout(true);
            setIsCheckoutDrawerOpen(true);
          }}
          disabled={cart.length === 0}
          className="text-sm font-bold text-gray-400 hover:text-[#1A1F3D] transition-colors underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
        >
          {language === 'th' ? 'บันทึกบิลย้อนหลัง (Record Past Transaction)' : 'Record Past Transaction'}
        </button>
      </div>

      <CheckoutDrawer 
        isOpen={isCheckoutDrawerOpen} 
        isBackdated={isBackdatedCheckout}
        onClose={() => setIsCheckoutDrawerOpen(false)} 
      />
    </div>
  );
};

export default OrderSummary;
