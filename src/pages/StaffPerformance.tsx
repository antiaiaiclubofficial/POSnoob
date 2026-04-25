"use client";

import React, { useState, useMemo } from 'react';
import { useStore, Staff, Transaction } from '@/store/useStore';
import { translations } from '@/utils/translations';
import { 
  Users, TrendingUp, Clock, DollarSign, Dog, Cat, 
  ChevronRight, ChevronLeft, Scissors, Calendar, Award, Target, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  format, startOfDay, endOfDay, startOfWeek, endOfWeek, 
  startOfMonth, endOfMonth, startOfYear, endOfYear,
  addDays, addWeeks, addMonths, addYears,
  subDays, subWeeks, subMonths, subYears,
  parseISO
} from 'date-fns';

const StaffPerformance = () => {
  const { staff, transactions, currency, language } = useStore();
  const t = translations[language];
  const [selectedStaffId, setSelectedStaffId] = useState<string>(staff[0]?.id || '');
  const [rangeType, setRangeType] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
  
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  const activeStaff = staff.find(s => s.id === selectedStaffId);

  const handleRangeSelect = (type: 'today' | 'week' | 'month' | 'year') => {
    setRangeType(type);
    const now = new Date();
    let start, end;

    switch(type) {
      case 'today':
        start = startOfDay(now);
        end = endOfDay(now);
        break;
      case 'week':
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'year':
        start = startOfYear(now);
        end = endOfYear(now);
        break;
    }

    setDateRange({
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd')
    });
  };

  const handleNavigateRange = (direction: 'prev' | 'next') => {
    const currentStart = parseISO(dateRange.start);
    let newStart, newEnd;

    switch(rangeType) {
      case 'today':
        newStart = direction === 'prev' ? subDays(currentStart, 1) : addDays(currentStart, 1);
        newEnd = endOfDay(newStart);
        break;
      case 'week':
        newStart = direction === 'prev' ? subWeeks(currentStart, 1) : addWeeks(currentStart, 1);
        newStart = startOfWeek(newStart, { weekStartsOn: 1 });
        newEnd = endOfWeek(newStart, { weekStartsOn: 1 });
        break;
      case 'month':
        newStart = direction === 'prev' ? subMonths(currentStart, 1) : addMonths(currentStart, 1);
        newStart = startOfMonth(newStart);
        newEnd = endOfMonth(newStart);
        break;
      case 'year':
        newStart = direction === 'prev' ? subYears(currentStart, 1) : addYears(currentStart, 1);
        newStart = startOfYear(newStart);
        newEnd = endOfYear(newStart);
        break;
      default:
        newStart = direction === 'prev' ? subDays(currentStart, 7) : addDays(currentStart, 7);
        newEnd = addDays(newStart, 7);
    }

    setDateRange({
      start: format(newStart, 'yyyy-MM-dd'),
      end: format(newEnd, 'yyyy-MM-dd')
    });
  };

  const stats = useMemo(() => {
    if (!selectedStaffId) return null;

    const filteredTx = transactions.filter(tx => 
      tx.staffId === selectedStaffId &&
      tx.date >= dateRange.start &&
      tx.date <= dateRange.end
    );

    const totalRevenue = filteredTx.reduce((acc, tx) => acc + tx.amount, 0);
    const commission = (totalRevenue * (activeStaff?.commissionRate || 0)) / 100;
    
    const dogsCount = filteredTx.filter(tx => tx.species.includes('Dog')).length;
    const catsCount = filteredTx.filter(tx => tx.species.includes('Cat')).length;
    
    const timedTx = filteredTx.filter(tx => tx.actualDuration !== undefined);
    const avgDuration = timedTx.length > 0 
      ? Math.round(timedTx.reduce((acc, tx) => acc + (tx.actualDuration || 0), 0) / timedTx.length)
      : 0;

    const formatAvgTime = (minutes: number) => {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    return {
      totalRevenue,
      commission,
      jobsCount: filteredTx.length,
      dogsCount,
      catsCount,
      avgDuration: formatAvgTime(avgDuration),
      history: filteredTx.sort((a, b) => b.date.localeCompare(a.date))
    };
  }, [selectedStaffId, transactions, dateRange, activeStaff]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8F9FD]">
      <header className="px-10 py-10 shrink-0 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target size={14} className="text-[#D9ED5F]" />
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">{t.performanceAudit}</p>
          </div>
          <h1 className="text-4xl font-black text-[#1A1F3D]">{t.staffAnalytics}</h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleNavigateRange('prev')}
              className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-[#1A1F3D] hover:bg-gray-50 transition-all shadow-sm"
            >
              <ChevronLeft size={18} />
            </button>
            
            <div className="flex bg-white p-1.5 rounded-[22px] border border-gray-100 shadow-sm gap-1">
              {(['today', 'week', 'month', 'year'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => handleRangeSelect(type)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all",
                    rangeType === type ? "bg-[#1A1F3D] text-white shadow-md" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {t[type as keyof typeof t] || type}
                </button>
              ))}
            </div>

            <button 
              onClick={() => handleNavigateRange('next')}
              className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-[#1A1F3D] hover:bg-gray-50 transition-all shadow-sm"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="flex gap-3 bg-white p-2 rounded-[24px] border border-gray-100 shadow-sm">
            <input 
              type="date" 
              className="bg-[#F5F6FA] border-none rounded-xl px-4 py-2 text-xs font-bold"
              value={dateRange.start}
              onChange={e => {
                setDateRange({...dateRange, start: e.target.value});
                setRangeType('custom');
              }}
            />
            <span className="flex items-center text-gray-300">to</span>
            <input 
              type="date" 
              className="bg-[#F5F6FA] border-none rounded-xl px-4 py-2 text-xs font-bold"
              value={dateRange.end}
              onChange={e => {
                setDateRange({...dateRange, end: e.target.value});
                setRangeType('custom');
              }}
            />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row px-10 pb-10 gap-8">
        <div className="w-full lg:w-72 shrink-0 space-y-3 overflow-y-auto scrollbar-hide">
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">{t.selectStaff}</p>
          {staff.filter(s => s.status === 'Active').map(member => (
            <button
              key={member.id}
              onClick={() => setSelectedStaffId(member.id)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-[28px] transition-all text-left",
                selectedStaffId === member.id 
                  ? "bg-[#1A1F3D] text-white shadow-xl shadow-[#1A1F3D]/10" 
                  : "bg-white border border-gray-100 hover:bg-gray-50"
              )}
            >
              <img src={member.avatar} className="w-12 h-12 rounded-2xl object-cover" />
              <div>
                <p className="text-sm font-black">{member.name}</p>
                <p className={cn("text-[10px] font-bold uppercase", selectedStaffId === member.id ? "text-[#D9ED5F]" : "text-gray-400")}>
                  {member.role} • {member.commissionRate}%
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-8">
          {stats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                  <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mb-6"><DollarSign size={24} /></div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">{t.commissionEarned}</p>
                  <h2 className="text-3xl font-black text-green-600">{currency}{stats.commission.toLocaleString()}</h2>
                  <p className="text-[9px] text-gray-300 font-bold uppercase mt-2">{t.basedOnRate.replace('{rate}', activeStaff?.commissionRate.toString() || '0')}</p>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                  <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6"><TrendingUp size={24} /></div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">{t.revenueGenerated}</p>
                  <h2 className="text-3xl font-black text-[#1A1F3D]">{currency}{stats.totalRevenue.toLocaleString()}</h2>
                  <p className="text-[9px] text-gray-300 font-bold uppercase mt-2">{t.completedJobs.replace('{count}', stats.jobsCount.toString())}</p>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                  <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mb-6"><Clock size={24} /></div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">{t.avgServiceTime}</p>
                  <h2 className="text-3xl font-black text-[#1A1F3D]">{stats.avgDuration}</h2>
                  <p className="text-[9px] text-gray-300 font-bold uppercase mt-2">{t.perJobEfficiency}</p>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex items-center gap-6">
                   <div className="flex-1">
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-4">{t.speciesRatio}</p>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2"><Dog size={14} className="text-blue-400" /><span className="text-xs font-bold">{t.dogs}</span></div>
                        <span className="text-xs font-black">{stats.dogsCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><Cat size={14} className="text-pink-400" /><span className="text-xs font-bold">{t.cats}</span></div>
                        <span className="text-xs font-black">{stats.catsCount}</span>
                      </div>
                   </div>
                </div>
              </div>

              <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                  <h3 className="text-xl font-black text-[#1A1F3D]">{t.jobDrillDown}</h3>
                  <div className="p-2 bg-gray-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400">
                    {t.showingRecords.replace('{count}', stats.history.length.toString())}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50/50">
                        <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">{t.dateId}</th>
                        <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">{t.clientPet}</th>
                        <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400 tracking-widest">{t.type}</th>
                        <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400 tracking-widest">{t.duration}</th>
                        <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400 tracking-widest">{t.amount}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {stats.history.map((tx) => (
                        <tr key={tx.id} className="hover:bg-[#F8F9FD] transition-colors">
                          <td className="px-8 py-6">
                            <p className="text-xs font-black text-[#1A1F3D]">{tx.date}</p>
                            <p className="text-[9px] text-gray-300 font-bold uppercase">{tx.id}</p>
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-sm font-black text-[#1A1F3D]">{tx.customerName}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {tx.species.includes('Dog') ? <Dog size={10} className="text-blue-400" /> : <Cat size={10} className="text-pink-400" />}
                              <span className="text-[10px] text-gray-400 font-bold uppercase">{tx.species.join(', ')}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <span className={cn(
                              "text-[9px] font-black uppercase px-2.5 py-1 rounded-full",
                              tx.bookingType === 'Appointment' ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                            )}>
                              {tx.bookingType}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <div className="flex items-center justify-center gap-2">
                               <Clock size={12} className="text-gray-300" />
                               <span className="text-xs font-bold text-gray-600">{tx.actualDuration ? `${tx.actualDuration}m` : '--'}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right font-black text-[#1A1F3D]">
                            {currency}{tx.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
              <Zap size={48} className="mb-4" />
              <p className="font-black">{t.selectStaffPrompt}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffPerformance;