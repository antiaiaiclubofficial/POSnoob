import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/store/useStore';
import { Settings, Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { Reorder } from 'framer-motion';
import { HotelRoomType, HotelRoom } from '@/store/types';
import { COLOR_MAP } from './roomColorMap';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { SketchPicker } from 'react-color';

const CustomColorPicker = ({ color, onChange }: { color: string, onChange: (hex: string) => void }) => {
  return (
    <SketchPicker
      color={color || '#ffffff'}
      onChange={(newColor) => {
        onChange(newColor.hex);
      }}
      presetColors={[
        '#dce1ff', '#ffdad6', '#daed5b', '#d9d6fe', '#FBE8E8', '#ffffff',
        '#bac4f5', '#ffb4ab', '#bed041', '#c5c3ea', '#F3C2C2', '#18234a'
      ]}
      disableAlpha
    />
  );
};

const HotelSettingsTab = () => {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  const [isEditingType, setIsEditingType] = useState(false);
  const [isEditingRoom, setIsEditingRoom] = useState(false);
  const [editingType, setEditingType] = useState<Partial<HotelRoomType> | null>(null);
  const [editingRoom, setEditingRoom] = useState<Partial<HotelRoom> | null>(null);

  const [localRoomTypes, setLocalRoomTypes] = useState<HotelRoomType[]>([]);
  const [filterTypeId, setFilterTypeId] = useState<string>('all');

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
      return (data as any[]).map(d => ({
        ...d,
        typeName: d.type_name,
        sortOrder: d.sort_order
      })) as HotelRoomType[];
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

  useEffect(() => {
    setLocalRoomTypes(roomTypes);
  }, [roomTypes]);

  const updateSortOrder = useMutation({
    mutationFn: async (newOrder: HotelRoomType[]) => {
      await Promise.all(
        newOrder.map((type, index) =>
          supabase.from('hotel_room_types').update({ sort_order: index }).eq('id', type.id)
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotel_room_types'] });
      // Silent success for smooth dragging
    }
  });

  const handleReorder = (newOrder: HotelRoomType[]) => {
    setLocalRoomTypes(newOrder);
    updateSortOrder.mutate(newOrder);
  };

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
        <div className="flex justify-between items-center mb-[1.5rem]">
          <h2 className="text-[24px] font-bold text-[#020d35]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>ประเภทห้องพัก</h2>
          <button 
            onClick={() => { setEditingType({ typeName: '', color: 'gray', sortOrder: 0 }); setIsEditingType(true); }}
            className="px-[1.5rem] py-[0.75rem] bg-gradient-to-br from-[#18234a] to-[#020d35] text-white rounded-[3rem] text-[14px] font-bold flex items-center gap-2 hover:-translate-y-0.5 transition-transform shadow-[0_10px_25px_-5px_rgba(24,35,74,0.3)]"
            style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}
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
              <label className="block text-xs font-bold text-gray-500 mb-1">สีสัญลักษณ์ (รหัสสี HEX)</label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <button 
                      className="w-10 h-10 border border-gray-200 rounded-lg cursor-pointer"
                      style={{ backgroundColor: editingType.color?.startsWith('#') ? editingType.color : '#cccccc' }}
                    />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-0 shadow-none bg-transparent" align="start">
                    <CustomColorPicker 
                      color={editingType.color || ''} 
                      onChange={(hex) => setEditingType({...editingType, color: hex as any})} 
                    />
                  </PopoverContent>
                </Popover>
                <input 
                  type="text" 
                  value={editingType.color || ''}
                  onChange={(e) => setEditingType({...editingType, color: e.target.value as any})}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm uppercase"
                  placeholder="#HEXCODE"
                />
              </div>
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

        <Reorder.Group 
          axis="x"
          values={localRoomTypes}
          onReorder={handleReorder}
          className="flex flex-wrap gap-[1rem]"
        >
          {localRoomTypes.map(type => {
            const isHex = type.color?.startsWith('#');
            const colorConfig = !isHex ? COLOR_MAP[type.color || 'gray'] : null;
            return (
              <Reorder.Item key={type.id} value={type} className="min-w-[250px] flex-1 cursor-grab active:cursor-grabbing">
                <div 
                  className={`p-[1.5rem] h-full rounded-[2rem] border-2 shadow-[0_4px_16px_rgba(24,35,74,0.03)] bg-white ${colorConfig ? colorConfig.border : ''} flex justify-between items-center`} 
                  style={{ 
                    fontFamily: '"IBM Plex Sans Thai", sans-serif',
                    ...(isHex ? { borderColor: type.color } : {})
                  }}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical size={20} className="text-gray-400" />
                    <span className="font-bold text-[#1A1F3D]">{type.typeName}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingType({ id: type.id, typeName: type.typeName, color: type.color, sortOrder: type.sortOrder }); setIsEditingType(true); }} className="text-gray-400 hover:text-[#18234a] transition-colors">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => { if(confirm('ยืนยันการลบประเภทห้องนี้?')) deleteRoomType.mutate(type.id); }} className="text-gray-400 hover:text-[#8E171D] transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      </div>

      <hr className="border-gray-100" />

      {/* Rooms Section */}
      <div>
        <div className="flex justify-between items-center mb-[1.5rem]">
          <h2 className="text-[24px] font-bold text-[#020d35]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>ห้องพักทั้งหมด</h2>
          <button 
            onClick={() => { setEditingRoom({ roomName: '', pricePerNight: 0, capacity: 1, status: 'available', isActive: true }); setIsEditingRoom(true); }}
            className="px-[1.5rem] py-[0.75rem] bg-gradient-to-br from-[#18234a] to-[#020d35] text-white rounded-[3rem] text-[14px] font-bold flex items-center gap-2 hover:-translate-y-0.5 transition-transform shadow-[0_10px_25px_-5px_rgba(24,35,74,0.3)]"
            style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}
          >
            <Plus size={16} />
            เพิ่มห้องพัก
          </button>
        </div>

        {/* Filter Section */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
          <button
            onClick={() => setFilterTypeId('all')}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${filterTypeId === 'all' ? 'bg-[#020d35] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            ทั้งหมด
          </button>
          {roomTypes.map(type => (
            <button
              key={type.id}
              onClick={() => setFilterTypeId(type.id)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${filterTypeId === type.id ? 'bg-[#020d35] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {type.typeName}
            </button>
          ))}
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
                {roomTypes.map(t => <option key={t.id} value={t.id}>{t.typeName}</option>)}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[1rem]">
          {[...rooms]
            .sort((a, b) => {
              const typeAIndex = roomTypes.findIndex(t => t.id === a.room_type_id);
              const typeBIndex = roomTypes.findIndex(t => t.id === b.room_type_id);
              const safeA = typeAIndex === -1 ? 999 : typeAIndex;
              const safeB = typeBIndex === -1 ? 999 : typeBIndex;
              if (safeA !== safeB) {
                return safeA - safeB;
              }
              return (a.sort_order || 0) - (b.sort_order || 0);
            })
            .filter(r => filterTypeId === 'all' || r.room_type_id === filterTypeId)
            .map(room => {
            const type = roomTypes.find(t => t.id === room.room_type_id);
            const isHex = type?.color?.startsWith('#');
            const colorConfig = !isHex ? COLOR_MAP[(type?.color as keyof typeof COLOR_MAP) || 'gray'] : null;
            return (
              <div key={room.id} 
                className={`p-[1.5rem] rounded-[2rem] border-2 shadow-[0_4px_16px_rgba(24,35,74,0.03)] bg-white ${colorConfig ? colorConfig.border : ''} flex flex-col gap-[0.5rem]`} 
                style={{ 
                  fontFamily: '"IBM Plex Sans Thai", sans-serif',
                  ...(isHex ? { borderColor: type?.color } : {})
                }}
              >
                <div className="flex justify-between items-start">
                  <span className="font-black text-[20px] text-[#020d35]">{room.room_name}</span>
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
                    }} className="text-gray-400 hover:text-[#18234a] transition-colors">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => { if(confirm('ยืนยันการลบห้องพักนี้?')) deleteRoom.mutate(room.id); }} className="text-gray-400 hover:text-[#8E171D] transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between text-[14px]">
                  <span className="font-medium opacity-80">{type?.typeName || 'ไม่ระบุประเภท'}</span>
                  <span className="font-bold">฿{room.price_per_night}/คืน</span>
                </div>
                <div className="flex justify-between text-[12px] mt-2">
                  <span>ความจุ: {room.capacity} ตัว</span>
                  <span className={room.status === 'available' ? 'text-[#18234a] font-bold bg-[#18234a]/10 px-2 py-0.5 rounded-full' : 'text-[#C5805D] font-bold bg-[#C5805D]/10 px-2 py-0.5 rounded-full'}>
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
