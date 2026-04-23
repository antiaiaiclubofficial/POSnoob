"use client";

import React, { useState, useEffect } from 'react';
import { X, Scissors, Tag, Plus, Trash2, Dog, Cat, LayoutGrid, Check, PlusCircle } from 'lucide-react';
import { useStore, Service, ServiceIcon } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SizeEntry {
  id: string;
  name: string;
  price: number;
}

interface ServiceModalProps {
  service?: Service | null;
  defaultSpecies?: 'Dog' | 'Cat';
  onClose: () => void;
}

const ServiceModal = ({ service, defaultSpecies = 'Dog', onClose }: ServiceModalProps) => {
  const { addService, updateService, currency } = useStore();
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [targetSpecies, setTargetSpecies] = useState<'Dog' | 'Cat'>(defaultSpecies);
  const [sizes, setSizes] = useState<SizeEntry[]>([]);

  useEffect(() => {
    if (service) {
      setTitle(service.title);
      setCategory(service.category);
      setDescription(service.description);
      setTargetSpecies(service.targetSpecies);
      // Convert object to array for easier editing
      const initialSizes = Object.entries(service.prices).map(([name, price]) => ({
        id: Math.random().toString(36).substr(2, 9),
        name,
        price
      }));
      setSizes(initialSizes);
    } else {
      // Default sizes for new service
      const defaultPresets = targetSpecies === 'Dog' 
        ? ['S', 'M', 'L'] 
        : ['Standard'];
      
      setSizes(defaultPresets.map(name => ({
        id: Math.random().toString(36).substr(2, 9),
        name,
        price: 0
      })));
    }
  }, [service]);

  const handleAddSize = () => {
    setSizes([...sizes, { 
      id: Math.random().toString(36).substr(2, 9), 
      name: `Size ${sizes.length + 1}`, 
      price: 0 
    }]);
  };

  const handleRemoveSize = (id: string) => {
    setSizes(sizes.filter(s => s.id !== id));
  };

  const updateSize = (id: string, field: 'name' | 'price', value: string | number) => {
    setSizes(sizes.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !category) {
      toast.error("Please fill in service name and category");
      return;
    }

    if (sizes.length === 0) {
      toast.error("Please add at least one price size");
      return;
    }

    // Convert array back to record
    const prices: Record<string, number> = {};
    sizes.forEach(s => {
      prices[s.name || 'Untitled'] = s.price;
    });

    const formData = {
      title,
      category,
      description,
      icon: 'grooming' as ServiceIcon,
      targetSpecies,
      prices
    };

    if (service) {
      updateService(service.id, formData);
      toast.success("Service updated successfully");
    } else {
      addService(formData);
      toast.success(`New ${targetSpecies} service created`);
    }
    onClose();
  };

  const isDog = targetSpecies === 'Dog';

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-4xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header Section */}
        <div className="p-10 flex justify-between items-center border-b border-gray-50">
          <div className="flex items-center gap-6">
            <div className={cn(
              "w-16 h-16 rounded-[24px] flex items-center justify-center text-white shadow-xl",
              isDog ? "bg-blue-600" : "bg-pink-600"
            )}>
              {isDog ? <Dog size={32} /> : <Cat size={32} />}
            </div>
            <div>
              <h2 className="text-3xl font-black text-[#1A1F3D]">
                {service ? `Edit ${targetSpecies} Service` : `New ${targetSpecies} Service`}
              </h2>
              <p className="text-sm text-gray-400 font-medium">Custom naming and pricing for {targetSpecies}s</p>
            </div>
          </div>
          <button onClick={onClose} className="p-4 hover:bg-gray-50 rounded-[20px] transition-all">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-10">
            {/* Left Column: General Info */}
            <div className="space-y-8">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-3 block tracking-widest px-1">Animal Type</label>
                <div className="flex gap-2 p-2 bg-[#F5F6FA] rounded-[24px]">
                  <button 
                    type="button" 
                    onClick={() => setTargetSpecies('Dog')}
                    className={cn(
                      "flex-1 py-4 text-xs font-black rounded-[18px] transition-all flex items-center justify-center gap-2",
                      isDog ? "bg-white text-blue-600 shadow-md" : "text-gray-400"
                    )}
                  >
                    <Dog size={16} /> DOG
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setTargetSpecies('Cat')}
                    className={cn(
                      "flex-1 py-4 text-xs font-black rounded-[18px] transition-all flex items-center justify-center gap-2",
                      !isDog ? "bg-white text-pink-600 shadow-md" : "text-gray-400"
                    )}
                  >
                    <Cat size={16} /> CAT
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-3 block tracking-widest px-1">Service Name</label>
                <input 
                  className="w-full bg-[#F5F6FA] border-none rounded-[24px] px-8 py-5 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={isDog ? "e.g. Bulldog Haircut" : "e.g. Persian Spa Bath"}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-3 block tracking-widest px-1">Category</label>
                <input 
                  className="w-full bg-[#F5F6FA] border-none rounded-[24px] px-8 py-5 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="Bathing, Grooming, etc."
                />
              </div>
            </div>

            {/* Right Column: Pricing Matrix */}
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-3 block tracking-widest px-1">Prices per Size</label>
              <div className={cn(
                "rounded-[40px] p-8 min-h-[380px] border-2 flex flex-col",
                isDog ? "bg-blue-50/20 border-blue-100" : "bg-pink-50/20 border-pink-100"
              )}>
                <div className="flex-1 space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                  {sizes.map((s) => (
                    <div key={s.id} className="flex gap-3 animate-in fade-in slide-in-from-right-2 duration-300">
                      <div className="flex-1">
                        <input 
                          className="w-full bg-white border-none rounded-[20px] px-6 py-4 text-xs font-black shadow-sm focus:ring-2 focus:ring-[#1A1F3D]/10"
                          value={s.name}
                          onChange={e => updateSize(s.id, 'name', e.target.value)}
                          placeholder="Size Name"
                        />
                      </div>
                      <div className="w-1/3 relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300">{currency}</span>
                        <input 
                          type="number"
                          className="w-full bg-white border-none rounded-[20px] pl-10 pr-6 py-4 text-sm font-black shadow-sm focus:ring-2 focus:ring-[#1A1F3D]/10"
                          value={s.price}
                          onChange={e => updateSize(s.id, 'price', Number(e.target.value))}
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveSize(s.id)}
                        className="p-4 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-[20px] transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  
                  {sizes.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 italic text-sm">
                      No sizes added yet.
                    </div>
                  )}
                </div>

                <button 
                  type="button" 
                  onClick={handleAddSize}
                  className={cn(
                    "w-full py-4 rounded-[22px] border-2 border-dashed font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-white",
                    isDog ? "border-blue-200 text-blue-400 hover:text-blue-600" : "border-pink-200 text-pink-400 hover:text-pink-600"
                  )}
                >
                  <PlusCircle size={18} /> Add New Price Tier
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center gap-6 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-10 py-5 text-sm font-black text-gray-400 hover:text-[#1A1F3D] transition-colors"
            >
              Cancel
            </button>
            <button className="flex-1 bg-[#D9ED5F] hover:bg-[#c8db54] text-[#1A1F3D] font-black py-5 rounded-[28px] shadow-2xl shadow-[#D9ED5F]/30 active:scale-95 text-lg">
              {service ? 'Update Service' : 'Create Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceModal;