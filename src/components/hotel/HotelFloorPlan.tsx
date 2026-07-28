import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import HotelBookingModal from './HotelBookingModal';
import HotelCheckoutModal from './HotelCheckoutModal';
import { RoomGlassCard } from './RoomGlassCard';
import { RoomIsometricBlock } from './RoomIsometricBlock';
import { DayCareLawn } from './DayCareLawn';
import { Search, Plus, Minus } from 'lucide-react';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { RoomDetailCard } from './RoomDetailPopover';
import { format, parseISO } from 'date-fns';

export const HotelFloorPlan = ({ serviceMode = 'hotel' }: { serviceMode?: 'hotel' | 'daycare' }) => {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  const [bookingRoomId, setBookingRoomId] = useState<string | null>(null);
  const [bookingRoomName, setBookingRoomName] = useState<string>('');
  const [editingBooking, setEditingBooking] = useState<any>(null);

  const [checkoutBookingId, setCheckoutBookingId] = useState<string | null>(null);
  const [openHoverRoomId, setOpenHoverRoomId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  // Pan and Zoom states
  const [zoom, setZoom] = useState(0.75);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  const [selectedRoomType, setSelectedRoomType] = useState<string | 'all'>('all');
  const zoneRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const focusZone = (typeId: string | 'all') => {
    setSelectedRoomType(typeId);
    if (typeId === 'all') {
      setPan({ x: 0, y: 0 });
      setZoom(0.75);
      return;
    }

    const zoneEl = zoneRefs.current[typeId];
    if (zoneEl) {
      // Find coordinates of the zone's center relative to its parent.
      // parent is the flex-col container which contains all zones.
      const parent = zoneEl.parentElement;
      if (!parent) return;

      const cx = zoneEl.offsetLeft + zoneEl.offsetWidth / 2 - parent.offsetWidth / 2;
      const cy = zoneEl.offsetTop + zoneEl.offsetHeight / 2 - parent.offsetHeight / 2;

      // Apply the Isometric projection matrix: rotateZ(-45) -> rotateX(60)
      const screenX = (cx + cy) * 0.7071;
      const screenY = (-cx + cy) * 0.3535;

      const newZoom = 1.1;
      setZoom(newZoom);
      setPan({ x: -screenX * newZoom, y: -screenY * newZoom });
    }
  };

  // Handle Wheel Zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom(z => Math.max(0.2, Math.min(3, z - e.deltaY * 0.005)));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag if left click and not clicking on a card
    if (e.button !== 0) return;
    setIsDragging(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

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
    queryKey: ['hotel_rooms', storeId, serviceMode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hotel_rooms')
        .select(`
          *,
          hotel_room_types (
            type_name,
            color,
            price_per_night,
            description
          )
        `)
        .eq('store_id', storeId)
        .eq('service_type', serviceMode)
        .order('room_name');
      if (error) throw error;
      return data;
    },
    enabled: !!storeId && storeId !== 'default-store',
  });

  // Fetch Active Bookings
  const { data: bookings = [] } = useQuery({
    queryKey: ['hotel_bookings_active', storeId, serviceMode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hotel_bookings')
        .select('*, customers(display_name, first_name), pets(name, image_url, notes, type), hotel_rooms(room_name, hotel_room_types(type_name, color)), hotel_activities(id, status)')
        .eq('store_id', storeId)
        .eq('service_type', serviceMode)
        .in('status', ['reserved', 'checked_in']);
      if (error) throw error;
      return data;
    },
    enabled: !!storeId && storeId !== 'default-store',
  });

  const markRoomClean = useMutation({
    mutationFn: async (roomId: string) => {
      const { error } = await supabase
        .from('hotel_rooms')
        .update({ status: 'available' })
        .eq('id', roomId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotel_rooms'] });
      toast.success('ทำความสะอาดเสร็จสิ้น ห้องพร้อมใช้งาน');
    },
    onError: (err: any) => {
      toast.error('เกิดข้อผิดพลาด: ' + err.message);
    }
  });

  const handleRoomClick = (room: any) => {
    if (room.status === 'maintenance') {
      toast.error('ห้องนี้อยู่ในสถานะปิดปรับปรุง');
      return;
    }

    if (room.status === 'cleaning') {
      markRoomClean.mutate(room.id);
      return;
    }

    const activeBooking = bookings.find(b => b.room_id === room.id);

    if (activeBooking) {
      if (activeBooking.status === 'reserved' || activeBooking.status === 'checked_in') {
        setEditingBooking(activeBooking);
        setBookingRoomId(room.id);
        setBookingRoomName(room.room_name);
      }
    } else {
      if (room.status === 'available') {
        setBookingRoomId(room.id);
        setBookingRoomName(room.room_name);
      }
    }
  };

  const handleCreateNewBooking = () => {
    setBookingRoomId('new');
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
    <div className="relative flex-1 flex flex-col h-full bg-[#8c9bab] overflow-hidden select-none">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col gap-4 pointer-events-auto">
          {/* search + filter bar */}
          <div className="flex items-center gap-3 rounded-full bg-white/10 backdrop-blur-xl px-6 py-3 border border-white/20 shadow-lg w-full max-w-md text-white">
            <Search className="h-5 w-5 text-white/70" />
            <input
              placeholder="ค้นหาห้อง หรือชื่อสัตว์เลี้ยง"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-label-md font-sans text-white placeholder:text-white/50 outline-none min-w-[200px]"
            />
          </div>
          
          {/* Room Type Filter Pills */}
          {roomTypes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => focusZone('all')}
                className={`px-4 py-1.5 rounded-full text-[14px] font-medium transition-all shadow-sm ${
                  selectedRoomType === 'all'
                    ? 'bg-white text-gray-900 shadow-md scale-105'
                    : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-md'
                }`}
              >
                ทั้งหมด
              </button>
              {roomTypes.filter(type => rooms.some(r => r.room_type_id === type.id)).map(type => (
                <button
                  key={type.id}
                  onClick={() => focusZone(type.id)}
                  className={`px-4 py-1.5 rounded-full text-[14px] font-medium transition-all shadow-sm flex items-center gap-2 ${
                    selectedRoomType === type.id
                      ? 'bg-white text-gray-900 shadow-md scale-105'
                      : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-md'
                  }`}
                >
                  <span 
                    className="w-2.5 h-2.5 rounded-full shadow-sm" 
                    style={{ backgroundColor: type.color || '#ccc' }}
                  />
                  {type.type_name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pointer-events-auto">
          <button
            onClick={handleCreateNewBooking}
            className="rounded-full bg-lg-tertiary-fixed px-6 py-3 text-label-md font-medium text-lg-on-tertiary-fixed shadow-[0_8px_20px_-6px_rgba(234,253,105,0.5)] hover:brightness-105 transition-all shrink-0"
          >
            + {serviceMode === 'daycare' ? 'เพิ่มรับฝากเลี้ยง' : 'จองห้องใหม่'}
          </button>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute right-6 bottom-6 flex flex-col gap-3 z-50 pointer-events-auto">
        <button
          onClick={() => setZoom(z => Math.min(3, z + 0.2))}
          className="w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-full shadow-lg text-white hover:bg-white/20 transition-colors"
        >
          <Plus size={20} />
        </button>
        <button
          onClick={() => setZoom(z => Math.max(0.2, z - 0.2))}
          className="w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-full shadow-lg text-white hover:bg-white/20 transition-colors"
        >
          <Minus size={20} />
        </button>
      </div>

      {/* Pannable & Zoomable Canvas */}
      <div
        ref={containerRef}
        className="flex-1 w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="relative"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotateX(60deg) rotateZ(-45deg)`,
            transformStyle: 'preserve-3d',
            transition: isDragging ? 'none' : 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {serviceMode === 'daycare' ? (
            <DayCareLawn 
              bookings={bookings}
              searchQuery={searchQuery}
              onBookingClick={(booking) => {
                setEditingBooking(booking);
                setBookingRoomId(booking.room_id || 'daycare');
                setBookingRoomName(booking.hotel_rooms?.room_name || 'รับฝากเลี้ยง');
              }}
              onCheckout={(id) => setCheckoutBookingId(id)}
            />
          ) : (
            <div className="flex flex-col gap-24" style={{ transformStyle: 'preserve-3d' }}>
              {roomTypes.map(type => {
                const zoneRooms = filteredRooms.filter(r => r.room_type_id === type.id);
                if (zoneRooms.length === 0) return null;

                // Calculate grid size to make it square-ish
                const numRooms = zoneRooms.length;
                const cols = Math.ceil(Math.sqrt(numRooms));

                return (
                  <div 
                    key={type.id} 
                    ref={(el) => { zoneRefs.current[type.id] = el; }}
                    className="flex flex-col gap-8 relative w-fit mx-auto" 
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* Zone Name tag floating above the floor */}
                    <div
                      className="text-white font-bold text-[72px] absolute z-50 pointer-events-none"
                      style={{
                        left: '-200px',
                        top: '50%',
                        transform: 'translateZ(0px) rotateZ(45deg) rotateX(-60deg) translateY(-50%) scale(0.5)',
                        textShadow: '0 16px 32px rgba(0,0,0,0.4)',
                        transformOrigin: 'center center'
                      }}
                    >
                      {type.type_name}
                    </div>

                    {/* Shared Foundation Plate */}
                    <div className="absolute inset-0 bg-[#e5e7eb] border-2 border-black/10 shadow-2xl" 
                         style={{ transform: 'translateZ(-20px) scale(1.05)', borderRadius: '4px' }}>
                      <div className="absolute -bottom-5 left-0 w-full h-5 bg-[#d1d5db]" style={{ transformOrigin: 'top', transform: 'rotateX(-90deg)' }} />
                      <div className="absolute top-0 -right-5 h-full w-5 bg-[#9ca3af]" style={{ transformOrigin: 'left', transform: 'rotateY(90deg)' }} />
                    </div>

                    <div 
                      className="grid gap-16" 
                      style={{ 
                        gridTemplateColumns: `repeat(${cols}, 160px)`,
                        transformStyle: 'preserve-3d' 
                      }}
                    >
                      {zoneRooms.map(room => {
                        const activeBooking = bookings.find(b => b.room_id === room.id);
                        const isOccupied = activeBooking && activeBooking.status === 'checked_in';

                        let status: 'maintenance' | 'cleaning' | 'empty' | 'reserved' | 'occupied' = 'empty';
                        if (room.status === 'maintenance') status = 'maintenance';
                        else if (room.status === 'cleaning') status = 'cleaning';
                        else if (isOccupied) status = 'occupied';
                        else if (activeBooking && activeBooking.status === 'reserved') status = 'reserved';

                        return (
                          <HoverCard 
                            key={room.id} 
                            openDelay={200} 
                            closeDelay={300}
                            open={openHoverRoomId === room.id}
                            onOpenChange={(open) => setOpenHoverRoomId(open ? room.id : null)}
                          >
                            <HoverCardTrigger asChild>
                              <div style={{ transformStyle: 'preserve-3d' }}>
                                <RoomIsometricBlock
                                  type={type}
                                  status={status}
                                  onClick={() => handleRoomClick(room)}
                                >
                                  <RoomGlassCard
                                    room={room}
                                    type={type}
                                    activeBooking={activeBooking}
                                    size={140}
                                    onBook={() => handleRoomClick(room)}
                                    onOpenDetail={() => handleRoomClick(room)}
                                    onCleanFinish={() => markRoomClean.mutate(room.id)}
                                  />
                                </RoomIsometricBlock>
                              </div>
                            </HoverCardTrigger>
                            {activeBooking && (
                              <HoverCardContent
                                side="right"
                                align="start"
                                sideOffset={24}
                                className="w-[340px] p-0 border-none bg-transparent shadow-none outline-none"
                              >
                                <RoomDetailCard
                                  booking={activeBooking}
                                  room={room}
                                  onCheckout={() => {
                                    setOpenHoverRoomId(null);
                                    setCheckoutBookingId(activeBooking?.id || null);
                                  }}
                                  onEdit={() => {
                                    setOpenHoverRoomId(null);
                                    handleRoomClick(room);
                                  }}
                                />
                              </HoverCardContent>
                            )}
                          </HoverCard>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filteredRooms.length === 0 && (
            <div
              className="text-white/50 text-xl font-medium"
              style={{ transform: 'translateZ(10px) rotateZ(45deg) rotateX(-60deg)' }}
            >
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
          serviceMode={serviceMode}
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
