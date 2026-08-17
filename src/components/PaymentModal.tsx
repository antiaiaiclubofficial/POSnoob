"use client";

import React, { useState, useEffect } from 'react';
import { X, Wallet, Banknote, CreditCard, QrCode, Check, ArrowRight, DollarSign, Delete } from 'lucide-react';
import { useStore, PaymentMethod } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { translations } from '@/utils/translations';

interface PaymentModalProps {
  total: number;
  method: PaymentMethod;
  onClose: () => void;
  onComplete: (details: any) => void;
}

const PaymentModal = ({ total, method, onClose, onComplete }: PaymentModalProps) => {
  const { currency, language } = useStore();
  const t = translations[language];
  
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
      toast.error(language === 'th' ? "ยอดรับมาต้องไม่น้อยกว่ายอดรวม" : "Received amount must be greater than total");
      return;
    }
    if (method === 'Credit Card' && (!cardLast4 || !refNo)) {
      toast.error(language === 'th' ? "กรุณากรอกข้อมูลบัตรและรหัสอ้างอิง" : "Please fill in card details and reference number");
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

  const methodLabel = method === 'Cash' ? t.cash : method === 'Transfer' ? t.transfer : t.creditCard;

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[110] flex items-center justify-center p-6">
      <div className={cn("bg-white w-full rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300", method === 'Cash' ? "max-w-2xl" : "max-w-md")}>
        {/* Header */}
        <div className="p-8 pb-4 flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-[1.25rem] flex items-center justify-center shadow-sm",
              method === 'Cash' ? "bg-[#daed5b] text-[#1a1e00]" : method === 'Transfer' ? "bg-[#020d35] text-white" : "bg-[#18234a] text-white"
            )}>
              {method === 'Cash' ? <Banknote size={24}/> : method === 'Transfer' ? <QrCode size={24}/> : <CreditCard size={24}/>}
            </div>
            <div>
              <h3 className="text-[20px] font-black text-[#1a1c1c] leading-tight">{methodLabel}</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{language === 'th' ? 'สรุปธุรกรรม' : 'Finalize Transaction'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 bg-transparent hover:bg-gray-50 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 pt-0 space-y-8">
          {/* Total Amount Display */}
          <div className="text-center mt-2">
            <p className="text-[10px] font-bold text-gray-400 tracking-[0.2em] mb-2">{t.total}</p>
            <h2 className="text-[48px] font-black text-[#020d35] tracking-tight">{currency}{total.toFixed(2)}</h2>
          </div>

          {/* Dynamic Payment Content */}
          <div className="space-y-6">
            {method === 'Cash' && (
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-6">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 mb-2 block">{t.received}</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-xl font-bold">{currency}</span>
                      <input 
                        type="number"
                        autoFocus
                        className="w-full bg-[#f3f3f3] border-2 border-[#18234a]/10 focus:border-[#daed5b] rounded-[1.5rem] pl-12 pr-6 py-4 text-[20px] font-bold text-[#1a1c1c] outline-none transition-colors"
                        placeholder="0.00"
                        value={received}
                        onChange={e => setReceived(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    {[20, 50, 100, 500, 1000].map(amount => (
                      <button 
                        key={amount}
                        onClick={() => handleQuickCash(amount)}
                        className="flex-1 py-3 bg-white border border-gray-100 rounded-[1rem] text-[12px] font-bold text-gray-600 hover:bg-[#f9f9f9] transition-colors"
                      >
                        {currency}{amount}
                      </button>
                    ))}
                  </div>

                  <div className="bg-[#daed5b]/20 p-6 rounded-[2rem] flex justify-between items-center mt-6">
                    <span className="text-sm font-bold text-[#1a1e00]">{t.change}</span>
                    <span className="text-[28px] font-black text-[#1a1e00]">{currency}{change.toFixed(2)}</span>
                  </div>
                </div>

                <div className="w-full md:w-[280px] shrink-0">
                  <div className="grid grid-cols-3 gap-3">
                    {['1','2','3','4','5','6','7','8','9','C','0','⌫'].map((key) => (
                      <button
                        key={key}
                        onClick={() => {
                          if (key === 'C') setReceived('');
                          else if (key === '⌫') setReceived(prev => prev.slice(0, -1));
                          else setReceived(prev => prev + key);
                        }}
                        className={cn(
                          "py-5 bg-[#f9f9f9] rounded-[1rem] text-[20px] font-bold transition-colors hover:bg-[#f3f3f3] active:bg-[#e8e8e8]",
                          key === 'C' ? "text-[#ff0000]" : key === '⌫' ? "text-gray-400 flex justify-center items-center" : "text-[#1a1c1c]"
                        )}
                      >
                        {key === '⌫' ? <Delete size={20} /> : key}
                      </button>
                    ))}
                  </div>
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
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">{language === 'th' ? 'รหัสอ้างอิง (ถ้ามี)' : 'Reference No. (optional)'}</label>
                  <input 
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold"
                    placeholder="..."
                    value={refNo}
                    onChange={e => setRefNo(e.target.value)}
                  />
                </div>
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
                      <p className="text-[8px] font-bold uppercase opacity-40 mb-1">{t.total}</p>
                      <p className="text-2xl font-black text-[#D9ED5F]">{currency}{total.toFixed(2)}</p>
                    </div>
                    <p className="text-sm font-mono tracking-wider">**** **** **** {cardLast4 || 'XXXX'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">{language === 'th' ? 'เลขท้าย 4 ตัว' : 'Card Last 4'}</label>
                    <input 
                      maxLength={4}
                      className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-3.5 text-sm font-black text-center"
                      placeholder="1234"
                      value={cardLast4}
                      onChange={e => setCardLast4(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">{language === 'th' ? 'ประเภทบัตร' : 'Card Type'}</label>
                    <select 
                      className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-3.5 text-sm font-bold appearance-none"
                      value={cardType}
                      onChange={e => setCardType(e.target.value)}
                    >
                      <option>Visa</option>
                      <option>Mastercard</option>
                      <option>JCB</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">{language === 'th' ? 'รหัสอนุมัติ (Approval Code)' : 'Approval Code'}</label>
                  <input 
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold"
                    placeholder="..."
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
              "w-full font-bold text-[16px] py-5 rounded-[2rem] flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95",
              method === 'Cash' ? "bg-[#daed5b] text-[#1a1e00] shadow-[#daed5b]/30" : method === 'Transfer' ? "bg-[#020d35] text-white shadow-[#020d35]/30" : "bg-[#18234a] text-white shadow-[#18234a]/30"
            )}
          >
            <Check size={20} strokeWidth={3} /> {t.confirmPayment}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;