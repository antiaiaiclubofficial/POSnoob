"use client";

import React, { useState, useEffect } from 'react';
import { X, Package, DollarSign, Save } from 'lucide-react';
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
    unit: 'Unit',
    category: 'General',
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
    if (!formData.name) return;

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
      <div className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1A1F3D] rounded-2xl flex items-center justify-center text-white"><Package size={24} /></div>
            <h3 className="text-xl font-black">{item ? 'แก้ไขข้อมูลพื้นฐาน' : 'เพิ่มสินค้าใหม่'}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all"><X size={24} className="text-gray-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-gray-400 px-2">ชื่อสินค้า</label>
                 <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 font-bold text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-gray-400 px-2">บาร์โค้ด</label>
                 <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 font-bold text-sm" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} />
              </div>
           </div>

           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-gray-400 px-2">ต้นทุน (฿)</label>
                 <input type="number" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 font-bold text-sm" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-gray-400 px-2">ราคาขาย (฿)</label>
                 <input type="number" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 font-black text-xl text-blue-600" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
              </div>
           </div>

           <div className="bg-amber-50 p-8 rounded-[32px] space-y-6">
              <div className="flex items-center justify-between">
                 <span className="text-sm font-black text-amber-700">สินค้าฝากขาย (Consignment)</span>
                 <Switch checked={formData.isConsignment} onCheckedChange={val => setFormData({...formData, isConsignment: val})} className="data-[state=checked]:bg-amber-500" />
              </div>
              {formData.isConsignment && (
                <div className="space-y-2 animate-in fade-in zoom-in-95">
                   <label className="text-[10px] font-black uppercase text-amber-600 px-2">เลือกคู่ค้า</label>
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

           <button type="submit" className="w-full bg-[#1A1F3D] text-white font-black py-5 rounded-[28px] shadow-xl shadow-[#1A1F3D]/20"><Save size={20} className="inline mr-2" /> บันทึกข้อมูล</button>
        </form>
      </div>
    </div>
  );
};

export default InventoryModal;