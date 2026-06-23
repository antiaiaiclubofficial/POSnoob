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
import BookingModal from '@/components/BookingModal';
import CustomerModal from '@/components/CustomerModal';
import HotelBookingModal from '@/components/HotelBookingModal';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RoomConfig {
  id: number;
  name: string;
  color: 'gray' | 'blue' | 'pink' | 'green' | 'purple' | 'amber';
}

const COLOR_MAP = {
  gray: {
    bg: "bg-[#F5F6FA] border-transparent text-gray-500 hover:bg-gray-100",
    border: "border-gray-300",
    dot: "bg-gray-400",
    badge: "bg-gray-100 text-gray-600"
  },
  blue: {
    bg: "bg-blue-50 border-blue-100 text-blue-600 hover:bg-blue-100/70",
    border: "border-blue-400",
    dot: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700"
  },
  pink: {
    bg: "bg-pink-50 border-pink-100 text-pink-600 hover:bg-pink-100/70",
    border: "border-pink-400",
    dot: "bg-pink-500",
    badge: "bg-pink-100 text-pink-700"
  },
  green: {
    bg: "bg-green-50 border-green-100 text-green-600 hover:bg-green-100/70",
    border: "border-green-400",
    dot: "bg-green-500",
    badge: "bg-green-100 text-green-700"
  },
  purple: {
    bg: "bg-purple-50 border-purple-100 text-purple-600 hover:bg-purple-100/70",
    border: "border-purple-400",
    dot: "bg-purple-500",
    badge: "bg-purple-100 text-purple-700"
  },
  amber: {
    bg: "bg-amber-50 border-amber-100 text-amber-600 hover:bg-amber-100/70",
    border: "border-amber-400",
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-700"
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { queue, transactions, inventory, customers, currency, kennelCapacity, language, currentUser, storeId } = useStore();
  const t = translations[language];
  const today = format(new Date(), 'yyyy-MM-dd');

  // Modals State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  
  // Hotel Booking States
  const [isHotelBookingOpen, setIsHotelBookingOpen] = useState(false);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<{ name: string; index: number } | null>(null);
  const [selectedOccupiedRoom, setSelectedOccupiedRoom] = useState<any | null>(null);
  const [hotelBookings, setHotelBookings] = useState<any[]>([]);

  // Kennel Customization States
  const [isEditRoomsMode, setIsEditRoomsMode] = useState(false);
  const [editingRoomIndex, setEditingRoomIndex] = useState<number | null>(null);
  const [tempRoomName, setTempRoomName] = useState('');
  const [tempRoomColor, setTempRoomColor] = useState<RoomConfig['color']>('gray');
  const [roomsConfig, setRoomsConfig] = useState<RoomConfig[]>([]);

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

  // Load & Save Room Configurations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('kennel_rooms_config');
    if (saved) {
      try {
        setRoomsConfig(JSON.parse(saved));
      } catch (e) {
        initializeDefaultRooms();
      }
    } else {
      initializeDefaultRooms();
    }

    // Load Hotel Bookings
    const savedBookings = localStorage.getItem('hotel_bookings');
    if (savedBookings) {
      try {
        setHotelBookings(JSON.parse(savedBookings));
      } catch (e) {
        setHotelBookings([]);
      }
    }
  }, [kennelCapacity]);

  const initializeDefaultRooms = () => {
    const defaults = Array.from({ length: kennelCapacity }).map((_, idx) => ({
      id: idx,
      name: (idx + 1).toString().padStart(2, '0'),
      color: 'gray' as RoomConfig['color']
    }));
    setRoomsConfig(defaults);
    localStorage.setItem('kennel_rooms_config', JSON.stringify(defaults));
  };

  const handleSaveRoomEdit = () => {
    if (editingRoomIndex === null) return;
    if (!tempRoomName.trim()) {
      toast.error("กรุณาระบุชื่อห้องพัก");
      return;
    }

    const updated = [...roomsConfig];
    updated[editingRoomIndex] = {
      ...updated[editingRoomIndex],
      name: tempRoomName.trim(),
      color: tempRoomColor
    };

    setRoomsConfig(updated);
    localStorage.setItem('kennel_rooms_config', JSON.stringify(updated));
    setEditingRoomIndex(null);
    toast.success("บันทึกการตั้งค่าห้องพักเรียบร้อยแล้ว");
  };

  // เพิ่มจำนวนห้องพัก
  const handleIncreaseCapacity = () => {
    const newCapacity = kennelCapacity + 1;
    // อัปเดตค่าใน Zustand Store
    useStore.setState({ kennelCapacity: newCapacity });
    
    // อัปเดตค่าใน Local Config
    const updated = [...roomsConfig, {
      id: newCapacity - 1,
      name: newCapacity.toString().padStart(2, '0'),
      color: 'gray' as const
    }];
    setRoomsConfig(updated);
    localStorage.setItem('kennel_rooms_config', JSON.stringify(updated));
    toast.success(`เพิ่มห้องพักเป็น ${newCapacity} ห้องเรียบร้อยแล้ว`);
  };

  // ลดจำนวนห้องพัก
  const handleDecreaseCapacity = () => {
    if (kennelCapacity <= 1) {
      toast.error("ต้องมีห้องพักอย่างน้อย 1 ห้อง");
      return;
    }
    const newCapacity = kennelCapacity - 1;
    // อัปเดตค่าใน Zustand Store
    useStore.setState({ kennelCapacity: newCapacity });
    
    // อัปเดตค่าใน Local Config
    const updated = roomsConfig.slice(0, newCapacity);
    setRoomsConfig(updated);
    localStorage.setItem('kennel_rooms_config', JSON.stringify(updated));
    toast.success(`ลดห้องพักเหลือ ${newCapacity} ห้องเรียบร้อยแล้ว`);
  };

  // บันทึกการจองโรงแรมสัตว์เลี้ยง
  const handleSaveHotelBooking = (bookingData: any) => {
    const updatedBookings = [...hotelBookings, bookingData];
    setHotelBookings(updatedBookings);
    localStorage.setItem('hotel_bookings', JSON.stringify(updatedBookings));
    setIsHotelBookingOpen(false);
    setSelectedRoomForBooking(null);
    toast.success(`จองห้องพัก ${bookingData.roomName} ให้กับ ${bookingData.petName} เรียบร้อยแล้ว!`);
  };

  // เช็คเอาท์ / คืนห้องพักโรงแรมสัตว์เลี้ยง
  const handleCheckOutRoom = (roomIndex: number) => {
    if (!window.confirm("คุณต้องการทำรายการ Check-out และคืนห้องพักนี้ใช่หรือไม่?")) return;
    
    const updatedBookings = hotelBookings.filter(b => b.roomIndex !== roomIndex);
    setHotelBookings(updatedBookings);
    localStorage.setItem('hotel_bookings', JSON.stringify(updatedBookings));
    setSelectedOccupiedRoom(null);
    toast.success("ทำรายการ Check-out และคืนห้องพักเรียบร้อยแล้ว");
  };

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
  const hotelRooms = useMemo(() => {
    if (roomsConfig.length === 0) return [];
    return roomsConfig.map((room, idx) => {
      // ค้นหาข้อมูลการจองโรงแรมสัตว์เลี้ยงที่ตรงกับห้องนี้
      const occupiedBy = hotelBookings.find(b => b.roomIndex === idx) || null;
      return {
        ...room,
        occupiedBy
      };
    });
  }, [roomsConfig, hotelBookings]);

  const occupiedKennels = hotelBookings.length;

  const handleRoomClick = (room: any, idx: number) => {
    if (isEditRoomsMode) {
      setEditingRoomIndex(idx);
      setTempRoomName(room.name);
      setTempRoomColor(room.color);
      return;
    }

    if (room.occupiedBy) {
      setSelectedOccupiedRoom(room.occupiedBy);
    } else {
      setSelectedRoomForBooking({ name: room.name, index: idx });
      setIsHotelBookingOpen(true);
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
          {/* Clock In / Out Button */}
          {currentUser?.role !== 'superadmin' && (
            <button 
              onClick={() => clockMutation.mutate()}
              disabled={clockMutation.isPending}
              className={cn(
                "flex-1 md:flex-none px-5 py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black text-xs shadow-lg active:scale-95 transition-all",
                isClockedIn 
                  ? "bg-red-500 text-white shadow-red-500/10 hover:bg-red-600" 
                  : "bg-emerald-500 text-white shadow-emerald-500/10 hover:bg-emerald-600"
              )}
            >
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
                        <span className={cn(
                          "text-[8px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider",
                          getTierColorClass(customer.membership)
                        )}>
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
                        <span className={cn(
                          "text-[8px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider",
                          getTierColorClass(customer.membership)
                        )}>
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-gray-400">{occupiedKennels}/{kennelCapacity}</span>
                    <button 
                      onClick={() => setIsEditRoomsMode(!isEditRoomsMode)}
                      className={cn(
                        "p-2 rounded-xl transition-all border",
                        isEditRoomsMode 
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md" 
                          : "bg-white border-gray-100 text-gray-400 hover:bg-gray-50"
                      )}
                      title="ตั้งค่าห้องพัก"
                    >
                      <SettingsIcon size={14} className={cn(isEditRoomsMode && "animate-spin")} />
                    </button>
                  </div>
                </div>

                {isEditRoomsMode && (
                  <div className="mb-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-3 animate-in slide-in-from-top-2">
                    <p className="text-[10px] font-bold text-indigo-700 leading-relaxed">
                      💡 โหมดตั้งค่าเปิดอยู่: คลิกที่ห้องพักเพื่อแก้ไขชื่อห้องและเปลี่ยนสีประจำห้อง
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-indigo-100/50">
                      <span className="text-[10px] font-black uppercase text-indigo-900">ปรับจำนวนห้องพัก:</span>
                      <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl shadow-sm">
                        <button 
                          type="button" 
                          onClick={handleDecreaseCapacity}
                          className="w-6 h-6 rounded-lg bg-gray-50 hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-gray-400 transition-colors"
                        >
                          <Minus size={12} strokeWidth={3} />
                        </button>
                        <span className="text-xs font-black text-[#1A1F3D] w-6 text-center">{kennelCapacity}</span>
                        <button 
                          type="button" 
                          onClick={handleIncreaseCapacity}
                          className="w-6 h-6 rounded-lg bg-gray-50 hover:bg-green-50 hover:text-green-500 flex items-center justify-center text-gray-400 transition-colors"
                        >
                          <Plus size={12} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-2.5">
                  {hotelRooms.map((room, idx) => {
                    const colorConfig = COLOR_MAP[room.color || 'gray'];
                    return (
                      <button
                        key={room.id ?? idx}
                        onClick={() => handleRoomClick(room, idx)}
                        className={cn(
                          "aspect-square rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-[10px] font-black relative overflow-hidden",
                          isEditRoomsMode && "animate-pulse border-dashed border-indigo-400",
                          room.occupiedBy 
                            ? "bg-[#1A1F3D] text-[#D9ED5F] shadow-sm shadow-[#1A1F3D]/10" 
                            : colorConfig.bg
                        )}
                        style={{
                          borderColor: room.occupiedBy ? COLOR_MAP[room.color || 'gray'].dot.replace('bg-', '') : undefined
                        }}
                        title={room.occupiedBy ? `${room.occupiedBy.petName} (${room.occupiedBy.ownerName})` : `Room ${room.name} (Available)`}
                      >
                        <span>{room.name}</span>
                        {room.occupiedBy && (
                          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mt-4 text-center">
                  {isEditRoomsMode ? "* คลิกห้องเพื่อแก้ไขชื่อและสี" : "* คลิกที่ห้องเพื่อจองคิว หรือดูสถานะ"}
                </p>
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
      
      {/* Dedicated Hotel Booking Modal */}
      {isHotelBookingOpen && selectedRoomForBooking && (
        <HotelBookingModal 
          roomName={selectedRoomForBooking.name}
          roomIndex={selectedRoomForBooking.index}
          onClose={() => {
            setIsHotelBookingOpen(false);
            setSelectedRoomForBooking(null);
          }}
          onSave={handleSaveHotelBooking}
        />
      )}

      {/* Occupied Room Details Modal */}
      {selectedOccupiedRoom && (
        <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#1A1F3D] rounded-2xl flex items-center justify-center text-[#D9ED5F]">
                  <Home size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#1A1F3D]">รายละเอียดการเข้าพัก</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ห้องพักหมายเลข: {selectedOccupiedRoom.roomName}</p>
                </div>
              </div>
              <button onClick={() => setSelectedOccupiedRoom(null)} className="p-2 hover:bg-white rounded-xl transition-all">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Pet Info */}
              <div className="flex items-center gap-4 bg-[#F5F6FA] p-4 rounded-2xl">
                <img src={selectedOccupiedRoom.petImage} className="w-16 h-16 rounded-xl object-cover shadow-sm" alt={selectedOccupiedRoom.petName} />
                <div>
                  <h4 className="text-base font-black text-[#1A1F3D]">{selectedOccupiedRoom.petName}</h4>
                  <p className="text-xs text-gray-400 font-bold uppercase">{selectedOccupiedRoom.petSpecies} • {selectedOccupiedRoom.petBreed}</p>
                </div>
              </div>

              {/* Owner Info */}
              <div className="space-y-1">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">เจ้าของสัตว์เลี้ยง (Owner)</span>
                <p className="text-sm font-bold text-[#1A1F3D]">{selectedOccupiedRoom.customerName}</p>
                <p className="text-xs text-gray-400 font-medium">เบอร์โทร: {selectedOccupiedRoom.customerPhone}</p>
              </div>

              {/* Stay Dates */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                <div>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Check-in</span>
                  <p className="text-xs font-bold text-[#1A1F3D] mt-1">{selectedOccupiedRoom.checkInDate}</p>
                  <p className="text-[10px] text-gray-400 font-medium">เวลา {selectedOccupiedRoom.checkInTime} น.</p>
                </div>
                <div>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Check-out</span>
                  <p className="text-xs font-bold text-[#1A1F3D] mt-1">{selectedOccupiedRoom.checkOutDate}</p>
                  <p className="text-[10px] text-gray-400 font-medium">เวลา {selectedOccupiedRoom.checkOutTime} น.</p>
                </div>
              </div>

              {/* Stay Duration */}
              <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl flex justify-between items-center">
                <span className="text-xs font-black text-indigo-600 uppercase">ระยะเวลาเข้าพัก</span>
                <span className="text-sm font-black text-[#1A1F3D]">{selectedOccupiedRoom.stayDays} คืน</span>
              </div>

              {/* Check-out Button */}
              <button 
                onClick={() => handleCheckOutRoom(selectedOccupiedRoom.roomIndex)}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-black py-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-500/10 active:scale-95 transition-all"
              >
                <LogOut size={16} /> Check-out / คืนห้องพัก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Room Customization Modal */}
      {editingRoomIndex !== null && (
        <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#1A1F3D] rounded-2xl flex items-center justify-center text-white">
                  <SettingsIcon size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#1A1F3D]">ตั้งค่าห้องพัก</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Room Customization</p>
                </div>
              </div>
              <button onClick={() => setEditingRoomIndex(null)} className="p-2 hover:bg-white rounded-xl transition-all">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">ชื่อห้องพัก (Room Name)</label>
                <input 
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all"
                  value={tempRoomName}
                  onChange={e => setTempRoomName(e.target.value)}
                  placeholder="เช่น 01, VIP 1, Suite"
                  maxLength={10}
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">สีประจำห้อง (Room Color)</label>
                <div className="grid grid-cols-6 gap-2 bg-[#F5F6FA] p-2 rounded-2xl">
                  {(Object.keys(COLOR_MAP) as RoomConfig['color'][]).map((colorKey) => {
                    const config = COLOR_MAP[colorKey];
                    return (
                      <button
                        key={colorKey}
                        type="button"
                        onClick={() => setTempRoomColor(colorKey)}
                        className={cn(
                          "aspect-square rounded-xl flex items-center justify-center transition-all border-2",
                          config.bg,
                          tempRoomColor === colorKey ? "border-indigo-600 scale-110 shadow-sm" : "border-transparent"
                        )}
                        title={colorKey}
                      >
                        <div className={cn("w-3 h-3 rounded-full", config.dot)} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setEditingRoomIndex(null)}
                  className="flex-1 py-4 rounded-2xl text-xs font-black text-gray-400 hover:bg-gray-50 transition-all"
                >
                  ยกเลิก
                </button>
                <button 
                  onClick={handleSaveRoomEdit}
                  className="flex-[2] bg-[#1A1F3D] text-white font-black py-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#1A1F3D]/10 active:scale-95 transition-all"
                >
                  <Check size={16} /> บันทึก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;