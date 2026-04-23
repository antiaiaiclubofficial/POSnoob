"use client";

import React, { useState, useEffect } from 'react';
import { X, Wallet, Banknote, CreditCard, QrCode, Check, ArrowRight, DollarSign } from 'lucide-react';
import { useStore, PaymentMethod } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PaymentModalProps {
  total: number;
  method: PaymentMethod;
  onClose: () => void;
  onComplete: (details: any) => void;
}

const PaymentModal = ({ total, method, onClose, onComplete }: PaymentModalProps) => {
  // Cash States
  const [received, setReceived] = useState<string>('');
  const [change, setChange] = useState<number>(0);

  // Card States
  const [cardLast4, setCardLast4] = useState('');
  const [cardType, setCardType] = useState('Visa');
  const [refNo, setRefNo] = useState('');

  useEffect(() => {
    if (method === 'Cash' && received) {
      const diff = Number(received) - total;
      setChange(diff > 0 ? diff : 0);
    }
  }, [received, total, method]);

  const handleQuickCash = (amount: number) => {
    setReceived(amount.toString());
  };

  const handleFinish = () => {
    if (method === 'Cash' && Number(received) < total) {
      toast.error("Received amount must be greater than total");
      return;
    }
    if (method === 'Credit Card' && (!cardLast4 || !refNo)) {
      toast.error("Please fill in card details and reference number");
      return;
    }

    const details = {
      cashReceived: method === 'Cash' ? Number(received) : undefined,
      change: method === 'Cash' ? change : undefined,
      cardLast4: method === 'Credit Card' ? cardLast4 : undefined,
      cardType: method === 'Credit Card' ? cardType : undefined,
      referenceNo: method !== 'Cash' ? refNo : undefined
    };

    onComplete(details);
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[110] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg",
              method === 'Cash' ? "bg-orange-500" : method === 'Transfer' ? "bg-blue-500" : "bg-purple-500"
            )}>
              {method === 'Cash' ? <Wallet size={24}/> : method === 'Transfer' ? <QrCode size={24}/> : <CreditCard size={24}/>}
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1A1F3D]">{method} Payment</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Finalize Transaction</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-10 space-y-8">
          {/* Total Amount Display */}
          <div className="text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Total Amount Due</p>
            <h2 className="text-5xl font-black text-[#1A1F3D]">${total.toFixed(2)}</h2>
          </div>

          {/* Dynamic Payment Content */}
          <div className="space-y-6">
            {method === 'Cash' && (
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Amount Received</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      type="number"
                      autoFocus
                      className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-6 py-4 text-xl font-black text-[#1A1F3D] focus:ring-4 focus:ring-orange-500/10"
                      placeholder="0.00"
                      value={received}
                      onChange={e => setReceived(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  {[50, 100, 500, 1000].map(amount => (
                    <button 
                      key={amount}
                      onClick={() => handleQuickCash(amount)}
                      className="flex-1 py-3 bg-white border border-gray-100 rounded-xl text-xs font-black text-gray-500 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-all"
                    >
                      ${amount}
                    </button>
                  ))}
                </div>

                <div className="bg-orange-50 p-6 rounded-[28px] border border-orange-100 flex justify-between items-center">
                  <span className="text-xs font-black text-orange-600 uppercase tracking-widest">Change Due</span>
                  <span className="text-2xl font-black text-orange-600">${change.toFixed(2)}</span>
                </div>
              </div>
            )}

            {method === 'Transfer' && (
              <div className="flex flex-col items-center space-y-6">
                <div className="p-6 bg-white border-2 border-blue-100 rounded-[40px] shadow-xl shadow-blue-500/5">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PAYMENT_FOR_${total}`} 
                    className="w-48 h-48"
                    alt="Payment QR"
                  />
                </div>
                <div className="w-full">
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Reference No. (optional)</label>
                  <input 
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold"
                    placeholder="Enter transaction ref..."
                    value={refNo}
                    onChange={e => setRefNo(e.target.value)}
                  />
                </div>
                <p className="text-[10px] text-gray-400 font-medium italic">Scanning this QR will automatically set the amount to ${total}</p>
              </div>
            )}

            {method === 'Credit Card' && (
              <div className="space-y-4">
                <div className="bg-[#1A1F3D] p-6 rounded-[28px] text-white shadow-xl relative overflow-hidden mb-6">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full" />
                  <div className="flex justify-between items-start mb-10">
                    <CreditCard size={32} className="text-[#D9ED5F]" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Terminal Ready</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[8px] font-bold uppercase opacity-40 mb-1">Transaction Total</p>
                      <p className="text-2xl font-black text-[#D9ED5F]">${total.toFixed(2)}</p>
                    </div>
                    <p className="text-sm font-mono tracking-wider">**** **** **** {cardLast4 || 'XXXX'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Card Last 4</label>
                    <input 
                      maxLength={4}
                      className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-3.5 text-sm font-black text-center"
                      placeholder="1234"
                      value={cardLast4}
                      onChange={e => setCardLast4(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Card Type</label>
                    <select 
                      className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-3.5 text-sm font-bold appearance-none"
                      value={cardType}
                      onChange={e => setCardType(e.target.value)}
                    >
                      <option>Visa</option>
                      <option>Mastercard</option>
                      <option>AMEX</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Reference / Approval Code</label>
                  <input 
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold"
                    placeholder="Enter code from slip..."
                    value={refNo}
                    onChange={e => setRefNo(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Button */}
          <button 
            onClick={handleFinish}
            className={cn(
              "w-full text-white font-black py-5 rounded-[28px] flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95",
              method === 'Cash' ? "bg-orange-500 shadow-orange-500/20" : method === 'Transfer' ? "bg-blue-500 shadow-blue-500/20" : "bg-[#1A1F3D] shadow-[#1A1F3D]/20"
            )}
          >
            <Check size={24} /> Confirm Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;