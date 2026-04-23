"use client";

import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

interface TimePickerProps {
  value: string; // "HH:mm" 24h format
  onChange: (value: string) => void;
}

const TimePicker = ({ value, onChange }: TimePickerProps) => {
  // แปลงเวลาจาก 24h เป็น 12h สำหรับแสดงผลใน UI
  const [h24, m] = value.split(':');
  const hour24 = parseInt(h24);
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;
  const hourStr = hour12.toString().padStart(2, '0');

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];
  const periods = ['AM', 'PM'];

  const handleUpdate = (h: string, mm: string, p: string) => {
    let h24Val = parseInt(h);
    if (p === 'PM' && h24Val < 12) h24Val += 12;
    if (p === 'AM' && h24Val === 12) h24Val = 0;
    onChange(`${h24Val.toString().padStart(2, '0')}:${mm}`);
  };

  return (
    <div className="flex items-center gap-2 bg-white p-2 rounded-[24px] border border-gray-100 shadow-sm">
      {/* Hour Select */}
      <div className="flex-1 min-w-[70px]">
        <Select value={hourStr} onValueChange={(val) => handleUpdate(val, m, period)}>
          <SelectTrigger className="border-none bg-[#F5F6FA] rounded-xl h-12 focus:ring-2 focus:ring-[#1A1F3D]/5 font-black text-xs">
            <SelectValue placeholder="HH" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
            {hours.map(h => (
              <SelectItem key={h} value={h} className="text-xs font-bold py-3">{h}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <span className="font-black text-gray-300">:</span>

      {/* Minute Select */}
      <div className="flex-1 min-w-[70px]">
        <Select value={m} onValueChange={(val) => handleUpdate(hourStr, val, period)}>
          <SelectTrigger className="border-none bg-[#F5F6FA] rounded-xl h-12 focus:ring-2 focus:ring-[#1A1F3D]/5 font-black text-xs">
            <SelectValue placeholder="MM" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
            {minutes.map(min => (
              <SelectItem key={min} value={min} className="text-xs font-bold py-3">{min}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Period Select (AM/PM) */}
      <div className="flex-1 min-w-[80px]">
        <Select value={period} onValueChange={(val) => handleUpdate(hourStr, m, val)}>
          <SelectTrigger className="border-none bg-[#1A1F3D] text-[#D9ED5F] rounded-xl h-12 focus:ring-2 focus:ring-[#1A1F3D]/5 font-black text-xs">
            <SelectValue placeholder="AM/PM" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
            {periods.map(p => (
              <SelectItem key={p} value={p} className="text-xs font-bold py-3">{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default TimePicker;