"use client";

import React, { useState } from 'react';
import { X, Calendar, Clock, Dog, User, Scissors } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BookingModalProps {
  onClose: () => void;
}

const BookingModal = ({ onClose }: BookingModalProps) => {
  const { customers, services, addBooking } = useStore();
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [selectedPetId, setSelectedPetId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [time, setTime] = useState('09:00');

  const selectedOwner = customers.find(c => c.id === selectedOwnerId);
  const selectedPet = selectedOwner?.pets.find(p => p.id === selectedPetId);
  const selectedService = services.find(s => s.id === selectedServiceId);

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
      <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-[#1A1F3D]">New Booking</h2>
            <p className="text-xs text-gray-400 font-medium">Schedule a pet service</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">Select Owner</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <select 
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-[#1A1F3D]/5 appearance-none"
                  value={selectedOwnerId}
                  onChange={(e) => {
                    setSelectedOwnerId(e.target.value);
                    setSelectedPetId('');
                  }}
                >
                  <option value="">Choose a customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            {selectedOwner && (
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">Select Pet</label>
                <div className="flex gap-2">
                  {selectedOwner.pets.map(pet => (
                    <button
                      key={pet.id}
                      type="button"
                      onClick={() => setSelectedPetId(pet.id)}
                      className={cn(
                        "flex-1 flex items-center gap-2 p-3 rounded-2xl border transition-all",
                        selectedPetId === pet.id ? "bg-[#1A1F3D] text-white border-[#1A1F3D]" : "bg-white border-gray-100 hover:border-gray-300"
                      )}
                    >
                      <img src={pet.image} className="w-6 h-6 rounded-lg object-cover" />
                      <span className="text-xs font-bold">{pet.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">Service</label>
                <div className="relative">
                  <Scissors className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <select 
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-[#1A1F3D]/5 appearance-none"
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                  >
                    <option value="">Service...</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">Time</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input 
                    type="time"
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-[#1A1F3D]/5"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <button className="w-full bg-[#D9ED5F] hover:bg-[#c8db54] text-[#1A1F3D] font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#D9ED5F]/20 mt-4">
            Confirm Booking
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;