"use client";

import React, { useState, useEffect } from 'react';
import { Scissors, Bath, ShieldCheck, Zap, Plus, Dog, Cat, Sparkles } from 'lucide-react';
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
  const isFixedPrice = availableSizes.length <= 1;

  const IconComponent = {
    grooming: Scissors,
    bath: Bath,
    nail: Zap,
    deshedding: ShieldCheck,
    spa: Sparkles
  }[service.icon as ServiceIcon] || (service.targetSpecies === 'Dog' ? Dog : Cat);

  const handleAdd = () => {
    if (!activePet || !selectedOwner) {
      toast.error("Please select a customer first");
      return;
    }

    addToCart({
      id: service.id,
      icon: service.icon,
      title: isFixedPrice ? service.title : `${service.title} (${selectedSize})`,
      price: currentPrice,
      petId: activePet.id,
      petName: activePet.name,
      ownerName: selectedOwner.name,
      size: isFixedPrice ? undefined : selectedSize,
      queueItemId: activeQueueItemId || undefined
    });
    toast.success(`Added ${service.title} for ${activePet.name}`);
  };

  return (
    <div className="bg-white rounded-[40px] p-8 flex flex-col h-full transition-all duration-300 border border-transparent group hover:shadow-2xl hover:border-gray-100">
      {/* Header: Icon & Price */}
      <div className="flex justify-between items-start mb-6">
        <div className="w-14 h-14 bg-[#F5F6FA] rounded-[20px] flex items-center justify-center text-[#1A1F3D] transition-transform group-hover:scale-110">
          <IconComponent className="w-7 h-7" />
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">
            {isFixedPrice ? 'Fixed Price' : 'Starting From'}
          </p>
          <p className="text-3xl font-black text-[#1A1F3D]">{currency}{currentPrice}</p>
        </div>
      </div>

      {/* Content: Title & Description */}
      <div className="mb-8">
        <h3 className="text-2xl font-black text-[#1A1F3D] mb-2">{service.title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed font-medium">{service.description}</p>
      </div>

      {/* Size Selector: Pill Style */}
      {!isFixedPrice && (
        <div className="bg-[#F5F6FA] p-1.5 rounded-[24px] flex gap-1 mb-8">
          {availableSizes.map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={cn(
                "flex-1 py-2.5 px-4 text-[10px] font-black uppercase rounded-[18px] transition-all whitespace-nowrap",
                selectedSize === size 
                  ? "bg-white text-[#1A1F3D] shadow-sm" 
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              {size.split(' ')[0]} {/* แสดงแค่คำแรก เช่น Small, Medium, Large */}
            </button>
          ))}
        </div>
      )}

      {/* Action Button */}
      <button 
        onClick={handleAdd}
        className="w-full bg-[#1A1F3D] hover:bg-[#2A3152] text-white font-black py-5 rounded-[24px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-[#1A1F3D]/10 mt-auto"
      >
        <Plus size={20} /> Add for {activePet.name}
      </button>
    </div>
  );
};

export default ServiceCard;