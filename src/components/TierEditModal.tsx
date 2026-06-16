"use client";

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Sparkles, Gift } from 'lucide-react';
import { toast } from 'sonner';

interface TierEditModalProps {
  tier: {
    name: string;
    description: string;
    benefits: any;
  };
  onClose: () => void;
  onSave: (description: string, benefits: string[]) => void;
}

const TierEditModal = ({ tier, onClose, onSave }: TierEditModalProps) => {
  const [description, setDescription] = useState('');
  const [benefits, setBenefits] = useState<string[]>([]);
  const [newBenefit, setNewBenefit] = useState('');

  useEffect(() => {
    if (tier) {
      setDescription(tier.description || '');
      // ตรวจสอบและแปลงข้อมูล benefits จาก JSONB
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
      setBenefits(parsedBenefits);
    }
  }, [tier]);

  const handleAddBenefit = () => {
    const trimmed = newBenefit.trim();
    if (!trimmed) {
      toast.error("กรุณากรอกข้อความสิทธิประโยชน์");
      return;
    }
    if (benefits.includes(trimmed)) {
      toast.error("มีสิทธิประโยชน์นี้อยู่แล้ว");
      return;
    }
    setBenefits([...benefits, trimmed]);
    setNewBenefit('');
  };

  const handleRemoveBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(description, benefits);
    toast.success("อัปเดตคำอธิบายและสิทธิประโยชน์ชั่วคราวแล้ว อย่าลืมกดบันทึกการเปลี่ยนแปลงที่หน้าหลัก");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1A1F3D] rounded-2xl flex items-center justify-center text-[#D9ED5F] shadow-lg">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1A1F3D]">แก้ไขรายละเอียด</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ระดับสมาชิก: {tier.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
          {/* Description */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">คำอธิบายระดับสมาชิก (Description)</label>
            <textarea
              className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold h-24 resize-none focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="เช่น สมาชิกเริ่มต้นสำหรับลูกค้าทั่วไป..."
            />
          </div>

          {/* Benefits List */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">สิทธิประโยชน์ (Benefits)</label>
            
            {/* Add Benefit Input */}
            <div className="flex gap-2">
              <input
                className="flex-1 bg-[#F5F6FA] border-none rounded-2xl px-5 py-3 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all"
                value={newBenefit}
                onChange={e => setNewBenefit(e.target.value)}
                placeholder="เช่น ส่วนลดบริการอาบน้ำ 5%..."
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

            {/* Benefits Items */}
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
              {benefits.map((benefit, idx) => (
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
              {benefits.length === 0 && (
                <p className="text-xs text-gray-400 font-bold text-center py-6 italic">ยังไม่มีการเพิ่มสิทธิประโยชน์</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-[#1A1F3D] text-white font-black py-5 rounded-[24px] flex items-center justify-center gap-3 shadow-xl shadow-[#1A1F3D]/10 active:scale-95 transition-all"
          >
            <Save size={18} /> ยืนยันการแก้ไข
          </button>
        </form>
      </div>
    </div>
  );
};

export default TierEditModal;