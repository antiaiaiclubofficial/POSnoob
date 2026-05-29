"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, Printer, Save, Dog, Scissors, AlertCircle, User, Info, Check, Pencil, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore, QueueItem } from '@/store/useStore';
import { toast } from 'sonner';

interface GroomingServiceModalProps {
  item: QueueItem;
  onClose: () => void;
  readOnly?: boolean;
  intakeData?: any;
}

const GroomingServiceModal = ({ item, onClose, readOnly = false, intakeData }: GroomingServiceModalProps) => {
  const { language, currentUser, updateQueueStatus, customers, saveIntakeRecord, updatePetWeight } = useStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Form State
  const [weight, setWeight] = useState('');
  const [formData, setFormData] = useState(intakeData?.details || {
    spayed: 'No',
    sex: 'Male',
    basicGrooming: [] as string[],
    addOns: [] as string[],
    bathProduct: 'Use Facilities',
    hairTrimLength: '',
    styleFocus: '',
    shaveShortIfMatted: 'Call owner',
    dislikes: '',
    additionalConcerns: '',
    itemBrought: '',
    pickupTime: '',
    groomerAssigned: '',
  });

  useEffect(() => {
    if (intakeData?.weight) {
      setWeight(intakeData.weight.toString());
    }
  }, [intakeData]);

  const basicServices = [
    'Shower', 'Nail Clipping', 'Anal Sac', 'Eye Cleaning', 
    'Ear Cleaning', 'Partial Cleaning', 'Paw Trim', 'Belly Trim', 
    'Apply Lotion', 'Pluck Ear Hair', 'Sanitary Trim', 'Apply Perfume'
  ];

  // Signature Pad Logic
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1A1F3D';
    
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const clearSignature = () => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const toggleBasic = (service: string) => {
    if (readOnly) return;
    setFormData(prev => ({
      ...prev,
      basicGrooming: prev.basicGrooming.includes(service)
        ? prev.basicGrooming.filter(s => s !== service)
        : [...prev.basicGrooming, service]
    }));
  };

  const handleSave = () => {
    if (readOnly) return;
    
    const canvas = canvasRef.current;
    const signature = canvas?.toDataURL();
    
    // Find customer for this pet
    const owner = customers.find(c => c.name === item.ownerName);
    if (owner) {
      // 1. Save Form Record
      saveIntakeRecord(owner.id, item.petId, {
        queueItemId: item.id,
        staffName: currentUser?.name || 'Admin',
        details: formData,
        weight: weight ? Number(weight) : undefined,
        signature
      });

      // 2. Update actual pet weight history if provided
      if (weight) {
        updatePetWeight(owner.id, item.petId, Number(weight));
      }
    }

    updateQueueStatus(item.id, 'In Progress');
    toast.success("Service Form Saved & Pet Checked-in!");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[150] flex items-center justify-center p-4 lg:p-10 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]">
        
        {/* Header */}
        <div className="bg-[#D9ED5F] p-8 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1A1F3D] rounded-2xl flex items-center justify-center text-[#D9ED5F]">
              <Scissors size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#1A1F3D] uppercase tracking-tighter">
                {readOnly ? "COMPLETED SERVICE FORM" : "SERVICE INTAKE & CHECK-IN"}
              </h1>
              <p className="text-[10px] font-black text-[#1A1F3D]/60 uppercase tracking-widest">Mellow Fellow Sanctuary</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white/50 hover:bg-white rounded-xl transition-all text-[#1A1F3D]"><X size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-12 scrollbar-hide bg-[#FDFDFD]">
          
          {/* Section 1: Info & Weight */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b-4 border-[#00B4FF] pb-2">
               <span className="bg-[#00B4FF] text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Pet & Owner Info</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-1">
                <label className="text-[9px] font-black uppercase text-gray-400">Pet Name</label>
                <p className="text-sm font-bold border-b-2 border-gray-100 pb-1 text-blue-600">{item.petName}</p>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400">Owner</label>
                <p className="text-sm font-bold border-b-2 border-gray-100 pb-1">{item.ownerName}</p>
              </div>
              <div className="lg:col-span-1">
                <label className="text-[9px] font-black uppercase text-gray-400">Service</label>
                <p className="text-sm font-bold border-b-2 border-gray-100 pb-1">{item.serviceName}</p>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400">Time</label>
                <p className="text-sm font-bold border-b-2 border-gray-100 pb-1">{item.time}</p>
              </div>
              {/* Weight Input Added Here */}
              <div className="col-span-2 lg:col-span-1">
                <label className="text-[9px] font-black uppercase text-blue-500 flex items-center gap-1">
                  <Scale size={10} /> Weight (kg)
                </label>
                <input 
                  type="number" 
                  disabled={readOnly}
                  className="w-full bg-blue-50 border-none rounded-lg px-3 py-1.5 text-sm font-black text-[#1A1F3D] focus:ring-2 focus:ring-blue-200"
                  placeholder="0.0"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Section 2: Checklist */}
          <section className="space-y-8">
            <div className="flex items-center gap-3 border-b-4 border-[#00B4FF] pb-2">
               <span className="bg-[#00B4FF] text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Basic Grooming Items</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {basicServices.map(service => (
                <button key={service} disabled={readOnly} onClick={() => toggleBasic(service)} className="flex items-center gap-3 group text-left disabled:opacity-100">
                  <div className={cn("w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all", formData.basicGrooming.includes(service) ? "bg-[#00B4FF] border-[#00B4FF] text-white shadow-md" : "border-gray-100")}>
                    {formData.basicGrooming.includes(service) && <Check size={12} strokeWidth={4} />}
                  </div>
                  <span className={cn("text-[10px] font-bold uppercase", formData.basicGrooming.includes(service) ? "text-[#1A1F3D]" : "text-gray-400")}>{service}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Section 3: Signature */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b-4 border-[#1A1F3D] pb-2">
               <span className="bg-[#1A1F3D] text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Customer Authorization</span>
            </div>

            <div className="bg-[#F5F6FA] p-8 rounded-[32px] border-2 border-dashed border-gray-200">
               <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2 text-[#1A1F3D] font-black uppercase text-[10px]">
                    <Pencil size={14} /> Owner's Signature
                  </div>
                  {!readOnly && <button onClick={clearSignature} className="text-[9px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors">Clear Space</button>}
               </div>
               <div className="bg-white rounded-2xl shadow-inner overflow-hidden border border-gray-100 touch-none relative">
                  {readOnly && intakeData?.signature ? (
                    <img src={intakeData.signature} className="w-full h-[150px] object-contain" />
                  ) : (
                    <canvas 
                      ref={canvasRef}
                      width={800}
                      height={200}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={() => setIsDrawing(false)}
                      onMouseLeave={() => setIsDrawing(false)}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={() => setIsDrawing(false)}
                      className="w-full h-[150px] cursor-crosshair"
                    />
                  )}
               </div>
            </div>
          </section>
        </div>

        {/* Action Footer */}
        <div className="p-8 border-t border-gray-50 bg-white shrink-0 flex gap-4">
          <button onClick={onClose} className="flex-1 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">
            {readOnly ? "Close View" : "Cancel"}
          </button>
          {!readOnly && (
            <button 
              onClick={handleSave}
              className="flex-[2] bg-[#1A1F3D] text-[#D9ED5F] font-black py-5 rounded-[24px] flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95"
            >
              <Check size={20} /> Sign & Confirm Check-in
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroomingServiceModal;