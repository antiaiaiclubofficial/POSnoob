"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Package, DollarSign, Save, Tag, Layers, Bell, Upload, Camera } from 'lucide-react';
import { useStore, InventoryItem } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Switch } from "@/components/ui/switch";

interface InventoryModalProps {
  item?: InventoryItem | null;
  onClose: () => void;
}

const InventoryModal = ({ item, onClose }: InventoryModalProps) => {
  const { addInventoryItem, updateInventoryItem, partners, currency } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    price: 0,
    costPrice: 0,
    stock: 0,
    minStock: 5,
    unit: 'ชิ้น',
    category: 'ทั่วไป',
    image: '',
    isConsignment: false,
    partnerId: ''
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        barcode: item.barcode || '',
        price: item.price,
        costPrice: item.costPrice || 0,
        stock: item.stock,
        minStock: item.minStock,
        unit: item.unit,
        category: item.category,
        image: item.image || '',
        isConsignment: item.isConsignment,
        partnerId: item.partnerId || ''
      });
    }
  }, [item]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("กรุณาระบุชื่อสินค้า");
      return;
    }

    if (item) {
      updateInventoryItem(item.id, formData);
      toast.success("อัปเดตสินค้าเรียบร้อย");
    } else {
      addInventoryItem(formData);
      toast.success("เพิ่มสินค้าเรียบร้อย");
    }
    onClose();
  };

  const inputClasses = "w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all h-[58px]";
  const labelClasses = "text-[10px] font-black uppercase text-gray-400 px-2 flex items-center gap-1.5 mb-2 h-4";

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-3xl rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1A1F3D] rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Package size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1A1F3D]">{item ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มสินค้าใหม่'}</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Product Specification</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
           {/* Image Upload Section */}
           <div className="flex flex-col items-center justify-center bg-[#F5F6FA] p-6 rounded-[32px] border-2 border-dashed border-gray-200">
             <label className="text-[10px] font-black uppercase text-gray-400 mb-3 block tracking-wider">รูปภาพสินค้า (Product Image)</label>
             <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
               <div className="w-32 h-32 rounded-[28px] overflow-hidden border-4 border-white shadow-md flex items-center justify-center bg-white">
                 {formData.image ? (
                   <img src={formData.image} className="w-full h-full object-cover" alt="Product Preview" />
                 ) : (
                   <Package className="text-gray-300 w-12 h-12" />
                 )}
               </div>
               <div className="absolute inset-0 bg-[#1A1F3D]/40 rounded-[28px] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <Camera className="text-white mb-1" size={24} />
                 <span className="text-[9px] text-white font-black uppercase">Upload</span>
               </div>
               <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#1A1F3D] text-white rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                 <Upload size={14} />
               </div>
             </div>
             <input 
               type="file" 
               ref={fileInputRef} 
               className="hidden" 
               accept="image/*" 
               onChange={handleImageUpload} 
             />
             <p className="text-[10px] text-gray-400 font-medium mt-3">รองรับไฟล์รูปภาพ JPG, PNG เพื่อแสดงในระบบขายหน้าร้าน (POS)</p>
           </div>

           {/* Section 1 & 2: Main Info Rows */}
           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className={labelClasses}><Package size={12}/> ชื่อสินค้า</label>
                 <input className={inputClasses} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="เช่น แชมพูสูตรอ่อนโยน" required />
              </div>
              <div className="space-y-2">
                 <label className={labelClasses}><Layers size={12}/> บาร์โค้ด / รหัสสินค้า</label>
                 <input className={inputClasses} value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} placeholder="Scan or Type..." />
              </div>
              <div className="space-y-2">
                 <label className={labelClasses}><Tag size={12}/> หมวดหมู่</label>
                 <input className={inputClasses} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="เช่น อาหาร, แชมพู" />
              </div>
              <div className="space-y-2">
                 <label className={labelClasses}><Layers size={12}/> หน่วยนับ</label>
                 <input className={inputClasses} value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} placeholder="ชิ้น, ขวด..." />
              </div>
           </div>

           {/* Section 3: Pricing & Stock Row */}
           <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                 <label className={labelClasses}><DollarSign size={12}/> ต้นทุน ({currency})</label>
                 <input type="number" className={inputClasses} value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                 <label className={labelClasses}><DollarSign size={12}/> ราคาขาย ({currency})</label>
                 <input type="number" className={inputClasses} value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                 <label className={cn(labelClasses, "text-orange-400")}><Bell size={12}/> แจ้งเตือนขั้นต่ำ</label>
                 <input type="number" className={cn(inputClasses, "bg-orange-50/50 text-orange-600")} value={formData.minStock} onChange={e => setFormData({...formData, minStock: Number(e.target.value)})} />
              </div>
           </div>

           {/* Section 4: Consignment */}
           <div className="bg-indigo-50/30 p-8 rounded-[40px] space-y-6 border border-indigo-100/50 mt-4">
              <div className="flex items-center justify-between">
                 <div>
                    <span className="text-sm font-black text-indigo-900">สินค้าฝากขาย (Consignment)</span>
                    <p className="text-[10px] text-indigo-400 font-bold uppercase mt-1">แบ่งเปอร์เซ็นต์ยอดขายให้คู่ค้า</p>
                 </div>
                 <Switch checked={formData.isConsignment} onCheckedChange={val => setFormData({...formData, isConsignment: val})} className="data-[state=checked]:bg-indigo-600" />
              </div>
              {formData.isConsignment && (
                <div className="space-y-2 animate-in fade-in zoom-in-95">
                   <label className="text-[10px] font-black uppercase text-indigo-600 px-2">เลือกคู่ค้า</label>
                   <select 
                     className="w-full bg-white border-none rounded-2xl px-6 py-4 font-bold text-sm shadow-sm h-[58px] appearance-none" 
                     value={formData.partnerId}
                     onChange={e => setFormData({...formData, partnerId: e.target.value})}
                   >
                      <option value="">-- เลือกคู่ค้า --</option>
                      {partners.map(p => <option key={p.id} value={p.id}>{p.companyName} (GP {p.gpRate}%)</option>)}
                   </select>
                </div>
              )}
           </div>

           <button type="submit" className="w-full bg-[#1A1F3D] text-white font-black py-6 rounded-[32px] shadow-xl shadow-[#1A1F3D]/20 flex items-center justify-center gap-3 active:scale-95 transition-all">
             <Save size={20} /> บันทึกข้อมูลสินค้า
           </button>
        </form>
      </div>
    </div>
  );
};

export default InventoryModal;