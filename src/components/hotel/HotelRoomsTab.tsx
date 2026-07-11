import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/store/useStore';
import { COLOR_MAP } from './roomColorMap';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import HotelBookingModal from './HotelBookingModal';
import HotelCheckoutModal from './HotelCheckoutModal';
import { parseISO, isToday } from 'date-fns';

const HotelRoomsTab = () => {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  const [bookingRoomId, setBookingRoomId] = useState<string | null>(null);
  const [bookingRoomName, setBookingRoomName] = useState<string>('');
  
  const [checkoutBookingId, setCheckoutBookingId] = useState<string | null>(null);

  // Fetch Room Types
  const { data: roomTypes = [] } = useQuery({
    queryKey: ['hotel_room_types', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hotel_room_types')
        .select('*')
        .eq('store_id', storeId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!storeId && storeId !== 'default-store',
  });

  // Fetch Rooms
  const { data: rooms = [] } = useQuery({
    queryKey: ['hotel_rooms', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hotel_rooms')
        .select('*')
        .eq('store_id', storeId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!storeId && storeId !== 'default-store',
  });

  // Fetch Active Bookings
  const { data: bookings = [] } = useQuery({
    queryKey: ['hotel_bookings_active', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hotel_bookings')
        .select('*, customers(display_name, first_name), pets(name)')
        .eq('store_id', storeId)
        .in('status', ['reserved', 'checked_in']);
      if (error) throw error;
      return data;
    },
    enabled: !!storeId && storeId !== 'default-store',
  });

  const checkInMutation = useMutation({
    mutationFn: async ({ bookingId, roomId }: { bookingId: string, roomId: string }) => {
      // 1. Update Booking Status
      const { error: bookingError } = await supabase
        .from('hotel_bookings')
        .update({ status: 'checked_in', check_in_actual: new Date().toISOString() })
        .eq('id', bookingId);
      if (bookingError) throw bookingError;

      // 2. Update Room Status
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
    },
    onError: (err) => {
      toast.error('เกิดข้อผิดพลาด: ' + err.message);
    }
  });

  const handleRoomClick = (room: any) => {
    if (room.status === 'maintenance') {
      toast.error('ห้องนี้อยู่ในสถานะปิดปรับปรุง');
      return;
    }

    const activeBooking = bookings.find(b => b.room_id === room.id);

    if (activeBooking) {
      if (activeBooking.status === 'reserved') {
        const checkInDate = parseISO(activeBooking.check_in_date);
        if (isToday(checkInDate) || checkInDate < new Date()) {
           if (confirm(`เช็คอินให้น้อง ${activeBooking.pets?.name} (เจ้าของ: ${activeBooking.customers?.display_name || activeBooking.customers?.first_name}) เข้าห้อง ${room.room_name} ใช่หรือไม่?`)) {
             checkInMutation.mutate({ bookingId: activeBooking.id, roomId: room.id });
           }
        } else {
           toast.info(`จองคิวไว้สำหรับวันที่ ${activeBooking.check_in_date.split('T')[0]}`);
        }
      } else if (activeBooking.status === 'checked_in') {
        setCheckoutBookingId(activeBooking.id);
      }
    } else {
      if (room.status === 'available' || room.status === 'cleaning') {
        setBookingRoomId(room.id);
        setBookingRoomName(room.room_name);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex gap-4 mb-4 text-xs font-bold text-gray-500">
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-200 block"></span> ว่าง</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 block"></span> จองแล้ว</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 block"></span> เข้าพัก</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500 block"></span> ปิดปรับปรุง/ทำความสะอาด</div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
        {rooms.map((room) => {
          const type = roomTypes.find(t => t.id === room.room_type_id);
          const colorConfig = COLOR_MAP[(type?.color as keyof typeof COLOR_MAP) || 'gray'];
          
          const activeBooking = bookings.find(b => b.room_id === room.id);
          let dotColor = 'bg-gray-400';
          let bgColor = colorConfig?.bg || COLOR_MAP['gray'].bg;
          
          if (room.status === 'maintenance' || room.status === 'cleaning') {
             dotColor = 'bg-amber-500';
             bgColor = 'bg-amber-50 border-amber-100 text-amber-600';
          } else if (activeBooking) {
             if (activeBooking.status === 'reserved') {
               dotColor = 'bg-blue-500';
               bgColor = 'bg-blue-50 border-blue-100 text-blue-600';
             } else if (activeBooking.status === 'checked_in') {
               dotColor = 'bg-red-500';
               bgColor = 'bg-[#1A1F3D] border-[#1A1F3D] text-white';
             }
          }

          return (
            <button
              key={room.id}
              onClick={() => handleRoomClick(room)}
              className={cn(
                "aspect-square rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-xs font-black relative overflow-hidden",
                bgColor
              )}
            >
              <span className="text-sm">{room.room_name}</span>
              <span className="text-[10px] opacity-70 mt-1">{type?.type_name || 'ไม่ระบุประเภท'}</span>
              
              {activeBooking && (
                <span className="text-[9px] mt-1 opacity-90 truncate w-full px-2 text-center">
                  {activeBooking.pets?.name}
                </span>
              )}

              <span className={`absolute top-2 right-2 w-2 h-2 ${dotColor} rounded-full`} />
            </button>
          );
        })}
      </div>

      {bookingRoomId && (
        <HotelBookingModal 
          roomId={bookingRoomId}
          roomName={bookingRoomName}
          onClose={() => setBookingRoomId(null)}
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

export default HotelRoomsTab;
