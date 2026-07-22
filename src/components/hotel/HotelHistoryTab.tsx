import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/store/useStore';
import { format, parseISO, differenceInCalendarDays, startOfDay, endOfDay } from 'date-fns';
import { th } from 'date-fns/locale';
import { History, Search, Calendar, User, Home, ArrowRight, Filter, ChevronDown, Activity, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RoomTypeBadge } from './RoomTypeBadge';
import { DateRangeDropdown, DateRange } from '@/components/ui/date-range-dropdown';
import BookingDetailsModal from './BookingDetailsModal';

const HotelHistoryTab = () => {
  const { storeId } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [detailsModalBooking, setDetailsModalBooking] = useState<any | null>(null);

  // Fetch History Bookings
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['hotel_bookings_history', storeId],
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
        .in('status', ['checked_out', 'cancelled', 'checked_in'])
        .order('check_out_actual', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!storeId && storeId !== 'default-store',
  });

  const filteredBookings = bookings.filter((b: any) => {
    // 0. Date Range Filter
    if (dateRange && dateRange.from) {
      const checkIn = b.check_in_date ? parseISO(b.check_in_date) : null;
      if (!checkIn) return false;
      
      const from = startOfDay(dateRange.from);
      const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
      
      if (checkIn < from || checkIn > to) {
        return false;
      }
    }

    // 1. Status Filter
    const isOverdue = b.status === 'checked_in' && b.check_out_expected && new Date(b.check_out_expected) < new Date();
    const computedStatus = b.status === 'checked_in' ? (isOverdue ? 'overdue' : 'staying') : b.status;
    
    if (statusFilter !== 'all' && computedStatus !== statusFilter) {
      return false;
    }

    // 2. Search Query Filter
    const q = searchQuery.toLowerCase();
    const petName = b.pets?.name?.toLowerCase() || '';
    const ownerName = b.customers?.name?.toLowerCase() || '';
    const phone = b.customers?.phone || '';
    return petName.includes(q) || ownerName.includes(q) || phone.includes(q);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1A1F3D] flex items-center gap-2">
            <History className="text-[#1A1F3D]" size={24} />
            ประวัติการเข้าพักทั้งหมด
          </h2>
          <p className="text-sm text-gray-500 mt-1">รายการการเข้าพักทั้งหมด ทั้งที่กำลังเข้าพักและเช็คเอาท์ไปแล้ว</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto flex-wrap lg:flex-nowrap items-center">
          <DateRangeDropdown
            language="th"
            value={dateRange}
            onChange={(range) => setDateRange(range)}
            className="w-full sm:w-[240px] h-10 rounded-2xl border-slate-200 shadow-sm"
          />
          
          <div className="relative shrink-0 w-full sm:w-auto">
             <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} pointerEvents="none" />
             <select 
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value)}
               className="w-full sm:w-[180px] h-10 bg-white border border-slate-200 rounded-2xl pl-10 pr-10 text-sm font-normal text-slate-700 focus:outline-none focus:border-slate-300 transition-all shadow-sm appearance-none cursor-pointer"
             >
               <option value="all">สถานะทั้งหมด</option>
               <option value="staying">กำลังเข้าพัก</option>
               <option value="overdue">เกินเวลา</option>
               <option value="checked_out">เช็คเอาท์แล้ว</option>
               <option value="cancelled">ยกเลิก</option>
             </select>
             <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 opacity-50" size={16} pointerEvents="none" />
          </div>
          
          <div className="relative w-full sm:w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} pointerEvents="none" />
            <input
              type="text"
              placeholder="ค้นหาชื่อสัตว์เลี้ยง, เจ้าของ หรือเบอร์..."
              className="w-full h-10 bg-white border border-slate-200 rounded-2xl pl-10 pr-4 text-sm font-normal text-slate-700 focus:outline-none focus:border-slate-300 transition-all shadow-sm placeholder:text-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F6FA] border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap text-left">ข้อมูลผู้เข้าพัก</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap text-center">ห้องพัก</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap text-left">วันเข้าพัก - วันออก</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A1F3D] mx-auto mb-4"></div>
                    <p className="text-sm text-gray-500 font-bold">กำลังโหลดข้อมูลประวัติ...</p>
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                      <History size={32} />
                    </div>
                    <p className="text-base text-[#1A1F3D] font-bold">ไม่พบประวัติการเข้าพัก</p>
                    <p className="text-sm text-gray-500 mt-1">ยังไม่มีประวัติการเข้าพักในระบบ</p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking: any) => {
                  const checkIn = booking.check_in_date ? parseISO(booking.check_in_date) : null;
                  const checkOut = booking.check_out_actual ? parseISO(booking.check_out_actual) : (booking.check_out_expected ? parseISO(booking.check_out_expected) : null);
                  const nights = checkIn && checkOut ? Math.max(1, differenceInCalendarDays(checkOut, checkIn)) : 0;
                  const isOverdue = booking.status === 'checked_in' && booking.check_out_expected && new Date(booking.check_out_expected) < new Date();

                  return (
                    <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <img 
                            src={booking.pets?.image || `https://ui-avatars.com/api/?name=${booking.pets?.name || 'Pet'}&background=random`} 
                            alt={booking.pets?.name}
                            className="w-12 h-12 rounded-2xl object-cover shadow-sm border border-slate-100 shrink-0"
                          />
                          <div className="flex flex-col">
                            <div className="flex items-baseline gap-2">
                              <span className="text-base font-bold text-[#1A1F3D]">{booking.pets?.name || 'ไม่ทราบชื่อ'}</span>
                              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{booking.pets?.breed}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-600">
                              <User size={14} className="text-slate-400" />
                              <span>{booking.customers?.name}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1.5 items-center justify-center">
                          <span className="text-sm font-bold text-[#1A1F3D] whitespace-nowrap">
                            {booking.hotel_rooms?.room_name?.startsWith('ห้อง') ? booking.hotel_rooms.room_name : `ห้อง ${booking.hotel_rooms?.room_name}`}
                          </span>
                          {booking.hotel_rooms?.hotel_room_types && (
                            <RoomTypeBadge type={booking.hotel_rooms.hotel_room_types} className="text-xs px-2.5 py-0.5" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 text-sm font-bold text-[#1A1F3D] whitespace-nowrap">
                            <Calendar size={16} className="text-slate-400" />
                            <span>{checkIn ? format(checkIn, 'dd MMM yyyy', { locale: th }) : '-'}</span>
                            <ArrowRight size={14} className="text-slate-300 mx-1" />
                            <span>{checkOut ? format(checkOut, 'dd MMM yyyy', { locale: th }) : '-'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium ml-7">
                            <span>รวม {nights} คืน</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex flex-col items-center gap-2.5">
                          <span className={cn(
                            "px-4 py-1.5 text-xs font-bold rounded-full whitespace-nowrap inline-flex items-center justify-center",
                            booking.status === 'checked_out' 
                              ? "bg-[#EAFD69] text-[#1a1e00]"
                              : booking.status === 'checked_in'
                                ? isOverdue ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"
                                : "bg-[#FBE8E8] text-[#8E171D]"
                          )}>
                            {booking.status === 'checked_out' ? 'เช็คเอาท์แล้ว' : booking.status === 'checked_in' ? (isOverdue ? 'เกินเวลา' : 'กำลังเข้าพัก') : 'ยกเลิก'}
                          </span>
                          
                          <button 
                            onClick={() => setDetailsModalBooking(booking)}
                            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-[#1A1F3D] flex items-center justify-center transition-colors shadow-sm"
                            title="ดูรายละเอียดการเข้าพัก"
                          >
                            <Info size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {detailsModalBooking && (
        <BookingDetailsModal 
          booking={detailsModalBooking}
          onClose={() => setDetailsModalBooking(null)} 
        />
      )}
    </div>
  );
};

export default HotelHistoryTab;
