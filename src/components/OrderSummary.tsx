"use client";

import React from 'react';
import { Scissors, Zap, CreditCard, QrCode, Banknote, Trash2, Bath, ShieldCheck } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';

const OrderSummary = () => {
  const { cart, removeFromCart, clearCart } = useStore();
  
  const subtotal = cart.reduce((acc, item) => acc + item.price, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const getIcon = (type: string) => {
    switch (type) {
      case 'grooming': return Scissors;
      case 'bath': return Bath;
      case 'nail': return Zap;
      case 'deshedding': return ShieldCheck;
      default: return Scissors;
    }
  };

  const handlePayment = (method: string) => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    toast.success(`Payment successful via ${method}!`);
    clearCart();
  };

  return (
    <div className="w-96 bg-white h-full flex flex-col p-8 border-l border-gray-100 shrink-0">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-[#1A1F3D]">Order Summary</h2>
        <span className="bg-[#E5E7EB] text-[#1A1F3D] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          {cart.length} Items
        </span>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto pr-2">
        {cart.length === 0 ? (
          <div className="text-center py-10 opacity-40">
            <ShoppingBag className="mx-auto mb-2" />
            <p className="text-sm font-medium">Your cart is empty</p>
          </div>
        ) : (
          cart.map((item, index) => {
            const Icon = getIcon(item.icon);
            return (
              <div key={index} className="flex items-center gap-4 group">
                <div className="w-12 h-12 bg-[#F5F6FA] rounded-xl flex items-center justify-center">
                  <Icon className="text-[#1A1F3D] w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-[#1A1F3D] text-sm">{item.title}</h4>
                  <p className="text-[10px] text-gray-400">{item.petName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[#1A1F3D]">${item.price.toFixed(2)}</span>
                  <button 
                    onClick={() => removeFromCart(index)}
                    className="text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="pt-8 space-y-4 border-t border-dashed border-gray-200 mt-auto">
        <div className="flex justify-between text-sm text-gray-500 font-medium">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
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
        <p className="text-[10px] text-gray-400 font-bold text-center uppercase tracking-widest mb-4">
          Select Payment Method
        </p>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button 
            onClick={() => handlePayment('Credit Card')}
            className="flex flex-col items-center justify-center py-4 border-2 border-gray-100 rounded-3xl hover:border-[#1A1F3D] transition-all group"
          >
            <CreditCard size={20} className="text-gray-400 group-hover:text-[#1A1F3D] mb-2" />
            <span className="text-[10px] font-bold text-gray-400 group-hover:text-[#1A1F3D]">Credit Card</span>
          </button>
          <button 
            onClick={() => handlePayment('QR Code')}
            className="flex flex-col items-center justify-center py-4 border-2 border-gray-100 rounded-3xl hover:border-[#1A1F3D] transition-all group"
          >
            <QrCode size={20} className="text-gray-400 group-hover:text-[#1A1F3D] mb-2" />
            <span className="text-[10px] font-bold text-gray-400 group-hover:text-[#1A1F3D]">QR Code</span>
          </button>
        </div>
        
        <button 
          onClick={() => handlePayment('Cash')}
          className="w-full bg-[#D9ED5F] hover:bg-[#c8db54] text-[#1A1F3D] font-extrabold py-5 rounded-3xl flex items-center justify-center gap-3 transition-colors shadow-lg shadow-[#D9ED5F]/20"
        >
          <Banknote size={24} />
          Pay with Cash
        </button>
      </div>
    </div>
  );
};

export default OrderSummary;