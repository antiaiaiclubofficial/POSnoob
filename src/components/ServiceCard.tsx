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
  const { addToCart, activePet, selectedOwner, activeQueueItemId, currency } = useStore();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const subServices = useMemo(() => service.subServices || [], [service.subServices]);
  const availableSizes = useMemo(() => Object.keys(service.prices), [service.prices]);

  useEffect(() => {
    setSelectedItems(subServices);
  }, [subServices]);

  useEffect(() => {
    if (availableSizes.length > 0) {
      setSelectedSize(availableSizes[0]);
    } else {
      setSelectedSize('');
    }
  }, [activePet?.id, service.id, availableSizes]);

  if (activePet && activePet.species !== service.targetSpecies) return null;

  const currentPrice = selectedSize ? service.prices[selectedSize].price : 0;
  const isFixedPrice = availableSizes.length <= 1;

  const getIconComponent = (iconName: ServiceIcon) => {
    switch(iconName) {
      case 'grooming': return Scissors;
      case 'bath': return Bath;
      case 'spa': return Sparkles;
      case 'nail': return Zap;
      case 'dry': return Wind;
      case 'health': return Stethoscope;
      case 'brush': return Brush;
      case 'hotel': return Home;
      case 'love': return Heart;
      case 'food': return Bone;
      case 'premium': return Award;
      default: return service.targetSpecies === 'Dog' ? Dog : Cat;
    }
  };

  const IconComponent = getIconComponent(service.icon);

  const toggleItem = (item: string) => {
    setSelectedItems(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleAdd = () => {
    if (!activePet || !selectedOwner) {
      toast.error("Please select a customer and pet first");
      return;
    }

    if (selectedItems.length === 0 && subServices.length > 0) {
      toast.error("Please select at least one service item");
      return;
    }

    const itemTitle = isFixedPrice ? service.title : `${service.title} (${selectedSize})`;
    const selectedText = (selectedItems.length === subServices.length || subServices.length === 0)
      ? "" 
      : ` (Excl: ${subServices.filter(s => !selectedItems.includes(s)).join(', ')})`;

    addToCart({
      id: service.id,
      icon: service.icon,
      title: itemTitle + selectedText,
      price: currentPrice,
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
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">
            {isFixedPrice ? 'Fixed Price' : 'Starting From'}
          </p>
          <p className="text-3xl font-black text-[#1A1F3D]">{currency}{currentPrice.toLocaleString()}</p>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-2xl font-black text-[#1A1F3D] mb-1">{service.title}</h3>
      </div>

      {subServices.length > 0 && (
        <div className="space-y-3 mb-8 flex-1">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest px-1">Included Services</p>
          <div className="flex flex-wrap gap-2">
            {subServices.map((item) => (
              <div 
                key={item} 
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl transition-all cursor-pointer border text-[10px] font-bold",
                  selectedItems.includes(item) 
                    ? "bg-blue-50/50 border-blue-100 text-[#1A1F3D]" 
                    : "bg-white border-gray-50 text-gray-400 opacity-60"
                )}
                onClick={() => toggleItem(item)}
              >
                <div className={cn(
                  "w-3.5 h-3.5 rounded-md border flex items-center justify-center transition-all",
                  selectedItems.includes(item) 
                    ? "bg-[#1A1F3D] border-[#1A1F3D] text-white" 
                    : "border-gray-200"
                )}>
                  {selectedItems.includes(item) && <Check size={8} strokeWidth={4} />}
                </div>
                <span className="capitalize">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isFixedPrice && (
        <div className="bg-[#F5F6FA] p-1.5 rounded-[24px] flex flex-wrap gap-1 mb-8">
          {availableSizes.map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={cn(
                "flex-1 min-w-[60px] py-2 px-2 text-[9px] font-black uppercase rounded-[18px] transition-all",
                selectedSize === size 
                  ? "bg-white text-[#1A1F3D] shadow-sm border border-gray-100" 
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              {size.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      <button 
        onClick={handleAdd}
        className="w-full bg-[#1A1F3D] hover:bg-[#2A3152] text-white font-black py-5 rounded-[24px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-[#1A1F3D]/10 mt-auto"
      >
        <Plus size={20} /> {activePet ? `Add for ${activePet.name}` : 'Add Service'}
      </button>
    </div>
  );
};

export default ServiceCard;