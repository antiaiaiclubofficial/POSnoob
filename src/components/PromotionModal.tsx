"use client";

import React, { useState, useEffect } from 'react';
import { X, Tag, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { translations } from '@/utils/translations';
import { toast } from 'sonner';

interface PromotionModalProps {
  promotion?: any | null;
  onClose: () => void;
}

const PromotionModal = ({ promotion, onClose }: PromotionModalProps) => {
  const queryClient = useQueryClient();
  const { language, storeId } = useStore();
  const t = translations[language];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points_required: 0,
    is_active: true,
    bg_color: 'bg-blue-50',
    discount_type: 'percent',
    discount_value: 0,
    start_date: '',
    end_date: '',
    usage_limit: null as number | null,
    max_redemptions_per_customer: null as number | null
  });

  const [isUnlimited, setIsUnlimited] = useState(true);
  const [isUnlimitedRedemptions, setIsUnlimitedRedemptions] = useState(true);

  useEffect(() => {
    if (promotion) {
      setFormData({
        title: promotion.title,
        description: promotion.description || '',
        points_required: promotion.points_required || 0,
        is_active: promotion.is_active,
        bg_color: promotion.bg_color || 'bg-blue-50',
        discount_type: promotion.discount_type || 'percent',
        discount_value: promotion.discount_value || 0,
        start_date: promotion.start_date ? new Date(promotion.start_date).toISOString().slice(0, 16) : '',
        end_date: promotion.end_date ? new Date(promotion.end_date).toISOString().slice(0, 16) : '',
        usage_limit: promotion.usage_limit,
        max_redemptions_per_customer: promotion.max_redemptions_per_customer
      });
      if (promotion.usage_limit !== null && promotion.usage_limit !== undefined) {
        setIsUnlimited(false);
      } else {
        setIsUnlimited(true);
      }
      if (promotion.max_redemptions_per_customer !== null && promotion.max_redemptions_per_customer !== undefined) {
        setIsUnlimitedRedemptions(false);
      } else {
        setIsUnlimitedRedemptions(true);
      }
    }
  }, [promotion]);

  const upsertMutation = useMutation({
    mutationFn: async (data: any) => {
      const payloadData = {
        title: data.title,
        description: data.description,
        points_required: data.points_required,
        is_active: data.is_active,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        start_date: data.start_date ? new Date(data.start_date).toISOString() : null,
        end_date: data.end_date ? new Date(data.end_date).toISOString() : null,
        usage_limit: isUnlimited ? null : data.usage_limit,
        max_redemptions_per_customer: isUnlimitedRedemptions ? null : data.max_redemptions_per_customer
      };

      if (promotion) {
        const { error } = await supabase.from('promotion_templates').update(payloadData).eq('id', promotion.id);
        if (error) throw error;
      } else {
        const payload = {
          ...payloadData,
          store_id: storeId && storeId !== 'default-store' ? storeId : null
        };
        const { error } = await supabase.from('promotion_templates').insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotion_templates'] });
      toast.success(promotion ? (language === 'th' ? "อัปเดตโปรโมชั่นเรียบร้อย" : "Promotion updated") : (language === 'th' ? "สร้างโปรโมชั่นเรียบร้อย" : "Promotion created"));
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || (language === 'th' ? "บันทึกข้อมูลไม่สำเร็จ" : "Failed to save data"));
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
      <div className="bg-white w-full max-w-xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-10 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Tag size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1A1F3D]">{promotion ? t.editPromo : t.createPromo}</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t.promoDetails}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl transition-all">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-10 pt-4 pb-10 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">{t.promoTitle}</label>
              <input 
                className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-blue-500/5 transition-all"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="e.g. Weekend Special Discount"
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">ประเภทส่วนลด</label>
                <select 
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold appearance-none cursor-pointer"
                  value={formData.discount_type}
                  onChange={e => setFormData({ ...formData, discount_type: e.target.value as 'percent' | 'amount' })}
                >
                  <option value="percent">เปอร์เซ็นต์ (%)</option>
                  <option value="amount">จำนวนเงิน (บาท)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">มูลค่าส่วนลด</label>
                <input 
                  type="number"
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold"
                  value={formData.discount_value}
                  onChange={e => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">วัน-เวลาเริ่ม</label>
                <input 
                  type="datetime-local"
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold"
                  value={formData.start_date}
                  onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">วัน-เวลาสิ้นสุด</label>
                <input 
                  type="datetime-local"
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold"
                  value={formData.end_date}
                  onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">{t.promoDesc}</label>
              <textarea 
                className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold h-24 resize-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Details of the deal..."
              />
            </div>

            <div className="mt-3">
              <div className="bg-blue-50/30 p-6 rounded-[32px] border border-blue-100/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[13px] font-bold text-blue-500 mb-3 block tracking-wide">จำกัดสิทธิ์ (ทั้งหมด)</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="number"
                        min="1"
                        className="flex-1 min-w-0 bg-white border-none rounded-2xl px-4 py-3 text-sm font-bold disabled:opacity-40 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm w-full"
                        value={formData.usage_limit || ''}
                        onChange={e => setFormData({ ...formData, usage_limit: Number(e.target.value) })}
                        disabled={isUnlimited}
                        required={!isUnlimited}
                        placeholder="จำนวน..."
                      />
                      <div 
                        className="flex items-center gap-2 cursor-pointer select-none shrink-0 group"
                        onClick={() => setIsUnlimited(!isUnlimited)}
                      >
                        <div className={`w-6 h-6 rounded-xl flex items-center justify-center transition-all shadow-sm group-hover:scale-105 ${
                          isUnlimited ? 'bg-[#020D35] border-transparent' : 'bg-white border-2 border-gray-200'
                        }`}>
                          {isUnlimited && <Check className="w-3.5 h-3.5 text-[#EAFD69] stroke-[4]" />}
                        </div>
                        <span className="text-[13px] font-bold text-[#1a1c1c]">ไม่จำกัด</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-[13px] font-bold text-blue-500 mb-3 block tracking-wide">จำกัดสิทธิ์ / 1 คน</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="number"
                        min="1"
                        className="flex-1 min-w-0 bg-white border-none rounded-2xl px-4 py-3 text-sm font-bold disabled:opacity-40 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm w-full"
                        value={formData.max_redemptions_per_customer || ''}
                        onChange={e => setFormData({ ...formData, max_redemptions_per_customer: Number(e.target.value) })}
                        disabled={isUnlimitedRedemptions}
                        required={!isUnlimitedRedemptions}
                        placeholder="จำนวน..."
                      />
                      <div 
                        className="flex items-center gap-2 cursor-pointer select-none shrink-0 group"
                        onClick={() => setIsUnlimitedRedemptions(!isUnlimitedRedemptions)}
                      >
                        <div className={`w-6 h-6 rounded-xl flex items-center justify-center transition-all shadow-sm group-hover:scale-105 ${
                          isUnlimitedRedemptions ? 'bg-[#020D35] border-transparent' : 'bg-white border-2 border-gray-200'
                        }`}>
                          {isUnlimitedRedemptions && <Check className="w-3.5 h-3.5 text-[#EAFD69] stroke-[4]" />}
                        </div>
                        <span className="text-[13px] font-bold text-[#1a1c1c]">ไม่จำกัด</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={upsertMutation.isPending}
            className="w-full bg-[#020D35] text-white font-black py-5 rounded-[48px] shadow-xl shadow-[#020D35]/20 transition-all active:scale-95 disabled:opacity-50 text-lg mt-4"
          >
            {upsertMutation.isPending ? "Saving..." : t.saveChanges}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PromotionModal;