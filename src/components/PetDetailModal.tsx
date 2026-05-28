"use client";

import React from 'react';
import { X, Calendar, Scale, ShieldAlert, Heart, FileText, Sparkles, Info, Eye } from 'lucide-react';
import { Pet } from '@/store/types';
import { calculateAge } from '@/utils/petData';
import { cn } from '@/lib/utils';

interface PetDetailModalProps {
  pet: Pet;
  onClose: () => void;
}

const PetDetailModal = ({ pet, onClose }: PetDetailModalProps) => {
  const weightHistory = pet.weightHistory || [];
  const latestWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1]?.value : 'N/A';

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1A1F3D] rounded-2xl flex items-center justify-center text-[#D9ED5F] shadow-lg">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1A1F3D]">ข้อมูลสัตว์เลี้ยง (Pet Profile)</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Detailed Information</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-8 overflow-y-auto scrollbar-hide flex-1">
          {/* Top Section: Image & Basic Info */}
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            <img 
              src={pet.image} 
              alt={pet.name} 
              className="w-32 h-32 rounded-[32px] object-cover border-4 border-white shadow-lg shrink-0"
            />
            <div className="flex-1 space-y-4 text-center sm:text-left w-full">
              <div>
                <h2 className="text-3xl font-black text-[#1A1F3D]">{pet.name}</h2>
                <p className="text-xs text-indigo-600 font-black uppercase tracking-wider mt-1">
                  {pet.species} • {pet.breed}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-[#F5F6FA] p-3 rounded-2xl">
                  <p className="text-[9px] text-gray-400 font-black uppercase mb-1">อายุ (Age)</p>
                  <p className="text-xs font-black text-[#1A1F3D]">{calculateAge(pet.birthday)}</p>
                </div>
                <div className="bg-[#F5F6FA] p-3 rounded-2xl">
                  <p className="text-[9px] text-gray-400 font-black uppercase mb-1">น้ำหนัก (Weight)</p>
                  <p className="text-xs font-black text-[#1A1F3D]">{latestWeight} {latestWeight !== 'N/A' ? 'กก.' : ''}</p>
                </div>
                <div className="bg-[#F5F6FA] p-3 rounded-2xl col-span-2 sm:col-span-1">
                  <p className="text-[9px] text-gray-400 font-black uppercase mb-1">ความยาวขน (Coat)</p>
                  <p className="text-xs font-black text-[#1A1F3D]">{pet.coatType === 'Short' ? 'ขนสั้น' : 'ขนยาว'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Attributes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
            <div>
              <p className="text-[9px] text-gray-400 font-black uppercase mb-1">สีขน (Color)</p>
              <p className="text-sm font-bold text-[#1A1F3D]">{pet.color || '-'}</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-400 font-black uppercase mb-1">ลักษณะนิสัย (Temperament)</p>
              <p className="text-sm font-bold text-[#1A1F3D]">{pet.temperament || '-'}</p>
            </div>
          </div>

          {/* Medical & Care Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
              <ShieldAlert size={16} className="text-red-500" />
              <h4 className="text-xs font-black uppercase text-[#1A1F3D] tracking-wider">ข้อมูลสุขภาพและการดูแล (Medical & Care)</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-red-50/30 border border-red-100 p-5 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-red-600 mb-2">ข้อควรระวัง (Precautions)</p>
                <p className="text-xs font-bold text-red-900/80 leading-relaxed">{pet.precautions || 'ไม่มีข้อควรระวังพิเศษ'}</p>
              </div>
              <div className="bg-amber-50/30 border border-amber-100 p-5 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-amber-600 mb-2">โรคประจำตัว (Medical Condition)</p>
                <p className="text-xs font-bold text-amber-900/80 leading-relaxed">{pet.medicalCondition || 'ไม่มีโรคประจำตัว'}</p>
              </div>
            </div>
          </div>

          {/* Vaccine Book Image */}
          {pet.vaccineBookImage && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <FileText size={16} className="text-indigo-500" />
                <h4 className="text-xs font-black uppercase text-[#1A1F3D] tracking-wider">สมุดวัคซีน (Vaccine Book)</h4>
              </div>
              <div className="relative w-full max-w-xs mx-auto bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                <img 
                  src={pet.vaccineBookImage} 
                  alt="Vaccine Book" 
                  className="w-full h-48 object-cover"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
              <FileText size={16} className="text-gray-400" />
              <h4 className="text-xs font-black uppercase text-[#1A1F3D] tracking-wider">หมายเหตุเพิ่มเติม (Notes)</h4>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-5 rounded-2xl border border-gray-100">
              {pet.notes || 'ไม่มีหมายเหตุเพิ่มเติม'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="bg-[#1A1F3D] text-white px-8 py-3 rounded-xl font-black text-xs shadow-md hover:bg-[#2A3152] transition-all"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};

export default PetDetailModal;