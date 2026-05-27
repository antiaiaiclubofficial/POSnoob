"use client";

import React, { useState } from 'react';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, addMonths, subMonths, parseISO 
} from 'date-fns';
import { th } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, Clock, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StoreHolidaysConfigProps {
  recurringHolidays: number[]; // 0 = Sun, 1 = Mon, ...
  onChangeRecurring: (days: number[]) => void;
  specificHolidays: string[]; // ["YYYY-MM-DD"]
  onChangeSpecific: (dates: string[]) => void;
}

const StoreHolidaysConfig = ({
  recurringHolidays,
  onChangeRecurring,
  specificHolidays,
  onChangeSpecific
}: StoreHolidaysConfigProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const weekDaysTH = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
  const fullWeekDaysTH = [
    { id: 0, label: 'วันอาทิตย์' },
    { id: 1, label: 'วันจันทร์' },
    { id: 2, label: 'วันอังคาร' },
    { id: 3, label: 'วันพุธ' },
    { id: 4, label: 'วันพฤหัสบดี' },
    { id: 5, label: 'วันศุกร์' },
    { id: 6, label: 'วันเสาร์' }
  ];

  // Calendar calculation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const toggleWeeklyHoliday = (dayId: number) => {
    if (recurringHolidays.includes(dayId)) {
      onChangeRecurring(recurringHolidays.filter(d => d !== dayId));
    } else {
      onChangeRecurring([...recurringHolidays, dayId]);
    }
  };

  const toggleSpecificHoliday = (dateStr: string) => {
    if (specificHolidays.includes(dateStr)) {
      onChangeSpecific(specificHolidays.filter(d => d !== dateStr));
    } else {
      onChangeSpecific([...specificHolidays, dateStr]);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Weekly Holidays Section */}
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-black text-[#1A1F3D] mb-1">วันหยุดประจำสัปดาห์ (Weekly Holidays)</h3>
          <p className="text-xs text-gray-400 font-medium">เลือกวันหยุดปกติของร้านในแต่ละสัปดาห์ (ระบบจะปิดรับคิวในวันเหล่านี้โดยอัตโนมัติ)</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {fullWeekDaysTH.map((day) => {
            const isHoliday = recurringHolidays.includes(day.id);
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => toggleWeeklyHoliday(day.id)}
                className={cn(
                  "py-3.5 px-2 rounded-2xl border-2 text-xs font-black transition-all flex flex-col items-center gap-2",
                  isHoliday 
                    ? "bg-red-50 border-red-200 text-red-600 shadow-sm" 
                    : "bg-white border-gray-50 text-gray-500 hover:border-gray-200"
                )}
              >
                <span>{day.label}</span>
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center border transition-all",
                  isHoliday ? "bg-red-500 border-red-500 text-white" : "border-gray-200 bg-gray-50"
                )}>
                  {isHoliday && <Check size={10} strokeWidth={4} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Special Holidays Section */}
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-black text-[#1A1F3D] mb-1">วันหยุดพิเศษ / วันหยุดนักขัตฤกษ์ (Special Holidays)</h3>
            <p className="text-xs text-gray-400 font-medium">คลิกเลือกวันที่บนปฏิทินเพื่อกำหนดเป็นวันหยุดพิเศษของร้าน</p>
          </div>

          {/* Month Navigation */}
          <div className="flex bg-[#F5F6FA] p-1 rounded-2xl items-center shrink-0">
            <button type="button" onClick={handlePrevMonth} className="p-2 hover:bg-white rounded-lg transition-all">
              <ChevronLeft size={18} className="text-gray-600" />
            </button>
            <span className="px-4 text-xs font-black text-[#1A1F3D] min-w-[120px] text-center uppercase">
              {format(currentMonth, 'MMMM yyyy', { locale: th })}
            </span>
            <button type="button" onClick={handleNextMonth} className="p-2 hover:bg-white rounded-lg transition-all">
              <ChevronRight size={18} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="border border-gray-50 rounded-3xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-50 bg-gray-50/50">
            {weekDaysTH.map((day, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "py-3 text-center text-[10px] font-black uppercase tracking-widest",
                  idx === 0 ? "text-red-500" : "text-gray-400"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 bg-white">
            {calendarDays.map((day, idx) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const dayOfWeek = day.getDay();
              
              const isWeeklyHoliday = recurringHolidays.includes(dayOfWeek);
              const isSpecialHoliday = specificHolidays.includes(dateStr);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => isCurrentMonth && toggleSpecificHoliday(dateStr)}
                  disabled={!isCurrentMonth}
                  className={cn(
                    "min-h-[60px] p-2 border-r border-b border-gray-50 text-center transition-all flex flex-col items-center justify-between relative group",
                    !isCurrentMonth && "bg-gray-50/20 opacity-20 cursor-default",
                    isCurrentMonth && "hover:bg-gray-50"
                  )}
                >
                  <span className={cn(
                    "text-xs font-black w-7 h-7 flex items-center justify-center rounded-full",
                    isSpecialHoliday ? "bg-red-500 text-white shadow-md shadow-red-500/20" :
                    isWeeklyHoliday ? "text-red-500 bg-red-50" : "text-gray-600"
                  )}>
                    {format(day, 'd')}
                  </span>

                  {/* Status Indicators */}
                  <div className="h-4 flex items-center justify-center gap-1">
                    {isSpecialHoliday && (
                      <span className="text-[8px] font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md uppercase">หยุดพิเศษ</span>
                    )}
                    {!isSpecialHoliday && isWeeklyHoliday && (
                      <span className="text-[8px] font-black text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md uppercase">หยุดประจำ</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-5 bg-amber-50/50 rounded-[32px] border border-amber-100 flex items-start gap-4">
          <div className="p-2.5 bg-white rounded-xl shadow-sm text-amber-500"><AlertCircle size={18} /></div>
          <div>
            <p className="text-xs font-black text-amber-900 mb-1">คำแนะนำการใช้งาน</p>
            <p className="text-[11px] text-amber-800/70 leading-relaxed font-medium">
              วันที่ถูกกำหนดเป็นวันหยุด (ทั้งแบบประจำสัปดาห์และวันหยุดพิเศษ) จะแสดงเป็นวันหยุดในหน้าจองคิวของลูกค้าโดยอัตโนมัติ และจะไม่สามารถสร้างนัดหมายใหม่ในวันดังกล่าวได้
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreHolidaysConfig;