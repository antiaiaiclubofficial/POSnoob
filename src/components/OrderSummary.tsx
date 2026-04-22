"use client";

import React from 'react';
import { Scissors, Zap, CreditCard, QrCode, Banknote } from 'lucide-react';

const OrderSummary = () => {
  return (
    <div className="w-96 bg-white h-full flex flex-col p-8 border-l border-gray-100">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-[#1A1F3D]">Order Summary</h2>
        <span className="bg-[#E5E7EB] text-[#1A1F3D] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          2 Items
        </span>
      </div>

      {/* Cart Items */}
      <div className="flex-1 space-y-6 overflow-y-auto">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#F5F6FA] rounded-xl flex items-center justify-center">
            <Scissors className="text-[#1A1F3D] w-6 h-6" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-[#1A1F3D] text-sm">Full Grooming (S)</h4>
            <p className="text-[10px] text-gray-400">Bella • Golden Retriever</p>
          </div>
          <span className="font-bold text-[#1A1F3D]">$45.00</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#F5F6FA] rounded-xl flex items-center justify-center">
            <Zap className="text-[#1A1F3D] w-6 h-6" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-[#1A1F3D] text-sm">Nail Trim</h4>
            <p className="text-[10px] text-gray-400">Quick Service</p>
          </div>
          <span className="font-bold text-[#1A1F3D]">$15.00</span>
        </div>
      </div>

      {/* Totals */}
      <div className="pt-8 space-y-4 border-t border-dashed border-gray-200 mt-auto">
        <div className="flex justify-between text-sm text-gray-500 font-medium">
          <span>Subtotal</span>
          <span>$60.00</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500 font-medium">
          <span>Tax (8%)</span>
          <span>$4.80</span>
        </div>
        <div className="flex justify-between items-end pt-2">
          <span className="text-xl font-bold text-[#1A1F3D]">Total</span>
          <span className="text-3xl font-extrabold text-[#1A1F3D]">$64.80</span>
        </div>
      </div>

      {/* Payment Method */}
      <div className="mt-8">
        <p className="text-[10px] text-gray-400 font-bold text-center uppercase tracking-widest mb-4">
          Select Payment Method
        </p>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button className="flex flex-col items-center justify-center py-4 border-2 border-gray-100 rounded-3xl hover:border-[#1A1F3D] transition-all group">
            <CreditCard size={20} className="text-gray-400 group-hover:text-[#1A1F3D] mb-2" />
            <span className="text-[10px] font-bold text-gray-400 group-hover:text-[#1A1F3D]">Credit Card</span>
          </button>
          <button className="flex flex-col items-center justify-center py-4 border-2 border-gray-100 rounded-3xl hover:border-[#1A1F3D] transition-all group">
            <QrCode size={20} className="text-gray-400 group-hover:text-[#1A1F3D] mb-2" />
            <span className="text-[10px] font-bold text-gray-400 group-hover:text-[#1A1F3D]">QR Code</span>
          </button>
        </div>
        
        <button className="w-full bg-[#D9ED5F] hover:bg-[#c8db54] text-[#1A1F3D] font-extrabold py-5 rounded-3xl flex items-center justify-center gap-3 transition-colors shadow-lg shadow-[#D9ED5F]/20">
          <Banknote size={24} />
          Pay with Cash
        </button>
      </div>
    </div>
  );
};

export default OrderSummary;