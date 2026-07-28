import React, { useState, useMemo } from 'react';
import { format, parseISO, isSameDay, isBefore, isAfter, startOfDay, endOfDay, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, addMonths, isSameMonth, subHours } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { RoomDetailCard } from './RoomDetailPopover';
import { useStore } from '@/store/useStore';

interface HotelTimelineViewProps {
  rooms: any[];
  bookings: any[];
  activities: any[];
  serviceMode: 'hotel' | 'daycare';
  onToggleActivity: (activityId: string, currentStatus: string) => void;
  onCheckout: (bookingId: string) => void;
  onCheckout: (bookingId: string) => void;
  onEdit?: (booking: any) => void;
  onCreateBooking?: (date: Date) => void;
}

export const HotelTimelineView: React.FC<HotelTimelineViewProps> = ({ rooms, bookings, activities, serviceMode, onToggleActivity, onCheckout, onEdit, onCreateBooking }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'Day' | 'Week' | 'Month'>('Month');
  const [openHoverCardId, setOpenHoverCardId] = useState<string | null>(null);
  
  const { openTime, closeTime } = useStore();
  
  const { openHour, closeHour, totalMinutes, hoursArray } = useMemo(() => {
    const open = parseInt(openTime.split(':')[0] || '9');
    const close = parseInt(closeTime.split(':')[0] || '19');
    return {
      openHour: open,
      closeHour: close,
      totalMinutes: (close - open) * 60,
      hoursArray: Array.from({ length: close - open + 1 }, (_, i) => open + i)
    };
  }, [openTime, closeTime]);

  const roomMap = useMemo(() => {
    return rooms.reduce((acc, room) => {
      acc[room.id] = {
        room,
        type: room.hotel_room_types || { type_name: 'อื่นๆ', color: '#6b7280' }
      };
      return acc;
    }, {} as Record<string, any>);
  }, [rooms]);

  const { startDate, endDate, columns } = useMemo(() => {
    let start: Date, end: Date, cols: Date[];

    if (viewMode === 'Day') {
      start = startOfDay(currentDate);
      end = endOfDay(currentDate);
      cols = [currentDate];
    } else if (viewMode === 'Week') {
      start = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday
      end = endOfDay(endOfWeek(currentDate, { weekStartsOn: 0 }));
      cols = eachDayOfInterval({ start, end });
    } else { // Month
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      start = startOfWeek(monthStart, { weekStartsOn: 0 });
      end = endOfDay(endOfWeek(monthEnd, { weekStartsOn: 0 }));
      cols = eachDayOfInterval({ start, end });
    }

    return { startDate: start, endDate: end, columns: cols };
  }, [currentDate, viewMode]);

  const handlePrev = () => {
    if (viewMode === 'Day') setCurrentDate(subDays(currentDate, 1));
    else if (viewMode === 'Week') setCurrentDate(subDays(currentDate, 7));
    else setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === 'Day') setCurrentDate(addDays(currentDate, 1));
    else if (viewMode === 'Week') setCurrentDate(addDays(currentDate, 7));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const isOverlap = (booking: any, day: Date) => {
    const bStart = startOfDay(parseISO(booking.check_in_date));
    let bEnd = endOfDay(parseISO(booking.check_out_actual || booking.check_out_expected || new Date().toISOString()));
    
    // If still checked_in, it physically occupies the space until at least today
    if (booking.status === 'checked_in' && isBefore(bEnd, startOfDay(new Date()))) {
      bEnd = endOfDay(new Date());
    }
    
    return !isBefore(day, bStart) && !isAfter(day, bEnd);
  };

  const renderBookingBlock = (booking: any, isCompact: boolean, currentDay?: Date) => {
    const roomInfo = roomMap[booking.room_id];
    const pendingActivities = activities.filter(a => a.booking_id === booking.id && a.status !== 'done').length;

    if (viewMode === 'Day' && serviceMode === 'hotel') {
      return (
        <RoomDetailCard
          key={booking.id}
          booking={booking}
          room={roomInfo?.room}
          activities={activities.filter(a => a.booking_id === booking.id)}
          onToggleActivity={onToggleActivity}
          onCheckout={() => onCheckout(booking.id)}
          onEdit={() => onEdit && onEdit(booking)}
        />
      );
    }

    const colorHex = roomInfo?.type?.color || '#020d35';
    const roomName = roomInfo?.room?.room_name || 'ไม่ระบุห้อง';

    // คำนวณสีตัวอักษรให้ตัดกับสีพื้นหลังของประเภทห้อง
    const cleanHex = colorHex.replace('#', '');
    const r = parseInt(cleanHex.slice(0, 2), 16) || 0;
    const g = parseInt(cleanHex.slice(2, 4), 16) || 0;
    const b = parseInt(cleanHex.slice(4, 6), 16) || 0;
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    const textColor = yiq >= 128 ? '#1a1c1c' : '#ffffff';

    const expectedDate = booking.check_out_expected ? parseISO(booking.check_out_expected) : null;
    const isOverdue = booking.status === 'checked_in' && expectedDate && isAfter(new Date(), expectedDate);
    const isWaitingForPickup = booking.status === 'checked_in' && expectedDate && !isOverdue && isAfter(new Date(), subHours(expectedDate, 1));
    const bgClass = isOverdue ? 'bg-red-50' : isWaitingForPickup ? 'bg-yellow-50' : booking.status === 'checked_in' ? 'bg-[#f3f3f3]' : 'bg-orange-100';

    const cardId = currentDay ? `${booking.id}-${currentDay.toISOString()}` : booking.id;

    return (
      <HoverCard 
        key={booking.id} 
        openDelay={200} 
        closeDelay={200}
        open={openHoverCardId === cardId}
        onOpenChange={(open) => setOpenHoverCardId(open ? cardId : null)}
      >
        <HoverCardTrigger asChild>
          <div
            onClick={(e) => e.stopPropagation()}
            className={`px-3 py-2 flex items-center gap-2.5 shadow-sm hover:shadow-md transition-all cursor-pointer rounded-full relative z-10 w-full mb-1.5 hover:scale-[1.02] origin-left border border-white/50 ${bgClass}`}
          >
            {/* The Room Bubble */}
            <div
              className="px-2.5 py-0.5 rounded-full text-[11px] font-black shrink-0 uppercase shadow-sm tracking-wide"
              style={{ backgroundColor: colorHex, color: textColor }}
            >
              {roomInfo?.type?.type_name || roomName.substring(0, 5)}
            </div>

            <div className="flex items-center gap-1.5 truncate w-full">
              <span className="text-[13px] font-bold text-[#1a1c1c] truncate" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
                {booking.pets?.name || 'ไม่ระบุ'}
              </span>
              <span className="text-[10px] font-medium text-gray-500 shrink-0">
                {format(parseISO(booking.check_in_date), 'HH:mm')}
              </span>
            </div>

            {pendingActivities > 0 && (
              <div className="flex items-center justify-center bg-[#ef4444] text-white w-[1.125rem] h-[1.125rem] rounded-full text-[10px] font-bold shadow-sm shrink-0 ml-auto">
                {pendingActivities}
              </div>
            )}
          </div>
        </HoverCardTrigger>
        <HoverCardContent
          side="top"
          align="center"
          sideOffset={8}
          avoidCollisions={true}
          className="w-[360px] p-0 border-none shadow-2xl bg-transparent z-[9999]"
        >
          <RoomDetailCard
            booking={booking}
            room={roomInfo?.room}
            activities={activities.filter(a => a.booking_id === booking.id)}
            onToggleActivity={onToggleActivity}
            onCheckout={() => {
              setOpenHoverCardId(null);
              onCheckout(booking.id);
            }}
            onEdit={() => {
              setOpenHoverCardId(null);
              if (onEdit) onEdit(booking);
            }}
          />
        </HoverCardContent>
      </HoverCard>
    );
  };

  return (
    <div className="flex flex-col min-h-[600px] mb-8">

      {/* Header */}
      <div className="flex items-center justify-between p-[1.5rem] bg-white rounded-[2rem] shadow-[0_8px_32px_rgba(24,35,74,0.04)] border border-gray-100 shrink-0 mb-6">
        <div className="flex items-center gap-[1rem]">
          <h2 className="text-[24px] font-semibold text-[#1a1c1c] leading-none" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
            ปฏิทินการเข้าพัก
          </h2>
          <div className="flex items-center bg-white rounded-full p-[0.25rem] shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100">
            <button onClick={handlePrev} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
              <ChevronLeft size={16} />
            </button>
            <div className="px-[1rem] py-[0.25rem] font-medium text-[14px] text-[#1a1c1c] flex items-center gap-2 min-w-[160px] justify-center" style={{ fontFamily: '"IBM Plex Sans Thai", sans-serif' }}>
              <CalendarIcon size={14} className="text-gray-400" />
              {viewMode === 'Day' && format(currentDate, 'dd MMM yyyy')}
              {viewMode === 'Week' && `${format(startDate, 'dd MMM')} - ${format(endDate, 'dd MMM')}`}
              {viewMode === 'Month' && format(currentDate, 'MMMM yyyy')}
            </div>
            <button onClick={handleNext} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
              <ChevronRight size={16} />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="ml-2 px-4 py-1.5 text-xs font-bold bg-[#f3f3f3] hover:bg-[#e2e2e2] text-[#1a1c1c] rounded-full transition-colors">
              วันนี้
            </button>
          </div>
        </div>

        <div className="flex items-center bg-white rounded-full p-[0.25rem] shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100">
          {['Day', 'Week', 'Month'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as any)}
              className={`px-[1.25rem] py-[0.5rem] rounded-full text-[12px] font-bold transition-all ${viewMode === mode ? 'bg-[#1a1c1c] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Grid Body */}
      <div className={`flex-1 flex flex-col ${viewMode !== 'Day' ? 'bg-white rounded-[2rem] shadow-[0_8px_32px_rgba(24,35,74,0.04)] border border-gray-100 overflow-hidden' : ''}`}>
        {/* Days of Week Header (Only for Month & Week) */}
        {viewMode !== 'Day' && (
          <div className="grid grid-cols-7 border-b border-gray-100 shrink-0">
            {['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสฯ', 'ศุกร์', 'เสาร์'].map((day, i) => (
              <div key={day} className={`text-center font-bold text-[12px] py-3 text-gray-400 ${i !== 6 ? 'border-r border-gray-100' : ''}`}>
                {day}
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 w-full flex flex-col">
          {viewMode === 'Month' && (
            <div className="flex-1 grid grid-cols-7 auto-rows-[minmax(120px,1fr)]">
              {columns.map((day, idx) => {
                const dayBookings = bookings.filter(b => isOverlap(b, day));
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isPastDay = isBefore(day, startOfDay(new Date()));
                return (
                  <div key={idx} 
                       onClick={() => !isPastDay && onCreateBooking?.(day)}
                       className={`border-b border-r border-gray-100 p-2 flex flex-col gap-2 ${isPastDay ? 'bg-gray-200/70 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50/50'} ${!isCurrentMonth ? 'opacity-50' : ''}`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-[13px] font-bold w-7 h-7 flex items-center justify-center rounded-full ${isSameDay(day, new Date()) ? 'bg-red-500 text-white shadow-sm' : isCurrentMonth ? 'text-[#1a1c1c]' : 'text-gray-300'}`}>
                        {format(day, 'd')}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 flex-1 mt-2">
                      {dayBookings.map(b => renderBookingBlock(b, true, day))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {viewMode === 'Week' && (
            <div className="flex-1 grid grid-cols-7">
              {columns.map((day, idx) => {
                const dayBookings = bookings.filter(b => isOverlap(b, day));
                const isPastDay = isBefore(day, startOfDay(new Date()));
                return (
                  <div key={idx} 
                       onClick={() => !isPastDay && onCreateBooking?.(day)}
                       className={`border-r border-gray-100 p-3 flex flex-col gap-3 ${isPastDay ? 'bg-gray-200/70 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50/50'}`}>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                      <span className={`text-[14px] font-black ${isSameDay(day, new Date()) ? 'text-red-500' : 'text-[#1a1c1c]'}`}>
                        {format(day, 'd MMM')}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 flex-1 mt-2">
                      {dayBookings.map(b => renderBookingBlock(b, false, day))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {viewMode === 'Day' && serviceMode === 'daycare' && (
            <div className="flex flex-col w-full h-full overflow-hidden rounded-xl">
              <div className="flex justify-between items-center pb-4 mb-2 px-2 shrink-0">
                <span className={`text-[20px] font-black text-[#1a1c1c]`}>
                  {format(currentDate, 'EEEE, d MMMM yyyy')}
                </span>
                <span className="text-[14px] font-bold text-[#45464E] bg-white shadow-sm border border-gray-100 px-4 py-2 rounded-full">
                  {bookings.filter(b => isOverlap(b, currentDate)).length} รายการ
                </span>
              </div>
              <div className="flex flex-col border border-gray-100 rounded-[1rem] overflow-hidden bg-white shadow-sm flex-1">
                <div className="flex bg-gray-50 border-b border-gray-100">
                  <div className="w-[150px] shrink-0 border-r border-gray-100 p-3 flex items-center font-bold text-[#1a1c1c] text-[13px] bg-gray-50 z-20">
                    สัตว์เลี้ยง
                  </div>
                  <div className="flex-1 flex overflow-x-auto relative scrollbar-hide min-w-[800px]">
                    {hoursArray.map(h => (
                      <div key={h} className="flex-1 min-w-[50px] border-r border-gray-100 p-2 text-[11px] text-gray-500 font-medium text-center">
                        {String(h).padStart(2, '0')}:00
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col overflow-y-auto max-h-[600px] scrollbar-thin">
                  <div className="min-w-[800px] w-full flex flex-col">
                    {(() => {
                      const todayBookings = bookings.filter(b => isOverlap(b, currentDate));
                      if (todayBookings.length === 0) {
                        return <div className="py-12 text-center text-gray-400 font-bold text-[14px]">ไม่มีรายการในวันนี้</div>;
                      }

                      return todayBookings.map(b => {
                        const bStart = parseISO(b.check_in_date);
                        const bEnd = parseISO(b.check_out_actual || b.check_out_expected || new Date().toISOString());

                        const timelineStart = new Date(currentDate);
                        timelineStart.setHours(openHour, 0, 0, 0);

                        const timelineEnd = new Date(currentDate);
                        timelineEnd.setHours(closeHour, 0, 0, 0);

                        const actualStart = isBefore(bStart, timelineStart) ? timelineStart : bStart;
                        const actualEnd = isAfter(bEnd, timelineEnd) ? timelineEnd : bEnd;

                        if (isBefore(actualEnd, timelineStart) || isAfter(actualStart, timelineEnd)) return null;

                        const startMins = (actualStart.getTime() - timelineStart.getTime()) / (1000 * 60);
                        const endMins = (actualEnd.getTime() - timelineStart.getTime()) / (1000 * 60);

                        const left = Math.max(0, (startMins / totalMinutes) * 100);
                        let width = ((endMins - startMins) / totalMinutes) * 100;
                        if (width < 2) width = 2; // Min width

                        const roomInfo = roomMap[b.room_id];
                        const colorHex = roomInfo?.type?.color || '#020d35';
                        const cleanHex = colorHex.replace('#', '');
                        const r = parseInt(cleanHex.slice(0, 2), 16) || 0;
                        const g = parseInt(cleanHex.slice(2, 4), 16) || 0;
                        const bColor = parseInt(cleanHex.slice(4, 6), 16) || 0;
                        const yiq = ((r * 299) + (g * 587) + (bColor * 114)) / 1000;
                        const textColor = yiq >= 128 ? '#1a1c1c' : '#ffffff';

                        const pendingActivities = activities.filter(a => a.booking_id === b.id && a.status !== 'done').length;
                        const expectedDate = b.check_out_expected ? parseISO(b.check_out_expected) : null;
                        const isOverdue = b.status === 'checked_in' && expectedDate && isAfter(new Date(), expectedDate);
                        const isWaitingForPickup = b.status === 'checked_in' && expectedDate && !isOverdue && isAfter(new Date(), subHours(expectedDate, 1));
                        
                        const bgColor = isOverdue ? '#fee2e2' : isWaitingForPickup ? '#fef9c3' : b.status === 'checked_in' ? colorHex : '#ffedd5';
                        const txtColor = isOverdue ? '#b91c1c' : isWaitingForPickup ? '#ca8a04' : b.status === 'checked_in' ? textColor : '#9a3412';

                        return (
                          <div key={b.id} className="flex border-b border-gray-100 group relative">
                            <HoverCard 
                              openDelay={200} 
                              closeDelay={200}
                              open={openHoverCardId === `${b.id}-sidebar`}
                              onOpenChange={(open) => setOpenHoverCardId(open ? `${b.id}-sidebar` : null)}
                            >
                              <HoverCardTrigger asChild>
                                <div className="w-[150px] shrink-0 border-r border-gray-100 p-3 flex flex-col justify-center bg-white z-20 cursor-pointer hover:bg-gray-50 transition-colors">
                                  <span className="text-[13px] font-semibold text-[#1a1c1c] truncate">{b.pets?.name || 'ไม่ระบุชื่อ'}</span>
                                  {b.customers?.display_name && (
                                    <span className="text-[10px] text-gray-500 truncate">{b.customers.display_name}</span>
                                  )}
                                </div>
                              </HoverCardTrigger>
                              <HoverCardContent side="right" align="start" sideOffset={8} className="w-[360px] p-0 border-none shadow-2xl bg-transparent z-[9999]">
                                <RoomDetailCard
                                  booking={b}
                                  room={roomInfo?.room}
                                  activities={activities.filter(a => a.booking_id === b.id)}
                                  onToggleActivity={onToggleActivity}
                                  onCheckout={() => {
                                    setOpenHoverCardId(null);
                                    onCheckout(b.id);
                                  }}
                                  onEdit={() => {
                                    setOpenHoverCardId(null);
                                    if (onEdit) onEdit(b);
                                  }}
                                />
                              </HoverCardContent>
                            </HoverCard>
                            <div className="flex-1 relative min-h-[60px] bg-white group-hover:bg-gray-50/50 transition-colors">
                              {/* Grid lines */}
                              <div className="absolute inset-0 flex pointer-events-none">
                                {hoursArray.map(h => (
                                  <div key={h} className="flex-1 border-r border-gray-50"></div>
                                ))}
                              </div>
                              {/* Booking block */}
                              <div
                                className="absolute top-1/2 -translate-y-1/2 h-[40px] z-30 shadow-sm rounded-md transition-all hover:z-40"
                                style={{ left: `${left}%`, width: `${width}%` }}
                              >
                                <HoverCard 
                                  openDelay={200} 
                                  closeDelay={200}
                                  open={openHoverCardId === `${b.id}-timeline`}
                                  onOpenChange={(open) => setOpenHoverCardId(open ? `${b.id}-timeline` : null)}
                                >
                                  <HoverCardTrigger asChild>
                                    <div
                                      className={`w-full h-full rounded-md border ${isOverdue ? 'border-red-200' : isWaitingForPickup ? 'border-yellow-200' : 'border-white/50'} cursor-pointer flex items-center px-2 shadow-[0_2px_10px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_15px_rgba(0,0,0,0.1)] hover:scale-[1.02] origin-left relative`}
                                      style={{ backgroundColor: bgColor, color: txtColor }}
                                    >
                                      <span className="text-[12px] font-bold truncate">
                                        {format(parseISO(b.check_in_date), 'HH:mm')} - {format(parseISO(b.check_out_expected || b.check_out_actual || new Date().toISOString()), 'HH:mm')}
                                      </span>
                                      {pendingActivities > 0 && (
                                        <div className="absolute top-1/2 -translate-y-1/2 right-[4px] flex items-center justify-center bg-[#ef4444] text-white w-[18px] h-[18px] rounded-full text-[10px] font-bold shadow-sm">
                                          {pendingActivities}
                                        </div>
                                      )}
                                    </div>
                                  </HoverCardTrigger>
                                  <HoverCardContent side="top" align="center" sideOffset={8} className="w-[360px] p-0 border-none shadow-2xl bg-transparent z-[9999]">
                                    <RoomDetailCard
                                      booking={b}
                                      room={roomInfo?.room}
                                      activities={activities.filter(a => a.booking_id === b.id)}
                                      onToggleActivity={onToggleActivity}
                                      onCheckout={() => {
                                        setOpenHoverCardId(null);
                                        onCheckout(b.id);
                                      }}
                                      onEdit={() => {
                                        setOpenHoverCardId(null);
                                        if (onEdit) onEdit(b);
                                      }}
                                    />
                                  </HoverCardContent>
                                </HoverCard>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'Day' && serviceMode === 'hotel' && (
            <div className="grid grid-cols-1 min-h-full">
              {columns.map((day, idx) => {
                const dayBookings = bookings.filter(b => isOverlap(b, day));
                return (
                  <div key={idx} className="flex flex-col gap-4 w-full">
                    <div className="flex justify-between items-center pb-4 mb-2">
                      <span className={`text-[20px] font-black text-[#1a1c1c]`}>
                        {format(day, 'EEEE, d MMMM yyyy')}
                      </span>
                      <span className="text-[14px] font-bold text-[#45464E] bg-white shadow-sm border border-gray-100 px-4 py-2 rounded-full">
                        {dayBookings.length} ห้องที่เข้าพัก
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
                      {dayBookings.map(b => renderBookingBlock(b, false))}
                      {dayBookings.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-400 font-bold text-[14px]">
                          ไม่มีการเข้าพักในวันนี้
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
