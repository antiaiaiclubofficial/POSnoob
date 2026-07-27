import React from 'react';
import { parseISO, isAfter, subHours } from 'date-fns';
import { Plus, PawPrint, Power } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COLOR_MAP } from './roomColorMap';
import { RoomTypeBadge } from './RoomTypeBadge';

interface RoomGlassCardProps {
  room: any; // Room from hotel_rooms
  type: any; // Room type from hotel_room_types
  activeBooking?: any; // Active booking if occupied
  size?: number; // Size in pixels
  serviceMode?: 'hotel' | 'daycare';
  onBook: () => void;
  onOpenDetail: () => void;
  onCleanFinish?: () => void;
}

const statusHalo = {
  ok: 'bg-green-400/30',
  warn: 'bg-orange-400/30',
  danger: 'bg-red-500/30',
};

export const RoomGlassCard: React.FC<RoomGlassCardProps> = ({
  room,
  type,
  activeBooking,
  size = 140, // Set default size to be slightly smaller to fit the 3D grid
  serviceMode = 'hotel',
  onBook,
  onOpenDetail,
  onCleanFinish,
}) => {
  const isOccupied = activeBooking && activeBooking.status === 'checked_in';
  const sizeLabel = type?.type_name || 'ไม่ระบุ';
  const typeColor = type?.color || '#a0a0a0';
  const isHex = typeColor.startsWith('#');

  // We make it slightly taller than wide
  const style = { width: `${size}px`, height: `${size * 1.15}px` };

  let status: 'maintenance' | 'cleaning' | 'empty' | 'reserved' | 'occupied';
  if (room.status === 'maintenance') status = 'maintenance';
  else if (room.status === 'cleaning') status = 'cleaning';
  else if (isOccupied) status = 'occupied';
  else if (activeBooking && activeBooking.status === 'reserved') status = 'reserved';
  else status = 'empty';

  // Toggle state
  const isToggleOn = status === 'occupied' || status === 'reserved';



  const renderContent = () => {
    switch (status) {
      case 'maintenance':
        return (
          <button
            data-tilt
            onClick={() => { }}
            style={{ WebkitFontSmoothing: 'antialiased', backfaceVisibility: 'hidden', transform: 'translateZ(1px)' }}
            className="group relative flex w-full h-full flex-col items-center justify-center p-4
                       rounded-[1.5rem] bg-white/90 border border-white/40
                       shadow-[0_8px_32px_rgba(31,38,135,0.15)] overflow-hidden
                       opacity-60 cursor-not-allowed transition-transform duration-300 ease-out z-10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
            <div className="mb-2">
              <RoomTypeBadge type={type} className="text-[12px] px-3 py-1" />
            </div>
            <Power className="h-8 w-8 text-gray-400 mb-2 opacity-50" />
            <span className="text-[20px] font-bold text-gray-700 text-center leading-tight">ปรับปรุง</span>
            <span className="text-[16px] font-medium text-gray-500 mt-1">{room.room_name}</span>
          </button>
        );
      case 'cleaning':
        return (
          <button
            data-tilt
            onClick={(e) => { e.stopPropagation(); onCleanFinish?.(); }}
            style={{ WebkitFontSmoothing: 'antialiased', backfaceVisibility: 'hidden', transform: 'translateZ(1px)' }}
            className="group relative flex w-full h-full flex-col items-center justify-center p-4
                       rounded-[1.5rem] bg-white/90 border border-white/50
                       shadow-[0_8px_32px_rgba(31,38,135,0.15)] overflow-hidden
                       opacity-80 transition-transform duration-300 ease-out z-10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
            <div className="mb-2">
              <RoomTypeBadge type={type} className="text-[12px] px-3 py-1" />
            </div>
            <Power className="h-8 w-8 text-blue-400 mb-2 opacity-80" />
            <span className="text-[20px] font-bold text-blue-700 text-center leading-tight">ทำความสะอาด</span>
            <span className="text-[16px] font-medium text-gray-500 mt-1">{room.room_name}</span>
          </button>
        );
      case 'empty':
        return (
          <button
            data-tilt
            onClick={onBook}
            style={{ WebkitFontSmoothing: 'antialiased', backfaceVisibility: 'hidden', transform: 'translateZ(1px)' }}
            className="group relative flex w-full h-full flex-col items-center justify-center p-4
                       rounded-[1.5rem] bg-white/80 border border-white/40
                       shadow-[0_8px_32px_rgba(31,38,135,0.1)] overflow-hidden
                       transition-all duration-300 ease-out z-10
                       hover:bg-white/90 hover:shadow-[0_16px_32px_rgba(31,38,135,0.2)] hover:-translate-y-2"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent pointer-events-none" />
            <div className="mb-2">
              <RoomTypeBadge type={type} className="text-[12px] px-3 py-1" />
            </div>
            <div className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-inner">
              <Plus className="h-5 w-5 text-gray-500" />
            </div>
            <span className="text-[20px] font-bold text-gray-800 text-center leading-tight">
              {serviceMode === 'daycare' ? 'ว่าง' : 'ว่าง'}
            </span>
            <span className="text-[16px] font-medium text-gray-600 mt-1">{room.room_name}</span>
          </button>
        );
      case 'reserved':
      case 'occupied': {
        const expectedDate = activeBooking?.check_out_expected ? parseISO(activeBooking.check_out_expected) : null;
        const isOverdue = status === 'occupied' && expectedDate && isAfter(new Date(), expectedDate);
        const isWaitingForPickup = status === 'occupied' && expectedDate && !isOverdue && isAfter(new Date(), subHours(expectedDate, 1));
        
        let statusText = 'เข้าพักอยู่';
        let statusColor = 'text-gray-400';
        let haloClass = statusHalo.ok;
        
        if (status === 'reserved') {
          statusText = 'รอเช็คอิน';
        } else if (isOverdue) {
          statusText = 'เลยเวลา';
          statusColor = 'text-red-500';
          haloClass = statusHalo.danger;
        } else if (isWaitingForPickup) {
          statusText = 'รอรับกลับ';
          statusColor = 'text-orange-500';
          haloClass = statusHalo.warn;
        }

        return (
          <button
            data-tilt
            onClick={status === 'occupied' ? onOpenDetail : onBook}
            style={{ WebkitFontSmoothing: 'antialiased', backfaceVisibility: 'hidden', transform: 'translateZ(1px)' }}
            className="group relative flex w-full h-full flex-col items-center justify-center p-4
                       rounded-[1.5rem] bg-white/95 border border-white/80
                       shadow-[0_8px_32px_rgba(31,38,135,0.2)] overflow-hidden
                       transition-all duration-300 ease-out z-10
                       hover:bg-white hover:shadow-[0_16px_40px_rgba(31,38,135,0.3)] hover:-translate-y-2"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-transparent pointer-events-none" />
            
            {/* Status indicator (like temperature in the image) */}
            <div className="absolute top-3 w-full text-center">
              <span className={cn("text-[11px] font-black uppercase tracking-wider", statusColor)}>
                {statusText}
              </span>
            </div>

            <div className="relative flex h-12 w-12 items-center justify-center mt-3 mb-1">
              <div className={cn("absolute inset-0 rounded-full blur-xl scale-150 transition-opacity", haloClass)} />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md">
                <PawPrint className="h-5 w-5 text-cyan-500" />
              </div>
            </div>

            <span className="text-[20px] font-extrabold text-gray-900 text-center leading-tight truncate w-full px-1">
              {activeBooking?.pets?.name || 'Unknown'}
            </span>
            <span className="text-[16px] font-medium text-gray-600 mt-1">{room.room_name}</span>
          </button>
        );
      }
    }
  };

  return (
    <div
      className="relative group perspective-[1000px] pointer-events-auto"
      style={style}
      onMouseMove={(e) => {
        if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) return;
        const card = e.currentTarget.querySelector('[data-tilt]') as HTMLElement;
        if (!card) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `rotateX(${y * -20}deg) rotateY(${x * 20}deg)`;
      }}
      onMouseLeave={(e) => {
        const card = e.currentTarget.querySelector('[data-tilt]') as HTMLElement;
        if (card) {
          card.style.transform = 'rotateX(0deg) rotateY(0deg)';
        }
      }}
    >
      {renderContent()}
    </div>
  );
};

