import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/store/useStore';
import { format, isToday, parseISO } from 'date-fns';
import { BedDouble, CheckSquare, LogOut, CheckCircle2 } from 'lucide-react';
import { HotelBooking, HotelActivity, HotelRoom } from '@/store/types';

const HotelDashboardTab = () => {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-[#f3f3f3] rounded-[2rem] flex items-center gap-4 transition-transform hover:-translate-y-1">
          <div className="w-14 h-14 bg-[#ffffff] text-[#18234a] rounded-2xl flex items-center justify-center shadow-sm">
            <BedDouble size={26} />
          </div>
          <div>
            <p className="text-sm font-bold text-[#45464e]">อัตราการเข้าพัก (Occupancy)</p>
            <p className="text-3xl font-black text-[#1A1F3D] mt-1">{occupancyRate}% <span className="text-sm font-medium text-gray-500">({occupiedRooms}/{totalRooms})</span></p>
          </div>
        </div>

        <div className="p-6 bg-[#f3f3f3] rounded-[2rem] flex items-center gap-4 transition-transform hover:-translate-y-1">
          <div className="w-14 h-14 bg-[#ffffff] text-[#8E171D] rounded-2xl flex items-center justify-center shadow-sm">
            <CheckSquare size={26} />
          </div>
          <div>
            <p className="text-sm font-bold text-[#45464e]">รอเช็คอินวันนี้</p>
            <p className="text-3xl font-black text-[#1A1F3D] mt-1">{todayCheckIns.length} <span className="text-sm font-medium text-gray-500">ห้อง</span></p>
          </div>
        </div>

        <div className="p-6 bg-[#f3f3f3] rounded-[2rem] flex items-center gap-4 transition-transform hover:-translate-y-1">
          <div className="w-14 h-14 bg-[#ffffff] text-[#C5805D] rounded-2xl flex items-center justify-center shadow-sm">
            <LogOut size={26} />
          </div>
          <div>
            <p className="text-sm font-bold text-[#45464e]">รอเช็คเอาท์วันนี้</p>
            <p className="text-3xl font-black text-[#1A1F3D] mt-1">{todayCheckOuts.length} <span className="text-sm font-medium text-gray-500">ห้อง</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activities List */}
        <div className="bg-[#ffffff] rounded-[2rem] p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-black text-[#1A1F3D] mb-4">กิจกรรมสัตว์เลี้ยงวันนี้</h3>
          {activities.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">ไม่มีกิจกรรมสำหรับวันนี้</p>
          ) : (
            <div className="space-y-4">
              {activities.map(activity => (
                <div key={activity.id} className="flex items-center justify-between p-4 rounded-2xl bg-[#f9f9f9] transition-colors">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => { if(activity.status !== 'done') completeActivity.mutate(activity.id); }}
                      className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${activity.status === 'done' ? 'bg-[#EAFD69] border-[#EAFD69] text-[#1A1F3D]' : 'border-gray-300 text-transparent hover:border-[#EAFD69] hover:text-[#EAFD69]'}`}
                    >
                      <CheckCircle2 size={16} />
                    </button>
                    <div>
                      <p className="text-sm font-bold text-[#1A1F3D]">
                        {activity.title || activity.activity_type} 
                        <span className="text-gray-400 font-medium ml-2 text-xs">({activity.hotel_bookings?.pets?.name} - ห้อง {activity.hotel_bookings?.hotel_rooms?.room_name})</span>
                      </p>
                      <p className="text-xs text-[#45464e] mt-1">{format(parseISO(activity.scheduled_time), 'HH:mm')} {activity.note && `- ${activity.note}`}</p>
                    </div>
                  </div>
                  {activity.status === 'done' && (
                    <span className="text-[10px] font-bold bg-[#EAFD69]/20 text-[#1A1F3D] px-2 py-1 rounded-full uppercase tracking-wider">เสร็จแล้ว</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Check-outs Today */}
        <div className="bg-[#ffffff] rounded-[2rem] p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-black text-[#1A1F3D] mb-4">รอเช็คเอาท์วันนี้</h3>
          {todayCheckOuts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">ไม่มีการเช็คเอาท์วันนี้</p>
          ) : (
            <div className="space-y-4">
              {todayCheckOuts.map(booking => (
                <div key={booking.id} className="flex flex-col gap-2 p-4 rounded-2xl bg-[#f3f3f3]">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-[#1A1F3D]">{booking.pets?.name}</p>
                      <p className="text-xs text-[#45464e] mt-1">เจ้าของ: {booking.customers?.display_name || booking.customers?.first_name}</p>
                      <p className="text-xs text-[#45464e]">ห้อง: {booking.hotel_rooms?.room_name}</p>
                    </div>
                    {/* Add Checkout Button later via HotelCheckoutModal */}
                    <span className="text-[10px] font-bold bg-[#C5805D]/10 text-[#C5805D] px-2 py-1 rounded-full uppercase tracking-wider">รอเช็คเอาท์</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HotelDashboardTab;
