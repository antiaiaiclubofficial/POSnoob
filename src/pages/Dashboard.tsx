"use client";

import React, { useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  Activity, 
  DollarSign, 
  Users, 
  Package, 
  Bell, 
  AlertTriangle, 
  Home, 
  ChevronRight, 
  Scissors, 
  TrendingUp, 
  UserPlus, 
  LineChart as LineChartIcon
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';

const Dashboard = () => {
  const { queue, transactions, inventory, customers, currency, kennelCapacity } = useStore();
  const today = format(new Date(), 'yyyy-MM-dd');

  const todayQueue = queue.filter(q => q.date === today);
  const todayTransactions = transactions.filter(t => t.date === today);
  
  const metrics = {
    totalAppointments: todayQueue.length,
    activePets: todayQueue.filter(q => q.status === 'Checked-in' || q.status === 'In Progress').length,
    completed: todayQueue.filter(q => q.status === 'Completed').length,
    revenue: todayTransactions.reduce((acc, t) => acc + t.amount, 0)
  };

  const sortedTimeline = [...todayQueue].sort((a, b) => a.time.localeCompare(b.time));
  const occupiedKennels = todayQueue.filter(q => q.status === 'Checked-in' || q.status === 'In Progress').length;
  const availableKennels = Math.max(0, kennelCapacity - occupiedKennels);
  const lowStockItems = inventory.filter(i => i.stock <= i.minStock);

  const busyHoursData = [
    { hour: '09:00', pets: 2 },
    { hour: '11:00', pets: 5 },
    { hour: '13:00', pets: 8 },
    { hour: '15:00', pets: 4 },
    { hour: '17:00', pets: 6 },
    { hour: '19:00', pets: 3 },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8F9FD]">
      {/* Header */}
      <header className="px-6 lg:px-12 py-6 lg:py-8 flex flex-col sm:flex-row justify-between items-start sm:items-center shrink-0 gap-4">
        <div className="pl-14 lg:pl-0">
          <div className="flex items-center gap-2 mb-1">
            <LineChartIcon size={14} className="text-[#D9ED5F]" />
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Operational Overview</p>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-[#1A1F3D]">Hello, Admin!</h1>
          <p className="text-[10px] lg:text-xs text-gray-400 font-bold mt-1">Today is {format(new Date(), 'EEEE, MMMM do')}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none bg-white border border-gray-100 p-3 lg:p-4 rounded-2xl shadow-sm relative flex items-center justify-center">
            <Bell size={20} className="text-gray-400" />
            {lowStockItems.length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full" />
            )}
          </button>
          <button className="flex-[3] sm:flex-none bg-[#1A1F3D] text-white px-6 py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs lg:text-sm shadow-xl active:scale-95 transition-all">
            <CalendarIcon size={18} /> Schedule
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 lg:px-12 pb-12 scrollbar-hide">
        <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
          
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {[
              { icon: CalendarIcon, color: 'blue', label: 'Today Queue', value: metrics.totalAppointments, unit: 'Sessions' },
              { icon: Activity, color: 'purple', label: 'Active Pets', value: metrics.activePets, unit: 'Pets' },
              { icon: CheckCircle2, color: 'green', label: 'Completed', value: metrics.completed, unit: 'Done' },
              { icon: DollarSign, color: 'orange', label: 'Revenue', value: `${currency}${metrics.revenue.toLocaleString()}`, unit: '' }
            ].map((m, i) => (
              <div key={i} className="bg-white p-6 lg:p-8 rounded-[32px] lg:rounded-[40px] border border-gray-100 shadow-sm flex flex-col justify-center">
                <div className={cn("w-10 h-10 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center mb-4 lg:mb-6", `bg-${m.color}-50 text-${m.color}-500`)}>
                  <m.icon size={20} className="lg:w-6 lg:h-6" />
                </div>
                <p className="text-[9px] lg:text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">{m.label}</p>
                <h2 className="text-2xl lg:text-4xl font-black text-[#1A1F3D]">
                  {m.value} <span className="text-[10px] lg:text-sm font-bold text-gray-300">{m.unit}</span>
                </h2>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Timeline */}
            <div className="lg:col-span-2 bg-white rounded-[32px] lg:rounded-[48px] border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
              <div className="p-6 lg:p-10 border-b border-gray-50 flex justify-between items-center">
                <h3 className="text-lg lg:text-2xl font-black text-[#1A1F3D]">Live Timeline</h3>
                <span className="bg-[#F5F6FA] px-3 py-1 rounded-lg text-[9px] font-black text-gray-400">{todayQueue.length} TOTAL</span>
              </div>
              <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-6 max-h-[500px] scrollbar-hide">
                {sortedTimeline.length > 0 ? (
                  sortedTimeline.map((item) => (
                    <div key={item.id} className="flex gap-4 lg:gap-6">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] lg:text-xs font-black text-[#1A1F3D] w-10 lg:w-12">{item.time}</span>
                        <div className="w-0.5 flex-1 bg-gray-100 my-1 group-last:hidden" />
                      </div>
                      <div className={cn(
                        "flex-1 p-4 lg:p-6 rounded-2xl lg:rounded-[32px] border flex items-center justify-between",
                        item.status === 'In Progress' ? "bg-blue-50 border-blue-100" : 
                        item.status === 'Completed' ? "bg-green-50 border-green-100" : "bg-[#F8F9FD] border-gray-50"
                      )}>
                        <div className="flex items-center gap-3 lg:gap-4">
                          <img src={item.image} className="w-10 h-10 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl object-cover" />
                          <div className="min-w-0">
                            <h4 className="font-black text-[#1A1F3D] text-xs lg:text-sm truncate">{item.petName}</h4>
                            <p className="text-[8px] lg:text-[10px] text-gray-400 font-bold uppercase truncate">{item.serviceName}</p>
                          </div>
                        </div>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[8px] lg:text-[9px] font-black uppercase whitespace-nowrap",
                          item.status === 'In Progress' ? "bg-blue-200 text-blue-700" : "bg-gray-200 text-gray-500"
                        )}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
                    <CalendarIcon size={40} className="mb-2" />
                    <p className="text-sm font-black">No activity today</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6 lg:space-y-8">
              {/* Kennel */}
              <div className="bg-white p-6 lg:p-10 rounded-[32px] lg:rounded-[48px] border border-gray-100 shadow-sm">
                <h3 className="text-lg lg:text-xl font-black text-[#1A1F3D] mb-6">Kennel Status</h3>
                <div className="grid grid-cols-4 gap-2 lg:gap-3">
                  {Array.from({ length: kennelCapacity }).map((_, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "aspect-square rounded-xl lg:rounded-2xl flex items-center justify-center border-2",
                        i < occupiedKennels ? "bg-[#1A1F3D] border-[#1A1F3D] text-[#D9ED5F]" : "bg-[#F5F6FA] border-transparent text-gray-200"
                      )}
                    >
                      <div className={cn("w-1.5 h-1.5 rounded-full", i < occupiedKennels ? "bg-[#D9ED5F]" : "bg-current")} />
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-gray-400 font-bold uppercase text-center mt-6">{availableKennels} SPOTS LEFT</p>
              </div>

              {/* Alerts */}
              <div className="bg-white p-6 lg:p-10 rounded-[32px] lg:rounded-[48px] border border-gray-100 shadow-sm">
                <h3 className="text-lg lg:text-xl font-black text-[#1A1F3D] mb-6">Active Alerts</h3>
                <div className="space-y-3">
                  {lowStockItems.slice(0, 3).map(item => (
                    <div key={item.id} className="p-3 lg:p-4 bg-red-50 rounded-2xl flex items-center justify-between border border-red-100">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={14} className="text-red-500" />
                        <span className="text-[10px] lg:text-xs font-bold text-red-900">{item.name}</span>
                      </div>
                      <span className="text-[10px] font-black text-red-700">{item.stock} left</span>
                    </div>
                  ))}
                  {lowStockItems.length === 0 && (
                    <div className="text-center py-4 opacity-30">
                       <CheckCircle2 className="mx-auto mb-2" size={24} />
                       <p className="text-[10px] font-black">All Clear</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;