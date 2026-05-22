"use client";

import React, { useState, useEffect } from 'react';
import { X, Building2, Phone, Mail, MapPin, CreditCard, Percent, FileText, User } from 'lucide-react';
import { useStore, Partner } from '@/store/useStore';
import { toast } from 'sonner';

interface VendorModalProps {
  vendor: Partner | null;
  onClose: () => void;
}

const VendorModal = ({ vendor, onClose }: VendorModalProps) => {
  const { partners, updateBusinessProfile } = useStore();
  // Using a local set state to manage partners since addVendor was defined for 'vendors' list, 
  // but the UI is using 'partners' list. I will use a direct state update for partners.
  const setPartners = (newPartners: Partner[]) => useStore.setState({ partners: newPartners });

  const [formData, setFormData] = useState<Omit<Partner, 'id'>>({
    companyName: '',
    taxId: '',
    address: '',
    contactPerson: '',
    phone: '',
    email: '',
    gpRate: 20,
    bankName: '',
    bankAccountName: '',
    bankAccountNumber: '',
    notes: ''
  });

  useEffect(() => {
    if (vendor) {
      setFormData({
        companyName: vendor.companyName,
        taxId: vendor.taxId || '',
        address: vendor.address || '',
        contactPerson: vendor.contactPerson || '',
        phone: vendor.phone || '',
        email: vendor.email || '',
        gpRate: vendor.gpRate,
        bankName: vendor.bankName || '',
        bankAccountName: vendor.bankAccountName || '',
        bankAccountNumber: vendor.bankAccountNumber || '',
        notes: vendor.notes || ''
      });
    }
  }, [vendor]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (vendor) {
      const updated = partners.map(p => p.id === vendor.id ? { ...p, ...formData } : p);
      setPartners(updated);
      toast.success('อัปเดตข้อมูลคู่ค้าเรียบร้อย');
    } else {
      const newPartner: Partner = { ...formData, id: Math.random().toString(36).substr(2, 9) };
      setPartners([...partners, newPartner]);
      toast.success('เพิ่มคู่ค้าใหม่เรียบร้อย');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-[#F8F9FD]">
          <div>
            <h2 className="text-2xl font-black text-[#1A1F3D]">{vendor ? 'แก้ไขข้อมูลคู่ค้า' : 'เพิ่มคู่ค้าใหม่'}</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Partner & Consignment Details</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white text-gray-400 hover:text-red-500 rounded-2xl transition-colors shadow-sm">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8 scrollbar-hide">
          {/* Basic Info */}
          <div className="space-y-6">
             <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                <Building2 size={14}/> ข้อมูลทั่วไป
             </h3>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2">ชื่อบริษัท/ร้านค้า</label>
                <input required className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2">เลขประจำตัวผู้เสียภาษี</label>
                <input className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold" value={formData.taxId} onChange={e => setFormData({...formData, taxId: e.target.value})} />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2">ผู้ประสานงาน</label>
                <div className="relative"><User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={16}/><input className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-6 py-4 font-bold" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} /></div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-gray-400 ml-2">เบอร์โทรศัพท์</label>
                   <input className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-gray-400 ml-2">GP Rate (%)</label>
                   <div className="relative"><Percent className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300" size={16}/><input type="number" className="w-full bg-indigo-50 border-none rounded-2xl px-6 py-4 font-black text-indigo-600" value={formData.gpRate} onChange={e => setFormData({...formData, gpRate: Number(e.target.value)})} /></div>
                </div>
             </div>
          </div>

          {/* Billing & Address */}
          <div className="space-y-6">
             <h3 className="text-xs font-black text-green-600 uppercase tracking-widest flex items-center gap-2">
                <CreditCard size={14}/> ข้อมูลการชำระเงิน & ที่อยู่
             </h3>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2">ธนาคาร</label>
                <input className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold" value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2">เลขที่บัญชี</label>
                <input className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold" value={formData.bankAccountNumber} onChange={e => setFormData({...formData, bankAccountNumber: e.target.value})} />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2">ชื่อบัญชี</label>
                <input className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold" value={formData.bankAccountName} onChange={e => setFormData({...formData, bankAccountName: e.target.value})} />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2">ที่อยู่จดทะเบียน</label>
                <textarea rows={3} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold resize-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
             </div>
          </div>
        </form>

        <div className="p-8 bg-[#F8F9FD] flex gap-4">
           <button onClick={onClose} className="flex-1 py-4 rounded-2xl font-black text-gray-400 hover:bg-gray-100 transition-colors">ยกเลิก</button>
           <button onClick={handleSubmit} className="flex-[2] bg-[#1A1F3D] text-white py-4 rounded-2xl font-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
             บันทึกข้อมูลคู่ค้า
           </button>
        </div>
      </div>
    </div>
  );
};

export default VendorModal;