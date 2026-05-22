"use client";

import React, { useState, useEffect } from 'react';
import { X, Package, DollarSign, Save, Tag, Barcode, Scale, Building2, AlertCircle } from 'lucide-react';
import { useStore, InventoryItem } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Switch } from "@/components/ui/switch";

interface InventoryModalProps {
  item?: InventoryItem | null;
  onClose: () => void;
}

const InventoryModal = ({ item, onClose }: InventoryModalProps) => {
  const { addInventoryItem, updateInventoryItem, partners, currency, language } = useStore();

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
    partnerId: '',
    consignmentRate: 0
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
        consignmentRate: item.consignmentRate || 0
      });
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error(language === 'th' ? "กรุณากรอกชื่อสินค้า" : "Product name is required");
      return;
    }

    const payload = {
      ...formData,
      // If choosing a partner, automatically use their default GP if product GP is 0
      consignmentRate: formData.isConsignment && formData.consignmentRate === 0 
        ? partners.find(p => p.id === formData.partnerId)?.gpRate || 0 
        : formData.consignmentRate
    };

    if (item) {
      updateInventoryItem(item.id, payload);
      toast.success(language === 'th' ? "อัปเดตข้อมูลสินค้าเรียบร้อย" : "Product updated");
    } else {
      addInventoryItem(payload);
      toast.success(language === 'th' ? "เพิ่มสินค้าใหม่เรียบร้อย" : "Product added");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="p-8 lg:p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1A1F3D] rounded-2xl flex items-center justify-center text-white shadow-lg"><Package size={24} /></div>
            <div>
              <h3 className="text-xl font-black">{item ? (language === 'th' ? 'แก้ไขสินค้า' : 'Edit Product') : (language === 'th' ? 'เพิ่มสินค้าใหม่' : 'Add Product')}</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Master Data Management</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all"><X size={24} className="text-gray-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 lg:p-10 space-y-8 scrollbar-hide">
           {/* Section: Identity */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-gray-400 px-2">ชื่อสินค้า</label>
                 <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 font-bold text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Product Name" />
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-gray-400 px-2 flex items-center gap-1"><Barcode size={10}/> บาร์โค้ด</label>
                 <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 font-bold text-sm" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} placeholder="Scan or type barcode" />
              </div>
           </div>

           {/* Section: Category & Unit */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-gray-400 px-2">หมวดหมู่</label>
                 <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 font-bold text-sm" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="e.g. Shampoos" />
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-gray-400 px-2">หน่วยนับ</label>
                 <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 font-bold text-sm" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} placeholder="Pcs / Bottle / Pack" />
              </div>
           </div>

           {/* Section: Pricing */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-gray-400 px-2">ต้นทุน (Cost)</label>
                 <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-bold">{currency}</span>
                    <input type="number" className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-10 pr-6 py-4 font-bold text-sm" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})} />
                 </div>
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-gray-400 px-2">ราคาขาย (Retail)</label>
                 <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300 font-bold">{currency}</span>
                    <input type="number" className="w-full bg-blue-50 border-none rounded-2xl pl-10 pr-6 py-4 font-black text-xl text-blue-600" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                 </div>
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-gray-400 px-2">กำไร/ชิ้น</label>
                 <div className="w-full bg-green-50 rounded-2xl px-6 py-4 font-black text-lg text-green-600 flex items-center justify-center">
                    +{currency}{(formData.price - formData.costPrice).toLocaleString()}
                 </div>
              </div>
           </div>

           {/* Section: Stock Control */}
           <div className="grid grid-cols-2 gap-6 p-6 bg-[#F5F6FA] rounded-[32px]">
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-gray-400 px-2">จำนวนคงเหลือปัจจุบัน</label>
                 <input type="number" className="w-full bg-white border-none rounded-2xl px-6 py-4 font-black text-xl" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-orange-400 px-2 flex items-center gap-1"><AlertCircle size={10}/> จุดแจ้งเตือนสต็อกต่ำ</label>
                 <input type="number" className="w-full bg-white border-none rounded-2xl px-6 py-4 font-black text-xl text-orange-500" value={formData.minStock} onChange={e => setFormData({...formData, minStock: Number(e.target.value)})} />
              </div>
           </div>

           {/* Section: Consignment Link */}
           <div className={cn("p-8 rounded-[40px] border-2 border-dashed transition-all", formData.isConsignment ? "bg-amber-50/50 border-amber-200" : "bg-gray-50/50 border-gray-100")}>
              <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", formData.isConsignment ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-400")}>
                       <Building2 size={20} />
                    </div>
                    <div>
                       <p className="text-sm font-black text-[#1A1F3D]">การฝากขาย (Consignment)</p>
                       <p className="text-[10px] text-gray-400 font-bold uppercase">Link product to a partner profile</p>
                    </div>
                 </div>
                 <Switch checked={formData.isConsignment} onCheckedChange={val => setFormData({...formData, isConsignment: val})} className="data-[state=checked]:bg-amber-500" />
              </div>

              {formData.isConsignment && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-amber-600 px-2">เลือกคู่ค้า</label>
                      <select 
                        className="w-full bg-white border-none rounded-2xl px-6 py-4 font-bold text-sm shadow-sm" 
                        value={formData.partnerId}
                        onChange={e => setFormData({...formData, partnerId: e.target.value})}
                      >
                         <option value="">-- เลือกคู่ค้า --</option>
                         {partners.map(p => <option key={p.id} value={p.id}>{p.companyName}</option>)}
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-amber-600 px-2">GP เฉพาะสินค้า (%)</label>
                      <div className="relative">
                        <input type="number" className="w-full bg-white border-none rounded-2xl px-6 py-4 font-black text-amber-600" value={formData.consignmentRate} onChange={e => setFormData({...formData, consignmentRate: Number(e.target.value)})} placeholder="0" />
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-amber-200">%</span>
                      </div>
                   </div>
                </div>
              )}
           </div>

           <button type="submit" className="w-full bg-[#1A1F3D] text-white font-black py-5 rounded-[28px] shadow-xl shadow-[#1A1F3D]/20 transition-all active:scale-95">
              <Save size={20} className="inline mr-2" /> บันทึกข้อมูลสินค้า
           </button>
        </form>
      </div>
    </div>
  );
};

export default InventoryModal;