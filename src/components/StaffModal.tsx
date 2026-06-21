"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, User, Phone, Briefcase, Camera, Percent, Upload, Sparkles } from 'lucide-react';
import { useStore, Staff, StaffRole } from '@/store/useStore';
import { translations } from '@/utils/translations';
import { toast } from 'sonner';

interface StaffModalProps {
  staff?: Staff | null;
  onClose: () => void;
}

const StaffModal = ({ staff, onClose }: StaffModalProps) => {
  const { addStaff, updateStaff, language, staff: allStaff, maxUsers } = useStore();
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    role: 'Assistant' as StaffRole,
    phone: '',
    status: 'Active' as 'Active' | 'Inactive',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    commissionRate: 0
  });

  useEffect(() => {
    if (staff) {
      setFormData({
        name: staff.name,
        role: staff.role,
        phone: staff.phone,
        status: staff.status,
        avatar: staff.avatar,
        commissionRate: staff.commissionRate || 0
      });
    }
  }, [staff]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error(language === 'th' ? "กรุณากรอกชื่อและเบอร์โทรศัพท์" : "Name and Phone are required");
      return;
    }

    const limit = maxUsers || 5;
    const activeStaffCount = allStaff.filter(s => !s.isPendingInvite && s.status === 'Active' && s.id !== (staff?.id || '')).length;

    if (formData.status === 'Active' && (!staff || staff.status !== 'Active') && activeStaffCount >= limit) {
      toast.error(
        language === 'th' 
          ? `ไม่สามารถตั้งสถานะเป็นใช้งานได้เนื่องจากจำนวน Active User เต็มแล้ว (${activeStaffCount}/${limit} บัญชี)` 
          : `Cannot set status to Active. Active user limit reached (${activeStaffCount}/${limit} accounts)`
      );
      return;
    }

    if (staff) {
      updateStaff(staff.id, formData);
      toast.success(language === 'th' ? "อัปเดตข้อมูลพนักงานเรียบร้อย" : "Staff updated successfully");
    } else {
      addStaff(formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-[#1A1F3D]">{staff ? t.editStaff : t.addStaff}</h2>
            <p className="text-xs text-gray-400 font-medium">{t.staffManagement}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto scrollbar-hide">
          {/* Avatar Upload Section */}
          <div className="flex justify-center mb-4">
             <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-24 h-24 rounded-[32px] overflow-hidden border-4 border-[#F5F6FA] shadow-md transition-transform group-hover:scale-105">
                  <img src={formData.avatar} className="w-full h-full object-cover" alt="Staff Avatar" />
                </div>
                <div className="absolute inset-0 bg-[#1A1F3D]/40 rounded-[32px] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white mb-1" size={20} />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#1A1F3D] text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                  <Upload size={12} />
                </div>
             </div>
             <input 
               type="file" 
               ref={fileInputRef} 
               className="hidden" 
               accept="image/*" 
               onChange={handleImageUpload} 
             />
          </div>

          <div className="space-y-4">
            {!staff && (
              <div className="bg-indigo-50/50 p-5 rounded-[28px] border border-indigo-100 flex items-start gap-3 text-indigo-800">
                <Sparkles className="text-indigo-500 shrink-0 mt-0.5" size={16} />
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-wider mb-1">เชื่อมต่อผ่าน Google</p>
                  <p className="text-[11px] font-medium leading-relaxed text-indigo-700">
                    ระบบจะสร้างลิงก์คำเชิญให้โดยอัตโนมัติหลังจากกดเพิ่มพนักงาน เพื่อให้พนักงานนำไปเชื่อมต่อบัญชี Google ของตนเอง
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">{t.profileInfo}</p>
              <div>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input 
                    type="text"
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder={t.employeeFullName}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">{t.role}</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                    <select 
                      className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-10 pr-4 py-3.5 text-xs font-bold appearance-none"
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value as StaffRole})}
                    >
                      <option value="Admin">Admin</option>
                      <option value="Groomer">Groomer</option>
                      <option value="Assistant">Assistant</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">{t.commissionRate}</label>
                  <div className="relative">
                    <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                    <input 
                      type="number"
                      className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-10 pr-4 py-3.5 text-xs font-bold"
                      value={formData.commissionRate}
                      onChange={e => setFormData({...formData, commissionRate: Number(e.target.value)})}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">{t.phone}</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      type="tel"
                      className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      placeholder={t.contactNumber}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">{t.status}</label>
                  <select 
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl px-4 py-3.5 text-xs font-bold appearance-none"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                  >
                    <option value="Active">{t.active}</option>
                    <option value="Inactive">{t.inactive}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <button className="w-full bg-[#1A1F3D] text-white font-black py-4 rounded-2xl shadow-xl shadow-[#1A1F3D]/10 hover:bg-[#2A3152] transition-all mt-4">
            {staff ? t.updateStaffMember : t.addToTeam}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StaffModal;