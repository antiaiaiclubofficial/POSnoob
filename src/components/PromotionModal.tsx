"use client";

import React, { useState, useEffect } from 'react';
import { X, Tag, Info, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { translations } from '@/utils/translations';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PromotionModalProps {
  promotion?: any | null;
  onClose: () => void;
}

const PromotionModal = ({ promotion, onClose }: PromotionModalProps) => {
  const queryClient = useQueryClient();
  const { language } = useStore();
  const t = translations[language];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points_required: 0,
    is_active: true,
    bg_color: 'bg-blue-50'
  });

  useEffect(() => {
    if (promotion) {
      setFormData({
        title: promotion.title,
        description: promotion.description || '',
        points_required: promotion.points_required || 0,
        is_active: promotion.is_active,
        bg_color: promotion.bg_color || 'bg-blue-50'
      });
    }
  }, [promotion]);

  const upsertMutation = useMutation({
    mutationFn: async (data: any) => {
      if (promotion) {
        const { error } = await supabase.from('deal_templates').update(data).eq('id', promotion.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('deal_templates').insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal_templates'] });
      toast.success(promotion ? "Promotion updated" : "Promotion created");
      onClose();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[150] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Tag size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1A1F3D]">{promotion ? t.editPromo : t.createPromo}</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t.promoDetails}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">{t.promoTitle}</label>
              <input 
                className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">{t.pointsRequired}</label>
              <input 
                type="number"
                className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold"
                value={formData.points_required}
                onChange={e => setFormData({ ...formData, points_required: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">{t.promoDesc}</label>
              <textarea 
                className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold h-24 resize-none"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={upsertMutation.isPending}
            className="w-full bg-[#1A1F3D] text-white font-black py-5 rounded-[28px] shadow-xl shadow-[#1A1F3D]/20 transition-all active:scale-95"
          >
            {upsertMutation.isPending ? "Saving..." : t.saveChanges}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PromotionModal;