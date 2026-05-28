"use client";

import React from 'react';
import { 
  format, addDays, startOfWeek, eachDayOfInterval, isToday 
} from 'date-fns';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { Clock, Scissors, CheckCircle2, Play } from 'lucide-react';

interface QueueWeekViewProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  onBookingClick?: (booking: any) => void;
  onUpdateStatus?: (id: string, status: any) => void;
}

const QueueWeekView = ({ currentDate, onDateSelect, onBookingClick, onUpdateStatus }: QueueWeekViewProps) => {
  const { queue, language } = useStore();
  
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ 
    start: weekStart, 
    end: addDays(weekStart, 6) 
  });

  const getStatusLabel = (status: string) => {
    if (language === 'th') {
      switch (status) {
        case 'Waiting': return 'รอรับบริการ';
        case 'In Progress': return 'กำลังทำ';
        case 'Completed': return 'เสร็จสิ้น';
        default: return status;
      }
    } else {
      switch (status) {
        case 'Waiting': return 'Waiting';
        case 'In Progress': return 'In Progress';
        case 'Completed': return 'Completed';
        default: return status;
      }
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide animate-in fade-in duration-500">
      {weekDays.map((day, idx) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayBookings = [...queue]
          .filter(q => q.date === dateStr && !q.isPaid)
          .sort((a, b) => a.time.localeCompare(b.time));

        return (
          <div key={idx} className="min-w-[280px] flex-1 flex flex-col gap-4">
            <button 
              onClick={() => onDateSelect(day)}
              className={cn(
                "p-5 rounded-[32px] border transition-all text-left group",
                isToday(day) ? "bg-[#1A1F3D] border-[#1A1F3D] shadow-xl shadow-[#1A1F3D]/10" : "bg-white border-gray-100 hover:border-gray-300"
              )}
            >
              <p className={cn("text-[9px] font-black uppercase tracking-widest mb-1", isToday(day) ? "text-[#D9ED5F]" : "text-gray-400")}>
                {format(day, 'EEEE')}
              </p>
              <h3 className={cn("text-xl font-black", isToday(day) ? "text-white" : "text-[#1A1F3D]")}>
                {format(day, 'MMM d')}
              </h3>
            </button>

            <div className="flex-1 space-y-3">
              {dayBookings.length === 0 ? (
                <div className="py-10 text-center opacity-20 border-2 border-dashed border-gray-200 rounded-[32px]">
                   <p className="text-[10px] font-black uppercase tracking-widest">No Bookings</p>
                </div>
              ) : (
                dayBookings.map(booking => (
                  <div 
                    key={booking.id} 
                    className="bg-white p-4 rounded-[24px] border border-gray-50 shadow-sm flex flex-col gap-3 group hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <img src={booking.image} className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                           <h4 
                             onClick={() => booking.status === 'Waiting' && onBookingClick?.(booking)}
                             className={cn(
                               "text-xs font-black text-[#1A1F3D] truncate",
                               booking.status === 'Waiting' ? "cursor-pointer hover:underline hover:text-blue-600" : ""
                             )}
                           >
                             {booking.petName}
                           </h4>
                           <span className="text-[9px] font-black text-blue-500">{booking.time}</span>
                        </div>
                        <p className="text-[8px] text-gray-400 font-bold uppercase truncate">{booking.serviceName}</p>
                      </div>
                    </div>

                    {/* Status Badge & Action Button */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      <span className={cn(
                        "px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter",
                        booking.status === 'Waiting' ? "bg-orange-50 text-orange-600" :
                        booking.status === 'In Progress' ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
                      )}>
                        {getStatusLabel(booking.status)}
                      </span>

                      {booking.status === 'Waiting' && (
                        <button
                          onClick={() => onBookingClick?.(booking)}
                          className="bg-[#1A1F3D] text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase hover:bg-[#2A3152] transition-all"
                        >
                          Check-in
                        </button>
                      )}

                      {booking.status === 'In Progress' && (
                        <button
                          onClick={() => onUpdateStatus?.(booking.id, 'Completed')}
                          className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase hover:bg-green-600 transition-all flex items-center gap-1"
                        >
                          <CheckCircle2 size={10} /> {language === 'th' ? 'เสร็จสิ้น' : 'Finish'}
                        </button>
                      )}

                      {booking.status === 'Completed' && (
                        <span className="text-[9px] font-black text-green-500 flex items-center gap-1">
                          <CheckCircle2 size={10} /> {language === 'th' ? 'เสร็จสิ้นแล้ว' : 'Completed'}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default QueueWeekView;