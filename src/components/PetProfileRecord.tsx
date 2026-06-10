"use client";

import React, { useState } from 'react';
import { 
  Edit3, TrendingUp, History, ClipboardList, Calendar, 
  ChevronDown, ChevronUp, Scale, FileSearch, Eye 
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
  const { currency } = useStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedIntake, setSelectedIntake] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const weightHistory = pet.weightHistory || [];
  const latestWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1]?.value : 'N/A';

  return (
    <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col relative group/pet transition-all hover:shadow-md">
      {/* Action Buttons */}
      <div className="absolute top-6 right-6 flex gap-2 z-10 opacity-0 group-hover/pet:opacity-100 transition-opacity">
        <button 
          onClick={() => setIsDetailOpen(true)}
          className="p-3 bg-white text-gray-400 hover:bg-[#1A1F3D] hover:text-white rounded-2xl transition-all shadow-sm border border-gray-100 flex items-center gap-1.5 text-xs font-bold"
        >
          <Eye size={16} /> ดูข้อมูล
        </button>
        <button 
          onClick={() => onEdit(pet)}
          className="p-3 bg-white text-gray-400 hover:bg-[#1A1F3D] hover:text-white rounded-2xl transition-all shadow-sm border border-gray-100"
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
                <p className="text-[9px] text-gray-400 font-black uppercase mb-1">Age</p>
                <p className="text-xs font-black text-[#1A1F3D]">{calculateAge(pet.birthday)}</p>
              </div>
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-50/50">
                <p className="text-[9px] text-gray-400 font-black uppercase mb-1">Weight</p>
                <p className="text-xs font-black text-[#1A1F3D]">{latestWeight} {latestWeight !== 'N/A' ? 'kg' : ''}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Weight Chart & Notes */}
        <div className="flex-1 p-8 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                <TrendingUp size={16} />
              </div>
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Weight Progression</span>
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
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">No weight data</p>
              </div>
            )}
          </div>

          <div className="bg-[#FFF9F2] p-4 rounded-2xl border border-orange-100/50 mt-auto">
            <p className="text-[10px] font-black uppercase text-orange-600 mb-1">Medical Notes</p>
            <p className="text-xs text-orange-900/80 font-medium leading-relaxed italic">{pet.notes || 'No special instructions recorded.'}</p>
          </div>
        </div>
      </div>

      {/* Expandable History Button */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full py-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-colors border-t border-gray-50",
          isExpanded ? "bg-[#1A1F3D] text-white" : "bg-gray-50/50 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
        )}
      >
        {isExpanded ? (
          <>Close History <ChevronUp size={14} /></>
        ) : (
          <>View Records & Intake Forms <ChevronDown size={14} /></>
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
                 <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest px-2 mb-2">Service History</p>
                 {pet.serviceHistory && pet.serviceHistory.length > 0 ? (
                    [...pet.serviceHistory].reverse().map((history) => (
                      <div key={history.id} className="bg-white p-5 rounded-2xl flex items-center justify-between border border-gray-100 shadow-sm transition-all hover:border-[#1A1F3D]/20">
                        <div className="flex items-center gap-4">
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
                        <div className="text-right">
                          <p className="text-lg font-black text-[#1A1F3D]">{currency}{history.price.toFixed(2)}</p>
                          <span className="bg-green-100 text-green-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Paid</span>
                        </div>
                      </div>
                    ))
                 ) : (
                    <div className="py-8 text-center bg-white rounded-2xl border border-dashed border-gray-200 opacity-50">
                       <p className="text-[10px] font-bold uppercase tracking-widest">No previous services</p>
                    </div>
                 )}
              </div>

              {/* Intake Records */}
              <div className="space-y-3">
                 <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest px-2 mb-2">Saved Intake Forms</p>
                 {pet.intakeHistory && pet.intakeHistory.length > 0 ? (
                    pet.intakeHistory.map((record) => (
                      <button 
                        key={record.id} 
                        onClick={() => setSelectedIntake(record)}
                        className="w-full bg-white p-5 rounded-2xl flex items-center justify-between border border-gray-100 shadow-sm transition-all hover:border-blue-200 group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FileSearch size={20} />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-black text-[#1A1F3D]">Grooming Intake Form</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(record.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                           <span className="text-[9px] font-black uppercase text-gray-300 group-hover:text-blue-500 transition-colors">View Details</span>
                        </div>
                      </button>
                    ))
                 ) : (
                    <div className="py-8 text-center bg-white rounded-2xl border border-dashed border-gray-200 opacity-50">
                       <p className="text-[10px] font-bold uppercase tracking-widest">No intake forms recorded</p>
                    </div>
                 )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Intake Viewer Modal */}
      {selectedIntake && (
        <GroomingServiceModal 
          item={{
            id: selectedIntake.queueItemId,
            petId: pet.id,
            petName: pet.name,
            ownerName: 'Customer', // Simple mock for detail view
            serviceName: 'Past Service',
            date: selectedIntake.date,
            time: 'Recorded',
            status: 'Completed',
            image: pet.image
          }} 
          intakeData={selectedIntake}
          readOnly={true}
          onClose={() => setSelectedIntake(null)} 
        />
      )}

      {/* Pet Detail Modal */}
      {isDetailOpen && (
        <PetDetailModal 
          pet={pet} 
          onClose={() => setIsDetailOpen(false)} 
        />
      )}
    </div>
  );
};

export default PetProfileRecord;