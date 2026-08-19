"use client";

import React from 'react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { Lock, Ban, Check } from 'lucide-react';
import { format } from 'date-fns';

interface SlotPickerProps {
  selectedDate?: Date;
  selectedTime: string;
  onSelect: (time: string) => void;
}

const SlotPicker = ({ selectedDate, selectedTime, onSelect }: SlotPickerProps) => {
  const { queue, slotDuration, openTime, closeTime, disabledSlots, maxCapacity, toggleSlotStatus } = useStore();

  // Generate slots
  const slots = React.useMemo(() => {
    const list: string[] = [];
    const [openH, openM] = openTime.split(':').map(Number);
    const [closeH, closeM] = closeTime.split(':').map(Number);
    
    let current = new Date();
    current.setHours(openH, openM, 0, 0);
    
    const end = new Date();
    end.setHours(closeH, closeM, 0, 0);
    
    while (current < end) {
      list.push(current.toTimeString().slice(0, 5));
      current.setMinutes(current.getMinutes() + slotDuration);
    }
    return list;
  }, [openTime, closeTime, slotDuration]);

  const getSlotStatus = (time: string) => {
    // 1. ตรวจสอบว่าโดนเจ้าของร้านปิดแบบ Manual หรือไม่
    if (disabledSlots.includes(time)) return 'closed';
    
    // 2. ตรวจสอบจำนวนคิวที่มีใน Slot นี้
    const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
    const currentBookings = queue.filter(q => q.time === time && (!dateStr || q.date === dateStr)).length;
    if (currentBookings >= maxCapacity) return 'booked';
    
    return 'available';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <p className="text-xs font-black uppercase text-gray-400 tracking-widest">เวลาที่ว่าง</p>
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-[#D9ED5F] rounded-full" />
            <span className="text-[10px] font-bold text-gray-400 uppercase">ว่าง</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-orange-400 rounded-full" />
            <span className="text-[10px] font-bold text-gray-400 uppercase">ใกล้เต็ม</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-red-400 rounded-full" />
            <span className="text-[10px] font-bold text-gray-400 uppercase">เต็ม</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2.5 max-h-[280px] overflow-y-auto pr-2 scrollbar-hide">
        {slots.map((time) => {
          const status = getSlotStatus(time);
          const isSelected = selectedTime === time;
          const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
          const bookingsInSlot = queue.filter(q => q.time === time && (!dateStr || q.date === dateStr)).length;

          return (
            <button
              key={time}
              type="button"
              onClick={() => status === 'available' && onSelect(isSelected ? '' : time)}
              onContextMenu={(e) => {
                e.preventDefault();
                toggleSlotStatus(time);
              }}
              className={cn(
                "relative group flex flex-col items-center justify-center py-2.5 rounded-2xl border-2 transition-all overflow-hidden",
                status === 'available' && isSelected ? "bg-[#1A1F3D] border-[#1A1F3D] text-white scale-[1.02] shadow-lg shadow-[#1A1F3D]/10" :
                status === 'available' && bookingsInSlot > 0 ? "bg-white border-orange-300 text-gray-600 hover:bg-orange-50/50" :
                status === 'available' ? "bg-white border-[#D9ED5F] text-gray-600 hover:bg-[#D9ED5F]/20" :
                status === 'booked' ? "bg-red-50 border-red-300 text-red-400 cursor-not-allowed" :
                "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 text-[#D9ED5F]">
                  <Check size={12} strokeWidth={4} />
                </div>
              )}
              <span className="text-xs font-black leading-tight">{time}</span>
              {status === 'available' && (
                <span className={cn("text-[9px] font-black leading-tight mt-0.5", isSelected ? "text-[#D9ED5F] opacity-100" : "opacity-40")}>
                  {bookingsInSlot}/{maxCapacity}
                </span>
              )}
              
              {status === 'booked' && (
                <div className="absolute inset-0 bg-red-50/40 flex items-center justify-center backdrop-blur-[1px]">
                  <Lock size={12} className="text-red-400" />
                </div>
              )}
              
              {status === 'closed' && (
                <div className="absolute inset-0 bg-gray-100/40 flex items-center justify-center">
                  <Ban size={12} className="text-gray-400" />
                </div>
              )}


            </button>
          );
        })}
      </div>
      
      <p className="text-[10px] text-gray-400 font-medium italic px-2">
        * คลิกขวาที่เวลาเพื่อเปิด/ปิดคิว
      </p>
    </div>
  );
};

export default SlotPicker;