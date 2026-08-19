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
  const [h24, m] = value.split(':');

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  const handleUpdate = (h: string, mm: string) => {
    onChange(`${h}:${mm}`);
  };

  return (
    <div className="flex items-center gap-2 bg-white p-2 rounded-[24px] border border-gray-100 shadow-sm">
      {/* Hour Select */}
      <div className="flex-1 min-w-[70px]">
        <Select value={h24} onValueChange={(val) => handleUpdate(val, m)}>
          <SelectTrigger className="border-none bg-[#F5F6FA] rounded-xl h-12 focus:ring-2 focus:ring-[#1A1F3D]/5 font-black text-xs">
            <SelectValue placeholder="HH" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-gray-100 shadow-2xl max-h-60">
            {hours.map(h => (
              <SelectItem key={h} value={h} className="text-xs font-bold py-3">{h}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <span className="font-black text-gray-300">:</span>

      {/* Minute Select */}
      <div className="flex-1 min-w-[70px]">
        <Select value={m} onValueChange={(val) => handleUpdate(h24, val)}>
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
    </div>
  );
};

export default TimePicker;