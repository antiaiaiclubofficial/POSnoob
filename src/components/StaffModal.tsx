"use client";

import React, { useState, useEffect } from 'react';
import { X, Zap, Save, Trash2 } from 'lucide-react';
import { useStore, Staff, StaffRole } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface StaffModalProps {
  staff?: Staff | null;
  onClose: () => void;
}

const StaffModal = ({ staff, onClose }: StaffModalProps) => {
  const { addStaff, updateStaff, language, staff: allStaff, maxStaff } = useStore();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<StaffRole>('Assistant');
  const [commissionRate, setCommissionRate] = useState(0);
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop');

  useEffect(() => {
    if (staff) {
      setName(staff.name);
      setPhone(staff.phone);
      setRole(staff.role);
      setCommissionRate(staff.commissionRate || 0);
      setStatus(staff.status);
      setAvatar(staff.avatar);
    }
  }, [staff]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      toast.error(language === 'th' ? "กรุณากรอกชื่อและเบอร์โทรศัพท์" : "Name and Phone are required");
      return;
    }

    const limit = maxStaff || 10;
    const activeStaffCount = allStaff.filter(s => !s.isPendingInvite && s.status === 'Active' && s.id !== (staff?.id || '')).length;

    if (status === 'Active' && (!staff || staff.status !== 'Active') && activeStaffCount >= limit) {
      toast.error(
        language === 'th' 
          ? `ไม่สามารถตั้งสถานะเป็นใช้งานได้เนื่องจากจำนวนบัญชีพนักงานเต็มแล้ว (${activeStaffCount}/${limit} บัญชี)` 
          : `Cannot set status to Active. Staff account limit reached (${activeStaffCount}/${limit} accounts)`
      );
      return;
    }

    const payload = {
      name,
      phone,
      role,
      commissionRate,
      status,
      avatar
    };

    if (staff) {
      updateStaff(staff.id, payload);
      toast.success(language === 'th' ? "อัปเดตข้อมูลพนักงานเรียบร้อย" : "Staff updated successfully");
    } else {
      addStaff(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-[#1A1F3D]">{staff ? 'แก้ไขพนักงาน' : 'เพิ่มพนักงาน'}</h2>
            <p className="text-xs text-gray-400 font-medium">จัดการข้อมูลพนักงาน</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto scrollbar-hide">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">ชื่อพนักงาน</label>
              <input 
                className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="เช่น สมชาย ใจดี"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">เบอร์โทรศัพท์</label>
              <input 
                className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="เช่น 0812345678"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">ตำแหน่ง</label>
                <select 
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl px-4 py-3.5 text-xs font-bold appearance-none"
                  value={role}
                  onChange={e => setRole(e.target.value as StaffRole)}
                >
                  <option value="Admin">Admin</option>
                  <option value="Groomer">Groomer</option>
                  <option value="Assistant">Assistant</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">คอมมิชชั่น (%)</label>
                <input 
                  type="number"
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-3.5 text-sm font-bold"
                  value={commissionRate}
                  onChange={e => setCommissionRate(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">สถานะ</label>
              <select 
                className="w-full bg-[#F5F6FA] border-none rounded-2xl px-4 py-3.5 text-xs font-bold appearance-none"
                value={status}
                onChange={e => setStatus(e.target.value as any)}
              >
                <option value="Active">เปิดใช้งาน</option>
                <option value="Inactive">ปิดใช้งาน</option>
              </select>
            </div>
          </div>

          <button className="w-full bg-[#1A1F3D] text-white font-black py-4 rounded-2xl shadow-xl shadow-[#1A1F3D]/10 hover:bg-[#2A3152] transition-all mt-4">
            {staff ? 'บันทึกการแก้ไข' : 'เพิ่มพนักงาน'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StaffModal;