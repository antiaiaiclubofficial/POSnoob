"use client";

import React, { useState, useEffect } from 'react';
import { X, Scissors, Tag, Plus, Trash2, Dog, Cat, FileText, LayoutGrid, AlertCircle } from 'lucide-react';
import { useStore, Service, ServiceIcon } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ServiceModalProps {
  service?: Service | null;
  onClose: () => void;
}

const ServiceModal = ({ service, onClose }: ServiceModalProps) => {
  const { addService, updateService, currency } = useStore();
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
              <h2 className="text-2xl font-black text-[#1A1F3D]">{service ? 'Update Service' : 'New Service'}</h2>
              <p className="text-sm text-gray-400 font-medium">Configure species-specific rates</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl transition-all shadow-sm">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10">
          <div className="grid grid-cols-2 gap-8 mb-10">
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest flex items-center gap-2">
                  <Tag size={12} /> Service Name
                </label>
                <input 
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-[#1A1F3D]/10"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Full Grooming"
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
                  placeholder="Service highlights..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Rate Configuration</label>
              <div className="flex gap-2 p-1.5 bg-[#F5F6FA] rounded-[24px]">
                <button 
                  type="button"
                  onClick={() => setActiveTab('dog')}
                  className={cn(
                    "flex-1 py-4 flex flex-col items-center justify-center gap-1 text-[10px] font-black rounded-xl transition-all border-2",
                    activeTab === 'dog' 
                      ? "bg-white border-blue-500 text-blue-600 shadow-md" 
                      : "bg-transparent border-transparent text-gray-400 hover:bg-white/50"
                  )}
                >
                  <Dog size={18} /> DOGS
                </button>
                <button 
                  type="button"
                  onClick={() => setActiveTab('cat')}
                  className={cn(
                    "flex-1 py-4 flex flex-col items-center justify-center gap-1 text-[10px] font-black rounded-xl transition-all border-2",
                    activeTab === 'cat' 
                      ? "bg-white border-pink-500 text-pink-600 shadow-md" 
                      : "bg-transparent border-transparent text-gray-400 hover:bg-white/50"
                  )}
                >
                  <Cat size={18} /> CATS
                </button>
              </div>

              <div className={cn(
                "p-5 rounded-[32px] min-h-[220px] flex flex-col border-2 transition-colors",
                activeTab === 'dog' ? "bg-blue-50/50 border-blue-100" : "bg-pink-50/50 border-pink-100"
              )}>
                <div className="flex-1 space-y-2 mb-4 max-h-[160px] overflow-y-auto pr-2 scrollbar-hide">
                  {Object.entries(formData.prices[activeTab]).map(([size, price]) => (
                    <div key={size} className="flex items-center gap-3 bg-white p-2.5 rounded-2xl shadow-sm border border-gray-50">
                      <span className={cn(
                        "flex-1 text-[10px] font-black uppercase tracking-wider pl-2",
                        activeTab === 'dog' ? "text-blue-600" : "text-pink-600"
                      )}>{size}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-300 font-black">{currency}</span>
                        <input 
                          type="number"
                          className="w-20 bg-gray-50 border-none rounded-xl px-2 py-2 text-center text-xs font-black focus:ring-1 focus:ring-gray-200"
                          value={price}
                          onChange={e => handleUpdatePrice(size, Number(e.target.value))}
                        />
                        <button 
                          type="button"
                          onClick={() => handleRemoveSize(size)}
                          className="p-1.5 text-gray-200 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input 
                    className="flex-1 bg-white border-none rounded-xl px-4 py-2.5 text-[10px] font-bold focus:ring-2 focus:ring-[#1A1F3D]/5"
                    placeholder="New Size (e.g. XL)"
                    value={newSizeName}
                    onChange={e => setNewSizeName(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddSize())}
                  />
                  <button 
                    type="button"
                    onClick={handleAddSize}
                    className={cn(
                      "text-white p-2.5 rounded-xl transition-all shadow-md active:scale-95",
                      activeTab === 'dog' ? "bg-blue-600 hover:bg-blue-700" : "bg-pink-600 hover:bg-pink-700"
                    )}
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
            <button className="flex-[2] bg-[#D9ED5F] hover:bg-[#c8db54] text-[#1A1F3D] font-black py-5 rounded-[24px] flex items-center justify-center gap-2 transition-all shadow-xl shadow-[#D9ED5F]/20 active:scale-95">
              {service ? 'Update Service Rates' : 'Save Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceModal;