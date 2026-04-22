"use client";

import React from 'react';
import { Scissors, Bath, ShieldCheck, Zap, Plus } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useStore, Service } from '@/store/useStore';
import { toast } from 'sonner';

interface ServiceCardProps {
  id: string;
  icon: 'grooming' | 'bath' | 'nail' | 'deshedding';
  title: string;
  description: string;
  priceType: 'starting' | 'fixed';
  price: number;
  sizes?: string[];
}

const ServiceCard = ({ 
  id,
  icon, 
  title, 
  description, 
  priceType, 
  price, 
  sizes = []
}: ServiceCardProps) => {
  const addToCart = useStore((state) => state.addToCart);
  
  const IconComponent = {
    grooming: Scissors,
    bath: Bath,
    nail: Zap,
    deshedding: ShieldCheck
  }[icon];

  const handleAdd = () => {
    const service: Service = { id, icon, title, price, description };
    addToCart(service);
    toast.success(`Added ${title} to cart`);
  };

  return (
    <div className="bg-white rounded-[32px] p-6 flex flex-col h-full transition-all duration-300 hover:shadow-xl border border-transparent group">
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 bg-[#F5F6FA] rounded-xl flex items-center justify-center">
          <IconComponent className="text-[#1A1F3D] w-6 h-6" />
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
            {priceType === 'starting' ? 'Starting From' : 'Fixed Price'}
          </p>
          <p className="text-2xl font-bold text-[#1A1F3D]">${price}</p>
        </div>
      </div>

      <h3 className="text-xl font-bold text-[#1A1F3D] mb-2">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed mb-6 flex-grow">{description}</p>

      {sizes.length > 0 && (
        <div className="bg-[#F5F6FA] p-1 rounded-2xl flex gap-1 mb-4">
          {sizes.map((size) => (
            <button
              key={size}
              className={cn(
                "flex-1 py-2 px-1 text-[10px] font-bold uppercase rounded-xl transition-all",
                size === 'MEDIUM' || size === 'M' ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {size}
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