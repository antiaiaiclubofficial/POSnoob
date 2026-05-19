"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Package, DollarSign, Percent, Users, Barcode, Trash2, Save, ShoppingBag, Plus, Upload, Camera } from 'lucide-react';
import { useStore, InventoryItem } from '@/store/useStore';
import { translations } from '@/utils/translations';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Switch } from "@/components/ui/switch";

interface InventoryModalProps {
  item?: InventoryItem | null;
  onClose: () => void;
}

const InventoryModal = ({ item, onClose }: InventoryModalProps) => {
  const { addInventoryItem, updateInventoryItem, vendors, currency, language } = useStore();
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    vendorId: '',
    consignmentRate: 20
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
        vendorId: item.vendorId || '',
        consignmentRate: item.consignmentRate || 20
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

  const vendorPayout = formData.isConsignment 
    ? formData.price * (1 - formData.consignmentRate / 100)
    : 0;

  const shopProfit = formData.isConsignment
    ? formData.price * (formData.consignmentRate / 100)
    : formData.price - formData.costPrice;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error(language === 'th' ? "กรุณากรอกชื่อสินค้า" : "Name is required");
      return;
    }
    if (item) {
      updateInventoryItem(item.id, formData);
      toast.success(language === 'th' ? "อัปเดตข้อมูลสินค้าเรียบร้อย" : "Product updated");
    } else {
      addInventoryItem(formData);
      toast.success(language === 'th' ? "เพิ่มสินค้าใหม่เรียบร้อย" : "New product added");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[150] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="p-8 lg:p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#1A1F3D] rounded-2xl flex items-center justify-center text-[#D9ED5F] shadow-lg">
              <Package size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-[#1A1F3D]">{item ? t.edit : t.add} {t.productName}</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t.stockManagement}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-xl transition-all">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 lg:p-10 space-y-8 scrollbar-hide">
          {/* Image Section */}
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative group">
              <div className="w-32 h-32 bg-[#F5F6FA] rounded-[32px] overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center">
                {formData.image ? (
                  <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera size={32} className="text-gray-300" />
                )}
              </div>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#1A1F3D] text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              >
                <Upload size={16} />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Product Photo</p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">{t.productName}</label>
                <input 
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Organic Puppy Shampoo"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Barcode</label>
                <div className="relative">
                  <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input 
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-6 py-4 text-sm font-bold"
                    value={formData.barcode}
                    onChange={e => setFormData({...formData, barcode: e.target.value})}
                    placeholder="Scan or type barcode..."
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">{t.category}</label>
                <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-4 py-3 text-xs font-bold" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Unit</label>
                <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-4 py-3 text-xs font-bold" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Stock</label>
                <input type="number" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-4 py-3 text-xs font-bold" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Min. Alert</label>
                <input type="number" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-4 py-3 text-xs font-bold text-red-500" value={formData.minStock} onChange={e => setFormData({...formData, minStock: Number(e.target.value)})} />
              </div>
            </div>
          </div>

          <div className="p-8 bg-[#F5F6FA] rounded-[40px] space-y-8 border border-gray-100">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm text-blue-500"><DollarSign size={20} /></div>
                  <h4 className="text-sm font-black text-[#1A1F3D] uppercase tracking-widest">{language === 'th' ? 'ราคาและส่วนแบ่ง' : 'Pricing & GP'}</h4>
               </div>
               <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-50">
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", formData.isConsignment ? "text-amber-600" : "text-gray-400")}>{t.consignment}</span>
                  <Switch 
                    checked={formData.isConsignment} 
                    onCheckedChange={(val) => setFormData({...formData, isConsignment: val})} 
                    className="data-[state=checked]:bg-amber-500"
                  />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">{t.retailPrice}</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-black">{currency}</span>
                      <input 
                        type="number" 
                        className="w-full bg-white border-none rounded-2xl pl-10 pr-6 py-4 text-xl font-black text-[#1A1F3D] shadow-sm"
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                  {!formData.isConsignment && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">{t.costPrice}</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-black">{currency}</span>
                        <input 
                          type="number" 
                          className="w-full bg-white border-none rounded-2xl pl-10 pr-6 py-4 text-sm font-bold text-gray-500 shadow-sm"
                          value={formData.costPrice}
                          onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})}
                        />
                      </div>
                    </div>
                  )}
               </div>
               <div className="space-y-6">
                  {formData.isConsignment && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">{t.vendorName}</label>
                        <select 
                          className="w-full bg-white border-none rounded-2xl px-6 py-4 text-sm font-bold shadow-sm appearance-none"
                          value={formData.vendorId}
                          onChange={e => setFormData({...formData, vendorId: e.target.value})}
                        >
                          <option value="">{language === 'th' ? '-- เลือกคู่ค้า --' : '-- Select Partner --'}</option>
                          {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Shop GP (%)</label>
                        <div className="relative">
                          <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                          <input 
                            type="number" 
                            className="w-full bg-white border-none rounded-2xl pl-12 pr-6 py-4 text-sm font-black text-blue-600 shadow-sm"
                            value={formData.consignmentRate}
                            onChange={e => setFormData({...formData, consignmentRate: Number(e.target.value)})}
                          />
                        </div>
                      </div>
                    </div>
                  )}
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
               <div className="bg-white/60 p-5 rounded-3xl border border-white">
                  <p className="text-[9px] font-black text-gray-400 uppercase mb-1">{formData.isConsignment ? t.vendorPayout : t.costPrice}</p>
                  <p className="text-lg font-black text-[#1A1F3D]">{currency}{formData.isConsignment ? vendorPayout.toLocaleString() : formData.costPrice.toLocaleString()}</p>
               </div>
               <div className="bg-green-50 p-5 rounded-3xl border border-green-100">
                  <p className="text-[9px] font-black text-green-600 uppercase mb-1">{t.shopProfit}</p>
                  <p className="text-lg font-black text-green-700">+{currency}{shopProfit.toLocaleString()}</p>
               </div>
            </div>
          </div>
        </form>

        <div className="p-8 lg:p-10 border-t border-gray-50 bg-white shrink-0 flex gap-4">
          <button onClick={onClose} className="flex-1 py-5 text-sm font-black text-gray-400 uppercase tracking-widest">Cancel</button>
          <button onClick={handleSubmit} className="flex-[2] bg-[#1A1F3D] text-white font-black py-5 rounded-[24px] flex items-center justify-center gap-3 shadow-2xl shadow-[#1A1F3D]/20 active:scale-95 transition-all">
            <Save size={20} /> {item ? t.saveChanges : t.add}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryModal;