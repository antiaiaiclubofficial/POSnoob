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
} from 'lucide-react';
import { useStore, QueueStatus } from '@/store/useStore';
import BookingModal from '@/components/BookingModal';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const Queue = () => {
  const navigate = useNavigate();
  const { queue, updateQueueStatus, removeQueueItem, customers, selectOwner, setActivePet, setActiveQueueItem } = useStore();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [filter, setFilter] = useState<QueueStatus | 'All'>('All');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredQueue = queue.filter(item => 
    item.date === selectedDate && 
    !item.isPaid && 
    (filter === 'All' || item.status === filter)
  );

  const stats = [
    { label: 'Wait', status: 'Waiting' as QueueStatus, color: 'orange' },
    { label: 'In', status: 'Checked-in' as QueueStatus, color: 'purple' },
    { label: 'Work', status: 'In Progress' as QueueStatus, color: 'blue' },
    { label: 'Done', status: 'Completed' as QueueStatus, color: 'green' }
  ];

  const statusSequence: QueueStatus[] = ['Waiting', 'Checked-in', 'In Progress', 'Completed'];

  const getNextStatus = (current: QueueStatus): QueueStatus | null => {
    const index = statusSequence.indexOf(current);
    return index < statusSequence.length - 1 ? statusSequence[index + 1] : null;
  };

  const getStatusUI = (status: QueueStatus) => {
    switch(status) {
      case 'Waiting': return { color: 'text-orange-500', bg: 'bg-orange-50', icon: Clock };
      case 'Checked-in': return { color: 'text-purple-500', bg: 'bg-purple-50', icon: Clock };
      case 'In Progress': return { color: 'text-blue-500', bg: 'bg-blue-50', icon: PlayCircle };
      case 'Completed': return { color: 'text-green-500', bg: 'bg-green-50', icon: CheckCircle2 };
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
        navigate('/checkout');
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8F9FD]">
      <header className="px-6 lg:px-10 py-6 lg:py-8 flex flex-col sm:flex-row justify-between items-start sm:items-end shrink-0 gap-4">
        <div className="pl-14 lg:pl-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl shadow-sm border border-gray-100">
              <button onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() - 1);
                setSelectedDate(d.toISOString().split('T')[0]);
              }} className="p-1"><ChevronLeft size={12}/></button>
              <span className="text-[10px] font-black min-w-[70px] text-center">{selectedDate}</span>
              <button onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() + 1);
                setSelectedDate(d.toISOString().split('T')[0]);
              }} className="p-1"><ChevronRight size={12}/></button>
            </div>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-[#1A1F3D]">Pet Queue</h1>
        </div>
        <button 
          onClick={() => setIsBookingOpen(true)}
          className="w-full sm:w-auto bg-[#1A1F3D] text-white px-6 py-4 rounded-2xl text-xs font-black shadow-xl"
        >
          <Plus size={18} className="inline mr-2" /> New Booking
        </button>
      </header>

      {/* Filter Tabs */}
      <div className="px-6 lg:px-10 mb-6 flex gap-2 overflow-x-auto scrollbar-hide shrink-0">
        <button 
          onClick={() => setFilter('All')}
          className={cn(
            "px-4 py-3 rounded-2xl text-[10px] font-black uppercase transition-all whitespace-nowrap",
            filter === 'All' ? "bg-[#1A1F3D] text-white" : "bg-white text-gray-400 border border-gray-100"
          )}
        >
          All
        </button>
        {stats.map((s) => (
          <button 
            key={s.status}
            onClick={() => setFilter(s.status)}
            className={cn(
              "px-4 py-3 rounded-2xl text-[10px] font-black uppercase transition-all whitespace-nowrap flex items-center gap-2",
              filter === s.status ? "bg-white border-2 border-[#1A1F3D] text-[#1A1F3D]" : "bg-white text-gray-400 border border-gray-100"
            )}
          >
            <div className={cn("w-1.5 h-1.5 rounded-full", `bg-${s.color}-500`)} />
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-10 space-y-4">
        {filteredQueue.map((item) => {
          const ui = getStatusUI(item.status);
          const nextStatus = getNextStatus(item.status);

          return (
            <div key={item.id} className="bg-white p-4 lg:p-6 rounded-[28px] lg:rounded-[32px] border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img src={item.image} className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl object-cover" />
                <div className="min-w-0">
                  <h3 className="text-sm lg:text-base font-black text-[#1A1F3D] truncate">{item.petName}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase truncate">{item.serviceName} • {item.time}</p>
                </div>
              </div>

              <div className="flex items-center justify-between lg:justify-end gap-2 lg:gap-4 pt-3 lg:pt-0 border-t lg:border-t-0">
                <div className={cn("px-3 py-1.5 rounded-full text-[9px] font-black uppercase", ui.bg, ui.color)}>
                  {item.status}
                </div>
                
                <div className="flex gap-2">
                  {item.status === 'Completed' ? (
                    <button 
                      onClick={() => handleGoToCheckout(item)}
                      className="bg-[#1A1F3D] text-[#D9ED5F] px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-1"
                    >
                      <CreditCard size={14} /> Pay
                    </button>
                  ) : nextStatus && (
                    <button 
                      onClick={() => updateQueueStatus(item.id, nextStatus)}
                      className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-[10px] font-black border border-blue-100"
                    >
                      Next
                    </button>
                  )}
                  <button 
                    onClick={() => removeQueueItem(item.id)}
                    className="p-2 text-red-200 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filteredQueue.length === 0 && (
          <div className="py-20 text-center opacity-30">
            <CalendarIcon size={40} className="mx-auto mb-4" />
            <p className="text-sm font-black">No bookings found</p>
          </div>
        )}
      </div>

      {isBookingOpen && <BookingModal onClose={() => setIsBookingOpen(false)} />}
    </div>
  );
};

export default Queue;