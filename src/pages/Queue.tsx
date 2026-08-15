"use client";

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
  const { queue, language, updateQueueStatus, removeQueueItem, customers, openTime, closeTime } = useStore();
  const t = translations[language];
  
  const location = useLocation();
  const [view, setView] = useState<ViewType>(location.state?.view || 'week');

  useEffect(() => {
    if (location.state?.view) {
      setView(location.state.view);
    }
  }, [location.state?.view]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedQueueItem, setSelectedQueueItem] = useState<any>(null);
  const [selectedDayItem, setSelectedDayItem] = useState<any>(null);
  const [itemToCancel, setItemToCancel] = useState<any>(null);

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
        <div className="w-full mx-auto h-full">
          {view === 'day' && (
            <div className="flex flex-col lg:flex-row gap-8 w-full animate-in fade-in zoom-in-95 duration-300 pb-20">
              <div className="w-full lg:w-[60%] flex flex-col">
              {(() => {
                const startHourStr = openTime || '09:00';
                const endHourStr = closeTime || '20:00';
                const startHour = parseInt(startHourStr.split(':')[0]);
                const endHour = parseInt(endHourStr.split(':')[0]);
                
                const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => {
                  return `${(startHour + i).toString().padStart(2, '0')}:00`;
                });

                return hours.map((hour, index) => {
                  const hourPrefix = hour.split(':')[0];
                  const itemsInThisHour = todayQueue.filter(q => q.time.startsWith(`${hourPrefix}:`));

                  return (
                    <div key={hour} className="flex gap-6 lg:gap-10 relative group mb-2">
                      {/* Time Label */}
                      <div className="w-[80px] shrink-0 pt-6 relative z-10 flex flex-col items-center">
                         <span className="text-[#1A1F3D] opacity-30 font-black text-2xl tracking-tighter leading-none">{hourPrefix}</span>
                         <span className="text-[#1A1F3D] opacity-20 font-bold text-xs uppercase mt-1">00</span>
                      </div>

                      {/* Content Area for this hour */}
                      <div className="flex-1 pb-10 pt-2 relative">
                        {/* Soft connecting guide line, invisible unless hovered for interactivity */}
                        <div className="absolute -left-10 top-12 bottom-0 w-[2px] bg-gradient-to-b from-[#18234A]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        {itemsInThisHour.length === 0 ? (
                          <div className="h-24 bg-white/40 backdrop-blur-xl rounded-[48px] flex items-center justify-center text-[#1A1F3D]/20 text-xs font-bold uppercase tracking-widest shadow-[0_8px_30px_rgba(24,35,74,0.02)] border border-white/60 transition-all hover:bg-white/60">
                            Available Slot
                          </div>
                        ) : (
                          <div className="flex flex-col gap-6">
                            {itemsInThisHour.sort((a,b) => a.time.localeCompare(b.time)).map((item) => {
                              const isSelected = selectedDayItem?.id === item.id;
                              return (
                                <div key={item.id} className={cn(
                                  "bg-white rounded-[48px] shadow-[0_20px_40px_rgba(24,35,74,0.04)] border transition-all overflow-hidden flex flex-col",
                                  isSelected ? "border-[#1A1F3D] ring-2 ring-[#1A1F3D]/10" : "border-white/60 hover:shadow-[0_30px_60px_rgba(24,35,74,0.08)]"
                                )}>
                                  <div 
                                    onClick={() => setSelectedDayItem(item)}
                                    className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors"
                                  >
                                    <div className="flex items-center gap-5">
                                      <div className="relative">
                                        <div className="absolute inset-0 bg-[#EAFD69] blur-xl opacity-20 rounded-full" />
                                        <img src={item.image} className="relative w-14 h-14 rounded-2xl object-cover shadow-sm border border-white/50" />
                                        <div className="absolute -bottom-1 -right-1 bg-white/90 backdrop-blur-md p-1.5 rounded-xl shadow-sm border border-white/50">
                                           <Scissors size={12} className="text-[#18234A]" />
                                        </div>
                                      </div>
                                      <div>
                                        <h3 className="text-xl font-black text-[#1A1F3D] leading-tight tracking-tight">{item.petName}</h3>
                                        <div className="flex items-center gap-2 mt-1.5">
                                          <p className="text-xs text-[#45464E] font-bold uppercase">{item.time}</p>
                                          <span className="w-1 h-1 bg-[#1A1F3D]/20 rounded-full"></span>
                                          <p className="text-xs text-[#45464E] font-bold truncate max-w-[150px]">{item.serviceName}</p>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                      <span className={cn(
                                        "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap",
                                        item.status === 'Waiting' ? "bg-orange-50 text-orange-600" :
                                        item.status === 'Checked-in' ? "bg-[#d9d6fe] text-[#5d5c7e]" : "bg-[#EAFD69]/30 text-[#434b00]"
                                      )}>
                                        {item.status}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
              </div>
              
              {/* Right Panel (40%) */}
              <div className="w-full lg:w-[40%]">
                <div className="sticky top-6">
                  {selectedDayItem ? (() => {
                    const item = selectedDayItem;
                    const owner = customers.find(c => c.pets.some(p => p.id === item.petId));
                    const pet = owner?.pets.find(p => p.id === item.petId);
                    let intakeRecord = pet?.intakeHistory?.find(r => r.queueItemId === item.id);
                    if (!intakeRecord) {
                      intakeRecord = pet?.intakeHistory?.find(r => !r.queueItemId && r.date === item.date);
                    }
                    const tasks = intakeRecord?.details?.basicGrooming || [];

                    return (
                      <div className="bg-white rounded-[48px] p-8 shadow-[0_20px_40px_rgba(24,35,74,0.04)] border border-white/60 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#18234A]/5">
                           <h3 className="text-2xl font-black text-[#1A1F3D]">Booking Details</h3>
                           <button onClick={() => setSelectedDayItem(null)} className="text-gray-400 hover:text-gray-600 font-bold text-xs uppercase tracking-widest transition-colors">Close</button>
                        </div>
                        
                        <div className="flex items-center gap-5 mb-8">
                          <img src={item.image} className="w-20 h-20 rounded-3xl object-cover shadow-md border-2 border-white" />
                          <div>
                            <h3 className="text-2xl font-black text-[#1A1F3D] mb-1">{item.petName}</h3>
                            <p className="text-sm text-gray-500 font-bold uppercase">{item.serviceName}</p>
                          </div>
                        </div>

                        <div className="mb-8">
                          <p className="text-[10px] text-[#45464E] font-bold uppercase tracking-widest mb-1">Owner</p>
                          <p className="text-base font-black text-[#1A1F3D]">{item.ownerName}</p>
                        </div>

                        <div className="p-6 bg-[#F3F3F3] rounded-[32px] mb-8 shadow-inner border border-white/50">
                           <div className="flex items-center justify-between mb-4">
                             <div className="flex items-center gap-3 text-[#1A1F3D] font-black text-sm">
                                <Scissors size={16} className="text-[#18234A]/40" /> {item.serviceName}
                             </div>
                             <p className="text-xs text-[#45464E] font-bold uppercase">{item.time}</p>
                           </div>
                           
                           {tasks.length > 0 ? (
                             <div className="flex flex-wrap gap-2">
                               {tasks.map((task: string, idx: number) => (
                                 <span key={idx} className="bg-white text-[#18234A] px-4 py-2 rounded-2xl text-[11px] font-black border border-white shadow-[0_4px_10px_rgba(24,35,74,0.03)]">
                                   {task}
                                 </span>
                               ))}
                             </div>
                           ) : (
                             <p className="text-xs text-gray-400 font-medium">No specific tasks recorded.</p>
                           )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-8">
                           {item.status === 'Waiting' ? (
                             <button 
                               onClick={() => setSelectedQueueItem(item)}
                               className="col-span-2 bg-gradient-to-br from-[#18234A] to-[#020D35] text-white py-4 rounded-[32px] text-xs font-black uppercase shadow-[0_10px_20px_rgba(24,35,74,0.15)] hover:scale-[1.02] active:scale-[0.98] transition-transform relative overflow-hidden group"
                             >
                               <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent"></div>
                               {t.checkInBtn}
                             </button>
                           ) : item.status === 'Checked-in' ? (
                             <button 
                               onClick={() => updateQueueStatus(item.id, 'In Progress')}
                               className="col-span-2 bg-gradient-to-br from-[#d9d6fe] to-[#c5c3ea] text-[#18234A] py-4 rounded-[32px] text-xs font-black uppercase shadow-[0_10px_20px_rgba(217,214,254,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-transform relative overflow-hidden"
                             >
                               <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/40 to-transparent"></div>
                               {t.startBtn}
                             </button>
                           ) : item.status === 'In Progress' ? (
                             <button 
                               onClick={() => updateQueueStatus(item.id, 'Completed')}
                               className="col-span-2 bg-[#EAFD69] text-[#1a1e00] py-4 rounded-[32px] text-xs font-black uppercase shadow-[0_10px_20px_rgba(234,253,105,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-transform relative overflow-hidden"
                             >
                               <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/40 to-transparent"></div>
                               {t.completeBtn}
                             </button>
                           ) : (
                             <div className="col-span-2 text-center py-4 text-xs font-black text-[#859500] uppercase tracking-widest bg-[#EAFD69]/10 rounded-[32px]">
                               Service Finished
                             </div>
                           )}
                           <button 
                             onClick={() => setItemToCancel(item)} 
                             className="col-span-2 text-[10px] font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-500 hover:opacity-70 rounded-full uppercase tracking-widest transition-opacity py-3 mt-2"
                           >
                             Cancel Booking
                           </button>
                        </div>
                      </div>
                    );
                  })() : (() => {
                    const total = todayQueue.length;
                    const completed = todayQueue.filter(q => q.status === 'Completed').length;
                    const inProgress = todayQueue.filter(q => q.status === 'In Progress').length;
                    const waiting = todayQueue.filter(q => q.status === 'Waiting' || q.status === 'Checked-in').length;
                    
                    return (
                      <div className="bg-white rounded-[48px] p-8 shadow-[0_20px_40px_rgba(24,35,74,0.04)] border border-white/60 animate-in fade-in duration-300 flex flex-col items-center justify-center text-center min-h-[400px]">
                        <div className="w-20 h-20 bg-[#F5F6FA] rounded-full flex items-center justify-center mb-6 shadow-inner">
                           <LayoutGrid size={32} className="text-[#1A1F3D]/20" />
                        </div>
                        <h3 className="text-2xl font-black text-[#1A1F3D] mb-2">Daily Summary</h3>
                        <p className="text-sm text-gray-500 font-medium mb-8">ภาพรวมการให้บริการคิวงานในวันนี้</p>
                        
                        <div className="w-full grid grid-cols-2 gap-4">
                           <div className="bg-[#F8F9FD] p-6 rounded-[32px] flex flex-col items-center justify-center gap-2">
                             <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Total</span>
                             <span className="text-3xl font-black text-[#1A1F3D]">{total}</span>
                           </div>
                           <div className="bg-green-50 p-6 rounded-[32px] flex flex-col items-center justify-center gap-2">
                             <span className="text-[10px] font-black uppercase text-green-600/70 tracking-widest">Completed</span>
                             <span className="text-3xl font-black text-green-600">{completed}</span>
                           </div>
                           <div className="bg-blue-50 p-6 rounded-[32px] flex flex-col items-center justify-center gap-2">
                             <span className="text-[10px] font-black uppercase text-blue-600/70 tracking-widest">In Progress</span>
                             <span className="text-3xl font-black text-blue-600">{inProgress}</span>
                           </div>
                           <div className="bg-orange-50 p-6 rounded-[32px] flex flex-col items-center justify-center gap-2">
                             <span className="text-[10px] font-black uppercase text-orange-600/70 tracking-widest">Waiting</span>
                             <span className="text-3xl font-black text-orange-600">{waiting}</span>
                           </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {view === 'week' && (
            <QueueWeekView 
              currentDate={currentDate} 
              onDateSelect={(d) => { setCurrentDate(d); setView('day'); }} 
              onBookingClick={(booking) => setSelectedQueueItem(booking)}
              onUpdateStatus={updateQueueStatus}
            />
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

      {/* Cancel Confirmation Modal */}
      {itemToCancel && (
        <div className="fixed inset-0 bg-[#18234A]/10 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-[#1A1F3D] mb-2 text-center">ยกเลิกคิวจอง?</h3>
            <p className="text-sm text-gray-500 text-center mb-8">
              คุณต้องการยกเลิกคิวของ <span className="font-bold text-[#1A1F3D]">{itemToCancel.petName}</span> ใช่หรือไม่? ข้อมูลการจองนี้จะถูกลบถาวร
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setItemToCancel(null)}
                className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-2xl font-black text-xs uppercase hover:bg-gray-200 transition-colors"
              >
                ไม่, เก็บไว้
              </button>
              <button 
                onClick={() => {
                  removeQueueItem(itemToCancel.id);
                  setItemToCancel(null);
                }}
                className="flex-1 bg-red-500 text-white py-3.5 rounded-2xl font-black text-xs uppercase shadow-lg shadow-red-500/20 hover:bg-red-600 transition-colors"
              >
                ใช่, ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Queue;