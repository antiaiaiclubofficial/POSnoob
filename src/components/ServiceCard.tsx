"use client";

import React, { useState, useEffect } from 'react';
import { Scissors, Bath, ShieldCheck, Zap, Plus, Dog, Cat } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useStore, Service, ServiceIcon } from '@/store/useStore';
import { toast } from 'sonner';

interface ServiceCardProps {
  service: Service;
}

const ServiceCard = ({ service }: ServiceCardProps) => {
  const { addToCart, activePet, selectedOwner, activeQueueItemId, currency } = useStore();
  const [selectedSize, setSelectedSize] = useState<string>('');

  // กรองการแสดงผล: แสดงเฉพาะบริการที่ตรงกับสายพันธุ์สัตว์ที่ Active อยู่
  if (!activePet || activePet.species !== service.targetSpecies) return null;

  const availableSizes = Object.keys(service.prices);

  useEffect(() => {
    if (availableSizes.length > 0) {
      setSelectedSize(availableSizes[0]);
    } else {
      setSelectedSize('');
    }
  }, [activePet, service.id]);

  const currentPrice = selectedSize ? service.prices[selectedSize].price : 0;

  const IconComponent = {
    grooming: Scissors,
    bath: Bath,
    nail: Zap,
    deshedding: ShieldCheck
  }[service.icon as ServiceIcon] || (service.targetSpecies === 'Dog' ? Dog : Cat);

  const handleAdd = () => {
    if (!activePet || !selectedOwner) {
      toast.error("Please select a customer first");
      return;
    }

    addToCart({
      id: service.id,
      icon: service.icon,
      title: `${service.title} (${selectedSize})`,
      price: currentPrice,
      petId: activePet.id,
      petName: activePet.name,
      ownerName: selectedOwner.name,
      size: selectedSize,
      queueItemId: activeQueueItemId || undefined
    });
    toast.success(`Added ${service.title} for ${activePet.name}`);
  };

  const isDog = service.targetSpecies === 'Dog';

  return (
    <div className={cn(
      "bg-white rounded-[32px] p-6 flex flex-col h-full transition-all duration-300 border border-transparent group hover:shadow-xl hover:border-gray-100",
      isDog ? "hover:border-blue-100" : "hover:border-pink-100"
    )}>
      <div className="flex justify-between items-start mb-6">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
          isDog ? "bg-blue-50 text-blue-600" : "bg-pink-50 text-pink-600"
        )}>
          <IconComponent className="w-6 h-6" />
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Price ({selectedSize})</p>
          <p className="text-2xl font-black text-[#1A1F3D]">{currency}{currentPrice}</p>
        </div>
      </div>

      <h3 className="text-xl font-black text-[#1A1F3D] mb-2">{service.title}</h3>
      <p className="text-xs text-gray-400 leading-relaxed mb-6 flex-grow">{service.description}</p>

      {availableSizes.length > 0 && (
        <div className="bg-[#F5F6FA] p-1.5 rounded-2xl flex gap-1.5 mb-5 overflow-x-auto scrollbar-hide">
          {availableSizes.map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={cn(
                "flex-1 py-2 px-3 text-[10px] font-black uppercase rounded-xl transition-all whitespace-nowrap",
                selectedSize === size 
                  ? (isDog ? "bg-blue-600 text-white shadow-md" : "bg-pink-600 text-white shadow-md") 
                  : "bg-white text-gray-400 hover:text-gray-600 shadow-sm"
              )}
            >
              {size}
            </button>
          ))}
        </div>
      )}

      <button 
        onClick={handleAdd}
        className={cn(
          "w-full text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg",
          isDog ? "bg-blue-600 hover:bg-blue-700 shadow-blue-600/10" : "bg-pink-600 hover:bg-pink-700 shadow-pink-600/10"
        )}
      >
        <Plus size={18} /> Add for {activePet.name}
      </button>
    </div>
  );
};

export default ServiceCard;