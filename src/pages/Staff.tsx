"use client";

import React, { useState } from 'react';
import { Plus, Search, Edit3, Trash2, Phone, BadgeCheck, XCircle, Key, Clock, Copy } from 'lucide-react';
import { useStore, Staff as StaffType } from '@/store/useStore';
import { cn } from '@/lib/utils';
import StaffModal from '@/components/StaffModal';
import { translations } from '@/utils/translations';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Staff = () => {
  const { staff, deleteStaff, language, storeId } = useStore();
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffType | null>(null);

  // ดึงข้อมูลจำนวนผู้ใช้สูงสุด (max_users) และจำนวนพนักงานสูงสุด (max_staff) ของร้านค้าจาก Supabase
  const { data: storeConfig } = useQuery({
    queryKey: ['store-max-users', storeId],
    queryFn: async () => {
      if (!storeId || storeId === 'default-store') {
        return { max_users: 5, max_staff: 10 };
      }
      const { data, error } = await supabase
        .from('stores')
        .select('max_users, max_staff')
        .eq('id', storeId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!storeId && storeId !== 'default-store'
  });

  const maxUsers = storeConfig?.max_users || 5;
  const maxStaff = storeConfig?.max_staff || 10;

  // ดึงจำนวนเซสชันที่ใช้งานอยู่ ณ ปัจจุบัน
  const { data: activeSessionsCount } = useQuery({
    queryKey: ['active-sessions-count', storeId],
    queryFn: async () => {
      if (!storeId || storeId === 'default-store') return 0;
      const { count, error } = await supabase
        .from('active_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', storeId);
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 10000 // รีเฟรชทุกๆ 10 วินาที
  });

  const usedSlots = activeSessionsCount || 0;
  const remainingSlots = Math.max(0, maxUsers - usedSlots);
  const isQuotaFull = usedSlots >= maxUsers;
  const quotaPercentage = Math.min(100, (usedSlots / maxUsers) * 100);

  // คำนวณจำนวนพนักงานที่ลงทะเบียนและเปิดใช้งานอยู่
  const activeStaffCount = staff.filter(s => !s.isPendingInvite && s.status === 'Active').length;
  const remainingStaffSlots = Math.max(0, maxStaff - activeStaffCount);
  const isStaffQuotaFull = activeStaffCount >= maxStaff;
  const staffQuotaPercentage = Math.min(100, (activeStaffCount / maxStaff) * 100);

  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.username && s.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleEdit = (s: StaffType) => {
    setEditingStaff(s);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingStaff(null);
    setIsModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="px-10 py-10 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pl-14 lg:pl-10">
        <div>
          <h1 className="text-4xl font-black mb-1">{t.ourTeam}</h1>
          <p className="text-gray-400 font-medium">{t.manageStaff}</p>
        </div>
        <button 
          onClick={handleAdd}
          className="px-6 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl transition-all active:scale-95 bg-[#1A1F3D] text-white shadow-[#1A1F3D]/10"
        >
          <Plus size={20} /> {t.addStaff}
        </button>
      </header>

      {/* Quota Status Banners */}
      <div className="px-10 mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Concurrent Login Quota */}
        <div className={cn(
          "p-6 rounded-[32px] border flex flex-col justify-between gap-4 transition-all",
          isQuotaFull 
            ? "bg-red-50/50 border-red-100 text-red-900" 
            : "bg-indigo-50/40 border-indigo-100/50 text-indigo-900"
        )}>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black uppercase tracking-widest opacity-60">โควตาการใช้งานพร้อมกัน (Concurrent Logins)</span>
              <span className="text-xs font-black">{usedSlots} / {maxUsers}</span>
            </div>
            <div className="w-full bg-gray-200/50 h-2 rounded-full overflow-hidden">
              <div 
                className={cn("h-full transition-all duration-500", isQuotaFull ? "bg-red-500" : "bg-indigo-600")} 
                style={{ width: `${quotaPercentage}%` }}
              />
            </div>
          </div>
          <p className="text-[10px] font-bold opacity-60">
            {isQuotaFull 
              ? "⚠️ โควตาเต็มแล้ว! กรุณาอัปเกรดแพ็กเกจเพื่อเพิ่มจำนวนผู้ใช้งานพร้อมกัน" 
              : `ว่างอีก ${remainingSlots} ช่องทางสำหรับการเข้าใช้งานระบบพร้อมกัน`}
          </p>
        </div>

        {/* Staff Quota */}
        <div className={cn(
          "p-6 rounded-[32px] border flex flex-col justify-between gap-4 transition-all",
          isStaffQuotaFull 
            ? "bg-red-50/50 border-red-100 text-red-900" 
            : "bg-emerald-50/40 border-emerald-100/50 text-emerald-900"
        )}>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black uppercase tracking-widest opacity-60">โควตาพนักงาน (Staff Quota)</span>
              <span className="text-xs font-black">{activeStaffCount} / {maxStaff}</span>
            </div>
            <div className="w-full bg-gray-200/50 h-2 rounded-full overflow-hidden">
              <div 
                className={cn("h-full transition-all duration-500", isStaffQuotaFull ? "bg-red-500" : "bg-emerald-600")} 
                style={{ width: `${staffQuotaPercentage}%` }}
              />
            </div>
          </div>
          <p className="text-[10px] font-bold opacity-60">
            {isStaffQuotaFull 
              ? "⚠️ โควตาพนักงานเต็มแล้ว! กรุณาอัปเกรดแพ็กเกจเพื่อเพิ่มจำนวนพนักงาน" 
              : `สามารถเพิ่มพนักงานได้อีก ${remainingStaffSlots} คน`}
          </p>
        </div>
      </div>

      <div className="px-10 mb-8">
         <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold shadow-sm"
              placeholder={t.searchStaff}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
         </div>
      </div>

      <div className="flex-1 overflow-y-auto px-10 pb-10 scrollbar-hide">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredStaff.map((member) => (
            <div key={member.id} className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm transition-all hover:shadow-xl group relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <img 
                    src={member.avatar} 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name)}`;
                    }}
                    className="w-16 h-16 rounded-[18px] object-cover shadow-md border-2 border-white" 
                    alt={member.name}
                  />
                  <div className="flex gap-1.5">
                    <button onClick={() => handleEdit(member)} className="p-2 text-gray-300 hover:text-[#1A1F3D] bg-gray-50 rounded-xl transition-all"><Edit3 size={14}/></button>
                    <button onClick={() => deleteStaff(member.id)} className="p-2 text-gray-300 hover:text-red-500 bg-gray-50 rounded-xl transition-all"><Trash2 size={14}/></button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <h3 className="text-base font-black">{member.name}</h3>
                    {member.status === 'Active' ? <BadgeCheck className="text-green-500" size={16} /> : <XCircle className="text-gray-300" size={16} />}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full",
                      member.role === 'Admin' ? "bg-purple-100 text-purple-600" : 
                      member.role === 'Groomer' ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                    )}>
                      {member.role}
                    </span>
                    {member.isPendingInvite ? (
                      <span className="bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Clock size={10} /> รอเชื่อมต่อ Google
                      </span>
                    ) : member.username && (
                      <span className="bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Key size={10} /> {member.username}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-gray-50 mt-auto">
                 <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                    <Phone size={12} /> {member.phone || '-'}
                 </div>
                 <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">
                    <span className={member.status === 'Active' ? "text-green-500" : "text-red-400"}>
                      {member.status === 'Active' ? t.active : t.inactive}
                    </span>
                 </div>
                 
                 {member.isPendingInvite && (
                   <div className="pt-2">
                     <button
                       onClick={() => {
                         navigator.clipboard.writeText(member.inviteLink || '');
                         toast.success("คัดลอกลิงก์คำเชิญเรียบร้อยแล้ว! ส่งให้พนักงานเพื่อเชื่อมต่อ Google");
                       }}
                       className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 shadow-md shadow-amber-500/10"
                     >
                       <Copy size={10} /> คัดลอกลิงก์คำเชิญ
                     </button>
                   </div>
                 )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && <StaffModal staff={editingStaff} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

export default Staff;