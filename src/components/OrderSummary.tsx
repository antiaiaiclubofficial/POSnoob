"use client";

import React, { useState } from 'react';
import { 
  Scissors, Bath, Zap, ShieldCheck, ShoppingBag, Dog, ArrowDownCircle, Banknote, Scale, History
} from 'lucide-react';
import { useStore, CartItem } from '@/store/useStore';
import { toast } from 'sonner';

const OrderSummary = () => {
  const { cart, removeFromCart, clearCart, selectedOwner, activePet, markAsPaid, processPayment, updatePetWeight, tierRules } = useStore();
  const [newWeight, setNewWeight] = useState('');

  const subtotal = cart.reduce((acc, item) => acc + item.price, 0);
  const userTier = selectedOwner ? tierRules.find(r => r.level === selectedOwner.membership) : null;
  const tierDiscountPercent = userTier?.discount || 0;
  const discountAmount = (subtotal * tierDiscountPercent) / 100;
  const tax = (subtotal - discountAmount) * 0.08;
  const total = subtotal - discountAmount + tax;

  const handlePayment = () => {
    if (cart.length === 0 || !selectedOwner) {
      toast.error("Cart or customer missing");
      return;
    }

    // อัปเดตน้ำหนักถ้ามีการกรอกมา
    if (newWeight && activePet) {
      updatePetWeight(selectedOwner.id, activePet.id, Number(newWeight));
    }

    processPayment(selectedOwner.id, total);
    cart.forEach(item => { if (item.queueItemId) markAsPaid(item.queueItemId); });

    toast.success(`Checkout Complete! $${total.toFixed(2)} paid.`);
    clearCart();
    setNewWeight('');
  };

  return (
    <div className="w-96 bg-white h-full flex flex-col p-8 border-l border-gray-100 shrink-0">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1F3D]">Order Summary</h2>
          {selectedOwner && (
            <span className="text-[8px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter mt-1 inline-block">
              {selectedOwner.membership} MEMBER
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto pr-2 scrollbar-hide">
        {cart.length === 0 ? (
          <div className="text-center py-10 opacity-40">
            <ShoppingBag className="mx-auto mb-2" size={48} />
            <p className="text-sm font-medium">Cart is empty</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Weight Update Field */}
            {activePet && (
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <div className="flex items-center gap-2 mb-3">
                  <Scale size={14} className="text-blue-600" />
                  <p className="text-[10px] font-black uppercase text-blue-600">Update {activePet.name}'s Weight</p>
                </div>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.1"
                    placeholder={`Current: ${activePet.weightHistory[activePet.weightHistory.length-1]?.value} kg`}
                    className="w-full bg-white border-none rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-blue-500/20"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300">KG</span>
                </div>
              </div>
            )}

            {cart.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="flex items-center gap-4 group">
                <div className="w-10 h-10 bg-[#F5F6FA] rounded-xl flex items-center justify-center shrink-0">
                  <Dog className="text-[#1A1F3D] w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[#1A1F3D] text-sm truncate">{item.title}</h4>
                  <p className="text-[9px] text-gray-400 font-bold uppercase">{item.petName}</p>
                </div>
                <span className="font-bold text-[#1A1F3D] text-sm">${item.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-8 space-y-3 border-t border-dashed border-gray-200 mt-auto">
        {tierDiscountPercent > 0 && (
          <div className="flex justify-between text-xs text-green-600 font-bold bg-green-50 px-3 py-2 rounded-xl">
            <span className="flex items-center gap-1"><ArrowDownCircle size={14}/> Member Discount</span>
            <span>-${discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between items-end pt-2">
          <span className="text-xl font-bold text-[#1A1F3D]">Total</span>
          <span className="text-3xl font-extrabold text-[#1A1F3D]">${total.toFixed(2)}</span>
        </div>
      </div>

      <button 
        onClick={handlePayment}
        className="w-full bg-[#D9ED5F] hover:bg-[#c8db54] text-[#1A1F3D] font-extrabold py-5 rounded-3xl flex items-center justify-center gap-3 mt-8 shadow-lg shadow-[#D9ED5F]/20 transition-all active:scale-95"
      >
        <Banknote size={24} /> Pay and Checkout
      </button>
    </div>
  );
};

export default OrderSummary;