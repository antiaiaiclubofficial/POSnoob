"use client";

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, addDays, subWeeks, addWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, Info } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ScheduleTabProps {
  storeId: string | null;
}

const SHIFT_TYPES = [
  { id: 'Morning', label: 'เช้า (M)', color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { id: 'Evening', label: 'บ่าย (E)', color: 'bg-purple-50 text-purple-600 border-purple-100' },
  { id: 'Off', label: 'หยุด (Off)', color: 'bg-gray-50 text-gray-400 border-gray-100' }
];

const ScheduleTab = ({ storeId }: ScheduleTabProps) => {
  const queryClient = useQueryClient();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)), [currentWeekStart]);

  const { data: staff = [] } = useQuery({
    queryKey: ['profiles-schedule', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role')
        .eq('store_id', storeId)
        .eq('status', 'Active');
      if (error) throw error;
      return data;
    },
    enabled: !!storeId
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['staff_schedules', storeId, format(currentWeekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!storeId) return [];
      const startDate = format(days[0], 'yyyy-MM-dd');
      const endDate = format(days[6], 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('staff_schedules' as any)
        .select('*')
        .eq('store_id', storeId)
        .gte('work_date', startDate)
        .lte('work_date', endDate);
      if (error) return [];
      return data;
    },
    enabled: !!storeId
  });

  const upsertMutation = useMutation({
    mutationFn: async ({ staffId, date, shiftType }: { staffId: string, date: string, shiftType: string }) => {
      const existing = schedules.find((s: any) => s.staff_id === staffId && s.work_date === date);
      const payload = {
        id: existing?.id,
        staff_id: staffId,
        store_id: storeId,
        work_date: date,
        shift_type: shiftType
      };
      const { error } = await supabase.from('staff_schedules' as any).upsert([payload]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff_schedules'] });
      toast.success("อัปเดตตารางเวรเรียบร้อย");
    },
    onError: (err: any) => toast.error("บันทึกไม่สำเร็จ: " + err.message)
  });

  const handleShiftChange = (staffId: string, date: Date, currentType: string) => {
    const types = ['Off', 'Morning', 'Evening'];
    const nextType = types[(types.indexOf(currentType || 'Off') + 1) % types.length];
    upsertMutation.mutate({ staffId, date: format(date, 'yyyy-MM-dd'), shiftType: nextType });
  };

  return (
    <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full animate-in fade-in duration-500">
      <div className="p-8 border-b border-gray-50 bg-gray-50/20 flex flex-col sm:flex-row justify-between items-center gap-6">
        <div>
          <h3 className="text-xl font-black text-[#1A1F3D]">ตารางเวรพนักงาน</h3>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Shift Schedule</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
            <button onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))} className="p-2 hover:bg-gray-50 rounded-xl transition-all"><ChevronLeft size={18} /></button>
            <div className="px-4 text-xs font-bold text-[#1A1F3D] min-w-[140px] text-center">{format(days[0], 'd MMM')} - {format(days[6], 'd MMM yyyy')}</div>
            <button onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))} className="p-2 hover:bg-gray-50 rounded-xl transition-all"><ChevronRight size={18} /></button>
          </div>
          <button onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="bg-[#1A1F3D] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-[#1A1F3D]/10 hover:scale-105 transition-all">วันนี้</button>
        </div>
      </div>
      <div className="flex-1 overflow-x-auto scrollbar-hide">
        <table className="w-full">
          <thead>
            <tr className="bg-white border-b border-gray-100">
              <th className="sticky left-0 z-10 bg-white px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400 border-r border-gray-50 min-w-[200px]">พนักงาน</th>
              {days.map((day, idx) => (
                <th key={idx} className="px-4 py-5 text-center min-w-[120px]">
                  <p className="text-[10px] font-black uppercase text-gray-400">{format(day, 'EEE')}</p>
                  <p className="text-sm font-black text-[#1A1F3D]">{format(day, 'd')}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {staff.map((member: any) => (
              <tr key={member.id} className="hover:bg-gray-50/30 transition-colors">
                <td className="sticky left-0 z-10 bg-white/80 backdrop-blur-sm px-8 py-6 border-r border-gray-50 shadow-[5px_0_10px_-5px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center gap-3">
                    <img src={member.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"} className="w-10 h-10 rounded-xl object-cover" alt="" />
                    <div className="min-w-0"><p className="text-sm font-black text-[#1A1F3D] truncate">{member.full_name}</p><p className="text-[9px] text-gray-400 font-bold uppercase">{member.role}</p></div>
                  </div>
                </td>
                {days.map((day, dIdx) => {
                  const shift = schedules.find((s: any) => s.staff_id === member.id && s.work_date === format(day, 'yyyy-MM-dd'));
                  const type = shift?.shift_type || 'Off';
                  const config = SHIFT_TYPES.find(t => t.id === type) || SHIFT_TYPES[2];
                  return (
                    <td key={dIdx} className="px-3 py-6 text-center">
                      <button onClick={() => handleShiftChange(member.id, day, type)} disabled={upsertMutation.isPending} className={cn("w-full max-w-[100px] mx-auto py-3 rounded-2xl border-2 font-black text-[10px] uppercase transition-all flex flex-col items-center gap-1 group", config.color, "hover:scale-105 active:scale-95")}>
                        <Clock size={12} className="opacity-40 group-hover:opacity-100" />{config.label}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex flex-wrap gap-6 justify-center">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /><span className="text-[9px] font-black uppercase text-gray-400">Morning Shift</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500" /><span className="text-[9px] font-black uppercase text-gray-400">Evening Shift</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-300" /><span className="text-[9px] font-black uppercase text-gray-400">Off / Holiday</span></div>
        <div className="ml-auto flex items-center gap-2 text-[9px] font-bold text-indigo-500"><Info size={12} /><span>คลิกที่ช่องเพื่อเปลี่ยนกะการทำงาน</span></div>
      </div>
    </div>
  );
};

export default ScheduleTab;