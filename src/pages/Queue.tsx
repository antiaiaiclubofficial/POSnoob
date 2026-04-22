"use client";

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Clock, 
  CheckCircle2, 
  PlayCircle, 
  MoreVertical, 
  Search, 
  Plus, 
  Calendar as CalendarIcon,
  Trash2
} from 'lucide-react';
import { useStore, QueueItem, QueueStatus } from '@/store/useStore';
import BookingModal from '@/components/BookingModal';
import { cn } from '@/lib/utils';

const Queue = () => {
  const { queue, updateQueueStatus, removeQueueItem } = useStore();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [filter, setFilter] = useState<QueueStatus | 'All'>('All');

  const filteredQueue = queue.filter(item => filter === 'All' || item.status === filter);

  const stats = {
    waiting: queue.filter(i => i.status === 'Waiting').length,
    active: queue.filter(i => i.status === 'In Progress').length,
    done: queue.filter(i => i.status === 'Completed').length,
  };

  return (
    <div className="flex h-screen bg-[#F5F6FA] text-[#1A1F3D] overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-10 py-8 flex justify-between items-center shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CalendarIcon size={16} className="text-gray-400" />
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Today: {new Date().toLocaleDateString()}</p>
            </div>
            <h1 className="text-2xl font-extrabold text-[#1A1F3D]">Pet Queue</h1>
          </div>
          <button 
            onClick={() => setIsBookingOpen(true)}
            className="flex items-center gap-2 bg-[#1A1F3D] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#2A3152] transition-colors shadow-lg shadow-[#1A1F3D]/10"
          >
            <Plus size={16} />
            New Booking
          </button>
        </header>

        {/* Stats Bar */}
        <div className="px-10 mb-8 grid grid-cols-3 gap-4 shrink-0">
          {[
            { label: 'Waiting', count: stats.waiting, color: 'text-orange-500', bg: 'bg-orange-50' },
            { label: 'In Progress', count: stats.active, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Completed', count: stats.done, color: 'text-green-500', bg: 'bg-green-50' }
          ].map((stat) => (
            <button 
              key={stat.label}
              onClick={() => setFilter(stat.label as QueueStatus)}
              className={cn(
                "p-4 rounded-2xl flex items-center justify-between border transition-all",
                filter === stat.label ? "border-[#1A1F3D] ring-2 ring-[#1A1F3D]/5" : "bg-white border-transparent"
              )}
            >
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">{stat.label}</span>
              <span className={cn("text-xl font-black px-3 py-0.5 rounded-lg", stat.bg, stat.color)}>{stat.count}</span>
            </button>
          ))}
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto px-10 pb-10 scrollbar-hide">
          <div className="space-y-4">
            {filteredQueue.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center opacity-30">
                <Clock size={48} className="mb-4" />
                <p className="font-bold">No pets in this queue category</p>
              </div>
            ) : (
              filteredQueue.map((item) => (
                <div 
                  key={item.id} 
                  className={cn(
                    "bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex items-center justify-between group transition-all hover:shadow-md",
                    item.status === 'Completed' && "opacity-60"
                  )}
                >
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <img src={item.image} className="w-16 h-16 rounded-[20px] object-cover" />
                      <div className={cn(
                        "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center",
                        item.status === 'Completed' ? "bg-green-500" : item.status === 'In Progress' ? "bg-blue-500" : "bg-orange-500"
                      )}>
                        {item.status === 'Completed' ? <CheckCircle2 size={12} className="text-white" /> : <Clock size={12} className="text-white" />}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-[#1A1F3D]">{item.petName}</h3>
                        <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{item.serviceName}</span>
                      </div>
                      <p className="text-xs text-gray-400 font-medium">Owner: <span className="text-gray-600 font-bold">{item.ownerName}</span></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Scheduled Slot</p>
                      <div className="flex items-center gap-1.5 justify-end">
                        <Clock size={14} className="text-[#1A1F3D]" />
                        <span className="text-lg font-black text-[#1A1F3D]">{item.time}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.status === 'Waiting' && (
                        <button 
                          onClick={() => updateQueueStatus(item.id, 'In Progress')}
                          className="bg-blue-50 text-blue-600 p-3 rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-2 text-xs font-bold"
                        >
                          <PlayCircle size={18} />
                          Start Service
                        </button>
                      )}
                      {item.status === 'In Progress' && (
                        <button 
                          onClick={() => updateQueueStatus(item.id, 'Completed')}
                          className="bg-green-50 text-green-600 p-3 rounded-xl hover:bg-green-100 transition-colors flex items-center gap-2 text-xs font-bold"
                        >
                          <CheckCircle2 size={18} />
                          Complete
                        </button>
                      )}
                      <button 
                        onClick={() => removeQueueItem(item.id)}
                        className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {isBookingOpen && <BookingModal onClose={() => setIsBookingOpen(false)} />}
    </div>
  );
};

export default Queue;