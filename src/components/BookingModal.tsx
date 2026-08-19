"use client";

import React, { useState, useMemo } from 'react';
import { X, Calendar as CalendarIcon, User, Scissors, ChevronLeft, ChevronRight, AlertTriangle, Ban, Check } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import SlotPicker from './SlotPicker';
import { DayPicker } from 'react-day-picker';
import { format, isBefore, startOfToday } from 'date-fns';

interface BookingModalProps {
  onClose: () => void;
}

const BookingModal = ({ onClose }: BookingModalProps) => {
  const { customers, services, addons, addBooking, shopIsOpen, recurringHolidays, specificHolidays } = useStore();
  
  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [selectedPetId, setSelectedPetId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState('');

  // Derived Data
  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return [];
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.phone.includes(searchQuery)
    );
  }, [customers, searchQuery]);

  const selectedOwner = customers.find(c => c.id === selectedOwnerId);
  const selectedPet = selectedOwner?.pets.find(p => p.id === selectedPetId);
  const selectedService = services.find(s => s.id === selectedServiceId);

  const handleSelectOwner = (id: string, name: string) => {
    setSelectedOwnerId(id);
    setSearchQuery(name);
    setIsSearching(false);
    setSelectedPetId('');
  };

  // ตรวจสอบว่าเป็นวันหยุดหรือไม่
  const isHoliday = (date: Date) => {
    // 1. ตรวจสอบวันหยุดประจำสัปดาห์ (0 = Sun, 1 = Mon, ...)
    if (recurringHolidays.includes(date.getDay())) return true;
    
    // 2. ตรวจสอบวันหยุดพิเศษ (YYYY-MM-DD)
    const dateStr = format(date, 'yyyy-MM-dd');
    if (specificHolidays.includes(dateStr)) return true;
    
    return false;
  };

  const isDayDisabled = (date: Date) => {
    if (isBefore(date, startOfToday())) return true;
    return isHoliday(date);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopIsOpen) {
      toast.error("Shop is currently closed for maintenance");
      return;
    }

    if (!selectedDate || isHoliday(selectedDate)) {
      toast.error("The selected date is a shop holiday");
      return;
    }

    if (!selectedPet || !selectedService || !time) {
      toast.error("Please select a pet, service, and time slot");
      return;
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const selectedAddonNames = addons
      .filter(a => selectedAddonIds.includes(a.id))
      .map(a => a.name)
      .join(' + ');
    const finalServiceName = selectedAddonNames 
      ? `${selectedService.title} + ${selectedAddonNames}` 
      : selectedService.title;

    addBooking({
      petId: selectedPet.id,
      petName: selectedPet.name,
      ownerName: selectedOwner?.name || '',
      serviceName: finalServiceName,
      date: dateStr,
      time: time,
      status: 'Waiting',
      image: selectedPet.image
    });

    toast.success(`Booking confirmed for ${selectedPet.name} on ${dateStr} at ${time}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-8">
      <div className="bg-[#F8F9FD] w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-[0_20px_40px_rgba(26,31,61,0.08)] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col my-auto border border-white/50">
        
        {/* Header - Soft and airy */}
        <div className="p-6 pb-2 flex justify-between items-start shrink-0">
          <div className="pl-2">
            <h2 className="text-2xl font-black text-[#1A1F3D] mb-1 tracking-tight">เพิ่มการนัดหมาย</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">ระบุรายละเอียดสำหรับการนัดหมาย</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white hover:bg-gray-50 rounded-full transition-all shadow-sm">
            <X size={18} className="text-[#1A1F3D]" />
          </button>
        </div>

        {!shopIsOpen ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center min-h-[300px]">
            <div className="w-20 h-20 bg-white shadow-sm rounded-full flex items-center justify-center mb-6 relative">
               <div className="absolute inset-0 bg-red-50 rounded-full animate-ping opacity-20"></div>
               <AlertTriangle size={32} className="text-red-500 relative z-10" />
            </div>
            <h3 className="text-xl font-black text-[#1A1F3D] mb-3">ร้านปิดให้บริการชั่วคราว</h3>
            <p className="text-sm text-gray-400 max-w-sm font-medium leading-relaxed">
              ขณะนี้ทางร้านยังไม่เปิดรับคิวใหม่ กรุณาตรวจสอบอีกครั้งภายหลัง หรือติดต่อทางร้านโดยตรง
            </p>
          </div>
        ) : (
          <div className="flex-1 p-6 pt-2 overflow-y-auto scrollbar-hide flex flex-col md:flex-row gap-6">
            
            {/* Column 1: Who & What */}
            <div className="flex-1 space-y-4">
              {/* Pet Owner Card */}
              <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-white/60 relative overflow-visible group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
                <label className="text-xs font-black uppercase text-gray-400 mb-3 block tracking-widest relative z-10">1. เลือกลูกค้า (เจ้าของ)</label>
                <div className="relative z-10">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                  <input 
                    type="text"
                    placeholder="ค้นหาชื่อหรือเบอร์โทร..."
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-[#1A1F3D]/10 transition-all"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearching(true);
                      if (selectedOwnerId) setSelectedOwnerId('');
                    }}
                    onFocus={() => setIsSearching(true)}
                  />
                </div>

                {isSearching && searchQuery.length > 0 && (
                  <div className="absolute left-6 right-6 top-[calc(100%-0.5rem)] mt-2 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden max-h-40 overflow-y-auto">
                    {filteredCustomers.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectOwner(c.id, c.name)}
                        className="w-full px-4 py-3 text-left hover:bg-[#F5F6FA] transition-colors border-b border-gray-50/50 last:border-0"
                      >
                        <p className="text-sm font-bold text-[#1A1F3D]">{c.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold mt-1">{c.phone}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Pet Selection Card */}
              <div className={cn("bg-white p-6 rounded-[1.5rem] shadow-sm border border-white/60 relative overflow-hidden transition-all duration-500", !selectedOwner && "opacity-50")}>
                <label className="text-xs font-black uppercase text-gray-400 mb-3 block tracking-widest relative z-10">2. เลือกสัตว์เลี้ยง</label>
                {!selectedOwner ? (
                  <div className="h-24 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">กรุณาเลือกลูกค้าก่อน</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 relative z-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {selectedOwner.pets.map(pet => (
                      <button
                        key={pet.id}
                        type="button"
                        onClick={() => setSelectedPetId(pet.id)}
                        className={cn(
                          "flex flex-col items-center p-3 rounded-2xl border-2 transition-all gap-2 overflow-hidden relative",
                          selectedPetId === pet.id 
                            ? "bg-[#1A1F3D] border-[#1A1F3D] text-white shadow-lg shadow-[#1A1F3D]/10 transform scale-[1.02]" 
                            : "bg-[#F5F6FA] border-transparent hover:border-[#1A1F3D]/10 text-gray-600 hover:bg-gray-50"
                        )}
                      >
                        <img src={pet.image} className="w-10 h-10 rounded-xl object-cover shadow-sm z-10 bg-white" />
                        <span className="text-[10px] font-black z-10">{pet.name}</span>
                        {selectedPetId === pet.id && (
                           <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Service Selection Card */}
              <div className={cn("bg-white p-6 rounded-[1.5rem] shadow-sm border border-white/60 transition-all duration-500", !selectedPet && "opacity-50")}>
                <label className="text-xs font-black uppercase text-gray-400 mb-3 block tracking-widest">3. เลือกบริการ</label>
                {!selectedPet ? (
                  <div className="h-20 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">กรุณาเลือกสัตว์เลี้ยงก่อน</span>
                  </div>
                ) : (
                  <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {services
                      .filter(s => !s.targetSpecies || !selectedPet.species || s.targetSpecies.toLowerCase() === selectedPet.species.toLowerCase())
                      .map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedServiceId(s.id)}
                          className={cn(
                            "w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left group",
                            selectedServiceId === s.id 
                              ? "bg-[#1A1F3D] border-[#1A1F3D] text-white shadow-lg shadow-[#1A1F3D]/10 transform scale-[1.01]" 
                              : "bg-[#F5F6FA] border-transparent hover:border-[#1A1F3D]/10 hover:bg-gray-50"
                          )}
                        >
                          <div className={cn("p-1.5 rounded-lg transition-colors", selectedServiceId === s.id ? "bg-white/10" : "bg-white text-gray-400 group-hover:text-[#1A1F3D]")}>
                            <Scissors size={14} className={selectedServiceId === s.id ? "text-[#D9ED5F]" : "currentColor"} />
                          </div>
                          <span className="text-[11px] font-bold">{s.title}</span>
                        </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Add-on Selection Card */}
              <div className={cn("bg-white p-6 rounded-[1.5rem] shadow-sm border border-white/60 transition-all duration-500", !selectedServiceId && "opacity-50 hidden")}>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs font-black uppercase text-gray-400 block tracking-widest">บริการเสริม (ไม่บังคับ)</label>
                </div>
                {!selectedServiceId ? null : (
                  <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {addons.map(addon => {
                      const isSelected = selectedAddonIds.includes(addon.id);
                      return (
                        <button
                          key={addon.id}
                          type="button"
                          onClick={() => {
                            setSelectedAddonIds(prev => 
                              isSelected ? prev.filter(id => id !== addon.id) : [...prev, addon.id]
                            );
                          }}
                          className={cn(
                            "flex items-center gap-2 p-3 rounded-2xl border-2 transition-all text-left group",
                            isSelected 
                              ? "bg-[#1A1F3D] border-[#1A1F3D] text-white shadow-lg shadow-[#1A1F3D]/10" 
                              : "bg-white border-gray-100 hover:border-[#1A1F3D]/20 hover:bg-gray-50"
                          )}
                        >
                          <div className={cn(
                            "w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0",
                            isSelected ? "bg-[#D9ED5F] border-[#D9ED5F] text-[#1A1F3D]" : "border-gray-300 bg-white group-hover:border-[#1A1F3D]/30"
                          )}>
                            {isSelected && <Check size={10} strokeWidth={4} />}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-bold truncate">{addon.name}</span>
                            <span className={cn("text-[9px]", isSelected ? "text-gray-300" : "text-gray-500")}>+฿{addon.price}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: When */}
            <div className="flex-1 space-y-4">
              {/* Date Card */}
              <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-white/60 animate-in slide-in-from-right-8 fade-in duration-700">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-[#F5F6FA] rounded-xl flex items-center justify-center text-[#1A1F3D]">
                    <CalendarIcon size={16} />
                  </div>
                  <span className="text-xs font-black uppercase text-gray-400 tracking-widest">4. เลือกวันที่</span>
                </div>
                
                <div className="flex justify-center scale-95 origin-top">
                  <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => {
                      setSelectedDate(d);
                      setTime(''); // รีเซ็ตเวลาหากเปลี่ยนวันที่
                    }}
                    disabled={isDayDisabled}
                    modifiers={{
                      holiday: (date) => isHoliday(date)
                    }}
                    modifiersClassNames={{
                      holiday: "bg-red-50 text-red-300 line-through opacity-50"
                    }}
                    classNames={{
                      months: "w-full",
                      month: "w-full space-y-3",
                      caption: "flex justify-center relative items-center mb-3",
                      caption_label: "text-sm font-black text-[#1A1F3D] uppercase tracking-widest",
                      nav: "flex items-center",
                      nav_button: "h-7 w-7 bg-[#F5F6FA] hover:bg-gray-100 rounded-lg flex items-center justify-center transition-colors",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex w-full justify-center mb-1",
                      head_cell: "text-gray-300 w-8 font-black text-[9px] uppercase text-center",
                      row: "flex w-full justify-center mt-1",
                      cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 w-8",
                      day: "h-8 w-8 p-0 font-bold rounded-lg transition-all hover:bg-gray-50 flex items-center justify-center mx-auto text-xs",
                      day_selected: "bg-[#D9ED5F] text-[#1A1F3D] hover:bg-[#D9ED5F] shadow-lg shadow-[#D9ED5F]/20",
                      day_today: "text-[#1A1F3D] border-2 border-[#D9ED5F]/30",
                      day_outside: "text-gray-300 opacity-40",
                      day_disabled: "text-gray-300 opacity-60 cursor-not-allowed line-through relative after:content-[''] after:absolute after:inset-0 after:flex after:items-center after:justify-center",
                    }}
                    components={{
                      IconLeft: () => <ChevronLeft size={14} />,
                      IconRight: () => <ChevronRight size={14} />,
                    }}
                  />
                </div>
                
                {selectedDate && isHoliday(selectedDate) && (
                  <div className="mt-4 p-3 bg-red-50/80 rounded-xl flex items-center gap-2 text-red-600 animate-in fade-in slide-in-from-top-2 border border-red-100">
                    <Ban size={16} />
                    <p className="text-[10px] font-black uppercase tracking-widest">ร้านปิดให้บริการในวันนี้</p>
                  </div>
                )}
              </div>

              {/* Slots Card */}
              <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-white/60 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-150">
                {selectedDate && !isHoliday(selectedDate) ? (
                  <div className="scale-95 origin-top">
                    <SlotPicker selectedDate={selectedDate} selectedTime={time} onSelect={setTime} />
                  </div>
                ) : (
                  <div className="h-32 flex flex-col items-center justify-center opacity-30 text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                      <Ban size={20} className="text-gray-400" />
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-widest">ไม่มีคิวว่าง</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Footer */}
        {shopIsOpen && (
          <div className="p-6 bg-[#F8F9FD] shrink-0 mt-auto border-t border-white">
            <button 
              type="submit"
              disabled={!selectedDate || isHoliday(selectedDate) || !time || !selectedPet || !selectedService}
              onClick={handleSubmit}
              className="w-full bg-[#D9ED5F] hover:bg-[#c8db54] disabled:bg-gray-200 disabled:text-gray-400 text-[#1A1F3D] font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-[#D9ED5F]/20 active:scale-95 text-xs uppercase tracking-widest"
            >
              ยืนยันการนัดหมาย
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingModal;