"use client";

import React, { useState, useEffect } from 'react';
import { X, Ticket, Gift, Star, Award, Zap, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { translations } from '@/utils/translations';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CouponModalProps {
  coupon?: any | null;
  onClose: () => void;
}

const ICONS = [
  { id: 'Ticket', icon: Ticket },
  { id: 'Gift', icon: Gift },
  { id: 'Star', icon: Star },
  { id: 'Award', icon: Award },
  { id: 'Zap', icon: Zap },
  { id: 'Heart', icon: Heart },
];

const CouponModal = ({ coupon, onClose }: CouponModalProps) => {
  const queryClient = useQueryClient();
  const { language } = useStore();
  const t = translations[language];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points_required: 100,
    expiry_days: 30,
    icon_name: 'Ticket',
    bg_color: 'bg-pink-50',
    is_active: true
  });

  useEffect(() => {
    if (coupon) {
      setFormData({
        title: coupon.title,
        description: coupon.description || '',
        points_required: coupon.points_required,
        expiry_days: coupon.expiry_days,
        icon_name: coupon.icon_name || 'Ticket',
        bg_color: coupon.bg_color || 'bg-pink-50',
        is_active: coupon.is_active
      });
    }
  }, [coupon]);

  const upsertMutation = useMutation({
    mutationFn: async (data: any) => {
      if (coupon) {
        const { error } = await supabase.from('coupon_templates').update(data).eq('id', coupon.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('coupon_templates').insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      // บังคับให้หน้าจอหลักรีเฟรชข้อมูลใหม่
      queryClient.invalidateQueries({ queryKey: ['coupon_templates'] });
      toast.success(coupon ? (language === 'th' ? "อัปเดตคูปองเรียบร้อย" : "Coupon updated") : (language === 'th' ? "สร้างคูปองเรียบร้อย" : "Coupon created"));
      onClose();
    },
    onError: (error) => {
      toast.error(language === 'th' ? "บันทึกข้อมูลไม่สำเร็จ" : "Failed to save data");
      console.error(error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    upsertMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[150] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Ticket size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1A1F3D]">{coupon ? t.editCoupon : t.createCoupon}</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t.couponDetails}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl transition-all">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">{t.promoTitle}</label>
              <input 
                className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-pink-500/5 transition-all"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="e.g. 50% Off Grooming"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">{t.pointsRequired}</label>
                <input 
                  type="number"
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold"
                  value={formData.points_required}
                  onChange={e => setFormData({ ...formData, points_required: Number(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">{t.expiryDays}</label>
                <input 
                  type="number"
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold"
                  value={formData.expiry_days}
                  onChange={e => setFormData({ ...formData, expiry_days: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">{t.couponIcon}</label>
              <div className="flex gap-2 bg-[#F5F6FA] p-2 rounded-2xl">
                {ICONS.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon_name: item.id })}
                    className={cn(
                      "flex-1 p-3 rounded-xl flex items-center justify-center transition-all",
                      formData.icon_name === item.id ? "bg-white text-pink-600 shadow-sm" : "text-gray-300 hover:text-gray-400"
                    )}
                  >
                    <item.icon size={18} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">{t.promoDesc}</label>
              <textarea 
                className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold h-24 resize-none focus:ring-4 focus:ring-pink-500/5 transition-all"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this reward..."
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={upsertMutation.isPending}
            className="w-full bg-[#1A1F3D] text-white font-black py-5 rounded-[28px] shadow-xl shadow-[#1A1F3D]/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {upsertMutation.isPending ? "Saving..." : t.saveChanges}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CouponModal;