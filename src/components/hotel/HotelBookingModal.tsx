import React, { useState, useMemo, useEffect } from 'react';
import { X, Calendar as CalendarIcon, User, ArrowRight, Home, Trash2, Clock, Plus } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, differenceInDays, parseISO, isToday, eachDayOfInterval, startOfDay } from 'date-fns';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface HotelBookingModalProps {
  roomId: string;
  roomName: string;
  existingBooking?: any;
  onClose: () => void;
}

type ActivityType = 'feeding' | 'walk' | 'medication' | 'grooming' | 'playtime' | 'cleaning' | 'custom';
interface RoutineItem {
  id: string;
  time: string;
  type: ActivityType;
  note: string;
}

const getActivityTypeName = (type: string) => {
  switch (type) {
    case 'feeding': return 'ให้อาหาร';
    case 'walk': return 'พาเดินเล่น';
    case 'medication': return 'ป้อนยา';
    case 'grooming': return 'อาบน้ำ/ตัดขน';
    case 'playtime': return 'เวลาเล่น';
    case 'cleaning': return 'ทำความสะอาด';
    default: return 'อื่นๆ';
  }
};

const HotelBookingModal = ({ roomId, roomName, existingBooking, onClose }: HotelBookingModalProps) => {
  const { customers, storeId, currentUser } = useStore();
  const queryClient = useQueryClient();
  
  const isEdit = !!existingBooking;

  const [activeTab, setActiveTab] = useState<'details' | 'routine'>('details');

  // Search & Selection States
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [selectedPetId, setSelectedPetId] = useState('');

  // Stay Details States
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(Date.now() + 86400000)
  });
  const [checkInTime, setCheckInTime] = useState('12:00');
  const [checkOutTime, setCheckOutTime] = useState('12:00');
  
  const [depositAmount, setDepositAmount] = useState(0);
  const [specialRequests, setSpecialRequests] = useState('');

  // Routine States
  const [dailyRoutines, setDailyRoutines] = useState<RoutineItem[]>([]);
  const [newRoutineTime, setNewRoutineTime] = useState('08:00');
  const [newRoutineType, setNewRoutineType] = useState<ActivityType>('feeding');
  const [newRoutineNote, setNewRoutineNote] = useState('');

  // Initialize from existing booking
  useEffect(() => {
    if (existingBooking) {
      setSelectedOwnerId(existingBooking.customer_id);
      setSelectedPetId(existingBooking.pet_id);
      setDepositAmount(existingBooking.deposit_amount || 0);
      setSpecialRequests(existingBooking.special_requests || '');

      if (existingBooking.check_in_date && existingBooking.check_out_expected) {
        const ci = existingBooking.check_in_date.split('T');
        const co = existingBooking.check_out_expected.split('T');
        
        setDateRange({
          from: parseISO(ci[0]),
          to: parseISO(co[0])
        });
        
        if (ci[1]) setCheckInTime(ci[1].substring(0, 5));
        if (co[1]) setCheckOutTime(co[1].substring(0, 5));
      }
    }
  }, [existingBooking]);

  // Fetch existing activities if editing
  const { data: existingActivities = [], refetch: refetchActivities } = useQuery({
    queryKey: ['hotel_activities_booking', existingBooking?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hotel_activities')
        .select('*')
        .eq('booking_id', existingBooking.id)
        .order('scheduled_time', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!existingBooking?.id,
  });

  const deleteActivity = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hotel_activities').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchActivities();
      queryClient.invalidateQueries({ queryKey: ['hotel_activities_today'] });
      toast.success('ลบกิจกรรมสำเร็จ');
    }
  });

  // Derived Data
  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return [];
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.phone.includes(searchQuery)
    );
  }, [customers, searchQuery]);

  const selectedOwner = customers.find(c => c.id === selectedOwnerId);
  const selectedPet = selectedOwner?.pets.find(p => p.id === selectedPetId);

  // Auto-calculate stay days
  const stayDays = useMemo(() => {
    try {
      if (!dateRange?.from || !dateRange?.to) return 1;
      const diff = differenceInDays(dateRange.to, dateRange.from);
      return diff > 0 ? diff : 1;
    } catch (e) {
      return 1;
    }
  }, [dateRange]);

  const handleSelectOwner = (id: string, name: string) => {
    setSelectedOwnerId(id);
    setSearchQuery(name);
    setIsSearching(false);
    setSelectedPetId('');
  };

  const handleAddRoutine = () => {
    if (!newRoutineTime) return;
    setDailyRoutines(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      time: newRoutineTime,
      type: newRoutineType,
      note: newRoutineNote
    }]);
    setNewRoutineNote('');
  };

  const handleRemoveRoutine = (id: string) => {
    setDailyRoutines(prev => prev.filter(r => r.id !== id));
  };

  const createOrUpdateBooking = useMutation({
    mutationFn: async () => {
      const checkInStr = format(dateRange!.from!, 'yyyy-MM-dd');
      const checkOutStr = format(dateRange!.to!, 'yyyy-MM-dd');
      
      const bookingData = {
        store_id: storeId,
        room_id: roomId,
        customer_id: selectedOwner?.id,
        pet_id: selectedPet?.id,
        check_in_date: `${checkInStr}T${checkInTime}:00`,
        check_out_expected: `${checkOutStr}T${checkOutTime}:00`,
        deposit_amount: depositAmount,
        special_requests: specialRequests,
      };

      let bookingId = existingBooking?.id;

      if (isEdit) {
        const { error } = await supabase.from('hotel_bookings').update(bookingData).eq('id', bookingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('hotel_bookings').insert([{
          ...bookingData,
          status: 'reserved',
          created_by: currentUser?.id
        }]).select('id').single();
        if (error) throw error;
        bookingId = data.id;
      }

      // Generate daily routines
      if (dailyRoutines.length > 0 && bookingId) {
        const days = eachDayOfInterval({
          start: dateRange!.from!,
          end: dateRange!.to!
        });
        
        const activitiesToInsert: any[] = [];
        const todayStart = startOfDay(new Date());
        
        days.forEach(day => {
          const dayStart = startOfDay(day);
          // Don't insert activities for past days
          if (dayStart >= todayStart) {
            const dateStr = format(day, 'yyyy-MM-dd');
            dailyRoutines.forEach(routine => {
              activitiesToInsert.push({
                store_id: storeId,
                booking_id: bookingId,
                pet_id: selectedPet?.id,
                activity_type: routine.type,
                title: getActivityTypeName(routine.type),
                scheduled_time: `${dateStr}T${routine.time}:00`,
                status: 'pending',
                note: routine.note
              });
            });
          }
        });
        
        if (activitiesToInsert.length > 0) {
          const { error: actError } = await supabase.from('hotel_activities').insert(activitiesToInsert);
          if (actError) throw actError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotel_bookings_active'] });
      queryClient.invalidateQueries({ queryKey: ['hotel_rooms'] });
      queryClient.invalidateQueries({ queryKey: ['hotel_activities_today'] });
      toast.success(isEdit ? 'แก้ไขการจองสำเร็จ' : 'สร้างการจองสำเร็จ');
      onClose();
    },
    onError: (err) => {
      toast.error('เกิดข้อผิดพลาด: ' + err.message);
    }
  });

  const deleteBooking = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('hotel_bookings').delete().eq('id', existingBooking.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotel_bookings_active'] });
      queryClient.invalidateQueries({ queryKey: ['hotel_rooms'] });
      queryClient.invalidateQueries({ queryKey: ['hotel_activities_today'] });
      toast.success('ยกเลิกการจองสำเร็จ');
      onClose();
    },
    onError: (err) => {
      toast.error('เกิดข้อผิดพลาด: ' + err.message);
    }
  });

  const checkInBooking = useMutation({
    mutationFn: async () => {
      const { error: bookingError } = await supabase
        .from('hotel_bookings')
        .update({ status: 'checked_in' })
        .eq('id', existingBooking.id);
      if (bookingError) throw bookingError;

      const { error: roomError } = await supabase
        .from('hotel_rooms')
        .update({ status: 'occupied' })
        .eq('id', roomId);
      if (roomError) throw roomError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotel_bookings_active'] });
      queryClient.invalidateQueries({ queryKey: ['hotel_rooms'] });
      toast.success('เช็คอินสำเร็จ');
      onClose();
    },
    onError: (err) => {
      toast.error('เกิดข้อผิดพลาด: ' + err.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOwner || !selectedPet) {
      toast.error('กรุณาเลือกเจ้าของและสัตว์เลี้ยง');
      return;
    }
    if (!dateRange?.from || !dateRange?.to) {
      toast.error('กรุณาเลือกวันที่เช็คอินและเช็คเอาท์ให้ครบถ้วน');
      return;
    }
    createOrUpdateBooking.mutate();
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-3xl h-[85vh] max-h-[850px] rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
        {/* Header */}
        <div className="p-8 pb-4 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1A1F3D] rounded-2xl flex items-center justify-center text-[#D9ED5F] shadow-lg">
              <Home size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1A1F3D]">{isEdit ? 'แก้ไขการจองห้องพัก' : 'จองห้องพักโรงแรมสัตว์เลี้ยง'}</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ห้องพัก: {roomName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-8 border-b border-gray-100 gap-6 shrink-0 bg-white">
          <button 
            type="button"
            onClick={() => setActiveTab('details')}
            className={cn("py-4 text-sm font-bold border-b-[3px] transition-colors", activeTab === 'details' ? "border-[#1A1F3D] text-[#1A1F3D]" : "border-transparent text-gray-400 hover:text-gray-600")}
          >
            รายละเอียดการจอง
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('routine')}
            className={cn("py-4 text-sm font-bold border-b-[3px] transition-colors", activeTab === 'routine' ? "border-[#1A1F3D] text-[#1A1F3D]" : "border-transparent text-gray-400 hover:text-gray-600")}
          >
            กำหนดการและกิจกรรม
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide bg-gray-50/30">
          {activeTab === 'details' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* 1. Customer & Pet Selection */}
              <div className="space-y-6">
                <div className="relative">
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">ค้นหาเจ้าของสัตว์เลี้ยง (Customer)</label>
                  {!isEdit ? (
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                      <input 
                        type="text"
                        placeholder="พิมพ์ชื่อลูกค้า หรือเบอร์โทรศัพท์..."
                        className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-[#1A1F3D]/5"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setIsSearching(true);
                          if (selectedOwnerId) setSelectedOwnerId('');
                        }}
                        onFocus={() => setIsSearching(true)}
                      />
                    </div>
                  ) : (
                    <div className="w-full bg-[#F5F6FA] border-none rounded-2xl px-4 py-4 text-sm font-bold opacity-70">
                      {selectedOwner?.name} (ไม่สามารถเปลี่ยนเจ้าของได้)
                    </div>
                  )}

                  {isSearching && searchQuery.length > 0 && !isEdit && (
                    <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden max-h-48 overflow-y-auto">
                      {filteredCustomers.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectOwner(c.id, c.name)}
                          className="w-full px-5 py-3.5 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 flex justify-between items-center"
                        >
                          <div>
                            <p className="text-sm font-bold text-[#1A1F3D]">{c.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold">{c.phone}</p>
                          </div>
                          <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-black uppercase">{c.membership}</span>
                        </button>
                      ))}
                      {filteredCustomers.length === 0 && (
                        <div className="p-4 text-center text-xs text-gray-400 font-bold">ไม่พบข้อมูลลูกค้า</div>
                      )}
                    </div>
                  )}
                </div>

                {selectedOwner && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-3 block tracking-widest px-1">เลือกสัตว์เลี้ยงที่เข้าพัก (Select Pet)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedOwner.pets.map(pet => (
                        <button
                          key={pet.id}
                          type="button"
                          onClick={() => !isEdit && setSelectedPetId(pet.id)}
                          className={cn(
                            "flex flex-col items-center p-4 rounded-2xl border transition-all gap-2 text-center bg-white",
                            selectedPetId === pet.id 
                              ? "border-[#1A1F3D] shadow-[0_0_0_2px_#1A1F3D]" 
                              : "border-gray-100 hover:border-gray-300 text-gray-600",
                            isEdit && selectedPetId !== pet.id && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <img src={pet.image} className="w-12 h-12 rounded-xl object-cover shadow-sm" alt={pet.name} />
                          <div>
                            <span className={cn("text-xs font-black block", selectedPetId === pet.id ? "text-[#1A1F3D]" : "")}>{pet.name}</span>
                            <span className={cn("text-[8px] font-bold uppercase", selectedPetId === pet.id ? "text-[#1A1F3D]" : "text-gray-400")}>{pet.breed}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Stay Dates & Times */}
              <div className="space-y-6 pt-6 border-t border-gray-100">
                <div>
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1 block mb-3">เลือกวันเข้าพัก (Select Stay Dates)</span>
                  <div className="bg-white rounded-[2rem] p-6 flex justify-center border border-gray-100 shadow-sm w-full mx-auto">
                    <Calendar 
                      mode="range" 
                      selected={dateRange} 
                      onSelect={setDateRange} 
                      numberOfMonths={2} 
                      className="bg-transparent"
                      classNames={{
                        months: "flex flex-col md:flex-row space-y-4 md:space-x-6 md:space-y-0 relative justify-center",
                        month: "space-y-2",
                        caption: "flex justify-center pt-1 items-center mb-3",
                        caption_label: "text-base font-semibold text-[#020d35] font-['IBM_Plex_Sans_Thai']",
                        nav: "pointer-events-none",
                        nav_button: "h-7 w-7 bg-white rounded-full flex items-center justify-center text-[#18234a] shadow-sm hover:bg-[#dce1ff] transition-all border border-gray-100 pointer-events-auto",
                        nav_button_previous: "absolute left-0 top-0.5",
                        nav_button_next: "absolute right-0 top-0.5",
                        table: "w-full border-collapse space-y-1",
                        head_row: "grid grid-cols-7 w-full mb-1",
                        head_cell: "text-[#76767f] font-medium text-[10px] uppercase flex items-center justify-center h-8 w-full",
                        row: "grid grid-cols-7 w-full mt-1",
                        cell: "relative p-0 text-center text-xs h-8 w-full flex items-center justify-center focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-[#dce1ff] [&:has([aria-selected].day-range-end)]:rounded-r-full [&:has([aria-selected].day-range-start)]:rounded-l-full",
                        day: "h-8 w-8 p-0 flex items-center justify-center font-medium text-[12px] rounded-full hover:bg-[#bac4f5] text-[#1a1c1c] transition-all aria-selected:opacity-100 aria-selected:bg-[#020d35] aria-selected:text-white aria-selected:shadow-md",
                        day_range_start: "day-range-start",
                        day_range_end: "day-range-end",
                        day_selected: "bg-[#020d35] text-white",
                        day_today: "bg-[#e2e2e2] text-[#1a1c1c]",
                        day_outside: "text-[#c6c5cf] opacity-50",
                        day_disabled: "text-gray-300 opacity-50",
                        day_range_middle: "aria-selected:!bg-transparent aria-selected:!text-[#0d193f] aria-selected:!shadow-none",
                        day_hidden: "invisible",
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Check-in Time */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1 block">เวลาเช็คอิน (Check-in Time)</span>
                    <input 
                      type="time" 
                      className="w-full bg-white border border-gray-100 shadow-sm rounded-xl px-4 py-3 text-sm font-bold text-[#1A1F3D]"
                      value={checkInTime}
                      onChange={e => setCheckInTime(e.target.value)}
                    />
                  </div>

                  {/* Check-out Time */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1 block">เวลาเช็คเอาท์ (Check-out Time)</span>
                    <input 
                      type="time" 
                      className="w-full bg-white border border-gray-100 shadow-sm rounded-xl px-4 py-3 text-sm font-bold text-[#1A1F3D]"
                      value={checkOutTime}
                      onChange={e => setCheckOutTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 pt-6 border-t border-gray-100">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1 block">หมายเหตุ / ความต้องการพิเศษ</label>
                    <textarea 
                      className="w-full bg-white border border-gray-100 shadow-sm rounded-xl px-4 py-3 text-sm font-bold min-h-[80px]"
                      placeholder="เช่น ต้องป้อนยา..."
                      value={specialRequests}
                      onChange={e => setSpecialRequests(e.target.value)}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1 block">มัดจำล่วงหน้า (บาท)</label>
                    <input 
                      type="number"
                      className="w-full bg-white border border-gray-100 shadow-sm rounded-xl px-4 py-3 text-sm font-bold"
                      value={depositAmount}
                      onChange={e => setDepositAmount(Number(e.target.value))}
                    />
                 </div>
              </div>

              {/* 3. Stay Summary */}
              <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-[32px] flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Stay Duration</span>
                  <h4 className="text-xl font-black text-[#1A1F3D] mt-1">จำนวนเข้าพักทั้งหมด: {stayDays} คืน</h4>
                </div>
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                  <CalendarIcon size={20} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'routine' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Existing Activities if edit */}
              {isEdit && existingActivities.length > 0 && (
                <div className="space-y-3 mb-8">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <h4 className="text-sm font-black text-[#1A1F3D]">กิจกรรมที่กำหนดไว้แล้ว</h4>
                      <p className="text-[10px] text-gray-500 font-bold mt-1">กิจกรรมที่ถูกสร้างไว้สำหรับประวัติการเข้าพักนี้</p>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {existingActivities.map(act => (
                      <div key={act.id} className="flex justify-between items-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-indigo-100 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-[9px] font-black uppercase px-2 py-0.5 rounded-full",
                              act.status === 'done' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                            )}>
                              {act.status}
                            </span>
                            <p className="text-sm font-bold text-[#1A1F3D]">{format(parseISO(act.scheduled_time), 'dd MMM yyyy HH:mm')} - {act.title || getActivityTypeName(act.activity_type)}</p>
                          </div>
                          {act.note && <p className="text-xs text-gray-500 mt-1">{act.note}</p>}
                        </div>
                        <button type="button" onClick={() => deleteActivity.mutate(act.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-br from-indigo-50/50 to-white p-6 rounded-[2rem] border border-indigo-100 shadow-sm space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                    <Clock size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-[#1A1F3D]">เพิ่มกำหนดการประจำวัน</h4>
                    <p className="text-[10px] text-gray-500 font-bold mt-0.5">กำหนดการจะถูกสร้างในทุกวันที่เข้าพักอัตโนมัติ</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">เวลา (Time)</label>
                    <input type="time" value={newRoutineTime} onChange={e => setNewRoutineTime(e.target.value)} className="w-full bg-white border border-gray-100 shadow-sm rounded-xl px-4 py-3 text-xs font-bold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">ประเภท (Type)</label>
                    <select value={newRoutineType} onChange={e => setNewRoutineType(e.target.value as ActivityType)} className="w-full bg-white border border-gray-100 shadow-sm rounded-xl px-4 py-3 text-xs font-bold">
                        <option value="feeding">ให้อาหาร</option>
                        <option value="walk">พาเดินเล่น</option>
                        <option value="medication">ป้อนยา</option>
                        <option value="grooming">อาบน้ำ/ตัดขน</option>
                        <option value="playtime">เวลาเล่น</option>
                        <option value="cleaning">ทำความสะอาด</option>
                        <option value="custom">อื่นๆ</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">หมายเหตุ (Note)</label>
                    <div className="flex gap-2">
                        <input type="text" placeholder="เช่น อาหารเม็ด 100g" value={newRoutineNote} onChange={e => setNewRoutineNote(e.target.value)} className="w-full bg-white border border-gray-100 shadow-sm rounded-xl px-4 py-3 text-xs font-bold" />
                        <button type="button" onClick={handleAddRoutine} className="bg-[#1A1F3D] text-[#EAFD69] px-4 rounded-xl hover:bg-[#020d35] transition-colors flex items-center justify-center shrink-0 shadow-md hover:-translate-y-0.5">
                          <Plus size={18} strokeWidth={3} />
                        </button>
                    </div>
                  </div>
                </div>
              </div>

              {dailyRoutines.length > 0 && (
                <div className="space-y-3 mt-6">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">รายการกำหนดการที่จะถูกเพิ่ม</h4>
                  <div className="space-y-2">
                    {dailyRoutines.map(routine => (
                      <div key={routine.id} className="flex justify-between items-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-[#F5F6FA] rounded-xl flex items-center justify-center text-[#1A1F3D]">
                              <Clock size={16} />
                          </div>
                          <div>
                              <p className="text-sm font-bold text-[#1A1F3D]">{routine.time} - {getActivityTypeName(routine.type)}</p>
                              {routine.note && <p className="text-xs text-gray-500 mt-1">{routine.note}</p>}
                          </div>
                        </div>
                        <button type="button" onClick={() => handleRemoveRoutine(routine.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Action Buttons Footer */}
        <div className="p-8 pt-4 bg-white border-t border-gray-100 shrink-0">
          <div className="flex gap-4">
            {isEdit && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button 
                    type="button"
                    disabled={deleteBooking.isPending || checkInBooking.isPending}
                    className="bg-[#FBE8E8] text-[#8E171D] font-black px-6 rounded-[24px] flex items-center justify-center shadow-sm hover:bg-[#F3C2C2] active:scale-95 transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl p-8 max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-['IBM_Plex_Sans_Thai'] text-xl font-bold text-[#1A1F3D]">ยืนยันการยกเลิก/ลบการจองห้องพักนี้?</AlertDialogTitle>
                    <AlertDialogDescription className="font-['IBM_Plex_Sans_Thai'] text-sm text-gray-500 font-medium">
                      ข้อมูลจะไม่สามารถกู้คืนได้ และห้องพักจะกลับสู่สถานะว่าง
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-6">
                    <AlertDialogCancel className="rounded-2xl font-['IBM_Plex_Sans_Thai'] font-bold border-gray-200">ยกเลิก</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteBooking.mutate()} className="bg-[#8E171D] hover:bg-red-800 rounded-2xl font-['IBM_Plex_Sans_Thai'] font-bold text-white shadow-lg">ยืนยันการลบ</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {isEdit && existingBooking?.status === 'reserved' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button 
                    type="button"
                    disabled={checkInBooking.isPending}
                    className="bg-[#EAFD69] text-[#1A1F3D] font-black px-6 rounded-[24px] flex items-center justify-center shadow-sm hover:brightness-95 active:scale-95 transition-all whitespace-nowrap"
                  >
                    {checkInBooking.isPending ? 'รอสักครู่...' : 'เช็คอินเข้าห้อง'}
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl p-8 max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-['IBM_Plex_Sans_Thai'] text-xl font-bold text-[#1A1F3D]">ยืนยันการเช็คอินให้น้องเข้าห้องพัก?</AlertDialogTitle>
                    <AlertDialogDescription className="font-['IBM_Plex_Sans_Thai'] text-sm text-gray-500 font-medium">
                      สถานะห้องพักจะถูกเปลี่ยนเป็น "กำลังเข้าพัก" ทันที
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-6">
                    <AlertDialogCancel className="rounded-2xl font-['IBM_Plex_Sans_Thai'] font-bold border-gray-200">ยกเลิก</AlertDialogCancel>
                    <AlertDialogAction onClick={() => checkInBooking.mutate()} className="bg-[#1A1F3D] hover:bg-[#020d35] rounded-2xl font-['IBM_Plex_Sans_Thai'] font-bold text-white shadow-lg">ยืนยันเช็คอิน</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <button 
              type="button"
              onClick={handleSubmit}
              disabled={!selectedOwnerId || !selectedPetId || createOrUpdateBooking.isPending || checkInBooking.isPending}
              className="flex-1 bg-[#1A1F3D] text-white font-black py-5 rounded-[24px] flex items-center justify-center gap-3 shadow-xl shadow-[#1A1F3D]/10 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {createOrUpdateBooking.isPending ? 'กำลังบันทึก...' : <>{isEdit ? 'บันทึกการแก้ไข' : 'ยืนยันการจองห้องพัก'} <ArrowRight size={18} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelBookingModal;
