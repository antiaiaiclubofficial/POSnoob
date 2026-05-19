"use client";

import React, { useState, useEffect } from 'react';
import { X, Zap, Save, Trash2 } from 'lucide-react';
import { useStore, AddonItem, ServiceIcon } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  Scissors, Bath, Sparkles, Wind, Stethoscope, Brush, Home, Heart, Bone, Award 
} from 'lucide-react';

interface AddonSettingsModalProps {
  addon?: AddonItem | null;
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

const AddonSettingsModal = ({ addon, onClose }: AddonSettingsModalProps) => {
  const { addAddon, updateAddon, currency } = useStore();
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [icon, setIcon] = useState<ServiceIcon>('nail');

  useEffect(() => {
    if (addon) {
      setName(addon.name);
      setPrice(addon.price);
      setIcon(addon.icon);
    }
  }, [addon]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error("Add-on name is required");
      return;
    }

    if (addon) {
      updateAddon(addon.id, { name, price, icon });
      toast.success("Add-on updated");
    } else {
      addAddon({ name, price, icon });
      toast.success("New Add-on created");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Zap size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1A1F3D]">{addon ? 'Edit Add-on' : 'New Add-on'}</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Global Service Add-on</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">Add-on Name</label>
              <input 
                className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-500/5 transition-all"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Tooth Brushing"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">Default Price</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-black">{currency}</span>
                <input 
                  type="number"
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-10 pr-6 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-500/5 transition-all"
                  value={price}
                  onChange={e => setPrice(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-3 block tracking-widest px-1">Choose Icon</label>
              <div className="grid grid-cols-6 gap-2 bg-[#F5F6FA] p-2 rounded-2xl">
                {ICONS_LIST.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIcon(item.id)}
                    className={cn(
                      "aspect-square rounded-xl flex items-center justify-center transition-all",
                      icon === item.id ? "bg-white text-blue-600 shadow-sm" : "text-gray-300 hover:text-gray-400"
                    )}
                  >
                    <item.icon size={18} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-[#1A1F3D] text-white font-black py-5 rounded-[24px] shadow-xl shadow-[#1A1F3D]/20 transition-all active:scale-95"
          >
            <Save size={20} className="inline mr-2" /> {addon ? 'Save Changes' : 'Create Add-on'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddonSettingsModal;