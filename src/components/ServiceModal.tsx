"use client";

import React, { useState, useEffect } from 'react';
import { X, Scissors, Tag, Plus, Trash2, Dog, Cat } from 'lucide-react';
import { useStore, Service, ServiceIcon } from '@/store/useStore';
import { toast } from 'sonner';

interface ServiceModalProps {
  service?: Service | null;
  onClose: () => void;
}

const ServiceModal = ({ service, onClose }: ServiceModalProps) => {
  const { addService, updateService } = useStore();
  const [activeSpecies, setActiveSpecies] = useState<'dog' | 'cat'>('dog');
  
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    icon: 'grooming' as ServiceIcon,
    prices: {
      dog: { M: 0 } as Record<string, number>,
      cat: { M: 0 } as Record<string, number>
    }
  });

  useEffect(() => {
    if (service) {
      setFormData({
        title: service.title,
        category: service.category,
        description: service.description,
        icon: service.icon,
        prices: JSON.parse(JSON.stringify(service.prices)) // Deep copy
      });
    }
  }, [service]);

  const addSize = () => {
    const sizeName = prompt("Enter size name (e.g. XL, Small, Giant):");
    if (sizeName && !formData.prices[activeSpecies][sizeName]) {
      setFormData(prev => ({
        ...prev,
        prices: {
          ...prev.prices,
          [activeSpecies]: {
            ...prev.prices[activeSpecies],
            [sizeName]: 0
          }
        }
      }));
    }
  };

  const removeSize = (size: string) => {
    const newPrices = { ...formData.prices[activeSpecies] };
    delete newPrices[size];
    setFormData(prev => ({
      ...prev,
      prices: {
        ...prev.prices,
        [activeSpecies]: newPrices
      }
    }));
  };

  const updatePrice = (size: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      prices: {
        ...prev.prices,
        [activeSpecies]: {
          ...prev.prices[activeSpecies],
          [size]: value
        }
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
      toast.success("New service added");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-[#1A1F3D]">{service ? 'Edit Service' : 'Add Service'}</h2>
            <p className="text-xs text-gray-400 font-medium">Configure multi-species pricing</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">Service Name</label>
              <input 
                className="w-full bg-[#F5F6FA] border-none rounded-2xl px-4 py-3.5 text-sm font-bold"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="Full Grooming"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">Category</label>
              <input 
                className="w-full bg-[#F5F6FA] border-none rounded-2xl px-4 py-3.5 text-sm font-bold"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                placeholder="Grooming"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2 p-1 bg-[#F5F6FA] rounded-2xl">
              <button 
                type="button"
                onClick={() => setActiveSpecies('dog')}
                className={`flex-1 py-3 flex items-center justify-center gap-2 text-xs font-bold rounded-xl transition-all ${activeSpecies === 'dog' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
              >
                <Dog size={16} /> Dogs
              </button>
              <button 
                type="button"
                onClick={() => setActiveSpecies('cat')}
                className={`flex-1 py-3 flex items-center justify-center gap-2 text-xs font-bold rounded-xl transition-all ${activeSpecies === 'cat' ? 'bg-white shadow-sm text-pink-600' : 'text-gray-400'}`}
              >
                <Cat size={16} /> Cats
              </button>
            </div>

            <div className="bg-[#F5F6FA] p-6 rounded-[28px] space-y-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Pricing by Size</p>
                <button 
                  type="button"
                  onClick={addSize}
                  className="flex items-center gap-1 text-[10px] font-bold bg-[#1A1F3D] text-white px-3 py-1.5 rounded-full hover:bg-[#2A3152]"
                >
                  <Plus size={12} /> Add Size
                </button>
              </div>

              <div className="space-y-3 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                {Object.entries(formData.prices[activeSpecies]).map(([size, price]) => (
                  <div key={size} className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-50">
                    <span className="flex-1 text-xs font-black text-[#1A1F3D] uppercase tracking-wider">{size}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-bold">$</span>
                      <input 
                        type="number"
                        className="w-20 bg-[#F5F6FA] border-none rounded-xl px-3 py-1.5 text-center text-xs font-bold"
                        value={price}
                        onChange={e => updatePrice(size, Number(e.target.value))}
                      />
                      <button 
                        type="button"
                        onClick={() => removeSize(size)}
                        className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button className="w-full bg-[#1A1F3D] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all hover:bg-[#2A3152] shadow-xl shadow-[#1A1F3D]/10">
            {service ? 'Update Service' : 'Create Service'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ServiceModal;