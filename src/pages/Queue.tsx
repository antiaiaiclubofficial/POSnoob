"use client";

import React, { useState } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  PlayCircle, 
  Plus, 
  Calendar as CalendarIcon,
  Trash2,
  BadgeCheck,
  ChevronRight,
  ChevronLeft,
  CreditCard,
  ClipboardList
} from 'lucide-react';
import { useStore, QueueStatus, QueueItem } from '@/store/useStore';
import BookingModal from '@/components/BookingModal';
import GroomingServiceModal from '@/components/GroomingServiceModal';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { translations } from '@/utils/translations';

const Queue = () => {
  const navigate = useNavigate();
  const { queue, updateQueueStatus, removeQueueItem, customers, selectOwner, setActivePet, setActiveQueueItem, language } = useStore();
  const t = translations[language];
  
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [intakeItem, setIntakeItem] = useState<QueueItem | null>(null);
  const [filter, setFilter] = useState<QueueStatus | 'All'>('All');
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredQueue = queue.filter(item => 
    item.date === selectedDate && 
    !item.isPaid && 
    (filter === 'All' || item.status === filter)
  );

  const stats = [
    { label: t.waiting, count: queue.filter(i => i.date === selectedDate && i.status === 'Waiting' && !i.isPaid).length, status: 'Waiting' as QueueStatus, color: 'orange' },
    { label: t.checkedIn, count: queue.filter(i => i.date === selectedDate && i.status === 'Checked-in' && !i.isPaid).length, status: 'Checked-in' as QueueStatus, color: 'purple' },
    { label: t.inProgress, count: queue.filter(i => i.date === selectedDate && i.status === 'In Progress' && !i.isPaid).length, status: 'In Progress' as QueueStatus, color: 'blue' },
    { label: t.completed, count: queue.filter(i => i.date === selectedDate && i.status === 'Completed' && !i.isPaid).length, status: 'Completed' as QueueStatus, color: 'green' }
  ];

  const statusSequence: QueueStatus[] = ['Waiting', 'Checked-in', 'In Progress', 'Completed'];

  const getNextStatus = (current: QueueStatus): QueueStatus | null => {
    const index = statusSequence.indexOf(current);
    return index < statusSequence.length - 1 ? statusSequence[index + 1] : null;
  };

  const getPrevStatus = (current: QueueStatus): QueueStatus | null => {
    const index = statusSequence.indexOf(current);
    return index > 0 ? statusSequence[index - 1] : null;
  };

  const getStatusUI = (status: QueueStatus) => {
    switch(status) {
      case 'Waiting': return { color: 'text-orange-500', bg: 'bg-orange-50', icon: Clock, label: t.waiting };
      case 'Checked-in': return { color: 'text-purple-500', bg: 'bg-purple-50', icon: Clock, label: t.checkedIn };
      case 'In Progress': return { color: 'text-blue-500', bg: 'bg-blue-50', icon: PlayCircle, label: t.inProgress };
      case 'Completed': return { color: 'text-green-500', bg: 'bg-green-50', icon: CheckCircle2, label: t.completed };
    }
  };

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
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
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="px-6 lg:px-10 py-6 lg:py-8 flex flex-col sm:flex-row justify-between items-start sm:items-end shrink-0 gap-4">
        <div className="pl-14 lg:pl-0">
          <div className="flex items-center gap-3 lg:gap-4 mb-2 lg:mb-4">
            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl shadow-sm border border-gray-100">
              <button onClick={() => changeDate(-1)} className="p-1 hover:bg-gray-50 rounded-lg transition-colors"><ChevronLeft size={12}/></button>
              <span className="text-[10px] font-black text-[#1A1F3D] min-w-[80px] text-center">{selectedDate === new Date().toISOString().split('T')[0] ? (language === 'th' ? 'วันนี้' : 'Today') : selectedDate}</span>
              <button onClick={() => changeDate(1)} className="p-1 hover:bg-gray-50 rounded-lg transition-colors"><ChevronRight size={12}/></button>
            </div>
            <div className="w-1 h-1 bg-gray-300 rounded-full" />
            <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.1em]">{t.queue}</p>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-[#1A1F3D]">{language === 'th' ? 'การจัดการคิวงาน' : 'Operations'}</h1>
        </div>
        <button 
          onClick={() => setIsBookingOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#1A1F3D] text-white px-6 py-3 rounded-2xl text-xs font-black hover:bg-[#2A3152] transition-all shadow-xl shadow-[#1A1F3D]/10"
        >
          <Plus size={18} /> {t.newAppointment}
        </button>
      </header>

      <div className="px-6 lg:px-10 mb-6 lg:mb-8 flex gap-3 lg:gap-4 shrink-0 overflow-x-auto scrollbar-hide">
        <button 
          onClick={() => setFilter('All')}
          className={cn(
            "px-4 lg:px-6 py-3 lg:py-4 rounded-[20px] lg:rounded-[24px] border transition-all shrink-0 flex flex-col min-w-[100px] lg:min-w-[120px]",
            filter === 'All' ? "bg-[#1A1F3D] border-[#1A1F3D] text-white shadow-lg" : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
          )}
        >
          <span className="text-[8px] lg:text-[9px] font-black uppercase tracking-widest mb-1 opacity-60">{t.allActive}</span>
          <span className="text-lg lg:text-xl font-black">{queue.filter(i => i.date === selectedDate && !i.isPaid).length}</span>
        </button>
        
        {stats.map((stat) => (
          <button 
            key={stat.label}
            onClick={() => setFilter(stat.status)}
            className={cn(
              "px-4 lg:px-6 py-3 lg:py-4 rounded-[20px] lg:rounded-[24px] border transition-all shrink-0 flex flex-col min-w-[110px] lg:min-w-[140px]",
              filter === stat.status ? "bg-white border-[#1A1F3D] shadow-md ring-4 ring-[#1A1F3D]/5" : "bg-white border-gray-100 hover:border-gray-200"
            )}
          >
            <span className="text-[8px] lg:text-[9px] font-black uppercase tracking-widest mb-1 text-gray-400">{stat.label}</span>
            <div className="flex items-center justify-between">
              <span className="text-lg lg:text-xl font-black">{stat.count}</span>
              <div className={cn("w-2 h-2 rounded-full", `bg-${stat.color}-500`)} />
            </div>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-10 scrollbar-hide space-y-4">
        {filteredQueue.length === 0 ? (
          <div className="h-48 lg:h-64 flex flex-col items-center justify-center text-center opacity-30 border-2 border-dashed border-gray-200 rounded-[32px] lg:rounded-[40px]">
            <CalendarIcon size={32} className="mb-4" />
            <p className="font-black text-sm lg:text-lg">{t.noQueue}</p>
          </div>
        ) : (
          filteredQueue.map((item) => {
            const ui = getStatusUI(item.status);
            const nextStatus = getNextStatus(item.status);
            const prevStatus = getPrevStatus(item.status);

            return (
              <div 
                key={item.id} 
                className={cn(
                  "bg-white p-4 lg:p-6 rounded-[24px] lg:rounded-[32px] border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 group transition-all hover:shadow-xl hover:border-transparent animate-in fade-in slide-in-from-bottom-2 duration-300",
                  item.status === 'Completed' && "border-green-100 bg-green-50/10"
                )}
              >
                <div className="flex items-center gap-4 lg:gap-6">
                  <div className="relative shrink-0">
                    <img src={item.image} className="w-12 h-12 lg:w-16 lg:h-16 rounded-[18px] lg:rounded-[22px] object-cover shadow-md" />
                    <div className={cn("absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-sm", ui.bg)}>
                      <ui.icon size={10} className={ui.color} />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-base lg:text-lg font-black text-[#1A1F3D] truncate">{item.petName}</h3>
                      {item.status === 'Completed' && (
                        <span className="bg-orange-100 text-orange-700 text-[7px] lg:text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-tighter shrink-0 animate-pulse">
                          {t.readyToPay}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 lg:gap-3">
                      <span className="text-[10px] lg:text-xs font-bold text-gray-400 truncate">{item.serviceName}</span>
                      <div className="w-1 h-1 bg-gray-200 rounded-full shrink-0" />
                      <span className="text-[10px] lg:text-xs font-bold text-gray-600 truncate">{item.ownerName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-4 lg:gap-10 border-t lg:border-t-0 pt-4 lg:pt-0">
                  <div className="text-left lg:text-right">
                    <p className="text-[8px] lg:text-[9px] text-gray-400 font-black uppercase tracking-widest mb-0.5">{t.time}</p>
                    <span className="text-base lg:text-xl font-black text-[#1A1F3D]">{item.time}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* New Intake Button */}
                    <button 
                      onClick={() => setIntakeItem(item)}
                      className="p-2 lg:p-3 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                      title="Intake Checklist"
                    >
                      <ClipboardList size={20} />
                    </button>

                    {item.status === 'Completed' ? (
                      <button 
                        onClick={() => handleGoToCheckout(item)}
                        className="bg-[#1A1F3D] text-[#D9ED5F] px-4 lg:px-6 py-2 lg:py-3 rounded-xl lg:rounded-2xl transition-all flex items-center gap-2 text-[10px] lg:text-xs font-black shadow-lg shadow-[#1A1F3D]/10 active:scale-95"
                      >
                        <CreditCard size={14} /> {t.goToCheckout}
                      </button>
                    ) : (
                      <>
                        {prevStatus && (
                          <button 
                            onClick={() => updateQueueStatus(item.id, prevStatus)}
                            className="p-2 lg:p-3 text-gray-300 hover:text-[#1A1F3D] hover:bg-gray-50 rounded-xl transition-all"
                          >
                            <ChevronLeft size={16} />
                          </button>
                        )}

                        {nextStatus && (
                          <button 
                            onClick={() => updateQueueStatus(item.id, nextStatus)}
                            className={cn(
                              "px-4 lg:px-6 py-2 lg:py-3 rounded-xl lg:rounded-2xl transition-all flex items-center gap-2 text-[10px] lg:text-xs font-black shadow-lg shadow-transparent hover:shadow-current/10 active:scale-95",
                              nextStatus === 'Checked-in' ? "bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-200" :
                              nextStatus === 'In Progress' ? "bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200" :
                              "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200"
                            )}
                          >
                            <ChevronRight size={14} />
                            <span className="hidden sm:inline">
                              {nextStatus === 'Checked-in' ? t.checkInBtn : 
                               nextStatus === 'In Progress' ? t.startBtn : t.completeBtn}
                            </span>
                          </button>
                        )}
                      </>
                    )}

                    <button 
                      onClick={() => removeQueueItem(item.id)}
                      className="p-2 lg:p-3 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isBookingOpen && <BookingModal onClose={() => setIsBookingOpen(false)} />}
      {intakeItem && <GroomingServiceModal item={intakeItem} onClose={() => setIntakeItem(null)} />}
    </div>
  );
};

export default Queue;