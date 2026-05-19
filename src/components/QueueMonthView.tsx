"use client";

import React from 'react';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO 
} from 'date-fns';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

interface QueueMonthViewProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
}

const QueueMonthView = ({ currentDate, onDateSelect }: QueueMonthViewProps) => {
  const { queue, language } = useStore();
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = language === 'th' 
    ? ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="grid grid-cols-7 border-b border-gray-50">
        {weekDays.map(day => (
          <div key={day} className="py-4 text-center text-[10px] font-black uppercase text-gray-400 tracking-widest bg-gray-50/50">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {calendarDays.map((day, idx) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayBookings = queue.filter(q => q.date === dateStr && !q.isPaid);
          const isCurrentMonth = isSameMonth(day, monthStart);
          
          return (
            <button
              key={idx}
              onClick={() => onDateSelect(day)}
              className={cn(
                "min-h-[100px] lg:min-h-[140px] p-3 border-r border-b border-gray-50 text-left transition-all hover:bg-gray-50 group relative",
                !isCurrentMonth && "bg-gray-50/30 opacity-30",
                isToday(day) && "bg-blue-50/30"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={cn(
                  "text-xs font-black w-7 h-7 flex items-center justify-center rounded-full transition-colors",
                  isToday(day) ? "bg-[#1A1F3D] text-white" : "text-gray-400 group-hover:text-[#1A1F3D]"
                )}>
                  {format(day, 'd')}
                </span>
                {dayBookings.length > 0 && (
                  <span className={cn(
                    "text-[9px] font-black px-2 py-0.5 rounded-full uppercase",
                    dayBookings.length > 5 ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                  )}>
                    {dayBookings.length} {language === 'th' ? 'คิว' : 'Pets'}
                  </span>
                )}
              </div>
              
              <div className="space-y-1 overflow-hidden">
                {dayBookings.slice(0, 3).map(booking => (
                  <div key={booking.id} className="text-[8px] font-bold text-gray-500 truncate bg-white border border-gray-100 px-1.5 py-0.5 rounded-md shadow-sm">
                    {booking.time} {booking.petName}
                  </div>
                ))}
                {dayBookings.length > 3 && (
                  <div className="text-[8px] font-black text-gray-300 pl-1">
                    + {dayBookings.length - 3} more
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QueueMonthView;