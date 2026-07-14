"use client";

import React, { useMemo, useState, useEffect } from 'react';
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
  Minus,
  ShoppingBag,
  ShieldAlert,
  Sparkles,
  Crown,
  Award,
  Star,
  Gem,
  DoorOpen,
  Settings as SettingsIcon,
  Check,
  X,
  LogOut
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CustomerDashboard from '@/components/customers/CustomerDashboard';
import InventoryDashboard from '@/components/InventoryDashboard';
import BookingModal from '@/components/BookingModal';
import CustomerModal from '@/components/CustomerModal';

import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';



const Dashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { queue, transactions, inventory, customers, currency, kennelCapacity, language, currentUser, storeId } = useStore();
  const t = translations[language];
  const today = format(new Date(), 'yyyy-MM-dd');

  // Modals State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);



  // Fetch today's attendance status for the current user
  const { data: todayAttendance = [] } = useQuery({
    queryKey: ['today_attendance', currentUser?.id, today],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data, error } = await supabase
        .from('attendance_logs' as any)
        .select('*')
        .eq('user_id', currentUser.id)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .order('created_at', { ascending: false });
      if (error) return [];
      return data || [];
    },
    enabled: !!currentUser?.id
  });

  const lastLog = todayAttendance[0];
  const isClockedIn = lastLog?.type === 'check_in';

  const clockMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.id || !storeId) return;
      const nextType = isClockedIn ? 'check_out' : 'check_in';
      const { error } = await supabase
        .from('attendance_logs' as any)
        .insert([{
          user_id: currentUser.id,
          store_id: storeId,
          type: nextType
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today_attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance_logs'] });
      toast.success(isClockedIn ? "บันทึกเวลาออกงานเรียบร้อยแล้ว" : "บันทึกเวลาเข้างานเรียบร้อยแล้ว");
    },
    onError: (err: any) => {
      toast.error("เกิดข้อผิดพลาด: " + err.message);
    }
  });

  // Fetch Active Hotel Bookings for dashboard stats
  const { data: hotelBookings = [] } = useQuery({
    queryKey: ['hotel_bookings_active_dashboard', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hotel_bookings')
        .select('*')
        .eq('store_id', storeId)
        .in('status', ['reserved', 'checked_in']);
      if (error) throw error;
      return data;
    },
    enabled: !!storeId && storeId !== 'default-store',
  });

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

  const occupiedKennels = hotelBookings.length;

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
    if (todayTransactions.length === 0) return { regulars: 0, new: 0, percentRegular: 0, percentNew: 0 };

    const todayCustomerIds = [...new Set(todayTransactions.map(t => t.customerId))];
    let regularCount = 0;
    let newCount = 0;

    todayCustomerIds.forEach(customerId => {
      const allVisits = transactions.filter(t => t.customerId === customerId);
      if (allVisits.length > 1) {
        regularCount++;
      } else {
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
  }, [todayTransactions, transactions]);

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

  const getTierColorClass = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'vip': return 'bg-purple-100 text-purple-700';
      case 'platinum': return 'bg-indigo-100 text-indigo-700';
      case 'gold': return 'bg-amber-100 text-amber-700';
      case 'silver': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden bg-[#F9F9F9]">
      {/* Header Section */}
      <header className="px-6 lg:px-12 py-8 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 shrink-0 bg-[#F9F9F9]/80 backdrop-blur-xl border-none pl-14 lg:pl-12 sticky top-0 z-10">
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

        {/* Tabs List */}
        <div className="flex-1 flex xl:justify-center w-full xl:w-auto overflow-x-auto scrollbar-hide">
          <TabsList className="bg-gray-200/50 p-1.5 rounded-[2rem]">
            <TabsTrigger value="overview" className="rounded-3xl px-6 py-2.5 text-xs font-black data-[state=active]:bg-white data-[state=active]:text-[#18234A] data-[state=active]:shadow-sm transition-all">{language === 'th' ? 'ภาพรวม' : 'Overview'}</TabsTrigger>
            <TabsTrigger value="crm" className="rounded-3xl px-6 py-2.5 text-xs font-black data-[state=active]:bg-white data-[state=active]:text-[#18234A] data-[state=active]:shadow-sm transition-all">CRM</TabsTrigger>
            <TabsTrigger value="inventory" className="rounded-3xl px-6 py-2.5 text-xs font-black data-[state=active]:bg-white data-[state=active]:text-[#18234A] data-[state=active]:shadow-sm transition-all">{language === 'th' ? 'คลังสินค้า' : 'Inventory'}</TabsTrigger>
          </TabsList>
        </div>

        {/* Quick Actions & Alerts */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Clock In / Out Button */}
          {currentUser?.role !== 'superadmin' && (
            <button
              onClick={() => clockMutation.mutate()}
              disabled={clockMutation.isPending}
              className={cn(
                "flex-1 md:flex-none px-5 py-3.5 rounded-[2rem] flex items-center justify-center gap-2 font-black text-xs shadow-lg active:scale-95 transition-all",
                isClockedIn
                  ? "bg-red-500 text-white shadow-red-500/20 hover:bg-red-600"
                  : "bg-gradient-to-br from-[#18234A] to-[#020D35] text-white shadow-[#18234A]/20 hover:opacity-90 relative overflow-hidden"
              )}
            >
              {!isClockedIn && <div className="absolute inset-0 bg-white/10" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }} />}
              <Clock size={16} />
              {clockMutation.isPending
                ? "กำลังบันทึก..."
                : isClockedIn
                  ? (language === 'th' ? 'ลงชื่อออกงาน' : 'Clock Out')
                  : (language === 'th' ? 'ลงชื่อเข้างาน' : 'Clock In')
              }
            </button>
          )}

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
                      <div key={item.id} className="p-4 flex gap-4 hover:bg-gray-50/50 transition-all">
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
                      <div key={idx} className="p-4 flex gap-4 hover:bg-gray-50/50 transition-all">
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
              className="flex-1 md:flex-none bg-gradient-to-br from-[#18234A] to-[#020D35] text-white px-5 py-3.5 rounded-[2rem] flex items-center justify-center gap-2 font-black text-xs shadow-lg shadow-[#18234A]/10 active:scale-95 transition-all relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }} />
              <Plus size={16} /> {language === 'th' ? 'จองคิวใหม่' : 'New Appt'}
            </button>
            <button
              onClick={() => navigate('/pos')}
              className="flex-1 md:flex-none bg-[#EAFD69] text-[#18234A] px-5 py-3.5 rounded-[2rem] flex items-center justify-center gap-2 font-black text-xs shadow-lg shadow-[#EAFD69]/20 active:scale-95 transition-all"
            >
              <ShoppingBag size={16} /> {language === 'th' ? 'ขายหน้าร้าน' : 'POS'}
            </button>
            <button
              onClick={() => setIsCustomerOpen(true)}
              className="flex-1 md:flex-none bg-white text-[#18234A] px-5 py-3.5 rounded-[2rem] flex items-center justify-center gap-2 font-black text-xs shadow-sm hover:bg-[#F3F3F3] active:scale-95 transition-all"
            >
              <UserPlus size={16} /> {language === 'th' ? 'เพิ่มลูกค้า' : 'Add Client'}
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <TabsContent value="overview" className="flex-1 overflow-y-auto px-6 lg:px-12 py-10 scrollbar-hide m-0 data-[state=active]:flex flex-col outline-none">
        <div className="w-full space-y-8">

          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Revenue Card */}
            <div className="bg-white/70 backdrop-blur-3xl border border-white/60 shadow-[0_8px_32px_rgba(24,35,74,0.04)] hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(24,35,74,0.08)] p-6 rounded-[2rem] flex flex-col justify-between relative overflow-hidden group transition-all duration-500">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-green-400/20 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-700" />
              <div className="flex justify-between items-start mb-2 relative z-10">
                <h3 className="text-sm font-black text-[#1A1F3D] tracking-wide mt-1">{t.dailyRevenue}</h3>
                <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-lg uppercase">Today</span>
              </div>
              <div className="relative z-10">
                <h2 className="text-3xl font-black text-[#1A1F3D]">{currency}{metrics.revenue.toLocaleString()}</h2>
                <p className="text-[9px] text-gray-400 font-bold mt-1">Avg. Revenue per Transaction: {currency}{Math.round(metrics.avgTicket).toLocaleString()}</p>
              </div>
            </div>

            {/* Appointments Card */}
            <div className="bg-white/70 backdrop-blur-3xl border border-white/60 shadow-[0_8px_32px_rgba(24,35,74,0.04)] hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(24,35,74,0.08)] p-6 rounded-[2rem] flex flex-col justify-between relative overflow-hidden group transition-all duration-500">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-700" />
              <div className="flex justify-between items-start mb-2 relative z-10">
                <h3 className="text-sm font-black text-[#1A1F3D] tracking-wide mt-1">{t.todaysQueue}</h3>
                <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase">Schedule</span>
              </div>
              <div className="relative z-10">
                <h2 className="text-3xl font-black text-[#1A1F3D]">{metrics.totalAppointments} <span className="text-xs text-gray-400 font-bold">คิว</span></h2>
                <p className="text-[9px] text-gray-400 font-bold mt-1">Completed: {metrics.completed} / {metrics.totalAppointments}</p>
              </div>
            </div>

            {/* Active Pets Card */}
            <div className="bg-white/70 backdrop-blur-3xl border border-white/60 shadow-[0_8px_32px_rgba(24,35,74,0.04)] hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(24,35,74,0.08)] p-6 rounded-[2rem] flex flex-col justify-between relative overflow-hidden group transition-all duration-500">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-700" />
              <div className="flex justify-between items-start mb-2 relative z-10">
                <h3 className="text-sm font-black text-[#1A1F3D] tracking-wide mt-1">{t.inShop}</h3>
                <span className="text-[9px] font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-lg uppercase">In Shop</span>
              </div>
              <div className="relative z-10">
                <h2 className="text-3xl font-black text-[#1A1F3D]">{metrics.activePets} <span className="text-xs text-gray-400 font-bold">ตัว</span></h2>
                <p className="text-[9px] text-gray-400 font-bold mt-1">Kennel Occupancy: {Math.round((occupiedKennels / kennelCapacity) * 100)}%</p>
              </div>
            </div>

            {/* Low Stock Alerts Card */}
            <div className="bg-white/70 backdrop-blur-3xl border border-white/60 shadow-[0_8px_32px_rgba(24,35,74,0.04)] hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(24,35,74,0.08)] p-6 rounded-[2rem] flex flex-col justify-between relative overflow-hidden group transition-all duration-500">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-400/20 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-700" />
              <div className="flex justify-between items-start mb-2 relative z-10">
                <h3 className="text-sm font-black text-[#1A1F3D] tracking-wide mt-1">Low Stock Items</h3>
                <button onClick={() => navigate('/inventory')} className="text-[9px] font-black text-red-600 bg-red-50 px-2 py-1 rounded-lg uppercase hover:underline">Manage</button>
              </div>
              <div className="relative z-10">
                <h2 className="text-3xl font-black text-[#1A1F3D]">{lowStockItems.length} <span className="text-xs text-gray-400 font-bold">รายการ</span></h2>
                <p className="text-[9px] text-gray-400 font-bold mt-1">Requires immediate restock</p>
              </div>
            </div>
          </div>

          {/* Charts & Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Busy Hours Bar Chart */}
            <div className="lg:col-span-2 bg-white/80 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_rgba(24,35,74,0.04)] p-8 rounded-[3rem]">
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
            <div className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_rgba(24,35,74,0.04)] p-8 rounded-[3rem] flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-black text-[#1A1F3D]">{language === 'th' ? 'สัดส่วนลูกค้าวันนี้' : "Today's Customers"}</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 mb-6">{language === 'th' ? 'ลูกค้าประจำ vs ลูกค้าใหม่' : 'Regulars vs New'}</p>
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



          {/* Operations & Live Timeline Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Live Timeline */}
            <div className="lg:col-span-2 bg-white/80 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_rgba(24,35,74,0.04)] rounded-[3rem] overflow-hidden flex flex-col">
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
                  [...todayQueue].sort((a, b) => a.time.localeCompare(b.time)).map((item) => (
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


              {/* Special Care Alerts */}
              <div className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_rgba(24,35,74,0.04)] p-8 rounded-[3rem] space-y-6">
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
      </TabsContent>

      {/* Modals */}
      {isBookingOpen && <BookingModal onClose={() => setIsBookingOpen(false)} />}
      {isCustomerOpen && <CustomerModal onClose={() => setIsCustomerOpen(false)} />}

      <TabsContent value="crm" className="flex-1 overflow-y-auto px-6 lg:px-12 py-10 m-0 border-none outline-none data-[state=active]:flex flex-col bg-[#F9F9F9]">
        <CustomerDashboard hideTitle={true} />
      </TabsContent>

      <TabsContent value="inventory" className="flex-1 overflow-y-auto px-6 lg:px-12 py-10 m-0 border-none outline-none data-[state=active]:flex flex-col bg-[#F9F9F9]">
        <InventoryDashboard />
      </TabsContent>
    </Tabs>
  );
};

export default Dashboard;