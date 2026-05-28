"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Scissors, Bath, Sparkles, Zap, Plus, Dog, Cat, Check, 
  Wind, Stethoscope, Brush, Home, Heart, Bone, Award
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { useStore, Service, ServiceIcon } from '@/store/useStore';
import { toast } from 'sonner';

interface ServiceCardProps {
  service: Service;
}

const ServiceCard = ({ service }: ServiceCardProps) => {
  const { addToCart, activePet, selectedOwner, activeQueueItemId, currency, services } = useStore();
  const [selectedSize, setSelectedSize] = useState<string>('');

  const availableSizes = useMemo(() => Object.keys(service.prices), [service.prices]);

  useEffect(() => {
    if (availableSizes.length > 0) {
      setSelectedSize(availableSizes[0]);
    }
  }, [activePet?.id, service.id, availableSizes]);

  // Only hide mismatched species services if there are actually matching services available
  const hasMatchingServices = services.some(s => s.targetSpecies === activePet?.species && s.isActive);
  if (activePet && hasMatchingServices && activePet.species !== service.targetSpecies) return null;

  // ราคาพื้นฐานตามขนาดที่เลือก
  const totalPrice = selectedSize ? service.prices[selectedSize].price : 0;
  const isFixedPrice = availableSizes.length <= 1;

  const getIconComponent = (iconName: ServiceIcon) => {
    switch(iconName) {
      case 'grooming': return Scissors;
      case 'bath': return Bath;
      case 'spa': return Sparkles;
      case 'nail': return Zap;
      case 'dry': return Wind;
      case 'brush': return Brush;
      case 'health': return Stethoscope;
      case 'hotel': return Home;
      case 'love': return Heart;
      case 'food': return Bone;
      case 'premium': return Award;
      default: return service.targetSpecies === 'Dog' ? Dog : Cat;
    }
  };

  const IconComponent = getIconComponent(service.icon);

  const handleAdd = () => {
    if (!activePet || !selectedOwner) {
      toast.error("Please select a customer and pet first");
      return;
    }

    const itemTitle = isFixedPrice ? service.title : `${service.title} (${selectedSize})`;

    addToCart({
      id: service.id,
      icon: service.icon,
      title: itemTitle,
      price: totalPrice,
      quantity: 1,
      petId: activePet.id,
      petName: activePet.name,
      ownerName: selectedOwner.name,
      size: isFixedPrice ? undefined : selectedSize,
      queueItemId: activeQueueItemId || undefined,
      type: 'Service'
    });
    toast.success(`Added ${service.title} for ${activePet.name}`);
  };

  return (
    <div className="bg-white rounded-[40px] p-8 flex flex-col h-full transition-all duration-300 border border-transparent group hover:shadow-2xl hover:border-gray-100">
      <div className="flex justify-between items-start mb-6">
        <div className="w-14 h-14 bg-[#F5F6FA] rounded-[20px] flex items-center justify-center text-[#1A1F3D] transition-transform group-hover:scale-110">
          <IconComponent className="w-7 h-7" />
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Total Price</p>
          <p className="text-3xl font-black text-[#1A1F3D]">{currency}{totalPrice.toLocaleString()}</p>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-2xl font-black text-[#1A1F3D] mb-1">{service.title}</h3>
        <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{service.description}</p>
      </div>

      {!isFixedPrice && (
        <div className="bg-[#F5F6FA] p-1.5 rounded-[24px] flex flex-wrap gap-1 mb-8 mt-auto">
          {availableSizes.map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={cn(
                "flex-1 min-w-[60px] py-3 px-2 text-[9px] font-black uppercase rounded-[18px] transition-all",
                selectedSize === size ? "bg-white text-[#1A1F3D] shadow-sm border border-gray-100" : "text-gray-400"
              )}
            >
              {size.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      <button 
        onClick={handleAdd}
        className={cn(
          "w-full bg-[#1A1F3D] text-white font-black py-5 rounded-[24px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-[#1A1F3D]/10",
          isFixedPrice && "mt-auto"
        )}
      >
        <Plus size={20} /> {activePet ? `Add for ${activePet.name}` : 'Add Service'}
      </button>
    </div>
  );
};

export default ServiceCard;