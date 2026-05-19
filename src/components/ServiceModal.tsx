"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, Scissors, Plus, Trash2, Dog, Cat, Sparkles, Bath, CheckCircle2, 
  Wind, Stethoscope, Brush, Home, Heart, Bone, Award, Zap
} from 'lucide-react';
import { useStore, Service, ServiceIcon, ServicePriceInfo, SubService } from '@/store/useStore';
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

const ICONS_LIST: { id: ServiceIcon; icon: any }[] = [
  { id: 'grooming', icon: Scissors },
  { id: 'bath', icon: Bath },
  { id: 'spa', icon: Sparkles },
  { id: 'nail', icon: Zap },
  { id: 'dry', icon: Wind },
  { id: 'brush', icon: Brush },
  { id: 'health', icon: Stethoscope },
  { id: 'hotel', icon: Home },
  { id: 'love', icon: Heart },
  { id: 'food', icon: Bone },
  { id: 'premium', icon: Award },
];

const ServiceModal = ({ service, defaultSpecies = 'Dog', onClose }: ServiceModalProps) => {
  const { addService, updateService, currency } = useStore();
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [targetSpecies, setTargetSpecies] = useState<'Dog' | 'Cat'>(defaultSpecies);
  const [icon, setIcon] = useState<ServiceIcon>('grooming');
  const [sizes, setSizes] = useState<SizeEntry[]>([]);
  const [subServices, setSubServices] = useState<SubService[]>([]);
  const [newSubName, setNewSubName] = useState('');
  const [newSubPrice, setNewSubPrice] = useState('0');

  useEffect(() => {
    if (service) {
      setTitle(service.title);
      setCategory(service.category);
      setDescription(service.description);
      setTargetSpecies(service.targetSpecies);
      setIcon(service.icon);
      setSubServices(service.subServices || []);
      
      const initialSizes = Object.entries(service.prices).map(([name, info]) => ({
        id: Math.random().toString(36).substr(2, 9),
        name,
        price: info.price,
        duration: info.duration
      }));
      setSizes(initialSizes);
    } else {
      setTargetSpecies(defaultSpecies);
      const defaultPresets = defaultSpecies === 'Dog' 
        ? ['Small (< 10kg)', 'Medium (10-25kg)', 'Large (> 25kg)'] 
        : ['Standard'];
      
      setSizes(defaultPresets.map(name => ({
        id: Math.random().toString(36).substr(2, 9),
        name,
        price: 0,
        duration: 60
      })));
    }
  }, [service, defaultSpecies]);

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

  const handleAddSubService = () => {
    if (newSubName.trim()) {
      setSubServices([...subServices, { 
        name: newSubName.trim(), 
        price: Number(newSubPrice) || 0 
      }]);
      setNewSubName('');
      setNewSubPrice('0');
    }
  };

  const handleRemoveSubService = (index: number) => {
    setSubServices(subServices.filter((_, i) => i !== index));
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
      subServices,
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
        <div className="p-8 lg:p-10 flex justify-between items-center border-b border-gray-50">
          <div className="flex items-center gap-6">
            <div className={cn(
              "w-14 h-14 lg:w-16 lg:h-16 rounded-[24px] flex items-center justify-center text-white shadow-xl",
              isDog ? "bg-blue-600" : "bg-pink-600"
            )}>
              {isDog ? <Dog size={28} /> : <Cat size={28} />}
            </div>
            <div>
              <h2 className="text-2xl lg:text-3xl font-black text-[#1A1F3D]">
                {service ? 'Edit' : 'New'} {targetSpecies} Service
              </h2>
              <p className="text-xs lg:text-sm text-gray-400 font-medium">Define your specialized grooming treatments</p>
            </div>
          </div>
          <button onClick={onClose} className="p-4 hover:bg-gray-50 rounded-[20px] transition-all">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 lg:p-10 max-h-[75vh] overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-10">
            <div className="space-y-8">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-3 block tracking-widest px-1">Target Species</label>
                <div className="flex bg-[#F5F6FA] p-1 rounded-2xl gap-1">
                  <button type="button" onClick={() => setTargetSpecies('Dog')} className={cn("flex-1 py-3 rounded-xl text-[10px] font-black transition-all", targetSpecies === 'Dog' ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400")}>DOG</button>
                  <button type="button" onClick={() => setTargetSpecies('Cat')} className={cn("flex-1 py-3 rounded-xl text-[10px] font-black transition-all", targetSpecies === 'Cat' ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400")}>CAT</button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-gray-400 mb-3 block tracking-widest px-1">Service Basic Info</label>
                <input className="w-full bg-[#F5F6FA] border-none rounded-[20px] px-6 py-4 text-sm font-bold" value={title} onChange={e => setTitle(e.target.value)} placeholder="Full Grooming" />
                <input className="w-full bg-[#F5F6FA] border-none rounded-[20px] px-6 py-4 text-sm font-bold" value={category} onChange={e => setCategory(e.target.value)} placeholder="Category" />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-gray-400 mb-3 block tracking-widest px-1">Included Services & Extra Cost</label>
                <div className="bg-[#F5F6FA] p-6 rounded-[32px] space-y-4">
                  <div className="flex gap-2">
                    <input className="flex-[2] bg-white border-none rounded-xl px-4 py-3 text-xs font-bold shadow-sm" value={newSubName} onChange={e => setNewSubName(e.target.value)} placeholder="e.g. Tooth Brushing" />
                    <div className="flex-1 relative">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-300">{currency}</span>
                       <input type="number" className="w-full bg-white border-none rounded-xl pl-6 pr-3 py-3 text-xs font-bold shadow-sm" value={newSubPrice} onChange={e => setNewSubPrice(e.target.value)} placeholder="0" />
                    </div>
                    <button type="button" onClick={handleAddSubService} className="bg-[#1A1F3D] text-white p-3 rounded-xl hover:scale-105 transition-all"><Plus size={18} /></button>
                  </div>
                  
                  <div className="space-y-2 max-h-[150px] overflow-y-auto scrollbar-hide">
                    {subServices.map((item, idx) => (
                      <div key={idx} className="bg-white px-4 py-3 rounded-xl flex items-center justify-between border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={12} className="text-green-500" />
                          <span className="text-[10px] font-bold text-[#1A1F3D]">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-black text-blue-600">+{currency}{item.price}</span>
                           <button type="button" onClick={() => handleRemoveSubService(idx)} className="text-gray-300 hover:text-red-500"><X size={12} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-3 block tracking-widest px-1">Pricing Matrix (Base Price)</label>
              <div className={cn("rounded-[40px] p-8 border-2 min-h-[400px] flex flex-col", isDog ? "bg-blue-50/20 border-blue-100" : "bg-pink-50/20 border-pink-100")}>
                <div className="flex-1 space-y-4 mb-6">
                  {sizes.map((s) => (
                    <div key={s.id} className="flex gap-3">
                      <input className="flex-1 bg-white border-none rounded-[20px] px-6 py-4 text-xs font-black shadow-sm" value={s.name} onChange={e => updateSize(s.id, 'name', e.target.value)} placeholder="Small Breed" />
                      <div className="w-32 relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-300">{currency}</span>
                        <input type="number" className="w-full bg-white border-none rounded-[20px] pl-8 pr-4 py-4 text-xs font-black shadow-sm" value={s.price} onChange={e => updateSize(s.id, 'price', Number(e.target.value))} />
                      </div>
                      <button type="button" onClick={() => handleRemoveSize(s.id)} className="p-4 text-gray-300 hover:text-red-500"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={handleAddSize} className={cn("w-full py-4 rounded-[22px] border-2 border-dashed font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2", isDog ? "border-blue-200 text-blue-400" : "border-pink-200 text-pink-400")}>
                  <Plus size={16} /> Add Price Tier
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-6 pt-4 border-t border-gray-50">
            <button type="button" onClick={onClose} className="px-10 py-5 text-sm font-black text-gray-400">Cancel</button>
            <button className="flex-1 bg-[#1A1F3D] text-white font-black py-5 rounded-[28px] shadow-2xl active:scale-95 text-lg">
              {service ? 'Save Changes' : 'Create Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceModal;