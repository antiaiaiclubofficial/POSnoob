"use client";

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Clock, 
  CheckCircle2, 
  PlayCircle, 
  Plus, 
  Calendar as CalendarIcon,
  Trash2,
  BadgeCheck,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useStore, QueueItem, QueueStatus } from '@/store/useStore';
import BookingModal from '@/components/BookingModal';
import { cn } from '@/lib/utils';

const Queue = () => {
  const { queue, updateQueueStatus, removeQueueItem } = useStore();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [filter, setFilter] = useState<QueueStatus | 'All'>('All');
  
  // วันที่ปัจจุบันสำหรับกรอง
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredQueue = queue.filter(item => 
    item.date === selectedDate && (filter === 'All' || item.status === filter)
  );

  const stats = [
    { label: 'Waiting', count: queue.filter(i => i.date === selectedDate && i.status === 'Waiting').length, status: 'Waiting' as QueueStatus, color: 'orange' },
    { label: 'Checked-in', count: queue.filter(i => i.date === selectedDate && i.status === 'Checked-in').length, status: 'Checked-in' as QueueStatus, color: 'purple' },
    { label: 'In Progress', count: queue.filter(i => i.date === selectedDate && i.status === 'In Progress').length, status: 'In Progress' as QueueStatus, color: 'blue' },
    { label: 'Completed', count: queue.filter(i => i.date === selectedDate && i.status === 'Completed').length, status: 'Completed' as QueueStatus, color: 'green' }
  ];

  const getNextStatus = (current: QueueStatus): QueueStatus | null => {
    const sequence: QueueStatus[] = ['Waiting', 'Checked-in', 'In Progress', 'Completed'];
    const index = sequence.indexOf(current);
    return index < sequence.length - 1 ? sequence[index + 1] : null;
  };

  const getStatusUI = (status: QueueStatus) => {
    switch(status) {
      case 'Waiting': return { color: 'text-orange-500', bg: 'bg-orange-50', icon: Clock };
      case 'Checked-in': return { color: 'text-purple-500', bg: 'bg-purple-50', icon: Clock };
      case 'In Progress': return { color: 'text-blue-500', bg: 'bg-blue-50', icon: PlayCircle };
      case 'Completed': return { color: 'text-green-500', bg: 'bg-green-50', icon: CheckCircle2 };
    }
  };

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  return (
    <div className="flex h-screen bg-[#F8F9FD] text-[#1A1F3D] overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-10 py-8 flex justify-between items-end shrink-0">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-gray-100">
                <button onClick={() => changeDate(-1)} className="p-1 hover:bg-gray-50 rounded-lg transition-colors"><ChevronLeft size={14}/></button>
                <span className="text-xs font-black text-[#1A1F3D] min-w-[100px] text-center">{selectedDate === new Date().toISOString().split('T')[0] ? 'Today' : selectedDate}</span>
                <button onClick={() => changeDate(1)} className="p-1 hover:bg-gray-50 rounded-lg transition-colors"><ChevronRight size={14}/></button>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full" />
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Queue Management</p>
            </div>
            <h1 className="text-3xl font-black text-[#1A1F3D]">Operations Schedule</h1>
          </div>
          <button 
            onClick={() => setIsBookingOpen(true)}
            className="flex items-center gap-2 bg-[#1A1F3D] text-white px-6 py-3 rounded-2xl text-xs font-black hover:bg-[#2A3152] transition-all hover:scale-105 shadow-xl shadow-[#1A1F3D]/10"
          >
            <Plus size={18} /> New Appointment
          </button>
        </header>

        {/* Stats Filter Chips */}
        <div className="px-10 mb-8 flex gap-4 shrink-0 overflow-x-auto scrollbar-hide">
          <button 
            onClick={() => setFilter('All')}
            className={cn(
              "px-6 py-4 rounded-[24px] border transition-all shrink-0 flex flex-col min-w-[120px]",
              filter === 'All' ? "bg-[#1A1F3D] border-[#1A1F3D] text-white shadow-lg" : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
            )}
          >
            <span className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-60">All Bookings</span>
            <span className="text-xl font-black">{queue.filter(i => i.date === selectedDate).length}</span>
          </button>
          
          {stats.map((stat) => (
            <button 
              key={stat.label}
              onClick={() => setFilter(stat.status)}
              className={cn(
                "px-6 py-4 rounded-[24px] border transition-all shrink-0 flex flex-col min-w-[140px]",
                filter === stat.status ? "bg-white border-[#1A1F3D] shadow-md ring-4 ring-[#1A1F3D]/5" : "bg-white border-gray-100 hover:border-gray-200"
              )}
            >
              <span className="text-[9px] font-black uppercase tracking-widest mb-1 text-gray-400">{stat.label}</span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black">{stat.count}</span>
                <div className={cn("w-2 h-2 rounded-full", `bg-${stat.color}-500`)} />
              </div>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-10 pb-10 scrollbar-hide space-y-4">
          {filteredQueue.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center opacity-30 border-2 border-dashed border-gray-200 rounded-[40px]">
              <CalendarIcon size={48} className="mb-4" />
              <p className="font-black text-lg">No appointments scheduled for this date</p>
            </div>
          ) : (
            filteredQueue.map((item) => {
              const ui = getStatusUI(item.status);
              const nextStatus = getNextStatus(item.status);

              return (
                <div 
                  key={item.id} 
                  className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between group transition-all hover:shadow-xl hover:border-transparent animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <img src={item.image} className="w-16 h-16 rounded-[22px] object-cover shadow-md" />
                      <div className={cn("absolute -bottom-2 -right-2 w-7 h-7 rounded-full border-4 border-white flex items-center justify-center shadow-sm", ui.bg)}>
                        <ui.icon size={12} className={ui.color} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-black text-[#1A1F3D]">{item.petName}</h3>
                        {item.isPaid && (
                          <span className="bg-green-100 text-green-700 text-[8px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-tighter">
                            <BadgeCheck size={10} /> Fully Paid
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-400">{item.serviceName}</span>
                        <div className="w-1 h-1 bg-gray-200 rounded-full" />
                        <span className="text-xs font-bold text-gray-600">Owner: {item.ownerName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-10">
                    <div className="text-right">
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Appointment Time</p>
                      <span className="text-xl font-black text-[#1A1F3D]">{item.time}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {nextStatus && (
                        <button 
                          onClick={() => updateQueueStatus(item.id, nextStatus)}
                          className={cn(
                            "px-6 py-3 rounded-2xl transition-all flex items-center gap-2 text-xs font-black shadow-lg shadow-transparent hover:shadow-current/10 active:scale-95",
                            nextStatus === 'Checked-in' ? "bg-purple-100 text-purple-700 hover:bg-purple-200" :
                            nextStatus === 'In Progress' ? "bg-blue-100 text-blue-700 hover:bg-blue-200" :
                            "bg-green-100 text-green-700 hover:bg-green-200"
                          )}
                        >
                          <ChevronRight size={16} />
                          {nextStatus === 'Checked-in' ? 'Check-in' : 
                           nextStatus === 'In Progress' ? 'Start Service' : 'Complete'}
                        </button>
                      )}

                      <button 
                        onClick={() => removeQueueItem(item.id)}
                        className="p-3 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {isBookingOpen && <BookingModal onClose={() => setIsBookingOpen(false)} />}
    </div>
  );
};

export default Queue;