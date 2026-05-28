"use client";

import React, { useState, useEffect } from 'react';
import { X, Scissors, Clock, DollarSign, Plus, Trash2, Save, Info, Star, GripVertical } from 'lucide-react';
import { useStore, Service, ServiceIcon, ServicePriceInfo } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ServiceModalProps {
  service: Service | null;
  defaultSpecies: 'Dog' | 'Cat';
  onClose: () => void;
}

const ServiceModal = ({ service, defaultSpecies, onClose }: ServiceModalProps) => {
  const { addService, updateService } = useStore();
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'Grooming',
    description: '',
    icon: 'grooming' as ServiceIcon,
    targetSpecies: defaultSpecies,
    isActive: true,
    coatType: undefined as 'Short' | 'Long' | undefined,
    prices: {
      'Small': { price: 0, duration: 60 }
    } as Record<string, ServicePriceInfo>
  });

  const [newSizeName, setNewSizeName] = useState('');
  const [draggedSize, setDraggedSize] = useState<string | null>(null);
  const [dragOverSize, setDragOverSize] = useState<string | null>(null);

  useEffect(() => {
    if (service) {
      setFormData({
        title: service.title,
        category: service.category,
        description: service.description,
        icon: service.icon,
        targetSpecies: service.targetSpecies,
        isActive: service.isActive,
        coatType: service.coatType,
        prices: { ...service.prices }
      });
    } else {
      setFormData(prev => ({ ...prev, targetSpecies: defaultSpecies, coatType: undefined }));
    }
  }, [service, defaultSpecies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error('กรุณากรอกชื่อบริการ');
      return;
    }
    if (Object.keys(formData.prices).length === 0) {
      toast.error('กรุณากำหนดขนาดและราคาอย่างน้อย 1 รายการ');
      return;
    }

    if (service) {
      await updateService(service.id, formData);
      toast.success('อัปเดตบริการเรียบร้อยแล้ว');
    } else {
      await addService(formData);
      toast.success('เพิ่มบริการใหม่เรียบร้อยแล้ว');
    }
    onClose();
  };

  const handlePriceChange = (size: string, field: 'price' | 'duration', value: number) => {
    setFormData(prev => ({
      ...prev,
      prices: {
        ...prev.prices,
        [size]: { ...prev.prices[size], [field]: value }
      }
    }));
  };

  const handleRenameSize = (oldSize: string, newSize: string) => {
    const trimmed = newSize.trim();
    if (!trimmed || trimmed === oldSize) return;
    
    if (formData.prices[trimmed]) {
      toast.error('มีขนาดชื่อนี้อยู่ในระบบแล้ว');
      return;
    }

    setFormData(prev => {
      const updatedPrices = { ...prev.prices };
      const info = updatedPrices[oldSize];
      delete updatedPrices[oldSize];
      updatedPrices[trimmed] = info;
      return {
        ...prev,
        prices: updatedPrices
      };
    });
    toast.success(`เปลี่ยนชื่อขนาดเป็น "${trimmed}" เรียบร้อย`);
  };

  const handleAddSize = () => {
    const trimmedSize = newSizeName.trim();
    if (!trimmedSize) {
      toast.error('กรุณาระบุชื่อขนาด');
      return;
    }
    if (formData.prices[trimmedSize]) {
      toast.error('มีขนาดนี้อยู่ในระบบแล้ว');
      return;
    }

    setFormData(prev => ({
      ...prev,
      prices: {
        ...prev.prices,
        [trimmedSize]: { price: 0, duration: 60 }
      }
    }));
    setNewSizeName('');
    toast.success(`เพิ่มขนาด ${trimmedSize} เรียบร้อย`);
  };

  const handleRemoveSize = (size: string) => {
    if (Object.keys(formData.prices).length <= 1) {
      toast.error('ต้องมีขนาดบริการอย่างน้อย 1 รายการ');
      return;
    }
    const updatedPrices = { ...formData.prices };
    delete updatedPrices[size];
    setFormData(prev => ({
      ...prev,
      prices: updatedPrices
    }));
    toast.success(`ลบขนาด ${size} เรียบร้อย`);
  };

  // Drag and Drop Reordering Logic
  const handleDragStart = (size: string) => {
    setDraggedSize(size);
  };

  const handleDragOver = (e: React.DragEvent, size: string) => {
    e.preventDefault();
    if (draggedSize !== size) {
      setDragOverSize(size);
    }
  };

  const handleDrop = (targetSize: string) => {
    if (!draggedSize || draggedSize === targetSize) return;

    const entries = Object.entries(formData.prices);
    const draggedIdx = entries.findIndex(([k]) => k === draggedSize);
    const targetIdx = entries.findIndex(([k]) => k === targetSize);

    if (draggedIdx !== -1 && targetIdx !== -1) {
      const newEntries = [...entries];
      const [removed] = newEntries.splice(draggedIdx, 1);
      newEntries.splice(targetIdx, 0, removed);

      setFormData(prev => ({
        ...prev,
        prices: Object.fromEntries(newEntries)
      }));
    }

    setDraggedSize(null);
    setDragOverSize(null);
  };

  const handleDragEnd = () => {
    setDraggedSize(null);
    setDragOverSize(null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-2xl font-black text-[#1A1F3D]">{service ? 'แก้ไขบริการ' : 'เพิ่มบริการใหม่'}</h2>
          <button onClick={onClose} className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 rounded-2xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-8 scrollbar-hide flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2">ชื่อบริการ (Service Title)</label>
                <input 
                  className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-[#1A1F3D]/10"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="เช่น อาบน้ำตัดขน"
                  required
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2">ประเภทสัตว์ (Target Species)</label>
                <select 
                  className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-[#1A1F3D]/10"
                  value={formData.targetSpecies}
                  onChange={e => setFormData({...formData, targetSpecies: e.target.value as 'Dog' | 'Cat'})}
                >
                  <option value="Dog">สุนัข (Dog)</option>
                  <option value="Cat">แมว (Cat)</option>
                </select>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2">ประเภทเส้นขน (Coat Type)</label>
                <select 
                  className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-[#1A1F3D]/10"
                  value={formData.coatType || ''}
                  onChange={e => setFormData({...formData, coatType: (e.target.value || undefined) as any})}
                >
                  <option value="">ทั้งหมด / ไม่ระบุ (All)</option>
                  <option value="Short">ขนสั้น (Short Coat)</option>
                  <option value="Long">ขนยาว (Long Coat)</option>
                </select>
             </div>
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-black uppercase text-gray-400 ml-2">รายละเอียดบริการ (Description)</label>
             <textarea 
                className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold h-24 resize-none focus:ring-2 focus:ring-[#1A1F3D]/10"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="ระบุรายละเอียดของบริการนี้..."
             />
          </div>

          {/* Add New Size Section */}
          <div className="bg-gray-50 p-6 rounded-3xl space-y-4">
             <label className="text-[10px] font-black uppercase text-gray-400 ml-2">เพิ่มขนาดบริการใหม่ (Add New Size)</label>
             <div className="flex gap-3">
                <input 
                  className="flex-1 bg-white border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-[#1A1F3D]/10"
                  value={newSizeName}
                  onChange={e => setNewSizeName(e.target.value)}
                  placeholder="เช่น Medium, Large, น้ำหนัก 10-20 กก."
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddSize())}
                />
                <button 
                  type="button"
                  onClick={handleAddSize}
                  className="bg-[#1A1F3D] text-white px-6 py-3 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-[#2A3152] transition-all"
                >
                  <Plus size={16} /> เพิ่มขนาด
                </button>
             </div>
          </div>

          {/* Pricing Matrix */}
          <div className="space-y-4">
             <label className="text-[10px] font-black uppercase text-gray-400 ml-2">ตารางราคาตามขนาด (Pricing Matrix) - *ลากปุ่มซ้ายสุดเพื่อเรียงลำดับ หรือคลิกที่ชื่อขนาดเพื่อแก้ไขชื่อได้*</label>
             <div className="grid grid-cols-1 gap-3">
                {(Object.entries(formData.prices) as [string, ServicePriceInfo][]).map(([size, info]) => {
                   const isDraggingThis = draggedSize === size;
                   const isDragOverThis = dragOverSize === size;

                   return (
                      <div 
                        key={size} 
                        draggable
                        onDragStart={() => handleDragStart(size)}
                        onDragOver={(e) => handleDragOver(e, size)}
                        onDrop={() => handleDrop(size)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          "flex flex-col sm:flex-row sm:items-center gap-4 bg-gray-50 p-4 rounded-3xl border transition-all duration-200",
                          isDraggingThis ? "opacity-40 border-dashed border-indigo-300 bg-indigo-50/20" : "border-gray-100",
                          isDragOverThis ? "border-indigo-400 bg-indigo-50/50 scale-[1.01]" : ""
                        )}
                      >
                         {/* Drag Handle */}
                         <div className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-[#1A1F3D] transition-colors shrink-0 flex items-center justify-center">
                            <GripVertical size={18} />
                         </div>

                         <div className="w-full sm:w-32">
                            <input 
                               type="text"
                               className="w-full bg-transparent border-none font-black text-[#1A1F3D] focus:ring-0 p-0 text-sm"
                               defaultValue={size}
                               onBlur={(e) => handleRenameSize(size, e.target.value)}
                               onKeyDown={(e) => {
                                 if (e.key === 'Enter') {
                                   e.preventDefault();
                                   (e.target as HTMLInputElement).blur();
                                 }
                               }}
                            />
                         </div>
                         <div className="flex-1 flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm">
                            <DollarSign size={14} className="text-gray-400" />
                            <input 
                               type="number"
                               className="bg-transparent border-none w-full font-black text-sm focus:ring-0"
                               value={info.price}
                               onChange={e => handlePriceChange(size, 'price', Number(e.target.value))}
                               placeholder="ราคา"
                            />
                            <span className="text-[10px] font-black text-gray-400 uppercase">บาท</span>
                         </div>
                         <div className="flex-1 flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm">
                            <Clock size={14} className="text-gray-400" />
                            <input 
                               type="number"
                               className="bg-transparent border-none w-full font-black text-sm focus:ring-0"
                               value={info.duration}
                               onChange={e => handlePriceChange(size, 'duration', Number(e.target.value))}
                               placeholder="เวลา"
                            />
                            <span className="text-[10px] font-black text-gray-400 uppercase">นาที</span>
                         </div>
                         <button 
                           type="button"
                           onClick={() => handleRemoveSize(size)}
                           className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all self-end sm:self-auto"
                         >
                           <Trash2 size={16} />
                         </button>
                      </div>
                   );
                })}
             </div>
          </div>
        </form>

        <div className="p-8 bg-gray-50/50 flex gap-4 border-t border-gray-100">
           <button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl font-black text-gray-400 hover:bg-gray-100 transition-all">ยกเลิก</button>
           <button type="button" onClick={handleSubmit} className="flex-[2] bg-[#1A1F3D] text-white py-4 rounded-2xl font-black shadow-xl hover:bg-[#2A3152] transition-all">บันทึกบริการ</button>
        </div>
      </div>
    </div>
  );
};

export default ServiceModal;