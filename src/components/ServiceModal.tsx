"use client";

import React, { useState, useEffect } from 'react';
import { X, Scissors, Tag, Plus, Trash2, Dog, Cat, LayoutGrid, Check, PlusCircle, Clock, Sparkles, Bath } from 'lucide-react';
import { useStore, Service, ServiceIcon, ServicePriceInfo } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SizeEntry {
  id: string;
  name: string;
  price: number;
  duration: number;
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
  const [icon, setIcon] = useState<ServiceIcon>('grooming');
  const [sizes, setSizes] = useState<SizeEntry[]>([]);

  useEffect(() => {
    if (service) {
      setTitle(service.title);
      setCategory(service.category);
      setDescription(service.description);
      setTargetSpecies(service.targetSpecies);
      setIcon(service.icon);
      
      const initialSizes = Object.entries(service.prices).map(([name, info]) => ({
        id: Math.random().toString(36).substr(2, 9),
        name,
        price: info.price,
        duration: info.duration
      }));
      setSizes(initialSizes);
    } else {
      const defaultPresets = targetSpecies === 'Dog' 
        ? ['Small (< 10kg)', 'Medium (10-25kg)', 'Large (> 25kg)'] 
        : ['Standard'];
      
      setSizes(defaultPresets.map(name => ({
        id: Math.random().toString(36).substr(2, 9),
        name,
        price: 0,
        duration: 60
      })));
    }
  }, [service]);

  const handleAddSize = () => {
    setSizes([...sizes, { 
      id: Math.random().toString(36).substr(2, 9), 
      name: `Size ${sizes.length + 1}`, 
      price: 0,
      duration: 60
    }]);
  };

  const handleRemoveSize = (id: string) => {
    setSizes(sizes.filter(s => s.id !== id));
  };

  const updateSize = (id: string, field: keyof SizeEntry, value: any) => {
    setSizes(sizes.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !category) {
      toast.error("Please fill in service name and category");
      return;
    }

    if (sizes.length === 0) {
      toast.error("Please add at least one price tier");
      return;
    }

    const prices: Record<string, ServicePriceInfo> = {};
    sizes.forEach(s => {
      prices[s.name || 'Untitled'] = {
        price: s.price,
        duration: s.duration
      };
    });

    const formData = {
      title,
      category,
      description,
      icon,
      targetSpecies,
      prices,
      isActive: service ? service.isActive : true
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
      <div className="bg-white w-full max-w-5xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
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
              <p className="text-sm text-gray-400 font-medium">Define your specialized grooming treatments</p>
            </div>
          </div>
          <button onClick={onClose} className="p-4 hover:bg-gray-50 rounded-[20px] transition-all">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-10">
            {/* General Settings */}
            <div className="space-y-8">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-3 block tracking-widest px-1">Choose Icon</label>
                <div className="flex gap-3">
                  {(['grooming', 'bath', 'spa', 'nail'] as ServiceIcon[]).map((iconType) => (
                    <button
                      key={iconType}
                      type="button"
                      onClick={() => setIcon(iconType)}
                      className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all",
                        icon === iconType 
                        ? (isDog ? "bg-blue-600 border-blue-600 text-white" : "bg-pink-600 border-pink-600 text-white")
                        : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                      )}
                    >
                      {iconType === 'grooming' && <Scissors size={20} />}
                      {iconType === 'bath' && <Bath size={20} />}
                      {iconType === 'spa' && <Sparkles size={20} />}
                      {iconType === 'nail' && <Plus size={20} />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-3 block tracking-widest px-1">Service Details</label>
                <div className="space-y-4">
                  <input 
                    className="w-full bg-[#F5F6FA] border-none rounded-[24px] px-8 py-5 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Full Grooming"
                  />
                  <input 
                    className="w-full bg-[#F5F6FA] border-none rounded-[24px] px-8 py-5 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="Category (e.g. Grooming)"
                  />
                  <textarea 
                    className="w-full bg-[#F5F6FA] border-none rounded-[24px] px-8 py-5 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 h-32 resize-none"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Brief description of what's included..."
                  />
                </div>
              </div>
            </div>

            {/* Pricing Matrix */}
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-3 block tracking-widest px-1">Pricing & Duration Matrix</label>
              <div className={cn(
                "rounded-[40px] p-8 border-2 min-h-[440px] flex flex-col",
                isDog ? "bg-blue-50/20 border-blue-100" : "bg-pink-50/20 border-pink-100"
              )}>
                <div className="flex-1 space-y-4 mb-6 max-h-[350px] overflow-y-auto pr-2 scrollbar-hide">
                  <div className="flex gap-3 px-4 mb-2">
                    <span className="flex-1 text-[9px] font-black text-gray-400 uppercase tracking-widest">Pet Size / Breed</span>
                    <span className="w-24 text-[9px] font-black text-gray-400 uppercase tracking-widest">Price</span>
                    <span className="w-24 text-[9px] font-black text-gray-400 uppercase tracking-widest">Duration</span>
                    <div className="w-10" />
                  </div>
                  
                  {sizes.map((s) => (
                    <div key={s.id} className="flex gap-3 animate-in fade-in slide-in-from-right-2 duration-300">
                      <div className="flex-1">
                        <input 
                          className="w-full bg-white border-none rounded-[20px] px-6 py-4 text-xs font-black shadow-sm focus:ring-2 focus:ring-[#1A1F3D]/10"
                          value={s.name}
                          onChange={e => updateSize(s.id, 'name', e.target.value)}
                          placeholder="Small Breed"
                        />
                      </div>
                      <div className="w-24 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-300">{currency}</span>
                        <input 
                          type="number"
                          className="w-full bg-white border-none rounded-[20px] pl-7 pr-3 py-4 text-xs font-black shadow-sm focus:ring-2 focus:ring-[#1A1F3D]/10"
                          value={s.price}
                          onChange={e => updateSize(s.id, 'price', Number(e.target.value))}
                        />
                      </div>
                      <div className="w-24 relative">
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-300">min</span>
                        <input 
                          type="number"
                          className="w-full bg-white border-none rounded-[20px] pl-3 pr-7 py-4 text-xs font-black shadow-sm focus:ring-2 focus:ring-[#1A1F3D]/10"
                          value={s.duration}
                          onChange={e => updateSize(s.id, 'duration', Number(e.target.value))}
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveSize(s.id)}
                        className="p-4 text-gray-300 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
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

          {/* Actions */}
          <div className="flex gap-6 pt-4 border-t border-gray-50">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-10 py-5 text-sm font-black text-gray-400 hover:text-[#1A1F3D] transition-colors"
            >
              Cancel
            </button>
            <button className="flex-1 bg-[#1A1F3D] text-white font-black py-5 rounded-[28px] shadow-2xl shadow-[#1A1F3D]/20 active:scale-95 text-lg hover:bg-[#2A3152] transition-all">
              {service ? 'Save Service Changes' : 'Create New Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceModal;