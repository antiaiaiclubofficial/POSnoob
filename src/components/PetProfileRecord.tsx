"use client";

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Edit3, TrendingUp, History, ClipboardList, Calendar, 
  ChevronDown, ChevronUp, Scale, FileSearch, Eye, Plus
} from 'lucide-react';
import { useStore, Pet } from '@/store/useStore';
import { calculateAge } from '@/utils/petData';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import GroomingServiceModal from './GroomingServiceModal';
import PetDetailModal from './PetDetailModal';

interface PetProfileRecordProps {
  pet: Pet;
  onEdit: (pet: Pet) => void;
}

const PetProfileRecord = ({ pet, onEdit }: PetProfileRecordProps) => {
  const { currency, language, customers, updatePetWeight } = useStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedIntake, setSelectedIntake] = useState<any>(null);
  const [selectedHistory, setSelectedHistory] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isUpdateWeightOpen, setIsUpdateWeightOpen] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [isSubmittingWeight, setIsSubmittingWeight] = useState(false);

  const weightHistory = pet.weightHistory || [];
  const latestWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1]?.value : 'N/A';

  return (
    <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col relative group/pet transition-all hover:shadow-md">
      {/* Action Buttons */}
      <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
        <button
          onClick={() => setIsUpdateWeightOpen(true)}
          className="h-10 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 hover:bg-indigo-100 px-4 rounded-2xl transition-all"
        >
          <Plus size={14} /> อัพเดตน้ำหนัก
        </button>
        <button 
          onClick={() => setIsDetailOpen(true)}
          className="h-10 flex items-center justify-center gap-1.5 text-xs font-bold text-gray-400 bg-white hover:text-gray-600 rounded-2xl transition-all shadow-sm border border-gray-100 px-4"
        >
          <Eye size={16} /> ดูข้อมูล
        </button>
        <button 
          onClick={() => onEdit(pet)}
          className="w-10 h-10 flex items-center justify-center bg-[#1A1F3D] text-white hover:bg-[#2A3152] rounded-2xl transition-all shadow-sm"
        >
          <Edit3 size={16} />
        </button>
      </div>

      {/* Main Info Section */}
      <div className="flex flex-col md:flex-row">
        {/* Pet Info Sidebar */}
        <div className="w-full md:w-1/3 p-8 border-r border-gray-50 bg-[#F8F9FD]/50 flex flex-col items-center">
          <div className="relative mb-4">
            <img 
              src={pet.image} 
              className="w-32 h-32 rounded-[28px] object-cover border-4 border-white shadow-lg" 
              alt={pet.name}
            />
          </div>
          <div className="text-center">
            <h4 className="text-2xl font-black text-[#1A1F3D] mb-1">{pet.name}</h4>
            <p className="text-xs text-gray-400 font-bold uppercase mb-4 tracking-wider">{pet.breed}</p>
            <div className="grid grid-cols-2 gap-3 w-full">
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-50/50">
                <p className="text-[9px] text-gray-400 font-black uppercase mb-1">{language === 'th' ? 'อายุ' : 'Age'}</p>
                <p className="text-xs font-black text-[#1A1F3D]">{calculateAge(pet.birthday)}</p>
              </div>
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-50/50">
                <p className="text-[9px] text-gray-400 font-black uppercase mb-1">{language === 'th' ? 'น้ำหนัก' : 'Weight'}</p>
                <p className="text-xs font-black text-[#1A1F3D]">{latestWeight} {latestWeight !== 'N/A' ? 'kg' : ''}</p>
              </div>
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-50/50">
                <p className="text-[9px] text-gray-400 font-black uppercase mb-1">{language === 'th' ? 'สีขน' : 'Color'}</p>
                <p className="text-xs font-black text-[#1A1F3D]">{pet.color || '-'}</p>
              </div>
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-50/50">
                <p className="text-[9px] text-gray-400 font-black uppercase mb-1">{language === 'th' ? 'เพศ' : 'Gender'}</p>
                <p className="text-xs font-black text-[#1A1F3D]">
                  {pet.gender === 'Male' ? (language === 'th' ? 'ตัวผู้' : 'Male') : 
                   pet.gender === 'Female' ? (language === 'th' ? 'ตัวเมีย' : 'Female') : 
                   pet.gender === 'Unknown' || !pet.gender ? (language === 'th' ? 'ไม่ระบุ' : 'Unknown') : pet.gender}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Weight Chart & Notes */}
        <div className="flex-1 p-8 flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                <TrendingUp size={16} />
              </div>
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">{language === 'th' ? 'ประวัติน้ำหนัก' : 'Weight Progression'}</span>
            </div>
          </div>
          
          <div className="h-32 w-full mb-6">
            {weightHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightHistory}>
                  <XAxis dataKey="date" hide />
                  <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center border border-dashed border-gray-100 rounded-2xl">
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{language === 'th' ? 'ไม่มีข้อมูลน้ำหนัก' : 'No weight data'}</p>
              </div>
            )}
          </div>

          <div className="mt-auto grid grid-cols-2 gap-3">
            <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
              <p className="text-[10px] font-black uppercase text-red-600 mb-0.5">ข้อควรระวัง (Precautions)</p>
              <p className="text-xs text-red-900/80 font-medium leading-relaxed">{pet.precautions || '-'}</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
              <p className="text-[10px] font-black uppercase text-amber-600 mb-0.5">โรคประจำตัว (Medical Condition)</p>
              <p className="text-xs text-amber-900/80 font-medium leading-relaxed">{pet.medicalCondition || '-'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 col-span-2">
              <p className="text-[10px] font-black uppercase text-gray-500 mb-0.5">หมายเหตุ (Notes)</p>
              <p className="text-xs text-gray-600 font-medium leading-relaxed italic">{pet.notes || 'No special instructions recorded.'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable History Button */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full py-4 flex items-center justify-center gap-2 text-sm font-black uppercase tracking-[0.2em] transition-colors border-t border-gray-50",
          isExpanded ? "bg-[#1A1F3D] text-white" : "bg-gray-50/50 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
        )}
      >
        {isExpanded ? (
          <>{language === 'th' ? 'ปิดประวัติ' : 'Close History'} <ChevronUp size={14} /></>
        ) : (
          <>{language === 'th' ? 'ดูประวัติและแบบฟอร์ม' : 'View Records & Intake Forms'} <ChevronDown size={14} /></>
        )}
      </button>

      {/* Slide-down History Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden bg-[#F8F9FD]/30"
          >
            <div className="p-8 space-y-6">
              {/* Service History */}
              <div className="space-y-3">
                 <p className="text-xs font-black uppercase text-gray-400 tracking-widest px-2 mb-2">{language === 'th' ? 'ประวัติการใช้บริการและฟอร์ม' : 'Service History & Forms'}</p>
                 {pet.serviceHistory && pet.serviceHistory.length > 0 ? (
                    [...pet.serviceHistory].reverse().map((history) => {
                      const historyTime = new Date(history.date).getTime();
                      const closestForm = pet.intakeHistory?.slice().sort((a, b) => {
                        return Math.abs(new Date(a.date).getTime() - historyTime) - Math.abs(new Date(b.date).getTime() - historyTime);
                      })[0];
                      const associatedForm = (closestForm && Math.abs(new Date(closestForm.date).getTime() - historyTime) <= 2 * 24 * 60 * 60 * 1000) 
                        ? closestForm 
                        : undefined;

                      return (
                      <div key={history.id} className="bg-white p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between border border-gray-100 shadow-sm transition-all hover:border-[#1A1F3D]/20 gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 bg-[#F5F6FA] rounded-xl flex items-center justify-center text-[#1A1F3D]">
                            <ClipboardList size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-[#1A1F3D]">{history.serviceName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar size={12} className="text-gray-300" />
                              <p className="text-[10px] text-gray-400 font-bold uppercase">{history.date}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 justify-between md:justify-end border-t border-gray-50 pt-3 md:border-t-0 md:pt-0">
                          <button 
                            onClick={() => {
                              if (associatedForm) {
                                setSelectedIntake(associatedForm);
                                setSelectedHistory(history);
                              }
                            }}
                            disabled={!associatedForm}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                              associatedForm 
                                ? "bg-blue-50 text-blue-500 hover:bg-blue-100" 
                                : "bg-gray-50 text-gray-300 cursor-not-allowed"
                            )}
                          >
                            <FileSearch size={14} />
                            {language === 'th' ? 'ดูฟอร์ม' : 'View Form'}
                          </button>
                          <div className="text-right border-l border-gray-100 pl-4">
                            <p className="text-lg font-black text-[#1A1F3D]">{currency}{history.price.toFixed(2)}</p>
                            <span className="bg-green-100 text-green-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">{language === 'th' ? 'ชำระแล้ว' : 'Paid'}</span>
                          </div>
                        </div>
                      </div>
                    )})
                 ) : (
                    <div className="py-8 text-center bg-white rounded-2xl border border-dashed border-gray-200 opacity-50">
                       <p className="text-sm font-bold uppercase tracking-widest">{language === 'th' ? 'ไม่มีประวัติการใช้บริการ' : 'No previous services'}</p>
                    </div>
                 )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Intake Viewer Modal */}
      {selectedIntake && (() => {
        const customer = customers.find(c => c.pets.some(p => p.id === pet.id));
        const ownerName = customer ? customer.name : 'Customer';
        
        return (
          <GroomingServiceModal 
            item={{
              id: selectedIntake.queueItemId || selectedHistory?.id || 'unknown',
              petId: pet.id,
              petName: pet.name,
              ownerName: ownerName,
              serviceName: selectedHistory?.serviceName || 'Past Service',
              date: selectedIntake.date,
              time: selectedIntake.details?.time || selectedHistory?.time || '-',
              status: 'Completed',
              image: pet.image
            }} 
            intakeData={selectedIntake}
            readOnly={true}
            onClose={() => {
              setSelectedIntake(null);
              setSelectedHistory(null);
            }} 
          />
        );
      })()}

      {/* Pet Detail Modal */}
      {isDetailOpen && (
        <PetDetailModal 
          pet={pet} 
          onClose={() => setIsDetailOpen(false)} 
        />
      )}

      {/* Update Weight Modal */}
      {isUpdateWeightOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-[#1A1F3D]/40 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-[#1A1F3D] mb-2">อัพเดตน้ำหนัก</h3>
            <p className="text-xs text-gray-400 font-medium mb-6">บันทึกน้ำหนักล่าสุดของ {pet.name}</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">น้ำหนัก (กก.)</label>
                <div className="relative">
                  <Scale className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="0.0"
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setIsUpdateWeightOpen(false);
                    setNewWeight('');
                  }}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-xs transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={async () => {
                    if (!newWeight) return;
                    setIsSubmittingWeight(true);
                    try {
                      const customerId = customers.find(c => c.pets.some(p => p.id === pet.id))?.id;
                      if (customerId) {
                        await updatePetWeight(customerId, pet.id, Number(newWeight));
                        setIsUpdateWeightOpen(false);
                        setNewWeight('');
                      }
                    } finally {
                      setIsSubmittingWeight(false);
                    }
                  }}
                  disabled={isSubmittingWeight || !newWeight}
                  className="flex-1 py-3 bg-[#1A1F3D] hover:bg-[#2A3152] text-white rounded-xl font-bold text-xs shadow-lg disabled:opacity-50 transition-colors"
                >
                  {isSubmittingWeight ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PetProfileRecord;