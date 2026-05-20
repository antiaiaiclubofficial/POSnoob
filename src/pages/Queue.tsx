"use client";

import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  Scissors, 
  LayoutGrid,
  CalendarDays,
  CalendarRange
} from 'lucide-react';
import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, isSameDay, startOfToday } from 'date-fns';
import { th } from 'date-fns/locale';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { translations } from '@/utils/translations';
import QueueWeekView from '@/components/QueueWeekView';
import QueueMonthView from '@/components/QueueMonthView';
import BookingModal from '@/components/BookingModal';
import GroomingServiceModal from '@/components/GroomingServiceModal';

type ViewType = 'day' | 'week' | 'month';

const Queue = () => {
  const { queue, language, updateQueueStatus, removeQueueItem } = useStore();
  const t = translations[language];
  
  const [view, setView] = useState<ViewType>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedQueueItem, setSelectedQueueItem] = useState<any>(null);

  // Navigation Logic
  const handlePrev = () => {
    if (view === 'day') setCurrentDate(subDays(currentDate, 1));
    else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    if (view === 'day') setCurrentDate(addDays(currentDate, 1));
    else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const goToday = () => setCurrentDate(new Date());

  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const todayQueue = queue.filter(q => q.date === dateStr && !q.isPaid);

  return (
    <div className="flex-1 flex flex-col bg-[#F8F9FD] overflow-hidden h-screen">
      {/* Header */}
      <header className="px-6 lg:px-10 py-6 lg:py-8 bg-white border-b border-gray-100 shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pl-14 lg:pl-0">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-[#1A1F3D] mb-1">
              {view === 'day' ? t.todaysQueue : view === 'week' ? (language === 'th' ? 'ตารางรายสัปดาห์' : 'Weekly Schedule') : (language === 'th' ? 'ปฏิทินรายเดือน' : 'Monthly Calendar')}
            </h1>
            <div className="flex items-center gap-2 text-gray-400 font-bold uppercase text-[10px] tracking-widest">
               <CalendarIcon size={14} className="text-[#D9ED5F]" />
               {format(currentDate, view === 'month' ? 'MMMM yyyy' : 'PPPP', { locale: language === 'th' ? th : undefined })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* View Switcher */}
            <div className="bg-[#F5F6FA] p-1 rounded-2xl flex gap-1">
              {(['day', 'week', 'month'] as ViewType[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all",
                    view === v ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex bg-[#F5F6FA] p-1 rounded-2xl">
              <button onClick={handlePrev} className="p-2 hover:bg-white rounded-lg transition-all"><ChevronLeft size={18}/></button>
              <button onClick={goToday} className="px-4 text-[10px] font-black uppercase tracking-tight">Today</button>
              <button onClick={handleNext} className="p-2 hover:bg-white rounded-lg transition-all"><ChevronRight size={18}/></button>
            </div>

            <button 
              onClick={() => setIsBookingOpen(true)}
              className="bg-[#1A1F3D] text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-xl shadow-[#1A1F3D]/10 hover:scale-105 active:scale-95 transition-all"
            >
              <Plus size={18} /> {t.newAppointment}
            </button>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-10 scrollbar-hide">
        <div className="max-w-[1600px] mx-auto h-full">
          {view === 'day' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in zoom-in-95 duration-300">
              {todayQueue.length === 0 ? (
                <div className="col-span-full py-32 flex flex-col items-center justify-center text-center opacity-20">
                  <CalendarDays size={64} className="mb-4" />
                  <h2 className="text-2xl font-black">{t.noQueue}</h2>
                  <p className="text-sm font-bold uppercase">For {format(currentDate, 'PP')}</p>
                </div>
              ) : (
                [...todayQueue].sort((a,b) => a.time.localeCompare(b.time)).map((item) => (
                  <div key={item.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm group hover:shadow-xl transition-all">
                    <div className="flex justify-between items-start mb-6">
                      <div className="relative">
                        <img src={item.image} className="w-16 h-16 rounded-2xl object-cover shadow-md" />
                        <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-lg shadow-sm border border-gray-100">
                           <Clock size={12} className="text-blue-500" />
                        </div>
                      </div>
                      <span className={cn(
                        "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter",
                        item.status === 'Waiting' ? "bg-orange-50 text-orange-600" :
                        item.status === 'Checked-in' ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
                      )}>
                        {item.status}
                      </span>
                    </div>

                    <div className="mb-6">
                       <h3 className="text-xl font-black text-[#1A1F3D] mb-1">{item.petName}</h3>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.ownerName}</p>
                    </div>

                    <div className="p-4 bg-[#F5F6FA] rounded-2xl mb-6">
                       <div className="flex items-center gap-3 text-[#1A1F3D] font-black text-sm mb-1">
                          <Scissors size={14} className="text-gray-300" /> {item.serviceName}
                       </div>
                       <p className="text-[10px] text-gray-400 font-bold uppercase ml-7">{item.time}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                       {item.status === 'Waiting' ? (
                         <button 
                           onClick={() => setSelectedQueueItem(item)}
                           className="col-span-2 bg-[#1A1F3D] text-white py-3 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-[#1A1F3D]/10 hover:bg-[#2A3152]"
                         >
                           {t.checkInBtn}
                         </button>
                       ) : item.status === 'Checked-in' ? (
                         <button 
                           onClick={() => updateQueueStatus(item.id, 'In Progress')}
                           className="col-span-2 bg-blue-500 text-white py-3 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-blue-500/20"
                         >
                           {t.startBtn}
                         </button>
                       ) : item.status === 'In Progress' ? (
                         <button 
                           onClick={() => updateQueueStatus(item.id, 'Completed')}
                           className="col-span-2 bg-green-500 text-white py-3 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-green-500/20"
                         >
                           {t.completeBtn}
                         </button>
                       ) : (
                         <div className="col-span-2 text-center py-3 text-[10px] font-black text-green-500 uppercase tracking-widest">
                           Service Finished
                         </div>
                       )}
                       <button onClick={() => removeQueueItem(item.id)} className="col-span-2 text-[9px] font-black text-red-300 hover:text-red-500 uppercase tracking-widest transition-colors py-2 opacity-0 group-hover:opacity-100">Cancel Booking</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {view === 'week' && (
            <QueueWeekView currentDate={currentDate} onDateSelect={(d) => { setCurrentDate(d); setView('day'); }} />
          )}

          {view === 'month' && (
            <QueueMonthView currentDate={currentDate} onDateSelect={(d) => { setCurrentDate(d); setView('day'); }} />
          )}
        </div>
      </div>

      {/* Modals */}
      {isBookingOpen && <BookingModal onClose={() => setIsBookingOpen(false)} />}
      
      {selectedQueueItem && (
        <GroomingServiceModal 
          item={selectedQueueItem} 
          onClose={() => setSelectedQueueItem(null)} 
        />
      )}
    </div>
  );
};

export default Queue;