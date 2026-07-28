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
import { ErrorBoundary } from '../ErrorBoundary';
import { COLOR_MAP } from './roomColorMap';
import { RoomTypeBadge } from './RoomTypeBadge';
import { HotelTimelineView } from './HotelTimelineView';

const HotelDashboardTab = ({ serviceMode = 'hotel' }: { serviceMode?: 'hotel' | 'daycare' }) => {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  const [editingBooking, setEditingBooking] = useState<any>(null);
  const [checkoutBookingId, setCheckoutBookingId] = useState<string | null>(null);
  const [creatingBookingDate, setCreatingBookingDate] = useState<Date | null>(null);

  // Fetch Rooms
  const { data: rooms = [] } = useQuery({
    queryKey: ['hotel_rooms', storeId, serviceMode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hotel_rooms')
        .select('*, hotel_room_types(*)')
        .eq('store_id', storeId)
        .eq('service_type', serviceMode)
        .eq('is_active', true);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!storeId && storeId !== 'default-store',
  });

  // Fetch Bookings (Active/Today)
  const { data: bookings = [] } = useQuery({
    queryKey: ['hotel_bookings_active', storeId, serviceMode],
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
        .eq('service_type', serviceMode)
        .in('status', ['reserved', 'checked_in']);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!storeId && storeId !== 'default-store',
  });

  const checkInBooking = useMutation({
    mutationFn: async ({ bookingId, roomId }: { bookingId: string, roomId?: string | null }) => {
      const { error: bookingError } = await supabase
        .from('hotel_bookings')
        .update({ status: 'checked_in' })
        .eq('id', bookingId);
      if (bookingError) throw bookingError;

      if (roomId) {
        const { error: roomError } = await supabase
          .from('hotel_rooms')
          .update({ status: 'occupied' })
          .eq('id', roomId);
        if (roomError) throw roomError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotel_bookings_active'] });
      queryClient.invalidateQueries({ queryKey: ['hotel_rooms'] });
      toast.success(serviceMode === 'daycare' ? 'เช็คอินฝากเลี้ยงสำเร็จ' : 'เช็คอินเข้าห้องพักสำเร็จ');
    },
    onError: (err: any) => {
      toast.error('เกิดข้อผิดพลาด: ' + err.message);
    }
  });

  // Fetch Activities for today
  const { data: activities = [] } = useQuery({
    queryKey: ['hotel_activities_today', storeId, serviceMode],
    queryFn: async () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

      const { data, error } = await supabase
        .from('hotel_activities')
        .select(`
          *,
          hotel_bookings (
            status,
            pets (name),
            hotel_rooms (room_name, hotel_room_types (type_name, color))
          )
        `)
        .eq('store_id', storeId)
        .eq('service_type', serviceMode)
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

  const todayCheckOuts = bookings.filter(b => {
    if (b.status !== 'checked_in') return false;
    const expected = b.check_out_expected ? parseISO(b.check_out_expected) : null;
    return expected && (isToday(expected) || isBefore(expected, startOfDay(new Date())));
  });

  const stayingBookings = bookings.filter(b => b.status === 'checked_in');

  return (
    <div className="space-y-[2rem]">
      <div className="flex flex-col xl:flex-row gap-[2rem] items-start">
        {/* Main Column (Left) */}
        <div className="flex-1 w-full space-y-[1.5rem] overflow-hidden min-w-0">
          <HotelTimelineView
            rooms={rooms}
            bookings={bookings}
            activities={activities}
            serviceMode={serviceMode}
            onToggleActivity={(id, status) => toggleActivity.mutate({ activityId: id, currentStatus: status })}
            onCheckout={(id) => setCheckoutBookingId(id)}
            onEdit={(booking) => setEditingBooking(booking)}
            onCreateBooking={(date) => setCreatingBookingDate(date)}
          />
        </div>

        {/* Right Panel Column (Right) */}
        <div className="w-full xl:w-[320px] shrink-0 bg-[#f3f3f3] rounded-[3rem] p-[1.5rem] flex flex-col gap-[2rem] h-full shadow-[inset_0_4px_20px_rgba(0,0,0,0.02)]">
          {/* รอเช็คอินวันนี้ */}
          <div className="flex flex-col gap-[1rem]">
            <h3 className="text-[14px] font-bold text-[#1a1c1c]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
              {serviceMode === 'daycare' ? 'รอรับฝากวันนี้' : 'รอเช็คอินวันนี้'}
            </h3>
            <div className="flex flex-col gap-[0.75rem]">
              {todayCheckIns.length === 0 ? (
                <div className="bg-[#eeeeee] p-[1.5rem] rounded-[2rem] text-center text-[#45464E] text-[14px]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                  {serviceMode === 'daycare' ? 'ไม่มีการรับฝากวันนี้' : 'ไม่มีการเช็คอินวันนี้'}
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
                        <span className="text-[12px] text-[#45464E] truncate" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                          {serviceMode === 'daycare' 
                            ? `${format(parseISO(booking.check_in_date), 'HH:mm')} - ${format(parseISO(booking.check_out_expected), 'HH:mm')}`
                            : (booking.hotel_rooms?.room_name || '-')}
                        </span>
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
                            {serviceMode === 'daycare' ? 'รับฝาก' : 'เช็คอิน'}
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl p-8 max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-['IBM_Plex_Sans_Thai'] text-xl font-bold text-[#1A1F3D]">
                              {serviceMode === 'daycare' ? 'ยืนยันการรับฝาก?' : 'ยืนยันการเช็คอิน?'}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="font-['IBM_Plex_Sans_Thai'] text-sm text-gray-500 font-medium">
                              {serviceMode === 'daycare' ? 'สถานะจะถูกเปลี่ยนเป็น "กำลังรับฝาก"' : 'สถานะห้องพักจะถูกเปลี่ยนเป็น "กำลังเข้าพัก" ทันที'}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="mt-6">
                            <AlertDialogCancel className="rounded-2xl font-['IBM_Plex_Sans_Thai'] font-bold border-gray-200">ยกเลิก</AlertDialogCancel>
                            <AlertDialogAction onClick={() => checkInBooking.mutate({ bookingId: booking.id, roomId: booking.room_id })} className="bg-[#1A1F3D] hover:bg-[#020d35] rounded-2xl font-['IBM_Plex_Sans_Thai'] font-bold text-white shadow-lg">
                              {serviceMode === 'daycare' ? 'ยืนยันรับฝาก' : 'ยืนยันเช็คอิน'}
                            </AlertDialogAction>
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
              {serviceMode === 'daycare' ? 'รอรับกลับวันนี้' : 'รอเช็คเอาท์วันนี้'}
            </h3>
            <div className="flex flex-col gap-[0.75rem]">
              {todayCheckOuts.length === 0 ? (
                <div className="bg-[#eeeeee] p-[1.5rem] rounded-[2rem] text-center text-[#45464E] text-[14px]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                  {serviceMode === 'daycare' ? 'ไม่มีการรับกลับวันนี้' : 'ไม่มีการเช็คเอาท์วันนี้'}
                </div>
              ) : (
                todayCheckOuts.map(booking => (
                  <div key={booking.id} className="bg-[#ffffff] p-[1rem] rounded-[2rem] flex items-center gap-[1rem] shadow-[0_4px_16px_rgba(24,35,74,0.03)] group relative hover:-translate-y-0.5 transition-transform">
                    <div className="w-[2.5rem] h-[2.5rem] bg-[#f3f3f3] rounded-full flex items-center justify-center text-[#020d35] shrink-0">
                      <Activity size={16} />
                    </div>
                    <div className="flex flex-col overflow-hidden items-start gap-[0.125rem]">
                      <span className="text-[16px] font-medium text-[#1a1c1c] truncate w-full" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>{booking.pets?.name || 'ไม่ระบุชื่อ'}</span>
                      {serviceMode === 'hotel' && (
                        <div className="flex items-center gap-[0.5rem]">
                          <span className="text-[12px] text-[#45464E] truncate" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                            ห้อง: {booking.hotel_rooms?.room_name || '-'}
                          </span>
                          {booking.hotel_rooms?.hotel_room_types && (
                            <RoomTypeBadge type={booking.hotel_rooms.hotel_room_types} className="text-[9px] px-[0.35rem] py-[0.1rem]" />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="ml-auto flex items-center gap-[1rem] shrink-0">
                      <div className="text-[12px] text-[#45464E] text-right" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                        {booking.check_out_expected ? (
                          isBefore(parseISO(booking.check_out_expected), startOfDay(new Date()))
                            ? <span className="text-red-500 font-bold">เลยเวลา<br/>{format(parseISO(booking.check_out_expected), 'd MMM HH:mm')}</span>
                            : <span><span className="font-bold">{serviceMode === 'daycare' ? 'รับกลับ' : 'เช็คเอาท์'}</span><br/>{format(parseISO(booking.check_out_expected), 'd MMM HH:mm')}</span>
                        ) : '-'}
                      </div>
                      <button
                        onClick={() => setCheckoutBookingId(booking.id)}
                        className="text-[10px] font-bold bg-[#1a1c1c] text-white px-[0.75rem] py-[0.5rem] rounded-full uppercase cursor-pointer shadow-sm hover:brightness-110 transition-all shrink-0"
                      >
                        {serviceMode === 'daycare' ? 'รับกลับ' : 'เช็คเอาท์'}
                      </button>
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
              <span className="bg-[#020d35] text-[#ffffff] px-[0.5rem] py-[0.125rem] rounded-full text-[10px]">
                {activities.filter(a => a.status !== 'done' && a.hotel_bookings?.status === 'checked_in').length}
              </span>
            </h3>
            <div className="flex flex-col gap-[0.75rem] max-h-[300px] overflow-y-auto pr-[0.25rem] scrollbar-thin">
              {activities.filter(a => a.status !== 'done' && a.hotel_bookings?.status === 'checked_in').length === 0 ? (
                <div className="bg-[#eeeeee] p-[1.5rem] rounded-[2rem] text-center text-[#45464E] text-[14px]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                  ไม่มีกิจกรรมค้าง
                </div>
              ) : (
                activities.filter(a => a.status !== 'done' && a.hotel_bookings?.status === 'checked_in').map(act => {
                  const activityTime = parseISO(act.scheduled_time);
                  const isOverdue = activityTime < new Date();
                  const booking = act.hotel_bookings;

                  return (
                    <div key={act.id} className="bg-[#ffffff] p-[1rem] rounded-[2rem] flex flex-col gap-[0.75rem] shadow-[0_4px_16px_rgba(24,35,74,0.03)] border border-transparent hover:border-[#e2e2e2] transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-[0.5rem]">
                          <button
                            onClick={() => toggleActivity.mutate({ activityId: act.id, currentStatus: act.status })}
                            className={`w-[1.75rem] h-[1.75rem] rounded-full flex items-center justify-center shrink-0 transition-colors ${isOverdue ? 'bg-red-100 text-red-500 hover:bg-red-200' : 'bg-[#e2e2e2] text-transparent hover:bg-[#daed5b] hover:text-[#1a1e00]'
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
                            {serviceMode === 'daycare' ? 'พื้นที่: ' : 'ห้อง: '}{booking.hotel_rooms?.room_name || '-'}
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
                  {serviceMode === 'daycare' ? 'ความหนาแน่นพื้นที่' : 'อัตราการเข้าพัก'} ({occupiedRooms}/{totalRooms} {serviceMode === 'daycare' ? 'พื้นที่' : 'ห้อง'})
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {(editingBooking || creatingBookingDate) && (
        <HotelBookingModal
          roomId={editingBooking?.room_id || ''}
          roomName={editingBooking?.hotel_rooms?.room_name || ''}
          existingBooking={editingBooking}
          initialDate={creatingBookingDate || undefined}
          onClose={() => {
            setEditingBooking(null);
            setCreatingBookingDate(null);
          }}
          serviceMode={serviceMode}
        />
      )}

      {checkoutBookingId && (
        <ErrorBoundary>
          <HotelCheckoutModal
            bookingId={checkoutBookingId}
            onClose={() => setCheckoutBookingId(null)}
          />
        </ErrorBoundary>
      )}
    </div>
  );
};

export default HotelDashboardTab;
