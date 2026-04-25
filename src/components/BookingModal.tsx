"use client";

import React, { useState, useMemo } from 'react';
import { X, Calendar as CalendarIcon, User, Scissors, ChevronLeft, ChevronRight, AlertTriangle, Ban } from 'lucide-react';
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
  const { customers, services, addBooking, shopIsOpen, recurringHolidays, specificHolidays } = useStore();
  
  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [selectedPetId, setSelectedPetId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
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

    addBooking({
      petId: selectedPet.id,
      petName: selectedPet.name,
      ownerName: selectedOwner?.name || '',
      serviceName: selectedService.title,
      date: dateStr,
      time: time,
      status: 'Waiting',
      image: selectedPet.image
    });

    toast.success(`Booking confirmed for ${selectedPet.name} on ${dateStr} at ${time}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-5xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="p-10 border-b border-gray-50 flex justify-between items-start shrink-0">
          <div>
            <h2 className="text-3xl font-black text-[#1A1F3D] mb-1">New Appointment</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Select details for your furry friend</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-50 rounded-2xl transition-all">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {!shopIsOpen ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[32px] flex items-center justify-center mb-6">
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-2xl font-black text-[#1A1F3D] mb-2">Shop is Temporarily Closed</h3>
            <p className="text-sm text-gray-400 max-w-xs font-medium">
              We are not accepting new bookings at this time. Please check back later or contact us directly.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Left Panel */}
            <div className="w-full md:w-[350px] p-10 border-r border-gray-50 space-y-8 overflow-y-auto scrollbar-hide bg-white">
              <div className="relative">
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Pet Owner</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                  <input 
                    type="text"
                    placeholder="Search owner..."
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-[#1A1F3D]/5"
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
                  <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden max-h-48 overflow-y-auto">
                    {filteredCustomers.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectOwner(c.id, c.name)}
                        className="w-full px-5 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                      >
                        <p className="text-sm font-bold text-[#1A1F3D]">{c.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{c.phone}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedOwner && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-3 block tracking-widest">Select Pet</label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedOwner.pets.map(pet => (
                      <button
                        key={pet.id}
                        type="button"
                        onClick={() => setSelectedPetId(pet.id)}
                        className={cn(
                          "flex flex-col items-center p-3 rounded-2xl border transition-all gap-2",
                          selectedPetId === pet.id 
                            ? "bg-[#1A1F3D] border-[#1A1F3D] text-white shadow-md" 
                            : "bg-[#F8F9FD] border-transparent hover:border-gray-200 text-gray-600"
                        )}
                      >
                        <img src={pet.image} className="w-10 h-10 rounded-xl object-cover" />
                        <span className="text-[10px] font-black">{pet.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-3 block tracking-widest">Service</label>
                <div className="space-y-2">
                  {services.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedServiceId(s.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left",
                        selectedServiceId === s.id 
                          ? "bg-[#1A1F3D] border-[#1A1F3D] text-white shadow-md" 
                          : "bg-[#F8F9FD] border-transparent hover:border-gray-200"
                      )}
                    >
                      <Scissors size={14} className={selectedServiceId === s.id ? "text-[#D9ED5F]" : "text-gray-300"} />
                      <span className="text-xs font-bold">{s.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div className="flex-1 p-10 bg-[#F8F9FD] overflow-y-auto scrollbar-hide flex flex-col gap-10">
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100/50">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-[#1A1F3D]">
                    <CalendarIcon size={16} />
                  </div>
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Select Date</span>
                </div>
                
                <div className="flex justify-center">
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
                      month: "w-full space-y-4",
                      caption: "flex justify-center relative items-center mb-4",
                      caption_label: "text-sm font-black text-[#1A1F3D] uppercase tracking-widest",
                      nav: "flex items-center",
                      nav_button: "h-8 w-8 bg-[#F5F6FA] hover:bg-gray-100 rounded-xl flex items-center justify-center transition-colors",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex w-full justify-between mb-2",
                      head_cell: "text-gray-300 w-9 font-black text-[9px] uppercase",
                      row: "flex w-full justify-between mt-1",
                      cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                      day: "h-9 w-9 p-0 font-bold rounded-xl transition-all hover:bg-gray-50 flex items-center justify-center",
                      day_selected: "bg-[#D9ED5F] text-[#1A1F3D] hover:bg-[#D9ED5F] shadow-lg shadow-[#D9ED5F]/20",
                      day_today: "text-[#1A1F3D] border-2 border-[#D9ED5F]/30",
                      day_outside: "text-gray-100 opacity-50",
                      day_disabled: "text-gray-200 opacity-20 cursor-not-allowed line-through relative after:content-[''] after:absolute after:inset-0 after:flex after:items-center after:justify-center",
                    }}
                    components={{
                      IconLeft: () => <ChevronLeft size={14} />,
                      IconRight: () => <ChevronRight size={14} />,
                    }}
                  />
                </div>
                
                {selectedDate && isHoliday(selectedDate) && (
                  <div className="mt-6 p-4 bg-red-50 rounded-2xl flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
                    <Ban size={18} />
                    <p className="text-xs font-black uppercase tracking-widest">Shop is Closed Today</p>
                  </div>
                )}
              </div>

              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100/50">
                {selectedDate && !isHoliday(selectedDate) ? (
                  <SlotPicker selectedTime={time} onSelect={setTime} />
                ) : (
                  <div className="h-40 flex flex-col items-center justify-center opacity-20 text-center">
                    <Ban size={32} className="mb-2" />
                    <p className="text-xs font-bold uppercase">No slots available on holidays</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {shopIsOpen && (
          <div className="p-10 border-t border-gray-50 bg-white shrink-0">
            <button 
              type="submit"
              disabled={!selectedDate || isHoliday(selectedDate) || !time}
              onClick={handleSubmit}
              className="w-full bg-[#D9ED5F] hover:bg-[#c8db54] disabled:bg-gray-100 disabled:text-gray-300 text-[#1A1F3D] font-black py-5 rounded-[28px] flex items-center justify-center gap-2 transition-all shadow-xl shadow-[#D9ED5F]/20 active:scale-95"
            >
              Confirm Appointment
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingModal;