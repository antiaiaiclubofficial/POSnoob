"use client";

import React, { useState, useEffect } from 'react';
import { X, Tag, Copy, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { translations } from '@/utils/translations';
import { toast } from 'sonner';

interface CouponCodeModalProps {
  onClose: () => void;
}

const CouponCodeModal = ({ onClose }: CouponCodeModalProps) => {
  const queryClient = useQueryClient();
  const { language, storeId } = useStore();
  const t = translations[language];

  const [formData, setFormData] = useState({
    code: '',
    template_type: 'promotion' as 'promotion' | 'coupon',
    template_id: '',
    max_uses: 1, // -1 for unlimited
    is_unlimited: false
  });

  const { data: promotions } = useQuery({
    queryKey: ['promotion_templates', storeId],
    queryFn: async () => {
      let query = supabase.from('promotion_templates').select('*').eq('is_active', true);
      if (storeId && storeId !== 'default-store') query = query.eq('store_id', storeId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const { data: coupons } = useQuery({
    queryKey: ['coupon_templates', storeId],
    queryFn: async () => {
      let query = supabase.from('coupon_templates').select('*').eq('is_active', true);
      if (storeId && storeId !== 'default-store') query = query.eq('store_id', storeId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      if (i === 4) result += '-';
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code: result }));
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload: any = {
        code: data.code.toUpperCase(),
        template_type: data.template_type,
        template_id: data.template_id,
        max_uses: data.is_unlimited ? null : data.max_uses,
        store_id: storeId && storeId !== 'default-store' ? storeId : null
      };
      if (data.template_type === 'promotion') {
        payload.promotion_id = data.template_id;
      } else {
        payload.coupon_id = data.template_id;
      }
      const { error } = await supabase.from('coupon_codes').insert([payload]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupon_codes'] });
      toast.success(language === 'th' ? "สร้างรหัสคูปองเรียบร้อย" : "Coupon code created");
      onClose();
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error(language === 'th' ? "รหัสคูปองนี้มีอยู่แล้วในระบบ" : "This code already exists");
      } else {
        toast.error(language === 'th' ? "บันทึกข้อมูลไม่สำเร็จ" : "Failed to save data");
      }
      console.error(error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.template_id) {
      toast.error(language === 'th' ? "กรุณากรอกข้อมูลให้ครบถ้วน" : "Please fill in all fields");
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[150] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Tag size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1A1F3D]">{language === 'th' ? 'สร้างรหัสคูปอง' : 'Create Coupon Code'}</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">GENERATE CODE</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl transition-all">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">{language === 'th' ? 'รหัสคูปอง' : 'Code'}</label>
              <div className="flex gap-2">
                <input 
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-green-500/5 transition-all uppercase"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                  placeholder="e.g. SUMMER24"
                />
                <button 
                  type="button" 
                  onClick={generateCode}
                  className="bg-gray-100 hover:bg-gray-200 text-[#1A1F3D] px-4 rounded-2xl transition-colors"
                >
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">{language === 'th' ? 'ประเภทเทมเพลต' : 'Template Type'}</label>
              <select 
                className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold appearance-none cursor-pointer"
                value={formData.template_type}
                onChange={e => setFormData({ ...formData, template_type: e.target.value as any, template_id: '' })}
              >
                <option value="promotion">{language === 'th' ? 'โปรโมชั่น' : 'Promotion'}</option>
                <option value="coupon">{language === 'th' ? 'คูปอง/รางวัล' : 'Coupon/Reward'}</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">{language === 'th' ? 'เลือกเทมเพลต' : 'Select Template'}</label>
              <select 
                className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold appearance-none cursor-pointer"
                value={formData.template_id}
                onChange={e => setFormData({ ...formData, template_id: e.target.value })}
                required
              >
                <option value="">{language === 'th' ? '-- เลือกเทมเพลต --' : '-- Select --'}</option>
                {(formData.template_type === 'promotion' ? promotions : coupons)?.map(t => (
                  <option key={t.id} value={t.id}>{t.title} ({t.discount_type === 'percent' ? t.discount_value + '%' : t.discount_value + ' THB'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">{language === 'th' ? 'จำนวนสิทธิ์การใช้' : 'Max Uses'}</label>
              <div className="flex items-center gap-4">
                <input 
                  type="number"
                  min="1"
                  className="flex-1 bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold disabled:opacity-50"
                  value={formData.max_uses}
                  onChange={e => setFormData({ ...formData, max_uses: Number(e.target.value) })}
                  disabled={formData.is_unlimited}
                />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    className="w-5 h-5 rounded border-gray-300 text-green-500 focus:ring-green-500/20"
                    checked={formData.is_unlimited}
                    onChange={e => setFormData({ ...formData, is_unlimited: e.target.checked })}
                  />
                  <span className="text-sm font-bold text-gray-600">{language === 'th' ? 'ไม่จำกัด' : 'Unlimited'}</span>
                </label>
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={createMutation.isPending}
            className="w-full bg-[#1A1F3D] text-white font-black py-5 rounded-[28px] shadow-xl shadow-[#1A1F3D]/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {createMutation.isPending ? (language === 'th' ? "กำลังบันทึก..." : "Saving...") : (language === 'th' ? "บันทึกรหัสคูปอง" : "Save Code")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CouponCodeModal;
