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
  const { addToCart, selectedPet } = useStore();
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
    if (!selectedPet) {
      toast.error("Please select a pet first");
      return;
    }

    addToCart({
      id: service.id,
      icon: service.icon,
      title: `${service.title}${isSizeBased ? ` (${selectedSize})` : ''}`,
      price: currentPrice,
      petId: selectedPet.pet.id,
      petName: selectedPet.pet.name,
      ownerName: selectedPet.owner.name,
      size: isSizeBased ? selectedSize : undefined
    });
    toast.success(`Added ${service.title} for ${selectedPet.pet.name}`);
  };

  return (
    <div className={cn(
      "bg-white rounded-[32px] p-6 flex flex-col h-full transition-all duration-300 border border-transparent group",
      !selectedPet ? "opacity-60 grayscale-[0.5]" : "hover:shadow-xl hover:border-gray-100"
    )}>
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 bg-[#F5F6FA] rounded-xl flex items-center justify-center">
          <IconComponent className="text-[#1A1F3D] w-6 h-6" />
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
            {isSizeBased ? 'Based on Size' : 'Fixed Price'}
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
              disabled={!selectedPet}
              onClick={() => setSelectedSize(size)}
              className={cn(
                "flex-1 py-2 px-1 text-[10px] font-bold uppercase rounded-xl transition-all",
                selectedSize === size ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {size === 'S' ? 'Small' : size === 'M' ? 'Medium' : 'Large'}
            </button>
          ))}
        </div>
      )}

      <button 
        onClick={handleAdd}
        disabled={!selectedPet}
        className="w-full bg-[#0A0F2C] text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 hover:bg-[#1a1f3d] disabled:bg-gray-200 disabled:text-gray-400"
      >
        <Plus size={18} /> {selectedPet ? 'Add to Cart' : 'Select Pet First'}
      </button>
    </div>
  );
};

export default ServiceCard;