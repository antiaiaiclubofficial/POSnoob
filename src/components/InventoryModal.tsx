"use client";

import React, { useState, useEffect } from 'react';
import { X, Package, DollarSign, Save, Tag, Layers, Bell } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-3xl rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1A1F3D] rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Package size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1A1F3D]">{item ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มสินค้าใหม่'}</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Product Specification</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl transition-all">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
           <div className="grid grid-cols-6 gap-x-6 gap-y-8">
              {/* Row 1 */}
              <div className="col-span-6 md:col-span-3 space-y-2">
                 <label className="text-[10px] font-black uppercase text-gray-400 px-2 flex items-center gap-1.5"><Package size={12}/> ชื่อสินค้า</label>
                 <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 font-bold text-sm focus:ring-4 focus:ring-[#1A1F3D]/5" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="เช่น แชมพูสูตรอ่อนโยน" />
              </div>
              <div className="col-span-6 md:col-span-3 space-y-2">
                 <label className="text-[10px] font-black uppercase text-gray-400 px-2">บาร์โค้ด / รหัสสินค้า</label>
                 <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 font-bold text-sm" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} placeholder="Scan or Type..." />
              </div>

              {/* Row 2 */}
              <div className="col-span-6 md:col-span-3 space-y-2">
                 <label className="text-[10px] font-black uppercase text-gray-400 px-2 flex items-center gap-1.5"><Tag size={12}/> หมวดหมู่</label>
                 <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 font-bold text-sm" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="เช่น อาหาร, แชมพู, อุปกรณ์" />
              </div>
              <div className="col-span-6 md:col-span-3 space-y-2">
                 <label className="text-[10px] font-black uppercase text-gray-400 px-2 flex items-center gap-1.5"><Layers size={12}/> หน่วยนับ</label>
                 <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 font-bold text-sm" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} placeholder="ชิ้น, ขวด, กล่อง..." />
              </div>

              {/* Row 3 */}
              <div className="col-span-6 md:col-span-2 space-y-2">
                 <label className="text-[10px] font-black uppercase text-gray-400 px-2">ต้นทุน ({currency})</label>
                 <input type="number" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 font-bold text-sm" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})} />
              </div>
              <div className="col-span-6 md:col-span-2 space-y-2">
                 <label className="text-[10px] font-black uppercase text-gray-400 px-2">ราคาขาย ({currency})</label>
                 <input type="number" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 font-black text-xl text-blue-600" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
              </div>
              <div className="col-span-6 md:col-span-2 space-y-2">
                 <label className="text-[10px] font-black uppercase text-orange-400 px-2 flex items-center gap-1.5"><Bell size={12}/> แจ้งเตือนเมื่อเหลือต่ำกว่า</label>
                 <input type="number" className="w-full bg-orange-50/50 border-none rounded-2xl px-6 py-4 font-black text-sm text-orange-600" value={formData.minStock} onChange={e => setFormData({...formData, minStock: Number(e.target.value)})} />
              </div>
           </div>

           {/* Section 3: Consignment */}
           <div className="bg-indigo-50/30 p-8 rounded-[40px] space-y-6 border border-indigo-100/50">
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
                     className="w-full bg-white border-none rounded-2xl px-6 py-4 font-bold text-sm shadow-sm" 
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