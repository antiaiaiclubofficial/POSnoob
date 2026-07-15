import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import HotelBookingModal from './HotelBookingModal';
import HotelCheckoutModal from './HotelCheckoutModal';
import { RoomGlassCard } from './RoomGlassCard';
import { RoomDetailPopover } from './RoomDetailPopover';
import { Search } from 'lucide-react';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { RoomDetailCard } from './RoomDetailPopover';

export const HotelFloorPlan = () => {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  const [bookingRoomId, setBookingRoomId] = useState<string | null>(null);
  const [bookingRoomName, setBookingRoomName] = useState<string>('');
  const [editingBooking, setEditingBooking] = useState<any>(null);
  
  const [checkoutBookingId, setCheckoutBookingId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [cardSize, setCardSize] = useState(160);

  // Fetch Room Types (Zones)
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
        .select('*, customers(display_name, first_name), pets(name, image_url, notes)')
        .eq('store_id', storeId)
        .in('status', ['reserved', 'checked_in']);
      if (error) throw error;
      return data;
    },
    enabled: !!storeId && storeId !== 'default-store',
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
      }
      // Removed checked_in block since hover card handles it, but keep click to checkout as well maybe? No, let hover card handle it.
    } else {
      if (room.status === 'available' || room.status === 'cleaning') {
        setBookingRoomId(room.id);
        setBookingRoomName(room.room_name);
      }
    }
  };

  const handleCreateNewBooking = () => {
    // Open booking modal without a pre-selected room
    setBookingRoomId('new'); // Or handle it differently if your modal requires a valid room ID. For now, empty string.
    setBookingRoomName('');
    setEditingBooking(null);
  };

  const filteredRooms = rooms.filter(room => {
    if (!searchQuery) return true;
    
    const activeBooking = bookings.find(b => b.room_id === room.id);
    const petName = activeBooking?.pets?.name || '';
    const roomName = room.room_name || '';
    
    return roomName.toLowerCase().includes(searchQuery.toLowerCase()) || 
           petName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="relative overflow-hidden rounded-t-[32px] rounded-b-none bg-gradient-to-br from-slate-200 to-slate-50 p-8 min-h-[600px] flex-1 flex flex-col">
      {/* Aurora blobs - วางมุมตรงข้าม ห้ามมี border */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-lg-primary-container/20 blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-lg-tertiary-fixed/10 blur-[80px]" />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            {/* search + filter bar แบบ frosted glass */}
            <div className="flex items-center gap-3 rounded-full bg-lg-surface-container-lowest/70 backdrop-blur-xl px-6 py-3 shadow-[0_20px_40px_-10px_rgba(2,13,53,0.04)] w-full max-w-md">
              <Search className="h-5 w-5 text-lg-on-surface-variant" />
              <input
                placeholder="ค้นหาห้อง หรือชื่อสัตว์เลี้ยง"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-label-md font-sans text-lg-on-surface placeholder:text-lg-on-surface-variant outline-none min-w-[200px]"
              />
            </div>

            {/* Slider สำหรับปรับขนาดการ์ด */}
            <div className="flex items-center gap-3 rounded-full bg-lg-surface-container-lowest/70 backdrop-blur-xl px-4 py-3 shadow-[0_20px_40px_-10px_rgba(2,13,53,0.04)] hidden md:flex">
              <span className="text-label-md text-lg-on-surface-variant">ขนาด:</span>
              <input 
                type="range" 
                min="120" 
                max="240" 
                step="10"
                value={cardSize} 
                onChange={(e) => setCardSize(Number(e.target.value))}
                className="w-24 accent-lg-tertiary-fixed"
              />
            </div>
          </div>

          <button 
            onClick={handleCreateNewBooking}
            className="rounded-lg-xl bg-lg-tertiary-fixed px-6 py-3 text-label-md font-medium text-lg-on-tertiary-fixed shadow-[0_8px_20px_-6px_rgba(234,253,105,0.5)] hover:brightness-105 transition-all shrink-0"
          >
            + จองห้องใหม่
          </button>
        </div>

        <div className="flex-1 flex flex-col gap-6 overflow-y-auto pb-10">
          {roomTypes.map(type => {
            const zoneRooms = filteredRooms.filter(r => r.room_type_id === type.id);
            if (zoneRooms.length === 0) return null;

            return (
              <div key={type.id}>
                {/* Zone section header */}
                <div className="mb-4 flex items-baseline gap-2">
                  <h3 className="text-headline-sm font-medium text-lg-primary">{type.type_name}</h3>
                  <span className="text-label-md text-lg-on-surface-variant">({zoneRooms.length} ห้อง)</span>
                </div>
                
                <div className="flex flex-wrap gap-6">
                  {zoneRooms.map(room => {
                    const activeBooking = bookings.find(b => b.room_id === room.id);
                    const isOccupied = activeBooking && activeBooking.status === 'checked_in';
                    const card = (
                      <RoomGlassCard
                        room={room}
                        type={type}
                        activeBooking={activeBooking}
                        size={cardSize}
                        onBook={() => handleRoomClick(room)}
                        onOpenDetail={() => handleRoomClick(room)}
                      />
                    );

                    if (isOccupied) {
                      return (
                        <HoverCard key={room.id} openDelay={200} closeDelay={300}>
                          <HoverCardTrigger asChild>
                            <div>{card}</div>
                          </HoverCardTrigger>
                          <HoverCardContent 
                            side="right" 
                            align="start" 
                            sideOffset={24}
                            className="w-96 rounded-lg-xl bg-lg-surface-container-lowest/70 backdrop-blur-2xl p-8 shadow-[0_24px_60px_-12px_rgba(2,13,53,0.18)] border-0"
                          >
                            <RoomDetailCard 
                              booking={activeBooking} 
                              room={room} 
                              onCheckout={() => setCheckoutBookingId(activeBooking.id)} 
                            />
                          </HoverCardContent>
                        </HoverCard>
                      );
                    }
                    return <React.Fragment key={room.id}>{card}</React.Fragment>;
                  })}
                </div>
              </div>
            );
          })}
          
          {filteredRooms.length === 0 && (
             <div className="flex items-center justify-center py-20 text-lg-on-surface-variant text-label-md">
               ไม่พบห้องพักหรือสัตว์เลี้ยงที่ค้นหา
             </div>
          )}
        </div>
      </div>

      {bookingRoomId && (
        <HotelBookingModal 
          roomId={bookingRoomId === 'new' ? '' : bookingRoomId}
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
