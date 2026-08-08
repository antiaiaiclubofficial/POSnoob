import { format, subYears, subMonths } from 'date-fns';
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Scale, Upload, Calendar, Dog as DogIcon, Cat as CatIcon, Sparkles, ShieldAlert, Heart, FileText } from 'lucide-react';
import { useStore, Pet } from '@/store/useStore';
import { calculateAge } from '@/utils/petData';
import { translations } from '@/utils/translations';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PetModalProps {
  customerId: string;
  pet?: Pet | null;
  onClose: () => void;
}

const PetModal = ({ customerId, pet, onClose }: PetModalProps) => {
  const { addPet, updatePet, language } = useStore();
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const vaccineInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    species: 'Dog' as string,
    customSpecies: '',
    breed: '',
    birthday: '',
    initialWeight: '',
    coatType: 'Short',
    color: '',
    temperament: '',
    vaccineBookImage: '',
    precautions: '',
    medicalCondition: '',
    notes: '',
    image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&h=200&fit=crop'
  });

  const [isCustomSpecies, setIsCustomSpecies] = useState(false);
  const [ageYears, setAgeYears] = useState<string>('');
  const [ageMonths, setAgeMonths] = useState<string>('');

  useEffect(() => {
    if (pet) {
      const history = pet.weightHistory || [];
      const isStandardSpecies = ['Dog', 'Cat', 'Rabbit'].includes(pet.species);
      
      setFormData({
        name: pet.name,
        species: isStandardSpecies ? pet.species : 'Other',
        customSpecies: isStandardSpecies ? '' : pet.species,
        breed: pet.breed,
        birthday: pet.birthday,
        initialWeight: history.length > 0 ? history[history.length - 1].value.toString() : '',
        coatType: pet.coatType || 'Short',
        color: pet.color || '',
        temperament: pet.temperament || '',
        vaccineBookImage: pet.vaccineBookImage || '',
        precautions: pet.precautions || '',
        medicalCondition: pet.medicalCondition || '',
        notes: pet.notes || '',
        image: pet.image
      });
      setIsCustomSpecies(!isStandardSpecies);
      
      if (pet.birthday) {
        const birthDate = new Date(pet.birthday);
        const today = new Date();
        let y = today.getFullYear() - birthDate.getFullYear();
        let m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          y--;
          m += 12;
        }
        setAgeYears(Math.max(0, y).toString());
        setAgeMonths(Math.max(0, m).toString());
      }
    }
  }, [pet]);

  const handleBirthdayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBirthday = e.target.value;
    setFormData({ ...formData, birthday: newBirthday });
    
    if (newBirthday) {
      const birthDate = new Date(newBirthday);
      const today = new Date();
      let y = today.getFullYear() - birthDate.getFullYear();
      let m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        y--;
        m += 12;
      }
      setAgeYears(Math.max(0, y).toString());
      setAgeMonths(Math.max(0, m).toString());
    } else {
      setAgeYears('');
      setAgeMonths('');
    }
  };

  const handleAgeChange = (field: 'years' | 'months', value: string) => {
    if (field === 'years') setAgeYears(value);
    if (field === 'months') setAgeMonths(value);

    const yStr = field === 'years' ? value : ageYears;
    const mStr = field === 'months' ? value : ageMonths;
    
    const y = parseInt(yStr || '0', 10);
    const m = parseInt(mStr || '0', 10);

    if (isNaN(y) && isNaN(m)) {
      setFormData(prev => ({ ...prev, birthday: '' }));
      return;
    }

    const today = new Date();
    const newBirthdayDate = subMonths(subYears(today, y || 0), m || 0);
    setFormData(prev => ({ ...prev, birthday: format(newBirthdayDate, 'yyyy-MM-dd') }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'image' | 'vaccineBookImage') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.birthday) {
      toast.error(language === 'th' ? "กรุณากรอกชื่อและวันเกิดสัตว์เลี้ยง" : "Please fill in pet name and birthday");
      return;
    }

    const finalSpecies = formData.species === 'Other' ? formData.customSpecies : formData.species;
    if (!finalSpecies) {
      toast.error(language === 'th' ? "กรุณาระบุประเภทสัตว์เลี้ยง" : "Please specify pet species");
      return;
    }

    setIsSubmitting(true);
    const petPayload = {
      name: formData.name,
      species: finalSpecies,
      breed: formData.breed || 'Mixed Breed',
      birthday: formData.birthday,
      coatType: formData.coatType,
      color: formData.color,
      temperament: formData.temperament,
      vaccineBookImage: formData.vaccineBookImage,
      precautions: formData.precautions,
      medicalCondition: formData.medicalCondition,
      notes: formData.notes,
      image: formData.image,
      initialWeight: formData.initialWeight,
      weightHistory: pet ? undefined : [{ date: format(new Date(), 'yyyy-MM-dd'), value: Number(formData.initialWeight || 0) }]
    };

    try {
      if (pet) {
        await updatePet(customerId, pet.id, petPayload);
        toast.success(language === 'th' ? `อัปเดตข้อมูลของ ${formData.name} เรียบร้อย!` : `${formData.name}'s profile updated!`);
      } else {
        if (!formData.initialWeight) {
          toast.error(language === 'th' ? "กรุณาระบุน้ำหนักเริ่มต้น" : "Initial weight is required");
          return;
        }
        await addPet(customerId, petPayload);
        toast.success(language === 'th' ? `ลงทะเบียน ${formData.name} เรียบร้อย!` : `${formData.name} registered successfully!`);
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(language === 'th' ? "เกิดข้อผิดพลาดในการบันทึกข้อมูลสัตว์เลี้ยง" : "Failed to save pet data");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-[#1A1F3D]">{pet ? t.editPetProfile : t.newPetRegistration}</h2>
            <p className="text-xs text-gray-400 font-medium">{t.updatePetDetails}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto scrollbar-hide flex-1">
          {/* Avatar Upload Section */}
          <div className="flex justify-center mb-4">
            <div className="relative group">
              <div className="w-28 h-28 bg-[#F5F6FA] rounded-[32px] overflow-hidden border-4 border-white shadow-lg flex items-center justify-center">
                <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#1A1F3D] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform border-4 border-white"
              >
                <Upload size={16} />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'image')} />
            </div>
          </div>

          {/* Basic Info Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
              <Sparkles size={16} className="text-indigo-500" />
              <h3 className="text-xs font-black uppercase text-[#1A1F3D] tracking-wider">ข้อมูลทั่วไป (Basic Info)</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">ชื่อสัตว์เลี้ยง (Pet Name)</label>
                <input 
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl px-5 py-3.5 text-sm font-bold"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Buddy"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">ประเภทสัตว์เลี้ยง</label>
                  <select 
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl px-4 py-3.5 text-sm font-bold appearance-none"
                    value={formData.species}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData({...formData, species: val});
                      setIsCustomSpecies(val === 'Other');
                    }}
                  >
                    <option value="Dog">สุนัข (Dog)</option>
                    <option value="Cat">แมว (Cat)</option>
                    <option value="Rabbit">กระต่าย (Rabbit)</option>
                    <option value="Other">อื่นๆ (Other)</option>
                  </select>
                </div>

                {isCustomSpecies ? (
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">ระบุประเภทสัตว์</label>
                    <input 
                      className="w-full bg-[#F5F6FA] border-none rounded-2xl px-4 py-3.5 text-sm font-bold"
                      value={formData.customSpecies}
                      onChange={e => setFormData({...formData, customSpecies: e.target.value})}
                      placeholder="เช่น นก, หนูแฮมสเตอร์"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">สายพันธุ์ (Breed)</label>
                    <input 
                      className="w-full bg-[#F5F6FA] border-none rounded-2xl px-4 py-3.5 text-sm font-bold"
                      value={formData.breed}
                      onChange={e => setFormData({...formData, breed: e.target.value})}
                      placeholder="เช่น โกลเด้น, เปอร์เซีย"
                    />
                  </div>
                )}
              </div>
            </div>

            {isCustomSpecies && (
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">สายพันธุ์ (Breed)</label>
                <input 
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl px-5 py-3.5 text-sm font-bold"
                  value={formData.breed}
                  onChange={e => setFormData({...formData, breed: e.target.value})}
                  placeholder="เช่น โกลเด้น, เปอร์เซีย"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">วันเกิด / อายุ (Birthday / Age)</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={16} />
                  <input 
                    type="date"
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-4 py-3.5 text-xs font-bold"
                    value={formData.birthday}
                    onChange={handleBirthdayChange}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1 flex items-center bg-[#F5F6FA] rounded-2xl px-3">
                    <input
                      type="number"
                      min="0"
                      className="w-full bg-transparent border-none p-0 py-3 text-xs font-bold focus:ring-0 text-center [-moz-appearance:_textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none"
                      value={ageYears}
                      onChange={e => handleAgeChange('years', e.target.value)}
                      placeholder="0"
                    />
                    <span className="text-[10px] text-gray-500 font-bold ml-1">ปี</span>
                  </div>
                  <div className="relative flex-1 flex items-center bg-[#F5F6FA] rounded-2xl px-3">
                    <input
                      type="number"
                      min="0"
                      max="11"
                      className="w-full bg-transparent border-none p-0 py-3 text-xs font-bold focus:ring-0 text-center [-moz-appearance:_textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none"
                      value={ageMonths}
                      onChange={e => handleAgeChange('months', e.target.value)}
                      placeholder="0"
                    />
                    <span className="text-[10px] text-gray-500 font-bold ml-1">เดือน</span>
                  </div>
                </div>
              </div>

              {!pet && (
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">น้ำหนักเริ่มต้น (กก.)</label>
                  <div className="relative">
                    <Scale className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                    <input 
                      type="number"
                      step="0.1"
                      className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-4 py-3.5 text-xs font-bold"
                      value={formData.initialWeight}
                      onChange={e => setFormData({...formData, initialWeight: e.target.value})}
                      placeholder="0.0"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">ความยาวขน (Coat Length)</label>
                <select 
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl px-4 py-3.5 text-sm font-bold appearance-none"
                  value={formData.coatType}
                  onChange={e => setFormData({...formData, coatType: e.target.value})}
                >
                  <option value="Short">ขนสั้น (Short)</option>
                  <option value="Long">ขนยาว (Long)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">สีขน (Color)</label>
                <input 
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl px-5 py-3.5 text-sm font-bold"
                  value={formData.color}
                  onChange={e => setFormData({...formData, color: e.target.value})}
                  placeholder="เช่น สีน้ำตาล, ขาว-ดำ"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">ลักษณะนิสัย (Temperament)</label>
                <input 
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl px-5 py-3.5 text-sm font-bold"
                  value={formData.temperament}
                  onChange={e => setFormData({...formData, temperament: e.target.value})}
                  placeholder="เช่น ขี้เล่น, กลัวเสียงดัง"
                />
              </div>
            </div>
          </div>

          {/* Medical & Care Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
              <ShieldAlert size={16} className="text-red-500" />
              <h3 className="text-xs font-black uppercase text-[#1A1F3D] tracking-wider">ข้อมูลสุขภาพและการดูแล (Medical & Care)</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-red-500 mb-2 block tracking-wider">ข้อควรระวัง (Precautions)</label>
                <textarea 
                  className="w-full bg-red-50/30 border border-red-100 rounded-2xl px-4 py-3 text-xs font-bold h-20 resize-none focus:ring-2 focus:ring-red-200"
                  value={formData.precautions}
                  onChange={e => setFormData({...formData, precautions: e.target.value})}
                  placeholder="เช่น แพ้แชมพูบางชนิด, ดุเวลากล้อนขน"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-amber-600 mb-2 block tracking-wider">โรคประจำตัว (Medical Condition)</label>
                <textarea 
                  className="w-full bg-amber-50/30 border border-amber-100 rounded-2xl px-4 py-3 text-xs font-bold h-20 resize-none focus:ring-2 focus:ring-amber-200"
                  value={formData.medicalCondition}
                  onChange={e => setFormData({...formData, medicalCondition: e.target.value})}
                  placeholder="เช่น โรคหัวใจ, โรคผิวหนังอักเสบ"
                />
              </div>
            </div>

            {/* Vaccine Book Upload */}
            <div className="bg-[#F5F6FA] p-6 rounded-3xl border border-gray-100">
              <label className="text-[10px] font-black uppercase text-gray-400 mb-3 block tracking-wider">รูปสมุดวัคซีน (Vaccine Book Image)</label>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {formData.vaccineBookImage ? (
                  <div className="relative w-32 h-20 bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm shrink-0">
                    <img src={formData.vaccineBookImage} alt="Vaccine Book" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, vaccineBookImage: '' }))}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:scale-110 transition-transform"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button"
                    onClick={() => vaccineInputRef.current?.click()}
                    className="w-32 h-20 bg-white border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:text-indigo-500 hover:border-indigo-200 transition-all shrink-0"
                  >
                    <Upload size={18} className="mb-1" />
                    <span className="text-[8px] font-black uppercase">Upload Book</span>
                  </button>
                )}
                <input type="file" ref={vaccineInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'vaccineBookImage')} />
                <div className="text-left">
                  <p className="text-xs font-bold text-gray-600">อัพโหลดรูปภาพสมุดวัคซีนล่าสุด</p>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">รองรับไฟล์รูปภาพ JPG, PNG เพื่อใช้ตรวจสอบประวัติการฉีดวัคซีนของสัตว์เลี้ยง</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">หมายเหตุ / โน๊ตเพิ่มเติม (Notes)</label>
              <textarea 
                className="w-full bg-[#F5F6FA] border-none rounded-2xl px-4 py-3 text-xs font-bold h-24 resize-none"
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                placeholder="ระบุรายละเอียดหรือโน๊ตเพิ่มเติมเกี่ยวกับสัตว์เลี้ยง..."
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#1A1F3D] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all hover:bg-[#2A3152] shadow-xl shadow-[#1A1F3D]/10 disabled:opacity-50"
          >
            {isSubmitting ? (language === 'th' ? "กำลังบันทึก..." : "Saving...") : (pet ? t.updatePetBtn : t.registerPetBtn)}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PetModal;