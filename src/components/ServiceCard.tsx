"use client";

import React, { useState, useEffect } from 'react';
import { Scissors, Bath, ShieldCheck, Zap, Plus } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useStore, Service, ServiceIcon } from '@/store/useStore';
import { toast } from 'sonner';

interface ServiceCardProps {
  service: Service;
}

const ServiceCard = ({ service }: ServiceCardProps) => {
  const { addToCart, activePet, selectedOwner, activeQueueItemId } = useStore();
  const [selectedSize, setSelectedSize] = useState<string>('');

  const petSpecies = activePet?.species === 'Cat' ? 'cat' : 'dog';
  const availableSizes = Object.keys(service.prices[petSpecies]);

  // Reset selected size when pet changes
  useEffect(() => {
    if (availableSizes.length > 0) {
      setSelectedSize(availableSizes[0]);
    } else {
      setSelectedSize('');
    }
  }, [activePet, service.id]);

  const currentPrice = selectedSize ? service.prices[petSpecies][selectedSize] : 0;

  const IconComponent = {
    grooming: Scissors,
    bath: Bath,
    nail: Zap,
    deshedding: ShieldCheck
  }[service.icon as ServiceIcon] || Scissors;

  const handleAdd = () => {
    if (!activePet || !selectedOwner) {
      toast.error("Please select a customer first");
      return;
    }

    if (!selectedSize) {
      toast.error(`No pricing available for ${activePet.species}s`);
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

  return (
    <div className={cn(
      "bg-white rounded-[32px] p-6 flex flex-col h-full transition-all duration-300 border border-transparent group",
      !activePet ? "opacity-60 grayscale-[0.5]" : "hover:shadow-xl hover:border-gray-100"
    )}>
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 bg-[#F5F6FA] rounded-xl flex items-center justify-center">
          <IconComponent className="text-[#1A1F3D] w-6 h-6" />
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
            {activePet ? `${activePet.species} Pricing` : 'Select Pet'}
          </p>
          <p className="text-2xl font-bold text-[#1A1F3D]">${currentPrice}</p>
        </div>
      </div>

      <h3 className="text-xl font-bold text-[#1A1F3D] mb-2">{service.title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed mb-6 flex-grow">{service.description}</p>

      {availableSizes.length > 0 ? (
        <div className="bg-[#F5F6FA] p-1 rounded-2xl flex gap-1 mb-4 overflow-x-auto scrollbar-hide">
          {availableSizes.map((size) => (
            <button
              key={size}
              disabled={!activePet}
              onClick={() => setSelectedSize(size)}
              className={cn(
                "flex-1 py-2 px-3 text-[10px] font-bold uppercase rounded-xl transition-all whitespace-nowrap",
                selectedSize === size ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {size}
            </button>
          ))}
        </div>
      ) : (
        <div className="mb-4 py-2 px-3 bg-red-50 text-red-500 rounded-xl text-[10px] font-bold text-center">
          No pricing set for {activePet?.species || 'pets'}
        </div>
      )}

      <button 
        onClick={handleAdd}
        disabled={!activePet || !selectedSize}
        className="w-full bg-[#0A0F2C] text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 hover:bg-[#1a1f3d] disabled:bg-gray-200 disabled:text-gray-400"
      >
        <Plus size={18} /> {activePet ? `Add for ${activePet.name}` : 'Select Pet First'}
      </button>
    </div>
  );
};

export default ServiceCard;