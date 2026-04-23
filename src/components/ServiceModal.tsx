"use client";

import React, { useState, useEffect } from 'react';
import { X, Scissors, Tag, Plus, Trash2, Dog, Cat, FileText, LayoutGrid } from 'lucide-react';
import { useStore, Service, ServiceIcon } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ServiceModalProps {
  service?: Service | null;
  defaultSpecies?: 'Dog' | 'Cat';
  onClose: () => void;
}

const ServiceModal = ({ service, defaultSpecies = 'Dog', onClose }: ServiceModalProps) => {
  const { addService, updateService, currency } = useStore();
  const [newSizeName, setNewSizeName] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    icon: 'grooming' as ServiceIcon,
    targetSpecies: defaultSpecies,
    prices: {} as Record<string, number>
  });

  useEffect(() => {
    if (service) {
      setFormData({
        title: service.title,
        category: service.category,
        description: service.description,
        icon: service.icon,
        targetSpecies: service.targetSpecies,
        prices: { ...service.prices }
      });
    }
  }, [service]);

  const handleAddSize = () => {
    if (!newSizeName.trim()) return;
    const size = newSizeName.trim();
    if (formData.prices[size] !== undefined) {
      toast.error("Size already exists");
      return;
    }

    setFormData(prev => ({
      ...prev,
      prices: {
        ...prev.prices,
        [size]: 0
      }
    }));
    setNewSizeName('');
  };

  const handleRemoveSize = (size: string) => {
    const newPrices = { ...formData.prices };
    delete newPrices[size];
    setFormData(prev => ({
      ...prev,
      prices: newPrices
    }));
  };

  const handleUpdatePrice = (size: string, price: number) => {
    setFormData(prev => ({
      ...prev,
      prices: {
        ...prev.prices,
        [size]: price
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.category) {
      toast.error("Please fill in service name and category");
      return;
    }

    if (service) {
      updateService(service.id, formData);
      toast.success("Service updated");
    } else {
      addService(formData);
      toast.success(`New ${formData.targetSpecies} service added`);
    }
    onClose();
  };

  const isDog = formData.targetSpecies === 'Dog';

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className={cn(
          "p-10 border-b border-gray-50 flex justify-between items-center",
          isDog ? "bg-blue-50/50" : "bg-pink-50/50"
        )}>
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-14 h-14 text-white rounded-2xl flex items-center justify-center shadow-lg",
              isDog ? "bg-blue-600" : "bg-pink-600"
            )}>
              {isDog ? <Dog size={28} /> : <Cat size={28} />}
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#1A1F3D]">
                {service ? `Edit ${formData.targetSpecies} Service` : `New ${formData.targetSpecies} Service`}
              </h2>
              <p className="text-sm text-gray-400 font-medium">Custom naming and pricing for {formData.targetSpecies}s</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl transition-all shadow-sm">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10">
          <div className="grid grid-cols-2 gap-8 mb-10">
            <div className="space-y-6">
              {!service && (
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Animal Type</label>
                  <div className="flex gap-2 p-1.5 bg-[#F5F6FA] rounded-2xl">
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, targetSpecies: 'Dog'})}
                      className={cn(
                        "flex-1 py-3 text-[10px] font-black rounded-xl transition-all",
                        isDog ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"
                      )}
                    >DOG</button>
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, targetSpecies: 'Cat'})}
                      className={cn(
                        "flex-1 py-3 text-[10px] font-black rounded-xl transition-all",
                        !isDog ? "bg-white text-pink-600 shadow-sm" : "text-gray-400"
                      )}
                    >CAT</button>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Service Name</label>
                <input 
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-[#1A1F3D]/10"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder={isDog ? "e.g. Bulldog Haircut" : "e.g. Persian Spa Bath"}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Category</label>
                <input 
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-[#1A1F3D]/10"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Prices per Size</label>
              <div className={cn(
                "p-5 rounded-[32px] min-h-[220px] flex flex-col border-2",
                isDog ? "bg-blue-50/20 border-blue-100" : "bg-pink-50/20 border-pink-100"
              )}>
                <div className="flex-1 space-y-2 mb-4 max-h-[200px] overflow-y-auto pr-2 scrollbar-hide">
                  {Object.entries(formData.prices).map(([size, price]) => (
                    <div key={size} className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-sm border border-gray-50">
                      <span className={cn(
                        "flex-1 text-[10px] font-black uppercase",
                        isDog ? "text-blue-600" : "text-pink-600"
                      )}>{size}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-300 font-bold">{currency}</span>
                        <input 
                          type="number"
                          className="w-20 bg-gray-50 border-none rounded-xl px-2 py-2 text-center text-xs font-black"
                          value={price}
                          onChange={e => handleUpdatePrice(size, Number(e.target.value))}
                        />
                        <button type="button" onClick={() => handleRemoveSize(size)} className="p-1.5 text-gray-200 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input 
                    className="flex-1 bg-white border-none rounded-xl px-4 py-2.5 text-[10px] font-bold"
                    placeholder="New Size..."
                    value={newSizeName}
                    onChange={e => setNewSizeName(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddSize())}
                  />
                  <button 
                    type="button" 
                    onClick={handleAddSize}
                    className={cn(
                      "text-white p-2.5 rounded-xl transition-all shadow-md active:scale-95",
                      isDog ? "bg-blue-600" : "bg-pink-600"
                    )}
                  ><Plus size={18} /></button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 py-5 text-sm font-black text-gray-400">Cancel</button>
            <button className="flex-[2] bg-[#D9ED5F] hover:bg-[#c8db54] text-[#1A1F3D] font-black py-5 rounded-[24px] shadow-xl shadow-[#D9ED5F]/20 active:scale-95">
              {service ? 'Update Service' : 'Create Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceModal;