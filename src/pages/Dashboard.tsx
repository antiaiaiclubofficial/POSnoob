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
import { toast } from 'sonner';

const Dashboard = () => {
  const { queue, transactions, inventory, customers, currency, kennelCapacity, staff } = useStore();
  const today = format(new Date(), 'yyyy-MM-dd');

  // 1. Daily Key Metrics
  const todayQueue = queue.filter(q => q.date === today);
  const todayTransactions = transactions.filter(t => t.date === today);
  
  const metrics = {
    totalAppointments: todayQueue.length,
    activePets: todayQueue.filter(q => q.status === 'Checked-in' || q.status === 'In Progress').length,
    completed: todayQueue.filter(q => q.status === 'Completed').length,
    revenue: todayTransactions.reduce((acc, t) => acc + t.amount, 0)
  };

  // 2. Timeline Logic
  const sortedTimeline = [...todayQueue].sort((a, b) => a.time.localeCompare(b.time));

  // 3. Kennel Status
  const occupiedKennels = todayQueue.filter(q => q.status === 'Checked-in' || q.status === 'In Progress').length;
  const availableKennels = Math.max(0, kennelCapacity - occupiedKennels);

  // 4. Alerts & Follow-ups
  const lowStockItems = inventory.filter(i => i.stock <= i.minStock);
  const pendingRequests = queue.filter(q => q.status === 'Waiting' && q.date === today).length;
  
  // Special Care Pets for today
  const specialCarePets = useMemo(() => {
    const todayPetIds = todayQueue.map(q => q.petId);
    const petsWithNotes: any[] = [];
    customers.forEach(c => {
      c.pets.forEach(p => {
        if (todayPetIds.includes(p.id) && p.notes.length > 0) {
          petsWithNotes.push({ name: p.name, note: p.notes, owner: c.name });
        }
      });
    });
    return petsWithNotes;
  }, [todayQueue, customers]);

  // 5. Quick Insights Data
  const serviceStats = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.forEach(t => {
      // Simplistic: using the first word of transaction id or just random labels for demo
      // In real app, we'd iterate over item names
      const category = t.itemsCount > 1 ? 'Full Spa' : 'Quick Groom';
      counts[category] = (counts[category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const busyHoursData = [
    { hour: '09:00', pets: 2 },
    { hour: '11:00', pets: 5 },
    { hour: '13:00', pets: 8 },
    { hour: '15:00', pets: 4 },
    { hour: '17:00', pets: 6 },
    { hour: '19:00', pets: 3 },
  ];

  const COLORS = ['#1A1F3D', '#D9ED5F', '#818CF8', '#F87171'];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8F9FD]">
      {/* Header */}
      <header className="px-6 lg:px-12 py-8 flex flex-col sm:flex-row justify-between items-start sm:items-center shrink-0">
        <div className="pl-14 lg:pl-0">
          <div className="flex items-center gap-2 mb-1">
            <LineChartIcon size={14} className="text-[#D9ED5F]" />
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Operational Overview</p>
          </div>
          <h1 className="text-3xl font-black text-[#1A1F3D]">Hello, Admin!</h1>
          <p className="text-xs text-gray-400 font-bold mt-1">Today is {format(new Date(), 'EEEE, MMMM do')}</p>
        </div>
        <div className="flex gap-3 mt-4 sm:mt-0">
          <button className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:bg-gray-50 transition-all relative">
            <Bell size={20} className="text-gray-400" />
            {(lowStockItems.length > 0 || pendingRequests > 0) && (
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
            )}
          </button>
          <button className="bg-[#1A1F3D] text-white px-6 py-4 rounded-2xl flex items-center gap-2 font-black text-sm shadow-xl shadow-[#1A1F3D]/10 active:scale-95 transition-all">
            <CalendarIcon size={18} /> Manage Schedule
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 lg:px-12 pb-12 scrollbar-hide">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* 1. Daily Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6"><CalendarIcon size={24} /></div>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Today's Queue</p>
              <h2 className="text-4xl font-black text-[#1A1F3D]">{metrics.totalAppointments} <span className="text-sm font-bold text-gray-300">Sessions</span></h2>
            </div>
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
              <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mb-6"><Activity size={24} /></div>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">In-Shop / Processing</p>
              <h2 className="text-4xl font-black text-[#1A1F3D]">{metrics.activePets} <span className="text-sm font-bold text-gray-300">Pets</span></h2>
            </div>
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
              <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mb-6"><CheckCircle2 size={24} /></div>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Completed Today</p>
              <h2 className="text-4xl font-black text-[#1A1F3D]">{metrics.completed} <span className="text-sm font-bold text-gray-300">Done</span></h2>
            </div>
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
              <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mb-6"><DollarSign size={24} /></div>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Daily Revenue</p>
              <h2 className="text-4xl font-black text-[#1A1F3D]">{currency}{metrics.revenue.toLocaleString()}</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 2. Today's Schedule */}
            <div className="lg:col-span-2 bg-white rounded-[48px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-10 border-b border-gray-50 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-[#1A1F3D]">Live Timeline</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Real-time queue monitoring</p>
                </div>
                <div className="bg-[#F5F6FA] px-4 py-2 rounded-xl text-[10px] font-black text-gray-400">
                  {todayQueue.length} TOTAL BOOKINGS
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-10 space-y-6 max-h-[600px] scrollbar-hide">
                {sortedTimeline.length > 0 ? (
                  sortedTimeline.map((item) => (
                    <div key={item.id} className="flex gap-6 group">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-black text-[#1A1F3D] w-12">{item.time}</span>
                        <div className="w-0.5 flex-1 bg-gray-100 my-2 group-last:hidden" />
                      </div>
                      <div className={cn(
                        "flex-1 p-6 rounded-[32px] border flex items-center justify-between transition-all group-hover:shadow-lg",
                        item.status === 'In Progress' ? "bg-blue-50 border-blue-100" : 
                        item.status === 'Completed' ? "bg-green-50 border-green-100" : "bg-[#F8F9FD] border-gray-50"
                      )}>
                        <div className="flex items-center gap-4">
                          <img src={item.image} className="w-14 h-14 rounded-2xl object-cover shadow-sm" />
                          <div>
                            <h4 className="font-black text-[#1A1F3D] text-sm">{item.petName}</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{item.serviceName}</p>
                            <div className="flex items-center gap-2 mt-2">
                               <div className="w-4 h-4 bg-white rounded-md flex items-center justify-center border border-gray-100">
                                  <Scissors size={8} className="text-gray-400" />
                               </div>
                               <span className="text-[9px] font-black text-gray-400 uppercase">Assigned: Sarah W.</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={cn(
                            "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter",
                            item.status === 'In Progress' ? "bg-blue-200 text-blue-700" : 
                            item.status === 'Completed' ? "bg-green-200 text-green-700" : 
                            item.status === 'Checked-in' ? "bg-purple-200 text-purple-700" : "bg-gray-200 text-gray-500"
                          )}>
                            {item.status}
                          </span>
                          {item.status === 'Completed' && !item.isPaid && (
                            <button className="bg-[#1A1F3D] text-[#D9ED5F] px-3 py-1.5 rounded-full text-[8px] font-black uppercase flex items-center gap-1">
                              Notify via LINE
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center opacity-30">
                    <CalendarIcon className="mx-auto mb-4" size={48} />
                    <p className="font-black">No activities yet for today</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side Cards */}
            <div className="space-y-8">
              {/* 3. Kennel Status */}
              <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><Home size={20} /></div>
                    <h3 className="text-xl font-black text-[#1A1F3D]">Kennel Status</h3>
                  </div>
                  <span className="text-[10px] font-black text-gray-400">{occupiedKennels}/{kennelCapacity}</span>
                </div>
                
                <div className="grid grid-cols-4 gap-3">
                  {Array.from({ length: kennelCapacity }).map((_, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "aspect-square rounded-2xl flex items-center justify-center border-2 transition-all",
                        i < occupiedKennels 
                          ? "bg-[#1A1F3D] border-[#1A1F3D] text-[#D9ED5F] shadow-lg shadow-[#1A1F3D]/10" 
                          : "bg-[#F5F6FA] border-transparent text-gray-200"
                      )}
                    >
                      {i < occupiedKennels ? <CheckCircle2 size={14} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-6 text-center">
                  {availableKennels} SPOTS REMAINING
                </p>
              </div>

              {/* 4. Alerts & Follow-ups */}
              <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-50 text-red-500 rounded-2xl"><Bell size={20} /></div>
                    <h3 className="text-xl font-black text-[#1A1F3D]">Alerts</h3>
                  </div>
                  <span className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-lg">
                    {lowStockItems.length + (specialCarePets.length > 0 ? 1 : 0)}
                  </span>
                </div>

                <div className="space-y-4">
                  {lowStockItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-red-50 rounded-[24px] border border-red-100">
                      <div className="flex items-center gap-3">
                        <Package size={16} className="text-red-500" />
                        <div>
                          <p className="text-[10px] font-black text-red-700 uppercase tracking-tighter">Low Stock</p>
                          <p className="text-xs font-bold text-red-900">{item.name}</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-red-700">{item.stock} left</span>
                    </div>
                  ))}

                  {specialCarePets.length > 0 && (
                    <div className="p-4 bg-orange-50 rounded-[24px] border border-orange-100">
                      <div className="flex items-center gap-3 mb-3">
                        <AlertTriangle size={16} className="text-orange-500" />
                        <div>
                          <p className="text-[10px] font-black text-orange-700 uppercase tracking-tighter">Special Care Today</p>
                          <p className="text-xs font-bold text-orange-900">{specialCarePets.length} Pets need attention</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {specialCarePets.slice(0, 2).map((pet, idx) => (
                          <div key={idx} className="bg-white/50 p-2 rounded-xl text-[9px] font-bold text-orange-800 italic">
                            • {pet.name}: {pet.note}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {lowStockItems.length === 0 && specialCarePets.length === 0 && (
                    <div className="py-6 text-center">
                       <CheckCircle2 className="mx-auto text-green-200 mb-2" size={32} />
                       <p className="text-[10px] font-black text-gray-300 uppercase">Everything is on track</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 5. Quick Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
            <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-[#1A1F3D]">Busy Hours</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Booking density per time slot</p>
                </div>
                <TrendingUp size={20} className="text-blue-500" />
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={busyHoursData}>
                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }} />
                    <Tooltip cursor={{ fill: '#F9FAFB' }} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="pets" radius={[8, 8, 8, 8]} barSize={24}>
                      {busyHoursData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.pets > 6 ? '#1A1F3D' : '#D1D5DB'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-10">
              <div className="flex-1">
                <h3 className="text-xl font-black text-[#1A1F3D]">Customer Loyalty</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 mb-8">Retention analysis</p>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-[#1A1F3D]" />
                       <span className="text-xs font-bold text-gray-500">Regulars</span>
                    </div>
                    <span className="text-sm font-black text-[#1A1F3D]">72%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-[#D9ED5F]" />
                       <span className="text-xs font-bold text-gray-500">New Clients</span>
                    </div>
                    <span className="text-sm font-black text-[#1A1F3D]">28%</span>
                  </div>
                </div>
              </div>
              <div className="h-[200px] w-[200px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[{ name: 'Regulars', value: 72 }, { name: 'New', value: 28 }]}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#1A1F3D" />
                      <Cell fill="#D9ED5F" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;