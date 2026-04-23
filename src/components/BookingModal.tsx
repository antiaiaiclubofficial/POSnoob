"use client";

import React, { useState, useMemo } from 'react';
import { X, Calendar, Clock, Dog, User, Scissors, Search, ChevronDown } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import TimePicker from './TimePicker';

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
  const [time, setTime] = useState('09:00');

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
    if (!selectedPet || !selectedService || !time) {
      toast.error("Please fill in all details");
      return;
    }

    addBooking({
      petId: selectedPet.id,
      petName: selectedPet.name,
      ownerName: selectedOwner?.name || '',
      serviceName: selectedService.title,
      time: time,
      status: 'Waiting',
      image: selectedPet.image
    });

    toast.success(`Booking confirmed for ${selectedPet.name} at ${time}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-8 border-b border-gray-50 flex justify-between items-start shrink-0">
          <div>
            <h2 className="text-3xl font-black text-[#1A1F3D] mb-1">New Booking</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Schedule a pet service</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
          <div className="space-y-6">
            {/* Select Owner with Search */}
            <div className="relative">
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Select Owner</label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  type="text"
                  placeholder="Choose a customer..."
                  className="w-full bg-[#F5F6FA] border-none rounded-[20px] pl-14 pr-6 py-4 text-sm font-bold focus:ring-2 focus:ring-[#1A1F3D]/5"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearching(true);
                    if (selectedOwnerId) setSelectedOwnerId('');
                  }}
                  onFocus={() => setIsSearching(true)}
                />
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={18} />
              </div>

              {/* Search Results Dropdown */}
              {isSearching && searchQuery.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden max-h-48 overflow-y-auto">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectOwner(c.id, c.name)}
                        className="w-full px-6 py-3.5 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                      >
                        <p className="text-sm font-bold text-[#1A1F3D]">{c.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{c.phone}</p>
                      </button>
                    ))
                  ) : (
                    <div className="px-6 py-4 text-xs text-gray-400 font-bold">No customers found</div>
                  )}
                </div>
              )}
            </div>

            {/* Pet Selection */}
            {selectedOwner && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Select Pet</label>
                <div className="flex flex-wrap gap-2">
                  {selectedOwner.pets.map(pet => (
                    <button
                      key={pet.id}
                      type="button"
                      onClick={() => setSelectedPetId(pet.id)}
                      className={cn(
                        "flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border transition-all",
                        selectedPetId === pet.id 
                          ? "bg-[#1A1F3D] border-[#1A1F3D] text-white shadow-lg" 
                          : "bg-white border-gray-100 hover:border-gray-200 text-gray-600"
                      )}
                    >
                      <img src={pet.image} className="w-6 h-6 rounded-lg object-cover" />
                      <span className="text-xs font-bold">{pet.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-8">
              {/* Service Selection */}
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-3 block tracking-widest">Select Service</label>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                  {services.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedServiceId(s.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                        selectedServiceId === s.id 
                          ? "bg-[#1A1F3D] border-[#1A1F3D] text-white shadow-md" 
                          : "bg-white border-gray-100 hover:border-gray-200"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Scissors size={14} className={selectedServiceId === s.id ? "text-[#D9ED5F]" : "text-gray-300"} />
                        <span className="text-xs font-bold">{s.title}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Time Picker UI */}
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-3 block tracking-widest">Select Time</label>
                <TimePicker value={time} onChange={setTime} />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-8 border-t border-gray-50 bg-gray-50/30 shrink-0">
          <button 
            type="submit"
            onClick={handleSubmit}
            className="w-full bg-[#D9ED5F] hover:bg-[#c8db54] text-[#1A1F3D] font-black py-5 rounded-[24px] flex items-center justify-center gap-2 transition-all shadow-xl shadow-[#D9ED5F]/20 active:scale-95"
          >
            Confirm Booking Appointment
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;