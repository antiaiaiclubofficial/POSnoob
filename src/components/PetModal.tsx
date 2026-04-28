"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Scale, Upload, Calendar, Dog as DogIcon, Cat as CatIcon } from 'lucide-react';
import { useStore, Pet } from '@/store/useStore';
import { DOG_BREEDS, CAT_BREEDS } from '@/utils/petData';
import { translations } from '@/utils/translations';
import { toast } from 'sonner';

interface PetModalProps {
  customerId: string;
  pet?: Pet | null;
  onClose: () => void;
}

const PetModal = ({ customerId, pet, onClose }: PetModalProps) => {
  const { addPet, updatePet, language } = useStore();
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    species: 'Dog' as 'Dog' | 'Cat' | 'Other',
    breed: '',
    birthday: '',
    initialWeight: '',
    notes: '',
    image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&h=200&fit=crop'
  });

  useEffect(() => {
    if (pet) {
      const history = pet.weightHistory || [];
      setFormData({
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        birthday: pet.birthday,
        initialWeight: history.length > 0 ? history[history.length - 1].value.toString() : '',
        notes: pet.notes,
        image: pet.image
      });
    }
  }, [pet]);

  const breeds = formData.species === 'Dog' ? DOG_BREEDS : formData.species === 'Cat' ? CAT_BREEDS : ["Mixed Breed", "Other"];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.breed || !formData.birthday) {
      toast.error(language === 'th' ? "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน" : "Please fill in all required fields");
      return;
    }

    if (pet) {
      updatePet(customerId, pet.id, {
        name: formData.name,
        species: formData.species,
        breed: formData.breed,
        birthday: formData.birthday,
        notes: formData.notes,
        image: formData.image
      });
      toast.success(language === 'th' ? `อัปเดตข้อมูลของ ${formData.name} เรียบร้อย!` : `${formData.name}'s profile updated!`);
    } else {
      if (!formData.initialWeight) {
        toast.error(language === 'th' ? "กรุณาระบุน้ำหนักเริ่มต้น" : "Initial weight is required");
        return;
      }
      addPet(customerId, {
        name: formData.name,
        species: formData.species,
        breed: formData.breed,
        birthday: formData.birthday,
        weightHistory: [{ date: new Date().toISOString().split('T')[0], value: Number(formData.initialWeight) }],
        serviceHistory: [],
        notes: formData.notes,
        image: formData.image
      });
      toast.success(language === 'th' ? `ลงทะเบียน ${formData.name} เรียบร้อย!` : `${formData.name} registered successfully!`);
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-[#1A1F3D]">{pet ? t.editPetProfile : t.newPetRegistration}</h2>
            <p className="text-xs text-gray-400 font-medium">{t.updatePetDetails}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-4">
            <div className="flex justify-center mb-2">
              <div className="relative group">
                <div className="w-24 h-24 bg-[#F5F6FA] rounded-[24px] overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center">
                  <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#1A1F3D] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                >
                  <Upload size={14} />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">{t.petName}</label>
                <input 
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl px-4 py-3.5 text-sm font-bold"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Buddy"
                />
              </div>
              <div className="w-1/3">
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">{t.species}</label>
                <select 
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl px-4 py-3.5 text-sm font-bold appearance-none"
                  value={formData.species}
                  onChange={e => setFormData({...formData, species: e.target.value as any, breed: ''})}
                >
                  <option value="Dog">{language === 'th' ? 'สุนัข' : 'Dog'}</option>
                  <option value="Cat">{language === 'th' ? 'แมว' : 'Cat'}</option>
                  <option value="Other">{language === 'th' ? 'อื่นๆ' : 'Other'}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">{t.breed}</label>
              <select 
                className="w-full bg-[#F5F6FA] border-none rounded-2xl px-4 py-3.5 text-sm font-bold appearance-none"
                value={formData.breed}
                onChange={e => setFormData({...formData, breed: e.target.value})}
              >
                <option value="">{language === 'th' ? 'เลือกสายพันธุ์...' : 'Select Breed...'}</option>
                {breeds.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">{t.birthday}</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={16} />
                  <input 
                    type="date"
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-4 py-3.5 text-xs font-bold"
                    value={formData.birthday}
                    onChange={e => setFormData({...formData, birthday: e.target.value})}
                  />
                </div>
              </div>
              {!pet && (
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">{language === 'th' ? 'น้ำหนัก (กก.)' : 'Weight (kg)'}</label>
                  <div className="relative">
                    <Scale className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                    <input 
                      type="number"
                      step="0.1"
                      className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-4 py-3.5 text-xs font-bold"
                      value={formData.initialWeight}
                      onChange={e => setFormData({...formData, initialWeight: e.target.value})}
                      placeholder="0.0"
                    />
                  </div>
                </div>
              )}
            </div>

            <textarea 
              className="w-full bg-[#F5F6FA] border-none rounded-2xl px-4 py-3 text-xs font-bold h-20 resize-none"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              placeholder={t.petNotes}
            />
          </div>

          <button className="w-full bg-[#1A1F3D] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all hover:bg-[#2A3152] shadow-xl shadow-[#1A1F3D]/10">
            {pet ? t.updatePetBtn : t.registerPetBtn}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PetModal;