"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  value: string; // "HH:mm" 24h format
  onChange: (value: string) => void;
}

const TimePicker = ({ value, onChange }: TimePickerProps) => {
  // Convert 24h to 12h for UI
  const [h24, m] = value.split(':');
  const hour24 = parseInt(h24);
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;
  const hourStr = hour12.toString().padStart(2, '0');

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];
  const periods = ['AM', 'PM'];

  const handleUpdate = (h: string, mm: string, p: string) => {
    let h24 = parseInt(h);
    if (p === 'PM' && h24 < 12) h24 += 12;
    if (p === 'AM' && h24 === 12) h24 = 0;
    onChange(`${h24.toString().padStart(2, '0')}:${mm}`);
  };

  const Column = ({ title, items, current, onSelect }: { title: string, items: string[], current: string, onSelect: (val: string) => void }) => (
    <div className="flex-1 flex flex-col gap-1.5">
      <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest text-center mb-1">{title}</p>
      <div className="space-y-1">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onSelect(item)}
            className={cn(
              "w-full py-2.5 rounded-xl text-xs font-black transition-all",
              current === item 
                ? "bg-[#1A1F3D] text-[#D9ED5F] shadow-lg shadow-[#1A1F3D]/20 scale-105" 
                : "bg-white text-gray-400 hover:bg-gray-50 border border-gray-50"
            )}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-[#F5F6FA] p-3 rounded-[28px] flex gap-3 border border-gray-100 shadow-inner">
      <Column 
        title="Hour" 
        items={hours} 
        current={hourStr} 
        onSelect={(val) => handleUpdate(val, m, period)} 
      />
      <Column 
        title="Min" 
        items={minutes} 
        current={m} 
        onSelect={(val) => handleUpdate(hourStr, val, period)} 
      />
      <Column 
        title="Period" 
        items={periods} 
        current={period} 
        onSelect={(val) => handleUpdate(hourStr, m, val)} 
      />
    </div>
  );
};

export default TimePicker;