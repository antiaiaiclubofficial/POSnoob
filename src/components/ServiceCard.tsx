"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Scissors, Bath, Sparkles, Zap, Plus, Dog, Cat, Check, 
  Wind, Stethoscope, Brush, Home, Heart, Bone, Award
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { useStore, Service, ServiceIcon, walkInCustomer } from '@/store/useStore';
import { toast } from 'sonner';

interface ServiceCardProps {
  service: Service;
}

const ServiceCard = ({ service }: ServiceCardProps) => {
  const { addToCart, activePet, selectedOwner, activeQueueItemId, currency, services, language } = useStore();
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
    const owner = selectedOwner || walkInCustomer;
    const pet = activePet || (service.targetSpecies === 'Cat' ? owner.pets.find(p => p.species === 'Cat') : owner.pets.find(p => p.species === 'Dog')) || owner.pets[0];


    const itemTitle = isFixedPrice ? service.title : `${service.title} (${selectedSize})`;

    addToCart({
      id: service.id,
      icon: service.icon,
      title: itemTitle,
      price: totalPrice,
      quantity: 1,
      petId: pet.id,
      petName: pet.name,
      ownerName: selectedOwner?.name || walkInCustomer.name,
      size: isFixedPrice ? undefined : selectedSize,
      queueItemId: activeQueueItemId || undefined,
      type: 'Service'
    });
    toast.success(language === 'th' ? `เพิ่ม ${service.title} สำหรับ ${pet.name}` : `Added ${service.title} for ${pet.name}`);
  };

  return (
    <div className="bg-white rounded-[40px] p-8 flex flex-col h-full transition-all duration-300 border border-transparent group hover:shadow-2xl hover:border-gray-100">
      <div className="flex justify-between items-start mb-6">
        <div className="w-14 h-14 bg-[#F5F6FA] rounded-[20px] flex items-center justify-center text-[#1A1F3D] transition-transform group-hover:scale-110">
          <IconComponent className="w-7 h-7" />
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">
            {language === 'th' ? 'ราคารวม' : 'Total Price'}
          </p>
          <p className="text-3xl font-black text-[#1A1F3D]">{currency}{totalPrice.toLocaleString()}</p>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-2xl font-black text-[#1A1F3D] mb-1">{service.title}</h3>
        {service.description && (
          <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-2">{service.description}</p>
        )}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {service.targetSpecies && (
            <span className={cn(
              "px-2 py-1 rounded-md text-[10px] font-black flex items-center gap-1 border",
              service.targetSpecies === 'Dog' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-orange-50 text-orange-600 border-orange-100"
            )}>
              {service.targetSpecies === 'Dog' ? <Dog size={10} /> : <Cat size={10} />}
              {language === 'th' 
                ? (service.targetSpecies === 'Dog' ? 'สุนัข' : service.targetSpecies === 'Cat' ? 'แมว' : service.targetSpecies)
                : service.targetSpecies}
            </span>
          )}
          <span className="px-2 py-1 rounded-md text-[10px] font-black flex items-center gap-1 border bg-gray-50 text-gray-600 border-gray-200">
            {(!service.coatType || service.coatType === 'All') 
              ? (language === 'th' ? 'ทุกประเภทขน' : 'All Coats')
              : (language === 'th' 
                  ? (service.coatType === 'Short' ? 'ขนสั้น' : service.coatType === 'Long' ? 'ขนยาว' : service.coatType)
                  : `${service.coatType} Coat`)}
          </span>
        </div>
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
        <Plus size={20} /> 
        {activePet 
          ? (language === 'th' ? `เพิ่มให้ ${activePet.name}` : `Add for ${activePet.name}`) 
          : (language === 'th' ? 'เพิ่มบริการ' : 'Add Service')}
      </button>
    </div>
  );
};

export default ServiceCard;