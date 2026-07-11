import React, { useState } from 'react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns';
import { th, enUS } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface DateRange {
  from: Date | undefined;
  to?: Date | undefined;
}

interface DateRangeDropdownProps {
  language: 'th' | 'en';
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined, preset?: string) => void;
  className?: string;
}

export const DateRangeDropdown: React.FC<DateRangeDropdownProps> = ({ language, value, onChange, className }) => {
  const [preset, setPreset] = useState<string>('all');
  const [isOpen, setIsOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  const presets = [
    { id: 'all', labelTh: 'ทั้งหมด', labelEn: 'All Time' },
    { id: 'today', labelTh: 'วันนี้', labelEn: 'Today' },
    { id: 'yesterday', labelTh: 'เมื่อวาน', labelEn: 'Yesterday' },
    { id: 'thisWeek', labelTh: 'สัปดาห์นี้', labelEn: 'This Week' },
    { id: 'lastWeek', labelTh: 'สัปดาห์ที่แล้ว', labelEn: 'Last Week' },
    { id: 'thisMonth', labelTh: 'เดือนนี้', labelEn: 'This Month' },
    { id: 'lastMonth', labelTh: 'เดือนที่แล้ว', labelEn: 'Last Month' },
    { id: 'q1', labelTh: 'ไตรมาส 1', labelEn: 'Q1' },
    { id: 'q2', labelTh: 'ไตรมาส 2', labelEn: 'Q2' },
    { id: 'q3', labelTh: 'ไตรมาส 3', labelEn: 'Q3' },
    { id: 'q4', labelTh: 'ไตรมาส 4', labelEn: 'Q4' },
    { id: 'yearly', labelTh: 'ปีนี้', labelEn: 'This Year' },
    { id: 'custom', labelTh: 'กำหนดเอง...', labelEn: 'Custom Range...' },
  ];

  const handlePresetSelect = (presetId: string) => {
    const today = new Date();
    let from: Date | undefined;
    let to: Date | undefined;

    setPreset(presetId);

    if (presetId === 'custom') {
      setShowCalendar(true);
      return;
    }
    
    setShowCalendar(false);

    switch (presetId) {
      case 'today':
        from = startOfDay(today);
        to = endOfDay(today);
        break;
      case 'yesterday':
        from = startOfDay(subDays(today, 1));
        to = endOfDay(subDays(today, 1));
        break;
      case 'thisWeek':
        from = startOfWeek(today, { weekStartsOn: 1 });
        to = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case 'lastWeek':
        const lastWk = subDays(today, 7);
        from = startOfWeek(lastWk, { weekStartsOn: 1 });
        to = endOfWeek(lastWk, { weekStartsOn: 1 });
        break;
      case 'thisMonth':
        from = startOfMonth(today);
        to = endOfMonth(today);
        break;
      case 'lastMonth':
        const lastMo = subMonths(today, 1);
        from = startOfMonth(lastMo);
        to = endOfMonth(lastMo);
        break;
      case 'q1':
        from = new Date(today.getFullYear(), 0, 1);
        to = endOfMonth(new Date(today.getFullYear(), 2, 1));
        break;
      case 'q2':
        from = new Date(today.getFullYear(), 3, 1);
        to = endOfMonth(new Date(today.getFullYear(), 5, 1));
        break;
      case 'q3':
        from = new Date(today.getFullYear(), 6, 1);
        to = endOfMonth(new Date(today.getFullYear(), 8, 1));
        break;
      case 'q4':
        from = new Date(today.getFullYear(), 9, 1);
        to = endOfMonth(new Date(today.getFullYear(), 11, 1));
        break;
      case 'yearly':
        from = new Date(today.getFullYear(), 0, 1);
        to = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case 'all':
      default:
        from = undefined;
        to = undefined;
        break;
    }
    
    onChange(from ? { from, to: to || from } : undefined, presetId);
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (preset !== 'custom' && preset !== 'all') {
      const found = presets.find(p => p.id === preset);
      if (found) return language === 'th' ? found.labelTh : found.labelEn;
    }
    
    if (value?.from) {
      if (value.to && value.to.getTime() !== value.from.getTime()) {
        return `${format(value.from, 'dd MMM', { locale: language === 'th' ? th : enUS })} - ${format(value.to, 'dd MMM yy', { locale: language === 'th' ? th : enUS })}`;
      }
      return format(value.from, 'dd MMM yyyy', { locale: language === 'th' ? th : enUS });
    }
    
    return language === 'th' ? 'ทั้งหมด' : 'All Time';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[240px] justify-start text-left font-normal bg-white rounded-2xl border-slate-200",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
          <span className="flex-1 truncate">{getDisplayText()}</span>
          <ChevronDown className="h-4 w-4 opacity-50 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden shadow-xl" align="end">
        <div className="flex">
          <div className="w-[180px] border-r border-slate-100 p-2 space-y-1 bg-slate-50/50">
            {presets.map(p => (
              <button
                key={p.id}
                onClick={() => handlePresetSelect(p.id)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-xl text-sm font-medium flex items-center justify-between transition-colors",
                  preset === p.id 
                    ? "bg-indigo-50 text-indigo-700" 
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                {language === 'th' ? p.labelTh : p.labelEn}
                {preset === p.id && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
          {showCalendar && (
            <div className="p-3 bg-white">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={value?.from}
                selected={{ from: value?.from, to: value?.to }}
                onSelect={(range) => {
                  onChange(range, 'custom');
                  if (range?.from && range?.to) {
                     setIsOpen(false);
                  }
                }}
                numberOfMonths={2}
                locale={language === 'th' ? th : enUS}
              />
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
