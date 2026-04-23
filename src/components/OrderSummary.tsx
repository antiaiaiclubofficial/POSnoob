"use client";

import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Dog, ArrowDownCircle, Banknote, Scale, Check, Save, CreditCard, Wallet, X, Trash2
} from 'lucide-react';
import { useStore, PaymentMethod } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import PaymentModal from './PaymentModal';

interface OrderSummaryProps {
  isMobile?: boolean;
}

const OrderSummary = ({ isMobile }: OrderSummaryProps) => {
  const { cart, removeFromCart, clearCart, selectedOwner, activePet, markAsPaid, processPayment, updatePetWeight, tierRules, currency } = useStore();
  const [newWeight, setNewWeight] = useState('');
  const [isWeightSaved, setIsWeightSaved] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    setNewWeight('');
    setIsWeightSaved(false);
  }, [activePet]);

  const subtotal = cart.reduce((acc, item) => acc + item.price, 0);
  const userTier = selectedOwner ? tierRules.find(r => r.level === selectedOwner.membership) : null;
  const tierDiscountPercent = userTier?.discount || 0;
  const discountAmount = (subtotal * tierDiscountPercent) / 100;
  const tax = (subtotal - discountAmount) * 0.08;
  const total = subtotal - discountAmount + tax;

  const handleSaveWeight = () => {
    if (!newWeight || !activePet || !selectedOwner) {
      toast.error("Please enter weight");
      return;
    }
    updatePetWeight(selectedOwner.id, activePet.id, Number(newWeight));
    setIsWeightSaved(true);
    toast.success(`Updated ${activePet.name}'s weight to ${newWeight} kg`);
    setTimeout(() => setIsWeightSaved(false), 2000);
  };

  const handleInitiatePayment = () => {
    if (cart.length === 0 || !selectedOwner) {
      toast.error("Cart or customer missing");
      return;
    }
    setIsPaymentModalOpen(true);
  };

  const handleCompletePayment = (details: any) => {
    if (!selectedOwner) return;

    if (newWeight && activePet && !isWeightSaved) {
      updatePetWeight(selectedOwner.id, activePet.id, Number(newWeight));
    }

    processPayment(selectedOwner.id, total, cart, paymentMethod, details);
    
    cart.forEach(item => {
      if (item.queueItemId) markAsPaid(item.queueItemId);
    });

    toast.success(`Checkout Complete! ${currency}${total.toFixed(2)} paid via ${paymentMethod}.`);
    clearCart();
    setNewWeight('');
    setIsWeightSaved(false);
    setIsPaymentModalOpen(false);
  };

  return (
    <div className={cn(
      "bg-white h-full flex flex-col shrink-0",
      isMobile ? "w-full p-6" : "w-96 p-8 border-l border-gray-100"
    )}>
      <div className="flex items-center justify-between mb-6 lg:mb-8">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-[#1A1F3D]">Order Summary</h2>
          {selectedOwner && (
            <span className="text-[8px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter mt-1 inline-block">
              {selectedOwner.membership} MEMBER
            </span>
          )}
        </div>
        {cart.length > 0 && (
          <button 
            onClick={clearCart}
            className="text-[9px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {activePet && (
        <div className="mb-6 lg:mb-8 p-4 lg:p-5 bg-[#F5F6FA] rounded-[28px] border border-blue-100/50 shadow-sm transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                <Scale size={16} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 leading-none mb-1">Check-in Weight</p>
                <p className="text-xs font-bold text-[#1A1F3D]">{activePet.name}</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input 
                type="number" 
                step="0.1"
                placeholder="0.0"
                className="w-full bg-white border-none rounded-2xl px-4 lg:px-5 py-3 lg:py-3.5 text-sm font-black focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                value={newWeight}
                onChange={(e) => {
                  setNewWeight(e.target.value);
                  setIsWeightSaved(false);
                }}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-[10px] font-black text-gray-300 uppercase">KG</span>
              </div>
            </div>
            <button
              onClick={handleSaveWeight}
              disabled={!newWeight || isWeightSaved}
              className={`px-4 rounded-2xl transition-all flex items-center justify-center ${
                isWeightSaved 
                ? "bg-green-500 text-white" 
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-95 disabled:bg-gray-200 disabled:shadow-none"
              }`}
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
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Services</p>
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
                  <span className="font-black text-[#1A1F3D] text-[13px]">{currency}{item.price.toFixed(2)}</span>
                  <button 
                    onClick={() => removeFromCart(idx)}
                    className="p-1.5 text-red-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-6 lg:pt-8 mb-4 lg:mb-6 space-y-3">
        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Payment Method</p>
        <div className="flex gap-2">
          {(['Cash', 'Transfer', 'Credit Card'] as PaymentMethod[]).map((method) => {
            const Icon = method === 'Cash' ? Wallet : method === 'Transfer' ? Banknote : CreditCard;
            return (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all",
                  paymentMethod === method 
                    ? "bg-[#1A1F3D] border-[#1A1F3D] text-[#D9ED5F] shadow-lg" 
                    : "bg-white border-gray-100 text-gray-400 hover:border-gray-300"
                )}
              >
                <Icon size={16} />
                <span className="text-[8px] lg:text-[9px] font-black uppercase">{method}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-4 lg:pt-6 space-y-3 border-t border-dashed border-gray-200 mt-auto">
        {tierDiscountPercent > 0 && (
          <div className="flex justify-between items-center text-xs text-green-600 font-bold bg-green-50 px-4 py-3 rounded-2xl">
            <span className="flex items-center gap-2">
              <ArrowDownCircle size={12}/> Discount ({tierDiscountPercent}%)
            </span>
            <span>-{currency}{discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between items-end pt-2 px-2">
          <span className="text-lg lg:text-xl font-bold text-[#1A1F3D]">Total</span>
          <span className="text-2xl lg:text-3xl font-extrabold text-[#1A1F3D]">{currency}{total.toFixed(2)}</span>
        </div>
      </div>

      <button 
        onClick={handleInitiatePayment}
        disabled={cart.length === 0}
        className="w-full bg-[#D9ED5F] hover:bg-[#c8db54] disabled:bg-gray-100 disabled:text-gray-300 text-[#1A1F3D] font-extrabold py-4 lg:py-5 rounded-[28px] flex items-center justify-center gap-3 mt-4 lg:mt-6 shadow-xl shadow-[#D9ED5F]/20 transition-all active:scale-95"
      >
        <Banknote size={20} /> Checkout
      </button>

      {isPaymentModalOpen && (
        <PaymentModal 
          total={total}
          method={paymentMethod}
          onClose={() => setIsPaymentModalOpen(false)}
          onComplete={handleCompletePayment}
        />
      )}
    </div>
  );
};

export default OrderSummary;