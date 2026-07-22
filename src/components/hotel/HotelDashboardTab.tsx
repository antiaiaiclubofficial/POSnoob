import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/store/useStore';
import { format, isToday, parseISO, startOfDay, isBefore } from 'date-fns';
import { BedDouble, CheckSquare, LogOut, CheckCircle2, Edit3, Activity } from 'lucide-react';
import { toast } from 'sonner';
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
import HotelBookingModal from './HotelBookingModal';
import HotelCheckoutModal from './HotelCheckoutModal';
import { COLOR_MAP } from './roomColorMap';
import { RoomTypeBadge } from './RoomTypeBadge';

const HotelDashboardTab = () => {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  const [editingBooking, setEditingBooking] = useState<any>(null);
  const [checkoutBookingId, setCheckoutBookingId] = useState<string | null>(null);

  // Fetch Rooms
  const { data: rooms = [] } = useQuery({
    queryKey: ['hotel_rooms', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hotel_rooms')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!storeId && storeId !== 'default-store',
  });

  // Fetch Bookings (Active/Today)
  const { data: bookings = [] } = useQuery({
    queryKey: ['hotel_bookings_active', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hotel_bookings')
        .select(`
          *,
          hotel_rooms (*, hotel_room_types (type_name, color)),
          customers (*),
          pets (*)
        `)
        .eq('store_id', storeId)
        .in('status', ['reserved', 'checked_in']);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!storeId && storeId !== 'default-store',
  });

  const checkInBooking = useMutation({
    mutationFn: async ({ bookingId, roomId }: { bookingId: string, roomId: string }) => {
      const { error: bookingError } = await supabase
        .from('hotel_bookings')
        .update({ status: 'checked_in' })
        .eq('id', bookingId);
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
      toast.success('เช็คอินเข้าห้องพักสำเร็จ');
    },
    onError: (err) => {
      toast.error('เกิดข้อผิดพลาด: ' + err.message);
    }
  });

  // Fetch Activities for today
  const { data: activities = [] } = useQuery({
    queryKey: ['hotel_activities_today', storeId],
    queryFn: async () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();
      
      const { data, error } = await supabase
        .from('hotel_activities')
        .select(`
          *,
          hotel_bookings (
            pets (name),
            hotel_rooms (room_name, hotel_room_types (type_name, color))
          )
        `)
        .eq('store_id', storeId)
        .lte('scheduled_time', end)
        .or(`scheduled_time.gte.${start},status.neq.done`)
        .order('scheduled_time', { ascending: true });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!storeId && storeId !== 'default-store',
  });

  const toggleActivity = useMutation({
    mutationFn: async ({ activityId, currentStatus }: { activityId: string, currentStatus: string }) => {
      const newStatus = currentStatus === 'done' ? 'pending' : 'done';
      const completedAt = newStatus === 'done' ? new Date().toISOString() : null;
      
      const { error } = await supabase
        .from('hotel_activities')
        .update({ status: newStatus, completed_at: completedAt })
        .eq('id', activityId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotel_activities_today'] });
    }
  });

  const groupedActivities = React.useMemo(() => {
    const groups: Record<string, { bookingId: string, booking: any, activities: any[] }> = {};
    activities.forEach(activity => {
      const key = activity.booking_id || 'unassigned';
      if (!groups[key]) {
        groups[key] = {
          bookingId: key,
          booking: activity.hotel_bookings,
          activities: []
        };
      }
      groups[key].activities.push(activity);
    });
    return Object.values(groups);
  }, [activities]);


  // Derived Data
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const todayCheckIns = bookings.filter(b =>
    isToday(parseISO(b.check_in_date)) && b.status === 'reserved'
  );

  const todayCheckOuts = bookings.filter(b =>
    isToday(parseISO(b.check_out_expected)) && b.status === 'checked_in'
  );

  const stayingBookings = bookings.filter(b => b.status === 'checked_in');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[1rem]">
        <div className="p-[1.5rem] bg-gradient-to-br from-[#18234a]/90 to-[#020d35]/70 backdrop-blur-xl border border-white/20 rounded-[1.5rem] flex items-center gap-[1rem] transition-transform hover:-translate-y-1 shadow-[0_8px_24px_rgba(24,35,74,0.15)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#EAFD69]/10 rounded-full blur-2xl -translate-y-10 translate-x-10 pointer-events-none"></div>
          <div className="w-[3rem] h-[3rem] bg-[#ffffff]/10 text-[#EAFD69] rounded-[1rem] flex items-center justify-center backdrop-blur-md relative z-10">
            <BedDouble size={22} />
          </div>
          <div className="relative z-10">
            <p className="text-[13px] font-bold text-[#bac4f5]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>อัตราการเข้าพัก (Occupancy)</p>
            <p className="text-[28px] font-black text-[#ffffff] mt-0.5 leading-none" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>{occupancyRate}% <span className="text-[13px] font-medium text-[#bac4f5]">({occupiedRooms}/{totalRooms})</span></p>
          </div>
        </div>

        <div className="p-[1.5rem] bg-gradient-to-br from-[#EAFD69]/90 to-[#EAFD69]/50 backdrop-blur-xl border border-white/50 rounded-[1.5rem] flex items-center gap-[1rem] transition-transform hover:-translate-y-1 shadow-[0_8px_24px_rgba(234,253,105,0.2)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/60 rounded-full blur-2xl -translate-y-10 translate-x-10 pointer-events-none"></div>
          <div className="w-[3rem] h-[3rem] bg-[#1a1e00]/5 text-[#1a1e00] rounded-[1rem] flex items-center justify-center relative z-10">
            <CheckSquare size={22} />
          </div>
          <div className="relative z-10">
            <p className="text-[13px] font-bold text-[#434b00]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>รอเช็คอินวันนี้</p>
            <p className="text-[28px] font-black text-[#1a1e00] mt-0.5 leading-none" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>{todayCheckIns.length} <span className="text-[13px] font-medium text-[#434b00]">ห้อง</span></p>
          </div>
        </div>

        <div className="p-[1.5rem] bg-gradient-to-br from-[#d9d6fe]/90 to-[#d9d6fe]/50 backdrop-blur-xl border border-white/50 rounded-[1.5rem] flex items-center gap-[1rem] transition-transform hover:-translate-y-1 shadow-[0_8px_24px_rgba(217,214,254,0.3)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/60 rounded-full blur-2xl -translate-y-10 translate-x-10 pointer-events-none"></div>
          <div className="w-[3rem] h-[3rem] bg-[#5d5c7e]/10 text-[#191836] rounded-[1rem] flex items-center justify-center relative z-10">
            <LogOut size={22} />
          </div>
          <div className="relative z-10">
            <p className="text-[13px] font-bold text-[#5d5c7e]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>รอเช็คเอาท์วันนี้</p>
            <p className="text-[28px] font-black text-[#191836] mt-0.5 leading-none" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>{todayCheckOuts.length} <span className="text-[13px] font-medium text-[#5d5c7e]">ห้อง</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Currently Staying */}
        <div className="relative overflow-hidden bg-white/40 backdrop-blur-2xl rounded-[2rem] p-[2rem] shadow-[0_8px_32px_rgba(24,35,74,0.04)] flex flex-col">
          {/* Fluid Mesh Gradient */}
          <div className="absolute -bottom-[30%] -right-[10%] w-[120%] h-[100%] bg-gradient-to-tl from-[#848FBC]/60 to-[#848FBC]/20 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] bg-[#848FBC]/30 rounded-full blur-[70px] pointer-events-none"></div>

          <h3 className="relative z-10 text-[20px] font-bold text-[#020d35] mb-[1rem]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>กำลังเข้าพัก ({stayingBookings.length})</h3>
          {stayingBookings.length === 0 ? (
            <p className="relative z-10 text-[14px] text-[#76767f] text-center py-[2rem]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>ไม่มีสัตว์เลี้ยงเข้าพักในขณะนี้</p>
          ) : (
            <div className="relative z-10 space-y-[1rem]">
              {stayingBookings.map(booking => {
                const isOverdue = booking.check_out_expected ? isBefore(startOfDay(parseISO(booking.check_out_expected)), startOfDay(new Date())) : false;
                return (
                <div key={booking.id} className="flex flex-col gap-[0.5rem] p-[1.5rem] rounded-[1.5rem] bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-xl border border-white/60 text-[#020d35] shadow-[0_8px_16px_rgba(0,0,0,0.03)] relative group">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[16px] font-bold text-[#020d35]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>{booking.pets?.name}</p>
                      <p className="text-[14px] text-[#45464e] mt-1" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>เจ้าของ: {booking.customers?.display_name || booking.customers?.first_name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] text-[#45464e]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                          ห้อง: {booking.hotel_rooms?.room_name}
                        </p>
                        <RoomTypeBadge type={booking.hotel_rooms?.hotel_room_types} className="text-[11px]" />
                      </div>
                      {booking.special_requests && (
                        <p className="text-[12px] text-[#45464e] mt-2" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                          <span className="font-bold text-[#1A1F3D]">หมายเหตุ:</span> {booking.special_requests}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <span className={`text-[12px] font-bold px-[1rem] py-[0.5rem] rounded-[9999px] uppercase tracking-wider backdrop-blur-md ${isOverdue ? 'bg-red-500/10 text-red-600' : 'bg-[#020d35]/10 text-[#020d35]'}`}>
                        {isOverdue ? 'เกินกำหนด' : 'เข้าพักอยู่'}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingBooking(booking)}
                          className="opacity-0 group-hover:opacity-100 p-2 bg-white/50 hover:bg-[#1A1F3D] hover:text-[#EAFD69] text-gray-600 rounded-full transition-all"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => setCheckoutBookingId(booking.id)}
                          className="opacity-0 group-hover:opacity-100 text-[12px] font-bold bg-[#d9d6fe] hover:brightness-95 text-[#191836] px-[1rem] py-[0.5rem] rounded-[9999px] uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                        >
                          เช็คเอาท์
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>

        {/* Check-ins Today */}
        <div className="relative overflow-hidden bg-white/40 backdrop-blur-2xl rounded-[2rem] p-[2rem] shadow-[0_8px_32px_rgba(24,35,74,0.04)] flex flex-col">
          {/* Fluid Mesh Gradient */}
          <div className="absolute -bottom-[30%] -right-[10%] w-[120%] h-[100%] bg-gradient-to-tl from-[#EAFD69]/70 to-[#EAFD69]/20 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] bg-[#EAFD69]/30 rounded-full blur-[70px] pointer-events-none"></div>

          <h3 className="relative z-10 text-[20px] font-bold text-[#020d35] mb-[1rem]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>รอเช็คอินวันนี้</h3>
          {todayCheckIns.length === 0 ? (
            <p className="relative z-10 text-[14px] text-[#76767f] text-center py-[2rem]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>ไม่มีการเช็คอินวันนี้</p>
          ) : (
            <div className="relative z-10 space-y-[1rem]">
              {todayCheckIns.map(booking => (
                <div key={booking.id} className="flex flex-col gap-[0.5rem] p-[1.5rem] rounded-[1.5rem] bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-xl border border-white/60 shadow-[0_8px_16px_rgba(0,0,0,0.03)] relative group">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[16px] font-bold text-[#020d35]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>{booking.pets?.name}</p>
                      <p className="text-[14px] text-[#45464e] mt-1" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>เจ้าของ: {booking.customers?.display_name || booking.customers?.first_name}</p>
                      <p className="text-[14px] text-[#45464e]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>ห้อง: {booking.hotel_rooms?.room_name}</p>
                      {booking.special_requests && (
                        <p className="text-[12px] text-[#45464e] mt-2" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                          <span className="font-bold text-[#1A1F3D]">หมายเหตุ:</span> {booking.special_requests}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => setEditingBooking(booking)}
                        className="opacity-0 group-hover:opacity-100 p-2 bg-white/50 hover:bg-[#1A1F3D] hover:text-[#EAFD69] text-gray-600 rounded-full transition-all"
                      >
                        <Edit3 size={16} />
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            disabled={checkInBooking.isPending}
                            className="text-[12px] font-bold bg-[#EAFD69] hover:brightness-95 text-[#1a1e00] px-[1rem] py-[0.5rem] rounded-[9999px] uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                          >
                            {checkInBooking.isPending ? 'รอสักครู่...' : 'เช็คอิน'}
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
                            <AlertDialogAction onClick={() => checkInBooking.mutate({ bookingId: booking.id, roomId: booking.room_id })} className="bg-[#1A1F3D] hover:bg-[#020d35] rounded-2xl font-['IBM_Plex_Sans_Thai'] font-bold text-white shadow-lg">ยืนยันเช็คอิน</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Check-outs Today */}
        <div className="relative overflow-hidden bg-white/40 backdrop-blur-2xl rounded-[2rem] p-[2rem] shadow-[0_8px_32px_rgba(24,35,74,0.04)] flex flex-col">
          {/* Fluid Mesh Gradient */}
          <div className="absolute -bottom-[30%] -right-[10%] w-[120%] h-[100%] bg-gradient-to-tl from-[#d9d6fe]/90 to-[#d9d6fe]/40 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] bg-[#d9d6fe]/50 rounded-full blur-[70px] pointer-events-none"></div>

          <h3 className="relative z-10 text-[20px] font-bold text-[#020d35] mb-[1rem]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>รอเช็คเอาท์วันนี้</h3>
          {todayCheckOuts.length === 0 ? (
            <p className="relative z-10 text-[14px] text-[#76767f] text-center py-[2rem]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>ไม่มีการเช็คเอาท์วันนี้</p>
          ) : (
            <div className="relative z-10 space-y-[1rem]">
              {todayCheckOuts.map(booking => (
                <div key={booking.id} className="flex flex-col gap-[0.5rem] p-[1.5rem] rounded-[1.5rem] bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-xl border border-white/60 shadow-[0_8px_16px_rgba(0,0,0,0.03)] relative group">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[16px] font-bold text-[#020d35]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>{booking.pets?.name}</p>
                      <p className="text-[14px] text-[#45464e] mt-1" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>เจ้าของ: {booking.customers?.display_name || booking.customers?.first_name}</p>
                      <p className="text-[14px] text-[#45464e]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>ห้อง: {booking.hotel_rooms?.room_name}</p>
                      {booking.special_requests && (
                        <p className="text-[12px] text-[#45464e] mt-2" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                          <span className="font-bold text-[#1A1F3D]">หมายเหตุ:</span> {booking.special_requests}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => setEditingBooking(booking)}
                        className="opacity-0 group-hover:opacity-100 p-2 bg-white/50 hover:bg-[#1A1F3D] hover:text-[#EAFD69] text-gray-600 rounded-full transition-all"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => setCheckoutBookingId(booking.id)}
                        className="text-[12px] font-bold bg-[#d9d6fe] hover:brightness-95 text-[#191836] px-[1rem] py-[0.5rem] rounded-[9999px] uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                      >
                        เช็คเอาท์
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pet Activities */}
      <div className="relative overflow-hidden bg-[#F2F7FF] backdrop-blur-2xl rounded-[2rem] p-[2rem] shadow-[0_8px_32px_rgba(24,35,74,0.04)] flex flex-col mt-6 border border-blue-100/50">
          <div className="absolute -bottom-[30%] -right-[10%] w-[120%] h-[100%] bg-gradient-to-tl from-blue-200/30 to-transparent rounded-full blur-[80px] pointer-events-none"></div>
          <div className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] bg-blue-200/20 rounded-full blur-[70px] pointer-events-none"></div>

          <div className="relative z-10 flex items-center gap-3 mb-[1rem]">
            <h3 className="text-[20px] font-bold text-[#020d35]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>กิจกรรมวันนี้</h3>
            <span className="bg-[#1A1F3D] text-[#EAFD69] px-3 py-1 rounded-full text-xs font-bold">{activities.length}</span>
          </div>
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
            {groupedActivities.length === 0 ? (
              <p className="text-[14px] text-[#76767f] text-center py-[2rem]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>ไม่มีกิจกรรมสำหรับวันนี้</p>
            ) : (
              groupedActivities.map(group => (
                <div key={group.bookingId} className="flex flex-col gap-[0.5rem] p-[1.5rem] rounded-[1.5rem] bg-white/70 backdrop-blur-xl border border-white shadow-sm relative group h-fit">
                  <div className="mb-2 pb-2 border-b border-gray-200">
                    <p className="text-[16px] font-bold text-[#020d35]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                      {group.booking?.pets?.name || 'ไม่ระบุชื่อสัตว์เลี้ยง'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[13px] text-[#76767f] font-medium" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                        ห้อง: {group.booking?.hotel_rooms?.room_name || '-'}
                      </p>
                      <RoomTypeBadge type={group.booking?.hotel_rooms?.hotel_room_types} className="text-[10px]" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    {group.activities.map(activity => {
                      const activityTime = parseISO(activity.scheduled_time);
                      const isOverdue = activity.status !== 'done' && activityTime < new Date();
                      const isPastDay = isOverdue && activityTime < startOfDay(new Date());
                      
                      return (
                      <div key={activity.id} className="flex items-center justify-between group/act">
                        <div className="flex items-center gap-[1rem]">
                          <button
                            onClick={() => toggleActivity.mutate({ activityId: activity.id, currentStatus: activity.status })}
                            className={`w-[2rem] h-[2rem] rounded-full flex items-center justify-center shrink-0 transition-colors ${
                              activity.status === 'done' 
                                ? 'bg-[#EAFD69] text-[#1A1F3D]' 
                                : isOverdue 
                                  ? 'bg-red-100 text-red-500 hover:bg-red-200' 
                                  : 'bg-[#e2e2e2] text-transparent hover:bg-[#EAFD69] hover:text-[#1A1F3D]'
                            }`}
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <div>
                            <p className={`text-[14px] font-bold ${activity.status === 'done' ? 'text-gray-400 line-through' : isOverdue ? 'text-red-600' : 'text-[#020d35]'}`} style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                              {activity.title || activity.activity_type}{activity.note && ` - ${activity.note}`}
                            </p>
                            <p className={`text-[12px] ${isOverdue ? 'text-red-500 font-medium' : 'text-[#76767f]'}`} style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                              {format(activityTime, 'HH:mm')}
                              {isPastDay && ' (ค้างจากวันก่อน)'}
                            </p>
                          </div>
                        </div>
                        {activity.status === 'done' && (
                          <span className="text-[10px] font-bold bg-[#EAFD69] text-[#1a1e00] px-[0.75rem] py-[0.25rem] rounded-[9999px] uppercase tracking-wider">เสร็จแล้ว</span>
                        )}
                      </div>
                    )})}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      {editingBooking && (
        <HotelBookingModal
          roomId={editingBooking.room_id}
          roomName={editingBooking.hotel_rooms?.room_name || ''}
          existingBooking={editingBooking}
          onClose={() => setEditingBooking(null)}
        />
      )}

      {checkoutBookingId && (
        <HotelCheckoutModal
          bookingId={checkoutBookingId}
          onClose={() => setCheckoutBookingId(null)}
        />
      )}
    </div>
  );
};

export default HotelDashboardTab;
