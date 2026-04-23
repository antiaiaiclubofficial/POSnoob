"use client";

import React, { useState } from 'react';
import { 
  Clock, CheckCircle2, PlayCircle, Plus, Calendar as CalendarIcon, 
  Trash2, BadgeCheck, ChevronRight, ChevronLeft, Bell
} from 'lucide-react';
import { useStore, QueueStatus } from '@/store/useStore';
import BookingModal from '@/components/BookingModal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const Queue = () => {
  const { queue, updateQueueStatus, removeQueueItem, liffId, smsApiKey } = useStore();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [filter, setFilter] = useState<QueueStatus | 'All'>('All');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredQueue = queue.filter(item => item.date === selectedDate && (filter === 'All' || item.status === filter));

  const handleNotify = (item: any) => {
    if (!liffId && !smsApiKey) {
      toast.error("Please configure LINE/SMS in Settings first");
      return;
    }
    toast.success(`Notification sent to ${item.ownerName} for ${item.petName}!`);
  };

  const getStatusUI = (status: QueueStatus) => {
    switch(status) {
      case 'Waiting': return { color: 'text-orange-500', bg: 'bg-orange-50', icon: Clock };
      case 'Checked-in': return { color: 'text-purple-500', bg: 'bg-purple-50', icon: Clock };
      case 'In Progress': return { color: 'text-blue-500', bg: 'bg-blue-50', icon: PlayCircle };
      case 'Completed': return { color: 'text-green-500', bg: 'bg-green-50', icon: CheckCircle2 };
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="px-6 lg:px-10 py-6 lg:py-8 flex flex-col sm:flex-row justify-between items-start sm:items-end shrink-0 gap-4">
        <div className="pl-14 lg:pl-0">
          <h1 className="text-2xl lg:text-3xl font-black text-[#1A1F3D]">Operations</h1>
          <p className="text-xs text-gray-400 font-bold uppercase mt-1">{selectedDate}</p>
        </div>
        <button onClick={() => setIsBookingOpen(true)} className="bg-[#1A1F3D] text-white px-6 py-3 rounded-2xl text-xs font-black shadow-xl shadow-[#1A1F3D]/10"><Plus size={18} /> New Appointment</button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-10 scrollbar-hide space-y-4">
        {filteredQueue.map((item) => {
          const ui = getStatusUI(item.status);
          return (
            <div key={item.id} className="bg-white p-4 lg:p-6 rounded-[24px] lg:rounded-[32px] border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all hover:shadow-xl">
              <div className="flex items-center gap-4 lg:gap-6">
                <img src={item.image} className="w-12 h-12 lg:w-16 lg:h-16 rounded-[18px] object-cover shadow-md" />
                <div>
                  <h3 className="text-base lg:text-lg font-black text-[#1A1F3D]">{item.petName}</h3>
                  <p className="text-[10px] lg:text-xs font-bold text-gray-400">{item.ownerName} • {item.serviceName}</p>
                </div>
              </div>

              <div className="flex items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-4 lg:pt-0">
                <div className="text-left lg:text-right">
                  <p className="text-[8px] font-black text-gray-400 uppercase mb-0.5">Time</p>
                  <span className="text-base font-black text-[#1A1F3D]">{item.time}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleNotify(item)}
                    className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                    title="Send Alert"
                  >
                    <Bell size={16} />
                  </button>
                  <button onClick={() => removeQueueItem(item.id)} className="p-3 text-gray-200 hover:text-red-500 rounded-xl transition-all"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isBookingOpen && <BookingModal onClose={() => setIsBookingOpen(false)} />}
    </div>
  );
};

export default Queue;