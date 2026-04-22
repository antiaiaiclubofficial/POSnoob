"use client";

import React, { useState } from 'react';
import { X, Dog, Cat, Info, Camera, Scale } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';

interface PetModalProps {
  customerId: string;
  onClose: () => void;
}

const PetModal = ({ customerId, onClose }: PetModalProps) => {
  const { addPet } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    species: 'Dog' as 'Dog' | 'Cat' | 'Other',
    breed: '',
    age: '',
    weight: '',
    notes: '',
    image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&h=200&fit=crop'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.breed) {
      toast.error("Please fill in basic pet details");
      return;
    }

    addPet(customerId, formData);
    toast.success(`${formData.name} registered successfully!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-[#1A1F3D]">Register New Pet</h2>
            <p className="text-xs text-gray-400 font-medium">Add a furry friend to the family</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">Pet Name</label>
                <input 
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-[#1A1F3D]/5"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Buddy"
                />
              </div>
              <div className="w-1/3">
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">Species</label>
                <select 
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-[#1A1F3D]/5 appearance-none"
                  value={formData.species}
                  onChange={e => setFormData({...formData, species: e.target.value as any})}
                >
                  <option value="Dog">Dog</option>
                  <option value="Cat">Cat</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">Breed</label>
              <input 
                className="w-full bg-[#F5F6FA] border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-[#1A1F3D]/5"
                value={formData.breed}
                onChange={e => setFormData({...formData, breed: e.target.value})}
                placeholder="Golden Retriever"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">Age</label>
                <input 
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-[#1A1F3D]/5"
                  value={formData.age}
                  onChange={e => setFormData({...formData, age: e.target.value})}
                  placeholder="2 years"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">Weight</label>
                <div className="relative">
                  <Scale className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                  <input 
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-[#1A1F3D]/5"
                    value={formData.weight}
                    onChange={e => setFormData({...formData, weight: e.target.value})}
                    placeholder="15kg"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">Medical/Care Notes</label>
              <textarea 
                className="w-full bg-[#F5F6FA] border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-[#1A1F3D]/5 h-24 resize-none"
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                placeholder="Any allergies or special needs..."
              />
            </div>
          </div>

          <button className="w-full bg-[#1A1F3D] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all mt-4">
            Register Pet
          </button>
        </form>
      </div>
    </div>
  );
};

export default PetModal;