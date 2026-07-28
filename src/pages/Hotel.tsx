import React, { useState } from 'react';
import { LayoutDashboard, BedDouble, Settings as SettingsIcon, History } from 'lucide-react';
import { translations } from '@/utils/translations';
import { useStore } from '@/store/useStore';
import HotelDashboardTab from '@/components/hotel/HotelDashboardTab';
import { HotelFloorPlan } from '@/components/hotel/HotelFloorPlan';
import HotelSettingsTab from '@/components/hotel/HotelSettingsTab';
import HotelHistoryTab from '@/components/hotel/HotelHistoryTab';
import { cn } from '@/lib/utils';

type HotelTab = 'dashboard' | 'rooms' | 'settings' | 'history';

const Hotel = () => {
  const { language } = useStore();
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<HotelTab>('dashboard');
  const [serviceMode, setServiceMode] = useState<'hotel' | 'daycare'>('hotel');

  const menuItems = [
    { id: 'dashboard', label: 'ภาพรวม', icon: LayoutDashboard },
    { id: 'rooms', label: 'แผนผัง & สถานะ', icon: BedDouble },
    { id: 'settings', label: 'ตั้งค่าห้องพัก', icon: SettingsIcon },
    { id: 'history', label: 'ประวัติการเข้าพัก', icon: History },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f7f8fd] overflow-hidden fade-in">
      {/* Header & Tabs */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-[2rem] px-[3rem] py-[2rem] shrink-0">
        <div className="flex flex-col gap-[0.5rem]">
          <h1 
            className="text-[32px] font-bold leading-normal tracking-[-0.02em] text-[#020d35]" 
            style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}
          >
            {t.hotel || 'Hotel & Day Care'}
          </h1>
          <p 
            className="text-[16px] font-normal leading-[24px] text-[#45464E] mb-[0.5rem]" 
            style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}
          >
            จัดการการจองห้องพัก สถานะการเข้าพัก และกิจกรรมของสัตว์เลี้ยง
          </p>

          <div className="flex bg-[#e2e2e2] p-[0.35rem] rounded-[2rem] w-fit shadow-[inset_0_4px_10px_rgba(0,0,0,0.03)]">
            <button
              onClick={() => setServiceMode('hotel')}
              className={cn(
                "px-[1.5rem] py-[0.5rem] rounded-[1.5rem] text-[14px] font-semibold transition-all duration-300",
                serviceMode === 'hotel' 
                  ? "bg-[#ffffff] text-[#020d35] shadow-[0_2px_10px_rgba(0,0,0,0.05)]" 
                  : "text-[#76767f] hover:text-[#1a1c1c]"
              )}
              style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}
            >
              โรงแรม (Hotel)
            </button>
            <button
              onClick={() => setServiceMode('daycare')}
              className={cn(
                "px-[1.5rem] py-[0.5rem] rounded-[1.5rem] text-[14px] font-semibold transition-all duration-300",
                serviceMode === 'daycare' 
                  ? "bg-[#ffffff] text-[#020d35] shadow-[0_2px_10px_rgba(0,0,0,0.05)]" 
                  : "text-[#76767f] hover:text-[#1a1c1c]"
              )}
              style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}
            >
              ฝากเลี้ยง (Day Care)
            </button>
          </div>
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
      <div className="flex-1 overflow-hidden flex flex-col px-[3rem] pb-[3rem]">
        <div className={cn(
          "flex-1 flex flex-col h-full bg-white/50 backdrop-blur-xl border border-white/60 rounded-[3rem] shadow-[0_20px_40px_rgba(24,35,74,0.04)]",
          activeTab === 'rooms' ? 'p-0 overflow-hidden' : 'p-[2rem] overflow-y-auto'
        )}>
          {activeTab === 'dashboard' && <HotelDashboardTab serviceMode={serviceMode} />}
          {activeTab === 'rooms' && <HotelFloorPlan serviceMode={serviceMode} />}
          {activeTab === 'settings' && <HotelSettingsTab serviceMode={serviceMode} />}
          {activeTab === 'history' && <HotelHistoryTab serviceMode={serviceMode} />}
        </div>
      </div>
    </div>
  );
};

export default Hotel;

