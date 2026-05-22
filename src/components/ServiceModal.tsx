"use client";

import React, { useState, useEffect } from 'react';
import { X, Scissors, Clock, DollarSign, Plus, Trash2, Save, Info, Star } from 'lucide-react';
import { useStore, Service, ServiceIcon, ServicePriceInfo, SubService } from '@/store/useStore';
import { toast } from 'sonner';

interface ServiceModalProps {
  service: Service | null;
  defaultSpecies: 'Dog' | 'Cat'; // Added to fix TS2322
  onClose: () => void;
}

const ServiceModal = ({ service, defaultSpecies, onClose }: ServiceModalProps) => {
  const { addService, updateService } = useStore();
  const [formData, setFormData] = useState({
    title: '',
    category: 'Grooming',
    description: '',
    icon: 'grooming' as ServiceIcon,
    targetSpecies: defaultSpecies, // Initialize with defaultSpecies
    isActive: true,
    prices: {
      'Small': { price: 0, duration: 60 }
    } as Record<string, ServicePriceInfo>
  });

  useEffect(() => {
    if (service) {
      setFormData({
        title: service.title,
        category: service.category,
        description: service.description,
        icon: service.icon,
        targetSpecies: service.targetSpecies,
        isActive: service.isActive,
        prices: service.prices
      });
    } else {
      // If adding new, ensure species matches current tab
      setFormData(prev => ({ ...prev, targetSpecies: defaultSpecies }));
    }
  }, [service, defaultSpecies]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (service) {
      updateService(service.id, formData);
      toast.success('Service updated');
    } else {
      addService(formData);
      toast.success('Service added');
    }
    onClose();
  };

  const handlePriceChange = (size: string, field: 'price' | 'duration', value: number) => {
    setFormData(prev => ({
      ...prev,
      prices: {
        ...prev.prices,
        [size]: { ...prev.prices[size], [field]: value }
      }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-2xl font-black text-[#1A1F3D]">{service ? 'Edit Service' : 'Add New Service'}</h2>
          <button onClick={onClose} className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 rounded-2xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Service Title</label>
                <input 
                  className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  required
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Target Species</label>
                <select 
                  className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold"
                  value={formData.targetSpecies}
                  onChange={e => setFormData({...formData, targetSpecies: e.target.value as 'Dog' | 'Cat'})}
                >
                  <option value="Dog">Dog</option>
                  <option value="Cat">Cat</option>
                </select>
             </div>
          </div>

          <div className="space-y-4">
             <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Pricing by Size</label>
             <div className="grid grid-cols-1 gap-3">
                {(Object.entries(formData.prices) as [string, ServicePriceInfo][]).map(([size, info]) => (
                   <div key={size} className="flex items-center gap-4 bg-gray-50 p-4 rounded-3xl">
                      <div className="w-24 font-black text-[#1A1F3D]">{size}</div>
                      <div className="flex-1 flex items-center gap-2">
                         <DollarSign size={14} className="text-gray-400" />
                         <input 
                            type="number"
                            className="bg-transparent border-none w-full font-black"
                            value={info.price}
                            onChange={e => handlePriceChange(size, 'price', Number(e.target.value))}
                         />
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                         <Clock size={14} className="text-gray-400" />
                         <input 
                            type="number"
                            className="bg-transparent border-none w-full font-black"
                            value={info.duration}
                            onChange={e => handlePriceChange(size, 'duration', Number(e.target.value))}
                         />
                         <span className="text-[10px] font-black text-gray-400 uppercase">Min</span>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        </form>

        <div className="p-8 bg-gray-50/50 flex gap-4">
           <button onClick={onClose} className="flex-1 py-4 rounded-2xl font-black text-gray-400">Cancel</button>
           <button onClick={handleSubmit} className="flex-[2] bg-[#1A1F3D] text-white py-4 rounded-2xl font-black shadow-xl">Save Service</button>
        </div>
      </div>
    </div>
  );
};

export default ServiceModal;