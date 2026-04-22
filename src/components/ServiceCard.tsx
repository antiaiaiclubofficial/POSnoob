"use client";

import React, { useState } from 'react';
import { Scissors, Bath, ShieldCheck, Zap, Plus } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useStore, Service, ServiceIcon } from '@/store/useStore';
import { toast } from 'sonner';

interface ServiceCardProps {
  service: Service;
}

const ServiceCard = ({ service }: ServiceCardProps) => {
  const { addToCart, currentPet } = useStore();
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L'>('M');
  
  const isSizeBased = typeof service.prices === 'object';
  const currentPrice = isSizeBased ? service.prices[selectedSize] : service.prices;

  const IconComponent = {
    grooming: Scissors,
    bath: Bath,
    nail: Zap,
    deshedding: ShieldCheck
  }[service.icon as ServiceIcon];

  const handleAdd = () => {
    addToCart({
      id: service.id,
      icon: service.icon,
      title: `${service.title}${isSizeBased ? ` (${selectedSize})` : ''}`,
      price: currentPrice,
      petName: currentPet?.name || 'Walk-in',
      size: isSizeBased ? selectedSize : undefined
    });
    toast.success(`Added ${service.title} to cart`);
  };

  return (
    <div className="bg-white rounded-[32px] p-6 flex flex-col h-full transition-all duration-300 hover:shadow-xl border border-transparent group">
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 bg-[#F5F6FA] rounded-xl flex items-center justify-center">
          <IconComponent className="text-[#1A1F3D] w-6 h-6" />
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
            {isSizeBased ? 'Starting From' : 'Fixed Price'}
          </p>
          <p className="text-2xl font-bold text-[#1A1F3D]">${currentPrice}</p>
        </div>
      </div>

      <h3 className="text-xl font-bold text-[#1A1F3D] mb-2">{service.title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed mb-6 flex-grow">{service.description}</p>

      {isSizeBased && (
        <div className="bg-[#F5F6FA] p-1 rounded-2xl flex gap-1 mb-4">
          {(['S', 'M', 'L'] as const).map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={cn(
                "flex-1 py-2 px-1 text-[10px] font-bold uppercase rounded-xl transition-all",
                selectedSize === size ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {size === 'S' ? 'SMALL' : size === 'M' ? 'MEDIUM' : 'LARGE'}
            </button>
          ))}
        </div>
      )}

      <button 
        onClick={handleAdd}
        className="w-full bg-[#0A0F2C] text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 hover:bg-[#1a1f3d]"
      >
        <Plus size={18} /> Add to Cart
      </button>
    </div>
  );
};

export default ServiceCard;