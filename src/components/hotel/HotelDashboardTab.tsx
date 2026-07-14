import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/store/useStore';
import { format, isToday, parseISO } from 'date-fns';
import { BedDouble, CheckSquare, LogOut, CheckCircle2, Edit3 } from 'lucide-react';
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

const HotelDashboardTab = () => {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  const [editingBooking, setEditingBooking] = useState<any>(null);

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
          hotel_rooms (*),
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

  // Fetch Activities for today
  const { data: activities = [] } = useQuery({
    queryKey: ['hotel_activities_today', storeId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('hotel_activities')
        .select(`
          *,
          hotel_bookings (
            pets (name),
            hotel_rooms (room_name)
          )
        `)
        .eq('store_id', storeId)
        .gte('scheduled_time', `${today}T00:00:00Z`)
        .lte('scheduled_time', `${today}T23:59:59Z`)
        .order('scheduled_time', { ascending: true });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!storeId && storeId !== 'default-store',
  });

  const completeActivity = useMutation({
    mutationFn: async (activityId: string) => {
      const { error } = await supabase
        .from('hotel_activities')
        .update({ status: 'done', completed_at: new Date().toISOString() })
        .eq('id', activityId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotel_activities_today'] });
    }
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

  const checkOutBooking = useMutation({
    mutationFn: async ({ bookingId, roomId }: { bookingId: string, roomId: string }) => {
      const { error: bookingError } = await supabase
        .from('hotel_bookings')
        .update({ status: 'checked_out', check_out_actual: new Date().toISOString() })
        .eq('id', bookingId);
      if (bookingError) throw bookingError;

      const { error: roomError } = await supabase
        .from('hotel_rooms')
        .update({ status: 'available' })
        .eq('id', roomId);
      if (roomError) throw roomError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotel_bookings_active'] });
      queryClient.invalidateQueries({ queryKey: ['hotel_rooms'] });
      toast.success('เช็คเอาท์สำเร็จ');
    },
    onError: (err) => {
      toast.error('เกิดข้อผิดพลาด: ' + err.message);
    }
  });

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
              {stayingBookings.map(booking => (
                <div key={booking.id} className="flex flex-col gap-[0.5rem] p-[1.5rem] rounded-[1.5rem] bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-xl border border-white/60 text-[#020d35] shadow-[0_8px_16px_rgba(0,0,0,0.03)] relative group">
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
                    <div className="flex flex-col gap-2 items-end">
                      <span className="text-[12px] font-bold bg-[#020d35]/10 text-[#020d35] px-[1rem] py-[0.5rem] rounded-[9999px] uppercase tracking-wider backdrop-blur-md">เข้าพักอยู่</span>
                      <button
                        onClick={() => setEditingBooking(booking)}
                        className="opacity-0 group-hover:opacity-100 p-2 bg-white/50 hover:bg-[#1A1F3D] hover:text-[#EAFD69] text-gray-600 rounded-full transition-all"
                      >
                        <Edit3 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            disabled={checkOutBooking.isPending}
                            className="text-[12px] font-bold bg-[#d9d6fe] hover:brightness-95 text-[#191836] px-[1rem] py-[0.5rem] rounded-[9999px] uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                          >
                            {checkOutBooking.isPending ? 'รอสักครู่...' : 'เช็คเอาท์'}
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl p-8 max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-['IBM_Plex_Sans_Thai'] text-xl font-bold text-[#1A1F3D]">ยืนยันการเช็คเอาท์คืนห้องพัก?</AlertDialogTitle>
                            <AlertDialogDescription className="font-['IBM_Plex_Sans_Thai'] text-sm text-gray-500 font-medium">
                              สถานะห้องพักจะถูกเปลี่ยนเป็น "ห้องว่าง" ทันที
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="mt-6">
                            <AlertDialogCancel className="rounded-2xl font-['IBM_Plex_Sans_Thai'] font-bold border-gray-200">ยกเลิก</AlertDialogCancel>
                            <AlertDialogAction onClick={() => checkOutBooking.mutate({ bookingId: booking.id, roomId: booking.room_id })} className="bg-[#191836] hover:bg-[#020d35] rounded-2xl font-['IBM_Plex_Sans_Thai'] font-bold text-white shadow-lg">ยืนยันเช็คเอาท์</AlertDialogAction>
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
      </div>

      {/* Activities List */}
      <div className="bg-[#ffffff] rounded-[2rem] p-[2rem] shadow-[0_8px_32px_rgba(24,35,74,0.04)] flex flex-col">
        <h3 className="text-[20px] font-bold text-[#020d35] mb-[1rem]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>กิจกรรมสัตว์เลี้ยงวันนี้</h3>
        {activities.length === 0 ? (
          <p className="text-[14px] text-[#76767f] text-center py-[2rem]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>ไม่มีกิจกรรมสำหรับวันนี้</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1rem]">
            {activities.map(activity => (
              <div key={activity.id} className="flex items-center justify-between p-[1.5rem] rounded-[1.5rem] bg-[#f9f9f9] transition-colors shadow-sm">
                <div className="flex items-center gap-[1rem]">
                  <button
                    onClick={() => { if (activity.status !== 'done') completeActivity.mutate(activity.id); }}
                    className={`w-[2rem] h-[2rem] rounded-full flex items-center justify-center shrink-0 transition-colors ${activity.status === 'done' ? 'bg-[#EAFD69] text-[#1A1F3D]' : 'bg-[#e2e2e2] text-transparent hover:bg-[#EAFD69] hover:text-[#1A1F3D]'}`}
                  >
                    <CheckCircle2 size={16} />
                  </button>
                  <div>
                    <p className="text-[16px] font-bold text-[#020d35]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                      {activity.title || activity.activity_type}
                      <span className="text-[#76767f] font-medium ml-2 text-[14px]">({activity.hotel_bookings?.pets?.name} - ห้อง {activity.hotel_bookings?.hotel_rooms?.room_name})</span>
                    </p>
                    <p className="text-[14px] text-[#45464e] mt-1" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>{format(parseISO(activity.scheduled_time), 'HH:mm')} {activity.note && `- ${activity.note}`}</p>
                  </div>
                </div>
                {activity.status === 'done' && (
                  <span className="text-[12px] font-bold bg-[#EAFD69] text-[#1a1e00] px-[1rem] py-[0.5rem] rounded-[9999px] uppercase tracking-wider ml-4">เสร็จแล้ว</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {editingBooking && (
        <HotelBookingModal
          roomId={editingBooking.room_id}
          roomName={editingBooking.hotel_rooms?.room_name || ''}
          existingBooking={editingBooking}
          onClose={() => setEditingBooking(null)}
        />
      )}
    </div>
  );
};

export default HotelDashboardTab;
