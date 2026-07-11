import React, { useState } from 'react';
import { LayoutDashboard, BedDouble, Settings as SettingsIcon } from 'lucide-react';
import { translations } from '@/utils/translations';
import { useStore } from '@/store/useStore';
import HotelDashboardTab from '@/components/hotel/HotelDashboardTab';
import HotelRoomsTab from '@/components/hotel/HotelRoomsTab';
import HotelSettingsTab from '@/components/hotel/HotelSettingsTab';
import { cn } from '@/lib/utils';

type HotelTab = 'dashboard' | 'rooms' | 'settings';

const Hotel = () => {
  const { language } = useStore();
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<HotelTab>('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'ภาพรวม', icon: LayoutDashboard },
    { id: 'rooms', label: 'ห้องพัก & การจอง', icon: BedDouble },
    { id: 'settings', label: 'ตั้งค่าห้องพัก', icon: SettingsIcon },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f9f9f9] overflow-hidden fade-in">
      {/* Header */}
      <div className="flex flex-col gap-2 p-6 lg:p-8 pb-4 shrink-0">
        <h1 className="text-3xl font-black text-[#1A1F3D] tracking-tight">
          {t.hotel || 'โรงแรมสัตว์เลี้ยง'}
        </h1>
        <p className="text-gray-500 font-medium">
          จัดการการจองห้องพัก สถานะการเข้าพัก และกิจกรรมของสัตว์เลี้ยง
        </p>
      </div>

      {/* Tabs */}
      <div className="px-6 lg:px-8 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as HotelTab)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all duration-300 whitespace-nowrap",
                  isActive 
                    ? "bg-[#18234a] text-white shadow-[0_10px_25px_-5px_rgba(24,35,74,0.3)] translate-y-[-2px] bg-gradient-to-br from-[#18234a] to-[#020d35]" 
                    : "bg-[#f3f3f3] text-[#45464e] hover:bg-[#e8e8e8] hover:text-[#1a1c1c]"
                )}
              >
                <item.icon size={18} className={cn(isActive ? "text-[#EAFD69]" : "text-[#76767f]")} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 lg:px-8 pb-8 overflow-hidden flex flex-col">
        <div className="bg-[#ffffff] rounded-[3rem] p-6 lg:p-8 shadow-[0_8px_32px_rgba(24,35,74,0.04)] flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && <HotelDashboardTab />}
          {activeTab === 'rooms' && <HotelRoomsTab />}
          {activeTab === 'settings' && <HotelSettingsTab />}
        </div>
      </div>
    </div>
  );
};

export default Hotel;
