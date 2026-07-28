import React from 'react';
import { format, parseISO, isAfter, subHours } from 'date-fns';
import { Activity, BedDouble, CheckSquare, CheckCircle2, Edit3 } from 'lucide-react';
import { RoomTypeBadge } from './RoomTypeBadge';

interface RoomDetailCardProps {
  booking: any;
  room: any;
  activities?: any[];
  onToggleActivity?: (activityId: string, currentStatus: string) => void;
  onCheckout: () => void;
  onEdit?: () => void;
}

export const RoomDetailCard: React.FC<RoomDetailCardProps> = ({
  booking,
  room,
  activities = [],
  onToggleActivity,
  onCheckout,
  onEdit,
}) => {
  if (!booking) return null;
  return (
    <div 
      onClick={(e) => e.stopPropagation()}
      className="bg-[#ffffff] rounded-[2rem] p-[1.5rem] shadow-[0_8px_32px_rgba(24,35,74,0.04)] flex flex-col gap-[1rem] relative overflow-hidden group w-full border border-gray-100"
    >
      {/* Inner Frosted Glow Effect */}
      <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-gradient-to-br from-white/80 to-transparent -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none"></div>

      {/* 1. หัวการ์ด: Avatar + Pet Name + Status Badge */}
      <div className="flex justify-between items-center relative z-10">
        <div className="flex items-center gap-[0.75rem]">
          <div className="w-[3rem] h-[3rem] rounded-full bg-[#f3f3f3] flex items-center justify-center text-[#020d35] shrink-0 overflow-hidden">
            {booking.pets?.image_url ? (
              <img src={booking.pets.image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Activity size={20} />
            )}
          </div>
          <span className="text-[20px] font-bold text-[#1a1c1c] truncate max-w-[150px]" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
            {booking.pets?.name || 'ไม่ระบุชื่อ'}
          </span>
        </div>
        {(() => {
          const expectedDate = booking.check_out_expected ? parseISO(booking.check_out_expected) : null;
          const isOverdue = booking.status === 'checked_in' && expectedDate && isAfter(new Date(), expectedDate);
          const isWaitingForPickup = booking.status === 'checked_in' && expectedDate && !isOverdue && isAfter(new Date(), subHours(expectedDate, 1));
          
          let statusText = 'รอเช็คอิน';
          let statusClass = 'bg-orange-100 text-orange-600';

          if (booking.status === 'checked_in') {
            if (isOverdue) {
              statusText = 'เลยเวลา';
              statusClass = 'bg-red-100 text-red-600 border border-red-200';
            } else if (isWaitingForPickup) {
              statusText = 'รอรับกลับ';
              statusClass = 'bg-yellow-100 text-yellow-600 border border-yellow-200';
            } else {
              statusText = 'เข้าพักอยู่';
              statusClass = 'bg-[#f3f3f3] text-[#45464E]';
            }
          } else if (booking.status === 'checked_out') {
            statusText = 'เช็คเอาท์แล้ว';
            statusClass = 'bg-gray-100 text-gray-500';
          }
          return (
            <div className={`px-[1rem] py-[0.25rem] rounded-full text-[12px] font-bold whitespace-nowrap shadow-sm ${statusClass}`}>
              {statusText}
            </div>
          );
        })()}
      </div>

      {/* 2. แถว stat: ไอคอน + พื้นที่ + Badge VIP */}
      <div className="flex items-center gap-[0.5rem] mt-[0.5rem] relative z-10 flex-wrap">
        <BedDouble size={16} className="text-[#45464E]" />
        <span className="text-[14px] text-[#45464E] font-medium" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
          ห้อง: {room?.room_name || '-'}
        </span>
        {room?.hotel_room_types && (
          <RoomTypeBadge type={room.hotel_room_types} className="text-[10px]" />
        )}
      </div>

      {/* 3. เจ้าของสัตว์เลี้ยง + ไอคอนจำนวนกิจกรรมค้าง */}
      <div className="flex justify-between items-center text-[15px] text-[#45464E] relative z-10 border-b border-gray-100 pb-4" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
        <span className="truncate pr-[1rem]">เจ้าของ: {booking.customers?.display_name || booking.customers?.first_name || '-'}</span>
        <div className="flex items-center gap-[0.25rem] shrink-0">
          <CheckSquare size={16} className="text-[#1a1c1c]" />
          <span className="font-black text-[16px] text-[#1a1c1c]">{activities.filter(a => a.status !== 'done').length}</span>
        </div>
      </div>

      {/* 4. รายการกิจกรรมย่อย */}
      <div className="flex flex-col gap-[0.5rem] mt-[0.5rem] relative z-10 max-h-[150px] overflow-y-auto pr-1 scrollbar-thin">
        {activities.length === 0 ? (
          <span className="text-[12px] text-[#45464E] font-medium" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>ไม่มีกิจกรรม</span>
        ) : (
          activities.map((act) => {
            const activityTime = parseISO(act.scheduled_time);
            const isOverdue = act.status !== 'done' && activityTime < new Date();
            return (
              <div key={act.id} className="flex items-center justify-between group/act bg-[#f9f9f9] p-[0.75rem] rounded-[1.5rem] hover:bg-[#f3f3f3] transition-colors border border-transparent hover:border-gray-200">
                <div className="flex items-center gap-[0.5rem]">
                  <button
                    onClick={() => onToggleActivity && onToggleActivity(act.id, act.status)}
                    className={`w-[1.75rem] h-[1.75rem] rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      act.status === 'done' 
                        ? 'bg-[#daed5b] text-[#1a1e00]' 
                        : isOverdue 
                          ? 'bg-red-100 text-red-500 hover:bg-red-200' 
                          : 'bg-[#e2e2e2] text-transparent hover:bg-[#daed5b] hover:text-[#1a1e00]'
                    }`}
                  >
                    <CheckCircle2 size={16} />
                  </button>
                  <span className={`text-[13px] font-bold leading-tight ${act.status === 'done' ? 'text-gray-400 line-through' : isOverdue ? 'text-red-600' : 'text-[#1a1c1c]'}`} style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                    {act.title || act.activity_type}{act.note && ` - ${act.note}`}
                  </span>
                </div>
                <span className={`text-[11px] font-black px-[0.75rem] py-[0.25rem] rounded-full ${act.status === 'done' ? 'text-gray-400' : isOverdue ? 'text-red-500 bg-red-50' : 'text-[#45464E] bg-[#e2e2e2]'}`} style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                  {format(activityTime, 'HH:mm')}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Actions / Footer */}
      <div className="mt-auto pt-[1.5rem] flex justify-between items-center border-t-0 relative z-10">
        <span className="text-[12px] text-[#45464E] truncate w-[50%] font-medium" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
          Ref: {booking.id.substring(0,8)}
        </span>
        <div className="flex gap-[0.5rem]">
          {onEdit && (
            <button
              onClick={onEdit}
              className="w-[2.5rem] h-[2.5rem] bg-[#f3f3f3] hover:bg-[#e8e8e8] text-[#45464E] rounded-full flex items-center justify-center transition-colors shrink-0"
            >
              <Edit3 size={16} />
            </button>
          )}
          {booking.status === 'checked_in' && (
            <button
              onClick={onCheckout}
              className="text-[13px] font-black bg-[#d9d6fe] hover:brightness-95 text-[#191836] px-[1.25rem] h-[2.5rem] flex items-center justify-center rounded-full tracking-wider transition-all cursor-pointer shadow-sm whitespace-nowrap"
            >
              เช็คเอาท์
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
