"use client";

import React, { useState, useEffect } from 'react';
import { X, Scissors, Tag, Info, DollarSign, ListFilter } from 'lucide-react';
import { useStore, Service, ServiceIcon } from '@/store/useStore';
import { toast } from 'sonner';

interface ServiceModalProps {
  service?: Service | null;
  onClose: () => void;
}

const ServiceModal = ({ service, onClose }: ServiceModalProps) => {
  const { addService, updateService } = useStore();
  const [priceType, setPriceType] = useState<'single' | 'size'>(service && typeof service.prices === 'number' ? 'single' : 'size');
  
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    icon: 'grooming' as ServiceIcon,
    prices: { S: 0, M: 0, L: 0 } as any
  });

  useEffect(() => {
    if (service) {
      setFormData({
        title: service.title,
        category: service.category,
        description: service.description,
        icon: service.icon,
        prices: service.prices
      });
    }
  }, [service]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.category) {
      toast.error("Please fill in service name and category");
      return;
    }

    const finalData = {
      ...formData,
      prices: priceType === 'single' 
        ? Number(typeof formData.prices === 'object' ? formData.prices.M : formData.prices)
        : formData.prices
    };

    if (service) {
      updateService(service.id, finalData);
      toast.success("Service updated");
    } else {
      addService(finalData);
      toast.success("New service added");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-[#1A1F3D]">{service ? 'Edit Service' : 'Add Service'}</h2>
            <p className="text-xs text-gray-400 font-medium">Define service details and pricing</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">Service Name</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-[#1A1F3D]/5"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="Full Grooming"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">Category</label>
              <div className="relative">
                <ListFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-[#1A1F3D]/5"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  placeholder="Grooming / Hygiene"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">Pricing Type</label>
              <div className="flex gap-2 p-1 bg-[#F5F6FA] rounded-2xl">
                <button 
                  type="button"
                  onClick={() => setPriceType('size')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${priceType === 'size' ? 'bg-white shadow-sm' : 'text-gray-400'}`}
                >
                  By Size (S/M/L)
                </button>
                <button 
                  type="button"
                  onClick={() => setPriceType('single')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${priceType === 'single' ? 'bg-white shadow-sm' : 'text-gray-400'}`}
                >
                  Single Price
                </button>
              </div>
            </div>

            {priceType === 'size' ? (
              <div className="grid grid-cols-3 gap-3">
                {['S', 'M', 'L'].map((size) => (
                  <div key={size}>
                    <label className="text-[9px] font-black uppercase text-gray-400 mb-1 block text-center">Size {size}</label>
                    <input 
                      type="number"
                      className="w-full bg-[#F5F6FA] border-none rounded-xl px-3 py-2.5 text-center text-sm font-bold"
                      value={typeof formData.prices === 'object' ? formData.prices[size as 'S'|'M'|'L'] : formData.prices}
                      onChange={e => {
                        const newPrices = typeof formData.prices === 'object' ? { ...formData.prices } : { S: formData.prices, M: formData.prices, L: formData.prices };
                        newPrices[size as 'S'|'M'|'L'] = Number(e.target.value);
                        setFormData({...formData, prices: newPrices});
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">Amount ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input 
                    type="number"
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold"
                    value={typeof formData.prices === 'number' ? formData.prices : formData.prices.M}
                    onChange={e => setFormData({...formData, prices: Number(e.target.value)})}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">Description</label>
              <textarea 
                className="w-full bg-[#F5F6FA] border-none rounded-2xl px-4 py-3 text-sm font-bold h-20 resize-none"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Briefly describe the service..."
              />
            </div>
          </div>

          <button className="w-full bg-[#1A1F3D] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all mt-4 hover:bg-[#2A3152] shadow-xl shadow-[#1A1F3D]/10">
            {service ? 'Update Service' : 'Create Service'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ServiceModal;