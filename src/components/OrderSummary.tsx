"use client";

import React, { useState } from 'react';
import { 
  ShoppingBag, Dog, ArrowDownCircle, Banknote, Scale, ChevronRight
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';

const OrderSummary = () => {
  const { cart, clearCart, selectedOwner, activePet, markAsPaid, processPayment, updatePetWeight, tierRules } = useStore();
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

      {/* Weight Update Field - แสดงผลด้านบนสุดเมื่อเลือกสัตว์เลี้ยง */}
      {activePet && (
        <div className="mb-8 p-5 bg-[#F5F6FA] rounded-[28px] border border-blue-100/50 shadow-sm">
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
            <div className="text-right">
              <p className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-1">Last Record</p>
              <p className="text-xs font-black text-blue-600">
                {activePet.weightHistory[activePet.weightHistory.length - 1]?.value || '0'} kg
              </p>
            </div>
          </div>
          
          <div className="relative">
            <input 
              type="number" 
              step="0.1"
              placeholder="Enter current weight..."
              className="w-full bg-white border-2 border-transparent focus:border-blue-500/20 rounded-2xl px-5 py-4 text-sm font-black transition-all outline-none"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <span className="text-[10px] font-black text-gray-300 uppercase">KG</span>
            </div>
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
              <div key={`${item.id}-${idx}`} className="flex items-center gap-4 p-3 bg-white hover:bg-gray-50 rounded-2xl transition-colors border border-transparent hover:border-gray-100">
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
          <div className="flex justify-between items-center text-xs text-green-600 font-bold bg-green-50 px-4 py-3 rounded-2xl">
            <span className="flex items-center gap-2">
              <div className="w-5 h-5 bg-green-100 rounded-md flex items-center justify-center">
                <ArrowDownCircle size={12}/>
              </div>
              Member Discount ({tierDiscountPercent}%)
            </span>
            <span>-${discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between items-end pt-2 px-2">
          <span className="text-xl font-bold text-[#1A1F3D]">Total</span>
          <span className="text-3xl font-extrabold text-[#1A1F3D]">${total.toFixed(2)}</span>
        </div>
      </div>

      <button 
        onClick={handlePayment}
        disabled={cart.length === 0}
        className="w-full bg-[#D9ED5F] hover:bg-[#c8db54] disabled:bg-gray-100 disabled:text-gray-300 text-[#1A1F3D] font-extrabold py-5 rounded-[28px] flex items-center justify-center gap-3 mt-8 shadow-xl shadow-[#D9ED5F]/20 transition-all active:scale-95"
      >
        <Banknote size={24} /> Pay and Checkout
      </button>
    </div>
  );
};

export default OrderSummary;