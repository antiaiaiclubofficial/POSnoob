"use client";

import React, { useMemo, useState } from 'react';
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
  LineChart as LineChartIcon,
  Info,
  Plus,
  ShoppingBag,
  ShieldAlert,
  Sparkles,
  Crown,
  Award,
  Star,
  Gem,
  DoorOpen
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { translations } from '@/utils/translations';
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
import { useNavigate } from 'react-router-dom';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import BookingModal from '@/components/BookingModal';
import CustomerModal from '@/components/CustomerModal';
import { toast } from 'sonner';

const Dashboard = () => {
  const navigate = useNavigate();
  const { queue, transactions, inventory, customers, currency, kennelCapacity, language, currentUser } = useStore();
  const t = translations[language];
  const today = format(new Date(), 'yyyy-MM-dd');

  // Modals State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);

  const todayQueue = queue.filter(q => q.date === today);
  const todayTransactions = transactions.filter(t => t.date === today);
  
  const metrics = useMemo(() => {
    const revenue = todayTransactions.reduce((acc, t) => acc + t.amount, 0);
    const avgTicket = todayTransactions.length > 0 ? revenue / todayTransactions.length : 0;
    const activePets = todayQueue.filter(q => q.status === 'Checked-in' || q.status === 'In Progress').length;
    const completed = todayQueue.filter(q => q.status === 'Completed').length;

    return {
      totalAppointments: todayQueue.length,
      activePets,
      completed,
      revenue,
      avgTicket
    };
  }, [todayQueue, todayTransactions]);

  // 1. คำนวณลูกค้าที่มาบ่อยที่สุด (Most Frequent Customers)
  const frequentCustomers = useMemo(() => {
    const visitMap: Record<string, number> = {};
    transactions.forEach(tx => {
      if (tx.customerId && tx.customerId !== 'walk-in') {
        visitMap[tx.customerId] = (visitMap[tx.customerId] || 0) + 1;
      }
    });
    return customers
      .map(c => ({ ...c, visits: visitMap[c.id] || 0 }))
      .filter(c => c.visits > 0)
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 5);
  }, [customers, transactions]);

  // 2. คำนวณลูกค้าที่มียอดชำระมากที่สุด 10 อันดับ (Top 10 Spending Customers)
  const topSpendingCustomers = useMemo(() => {
    const spendMap: Record<string, number> = {};
    transactions.forEach(tx => {
      if (tx.customerId && tx.customerId !== 'walk-in') {
        spendMap[tx.customerId] = (spendMap[tx.customerId] || 0) + tx.amount;
      }
    });
    return customers
      .map(c => ({ ...c, dynamicSpent: spendMap[c.id] || c.totalSpent || 0 }))
      .sort((a, b) => b.dynamicSpent - a.dynamicSpent)
      .slice(0, 10);
  }, [customers, transactions]);

  // 3. ตารางห้องพักโรงแรมสัตว์เลี้ยงแบบโต้ตอบได้ (Interactive Hotel Rooms Grid)
  const activeQueueItems = useMemo(() => {
    return todayQueue.filter(q => q.status === 'Checked-in' || q.status === 'In Progress');
  }, [todayQueue]);

  const hotelRooms = useMemo(() => {
    return Array.from({ length: kennelCapacity }).map((_, idx) => {
      const roomNo = 101 + idx;
      const occupiedBy = activeQueueItems[idx] || null;
      return {
        roomNo,
        occupiedBy
      };
    });
  }, [kennelCapacity, activeQueueItems]);

  const handleRoomClick = (room: any) => {
    if (room.occupiedBy) {
      toast.info(`ห้อง ${room.roomNo} กำลังให้บริการสัตว์เลี้ยง: ${room.occupiedBy.petName} (${room.occupiedBy.ownerName})`);
    } else {
      setIsBookingOpen(true);
      toast.success(`กำลังเปิดหน้าต่างจองคิวสำหรับห้องพัก ${room.roomNo}`);
    }
  };

  const busyHoursData = useMemo(() => {
    const hoursMap: Record<string, number> = {};
    for (let i = 9; i <= 19; i += 2) {
      const label = `${i.toString().padStart(2, '0')}:00`;
      hoursMap[label] = 0;
    }

    todayQueue.forEach(q => {
      const hour = q.time.split(':')[0];
      const slot = `${hour.padStart(2, '0')}:00`;
      const closestSlot = Object.keys(hoursMap).find(s => {
        const sHour = parseInt(s.split(':')[0]);
        const qHour = parseInt(hour);
        return qHour >= sHour && qHour < sHour + 2;
      }) || slot;
      
      if (hoursMap[closestSlot] !== undefined) {
        hoursMap[closestSlot]++;
      }
    });

    return Object.entries(hoursMap).map(([hour, pets]) => ({ hour, pets }));
  }, [todayQueue]);

  const loyaltyData = useMemo(() => {
    if (customers.length === 0) return { regulars: 0, new: 0, percentRegular: 0, percentNew: 0 };

    let regularCount = 0;
    let newCount = 0;

    customers.forEach(customer => {
      const visitCount = transactions.filter(t => t.customerId === customer.id).length;
      if (visitCount > 1) {
        regularCount++;
      } else if (visitCount === 1) {
        newCount++;
      }
    });

    const total = regularCount + newCount || 1;
    return {
      regulars: regularCount,
      new: newCount,
      percentRegular: Math.round((regularCount / total) * 100),
      percentNew: Math.round((newCount / total) * 100)
    };
  }, [customers, transactions]);

  const occupiedKennels = activeQueueItems.length;
  const lowStockItems = inventory.filter(i => i.stock <= i.minStock);
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

  const hasAlerts = lowStockItems.length > 0 || specialCarePets.length > 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8F9FD]">
      {/* Header Section */}
      <header className="px-6 lg:px-12 py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shrink-0 bg-white border-b border-gray-100 pl-14 lg:pl-12">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LineChartIcon size={14} className="text-indigo-500" />
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">{t.dailyOverview}</p>
          </div>
          <h1 className="text-3xl font-black text-[#1A1F3D]">
            {language === 'th' ? `สวัสดี, ${currentUser?.name || 'แอดมิน'}!` : `Hello, ${currentUser?.name || 'Admin'}!`}
          </h1>
          <p className="text-xs text-gray-400 font-bold mt-1">{t.todayIs} {format(new Date(), 'EEEE, MMMM do')}</p>
        </div>

        {/* Quick Actions & Alerts */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Alerts Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:bg-gray-50 transition-all relative shrink-0">
                <Bell size={20} className="text-gray-400" />
                {hasAlerts && (
                  <span className="absolute top-3.5 right-3.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 rounded-[32px] border-gray-100 shadow-2xl overflow-hidden" align="end">
              <div className="p-5 border-b border-gray-50 bg-[#F8F9FD]">
                <h4 className="font-black text-[#1A1F3D] text-sm">{t.alerts}</h4>
              </div>
              <div className="max-h-[350px] overflow-y-auto scrollbar-hide">
                {!hasAlerts ? (
                  <div className="p-10 text-center">
                    <p className="text-xs text-gray-400 font-bold">No new alerts</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {lowStockItems.map(item => (
                      <div key={item.id} className="p-4 flex gap-4 hover:bg-gray-50 transition-all">
                        <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                          <Package size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-[#1A1F3D]">Low Stock: {item.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Only {item.stock} {item.unit} left</p>
                        </div>
                      </div>
                    ))}
                    {specialCarePets.map((pet, idx) => (
                      <div key={idx} className="p-4 flex gap-4 hover:bg-gray-50 transition-all">
                        <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center shrink-0">
                          <AlertTriangle size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-[#1A1F3D]">Care Alert: {pet.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Note: {pet.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Quick Action Buttons */}
          <div className="flex gap-2 flex-1 md:flex-none">
            <button 
              onClick={() => setIsBookingOpen(true)}
              className="flex-1 md:flex-none bg-[#1A1F3D] text-white px-5 py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black text-xs shadow-lg shadow-[#1A1F3D]/10 active:scale-95 transition-all"
            >
              <Plus size={16} /> {language === 'th' ? 'จองคิวใหม่' : 'New Appt'}
            </button>
            <button 
              onClick={() => navigate('/pos')}
              className="flex-1 md:flex-none bg-[#D9ED5F] text-[#1A1F3D] px-5 py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black text-xs shadow-lg shadow-[#D9ED5F]/10 active:scale-95 transition-all"
            >
              <ShoppingBag size={16} /> {language === 'th' ? 'ขายหน้าร้าน' : 'POS'}
            </button>
            <button 
              onClick={() => setIsCustomerOpen(true)}
              className="flex-1 md:flex-none bg-white border border-gray-100 text-[#1A1F3D] px-5 py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black text-xs shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
            >
              <UserPlus size={16} /> {language === 'th' ? 'เพิ่มลูกค้า' : 'Add Client'}
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="flex-1 overflow-y-auto px-6 lg:px-12 py-10 scrollbar-hide">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Revenue Card */}
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center"><DollarSign size={24} /></div>
                <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-lg uppercase">Today</span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">{t.dailyRevenue}</p>
                <h2 className="text-3xl font-black text-[#1A1F3D]">{currency}{metrics.revenue.toLocaleString()}</h2>
                <p className="text-[9px] text-gray-400 font-bold mt-2">Avg. Ticket: {currency}{Math.round(metrics.avgTicket).toLocaleString()}</p>
              </div>
            </div>

            {/* Appointments Card */}
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center"><CalendarIcon size={24} /></div>
                <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase">Schedule</span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">{t.todaysQueue}</p>
                <h2 className="text-3xl font-black text-[#1A1F3D]">{metrics.totalAppointments} <span className="text-xs text-gray-400 font-bold">คิว</span></h2>
                <p className="text-[9px] text-gray-400 font-bold mt-2">Completed: {metrics.completed} / {metrics.totalAppointments}</p>
              </div>
            </div>

            {/* Active Pets Card */}
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center"><Activity size={24} /></div>
                <span className="text-[9px] font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-lg uppercase">In Shop</span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">{t.inShop}</p>
                <h2 className="text-3xl font-black text-[#1A1F3D]">{metrics.activePets} <span className="text-xs text-gray-400 font-bold">ตัว</span></h2>
                <p className="text-[9px] text-gray-400 font-bold mt-2">Kennel Occupancy: {Math.round((occupiedKennels / kennelCapacity) * 100)}%</p>
              </div>
            </div>

            {/* Low Stock Alerts Card */}
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center"><Package size={24} /></div>
                <button onClick={() => navigate('/inventory')} className="text-[9px] font-black text-red-600 bg-red-50 px-2 py-1 rounded-lg uppercase hover:underline">Manage</button>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Low Stock Items</p>
                <h2 className="text-3xl font-black text-[#1A1F3D]">{lowStockItems.length} <span className="text-xs text-gray-400 font-bold">รายการ</span></h2>
                <p className="text-[9px] text-gray-400 font-bold mt-2">Requires immediate restock</p>
              </div>
            </div>
          </div>

          {/* Interactive Hotel Rooms Grid */}
          <div className="bg-white p-8 rounded-[48px] border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-[#1A1F3D] flex items-center gap-2">
                  <Home className="text-indigo-500" size={22} />
                  {language === 'th' ? 'ตารางห้องพักโรงแรมสัตว์เลี้ยง' : 'Hotel Rooms Grid'}
                </h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                  {language === 'th' ? 'คลิกห้องว่างเพื่อจองคิว หรือดูสัตว์เลี้ยงที่เข้าพักอยู่' : 'Click empty room to book or view occupied status'}
                </p>
              </div>
              <span className="text-xs font-black text-gray-400 bg-gray-50 px-3 py-1.5 rounded-xl">
                {occupiedKennels} / {kennelCapacity} {language === 'th' ? 'ห้องไม่ว่าง' : 'Occupied'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {hotelRooms.map((room) => (
                <button
                  key={room.roomNo}
                  onClick={() => handleRoomClick(room)}
                  className={cn(
                    "p-5 rounded-[32px] border-2 transition-all text-center flex flex-col items-center justify-between h-40 relative overflow-hidden group",
                    room.occupiedBy 
                      ? "bg-[#1A1F3D] border-[#1A1F3D] text-white shadow-lg" 
                      : "bg-white border-gray-100 hover:border-indigo-500 hover:shadow-md text-gray-600"
                  )}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className={cn("text-xs font-black", room.occupiedBy ? "text-[#D9ED5F]" : "text-gray-400")}>
                      Room {room.roomNo}
                    </span>
                    {room.occupiedBy ? (
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    ) : (
                      <DoorOpen size={14} className="text-green-500" />
                    )}
                  </div>

                  {room.occupiedBy ? (
                    <div className="flex flex-col items-center gap-2 my-2">
                      <img 
                        src={room.occupiedBy.image} 
                        alt={room.occupiedBy.petName} 
                        className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm"
                      />
                      <p className="text-xs font-black truncate max-w-[110px]">{room.occupiedBy.petName}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 my-2 opacity-40 group-hover:opacity-100 transition-opacity">
                      <Plus size={20} className="text-indigo-500" />
                      <span className="text-[9px] font-black uppercase tracking-wider">Book Room</span>
                    </div>
                  )}

                  <div className="w-full">
                    <span className={cn(
                      "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md block text-center",
                      room.occupiedBy ? "bg-white/10 text-white" : "bg-green-50 text-green-600"
                    )}>
                      {room.occupiedBy ? room.occupiedBy.status : "Available"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Charts & Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Busy Hours Bar Chart */}
            <div className="lg:col-span-2 bg-white p-8 rounded-[48px] border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-black text-[#1A1F3D]">{t.busyHours}</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{language === 'th' ? 'ความหนาแน่นของการจองตามช่วงเวลา' : 'Booking density per time slot'}</p>
                </div>
                <TrendingUp size={20} className="text-blue-500" />
              </div>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={busyHoursData}>
                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }} />
                    <Tooltip cursor={{ fill: '#F9FAFB' }} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="pets" radius={[8, 8, 8, 8]} barSize={24}>
                      {busyHoursData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.pets > 0 ? '#1A1F3D' : '#E5E7EB'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Customer Loyalty Pie Chart */}
            <div className="bg-white p-8 rounded-[48px] border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-black text-[#1A1F3D]">{t.customerLoyalty}</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 mb-6">{language === 'th' ? 'วิเคราะห์การกลับมาใช้บริการ' : 'Retention analysis'}</p>
              </div>
              
              <div className="flex items-center justify-center h-[180px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Regulars', value: loyaltyData.percentRegular || 0 }, 
                        { name: 'New', value: loyaltyData.percentNew || 100 }
                      ]}
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
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-[#1A1F3D]">{loyaltyData.percentRegular}%</span>
                  <span className="text-[8px] font-black text-gray-400 uppercase">Regulars</span>
                </div>
              </div>

              <div className="space-y-3 mt-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-[#1A1F3D]" />
                     <span className="text-xs font-bold text-gray-500">{language === 'th' ? 'ลูกค้าประจำ' : 'Regulars'}</span>
                  </div>
                  <span className="text-xs font-black text-[#1A1F3D]">{loyaltyData.regulars} คน ({loyaltyData.percentRegular}%)</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-[#D9ED5F]" />
                     <span className="text-xs font-bold text-gray-500">{language === 'th' ? 'ลูกค้าใหม่' : 'New Clients'}</span>
                  </div>
                  <span className="text-xs font-black text-[#1A1F3D]">{loyaltyData.new} คน ({loyaltyData.percentNew}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Customers Section (Frequent & Spending) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Most Frequent Customers */}
            <div className="bg-white p-8 rounded-[48px] border border-gray-100 shadow-sm flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-black text-[#1A1F3D] flex items-center gap-2">
                  <Sparkles className="text-amber-500" size={20} />
                  {language === 'th' ? 'ลูกค้าที่มาใช้บริการบ่อยที่สุด' : 'Most Frequent Customers'}
                </h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                  {language === 'th' ? 'จัดอันดับลูกค้าตามจำนวนครั้งที่มาใช้บริการ' : 'Ranked by total visits'}
                </p>
              </div>

              <div className="divide-y divide-gray-50 flex-1">
                {frequentCustomers.map((customer, idx) => (
                  <div key={customer.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-black text-gray-300 w-6">#{idx + 1}</span>
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-sm">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#1A1F3D]">{customer.name}</p>
                        <span className="text-[8px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-md font-black uppercase tracking-wider">
                          {customer.membership}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-indigo-600">{customer.visits} {language === 'th' ? 'ครั้ง' : 'Visits'}</p>
                      <p className="text-[9px] text-gray-400 font-bold">{customer.phone}</p>
                    </div>
                  </div>
                ))}
                {frequentCustomers.length === 0 && (
                  <div className="py-12 text-center opacity-20 font-black text-xs uppercase">
                    No visit history recorded yet
                  </div>
                )}
              </div>
            </div>

            {/* Top 10 Spending Customers */}
            <div className="bg-white p-8 rounded-[48px] border border-gray-100 shadow-sm flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-black text-[#1A1F3D] flex items-center gap-2">
                  <Crown className="text-amber-500" size={20} />
                  {language === 'th' ? 'ลูกค้าที่มียอดชำระมากที่สุด 10 อันดับ' : 'Top 10 Spending Customers'}
                </h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                  {language === 'th' ? 'จัดอันดับลูกค้าตามยอดใช้จ่ายสะสมในระบบ' : 'Ranked by total spending'}
                </p>
              </div>

              <div className="divide-y divide-gray-50 flex-1 max-h-[350px] overflow-y-auto scrollbar-hide">
                {topSpendingCustomers.map((customer, idx) => (
                  <div key={customer.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-black text-gray-300 w-6">#{idx + 1}</span>
                      <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-black text-sm">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#1A1F3D]">{customer.name}</p>
                        <span className="text-[8px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-md font-black uppercase tracking-wider">
                          {customer.membership}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-green-600">{currency}{customer.dynamicSpent.toLocaleString()}</p>
                      <p className="text-[9px] text-gray-400 font-bold">{customer.phone}</p>
                    </div>
                  </div>
                ))}
                {topSpendingCustomers.length === 0 && (
                  <div className="py-12 text-center opacity-20 font-black text-xs uppercase">
                    No spending history recorded yet
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Operations & Live Timeline Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Live Timeline */}
            <div className="lg:col-span-2 bg-white rounded-[48px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black text-[#1A1F3D]">{t.liveTimeline}</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{language === 'th' ? 'ตรวจสอบคิวแบบเรียลไทม์' : 'Real-time queue monitoring'}</p>
                </div>
                <button onClick={() => navigate('/queue')} className="text-xs font-black text-indigo-600 hover:underline flex items-center gap-1">
                  {language === 'th' ? 'ดูทั้งหมด' : 'View All'} <ChevronRight size={14} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-6 max-h-[400px] scrollbar-hide">
                {todayQueue.length === 0 ? (
                  <div className="py-20 text-center opacity-20">
                    <CalendarIcon size={48} className="mx-auto mb-4" />
                    <p className="font-black text-sm">ไม่มีคิวงานสำหรับวันนี้</p>
                  </div>
                ) : (
                  [...todayQueue].sort((a,b) => a.time.localeCompare(b.time)).map((item) => (
                    <div key={item.id} className="flex gap-6 group">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-black text-[#1A1F3D] w-12">{item.time}</span>
                        <div className="w-0.5 flex-1 bg-gray-100 my-2 group-last:hidden" />
                      </div>
                      <div className={cn(
                        "flex-1 p-5 rounded-[32px] border flex items-center justify-between transition-all hover:border-gray-200",
                        item.status === 'In Progress' ? "bg-blue-50/50 border-blue-100" : "bg-[#F8F9FD]/50 border-gray-50"
                      )}>
                        <div className="flex items-center gap-4">
                          <img src={item.image} className="w-12 h-12 rounded-2xl object-cover shadow-sm" />
                          <div>
                            <h4 className="font-black text-[#1A1F3D] text-sm">{item.petName}</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{item.serviceName}</p>
                          </div>
                        </div>
                        <span className={cn(
                          "px-3 py-1.5 rounded-full text-[9px] font-black uppercase",
                          item.status === 'Waiting' ? "bg-orange-100 text-orange-700" :
                          item.status === 'In Progress' ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                        )}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Kennel Status & Special Care */}
            <div className="space-y-8">
              {/* Kennel Occupancy */}
              <div className="bg-white p-8 rounded-[48px] border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><Home size={20} /></div>
                    <h3 className="text-lg font-black text-[#1A1F3D]">{t.kennelStatus}</h3>
                  </div>
                  <span className="text-xs font-black text-gray-400">{occupiedKennels}/{kennelCapacity}</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {Array.from({ length: kennelCapacity }).map((_, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "aspect-square rounded-2xl border-2 transition-all", 
                        i < occupiedKennels 
                          ? "bg-[#1A1F3D] border-[#1A1F3D] shadow-sm shadow-[#1A1F3D]/10" 
                          : "bg-[#F5F6FA] border-transparent"
                      )} 
                    />
                  ))}
                </div>
              </div>

              {/* Special Care Alerts */}
              <div className="bg-white p-8 rounded-[48px] border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-50 text-orange-500 rounded-2xl"><AlertTriangle size={20} /></div>
                  <h3 className="text-lg font-black text-[#1A1F3D]">Special Care Today</h3>
                </div>
                
                <div className="space-y-3 max-h-[180px] overflow-y-auto scrollbar-hide">
                  {specialCarePets.length === 0 ? (
                    <p className="text-xs text-gray-400 font-bold text-center py-4">ไม่มีสัตว์เลี้ยงที่ต้องดูแลเป็นพิเศษวันนี้</p>
                  ) : (
                    specialCarePets.map((pet, idx) => (
                      <div key={idx} className="p-4 bg-orange-50/50 border border-orange-100 rounded-2xl flex gap-3">
                        <div className="shrink-0 text-orange-500"><AlertTriangle size={16} /></div>
                        <div>
                          <p className="text-xs font-black text-[#1A1F3D]">{pet.name} ({pet.owner})</p>
                          <p className="text-[10px] text-orange-800 font-medium mt-1 leading-relaxed">{pet.note}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Modals */}
      {isBookingOpen && <BookingModal onClose={() => setIsBookingOpen(false)} />}
      {isCustomerOpen && <CustomerModal onClose={() => setIsCustomerOpen(false)} />}
    </div>
  );
};

export default Dashboard;