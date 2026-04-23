"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Scissors, Bath, ShieldCheck, Zap, Plus, Dog, Cat, Sparkles, Check } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useStore, Service, ServiceIcon } from '@/store/useStore';
import { toast } from 'sonner';
import { Checkbox } from "@/components/ui/checkbox";

interface ServiceCardProps {
  service: Service;
}

const ServiceCard = ({ service }: ServiceCardProps) => {
  const { addToCart, activePet, selectedOwner, activeQueueItemId, currency } = useStore();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // แยกรายการบริการย่อยจาก description
  const subServices = useMemo(() => {
    if (!service.description) return [];
    // ตัดคำว่า "Includes" ออกถ้ามี และแยกด้วย comma หรือ "and"
    const cleanDesc = service.description.replace(/^Includes\s+/i, '');
    return cleanDesc.split(/,|\sand\s/).map(item => item.trim()).filter(item => item !== "");
  }, [service.description]);

  useEffect(() => {
    // เลือกทุกรายการเป็นค่าเริ่มต้น
    setSelectedItems(subServices);
  }, [subServices]);

  const availableSizes = Object.keys(service.prices);

  useEffect(() => {
    if (availableSizes.length > 0) {
      setSelectedSize(availableSizes[0]);
    } else {
      setSelectedSize('');
    }
  }, [activePet, service.id, availableSizes]);

  if (!activePet || activePet.species !== service.targetSpecies) return null;

  const currentPrice = selectedSize ? service.prices[selectedSize].price : 0;
  const isFixedPrice = availableSizes.length <= 1;

  const IconComponent = {
    grooming: Scissors,
    bath: Bath,
    nail: Zap,
    deshedding: ShieldCheck,
    spa: Sparkles
  }[service.icon as ServiceIcon] || (service.targetSpecies === 'Dog' ? Dog : Cat);

  const toggleItem = (item: string) => {
    setSelectedItems(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleAdd = () => {
    if (!activePet || !selectedOwner) {
      toast.error("Please select a customer first");
      return;
    }

    if (selectedItems.length === 0) {
      toast.error("Please select at least one service item");
      return;
    }

    const itemTitle = isFixedPrice ? service.title : `${service.title} (${selectedSize})`;
    // สร้างรายละเอียดเพิ่มเติมสำหรับรายการที่เลือก
    const selectedText = selectedItems.length === subServices.length 
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

      {/* Content: Title */}
      <div className="mb-4">
        <h3 className="text-2xl font-black text-[#1A1F3D] mb-1">{service.title}</h3>
      </div>

      {/* Sub-services Checkboxes */}
      <div className="space-y-3 mb-8 flex-1">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest px-1">Included Services</p>
        <div className="space-y-2">
          {subServices.map((item) => (
            <div 
              key={item} 
              className={cn(
                "flex items-center gap-3 p-3 rounded-2xl transition-all cursor-pointer border",
                selectedItems.includes(item) 
                  ? "bg-blue-50/30 border-blue-100/50" 
                  : "bg-white border-transparent opacity-40"
              )}
              onClick={() => toggleItem(item)}
            >
              <div className={cn(
                "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all",
                selectedItems.includes(item) 
                  ? "bg-[#1A1F3D] border-[#1A1F3D] text-white" 
                  : "border-gray-200"
              )}>
                {selectedItems.includes(item) && <Check size={12} strokeWidth={4} />}
              </div>
              <span className={cn(
                "text-xs font-bold transition-all capitalize",
                selectedItems.includes(item) ? "text-[#1A1F3D]" : "text-gray-400"
              )}>
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Size Selector */}
      {!isFixedPrice && (
        <div className="bg-[#F5F6FA] p-1.5 rounded-[24px] flex flex-wrap gap-1 mb-8">
          {availableSizes.map((size) => (
            <button
              key={size}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedSize(size);
              }}
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

      {/* Action Button */}
      <button 
        onClick={handleAdd}
        className="w-full bg-[#1A1F3D] hover:bg-[#2A3152] text-white font-black py-5 rounded-[24px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-[#1A1F3D]/10"
      >
        <Plus size={20} /> Add for {activePet.name}
      </button>
    </div>
  );
};

export default ServiceCard;