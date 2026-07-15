import React, { useState } from 'react';
import { LayoutDashboard, BedDouble, Settings as SettingsIcon } from 'lucide-react';
import { translations } from '@/utils/translations';
import { useStore } from '@/store/useStore';
import HotelDashboardTab from '@/components/hotel/HotelDashboardTab';
import { HotelFloorPlan } from '@/components/hotel/HotelFloorPlan';
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
    <div className="flex-1 flex flex-col h-full bg-[#f7f8fd] overflow-hidden fade-in">
      {/* Header & Tabs */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-[2rem] px-[3rem] py-[2rem] shrink-0">
        <div className="flex flex-col gap-[0.5rem]">
          <h1 
            className="text-[32px] font-bold leading-normal tracking-[-0.02em] text-[#020d35]" 
            style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}
          >
            {t.hotel || 'โรงแรมสัตว์เลี้ยง'}
          </h1>
          <p 
            className="text-[16px] font-normal leading-[24px] text-[#45464E]" 
            style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}
          >
            จัดการการจองห้องพัก สถานะการเข้าพัก และกิจกรรมของสัตว์เลี้ยง
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-[0.75rem] overflow-x-auto scrollbar-hide py-2 px-1">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as HotelTab)}
                className={cn(
                  "flex items-center gap-[0.5rem] px-[1.25rem] py-[0.75rem] rounded-[2rem] transition-all duration-300 whitespace-nowrap",
                  isActive 
                    ? "bg-gradient-to-br from-[#18234a] to-[#020d35] text-[#ffffff] shadow-[0_20px_40px_rgba(24,35,74,0.04)] translate-y-[-2px]" 
                    : "bg-[#f3f3f3] text-[#45464e] hover:bg-[#e8e8e8] hover:text-[#1a1c1c]"
                )}
                style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif', fontSize: '14px', fontWeight: 500, lineHeight: '20px' }}
              >
                <item.icon size={18} className={cn(isActive ? "text-[#EAFD69]" : "text-[#76767f]")} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className={cn(
        "flex-1 overflow-hidden flex flex-col",
        activeTab !== 'rooms' ? "px-[3rem] pb-[3rem]" : "px-[3rem]"
      )}>
        <div className={cn(
          "flex-1 overflow-y-auto flex flex-col h-full",
          activeTab !== 'rooms' && "bg-white/50 backdrop-blur-xl border border-white/60 rounded-[3rem] p-[2rem] shadow-[0_20px_40px_rgba(24,35,74,0.04)]"
        )}>
          {activeTab === 'dashboard' && <HotelDashboardTab />}
          {activeTab === 'rooms' && <HotelFloorPlan />}
          {activeTab === 'settings' && <HotelSettingsTab />}
        </div>
      </div>
    </div>
  );
};

export default Hotel;

