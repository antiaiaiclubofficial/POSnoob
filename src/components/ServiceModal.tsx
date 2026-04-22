"use client";

import React, { useState, useEffect } from 'react';
import { X, Scissors, Tag, Plus, Trash2, Dog, Cat, FileText, LayoutGrid } from 'lucide-react';
import { useStore, Service, ServiceIcon } from '@/store/useStore';
import { toast } from 'sonner';

interface ServiceModalProps {
  service?: Service | null;
  onClose: () => void;
}

const ServiceModal = ({ service, onClose }: ServiceModalProps) => {
  const { addService, updateService } = useStore();
  const [activeTab, setActiveTab] = useState<'dog' | 'cat'>('dog');
  const [newSizeName, setNewSizeName] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    icon: 'grooming' as ServiceIcon,
    prices: {
      dog: { S: 0, M: 0, L: 0 } as Record<string, number>,
      cat: { Standard: 0 } as Record<string, number>
    }
  });

  useEffect(() => {
    if (service) {
      setFormData({
        title: service.title,
        category: service.category,
        description: service.description,
        icon: service.icon,
        prices: JSON.parse(JSON.stringify(service.prices))
      });
    }
  }, [service]);

  const handleAddSize = () => {
    if (!newSizeName.trim()) return;
    const size = newSizeName.trim();
    if (formData.prices[activeTab][size] !== undefined) {
      toast.error("Size already exists");
      return;
    }

    setFormData(prev => ({
      ...prev,
      prices: {
        ...prev.prices,
        [activeTab]: {
          ...prev.prices[activeTab],
          [size]: 0
        }
      }
    }));
    setNewSizeName('');
  };

  const handleRemoveSize = (size: string) => {
    const newPrices = { ...formData.prices[activeTab] };
    delete newPrices[size];
    setFormData(prev => ({
      ...prev,
      prices: {
        ...prev.prices,
        [activeTab]: newPrices
      }
    }));
  };

  const handleUpdatePrice = (size: string, price: number) => {
    setFormData(prev => ({
      ...prev,
      prices: {
        ...prev.prices,
        [activeTab]: {
          ...prev.prices[activeTab],
          [size]: price
        }
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.category) {
      toast.error("Please fill in basic service info");
      return;
    }

    if (service) {
      updateService(service.id, formData);
      toast.success("Service updated successfully");
    } else {
      addService(formData);
      toast.success("New service added successfully");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#1A1F3D] text-white rounded-2xl flex items-center justify-center shadow-lg">
              <Scissors size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#1A1F3D]">{service ? 'Update Service' : 'Create New Service'}</h2>
              <p className="text-sm text-gray-400 font-medium">Manage details and species-specific pricing</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl transition-all shadow-sm">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10">
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest flex items-center gap-2">
                  <Tag size={12} /> Service Name
                </label>
                <input 
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-[#1A1F3D]/10"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Full Grooming Premium"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest flex items-center gap-2">
                  <LayoutGrid size={12} /> Category
                </label>
                <input 
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-[#1A1F3D]/10"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  placeholder="e.g. Grooming"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest flex items-center gap-2">
                  <FileText size={12} /> Description
                </label>
                <textarea 
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl px-5 py-4 text-sm font-bold h-24 resize-none"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="What does this service include?"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Pricing Structure</label>
              <div className="flex gap-2 p-1.5 bg-[#F5F6FA] rounded-[24px]">
                <button 
                  type="button"
                  onClick={() => setActiveTab('dog')}
                  className={`flex-1 py-3 flex items-center justify-center gap-2 text-xs font-black rounded-xl transition-all ${activeTab === 'dog' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Dog size={16} /> DOGS
                </button>
                <button 
                  type="button"
                  onClick={() => setActiveTab('cat')}
                  className={`flex-1 py-3 flex items-center justify-center gap-2 text-xs font-black rounded-xl transition-all ${activeTab === 'cat' ? 'bg-white shadow-sm text-pink-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Cat size={16} /> CATS
                </button>
              </div>

              <div className="bg-[#F5F6FA] p-5 rounded-[32px] min-h-[220px] flex flex-col">
                <div className="flex-1 space-y-3 mb-4 max-h-[160px] overflow-y-auto pr-2 scrollbar-hide">
                  {Object.entries(formData.prices[activeTab]).map(([size, price]) => (
                    <div key={size} className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-sm border border-gray-50/50">
                      <span className="flex-1 text-[10px] font-black uppercase text-[#1A1F3D] tracking-wider pl-2">{size}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-300 font-bold">$</span>
                        <input 
                          type="number"
                          className="w-16 bg-[#F5F6FA] border-none rounded-xl px-2 py-2 text-center text-xs font-black"
                          value={price}
                          onChange={e => handleUpdatePrice(size, Number(e.target.value))}
                        />
                        <button 
                          type="button"
                          onClick={() => handleRemoveSize(size)}
                          className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input 
                    className="flex-1 bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-[10px] font-bold focus:ring-2 focus:ring-[#1A1F3D]/5"
                    placeholder="Size name (e.g. XL)"
                    value={newSizeName}
                    onChange={e => setNewSizeName(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddSize())}
                  />
                  <button 
                    type="button"
                    onClick={handleAddSize}
                    className="bg-[#1A1F3D] text-white p-2.5 rounded-xl hover:bg-[#2A3152] transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-5 text-sm font-black text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button className="flex-[2] bg-[#D9ED5F] hover:bg-[#c8db54] text-[#1A1F3D] font-black py-5 rounded-[24px] flex items-center justify-center gap-2 transition-all shadow-xl shadow-[#D9ED5F]/20">
              {service ? 'Update Service Details' : 'Save New Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceModal;