"use client";

import React, { useState } from 'react';
import { Plus, Search, Edit3, Trash2, Phone, BadgeCheck, XCircle, Key } from 'lucide-react';
import { useStore, Staff as StaffType } from '@/store/useStore';
import { cn } from '@/lib/utils';
import StaffModal from '@/components/StaffModal';
import { translations } from '@/utils/translations';

const Staff = () => {
  const { staff, deleteStaff, language } = useStore();
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffType | null>(null);

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
      <header className="px-10 py-10 shrink-0 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black mb-1">{t.ourTeam}</h1>
          <p className="text-gray-400 font-medium">{t.manageStaff}</p>
        </div>
        <button 
          onClick={handleAdd}
          className="bg-[#1A1F3D] text-white px-6 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-[#1A1F3D]/10"
        >
          <Plus size={20} /> {t.addStaff}
        </button>
      </header>

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
            <div key={member.id} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm group hover:shadow-xl transition-all">
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
                    member.role === 'Groomer' ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                  )}>
                    {member.role}
                  </span>
                  {member.username && (
                    <span className="bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1">
                      <Key size={10} /> {member.username}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-gray-50">
                 <div className="flex items-center gap-3 text-xs font-bold text-gray-400">
                    <Phone size={14} /> {member.phone}
                 </div>
                 <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                    <span className={member.status === 'Active' ? "text-green-500" : "text-red-400"}>
                      {member.status === 'Active' ? t.active : t.inactive}
                    </span>
                 </div>
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