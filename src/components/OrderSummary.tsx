"use client";

import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Dog, ArrowDownCircle, Banknote, Scale, Check, Save, CreditCard, Wallet, X, Trash2, Package, Plus, Minus, FileText
} from 'lucide-react';
import { useStore, PaymentMethod } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import PaymentModal from './PaymentModal';
import { translations } from '@/utils/translations';
import { Switch } from "@/components/ui/switch";

interface OrderSummaryProps {
  isMobile?: boolean;
}

const OrderSummary = ({ isMobile }: OrderSummaryProps) => {
  const { cart, removeFromCart, updateCartQuantity, clearCart, selectedOwner, activePet, markAsPaid, processPayment, updatePetWeight, tierRules, services, inventory, addToCart, currency, language } = useStore();
  const t = translations[language];
  
  const [newWeight, setNewWeight] = useState('');
  const [isWeightSaved, setIsWeightSaved] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [isTaxInvoice, setIsTaxInvoice] = useState(false);
  const [barcodeQuery, setBarcodeQuery] = useState('');

  useEffect(() => {
    setNewWeight('');
    setIsWeightSaved(false);
    setSelectedPackageId(null);
  }, [activePet]);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOwner) {
      toast.error("Please select a customer first");
      setBarcodeQuery('');
      return;
    }
    const product = inventory.find(i => i.barcode === barcodeQuery);
    if (product) {
      addToCart({
        id: product.id,
        title: product.name,
        price: product.price,
        quantity: 1,
        ownerName: selectedOwner.name,
        type: 'Product'
      });
      toast.success(`Scanned: ${product.name}`);
    } else {
      toast.error("Barcode not found");
    }
    setBarcodeQuery('');
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const userTier = selectedOwner ? tierRules.find(r => r.level === selectedOwner.membership) : null;
  const tierDiscountPercent = userTier?.discount || 0;
  const discountAmount = (subtotal * tierDiscountPercent) / 100;
  const tax = (subtotal - discountAmount) * 0.07;
  const total = subtotal - discountAmount + tax;

  const availablePackages = selectedOwner?.packages?.filter(pkg => {
    return cart.some(item => pkg.targetServiceId === item.id && pkg.remainingSlots > 0);
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
    processPayment(selectedOwner.id, total, discountAmount, cart, paymentMethod, finalDetails, isTaxInvoice);
    cart.forEach(item => { if (item.queueItemId) markAsPaid(item.queueItemId); });
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

      <form onSubmit={handleBarcodeSubmit} className="mb-6">
        <div className="relative">
          <Package size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
          <input 
            className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-10 pr-4 py-3 text-[10px] font-bold focus:ring-2 focus:ring-[#1A1F3D]/5"
            placeholder="Scan Barcode / Enter code..."
            value={barcodeQuery}
            onChange={e => setBarcodeQuery(e.target.value)}
          />
        </div>
      </form>

      {activePet && (
        <div className="mb-6 p-5 bg-[#F5F6FA] rounded-[28px] border border-blue-100/50 shadow-sm transition-all">
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
            <input type="number" placeholder="0.0" className="flex-1 bg-white border-none rounded-2xl px-5 py-3.5 text-sm font-black focus:ring-2 focus:ring-blue-500/20" value={newWeight} onChange={(e) => { setNewWeight(e.target.value); setIsWeightSaved(false); }} />
            <button onClick={handleSaveWeight} disabled={!newWeight || isWeightSaved} className={cn("px-4 rounded-2xl transition-all flex items-center justify-center", isWeightSaved ? "bg-green-500 text-white" : "bg-[#1A1F3D] text-white")}>
              {isWeightSaved ? <Check size={18} /> : <Save size={18} />}
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-10">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4"><ShoppingBag size={32} className="text-gray-400" /></div>
            <p className="text-sm font-bold text-gray-500">Cart is empty</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">{t.services}</p>
            {cart.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="flex flex-col gap-3 p-4 bg-white border border-gray-100 rounded-[24px] shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#F5F6FA] rounded-xl flex items-center justify-center shrink-0">
                    <Dog className="text-[#1A1F3D] w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[#1A1F3D] text-[12px] leading-tight truncate">{item.title}</h4>
                    <p className="text-[8px] text-gray-400 font-black uppercase mt-0.5">{item.petName || 'Retail Item'}</p>
                  </div>
                  <button onClick={() => removeFromCart(idx)} className="p-1.5 text-red-200 hover:text-red-500"><X size={14} /></button>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                   <div className="flex items-center bg-[#F5F6FA] rounded-xl p-1 gap-3">
                      <button onClick={() => updateCartQuantity(idx, -1)} className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-gray-400 hover:text-[#1A1F3D]"><Minus size={12} /></button>
                      <span className="text-[10px] font-black w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateCartQuantity(idx, 1)} className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-gray-400 hover:text-[#1A1F3D]"><Plus size={12} /></button>
                   </div>
                   <span className="font-black text-[12px] text-[#1A1F3D]">{currency}{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-6 mb-6 space-y-4">
        <div className="bg-[#F8F9FD] p-4 rounded-2xl flex items-center justify-between border border-gray-100">
           <div className="flex items-center gap-2">
              <FileText size={16} className="text-gray-400" />
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{language === 'th' ? 'ขอใบกำกับภาษี' : 'Tax Invoice'}</span>
           </div>
           <Switch checked={isTaxInvoice} onCheckedChange={setIsTaxInvoice} className="data-[state=checked]:bg-[#1A1F3D]" />
        </div>

        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">{t.paymentMethod}</p>
        <div className="grid grid-cols-4 gap-2">
          {(['Cash', 'Transfer', 'Credit Card', 'Package'] as const).map((method) => {
            const Icon = method === 'Cash' ? Wallet : method === 'Transfer' ? Banknote : method === 'Credit Card' ? CreditCard : Package;
            const isDisabled = method === 'Package' && availablePackages.length === 0;
            return (
              <button key={method} disabled={isDisabled} onClick={() => setPaymentMethod(method)} className={cn("flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all", paymentMethod === method ? "bg-[#1A1F3D] border-[#1A1F3D] text-[#D9ED5F] shadow-lg" : "bg-white border-gray-100 text-gray-400", isDisabled && "opacity-20 cursor-not-allowed grayscale")}>
                <Icon size={16} />
                <span className="text-[8px] font-black uppercase">{method === 'Package' ? "PKG" : method}</span>
              </button>
            );
          })}
        </div>
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
          <span className="text-3xl font-extrabold text-[#1A1F3D]">{paymentMethod === 'Package' ? "0.00" : `${currency}${total.toFixed(2)}`}</span>
        </div>
      </div>

      <button onClick={handleInitiatePayment} disabled={cart.length === 0} className="w-full bg-[#D9ED5F] text-[#1A1F3D] font-extrabold py-5 rounded-[28px] flex items-center justify-center gap-3 mt-6 shadow-xl transition-all">
        <Banknote size={20} /> {paymentMethod === 'Package' ? "Deduct from Package" : t.checkout}
      </button>

      {isPaymentModalOpen && <PaymentModal total={paymentMethod === 'Package' ? 0 : total} method={paymentMethod} onClose={() => setIsPaymentModalOpen(false)} onComplete={handleCompletePayment} />}
    </div>
  );
};

export default OrderSummary;