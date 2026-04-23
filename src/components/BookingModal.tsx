"use client";

import React, { useState, useMemo } from 'react';
import { X, Calendar, Clock, Dog, User, Scissors, Search, ChevronDown } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import SlotPicker from './SlotPicker';

interface BookingModalProps {
  onClose: () => void;
}

const BookingModal = ({ onClose }: BookingModalProps) => {
  const { customers, services, addBooking } = useStore();
  
  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [selectedPetId, setSelectedPetId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
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
    setSelectedPetId(''); // Reset pet when owner changes
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPet || !selectedService || !date || !time) {
      toast.error("Please select a pet, service, date and time slot");
      return;
    }

    addBooking({
      petId: selectedPet.id,
      petName: selectedPet.name,
      ownerName: selectedOwner?.name || '',
      serviceName: selectedService.title,
      date: date,
      time: time,
      status: 'Waiting',
      image: selectedPet.image
    });

    toast.success(`Booking confirmed for ${selectedPet.name} on ${date} at ${time}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]">
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

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Panel: Selection */}
          <div className="w-full md:w-[350px] p-10 border-r border-gray-50 space-y-8 overflow-y-auto scrollbar-hide">
            {/* Select Owner */}
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

            {/* Pet Selection */}
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
                          : "bg-white border-gray-100 hover:border-gray-200 text-gray-600"
                      )}
                    >
                      <img src={pet.image} className="w-10 h-10 rounded-xl object-cover" />
                      <span className="text-[10px] font-black">{pet.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Service Selection */}
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
                        : "bg-white border-gray-100 hover:border-gray-200"
                    )}
                  >
                    <Scissors size={14} className={selectedServiceId === s.id ? "text-[#D9ED5F]" : "text-gray-300"} />
                    <span className="text-xs font-bold">{s.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Date & Slot */}
          <div className="flex-1 p-10 bg-[#F8F9FD] overflow-y-auto scrollbar-hide space-y-8">
            {/* Date Selection */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-gray-400 px-2 tracking-widest flex items-center gap-2">
                <Calendar size={12} /> Appointment Date
              </label>
              <input 
                type="date"
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-white border-none rounded-2xl px-6 py-4 text-sm font-black shadow-sm focus:ring-2 focus:ring-[#1A1F3D]/5"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>

            {/* Time Slots */}
            <SlotPicker selectedTime={time} onSelect={setTime} />
          </div>
        </div>

        {/* Footer */}
        <div className="p-10 border-t border-gray-50 bg-white shrink-0">
          <button 
            type="submit"
            onClick={handleSubmit}
            className="w-full bg-[#D9ED5F] hover:bg-[#c8db54] text-[#1A1F3D] font-black py-5 rounded-[28px] flex items-center justify-center gap-2 transition-all shadow-xl shadow-[#D9ED5F]/20 active:scale-95 disabled:bg-gray-100 disabled:text-gray-300"
            disabled={!selectedPet || !selectedService || !date || !time}
          >
            Confirm Appointment
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;