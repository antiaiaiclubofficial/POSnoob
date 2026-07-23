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
    <div className="space-y-[2rem]">
      <div className="flex flex-col xl:flex-row gap-[2rem] items-start">
        {/* Main Column (Left) */}
        <div className="flex-1 w-full space-y-[1.5rem]">
          {/* Section: ภาพรวมวันนี้ (Statistics Header Fallback) */}
          <div className="flex justify-between items-center bg-[#f3f3f3] p-[0.75rem] rounded-[1.5rem] px-[1.25rem] shadow-[inset_0_4px_20px_rgba(0,0,0,0.02)]">
            <h2 className="text-[24px] font-semibold text-[#1a1c1c] leading-none" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
              ภาพรวมวันนี้
            </h2>
            <div className="bg-[#ffffff] rounded-full px-[1rem] py-[0.35rem] shadow-[0_4px_20px_rgba(24,35,74,0.04)]">
              <span className="text-[14px] font-medium text-[#45464E]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                {format(new Date(), 'dd MMM yyyy')}
              </span>
            </div>
          </div>

          {/* Section: กิจกรรม & ห้องพักวันนี้ */}
          <div className="space-y-[1rem]">
            <div className="flex items-center gap-[1rem]">
              <h3 className="text-[24px] font-semibold text-[#1a1c1c] leading-none" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                กิจกรรม & ห้องพักวันนี้
              </h3>
              <div className="w-[1.75rem] h-[1.75rem] bg-[#020d35] text-[#ffffff] rounded-full flex items-center justify-center text-[12px] font-bold shadow-[0_4px_12px_rgba(2,13,53,0.3)]">
                {activities.length}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1rem]">
              {stayingBookings.length === 0 ? (
                <div className="col-span-full py-[3rem] text-center text-[#45464E] bg-[#ffffff] rounded-[2rem] shadow-[0_8px_32px_rgba(24,35,74,0.04)] text-[14px]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                  ไม่มีกิจกรรมหรือห้องพักวันนี้
                </div>
              ) : (
                stayingBookings.map(booking => {
                  const bookingActivities = activities.filter(a => a.booking_id === booking.id);
                  const isVip = booking.customers?.membership === 'VIP';
                  
                  return (
                    <div key={booking.id} className="bg-[#ffffff] rounded-[2rem] p-[1.5rem] shadow-[0_8px_32px_rgba(24,35,74,0.04)] flex flex-col gap-[1rem] relative overflow-hidden group">
                      {/* Inner Frosted Glow Effect */}
                      <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-gradient-to-br from-white/80 to-transparent -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none"></div>

                      {/* 1. หัวการ์ด: Avatar + Pet Name + Status Badge */}
                      <div className="flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-[0.75rem]">
                          <div className="w-[2.5rem] h-[2.5rem] rounded-full bg-[#f3f3f3] flex items-center justify-center text-[#020d35] shrink-0">
                            <Activity size={18} />
                          </div>
                          <span className="text-[18px] font-semibold text-[#1a1c1c] truncate max-w-[100px]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                            {booking.pets?.name || 'ไม่ระบุชื่อ'}
                          </span>
                        </div>
                        <div className="bg-[#d9d6fe] text-[#5d5c7e] px-[1rem] py-[0.25rem] rounded-full text-[12px] font-medium whitespace-nowrap">
                          เข้าพักอยู่
                        </div>
                      </div>

                      {/* 2. แถว stat: ไอคอน + ตัวเลขห้อง + Badge VIP */}
                      <div className="flex items-center gap-[0.5rem] mt-[0.5rem] relative z-10 flex-wrap">
                        <BedDouble size={16} className="text-[#45464E]" />
                        <span className="text-[14px] text-[#45464E]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                          ห้อง: {booking.hotel_rooms?.room_name || '-'}
                        </span>
                        {booking.hotel_rooms?.hotel_room_types && (
                          <RoomTypeBadge type={booking.hotel_rooms.hotel_room_types} className="text-[10px]" />
                        )}
                        {isVip && (
                          <span className="ml-[0.5rem] bg-[#daed5b] text-[#1a1e00] px-[0.75rem] py-[0.125rem] rounded-full text-[10px] font-bold tracking-wider uppercase">
                            VIP
                          </span>
                        )}
                      </div>

                      {/* 3. เจ้าของสัตว์เลี้ยง + ไอคอนจำนวนกิจกรรมค้าง */}
                      <div className="flex justify-between items-center text-[16px] text-[#45464E] relative z-10" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                        <span className="truncate pr-[1rem]">เจ้าของ: {booking.customers?.display_name || booking.customers?.first_name || '-'}</span>
                        <div className="flex items-center gap-[0.25rem] shrink-0">
                          <CheckSquare size={16} className="text-[#1a1c1c]" />
                          <span className="font-bold text-[#1a1c1c]">{bookingActivities.filter(a => a.status !== 'done').length}</span>
                        </div>
                      </div>

                      {/* 4. รายการกิจกรรมย่อย */}
                      <div className="flex flex-col gap-[0.5rem] mt-[0.5rem] relative z-10 max-h-[150px] overflow-y-auto pr-1 scrollbar-thin">
                        {bookingActivities.length === 0 ? (
                          <span className="text-[12px] text-[#45464E]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>ไม่มีกิจกรรม</span>
                        ) : (
                          bookingActivities.map((act) => {
                            const activityTime = parseISO(act.scheduled_time);
                            const isOverdue = act.status !== 'done' && activityTime < new Date();
                            return (
                              <div key={act.id} className="flex items-center justify-between group/act bg-[#f9f9f9] p-[0.5rem] rounded-[1rem] hover:bg-[#f3f3f3] transition-colors border border-transparent hover:border-gray-200">
                                <div className="flex items-center gap-[0.5rem]">
                                  <button
                                    onClick={() => toggleActivity.mutate({ activityId: act.id, currentStatus: act.status })}
                                    className={`w-[1.5rem] h-[1.5rem] rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                      act.status === 'done' 
                                        ? 'bg-[#daed5b] text-[#1a1e00]' 
                                        : isOverdue 
                                          ? 'bg-red-100 text-red-500 hover:bg-red-200' 
                                          : 'bg-[#e2e2e2] text-transparent hover:bg-[#daed5b] hover:text-[#1a1e00]'
                                    }`}
                                  >
                                    <CheckCircle2 size={14} />
                                  </button>
                                  <span className={`text-[12px] font-medium leading-tight ${act.status === 'done' ? 'text-gray-400 line-through' : isOverdue ? 'text-red-600' : 'text-[#1a1c1c]'}`} style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                                    {act.title || act.activity_type}{act.note && ` - ${act.note}`}
                                  </span>
                                </div>
                                <span className={`text-[10px] font-bold px-[0.5rem] py-[0.125rem] rounded-full ${act.status === 'done' ? 'text-gray-400' : isOverdue ? 'text-red-500 bg-red-50' : 'text-[#45464E] bg-[#e2e2e2]'}`} style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                                  {format(activityTime, 'HH:mm')}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Actions / Footer */}
                      <div className="mt-auto pt-[1.5rem] flex justify-between items-center border-t-0 relative z-10">
                        <span className="text-[12px] text-[#45464E] truncate w-[50%]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                          Ref: {booking.id.substring(0,8)}
                        </span>
                        <div className="flex gap-[0.5rem]">
                          <button
                            onClick={() => setEditingBooking(booking)}
                            className="w-[2.5rem] h-[2.5rem] bg-[#f3f3f3] hover:bg-[#e8e8e8] text-[#45464E] rounded-full flex items-center justify-center transition-colors"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => setCheckoutBookingId(booking.id)}
                            className="text-[12px] font-bold bg-[#d9d6fe] hover:brightness-95 text-[#191836] px-[1rem] py-[0.5rem] rounded-full tracking-wider transition-all cursor-pointer"
                          >
                            เช็คเอาท์
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Panel Column (Right) */}
        <div className="w-full xl:w-[320px] shrink-0 bg-[#f3f3f3] rounded-[3rem] p-[1.5rem] flex flex-col gap-[2rem] h-full shadow-[inset_0_4px_20px_rgba(0,0,0,0.02)]">
          {/* รอเช็คอินวันนี้ */}
          <div className="flex flex-col gap-[1rem]">
            <h3 className="text-[14px] font-bold text-[#1a1c1c]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
              รอเช็คอินวันนี้
            </h3>
            <div className="flex flex-col gap-[0.75rem]">
              {todayCheckIns.length === 0 ? (
                <div className="bg-[#eeeeee] p-[1.5rem] rounded-[2rem] text-center text-[#45464E] text-[14px]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                  ไม่มีการเช็คอินวันนี้
                </div>
              ) : (
                todayCheckIns.map(booking => (
                  <div key={booking.id} className="bg-[#ffffff] p-[1rem] rounded-[2rem] flex items-center gap-[1rem] shadow-[0_4px_16px_rgba(24,35,74,0.03)] group relative hover:-translate-y-0.5 transition-transform">
                     <div className="w-[2.5rem] h-[2.5rem] bg-[#f3f3f3] rounded-full flex items-center justify-center text-[#020d35] shrink-0">
                       <Activity size={16} />
                     </div>
                     <div className="flex flex-col overflow-hidden items-start gap-[0.125rem]">
                       <span className="text-[16px] font-medium text-[#1a1c1c] truncate w-full" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>{booking.pets?.name || 'ไม่ระบุชื่อ'}</span>
                       <div className="flex items-center gap-[0.5rem]">
                         <span className="text-[12px] text-[#45464E] truncate" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>{booking.hotel_rooms?.room_name || '-'}</span>
                         {booking.hotel_rooms?.hotel_room_types && (
                           <RoomTypeBadge type={booking.hotel_rooms.hotel_room_types} className="text-[9px] px-[0.35rem] py-[0.1rem]" />
                         )}
                       </div>
                     </div>
                     <div className="ml-auto flex shrink-0 gap-[0.25rem]">
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              disabled={checkInBooking.isPending}
                              className="text-[10px] font-bold bg-[#daed5b] text-[#1a1e00] px-[0.75rem] py-[0.5rem] rounded-full uppercase cursor-pointer shadow-sm hover:brightness-95 transition-all"
                            >
                              เช็คอิน
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl p-8 max-w-md">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-['IBM_Plex_Sans_Thai'] text-xl font-bold text-[#1A1F3D]">ยืนยันการเช็คอิน?</AlertDialogTitle>
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
                ))
              )}
            </div>
          </div>

          {/* รอเช็คเอาท์วันนี้ */}
          <div className="flex flex-col gap-[1rem]">
            <h3 className="text-[14px] font-bold text-[#1a1c1c]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
              รอเช็คเอาท์วันนี้
            </h3>
            <div className="flex flex-col gap-[0.75rem]">
              {todayCheckOuts.length === 0 ? (
                <div className="bg-[#eeeeee] p-[1.5rem] rounded-[2rem] text-center text-[#45464E] text-[14px]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                  ไม่มีการเช็คเอาท์วันนี้
                </div>
              ) : (
                todayCheckOuts.map(booking => (
                  <div key={booking.id} className="bg-[#ffffff] p-[1rem] rounded-[2rem] flex items-center gap-[1rem] shadow-[0_4px_16px_rgba(24,35,74,0.03)] group relative hover:-translate-y-0.5 transition-transform">
                     <div className="w-[2.5rem] h-[2.5rem] bg-[#f3f3f3] rounded-full flex items-center justify-center text-[#020d35] shrink-0">
                       <Activity size={16} />
                     </div>
                     <div className="flex flex-col overflow-hidden items-start gap-[0.125rem]">
                       <span className="text-[16px] font-medium text-[#1a1c1c] truncate w-full" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>{booking.pets?.name || 'ไม่ระบุชื่อ'}</span>
                       <div className="flex items-center gap-[0.5rem]">
                         <span className="text-[12px] text-[#45464E] truncate" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>ห้อง: {booking.hotel_rooms?.room_name || '-'}</span>
                         {booking.hotel_rooms?.hotel_room_types && (
                           <RoomTypeBadge type={booking.hotel_rooms.hotel_room_types} className="text-[9px] px-[0.35rem] py-[0.1rem]" />
                         )}
                       </div>
                     </div>
                     <div className="ml-auto text-[12px] text-[#45464E]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                       {booking.check_out_expected ? format(parseISO(booking.check_out_expected), 'HH:mm') : '-'}
                     </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* กิจกรรมที่ต้องทำ */}
          <div className="flex flex-col gap-[1rem]">
            <h3 className="text-[14px] font-bold text-[#1a1c1c] flex justify-between items-center" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
              <span>กิจกรรมที่ต้องทำ</span>
              <span className="bg-[#020d35] text-[#ffffff] px-[0.5rem] py-[0.125rem] rounded-full text-[10px]">{activities.filter(a => a.status !== 'done').length}</span>
            </h3>
            <div className="flex flex-col gap-[0.75rem] max-h-[300px] overflow-y-auto pr-[0.25rem] scrollbar-thin">
              {activities.filter(a => a.status !== 'done').length === 0 ? (
                <div className="bg-[#eeeeee] p-[1.5rem] rounded-[2rem] text-center text-[#45464E] text-[14px]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                  ไม่มีกิจกรรมค้าง
                </div>
              ) : (
                activities.filter(a => a.status !== 'done').map(act => {
                  const activityTime = parseISO(act.scheduled_time);
                  const isOverdue = activityTime < new Date();
                  const booking = act.hotel_bookings;
                  
                  return (
                    <div key={act.id} className="bg-[#ffffff] p-[1rem] rounded-[2rem] flex flex-col gap-[0.75rem] shadow-[0_4px_16px_rgba(24,35,74,0.03)] border border-transparent hover:border-[#e2e2e2] transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-[0.5rem]">
                          <button
                            onClick={() => toggleActivity.mutate({ activityId: act.id, currentStatus: act.status })}
                            className={`w-[1.75rem] h-[1.75rem] rounded-full flex items-center justify-center shrink-0 transition-colors ${
                              isOverdue ? 'bg-red-100 text-red-500 hover:bg-red-200' : 'bg-[#e2e2e2] text-transparent hover:bg-[#daed5b] hover:text-[#1a1e00]'
                            }`}
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <span className={`text-[14px] font-medium leading-tight ${isOverdue ? 'text-red-600' : 'text-[#1a1c1c]'}`} style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                            {act.title || act.activity_type}{act.note && ` - ${act.note}`}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-[0.5rem] py-[0.125rem] rounded-full ${isOverdue ? 'text-red-500 bg-red-50' : 'text-[#45464E] bg-[#f3f3f3]'}`} style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                          {format(activityTime, 'HH:mm')}
                        </span>
                      </div>
                      {booking && (
                        <div className="flex items-center gap-[0.5rem] pl-[2.25rem] flex-wrap">
                          <span className="text-[12px] text-[#45464E]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                            น้อน: <span className="font-medium text-[#1a1c1c]">{booking.pets?.name || '-'}</span>
                          </span>
                          <span className="text-[10px] text-[#76767f]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>•</span>
                          <span className="text-[12px] text-[#45464E]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                            ห้อง: {booking.hotel_rooms?.room_name || '-'}
                          </span>
                          {booking.hotel_rooms?.hotel_room_types && (
                            <RoomTypeBadge type={booking.hotel_rooms.hotel_room_types} className="text-[9px] px-[0.35rem] py-[0.1rem]" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Highlight Stat Card (Occupancy) */}
          <div className="mt-auto pt-[2rem]">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#18234a] to-[#020d35] rounded-[3rem] p-[2.5rem] shadow-[0_8px_32px_rgba(24,35,74,0.15)] group">
              {/* Liquid Glow Halo */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[#daed5b] opacity-[0.15] blur-[50px] pointer-events-none transition-transform group-hover:scale-110 duration-700"></div>
              
              <div className="relative z-10 flex flex-col gap-[0.5rem] items-center text-center">
                <div className="w-[4rem] h-[4rem] bg-[#ffffff]/10 backdrop-blur-md rounded-full flex items-center justify-center text-[#ffffff] mb-[1rem] shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
                  <BedDouble size={28} />
                </div>
                <div className="text-[48px] font-semibold text-[#ffffff] leading-none tracking-tight" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                  {occupancyRate}%
                </div>
                <div className="text-[14px] font-medium text-[#bac4f5] mt-[0.5rem]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                  อัตราการเข้าพัก ({occupiedRooms}/{totalRooms} ห้อง)
                </div>
              </div>
            </div>
          </div>
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
