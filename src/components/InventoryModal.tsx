"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Package, DollarSign, Save, Tag, Layers, Bell, Upload, Camera, ChevronDown } from 'lucide-react';
import { useStore, InventoryItem } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Switch } from "@/components/ui/switch";

interface InventoryModalProps {
  item?: InventoryItem | null;
  onClose: () => void;
  initialPartnerId?: string;
  defaultIsConsignment?: boolean;
}

const InventoryModal = ({ item, onClose, initialPartnerId, defaultIsConsignment }: InventoryModalProps) => {
  const { addInventoryItem, updateInventoryItem, partners, currency, inventory } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const unitDropdownRef = useRef<HTMLDivElement>(null);
  const shelfDropdownRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const [isShelfDropdownOpen, setIsShelfDropdownOpen] = useState(false);

  const categories = React.useMemo(() => Array.from(new Set(inventory.map(i => i.category))).filter(Boolean), [inventory]);
  const units = React.useMemo(() => Array.from(new Set(inventory.map(i => i.unit))).filter(Boolean), [inventory]);
  const shelves = React.useMemo(() => Array.from(new Set(inventory.map(i => i.shelf))).filter(Boolean), [inventory]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
      if (unitDropdownRef.current && !unitDropdownRef.current.contains(event.target as Node)) {
        setIsUnitDropdownOpen(false);
      }
      if (shelfDropdownRef.current && !shelfDropdownRef.current.contains(event.target as Node)) {
        setIsShelfDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    isConsignment: defaultIsConsignment !== undefined ? defaultIsConsignment : !!initialPartnerId,
    partnerId: initialPartnerId || '',
    shelf: ''
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
        partnerId: item.partnerId || '',
        shelf: item.shelf || ''
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("กรุณาระบุชื่อสินค้า");
      return;
    }

    if (formData.isConsignment && !formData.partnerId) {
      toast.error("กรุณาเลือกคู่ค้าสำหรับสินค้าฝากขาย");
      return;
    }

    setIsSubmitting(true);
    try {
      if (item) {
        await updateInventoryItem(item.id, formData);
        toast.success("อัปเดตสินค้าเรียบร้อย");
      } else {
        await addInventoryItem(formData);
        toast.success("เพิ่มสินค้าเรียบร้อย");
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูลสินค้า");
    } finally {
      setIsSubmitting(false);
    }
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
              <h3 className="text-xl font-black text-[#1A1F3D]">
                {item 
                  ? 'แก้ไขข้อมูลสินค้า' 
                  : defaultIsConsignment 
                    ? 'เพิ่มสินค้าฝากขายใหม่' 
                    : 'เพิ่มสินค้าใหม่ (ขายเอง)'}
              </h3>
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
           </div>

           {/* Section 2.5: Category, Unit, Shelf */}
           <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2 relative" ref={categoryDropdownRef}>
                 <label className={labelClasses}><Tag size={12}/> หมวดหมู่</label>
                 <div className="relative inline-flex w-full align-top">
                   <input 
                     className={cn(inputClasses, "pr-10")} 
                     value={formData.category} 
                     onChange={e => {
                        setFormData({...formData, category: e.target.value});
                        setIsCategoryDropdownOpen(true);
                     }} 
                     onFocus={() => setIsCategoryDropdownOpen(true)}
                     placeholder="เช่น อาหาร, แชมพู" 
                   />
                   <button 
                     type="button" 
                     className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none flex items-center justify-center h-full"
                     onClick={(e) => {
                        e.stopPropagation();
                        setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                     }}
                   >
                     <ChevronDown size={18} className={cn("transition-transform duration-200", isCategoryDropdownOpen && "rotate-180")} />
                   </button>
                 </div>
                 {isCategoryDropdownOpen && categories.length > 0 && (
                   <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                     {categories.map((cat, idx) => (
                       <div 
                         key={idx} 
                         className="px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer transition-colors"
                         onClick={() => {
                           setFormData({...formData, category: cat as string});
                           setIsCategoryDropdownOpen(false);
                         }}
                       >
                         {cat}
                       </div>
                     ))}
                   </div>
                 )}
              </div>
              <div className="space-y-2 relative" ref={unitDropdownRef}>
                 <label className={labelClasses}><Layers size={12}/> หน่วยนับ</label>
                 <div className="relative inline-flex w-full align-top">
                   <input 
                     className={cn(inputClasses, "pr-10")} 
                     value={formData.unit} 
                     onChange={e => {
                        setFormData({...formData, unit: e.target.value});
                        setIsUnitDropdownOpen(true);
                     }} 
                     onFocus={() => setIsUnitDropdownOpen(true)}
                     placeholder="ชิ้น, ขวด..." 
                   />
                   <button 
                     type="button" 
                     className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none flex items-center justify-center h-full"
                     onClick={(e) => {
                        e.stopPropagation();
                        setIsUnitDropdownOpen(!isUnitDropdownOpen);
                     }}
                   >
                     <ChevronDown size={18} className={cn("transition-transform duration-200", isUnitDropdownOpen && "rotate-180")} />
                   </button>
                 </div>
                 {isUnitDropdownOpen && units.length > 0 && (
                   <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                     {units.map((u, idx) => (
                       <div 
                         key={idx} 
                         className="px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer transition-colors"
                         onClick={() => {
                           setFormData({...formData, unit: u as string});
                           setIsUnitDropdownOpen(false);
                         }}
                       >
                         {u}
                       </div>
                     ))}
                   </div>
                 )}
              </div>
              <div className="space-y-2 relative" ref={shelfDropdownRef}>
                 <label className={labelClasses}><Package size={12}/> ชั้นวาง (Shelf)</label>
                 <div className="relative inline-flex w-full align-top">
                   <input 
                     className={cn(inputClasses, "pr-10")} 
                     value={formData.shelf} 
                     onChange={e => {
                        setFormData({...formData, shelf: e.target.value});
                        setIsShelfDropdownOpen(true);
                     }} 
                     onFocus={() => setIsShelfDropdownOpen(true)}
                     placeholder="เช่น A1, ชั้น 2 (ไม่บังคับ)" 
                   />
                   <button 
                     type="button" 
                     className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none flex items-center justify-center h-full"
                     onClick={(e) => {
                        e.stopPropagation();
                        setIsShelfDropdownOpen(!isShelfDropdownOpen);
                     }}
                   >
                     <ChevronDown size={18} className={cn("transition-transform duration-200", isShelfDropdownOpen && "rotate-180")} />
                   </button>
                 </div>
                 {isShelfDropdownOpen && shelves.length > 0 && (
                   <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                     {shelves.map((s, idx) => (
                       <div 
                         key={idx} 
                         className="px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer transition-colors"
                         onClick={() => {
                           setFormData({...formData, shelf: s as string});
                           setIsShelfDropdownOpen(false);
                         }}
                       >
                         {s}
                       </div>
                     ))}
                   </div>
                 )}
              </div>
           </div>

           {/* Section 3: Pricing & Stock Row */}
           <div className="grid grid-cols-2 gap-6">
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
            {!item && defaultIsConsignment === false ? null : !item && defaultIsConsignment === true ? (
              <div className="bg-indigo-50/50 p-8 rounded-[40px] space-y-4 border border-indigo-100 mt-4">
                 <div>
                    <span className="text-sm font-black text-indigo-900">สินค้าฝากขาย (Consignment)</span>
                    <p className="text-[10px] text-indigo-400 font-bold uppercase mt-1">กรุณาระบุคู่ค้าผู้ฝากขาย</p>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-indigo-600 px-2">คู่ค้าฝากขาย <span className="text-red-500">*</span></label>
                    <select 
                      className="w-full bg-white border-none rounded-2xl px-6 py-4 font-bold text-sm shadow-sm h-[58px] appearance-none" 
                      value={formData.partnerId}
                      onChange={e => setFormData({...formData, partnerId: e.target.value})}
                      required
                    >
                       <option value="">-- เลือกคู่ค้า --</option>
                       {partners.map(p => <option key={p.id} value={p.id}>{p.companyName} (GP {p.gpRate}%)</option>)}
                    </select>
                 </div>
              </div>
            ) : (
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
            )}

           <button 
             type="submit" 
             disabled={isSubmitting}
             className="w-full bg-[#1A1F3D] text-white font-black py-6 rounded-[32px] shadow-xl shadow-[#1A1F3D]/20 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
           >
             <Save size={20} /> {isSubmitting ? "กำลังบันทึก..." : "บันทึกข้อมูลสินค้า"}
           </button>
        </form>
      </div>
    </div>
  );
};

export default InventoryModal;