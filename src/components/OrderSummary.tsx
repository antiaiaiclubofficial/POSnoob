"use client";

import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Dog, ArrowDownCircle, Banknote, Check, CreditCard, Wallet, X, Trash2, Package, Plus, Minus, FileText, Gem
} from 'lucide-react';
import { useStore, PaymentMethod } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import PaymentModal from './PaymentModal';
import { translations } from '@/utils/translations';
import { Switch } from "@/components/ui/switch";

const OrderSummary = ({ isMobile }: { isMobile?: boolean }) => {
  const { cart, removeFromCart, updateCartQuantity, clearCart, selectedOwner, markAsPaid, processPayment, tierRules, currency, language } = useStore();
  const t = translations[language];
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [isTaxInvoice, setIsTaxInvoice] = useState(false);

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discountAmount = selectedOwner ? (subtotal * (tierRules.find(r => r.level === selectedOwner.membership)?.discount || 0)) / 100 : 0;
  const total = subtotal - discountAmount + (subtotal - discountAmount) * 0.07;

  const handleInitiatePayment = () => {
    if (cart.length === 0 || !selectedOwner) return;
    if (paymentMethod === 'Store Credit' && (selectedOwner.creditBalance || 0) < total) {
      toast.error("Insufficient credit balance");
      return;
    }
    setIsPaymentModalOpen(true);
  };

  const handleCompletePayment = (details: any) => {
    if (!selectedOwner) return;
    processPayment(selectedOwner.id, total, discountAmount, cart, paymentMethod, details, isTaxInvoice);
    cart.forEach(item => { if (item.queueItemId) markAsPaid(item.queueItemId); });
    toast.success("Transaction Complete!");
    clearCart();
    setIsPaymentModalOpen(false);
  };

  const availablePackages = selectedOwner?.packages?.filter(pkg => cart.some(item => pkg.targetServiceId === item.id && pkg.remainingSlots > 0)) || [];

  return (
    <div className={cn("bg-white h-full flex flex-col shrink-0", isMobile ? "w-full p-6" : "w-96 p-8 border-l border-gray-100")}>
      <div className="flex items-center justify-between mb-8">
        <div>
           <h2 className="text-2xl font-bold text-[#1A1F3D]">{t.orderSummary}</h2>
           {selectedOwner && (
             <div className="flex gap-2 items-center mt-1">
                <span className="text-[8px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-black uppercase">{selectedOwner.membership}</span>
                <span className="text-[8px] font-black text-gray-400">CREDIT: <span className="text-purple-600">{(selectedOwner.creditBalance || 0).toLocaleString()}</span></span>
             </div>
           )}
        </div>
        <button onClick={clearCart} className="text-[9px] font-black text-red-400 uppercase">{t.clearAll}</button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-4">
        {cart.map((item, idx) => (
          <div key={idx} className="p-4 bg-white border border-gray-100 rounded-[24px] shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#F5F6FA] rounded-xl flex items-center justify-center shrink-0">
                {item.type === 'Credit' ? <Gem size={18} className="text-purple-600"/> : <Dog className="text-[#1A1F3D] w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-[12px] truncate">{item.title}</h4>
                <p className="text-[8px] text-gray-400 uppercase">{item.petName || 'Retail'}</p>
              </div>
              <button onClick={() => removeFromCart(idx)}><X size={14} className="text-gray-300"/></button>
            </div>
            <div className="flex justify-between mt-3 pt-2 border-t border-gray-50">
               <div className="flex items-center bg-[#F5F6FA] rounded-xl p-1 gap-3">
                  <button onClick={() => updateCartQuantity(idx, -1)} className="w-6 h-6 bg-white rounded-lg flex items-center justify-center"><Minus size={12}/></button>
                  <span className="text-[10px] font-black">{item.quantity}</span>
                  <button onClick={() => updateCartQuantity(idx, 1)} className="w-6 h-6 bg-white rounded-lg flex items-center justify-center"><Plus size={12}/></button>
               </div>
               <span className="font-black text-[12px]">{currency}{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-6 space-y-4 mb-6">
        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">{t.paymentMethod}</p>
        <div className="grid grid-cols-5 gap-2">
          {(['Cash', 'Transfer', 'Credit Card', 'Package', 'Store Credit'] as const).map((method) => {
            const Icon = { Cash: Wallet, Transfer: Banknote, 'Credit Card': CreditCard, Package: Package, 'Store Credit': Gem }[method];
            const isCredit = method === 'Store Credit';
            const disabled = (method === 'Package' && availablePackages.length === 0) || (isCredit && (!selectedOwner || (selectedOwner.creditBalance || 0) < total));
            return (
              <button key={method} disabled={disabled} onClick={() => setPaymentMethod(method)} className={cn("flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all", paymentMethod === method ? "bg-[#1A1F3D] border-[#1A1F3D] text-[#D9ED5F]" : "bg-white border-gray-100 text-gray-400", disabled && "opacity-20 grayscale cursor-not-allowed")}>
                <Icon size={14} />
                <span className="text-[7px] font-black uppercase">{method === 'Store Credit' ? 'Credit' : method === 'Package' ? 'PKG' : method}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-6 border-t border-dashed border-gray-200 mt-auto">
        <div className="flex justify-between items-end">
          <span className="text-xl font-bold text-[#1A1F3D]">{t.total}</span>
          <span className="text-3xl font-extrabold text-[#1A1F3D]">{currency}{total.toFixed(2)}</span>
        </div>
        <button onClick={handleInitiatePayment} disabled={cart.length === 0} className="w-full bg-[#D9ED5F] text-[#1A1F3D] font-extrabold py-5 rounded-[28px] flex items-center justify-center gap-3 mt-6 shadow-xl transition-all"><Banknote size={20} /> {paymentMethod === 'Store Credit' ? 'Deduct Credits' : t.checkout}</button>
      </div>

      {isPaymentModalOpen && <PaymentModal total={paymentMethod === 'Store Credit' ? 0 : total} method={paymentMethod} onClose={() => setIsPaymentModalOpen(false)} onComplete={handleCompletePayment} />}
    </div>
  );
};

export default OrderSummary;