"use client";

import React, { useState } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  PlayCircle, 
  Plus, 
  Calendar as CalendarIcon,
  Trash2,
  ChevronRight,
  ChevronLeft,
  CreditCard,
  ClipboardList,
  LayoutGrid,
  Columns,
  List
} from 'lucide-react';
import { useStore, QueueStatus, QueueItem } from '@/store/useStore';
import BookingModal from '@/components/BookingModal';
import GroomingServiceModal from '@/components/GroomingServiceModal';
import QueueMonthView from '@/components/QueueMonthView';
import QueueWeekView from '@/components/QueueWeekView';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { translations } from '@/utils/translations';
import { format, addDays, subDays, addMonths, subMonths, addWeeks, subWeeks, parseISO } from 'date-fns';

type ViewMode = 'Day' | 'Week' | 'Month';

const Queue = () => {
  const navigate = useNavigate();
  const { queue, updateQueueStatus, removeQueueItem, customers, selectOwner, setActivePet, setActiveQueueItem, language } = useStore();
  const t = translations[language];
  
  const [viewMode, setViewMode] = useState<ViewMode>('Day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [intakeItem, setIntakeItem] = useState<QueueItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<QueueStatus | 'All'>('All');

  const selectedDateStr = format(currentDate, 'yyyy-MM-dd');
  const filteredQueue = queue.filter(item => 
    item.date === selectedDateStr && 
    !item.isPaid && 
    (statusFilter === 'All' || item.status === statusFilter)
  );

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (viewMode === 'Day') {
      setCurrentDate(prev => direction === 'prev' ? subDays(prev, 1) : addDays(prev, 1));
    } else if (viewMode === 'Week') {
      setCurrentDate(prev => direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1));
    } else {
      setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
    }
  };

  const handleDateSelect = (date: Date) => {
    setCurrentDate(date);
    setViewMode('Day');
  };

  const getStatusUI = (status: QueueStatus) => {
    switch(status) {
      case 'Waiting': return { color: 'text-orange-500', bg: 'bg-orange-50', icon: Clock, label: t.waiting };
      case 'Checked-in': return { color: 'text-purple-500', bg: 'bg-purple-50', icon: Clock, label: t.checkedIn };
      case 'In Progress': return { color: 'text-blue-500', bg: 'bg-blue-50', icon: PlayCircle, label: t.inProgress };
      case 'Completed': return { color: 'text-green-500', bg: 'bg-green-50', icon: CheckCircle2, label: t.completed };
    }
  };

  const handleGoToCheckout = (item: any) => {
    const owner = customers.find(c => c.name === item.ownerName);
    if (owner) {
      selectOwner(owner);
      const pet = owner.pets.find(p => p.id === item.petId);
      if (pet) {
        setActivePet(pet);
        setActiveQueueItem(item.id);
        navigate('/pos');
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8F9FD]">
      <header className="px-6 lg:px-10 py-6 lg:py-8 shrink-0 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pl-14 lg:pl-0">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em]">{t.queue}</p>
              <div className="w-1 h-1 bg-gray-200 rounded-full" />
              <p className="text-[9px] text-blue-500 font-black uppercase tracking-[0.2em]">{viewMode} VIEW</p>
            </div>
            <h1 className="text-3xl font-black text-[#1A1F3D]">
              {viewMode === 'Month' ? format(currentDate, 'MMMM yyyy') : 
               viewMode === 'Week' ? `Week of ${format(currentDate, 'MMM d')}` :
               format(currentDate, 'EEEE, MMM do')}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Switcher */}
            <div className="bg-white p-1 rounded-2xl border border-gray-100 shadow-sm flex gap-1">
              <button onClick={() => setViewMode('Month')} className={cn("p-2.5 rounded-xl transition-all", viewMode === 'Month' ? "bg-[#1A1F3D] text-white shadow-md" : "text-gray-400 hover:text-gray-600")}><LayoutGrid size={18}/></button>
              <button onClick={() => setViewMode('Week')} className={cn("p-2.5 rounded-xl transition-all", viewMode === 'Week' ? "bg-[#1A1F3D] text-white shadow-md" : "text-gray-400 hover:text-gray-600")}><Columns size={18}/></button>
              <button onClick={() => setViewMode('Day')} className={cn("p-2.5 rounded-xl transition-all", viewMode === 'Day' ? "bg-[#1A1F3D] text-white shadow-md" : "text-gray-400 hover:text-gray-600")}><List size={18}/></button>
            </div>

            <div className="h-10 w-px bg-gray-200 mx-1 hidden sm:block" />

            <div className="flex items-center gap-2">
              <button onClick={() => handleNavigate('prev')} className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-[#1A1F3D] transition-all shadow-sm"><ChevronLeft size={18}/></button>
              <button onClick={() => setCurrentDate(new Date())} className="px-4 py-3 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#1A1F3D] shadow-sm">Today</button>
              <button onClick={() => handleNavigate('next')} className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-[#1A1F3D] transition-all shadow-sm"><ChevronRight size={18}/></button>
            </div>

            <button 
              onClick={() => setIsBookingOpen(true)}
              className="bg-[#1A1F3D] text-white px-6 py-3 rounded-2xl text-xs font-black shadow-xl shadow-[#1A1F3D]/10 hover:scale-105 active:scale-95 transition-all"
            >
              <Plus size={18} className="inline mr-2" /> {t.newAppointment}
            </button>
          </div>
        </div>

        {viewMode === 'Day' && (
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide animate-in slide-in-from-top-2">
            {(['All', 'Waiting', 'Checked-in', 'In Progress', 'Completed'] as const).map(status => (
              <button 
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border",
                  statusFilter === status ? "bg-white border-[#1A1F3D] text-[#1A1F3D] shadow-md ring-4 ring-blue-500/5" : "bg-white/50 border-transparent text-gray-400 hover:border-gray-200"
                )}
              >
                {status}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-10 scrollbar-hide">
        {viewMode === 'Month' && (
          <QueueMonthView currentDate={currentDate} onDateSelect={handleDateSelect} />
        )}

        {viewMode === 'Week' && (
          <QueueWeekView currentDate={currentDate} onDateSelect={handleDateSelect} />
        )}

        {viewMode === 'Day' && (
          <div className="max-w-5xl mx-auto space-y-4">
            {filteredQueue.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center opacity-30 border-2 border-dashed border-gray-200 rounded-[40px]">
                <CalendarIcon size={48} className="mb-4" />
                <p className="font-black text-xl">No Appointments Scheduled</p>
                <p className="text-xs font-bold uppercase mt-2">Check other dates or switch to Month view</p>
              </div>
            ) : (
              filteredQueue.map((item) => {
                const ui = getStatusUI(item.status);
                return (
                  <div 
                    key={item.id} 
                    className={cn(
                      "bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 group transition-all hover:shadow-xl animate-in slide-in-from-bottom-2",
                      item.status === 'Completed' && "bg-green-50/10 border-green-100"
                    )}
                  >
                    <div className="flex items-center gap-6">
                      <div className="relative shrink-0">
                        <img src={item.image} className="w-16 h-16 rounded-[22px] object-cover shadow-md" />
                        <div className={cn("absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-sm", ui.bg)}>
                          <ui.icon size={10} className={ui.color} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-black text-[#1A1F3D]">{item.petName}</h3>
                          {item.status === 'Completed' && (
                            <span className="bg-orange-100 text-orange-700 text-[8px] font-black px-2 py-0.5 rounded-full uppercase animate-pulse">Ready to Pay</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-gray-400">{item.serviceName}</span>
                          <div className="w-1 h-1 bg-gray-200 rounded-full" />
                          <span className="text-xs font-bold text-gray-600">{item.ownerName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between lg:justify-end gap-10">
                      <div className="text-left lg:text-right">
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">{t.time}</p>
                        <span className="text-xl font-black text-[#1A1F3D]">{item.time}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button onClick={() => setIntakeItem(item)} className="p-3 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-2xl transition-all"><ClipboardList size={22}/></button>
                        
                        {item.status === 'Completed' ? (
                          <button onClick={() => handleGoToCheckout(item)} className="bg-[#1A1F3D] text-[#D9ED5F] px-6 py-3 rounded-2xl transition-all flex items-center gap-2 text-xs font-black shadow-lg shadow-[#1A1F3D]/10 active:scale-95"><CreditCard size={16} /> {t.goToCheckout}</button>
                        ) : (
                          <button 
                            onClick={() => updateQueueStatus(item.id, item.status === 'Waiting' ? 'Checked-in' : item.status === 'Checked-in' ? 'In Progress' : 'Completed')}
                            className={cn(
                              "px-6 py-3 rounded-2xl transition-all text-xs font-black flex items-center gap-2 shadow-lg",
                              item.status === 'Waiting' ? "bg-purple-100 text-purple-700 hover:bg-purple-200" :
                              item.status === 'Checked-in' ? "bg-blue-100 text-blue-700 hover:bg-blue-200" :
                              "bg-green-100 text-green-700 hover:bg-green-200"
                            )}
                          >
                            <ChevronRight size={16} />
                            {item.status === 'Waiting' ? t.checkInBtn : item.status === 'Checked-in' ? t.startBtn : t.completeBtn}
                          </button>
                        )}

                        <button onClick={() => removeQueueItem(item.id)} className="p-3 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={20}/></button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {isBookingOpen && <BookingModal onClose={() => setIsBookingOpen(false)} />}
      {intakeItem && <GroomingServiceModal item={intakeItem} onClose={() => setIntakeItem(null)} />}
    </div>
  );
};

export default Queue;