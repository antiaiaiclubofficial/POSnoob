"use client";

import React, { useState } from 'react';
import { X, Printer, Save, Dog, Scissors, AlertCircle, User, Info, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore, QueueItem } from '@/store/useStore';
import { toast } from 'sonner';

interface GroomingServiceModalProps {
  item: QueueItem;
  onClose: () => void;
}

const GroomingServiceModal = ({ item, onClose }: GroomingServiceModalProps) => {
  const { language, currentUser } = useStore();
  
  // Form State
  const [formData, setFormData] = useState({
    // Basic Info (pre-filled from item where possible)
    spayed: 'No',
    sex: 'Male',
    // Required Services - Basic
    basicGrooming: [] as string[],
    addOns: [] as string[],
    bathProduct: 'Use Facilities',
    // Hair Trim
    hairTrimLength: '',
    styleFocus: '',
    // Additional Concerns
    shaveShortIfMatted: 'Call owner',
    dislikes: '',
    additionalConcerns: '',
    itemBrought: '',
    // Staff Use
    pickupTime: '',
    groomerAssigned: '',
  });

  const basicServices = [
    'Shower', 'Nail Clipping', 'Anal Sac', 'Eye Cleaning', 
    'Ear Cleaning', 'Partial Cleaning', 'Paw Trim', 'Belly Trim', 
    'Apply Lotion', 'Pluck Ear Hair', 'Sanitary Trim', 'Apply Perfume'
  ];

  const addOns = ['Tooth Brushing', 'Mud Spa'];
  const lengths = ['Shaved', 'Short', 'Medium', 'Long (Trim)', 'Partial Trim'];

  const toggleBasic = (service: string) => {
    setFormData(prev => ({
      ...prev,
      basicGrooming: prev.basicGrooming.includes(service)
        ? prev.basicGrooming.filter(s => s !== service)
        : [...prev.basicGrooming, service]
    }));
  };

  const handlePrint = () => {
    window.print();
    toast.success("Sending to printer...");
  };

  const handleSave = () => {
    toast.success("Service Form Saved Successfully");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[150] flex items-center justify-center p-4 lg:p-10 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]">
        
        {/* Header - Branding Style */}
        <div className="bg-[#D9ED5F] p-8 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1A1F3D] rounded-2xl flex items-center justify-center text-[#D9ED5F]">
              <Scissors size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#1A1F3D] uppercase tracking-tighter">DOG GROOMING SERVICE FORM</h1>
              <p className="text-[10px] font-black text-[#1A1F3D]/60 uppercase tracking-widest">Mellow Fellow Sanctuary</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="p-3 bg-white/50 hover:bg-white rounded-xl transition-all text-[#1A1F3D]"><Printer size={20}/></button>
            <button onClick={onClose} className="p-3 bg-white/50 hover:bg-white rounded-xl transition-all text-[#1A1F3D]"><X size={20}/></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-10 scrollbar-hide bg-[#FDFDFD]">
          
          {/* Section 1: Owner & Pet Info */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b-4 border-[#00B4FF] pb-2">
               <span className="bg-[#00B4FF] text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Owner & Pet Information</span>
               <span className="text-[10px] font-black text-gray-300 uppercase">ข้อมูลเจ้าของและสัตว์เลี้ยง</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400">Owner Name</label>
                <p className="text-sm font-bold border-b-2 border-gray-100 pb-1">{item.ownerName}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400">Phone No.</label>
                <p className="text-sm font-bold border-b-2 border-gray-100 pb-1">08X-XXX-XXXX</p>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400">Pet Name</label>
                <p className="text-sm font-bold border-b-2 border-gray-100 pb-1 text-blue-600">{item.petName}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400">Breed</label>
                <p className="text-sm font-bold border-b-2 border-gray-100 pb-1">Golden Retriever</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-2">
              <div className="flex items-center gap-6">
                <span className="text-[10px] font-black uppercase text-gray-400">Sex:</span>
                <div className="flex gap-4">
                  {['Male', 'Female'].map(s => (
                    <button 
                      key={s} 
                      onClick={() => setFormData({...formData, sex: s})}
                      className={cn("flex items-center gap-2 text-xs font-bold transition-all", formData.sex === s ? "text-blue-600" : "text-gray-300")}
                    >
                      <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.sex === s ? "border-blue-600" : "border-gray-200")}>
                        {formData.sex === s && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                      </div>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <span className="text-[10px] font-black uppercase text-gray-400 whitespace-nowrap">Spayed/Neutered?</span>
                <div className="flex gap-4">
                  {['Yes', 'No'].map(v => (
                    <button 
                      key={v} 
                      onClick={() => setFormData({...formData, spayed: v})}
                      className={cn("flex items-center gap-2 text-xs font-bold transition-all", formData.spayed === v ? "text-blue-600" : "text-gray-300")}
                    >
                      <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", formData.spayed === v ? "border-blue-600" : "border-gray-200")}>
                        {formData.spayed === v && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                      </div>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                 <span className="text-[10px] font-black uppercase text-gray-400">Weight:</span>
                 <input className="w-20 bg-gray-50 border-none rounded-lg px-3 py-1.5 text-xs font-black text-center" defaultValue="12.5" />
                 <span className="text-[10px] font-bold text-gray-300 uppercase">kg</span>
              </div>
            </div>
          </section>

          {/* Section 2: Required Services */}
          <section className="space-y-8">
            <div className="flex items-center gap-3 border-b-4 border-[#00B4FF] pb-2">
               <span className="bg-[#00B4FF] text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Required Services</span>
               <span className="text-[10px] font-black text-gray-300 uppercase">บริการที่ต้องการ</span>
            </div>

            <div className="flex flex-col lg:flex-row gap-10">
              {/* Basic Grooming Checklist */}
              <div className="flex-1">
                <h3 className="text-xs font-black text-[#1A1F3D] mb-4 uppercase flex items-center gap-2">
                  <Check size={14} className="text-[#00B4FF]" /> Basic Grooming อาบน้ำ
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-2">
                  {basicServices.map(service => (
                    <button 
                      key={service}
                      onClick={() => toggleBasic(service)}
                      className="flex items-center gap-3 group text-left"
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all",
                        formData.basicGrooming.includes(service) ? "bg-[#00B4FF] border-[#00B4FF] text-white shadow-md" : "border-gray-100 group-hover:border-gray-300"
                      )}>
                        {formData.basicGrooming.includes(service) && <Check size={12} strokeWidth={4} />}
                      </div>
                      <span className={cn("text-[10px] font-bold uppercase", formData.basicGrooming.includes(service) ? "text-[#1A1F3D]" : "text-gray-400")}>
                        {service}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Add-on Box */}
              <div className="w-full lg:w-56 shrink-0">
                 <div className="bg-[#D9ED5F]/20 border-2 border-dashed border-[#D9ED5F] rounded-3xl p-6 relative">
                    <div className="absolute -top-3 left-6 bg-[#D9ED5F] text-[#1A1F3D] px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm">Add On</div>
                    <div className="space-y-4 pt-2">
                       {addOns.map(addon => (
                         <button 
                           key={addon}
                           onClick={() => setFormData(prev => ({
                             ...prev,
                             addOns: prev.addOns.includes(addon) ? prev.addOns.filter(a => a !== addon) : [...prev.addOns, addon]
                           }))}
                           className="flex items-center gap-3 w-full"
                         >
                           <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", formData.addOns.includes(addon) ? "bg-[#1A1F3D] border-[#1A1F3D] text-[#D9ED5F]" : "border-[#D9ED5F]")}>
                              {formData.addOns.includes(addon) && <Check size={10} strokeWidth={4} />}
                           </div>
                           <span className="text-[10px] font-black text-[#1A1F3D] uppercase">{addon}</span>
                         </button>
                       ))}
                    </div>
                 </div>
              </div>
            </div>

            {/* Bathing Products */}
            <div className="flex flex-col sm:flex-row gap-6 p-6 bg-gray-50 rounded-[24px]">
               <div className="flex items-center gap-4 border-r border-gray-200 pr-6 mr-6">
                 <label className="text-[10px] font-black uppercase text-gray-400">Bathing Products:</label>
                 <div className="flex gap-4">
                   {['Use Facilities', 'Owner Provided'].map(p => (
                     <button key={p} onClick={() => setFormData({...formData, bathProduct: p})} className={cn("flex items-center gap-2 text-[10px] font-bold", formData.bathProduct === p ? "text-blue-600" : "text-gray-400")}>
                       <div className={cn("w-4 h-4 rounded-full border-2", formData.bathProduct === p ? "border-blue-600 bg-blue-600" : "border-gray-200")} />
                       {p}
                     </button>
                   ))}
                 </div>
               </div>
               <input className="flex-1 bg-white border-none rounded-xl px-4 py-2 text-[10px] font-medium" placeholder="If owner provided, specify here..." />
            </div>

            {/* Hair Trim Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-4">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-6 bg-[#00B4FF] rounded-full" />
                   <h3 className="text-xs font-black text-[#1A1F3D] uppercase">Full Groom Hair Trim | <span className="text-gray-400 font-bold">Please specify length</span></h3>
                </div>
                <div className="flex flex-wrap gap-4">
                   {lengths.map(l => (
                     <button key={l} onClick={() => setFormData({...formData, hairTrimLength: l})} className={cn("flex items-center gap-2 text-[10px] font-bold px-4 py-2 rounded-xl border-2 transition-all", formData.hairTrimLength === l ? "bg-[#1A1F3D] border-[#1A1F3D] text-white" : "bg-white border-gray-100 text-gray-400")}>
                       {l}
                     </button>
                   ))}
                </div>
              </div>
              <div className="bg-[#F5F6FA] p-6 rounded-[32px] flex items-start gap-4">
                 <div className="flex-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase block mb-2">Specify style and focus areas</label>
                    <textarea 
                      className="w-full bg-transparent border-none p-0 text-xs font-medium resize-none h-20" 
                      placeholder="e.g. Teddy bear face, leave tail long..."
                      value={formData.styleFocus}
                      onChange={e => setFormData({...formData, styleFocus: e.target.value})}
                    />
                 </div>
                 <div className="w-20 opacity-20"><Dog size={80} /></div>
              </div>
            </div>
          </section>

          {/* Section 3: Additional Concerns */}
          <section className="space-y-8">
            <div className="flex items-center gap-3 border-b-4 border-[#FF8F00] pb-2">
               <span className="bg-[#FF8F00] text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Additional Concerns</span>
               <span className="text-[10px] font-black text-gray-300 uppercase">ข้อควรระวังเพิ่มเติม</span>
            </div>

            <div className="space-y-6">
               <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-5 bg-orange-50/30 border border-orange-100 rounded-3xl">
                  <p className="text-[11px] font-bold text-orange-900 leading-tight flex-1">If the coat is severely matted, can we shave short? <br/><span className="text-[9px] text-orange-500 font-medium italic">หากขนพันกันจำนวนมาก อนุญาตให้ไถสั้นหรือไม่</span></p>
                  <div className="flex gap-4">
                    {['Yes', 'Call owner'].map(v => (
                      <button key={v} onClick={() => setFormData({...formData, shaveShortIfMatted: v})} className={cn("flex items-center gap-2 text-[10px] font-black uppercase px-5 py-2.5 rounded-xl transition-all", formData.shaveShortIfMatted === v ? "bg-[#FF8F00] text-white" : "bg-white text-gray-400")}>{v}</button>
                    ))}
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-400 ml-2">Specific things your pet dislikes</label>
                    <textarea className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-medium h-24" placeholder="..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-400 ml-2">Additional Concerns</label>
                    <textarea className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-medium h-24" placeholder="..." />
                  </div>
               </div>
            </div>
          </section>

          {/* Section 4: For Staff Use */}
          <section className="bg-[#1A1F3D] p-8 rounded-[40px] text-white space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#D9ED5F] text-[#1A1F3D] rounded-xl"><Info size={16} /></div>
              <h3 className="text-sm font-black uppercase tracking-widest">For Staff Use Only <span className="text-white/40 ml-2">สำหรับเจ้าหน้าที่</span></h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-white/40">Check-in Staff</label>
                <p className="text-sm font-bold text-[#D9ED5F]">{currentUser?.name || 'Admin'}</p>
              </div>
              <div className="space-y-2">
                <label className="text-[8px] font-black uppercase text-white/40">Groomer Assigned</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold" placeholder="Select Groomer..." />
              </div>
              <div className="space-y-2">
                <label className="text-[8px] font-black uppercase text-white/40">Scheduled Pick-up Time</label>
                <input type="time" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold" />
              </div>
            </div>
          </section>
        </div>

        {/* Action Footer */}
        <div className="p-8 border-t border-gray-50 bg-white shrink-0">
          <button 
            onClick={handleSave}
            className="w-full bg-[#1A1F3D] text-white font-black py-5 rounded-[24px] flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95"
          >
            <Save size={20} /> Save Intake Form & Start Service
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroomingServiceModal;