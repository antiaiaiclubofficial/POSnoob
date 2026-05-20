"use client";

import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Scissors, 
  CheckCircle2,
  Filter,
  MoreVertical,
  Search
} from 'lucide-react';
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { th } from 'date-fns/locale';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { translations } from '@/utils/translations';

const WeeklyQueue = () => {
  const { language } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const t = translations[language];

  // คำนวณวันเริ่มต้นของสัปดาห์ (วันจันทร์)
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const goToday = () => setCurrentDate(new Date());

  // Mock data สำหรับแสดงผล
  const mockQueues = [
    { id: '1', time: '10:00', pet: 'Mochi', service: 'Grooming', status: 'completed', date: weekDays[0] },
    { id: '2', time: '11:30', pet: 'Tama', service: 'Bath', status: 'pending', date: weekDays[0] },
    { id: '3', time: '13:00', pet: 'Kuro', service: 'Nail Trim', status: 'in-progress', date: weekDays[1] },
    { id: '4', time: '15:00', pet: 'Snowy', service: 'Full Service', status: 'pending', date: weekDays[2] },
    { id: '5', time: '09:00', pet: 'Lucky', service: 'Grooming', status: 'pending', date: weekDays[6] },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#F8F9FD] overflow-hidden h-screen">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-100 p-4 lg:p-6 pt-20 lg:pt-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 max-w-[1600px] mx-auto w-full">
          <div>
            <h1 className="text-2xl font-black text-[#1A1F3D] mb-1">
              {language === 'th' ? 'ตารางนัดหมายรายสัปดาห์' : 'Weekly Schedule'}
            </h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <CalendarIcon size={14} />
              {format(startDate, 'MMMM yyyy', { locale: language === 'th' ? th : undefined })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-[#F5F6FA] p-1 rounded-xl mr-2">
              <button onClick={prevWeek} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all">
                <ChevronLeft size={18} />
              </button>
              <button onClick={goToday} className="px-4 text-xs font-black uppercase tracking-tight">Today</button>
              <button onClick={nextWeek} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all">
                <ChevronRight size={18} />
              </button>
            </div>
            <button className="bg-[#1A1F3D] text-white px-6 py-3 rounded-xl text-xs font-black shadow-lg shadow-[#1A1F3D]/10 flex items-center gap-2 hover:scale-105 transition-all">
              <Plus size={16} /> {language === 'th' ? 'จองคิวใหม่' : 'New Booking'}
            </button>
          </div>
        </div>
      </div>

      {/* 7-Day Grid View */}
      <div className="flex-1 overflow-hidden p-4 lg:p-6">
        <div className="h-full max-w-[1600px] mx-auto bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-gray-50 bg-gray-50/50">
            {weekDays.map((day, i) => (
              <div 
                key={i} 
                className={cn(
                  "py-4 text-center border-r border-gray-100 last:border-r-0",
                  isSameDay(day, new Date()) ? "bg-indigo-50/50" : ""
                )}
              >
                <p className={cn(
                  "text-[10px] font-black uppercase tracking-tighter mb-1",
                  isSameDay(day, new Date()) ? "text-indigo-600" : "text-gray-400"
                )}>
                  {format(day, 'EEE', { locale: language === 'th' ? th : undefined })}
                </p>
                <p className={cn(
                  "text-lg font-black",
                  isSameDay(day, new Date()) ? "text-indigo-600" : "text-[#1A1F3D]"
                )}>
                  {format(day, 'd')}
                </p>
              </div>
            ))}
          </div>

          {/* Days Content */}
          <div className="flex-1 grid grid-cols-7 divide-x divide-gray-50 overflow-hidden">
            {weekDays.map((day, i) => (
              <div 
                key={i} 
                className={cn(
                  "flex flex-col gap-3 p-3 overflow-y-auto scrollbar-hide min-h-0",
                  isSameDay(day, new Date()) ? "bg-indigo-50/20" : ""
                )}
              >
                {mockQueues
                  .filter(q => isSameDay(q.date, day))
                  .map(queue => (
                    <div 
                      key={queue.id}
                      className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                          {queue.time}
                        </span>
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          queue.status === 'completed' ? "bg-green-400" : 
                          queue.status === 'in-progress' ? "bg-orange-400" : "bg-gray-300"
                        )} />
                      </div>
                      <p className="text-xs font-black text-[#1A1F3D] truncate group-hover:text-indigo-600 transition-colors">
                        {queue.pet}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1 mt-0.5">
                        <Scissors size={10} /> {queue.service}
                      </p>
                    </div>
                  ))}
                
                {mockQueues.filter(q => isSameDay(q.date, day)).length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-50 rounded-2xl opacity-30">
                    <span className="text-[10px] font-bold text-gray-300">No Queue</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyQueue;