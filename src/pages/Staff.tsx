"use client";

import React, { useState } from 'react';
import { Plus, Search, Edit3, Trash2, Phone, BadgeCheck, XCircle, Key, Clock, Copy, ShieldAlert, Users, Sparkles } from 'lucide-react';
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

  // ดึงข้อมูลจำนวนผู้ใช้สูงสุด (max_users) ของร้านค้าจาก Supabase
  const { data: storeConfig } = useQuery({
    queryKey: ['store-max-users', storeId],
    queryFn: async () => {
      if (!storeId || storeId === 'default-store') {
        return { max_users: 5 };
      }
      const { data, error } = await supabase
        .from('stores')
        .select('max_users')
        .eq('id', storeId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!storeId && storeId !== 'default-store'
  });

  const maxUsers = storeConfigMaxUsers();

  function storeConfigMaxUsers() {
    return storeId && storeId !== 'default-store' ? (membershipTiersMaxUsers() || 5) : 5;
  }

  function membershipTiersMaxUsers() {
    return storeConfig?.max_users;
  }

  // นับเฉพาะพนักงานที่เชื่อมต่อ Google สำเร็จแล้วเท่านั้น (ไม่มีสถานะ isPendingInvite)
  const usedSlots = staff.filter(s => !s.isPendingInvite).length;
  const remainingSlots = Math.max(0, maxUsers - usedSlots);
  const isQuotaFull = usedSlots >= maxUsers;
  const quotaPercentage = Math.min(100, (usedSlots / maxUsers) * 100);

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
    if (isQuotaFull) {
      toast.error(
        language === 'th' 
          ? `ไม่สามารถเพิ่มพนักงานได้เนื่องจากโควตาเต็มแล้ว (${usedSlots}/${maxUsers} บัญชี)` 
          : `Cannot add staff. Quota is full (${usedSlots}/${maxUsers} accounts)`
      );
      return;
    }
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
          disabled={isQuotaFull}
          className={cn(
            "px-6 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl transition-all active:scale-95",
            isQuotaFull 
              ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none" 
              : "bg-[#1A1F3D] text-white shadow-[#1A1F3D]/10"
          )}
        >
          <Plus size={20} /> {t.addStaff}
        </button>
      </header>

      {/* Quota Status Banner */}
      <div className="px-10 mb-6">
        <div className={cn(
          "p-6 rounded-[32px] border flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-all",
          isQuotaFull 
            ? "bg-red-50/50 border-red-100 text-red-900" 
            : "bg-indigo-50/40 border-indigo-100/50 text-indigo-900"
        )}>
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
              isQuotaFull ? "bg-red-100 text-red-600" : "bg-indigo-100 text-indigo-600"
            )}>
              {isQuotaFull ? <ShieldAlert size={22} /> : <Users size={22} />}
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider">
                {language === 'th' ? 'จำนวนพนักงานที่เพิ่มได้' : 'Employee Quota'}
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                {language === 'th' 
                  ? `เพิ่มแล้ว ${usedSlots} คน จากทั้งหมด ${maxUsers} คน (เพิ่มได้อีก ${remainingSlots} คน)` 
                  : `Used ${usedSlots} of ${maxUsers} accounts (${remainingSlots} remaining)`}
              </p>
            </div>
          </div>

          <div className="w-full md:w-64 space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-gray-400">
              <span>{language === 'th' ? 'เพิ่มพนักงานไปแล้ว' : 'Quota Usage'}</span>
              <span>{Math.round(quotaPercentage)}%</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isQuotaFull ? "bg-red-500" : "bg-indigo-600"
                )}
                style={{ width: `${quotaPercentage}%` }}
              />
            </div>
          </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredStaff.map((member) => (
            <div key={member.id} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm transition-all hover:shadow-xl group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
              <div className="flex justify-between items-start mb-6">
                <img src={member.avatar} className="w-20 h-20 rounded-[28px] object-cover shadow-lg border-4 border-white" />
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(member)} className="p-2 text-gray-300 hover:text-[#1A1F3D] bg-gray-50 rounded-xl transition-all"><Edit3 size={16}/></button>
                  <button onClick={() => deleteStaff(member.id)} className="p-2 text-gray-300 hover:text-red-500 bg-gray-50 rounded-xl transition-all"><Trash2 size={16}/></button>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-black">{member.name}</h3>
                  {member.status === 'Active' ? <BadgeCheck className="text-green-500" size={18} /> : <XCircle className="text-gray-300" size={18} />}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                    member.role === 'Admin' ? "bg-purple-100 text-purple-600" : 
                    member.role === 'Groomer' ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                  )}>
                    {member.role}
                  </span>
                  {member.isPendingInvite ? (
                    <span className="bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1">
                      <Clock size={10} /> รอเชื่อมต่อ Google
                    </span>
                  ) : member.username && (
                    <span className="bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1">
                      <Key size={10} /> {member.username}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-gray-50 mt-auto">
                 <div className="flex items-center gap-3 text-xs font-bold text-gray-400">
                    <Phone size={14} /> {member.phone}
                 </div>
                 <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                    <span className={member.status === 'Active' ? "text-green-500" : "text-red-400"}>
                      {member.status === 'Active' ? t.active : t.inactive}
                    </span>
                 </div>
                 
                 {member.isPendingInvite && (
                   <div className="pt-3">
                     <button
                       onClick={() => {
                         navigator.clipboard.writeText(member.inviteLink || '');
                         toast.success("คัดลอกลิงก์คำเชิญเรียบร้อยแล้ว! ส่งให้พนักงานเพื่อเชื่อมต่อ Google");
                       }}
                       className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10"
                     >
                       <Copy size={12} /> คัดลอกลิงก์คำเชิญ
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