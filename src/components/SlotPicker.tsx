"use client";

import React from 'react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { Lock, Ban, Check } from 'lucide-react';

interface SlotPickerProps {
  selectedTime: string;
  onSelect: (time: string) => void;
}

const SlotPicker = ({ selectedTime, onSelect }: SlotPickerProps) => {
  const { queue, slotDuration, openTime, closeTime, disabledSlots, toggleSlotStatus } = useStore();

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
    if (disabledSlots.includes(time)) return 'closed';
    if (queue.some(q => q.time === time)) return 'booked';
    return 'available';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Available Slots</p>
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-[#D9ED5F] rounded-full" />
            <span className="text-[8px] font-bold text-gray-400 uppercase">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-red-100 rounded-full" />
            <span className="text-[8px] font-bold text-gray-400 uppercase">Booked</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2.5 max-h-[280px] overflow-y-auto pr-2 scrollbar-hide">
        {slots.map((time) => {
          const status = getSlotStatus(time);
          const isSelected = selectedTime === time;

          return (
            <button
              key={time}
              type="button"
              onClick={() => status === 'available' && onSelect(time)}
              onContextMenu={(e) => {
                e.preventDefault();
                toggleSlotStatus(time);
              }}
              className={cn(
                "relative group flex flex-col items-center justify-center py-3.5 rounded-2xl border-2 transition-all overflow-hidden",
                status === 'available' && isSelected ? "bg-[#1A1F3D] border-[#1A1F3D] text-[#D9ED5F] scale-[1.02] shadow-lg shadow-[#1A1F3D]/10" :
                status === 'available' ? "bg-white border-gray-50 text-gray-600 hover:border-[#1A1F3D]/20 hover:bg-gray-50" :
                status === 'booked' ? "bg-red-50 border-red-50 text-red-300 cursor-not-allowed" :
                "bg-gray-100 border-gray-100 text-gray-300 cursor-not-allowed"
              )}
            >
              <span className="text-xs font-black">{time}</span>
              
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

              {isSelected && status === 'available' && (
                <div className="absolute top-1 right-1">
                  <Check size={8} className="text-[#D9ED5F]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      <p className="text-[8px] text-gray-400 font-medium italic px-2">
        * Right-click a slot to toggle its availability (Open/Close)
      </p>
    </div>
  );
};

export default SlotPicker;