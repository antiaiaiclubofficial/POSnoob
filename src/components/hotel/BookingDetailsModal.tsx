import React from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, Activity, Clock, Info, User, Phone, Home, Calendar, StickyNote } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { th } from 'date-fns/locale';
import { RoomTypeBadge } from './RoomTypeBadge';

interface BookingDetailsModalProps {
  booking: any;
  onClose: () => void;
}

const BookingDetailsModal = ({ booking, onClose }: BookingDetailsModalProps) => {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['booking_activities_history', booking?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hotel_activities')
        .select('*')
        .eq('booking_id', booking.id)
        .order('scheduled_time', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!booking?.id,
  });

  if (!booking) return null;

  const checkIn = booking.check_in_date ? parseISO(booking.check_in_date) : null;
  const checkOutExp = booking.check_out_expected ? parseISO(booking.check_out_expected) : null;
  const checkOutAct = booking.check_out_actual ? parseISO(booking.check_out_actual) : null;
  const totalNights = (checkIn && checkOutExp) ? Math.max(1, differenceInCalendarDays(checkOutExp, checkIn)) : 0;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-slate-50 w-[95%] max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-white">
          <div>
            <h2 className="text-xl font-bold text-[#1A1F3D] flex items-center gap-2">
              <Info className="text-indigo-500" size={24} />
              รายละเอียดการเข้าพัก
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* ข้อมูลพื้นฐาน */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5"><User size={14}/> เจ้าของ & สัตว์เลี้ยง</p>
              <div className="space-y-1">
                <p className="text-base font-bold text-[#1A1F3D]">{booking.pets?.name}</p>
                <p className="text-sm text-slate-600">เจ้าของ: {booking.customers?.display_name || booking.customers?.first_name}</p>
                {booking.customers?.phone && <p className="text-sm text-slate-600 flex items-center gap-1"><Phone size={12}/> {booking.customers.phone}</p>}
              </div>
            </div>
            
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Home size={14}/> ห้องพัก</p>
              <div className="space-y-2">
                <p className="text-base font-bold text-[#1A1F3D]">{booking.hotel_rooms?.room_name}</p>
                {booking.hotel_rooms?.hotel_room_types && (
                  <div><RoomTypeBadge type={booking.hotel_rooms.hotel_room_types} className="text-xs px-2.5 py-0.5" /></div>
                )}
              </div>
            </div>
          </div>

          {/* ข้อมูลการเข้าพัก */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5"><Calendar size={14}/> ระยะเวลาเข้าพัก ({totalNights} คืน)</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">เช็คอิน</p>
                <p className="text-sm font-bold text-[#1A1F3D]">{checkIn ? format(checkIn, 'd MMM yyyy, HH:mm', { locale: th }) : '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">กำหนดเช็คเอาท์</p>
                <p className="text-sm font-bold text-[#1A1F3D]">{checkOutExp ? format(checkOutExp, 'd MMM yyyy, HH:mm', { locale: th }) : '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">เช็คเอาท์จริง</p>
                <p className="text-sm font-bold text-[#1A1F3D]">{checkOutAct ? format(checkOutAct, 'd MMM yyyy, HH:mm', { locale: th }) : '-'}</p>
              </div>
            </div>
            
            {booking.special_requests && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><StickyNote size={14}/> หมายเหตุ / คำขอพิเศษ</p>
                <p className="text-sm text-slate-700 bg-amber-50 p-3 rounded-xl border border-amber-100">{booking.special_requests}</p>
              </div>
            )}
          </div>

          {/* ประวัติกิจกรรม */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-1.5"><Activity size={14}/> ประวัติกิจกรรมระหว่างพัก</p>
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1A1F3D] mb-3"></div>
                <p className="text-xs text-slate-500">กำลังโหลด...</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-sm text-slate-500">ไม่มีการบันทึกกิจกรรมสำหรับการเข้าพักนี้</p>
              </div>
            ) : (
              <div className="space-y-5 px-2">
                {activities.map((activity: any, index: number) => {
                  const actTime = parseISO(activity.scheduled_time);
                  const isOverdue = activity.status !== 'done' && actTime < new Date();
                  
                  return (
                    <div key={activity.id} className="relative flex gap-4">
                      {/* Timeline Line */}
                      {index !== activities.length - 1 && (
                        <div className="absolute left-[15px] top-[32px] bottom-[-20px] w-0.5 bg-slate-100"></div>
                      )}
                      
                      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center z-10 ${
                        activity.status === 'done' 
                          ? 'bg-[#EAFD69] text-[#1A1F3D]' 
                          : isOverdue 
                            ? 'bg-red-100 text-red-500' 
                            : 'bg-slate-100 text-slate-400'
                      }`}>
                        {activity.status === 'done' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                      </div>
                      
                      <div className="flex-1 pb-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className={`text-sm font-bold ${activity.status === 'done' ? 'text-slate-400 line-through' : isOverdue ? 'text-red-600' : 'text-[#1A1F3D]'}`}>
                              {activity.title || activity.activity_type}
                              {activity.note && ` - ${activity.note}`}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {format(actTime, 'd MMM yyyy, HH:mm', { locale: th })}
                            </p>
                          </div>
                          
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider shrink-0 ${
                            activity.status === 'done' 
                              ? 'bg-[#EAFD69] text-[#1a1e00]' 
                              : isOverdue 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-slate-100 text-slate-600'
                          }`}>
                            {activity.status === 'done' ? 'เสร็จแล้ว' : isOverdue ? 'เลยเวลา' : 'รอดำเนินการ'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BookingDetailsModal;
