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
  const [editingBooking, setEditingBooking] = useState<any>(null);
  
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
        .update({ status: 'checked_in' })
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
        setEditingBooking(activeBooking);
        setBookingRoomId(room.id);
        setBookingRoomName(room.room_name);
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
      <div className="flex gap-[1.5rem] mb-[1rem] text-[12px] font-bold text-[#76767f]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
        <div className="flex items-center gap-[0.5rem]"><span className="w-[1rem] h-[1rem] rounded-full bg-[#ffffff] border border-gray-200 shadow-sm block"></span> ว่าง</div>
        <div className="flex items-center gap-[0.5rem]"><span className="w-[1rem] h-[1rem] rounded-full bg-[#dce1ff] border border-[#bac4f5] block"></span> จองแล้ว</div>
        <div className="flex items-center gap-[0.5rem]"><span className="w-[1rem] h-[1rem] rounded-full bg-gradient-to-br from-[#18234a] to-[#020d35] shadow-sm block"></span> เข้าพัก</div>
        <div className="flex items-center gap-[0.5rem]"><span className="w-[1rem] h-[1rem] rounded-full bg-[#FBE8E8] border border-[#F3C2C2] block"></span> ปิดปรับปรุง/ทำความสะอาด</div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
        {rooms.map((room) => {
          const type = roomTypes.find(t => t.id === room.room_type_id);
          const colorConfig = COLOR_MAP[(type?.color as keyof typeof COLOR_MAP) || 'gray'];
          
          const activeBooking = bookings.find(b => b.room_id === room.id);
          let dotColor = 'bg-gray-400';
          let bgColor = colorConfig?.bg || COLOR_MAP['gray'].bg;
          
          if (room.status === 'maintenance' || room.status === 'cleaning') {
             bgColor = 'bg-[#FBE8E8] text-[#8E171D] shadow-[0_4px_16px_rgba(142,23,29,0.1)]';
          } else if (activeBooking) {
             if (activeBooking.status === 'reserved') {
               bgColor = 'bg-[#dce1ff] text-[#0d193f] shadow-[0_4px_16px_rgba(24,35,74,0.1)]';
             } else if (activeBooking.status === 'checked_in') {
               bgColor = 'bg-gradient-to-br from-[#18234a] to-[#020d35] text-white shadow-[0_10px_25px_-5px_rgba(24,35,74,0.3)] translate-y-[-2px]';
             }
          }

          return (
            <button
              key={room.id}
              onClick={() => handleRoomClick(room)}
              className={cn(
                "aspect-square rounded-[2rem] border-0 transition-all flex flex-col items-center justify-center font-bold relative overflow-hidden hover:-translate-y-1",
                bgColor,
                !activeBooking && room.status !== 'maintenance' && room.status !== 'cleaning' ? '' : ''
              )}
              style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}
            >
              <span className="text-[16px] font-black">{room.room_name}</span>
              <span className="text-[12px] opacity-70 mt-1">{type?.type_name || 'ไม่ระบุประเภท'}</span>
              
              {activeBooking && (
                <span className="text-[9px] mt-1 opacity-90 truncate w-full px-2 text-center">
                  {activeBooking.pets?.name}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {bookingRoomId && (
        <HotelBookingModal 
          roomId={bookingRoomId}
          roomName={bookingRoomName}
          existingBooking={editingBooking}
          onClose={() => {
            setBookingRoomId(null);
            setEditingBooking(null);
          }}
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
