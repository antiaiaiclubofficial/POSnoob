"use client";

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, eachDayOfInterval } from 'date-fns';

interface CustomCalendarProps {
  selectedDate: string;
  onSelect: (date: string) => void;
}

const CustomCalendar = ({ selectedDate, onSelect }: CustomCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate || new Date()));
  const today = new Date();
  const selected = new Date(selectedDate);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-black text-[#1A1F3D] px-2">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <div className="flex gap-1">
          <button 
            type="button"
            onClick={prevMonth}
            className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            type="button"
            onClick={nextMonth}
            className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-[10px] font-black text-gray-300 uppercase tracking-widest py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, idx) => {
          const isSelected = isSameDay(day, selected);
          const isToday = isSameDay(day, today);
          const isCurrentMonth = isSameMonth(day, monthStart);

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelect(format(day, 'yyyy-MM-dd'))}
              className={cn(
                "h-10 w-full rounded-xl text-xs font-bold transition-all flex items-center justify-center relative",
                !isCurrentMonth && "text-gray-200",
                isCurrentMonth && !isSelected && "text-gray-600 hover:bg-gray-50",
                isSelected && "bg-[#1A1F3D] text-[#D9ED5F] shadow-lg shadow-[#1A1F3D]/10 z-10",
                isToday && !isSelected && "text-[#1A1F3D] border border-gray-100"
              )}
            >
              {format(day, 'd')}
              {isToday && !isSelected && (
                <div className="absolute bottom-1.5 w-1 h-1 bg-[#D9ED5F] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center">
        <button 
          type="button"
          onClick={() => onSelect(format(today, 'yyyy-MM-dd'))}
          className="text-[10px] font-black text-gray-400 hover:text-[#1A1F3D] transition-colors uppercase tracking-widest"
        >
          Clear
        </button>
        <button 
          type="button"
          onClick={() => {
            const now = format(today, 'yyyy-MM-dd');
            onSelect(now);
            setCurrentMonth(today);
          }}
          className="text-[10px] font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest"
        >
          Today
        </button>
      </div>
    </div>
  );
};

export default CustomCalendar;