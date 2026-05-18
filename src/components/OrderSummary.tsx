"use client";

import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Dog, ArrowDownCircle, Banknote, Scale, Check, Save, CreditCard, Wallet, X, Trash2, Package
} from 'lucide-react';
import { useStore, PaymentMethod } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import PaymentModal from './PaymentModal';
import { translations } from '@/utils/translations';

interface OrderSummaryProps {
  isMobile?: boolean;
}

const OrderSummary = ({ isMobile }: OrderSummaryProps) => {
  const { cart, removeFromCart, clearCart, selectedOwner, activePet, markAsPaid, processPayment, updatePetWeight, tierRules, services, currency, language } = useStore();
  const t = translations[language];
  
  const [newWeight, setNewWeight] = useState('');
  const [isWeightSaved, setIsWeightSaved] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  useEffect(() => {
    setNewWeight('');
    setIsWeightSaved(false);
    setSelectedPackageId(null);
  }, [activePet]);

  const subtotal = cart.reduce((acc, item) => acc + item.price, 0);
  const userTier = selectedOwner ? tierRules.find(r => r.level === selectedOwner.membership) : null;
  const tierDiscountPercent = userTier?.discount || 0;
  const discountAmount = (subtotal * tierDiscountPercent) / 100;
  const tax = (subtotal - discountAmount) * 0.07;
  const total = subtotal - discountAmount + tax;

  // Check if any cart item matches a customer package
  const availablePackages = selectedOwner?.packages?.filter(pkg => {
    return cart.some(item => {
      const service = services.find(s => s.id === item.id);
      return pkg.targetServiceId === item.id && pkg.remainingSlots > 0;
    });
  }) || [];

  const handleSaveWeight = () => {
    if (!newWeight || !activePet || !selectedOwner) return;
    updatePetWeight(selectedOwner.id, activePet.id, Number(newWeight));
    setIsWeightSaved(true);
    toast.success(`Weight updated to ${newWeight} kg`);
    setTimeout(() => setIsWeightSaved(false), 2000);
  };

  const handleInitiatePayment = () => {
    if (cart.length === 0 || !selectedOwner) return;
    
    if (paymentMethod === 'Package' && !selectedPackageId) {
      toast.error("Please select a package to use");
      return;
    }
    
    setIsPaymentModalOpen(true);
  };

  const handleCompletePayment = (details: any) => {
    if (!selectedOwner) return;

    if (newWeight && activePet && !isWeightSaved) {
      updatePetWeight(selectedOwner.id, activePet.id, Number(newWeight));
    }

    const finalDetails = {
      ...details,
      packageId: paymentMethod === 'Package' ? selectedPackageId : undefined
    };

    processPayment(selectedOwner.id, total, discountAmount, cart, paymentMethod, finalDetails);
    
    cart.forEach(item => {
      if (item.queueItemId) markAsPaid(item.queueItemId);
    });

    toast.success("Transaction Complete!");
    clearCart();
    setNewWeight('');
    setIsWeightSaved(false);
    setIsPaymentModalOpen(false);
    setSelectedPackageId(null);
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
            <span className="text-[8px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter mt-1 inline-block">
              {selectedOwner.membership} MEMBER
            </span>
          )}
        </div>
        {cart.length > 0 && (
          <button onClick={clearCart} className="text-[9px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors">
            {t.clearAll}
          </button>
        )}
      </div>

      {activePet && (
        <div className="mb-8 p-5 bg-[#F5F6FA] rounded-[28px] border border-blue-100/50 shadow-sm transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                <Scale size={16} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 leading-none mb-1">{t.weight}</p>
                <p className="text-xs font-bold text-[#1A1F3D]">{activePet.name}</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <input 
              type="number" 
              placeholder="0.0"
              className="flex-1 bg-white border-none rounded-2xl px-5 py-3.5 text-sm font-black focus:ring-2 focus:ring-blue-500/20"
              value={newWeight}
              onChange={(e) => { setNewWeight(e.target.value); setIsWeightSaved(false); }}
            />
            <button
              onClick={handleSaveWeight}
              disabled={!newWeight || isWeightSaved}
              className={cn(
                "px-4 rounded-2xl transition-all flex items-center justify-center",
                isWeightSaved ? "bg-green-500 text-white" : "bg-[#1A1F3D] text-white"
              )}
            >
              {isWeightSaved ? <Check size={18} /> : <Save size={18} />}
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-10">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag size={32} className="text-gray-400" />
            </div>
            <p className="text-sm font-bold text-gray-500">Cart is empty</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">{t.services}</p>
            {cart.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="flex items-center gap-4 p-3 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <div className="w-10 h-10 bg-[#F5F6FA] rounded-xl flex items-center justify-center shrink-0">
                  <Dog className="text-[#1A1F3D] w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[#1A1F3D] text-[13px] leading-tight truncate">{item.title}</h4>
                  <p className="text-[9px] text-gray-400 font-black uppercase mt-0.5">{item.petName}</p>
                </div>
                <div className="flex flex-col items-end justify-between self-stretch py-0.5">
                  <span className={cn("font-black text-[13px]", paymentMethod === 'Package' ? "text-indigo-600" : "text-[#1A1F3D]")}>
                    {paymentMethod === 'Package' ? "PKG" : `${currency}${item.price.toFixed(2)}`}
                  </span>
                  <button onClick={() => removeFromCart(idx)} className="p-1.5 text-red-200 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-8 mb-6 space-y-4">
        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">{t.paymentMethod}</p>
        <div className="grid grid-cols-4 gap-2">
          {(['Cash', 'Transfer', 'Credit Card', 'Package'] as const).map((method) => {
            const Icon = method === 'Cash' ? Wallet : method === 'Transfer' ? Banknote : method === 'Credit Card' ? CreditCard : Package;
            const isDisabled = method === 'Package' && availablePackages.length === 0;
            return (
              <button
                key={method}
                disabled={isDisabled}
                onClick={() => setPaymentMethod(method)}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all",
                  paymentMethod === method ? "bg-[#1A1F3D] border-[#1A1F3D] text-[#D9ED5F] shadow-lg" : "bg-white border-gray-100 text-gray-400",
                  isDisabled && "opacity-20 cursor-not-allowed grayscale"
                )}
              >
                <Icon size={16} />
                <span className="text-[8px] font-black uppercase">{method === 'Package' ? "PKG" : method}</span>
              </button>
            );
          })}
        </div>

        {paymentMethod === 'Package' && availablePackages.length > 0 && (
          <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 animate-in zoom-in-95">
             <label className="text-[9px] font-black text-indigo-600 uppercase mb-2 block">Available Bundles</label>
             <div className="space-y-2">
               {availablePackages.map(pkg => (
                 <button 
                  key={pkg.id}
                  onClick={() => setSelectedPackageId(pkg.id)}
                  className={cn(
                    "w-full text-left p-2.5 rounded-xl border text-[10px] font-bold flex justify-between transition-all",
                    selectedPackageId === pkg.id ? "bg-white border-indigo-300 text-indigo-600 shadow-sm" : "bg-white/50 border-transparent text-gray-400"
                  )}
                 >
                   <span>{pkg.name}</span>
                   <span>{pkg.remainingSlots} left</span>
                 </button>
               ))}
             </div>
          </div>
        )}
      </div>

      <div className="pt-6 space-y-3 border-t border-dashed border-gray-200 mt-auto">
        {tierDiscountPercent > 0 && paymentMethod !== 'Package' && (
          <div className="flex justify-between items-center text-xs text-green-600 font-bold bg-green-50 px-4 py-3 rounded-2xl">
            <span className="flex items-center gap-2"><ArrowDownCircle size={12}/> {t.discount} ({tierDiscountPercent}%)</span>
            <span>-{currency}{discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between items-end pt-2 px-2">
          <span className="text-xl font-bold text-[#1A1F3D]">{t.total}</span>
          <span className="text-3xl font-extrabold text-[#1A1F3D]">
            {paymentMethod === 'Package' ? "0.00" : `${currency}${total.toFixed(2)}`}
          </span>
        </div>
      </div>

      <button 
        onClick={handleInitiatePayment}
        disabled={cart.length === 0}
        className="w-full bg-[#D9ED5F] text-[#1A1F3D] font-extrabold py-5 rounded-[28px] flex items-center justify-center gap-3 mt-6 shadow-xl transition-all"
      >
        <Banknote size={20} /> {paymentMethod === 'Package' ? "Deduct from Package" : t.checkout}
      </button>

      {isPaymentModalOpen && (
        <PaymentModal 
          total={paymentMethod === 'Package' ? 0 : total}
          method={paymentMethod}
          onClose={() => setIsPaymentModalOpen(false)}
          onComplete={handleCompletePayment}
        />
      )}
    </div>
  );
};

export default OrderSummary;