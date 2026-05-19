"use client";

import React, { useState, useEffect } from 'react';
import { X, Plus, Sparkles, Zap, Check } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AddOnModalProps {
  addOn: { id: string; name: string; defaultPrice: number; icon: any } | null;
  onClose: () => void;
}

const AddOnModal = ({ addOn, onClose }: AddOnModalProps) => {
  const { addToCart, activePet, selectedOwner, currency } = useStore();
  const [price, setPrice] = useState<string>('');

  useEffect(() => {
    if (addOn) {
      setPrice(addOn.defaultPrice.toString());
    }
  }, [addOn]);

  if (!addOn) return null;

  const handleAdd = () => {
    if (!activePet || !selectedOwner) {
      toast.error("Please select a customer and pet first");
      return;
    }

    const finalPrice = Number(price);
    if (isNaN(finalPrice)) {
      toast.error("Invalid price");
      return;
    }

    addToCart({
      id: `addon-${addOn.id}`,
      title: `${addOn.name} (Add-on)`,
      price: finalPrice,
      quantity: 1,
      petId: activePet.id,
      petName: activePet.name,
      ownerName: selectedOwner.name,
      type: 'Service'
    });

    toast.success(`Added ${addOn.name} for ${activePet.name}`);
    onClose();
  };

  const Icon = addOn.icon;

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1A1F3D] rounded-2xl flex items-center justify-center text-[#D9ED5F]">
              <Icon size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1A1F3D]">{addOn.name}</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Adjust Price & Add</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 mb-3 block tracking-widest text-center">Set Service Price</label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-200">{currency}</span>
              <input 
                type="number"
                autoFocus
                className="w-full bg-[#F5F6FA] border-none rounded-[24px] pl-14 pr-8 py-6 text-3xl font-black text-center text-[#1A1F3D] focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
              />
            </div>
          </div>

          <div className="flex gap-2">
            {[50, 100, 150, 200].map(amt => (
              <button 
                key={amt}
                onClick={() => setPrice(amt.toString())}
                className={cn(
                  "flex-1 py-3 rounded-xl text-[10px] font-black transition-all border",
                  price === amt.toString() ? "bg-[#1A1F3D] border-[#1A1F3D] text-white shadow-lg" : "bg-white border-gray-100 text-gray-400 hover:bg-gray-50"
                )}
              >
                {currency}{amt}
              </button>
            ))}
          </div>

          <button 
            onClick={handleAdd}
            className="w-full bg-[#1A1F3D] text-white font-black py-5 rounded-[24px] flex items-center justify-center gap-3 shadow-xl shadow-[#1A1F3D]/10 active:scale-95 transition-all"
          >
            <Plus size={20} /> Add to Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddOnModal;