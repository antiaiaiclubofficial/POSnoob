"use client";

import React from 'react';
import { History, Search, Clock, LogIn, LogOut, Loader2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { translations } from '@/utils/translations';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Logs = () => {
  const { storeId, language } = useStore();
  const t = translations[language];
  const [query, setQuery] = React.useState('');

  const { data: attendanceLogs = [], isLoading } = useQuery({
    queryKey: ['attendance_logs', storeId, 'page'],
    queryFn: async () => {
      if (!storeId || storeId === 'default-store') return [];
      const { data, error } = await supabase
        .from('attendance_logs' as any)
        .select('*, profiles(full_name, avatar_url)')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!storeId
  });

  const filteredLogs = attendanceLogs.filter((log: any) => {
    const fullName = log.profiles?.full_name || '';
    const typeLabel = log.type === 'check_in' 
      ? (language === 'th' ? 'เข้างาน' : 'Check-in') 
      : (language === 'th' ? 'ออกงาน' : 'Check-out');
    
    return (
      fullName.toLowerCase().includes(query.toLowerCase()) ||
      typeLabel.toLowerCase().includes(query.toLowerCase())
    );
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="px-10 py-10 shrink-0 border-b border-gray-100 bg-white">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-black mb-1">
              {language === 'th' ? 'ประวัติการลงเวลาเข้า-ออกงาน' : 'Attendance Logs'}
            </h1>
            <p className="text-gray-400 font-medium text-sm">
              {language === 'th' ? 'แสดงข้อมูลการลงเวลาเข้างานและออกงานของพนักงาน' : 'View check-in and check-out logs of staff'}
            </p>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-6 py-3 text-xs font-bold focus:ring-2 focus:ring-[#1A1F3D]/10"
              placeholder={language === 'th' ? 'ค้นหาพนักงาน...' : 'Search staff...'}
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
        <div className="max-w-4xl mx-auto space-y-4">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p className="font-bold text-sm">
                {language === 'th' ? 'กำลังโหลดข้อมูล...' : 'Loading logs...'}
              </p>
            </div>
          ) : filteredLogs.map((log: any) => {
            const isCheckIn = log.type === 'check_in';
            return (
              <div key={log.id} className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                <div className="flex items-center gap-5">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                    isCheckIn ? "bg-green-50 text-green-500" : "bg-blue-50 text-blue-500"
                  )}>
                    {isCheckIn ? <LogIn size={20} /> : <LogOut size={20} />}
                  </div>
                  <div className="flex items-center gap-4">
                    <img 
                      src={log.profiles?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop"} 
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-gray-50"
                      alt={log.profiles?.full_name || 'Staff avatar'}
                    />
                    <div>
                      <h3 className="font-black text-sm text-[#1A1F3D]">{log.profiles?.full_name || 'Staff Member'}</h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full",
                          isCheckIn ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                        )}>
                          {isCheckIn ? (language === 'th' ? 'เข้างาน' : 'Check-in') : (language === 'th' ? 'ออกงาน' : 'Check-out')}
                        </span>
                        
                        {log.late_minutes > 0 && (
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                            {language === 'th' ? `เข้างานสาย ${log.late_minutes} นาที` : `Late ${log.late_minutes} min`}
                          </span>
                        )}

                        {!isCheckIn && log.total_hours && parseFloat(log.total_hours) > 0 && (
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                            {language === 'th' ? `ชั่วโมงทำงาน: ${log.total_hours} ชม.` : `Hours: ${log.total_hours} hrs`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end">
                  <div className="flex items-center gap-1.5 text-xs font-black text-[#1A1F3D]">
                    <Clock size={14} className="text-gray-400" />
                    {format(new Date(log.created_at), 'HH:mm น.', { locale: language === 'th' ? th : undefined })}
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold mt-1">
                    {format(new Date(log.created_at), 'dd MMM yyyy', { locale: language === 'th' ? th : undefined })}
                  </p>
                </div>
              </div>
            );
          })}

          {!isLoading && filteredLogs.length === 0 && (
            <div className="py-20 text-center opacity-30">
              <History size={48} className="mx-auto mb-4" />
              <p className="font-black">
                {language === 'th' ? 'ไม่มีประวัติการลงเวลาในขณะนี้' : 'No activities found'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Logs;