"use client";

import React, { useState } from 'react';
import { 
  Edit3, TrendingUp, History, ClipboardList, Calendar, 
  ChevronDown, ChevronUp, Scale, FileSearch 
} from 'lucide-react';
import { useStore, Pet, QueueItem } from '@/store/useStore';
import { calculateAge } from '@/utils/petData';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import GroomingServiceModal from './GroomingServiceModal';

interface PetProfileRecordProps {
  pet: Pet;
  onEdit: (pet: Pet) => void;
}

const PetProfileRecord = ({ pet, onEdit }: PetProfileRecordProps) => {
  const { currency } = useStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedIntake, setSelectedIntake] = useState<any>(null);

  const weightHistory = pet.weightHistory || [];
  const latestWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1]?.value : 'N/A';

  return (
    <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col relative group/pet transition-all hover:shadow-md">
      <button 
        onClick={() => onEdit(pet)}
        className="absolute top-6 right-6 p-3 bg-gray-50 text-gray-400 hover:bg-[#1A1F3D] hover:text-white rounded-2xl transition-all shadow-sm z-10 opacity-0 group-hover/pet:opacity-100"
      >
        <Edit3 size={18} />
      </button>

      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-1/3 p-8 border-r border-gray-50 bg-[#F8F9FD]/50 flex flex-col items-center">
          <div className="relative mb-4">
            <img src={pet.image} className="w-32 h-32 rounded-[28px] object-cover border-4 border-white shadow-lg" alt={pet.name} />
          </div>
          <div className="text-center">
            <h4 className="text-2xl font-black text-[#1A1F3D] mb-1">{pet.name}</h4>
            <p className="text-xs text-gray-400 font-bold uppercase mb-4 tracking-wider">{pet.breed}</p>
          </div>
        </div>

        <div className="flex-1 p-8 flex flex-col">
          <div className="h-32 w-full mb-6">
            {weightHistory.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightHistory}>
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="bg-[#FFF9F2] p-4 rounded-2xl border border-orange-100/50 mt-auto">
            <p className="text-xs text-orange-900/80 font-medium italic">{pet.notes || 'No special instructions recorded.'}</p>
          </div>
        </div>
      </div>

      <button onClick={() => setIsExpanded(!isExpanded)} className="w-full py-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-colors border-t border-gray-50">
        {isExpanded ? <>Close History <ChevronUp size={14} /></> : <>View Records <ChevronDown size={14} /></>}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-[#F8F9FD]/30">
            <div className="p-8 space-y-3">
              {pet.intakeHistory?.map((record) => (
                <button 
                  key={record.id} 
                  onClick={() => setSelectedIntake(record)}
                  className="w-full bg-white p-5 rounded-2xl flex items-center justify-between border border-gray-100 shadow-sm"
                >
                  <div className="text-left">
                    <p className="text-sm font-black text-[#1A1F3D]">Intake Form</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(record.date).toLocaleDateString()}</p>
                  </div>
                  <span className="text-[9px] font-black uppercase text-blue-500">View Details</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedIntake && (
        <GroomingServiceModal 
          item={{
            id: selectedIntake.queueItemId,
            customerId: 'N/A', // Added property
            customerName: 'Customer', // Added property
            serviceId: 'N/A', // Added property
            isPaid: true, // Added property
            petId: pet.id,
            petName: pet.name,
            ownerName: 'Customer',
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
    </div>
  );
};

export default PetProfileRecord;