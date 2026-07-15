import React from 'react';
import { Plus, PawPrint } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COLOR_MAP } from './roomColorMap';

interface RoomGlassCardProps {
  room: any; // Room from hotel_rooms
  type: any; // Room type from hotel_room_types
  activeBooking?: any; // Active booking if occupied
  size?: number; // Size in pixels
  onBook: () => void;
  onOpenDetail: () => void;
}

const statusHalo = {
  ok: 'bg-lg-tertiary-fixed/15',      // เขียวมะนาว soft glow = ปกติ
  warn: 'bg-lg-accent-brown/20',        // amber-brown glow = ถึงเวลากิจกรรม
  danger: 'bg-lg-accent-red/15',          // แดง glow = ด่วน
};

const statusBubbleClass = {
  ok: 'bg-lg-secondary-container text-lg-on-secondary-container',
  warn: 'bg-lg-accent-brown/15 text-lg-accent-brown',
  danger: 'bg-lg-accent-red/10 text-lg-accent-red',
};

const statusText = { ok: 'ปกติ', warn: 'ถึงเวลา', danger: 'ด่วน' };

export const RoomGlassCard: React.FC<RoomGlassCardProps> = ({
  room,
  type,
  activeBooking,
  size = 160,
  onBook,
  onOpenDetail,
}) => {
  const isOccupied = activeBooking && activeBooking.status === 'checked_in';
  const sizeLabel = type?.type_name || 'ไม่ระบุ';
  const typeColor = type?.color || 'gray';
  const isHex = typeColor.startsWith('#');
  const badgeClass = !isHex ? (COLOR_MAP[typeColor as keyof typeof COLOR_MAP]?.badge || COLOR_MAP.gray.badge) : '';
  
  const getContrastColor = (hex: string) => {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.slice(0, 2), 16) || 0;
    const g = parseInt(cleanHex.slice(2, 4), 16) || 0;
    const b = parseInt(cleanHex.slice(4, 6), 16) || 0;
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 128 ? '#1a1c1c' : '#ffffff';
  };
  
  const style = { width: `${size}px`, height: `${size}px` };

  // Determine the state of the room to render the correct content
  let status: 'maintenance' | 'cleaning' | 'empty' | 'reserved' | 'occupied';
  if (room.status === 'maintenance') status = 'maintenance';
  else if (room.status === 'cleaning') status = 'cleaning';
  else if (isOccupied) status = 'occupied';
  else if (activeBooking && activeBooking.status === 'reserved') status = 'reserved';
  else status = 'empty';

  // Content rendering based on status
  const renderContent = () => {
    switch (status) {
      case 'maintenance':
        return (
          <button
            data-tilt
            onClick={() => {}}
            className="group relative flex w-full h-full flex-col items-center justify-center gap-2
                       rounded-lg-lg bg-lg-surface-variant/30 backdrop-blur-md
                       shadow-[0_8px_20px_-8px_rgba(2,13,53,0.06),0_4px_0_0_rgba(2,13,53,0.04)]
                       opacity-60 cursor-not-allowed transition-transform duration-150 ease-out z-10"
          >
            <span 
              className={cn("absolute top-3 left-3 rounded-full px-2 py-0.5 text-[10px]", badgeClass)}
              style={isHex ? { backgroundColor: typeColor, color: getContrastColor(typeColor) } : {}}
            >
              {sizeLabel}
            </span>
            <span className="text-label-md text-lg-on-surface-variant">ปรับปรุง</span>
            <span className="text-[13px] text-lg-on-surface-variant/70">{room.room_name}</span>
          </button>
        );
      case 'cleaning':
        return (
          <button
            data-tilt
            onClick={() => {}}
            className="group relative flex w-full h-full flex-col items-center justify-center gap-2
                       rounded-lg-lg bg-lg-surface-variant/50 backdrop-blur-md
                       shadow-[0_8px_20px_-8px_rgba(2,13,53,0.06),0_4px_0_0_rgba(2,13,53,0.04)]
                       opacity-80 transition-transform duration-150 ease-out z-10"
          >
            <span 
              className={cn("absolute top-3 left-3 rounded-full px-2 py-0.5 text-[10px]", badgeClass)}
              style={isHex ? { backgroundColor: typeColor, color: getContrastColor(typeColor) } : {}}
            >
              {sizeLabel}
            </span>
            <span className="text-label-md text-lg-on-surface-variant">ทำความสะอาด</span>
            <span className="text-[13px] text-lg-on-surface-variant/70">{room.room_name}</span>
          </button>
        );
      case 'empty':
        return (
          <button
            data-tilt
            onClick={onBook}
            className="group relative flex w-full h-full flex-col items-center justify-center gap-2
                       rounded-lg-lg bg-lg-surface-container-lowest/60 backdrop-blur-md
                       shadow-[0_8px_20px_-8px_rgba(2,13,53,0.06),0_4px_0_0_rgba(2,13,53,0.04)]
                       transition-all duration-300 ease-out z-10
                       hover:shadow-[0_16px_32px_-8px_rgba(2,13,53,0.14),0_4px_0_0_rgba(2,13,53,0.06)]
                       hover:-translate-y-1"
          >
            <div className="absolute inset-0 rounded-lg-lg border-2 border-green-400/60 animate-pulse pointer-events-none" />
            <span 
              className={cn("absolute top-3 left-3 rounded-full px-2 py-0.5 text-[10px]", badgeClass)}
              style={isHex ? { backgroundColor: typeColor, color: getContrastColor(typeColor) } : {}}
            >
              {sizeLabel}
            </span>
            <Plus className="h-5 w-5 text-lg-on-surface-variant transition-transform group-hover:scale-110" />
            <span className="text-label-md text-lg-on-surface-variant">ว่าง</span>
            <span className="text-[13px] text-lg-on-surface-variant/70">{room.room_name}</span>
          </button>
        );
      case 'reserved':
        return (
          <button
            data-tilt
            onClick={onBook}
            className="group relative flex w-full h-full flex-col items-center justify-center gap-2
                       rounded-lg-lg bg-lg-surface-container-lowest/80 backdrop-blur-md
                       shadow-[0_8px_20px_-8px_rgba(2,13,53,0.08),0_4px_0_0_rgba(2,13,53,0.06)]
                       transition-all duration-300 ease-out z-10
                       hover:shadow-[0_16px_32px_-8px_rgba(2,13,53,0.14),0_4px_0_0_rgba(2,13,53,0.06)]
                       hover:-translate-y-1"
          >
            <div className="absolute inset-0 rounded-lg-lg border-2 border-orange-400/70 animate-pulse pointer-events-none" />
            <span 
              className={cn("absolute top-3 left-3 rounded-full px-2 py-0.5 text-[10px]", badgeClass)}
              style={isHex ? { backgroundColor: typeColor, color: getContrastColor(typeColor) } : {}}
            >
              {sizeLabel}
            </span>
            <span className="text-label-md text-lg-on-surface-variant font-medium">รอเช็คอิน</span>
            <span className="text-[14px] text-lg-on-surface-variant/80">{activeBooking.pets?.name}</span>
            <span className="text-[12px] text-lg-on-surface-variant/50">{room.room_name}</span>
          </button>
        );
      case 'occupied':
        const petStatus = 'ok';
        return (
          <button
            data-tilt
            onClick={onOpenDetail}
            className="group relative flex w-full h-full flex-col items-center justify-center gap-2
                       rounded-lg-lg bg-gradient-to-br from-white/90 to-white/50
                       backdrop-blur-xl shadow-[0_8px_20px_-8px_rgba(2,13,53,0.08),0_4px_0_0_rgba(2,13,53,0.06)]
                       transition-all duration-300 ease-out z-10
                       hover:shadow-[0_16px_32px_-8px_rgba(2,13,53,0.14),0_4px_0_0_rgba(2,13,53,0.06)]
                       hover:-translate-y-1"
          >
            <div className="absolute inset-0 rounded-lg-lg border-2 border-lg-primary/60 animate-pulse pointer-events-none" />
            <span 
              className={cn("absolute top-3 left-3 rounded-full px-2 py-0.5 text-[10px]", badgeClass)}
              style={isHex ? { backgroundColor: typeColor, color: getContrastColor(typeColor) } : {}}
            >
              {sizeLabel}
            </span>

            {/* Pet Highlight halo + Contact shadow */}
            <div className="relative flex flex-col items-center">
              <div className="relative flex h-12 w-12 items-center justify-center">
                <div className={cn("absolute inset-0 rounded-full blur-md scale-150", statusHalo[petStatus])} />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-lg-surface-container-lowest shadow-[0_3px_6px_rgba(2,13,53,0.1)]">
                  <PawPrint className="h-5 w-5 text-lg-primary" />
                </div>
              </div>
              <div className="mt-0.5 h-1.5 w-6 rounded-full bg-lg-on-surface/10 blur-[3px]" />
            </div>

            <span className="text-[16px] font-bold text-lg-on-surface truncate w-full px-2 text-center">
              {activeBooking.pets?.name}
            </span>

            <span className="text-[12px] text-lg-on-surface-variant/50 absolute bottom-3">
              {room.room_name}
            </span>
          </button>
        );
    }
  };

  return (
    <div
      className="relative [perspective:600px] group"
      style={style}
      onMouseMove={(e) => {
        if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) return;
        const card = e.currentTarget.querySelector('[data-tilt]') as HTMLElement;
        if (!card) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `rotateX(${y * -12}deg) rotateY(${x * 12}deg)`;
      }}
      onMouseLeave={(e) => {
        const card = e.currentTarget.querySelector('[data-tilt]') as HTMLElement;
        if (card) {
          card.style.transform = 'rotateX(0deg) rotateY(0deg)';
        }
      }}
    >
      {/* Diamond floor tile */}
      <div
        aria-hidden
        className={cn(
          "absolute left-1/2 top-1/2 h-3/5 w-3/5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-lg",
          "bg-gradient-to-br opacity-40 blur-[2px] transition-colors duration-500 z-0",
          status === 'empty' || status === 'maintenance' || status === 'cleaning'
            ? "from-lg-surface-variant/30 to-transparent"
            : "from-lg-tertiary-fixed/25 to-lg-secondary-container/20"
        )}
      />

      {renderContent()}
    </div>
  );
};
