"use client";

import React from 'react';
import { 
  Scissors, 
  Zap, 
  CreditCard, 
  QrCode, 
  Banknote, 
  Trash2, 
  Bath, 
  ShieldCheck,
  ShoppingBag,
  Dog,
  ArrowDownCircle
} from 'lucide-react';
import { useStore, CartItem } from '@/store/useStore';
import { toast } from 'sonner';

const OrderSummary = () => {
  const { cart, removeFromCart, clearCart, selectedOwner, markAsPaid, processPayment, tierRules } = useStore();
  
  const subtotal = cart.reduce((acc, item) => acc + item.price, 0);
  
  // Get Tier Benefits
  const userTier = selectedOwner ? tierRules.find(r => r.level === selectedOwner.membership) : null;
  const tierDiscountPercent = userTier?.discount || 0;
  const discountAmount = (subtotal * tierDiscountPercent) / 100;
  
  const tax = (subtotal - discountAmount) * 0.08;
  const total = subtotal - discountAmount + tax;

  const getIcon = (type: string) => {
    switch (type) {
      case 'grooming': return Scissors;
      case 'bath': return Bath;
      case 'nail': return Zap;
      case 'deshedding': return ShieldCheck;
      default: return Scissors;
    }
  };

  const groupedCart = cart.reduce((acc, item) => {
    if (!acc[item.petName]) acc[item.petName] = [];
    acc[item.petName].push(item);
    return acc;
  }, {} as Record<string, CartItem[]>);

  const handlePayment = (method: string) => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (!selectedOwner) {
      toast.error("No customer selected");
      return;
    }

    processPayment(selectedOwner.id, total);

    cart.forEach(item => {
      if (item.queueItemId) {
        markAsPaid(item.queueItemId);
      }
    });

    toast.success(`Payment of $${total.toFixed(2)} successful! Tier benefit applied.`);
    clearCart();
  };

  return (
    <div className="w-96 bg-white h-full flex flex-col p-8 border-l border-gray-100 shrink-0">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1F3D]">Order Summary</h2>
          {selectedOwner && (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[10px] text-gray-400 font-bold uppercase">{selectedOwner.name}'s Family</p>
              <span className="text-[8px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">
                {userTier?.label || selectedOwner.membership}
              </span>
            </div>
          )}
        </div>
        <span className="bg-[#E5E7EB] text-[#1A1F3D] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          {cart.length} Items
        </span>
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto pr-2 scrollbar-hide">
        {cart.length === 0 ? (
          <div className="text-center py-10 opacity-40">
            <ShoppingBag className="mx-auto mb-2" size={48} />
            <p className="text-sm font-medium">Your cart is empty</p>
          </div>
        ) : (
          Object.entries(groupedCart).map(([petName, items]) => (
            <div key={petName} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-50 pb-2">
                <Dog size={14} className="text-[#1A1F3D]" />
                <h3 className="text-xs font-black uppercase tracking-widest text-[#1A1F3D]">{petName}</h3>
              </div>
              <div className="space-y-4">
                {items.map((item, idx) => {
                  const Icon = getIcon(item.icon);
                  return (
                    <div key={`${item.id}-${idx}`} className="flex items-center gap-4 group">
                      <div className="w-10 h-10 bg-[#F5F6FA] rounded-xl flex items-center justify-center shrink-0">
                        <Icon className="text-[#1A1F3D] w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-[#1A1F3D] text-sm truncate">{item.title}</h4>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-[#1A1F3D] text-sm">${item.price.toFixed(2)}</span>
                        <button 
                          onClick={() => removeFromCart(idx)}
                          className="text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pt-8 space-y-3 border-t border-dashed border-gray-200 mt-auto">
        <div className="flex justify-between text-sm text-gray-500 font-medium">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        
        {tierDiscountPercent > 0 && (
          <div className="flex justify-between text-sm text-green-600 font-bold bg-green-50 px-3 py-2 rounded-xl">
            <span className="flex items-center gap-1"><ArrowDownCircle size={14}/> {userTier?.label} ({tierDiscountPercent}%)</span>
            <span>-${discountAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm text-gray-500 font-medium">
          <span>Tax (8%)</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between items-end pt-2">
          <span className="text-xl font-bold text-[#1A1F3D]">Total</span>
          <span className="text-3xl font-extrabold text-[#1A1F3D]">${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-8">
        <button 
          onClick={() => handlePayment('Cash')}
          className="w-full bg-[#D9ED5F] hover:bg-[#c8db54] text-[#1A1F3D] font-extrabold py-5 rounded-3xl flex items-center justify-center gap-3 transition-colors shadow-lg shadow-[#D9ED5F]/20"
        >
          <Banknote size={24} />
          Pay and Check-out
        </button>
      </div>
    </div>
  );
};

export default OrderSummary;