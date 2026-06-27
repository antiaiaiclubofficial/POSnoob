"use client";

import React from 'react';
import { Package, Plus, ShoppingBag } from 'lucide-react';
import { useStore, InventoryItem } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: InventoryItem;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart, selectedOwner, currency, partners } = useStore();

  const handleAdd = () => {
    if (!selectedOwner) {
      toast.error("Please select a customer first");
      return;
    }

    if (product.stock <= 0) {
      toast.error("Item out of stock");
      return;
    }

    const partner = partners.find(p => p.id === product.partnerId);
    const resolvedRate = product.consignmentRate || (partner ? partner.gpRate : 0);

    addToCart({
      id: product.id,
      title: product.name,
      price: product.price,
      quantity: 1,
      ownerName: selectedOwner.name,
      type: 'Product',
      isConsignment: product.isConsignment,
      partnerId: product.partnerId,
      consignmentRate: resolvedRate
    });
    toast.success(`Added ${product.name} to cart`);
  };

  return (
    <div className="bg-white rounded-[40px] p-6 flex flex-col h-full transition-all duration-300 border border-transparent group hover:shadow-2xl hover:border-gray-100">
      <div className="relative mb-6">
        <div className="aspect-square rounded-[32px] overflow-hidden bg-[#F5F6FA]">
          {product.image ? (
            <img src={product.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={product.name} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-200">
              <Package size={48} />
            </div>
          )}
        </div>
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
          <p className="text-[10px] font-black text-[#1A1F3D]">{currency}{product.price.toLocaleString()}</p>
        </div>
      </div>

      <div className="mb-6 flex-1">
        <h3 className="text-lg font-black text-[#1A1F3D] mb-1 line-clamp-1">{product.name}</h3>
        <div className="flex items-center gap-2">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{product.category}</p>
          <span className={cn(
            "text-[8px] font-black uppercase px-2 py-0.5 rounded-full border",
            product.isConsignment 
              ? "bg-indigo-50 text-indigo-600 border-indigo-100/50" 
              : "bg-gray-50 text-gray-500 border-gray-100/50"
          )}>
            {product.isConsignment ? "ฝากขาย" : "ขายเอง"}
          </span>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${product.stock > product.minStock ? 'bg-green-500' : 'bg-orange-500'}`} />
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
            {product.stock} {product.unit}s Available
          </span>
        </div>
      </div>

      <button 
        onClick={handleAdd}
        disabled={product.stock <= 0}
        className="w-full bg-[#1A1F3D] hover:bg-[#2A3152] disabled:bg-gray-100 disabled:text-gray-300 text-white font-black py-4 rounded-[24px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-[#1A1F3D]/10"
      >
        <ShoppingBag size={18} /> Add to Cart
      </button>
    </div>
  );
};

export default ProductCard;