"use client";

import React, { useState, useMemo } from 'react';
import { X, Calendar, Clock, User, Dog, Plus, ArrowRight, Home } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, differenceInDays, parseISO } from 'date-fns';

interface HotelBookingModalProps {
  roomName: string;
  roomIndex: number;
  onClose: () => void;
  onSave: (booking: any) => void;
}

const HotelBookingModal = ({ roomName, roomIndex, onClose, onSave }: HotelBookingModalProps) => {
  const { customers } = useStore();
  
  // Search & Selection States
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [selectedPetId, setSelectedPetId] = useState('');

  // Stay Details States
  const [checkInDate, setCheckInDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [checkInTime, setCheckInTime] = useState('12:00');
  const [checkOutDate, setCheckOutDate] = useState(format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'));
  const [checkOutTime, setCheckOutTime] = useState('12:00');

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

  // Auto-calculate stay days
  const stayDays = useMemo(() => {
    try {
      const start = parseISO(checkInDate);
      const end = parseISO(checkOutDate);
      const diff = differenceInDays(end, start);
      return diff > 0 ? diff : 1; // อย่างน้อย 1 คืน
    } catch (e) {
      return 1;
    }
  }, [checkInDate, checkOutDate]);

  const handleSelectOwner = (id: string, name: string) => {
    setSelectedOwnerId(id);
    setSearchQuery(name);
    setIsSearching(false);
    setSelectedPetId('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOwner || !selectedPet) {
      toast.error("กรุณาเลือกข้อมูลลูกค้าและสัตว์เลี้ยง");
      return;
    }

    if (new Date(checkInDate) > new Date(checkOutDate)) {
      toast.error("วันที่ Check-out ต้องอยู่หลังวันที่ Check-in");
      return;
    }

    const bookingData = {
      roomIndex,
      roomName,
      customerId: selectedOwner.id,
      customerName: selectedOwner.name,
      customerPhone: selectedOwner.phone,
      petId: selectedPet.id,
      petName: selectedPet.name,
      petImage: selectedPet.image,
      petSpecies: selectedPet.species,
      petBreed: selectedPet.breed,
      checkInDate,
      checkInTime,
      checkOutDate,
      checkOutTime,
      stayDays
    };

    onSave(bookingData);
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1A1F3D] rounded-2xl flex items-center justify-center text-[#D9ED5F] shadow-lg">
              <Home size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1A1F3D]">จองห้องพักโรงแรมสัตว์เลี้ยง</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ห้องพักหมายเลข: {roomName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
          {/* 1. Customer & Pet Selection */}
          <div className="space-y-6">
            <div className="relative">
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">ค้นหาเจ้าของสัตว์เลี้ยง (Customer)</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                <input 
                  type="text"
                  placeholder="พิมพ์ชื่อลูกค้า หรือเบอร์โทรศัพท์..."
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-[#1A1F3D]/5"
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
                      className="w-full px-5 py-3.5 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 flex justify-between items-center"
                    >
                      <div>
                        <p className="text-sm font-bold text-[#1A1F3D]">{c.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{c.phone}</p>
                      </div>
                      <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-black uppercase">{c.membership}</span>
                    </button>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <div className="p-4 text-center text-xs text-gray-400 font-bold">ไม่พบข้อมูลลูกค้า</div>
                  )}
                </div>
              )}
            </div>

            {selectedOwner && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="text-[10px] font-black uppercase text-gray-400 mb-3 block tracking-widest px-1">เลือกสัตว์เลี้ยงที่เข้าพัก (Select Pet)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedOwner.pets.map(pet => (
                    <button
                      key={pet.id}
                      type="button"
                      onClick={() => setSelectedPetId(pet.id)}
                      className={cn(
                        "flex flex-col items-center p-4 rounded-2xl border transition-all gap-2 text-center",
                        selectedPetId === pet.id 
                          ? "bg-[#1A1F3D] border-[#1A1F3D] text-white shadow-md" 
                          : "bg-[#F8F9FD] border-transparent hover:border-gray-200 text-gray-600"
                      )}
                    >
                      <img src={pet.image} className="w-12 h-12 rounded-xl object-cover shadow-sm" alt={pet.name} />
                      <div>
                        <span className="text-xs font-black block">{pet.name}</span>
                        <span className={cn("text-[8px] font-bold uppercase", selectedPetId === pet.id ? "text-[#D9ED5F]" : "text-gray-400")}>{pet.breed}</span>
                      </div>
                    </button>
                  ))}
                  {selectedOwner.pets.length === 0 && (
                    <div className="col-span-full p-4 text-center text-xs text-gray-400 font-bold bg-gray-50 rounded-2xl">
                      ลูกค้าท่านนี้ยังไม่มีสัตว์เลี้ยงลงทะเบียนในระบบ
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Check-in & Check-out Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
            {/* Check-in */}
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1 block">Check-in Details</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-gray-400 uppercase">Date</label>
                  <input 
                    type="date" 
                    className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-xs font-bold"
                    value={checkInDate}
                    onChange={e => setCheckInDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-gray-400 uppercase">Time</label>
                  <input 
                    type="time" 
                    className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-xs font-bold"
                    value={checkInTime}
                    onChange={e => setCheckInTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Check-out */}
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1 block">Check-out Details</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-gray-400 uppercase">Date</label>
                  <input 
                    type="date" 
                    className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-xs font-bold"
                    value={checkOutDate}
                    onChange={e => setCheckOutDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-gray-400 uppercase">Time</label>
                  <input 
                    type="time" 
                    className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-xs font-bold"
                    value={checkOutTime}
                    onChange={e => setCheckOutTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Stay Summary */}
          <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-[32px] flex items-center justify-between">
            <div>
              <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Stay Duration</span>
              <h4 className="text-xl font-black text-[#1A1F3D] mt-1">จำนวนเข้าพักทั้งหมด: {stayDays} คืน</h4>
            </div>
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
              <Calendar size={20} />
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={!selectedOwnerId || !selectedPetId}
            className="w-full bg-[#1A1F3D] text-white font-black py-5 rounded-[24px] flex items-center justify-center gap-3 shadow-xl shadow-[#1A1F3D]/10 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            ยืนยันการจองห้องพัก <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default HotelBookingModal;