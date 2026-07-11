import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/store/useStore';
import { Settings, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { HotelRoomType, HotelRoom } from '@/store/types';
import { COLOR_MAP } from './roomColorMap';

const HotelSettingsTab = () => {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  const [isEditingType, setIsEditingType] = useState(false);
  const [isEditingRoom, setIsEditingRoom] = useState(false);
  const [editingType, setEditingType] = useState<Partial<HotelRoomType> | null>(null);
  const [editingRoom, setEditingRoom] = useState<Partial<HotelRoom> | null>(null);

  // Fetch Room Types
  const { data: roomTypes = [], isLoading: loadingTypes } = useQuery({
    queryKey: ['hotel_room_types', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hotel_room_types')
        .select('*')
        .eq('store_id', storeId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as HotelRoomType[];
    },
    enabled: !!storeId && storeId !== 'default-store',
  });

  // Fetch Rooms
  const { data: rooms = [], isLoading: loadingRooms } = useQuery({
    queryKey: ['hotel_rooms', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hotel_rooms')
        .select('*')
        .eq('store_id', storeId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!storeId && storeId !== 'default-store',
  });

  const saveRoomType = useMutation({
    mutationFn: async (type: Partial<HotelRoomType>) => {
      if (type.id) {
        const { error } = await supabase.from('hotel_room_types').update({
          type_name: type.typeName,
          color: type.color,
          sort_order: type.sortOrder
        }).eq('id', type.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('hotel_room_types').insert([{
          store_id: storeId,
          type_name: type.typeName,
          color: type.color || 'gray',
          sort_order: type.sortOrder || 0
        }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotel_room_types'] });
      setIsEditingType(false);
      setEditingType(null);
      toast.success('บันทึกประเภทห้องสำเร็จ');
    },
    onError: (err) => {
      toast.error('เกิดข้อผิดพลาด: ' + err.message);
    }
  });

  const deleteRoomType = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hotel_room_types').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotel_room_types'] });
      toast.success('ลบประเภทห้องสำเร็จ');
    }
  });

  const saveRoom = useMutation({
    mutationFn: async (room: Partial<HotelRoom>) => {
      const payload = {
        room_name: room.roomName,
        room_type_id: room.roomTypeId || null,
        price_per_night: room.pricePerNight || 0,
        capacity: room.capacity || 1,
        description: room.description || '',
        status: room.status || 'available',
        is_active: room.isActive !== false,
      };

      if (room.id) {
        const { error } = await supabase.from('hotel_rooms').update(payload).eq('id', room.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('hotel_rooms').insert([{
          store_id: storeId,
          ...payload
        }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotel_rooms'] });
      setIsEditingRoom(false);
      setEditingRoom(null);
      toast.success('บันทึกห้องพักสำเร็จ');
    },
    onError: (err) => {
      toast.error('เกิดข้อผิดพลาด: ' + err.message);
    }
  });

  const deleteRoom = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hotel_rooms').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotel_rooms'] });
      toast.success('ลบห้องพักสำเร็จ');
    }
  });

  return (
    <div className="space-y-8">
      {/* Room Types Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#1A1F3D]">ประเภทห้องพัก</h2>
          <button 
            onClick={() => { setEditingType({ typeName: '', color: 'gray', sortOrder: 0 }); setIsEditingType(true); }}
            className="px-4 py-2 bg-[#1A1F3D] text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#1A1F3D]/90"
          >
            <Plus size={16} />
            เพิ่มประเภท
          </button>
        </div>

        {isEditingType && editingType && (
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4 flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">ชื่อประเภท</label>
              <input 
                type="text" 
                value={editingType.typeName || ''} 
                onChange={(e) => setEditingType({...editingType, typeName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder="เช่น ห้องธรรมดา"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">สีสัญลักษณ์</label>
              <select 
                value={editingType.color || 'gray'} 
                onChange={(e) => setEditingType({...editingType, color: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                {Object.keys(COLOR_MAP).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => saveRoomType.mutate(editingType)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-bold hover:bg-green-600"
              >
                บันทึก
              </button>
              <button 
                onClick={() => { setIsEditingType(false); setEditingType(null); }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-300"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {roomTypes.map(type => {
            const colorConfig = COLOR_MAP[type.color || 'gray'];
            return (
              <div key={type.id} className={`p-4 rounded-xl border ${colorConfig?.border} ${colorConfig?.bg} flex justify-between items-center`}>
                <span className="font-bold">{type.typeName || type.type_name}</span>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingType({ id: type.id, typeName: type.typeName || type.type_name, color: type.color, sortOrder: type.sort_order }); setIsEditingType(true); }} className="text-gray-500 hover:text-blue-500">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => { if(confirm('ยืนยันการลบประเภทห้องนี้?')) deleteRoomType.mutate(type.id); }} className="text-gray-500 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Rooms Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#1A1F3D]">ห้องพักทั้งหมด</h2>
          <button 
            onClick={() => { setEditingRoom({ roomName: '', pricePerNight: 0, capacity: 1, status: 'available', isActive: true }); setIsEditingRoom(true); }}
            className="px-4 py-2 bg-[#1A1F3D] text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#1A1F3D]/90"
          >
            <Plus size={16} />
            เพิ่มห้องพัก
          </button>
        </div>

        {isEditingRoom && editingRoom && (
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">ชื่อห้อง/เลขห้อง</label>
              <input 
                type="text" 
                value={editingRoom.roomName || ''} 
                onChange={(e) => setEditingRoom({...editingRoom, roomName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">ประเภท</label>
              <select 
                value={editingRoom.roomTypeId || ''} 
                onChange={(e) => setEditingRoom({...editingRoom, roomTypeId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">เลือกประเภท</option>
                {roomTypes.map(t => <option key={t.id} value={t.id}>{t.typeName || t.type_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">ราคา/คืน</label>
              <input 
                type="number" 
                value={editingRoom.pricePerNight || 0} 
                onChange={(e) => setEditingRoom({...editingRoom, pricePerNight: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">รับได้สูงสุด (ตัว)</label>
              <input 
                type="number" 
                value={editingRoom.capacity || 1} 
                onChange={(e) => setEditingRoom({...editingRoom, capacity: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">สถานะ</label>
              <select 
                value={editingRoom.status || 'available'} 
                onChange={(e) => setEditingRoom({...editingRoom, status: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="available">ว่าง</option>
                <option value="maintenance">ปิดปรับปรุง</option>
              </select>
            </div>
            <div className="flex gap-2 w-full lg:w-auto">
              <button 
                onClick={() => saveRoom.mutate(editingRoom)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-bold hover:bg-green-600 flex-1"
              >
                บันทึก
              </button>
              <button 
                onClick={() => { setIsEditingRoom(false); setEditingRoom(null); }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-300 flex-1"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {rooms.map(room => {
            const type = roomTypes.find(t => t.id === room.room_type_id);
            const colorConfig = COLOR_MAP[(type?.color as keyof typeof COLOR_MAP) || 'gray'];
            return (
              <div key={room.id} className={`p-4 rounded-xl border ${colorConfig?.border} ${colorConfig?.bg} flex flex-col gap-2`}>
                <div className="flex justify-between items-start">
                  <span className="font-black text-lg">{room.room_name}</span>
                  <div className="flex gap-2">
                    <button onClick={() => { 
                      setEditingRoom({ 
                        id: room.id, 
                        roomName: room.room_name, 
                        roomTypeId: room.room_type_id,
                        pricePerNight: room.price_per_night,
                        capacity: room.capacity,
                        status: room.status,
                        isActive: room.is_active
                      }); 
                      setIsEditingRoom(true); 
                    }} className="text-gray-500 hover:text-blue-500">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => { if(confirm('ยืนยันการลบห้องพักนี้?')) deleteRoom.mutate(room.id); }} className="text-gray-500 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium opacity-80">{type?.type_name || 'ไม่ระบุประเภท'}</span>
                  <span className="font-bold">฿{room.price_per_night}/คืน</span>
                </div>
                <div className="flex justify-between text-xs mt-2">
                  <span>ความจุ: {room.capacity} ตัว</span>
                  <span className={room.status === 'available' ? 'text-green-600 font-bold' : 'text-amber-600 font-bold'}>
                    {room.status === 'available' ? 'ว่าง' : room.status === 'maintenance' ? 'ซ่อมบำรุง' : room.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HotelSettingsTab;
