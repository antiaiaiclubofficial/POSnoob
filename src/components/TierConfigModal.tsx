"use client";

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Sparkles, Gift, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { IconPicker, getIconComponent } from '@/components/ui/IconPicker';
import { CustomColorPicker } from '@/components/hotel/HotelSettingsTab';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { translations } from '@/utils/translations';

interface TierConfigModalProps {
  tier?: any | null;
  onClose: () => void;
}

const TierConfigModal = ({ tier, onClose }: TierConfigModalProps) => {
  const queryClient = useQueryClient();
  const { language, storeId } = useStore();
  const t = translations[language];

  const [formData, setFormData] = useState({
    name: '',
    min_points: 0,
    color_class: '#f59e0b',
    icon_name: 'Crown',
    description: '',
    benefits: [] as string[]
  });
  const [newBenefit, setNewBenefit] = useState('');

  useEffect(() => {
    if (tier) {
      let parsedBenefits: string[] = [];
      if (Array.isArray(tier.benefits)) {
        parsedBenefits = tier.benefits;
      } else if (typeof tier.benefits === 'string') {
        try {
          const parsed = JSON.parse(tier.benefits);
          if (Array.isArray(parsed)) parsedBenefits = parsed;
        } catch (e) {
          parsedBenefits = [];
        }
      }
      
      setFormData({
        name: tier.name || '',
        min_points: tier.min_points || 0,
        color_class: tier.color_class || '#f59e0b',
        icon_name: tier.icon_name || 'Crown',
        description: tier.description || '',
        benefits: parsedBenefits
      });
    }
  }, [tier]);

  const upsertMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        name: data.name,
        min_points: Number(data.min_points),
        color_class: data.color_class,
        icon_name: data.icon_name,
        description: data.description,
        benefits: data.benefits,
        store_id: storeId && storeId !== 'default-store' ? storeId : null
      };

      if (tier) {
        const { error } = await supabase.from('membership_tiers').update(payload).eq('id', tier.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('membership_tiers').insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membership_tiers_marketing'] });
      queryClient.invalidateQueries({ queryKey: ['membership_tiers'] });
      toast.success(tier ? (language === 'th' ? "อัปเดตระดับสมาชิกเรียบร้อย" : "Tier updated") : (language === 'th' ? "สร้างระดับสมาชิกเรียบร้อย" : "Tier created"));
      onClose();
    },
    onError: (error) => {
      toast.error(language === 'th' ? "บันทึกข้อมูลไม่สำเร็จ" : "Failed to save data");
      console.error(error);
    }
  });

  const handleAddBenefit = () => {
    const trimmed = newBenefit.trim();
    if (!trimmed) {
      toast.error("กรุณากรอกข้อความสิทธิประโยชน์");
      return;
    }
    if (formData.benefits.includes(trimmed)) {
      toast.error("มีสิทธิประโยชน์นี้อยู่แล้ว");
      return;
    }
    setFormData(prev => ({ ...prev, benefits: [...prev.benefits, trimmed] }));
    setNewBenefit('');
  };

  const handleRemoveBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    upsertMutation.mutate(formData);
  };

  const SelectedIcon = getIconComponent(formData.icon_name);
  const color = formData.color_class && formData.color_class.startsWith('#') 
    ? formData.color_class 
    : (formData.color_class?.includes('blue') ? '#3b82f6' : formData.color_class?.includes('amber') ? '#f59e0b' : formData.color_class?.includes('purple') ? '#a855f7' : formData.color_class?.includes('indigo') ? '#6366f1' : formData.color_class?.includes('rose') ? '#f43f5e' : '#9ca3af');


  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: color, color: 'white' }}
            >
              <SelectedIcon size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1A1F3D]">{tier ? (language === 'th' ? 'แก้ไขระดับสมาชิก' : 'Edit Tier') : (language === 'th' ? 'สร้างระดับสมาชิก' : 'Create Tier')}</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{language === 'th' ? 'รายละเอียดระดับสมาชิก' : 'Tier Details'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">ชื่อระดับสมาชิก (Tier Name)</label>
              <input
                className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="เช่น Gold, VIP"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">ยอด/คะแนนขั้นต่ำ (Min Spent/Points)</label>
              <input
                type="number"
                className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all"
                value={formData.min_points}
                onChange={e => setFormData({ ...formData, min_points: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">ไอคอน (Icon)</label>
              <IconPicker
                 value={formData.icon_name}
                 onChange={(iconName) => setFormData({ ...formData, icon_name: iconName })}
                 triggerClassName="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold shadow-none hover:bg-[#E5E7EB] h-[52px]"
                 className="z-[250]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">สี (Color)</label>
              <Popover>
                 <PopoverTrigger asChild>
                   <button type="button" className="w-full flex items-center justify-between bg-[#F5F6FA] px-6 py-4 rounded-2xl border-none shadow-none text-sm font-bold text-[#1A1F3D] hover:bg-[#E5E7EB] transition-colors h-[52px]">
                     <div className="flex items-center gap-3">
                       <div 
                         className="w-5 h-5 rounded-full border shadow-inner" 
                         style={{ backgroundColor: color }} 
                       />
                       <span>เลือกสี</span>
                     </div>
                     <ChevronDown size={14} className="text-gray-400" />
                   </button>
                 </PopoverTrigger>
                 <PopoverContent className="w-auto p-0 border-none shadow-xl rounded-2xl overflow-hidden z-[250]" align="end">
                   <CustomColorPicker 
                     color={color} 
                     onChange={(hex) => setFormData({ ...formData, color_class: hex })} 
                   />
                 </PopoverContent>
               </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">คำอธิบาย (Description)</label>
            <textarea
              className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold h-24 resize-none focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="เช่น สมาชิกเริ่มต้นสำหรับลูกค้าทั่วไป..."
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">สิทธิประโยชน์ (Benefits)</label>
            
            <div className="flex gap-2">
              <input
                className="flex-1 bg-[#F5F6FA] border-none rounded-2xl px-5 py-3 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all"
                value={newBenefit}
                onChange={e => setNewBenefit(e.target.value)}
                placeholder="เช่น ส่วนลดบริการ 5%..."
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddBenefit();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddBenefit}
                className="bg-[#1A1F3D] text-white p-3.5 rounded-2xl hover:bg-[#2A3152] transition-all shrink-0"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
              {formData.benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-3">
                    <Gift size={14} className="text-indigo-500 shrink-0" />
                    <span className="text-xs font-bold text-gray-700">{benefit}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveBenefit(idx)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {formData.benefits.length === 0 && (
                <p className="text-xs text-gray-400 font-bold text-center py-6 italic">ยังไม่มีการเพิ่มสิทธิประโยชน์</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={upsertMutation.isPending}
            className="w-full bg-[#1A1F3D] text-white font-black py-5 rounded-[24px] flex items-center justify-center gap-3 shadow-xl shadow-[#1A1F3D]/10 active:scale-95 transition-all disabled:opacity-50"
          >
            {upsertMutation.isPending ? "Saving..." : <><Save size={18} /> บันทึกการเปลี่ยนแปลง</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TierConfigModal;
