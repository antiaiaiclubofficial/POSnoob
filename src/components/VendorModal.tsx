"use client";

import React, { useState, useEffect } from 'react';
import { X, Building2, Phone, Mail, MapPin, CreditCard, Percent, FileText, User, Save, Landmark } from 'lucide-react';
import { useStore, Partner } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VendorModalProps {
  vendor?: Partner | null;
  onClose: () => void;
}

const VendorModal = ({ vendor, onClose }: VendorModalProps) => {
  const { addVendor, updateVendor, language } = useStore();
  
  const [formData, setFormData] = useState({
    companyName: '',
    taxId: '',
    address: '',
    mainCategory: '',
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
        mainCategory: vendor.mainCategory || '',
        contactPerson: vendor.contactPerson || '',
        phone: vendor.phone || '',
        email: vendor.email || '',
        gpRate: vendor.gpRate || 20,
        bankName: vendor.bankName || '',
        bankAccountName: vendor.bankAccountName || '',
        bankAccountNumber: vendor.bankAccountNumber || '',
        notes: vendor.notes || ''
      });
    }
  }, [vendor]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName) {
      toast.error(language === 'th' ? "กรุณากรอกชื่อบริษัท" : "Company name is required");
      return;
    }

    if (vendor) {
      updateVendor(vendor.id, formData);
      toast.success(language === 'th' ? "อัปเดตข้อมูลคู่ค้าเรียบร้อย" : "Partner updated successfully");
    } else {
      addVendor(formData);
      toast.success(language === 'th' ? "เพิ่มคู่ค้าใหม่เรียบร้อย" : "New partner added");
    }
    onClose();
  };

  const SectionTitle = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
      <Icon size={16} className="text-blue-500" />
      <h4 className="text-[11px] font-black uppercase text-[#1A1F3D] tracking-widest">{title}</h4>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 lg:p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#1A1F3D] rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Building2 size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-[#1A1F3D]">{vendor ? (language === 'th' ? 'แก้ไขคู่ค้า' : 'Edit Partner') : (language === 'th' ? 'เพิ่มคู่ค้าใหม่' : 'New Partner')}</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Business Profile & Terms</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-xl transition-all"><X size={24} className="text-gray-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 lg:p-10 space-y-10 scrollbar-hide">
          {/* Section: Company Info */}
          <div>
            <SectionTitle icon={FileText} title={language === 'th' ? "ข้อมูลบริษัท" : "Company Info"} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 px-2">ชื่อบริษัท/ร้านค้า</label>
                <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/10" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} placeholder="e.g. Pet Supplies Co., Ltd." />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 px-2">เลขผู้เสียภาษี (Tax ID)</label>
                <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" value={formData.taxId} onChange={e => setFormData({...formData, taxId: e.target.value})} placeholder="010XXXXXXXXXX" />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 px-2">ที่อยู่จดทะเบียน</label>
                <textarea className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold h-20 resize-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Full company address..." />
              </div>
            </div>
          </div>

          {/* Section: Contact & Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <SectionTitle icon={User} title={language === 'th' ? "ผู้ติดต่อ" : "Contact Person"} />
              <div className="space-y-4">
                <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-3.5 text-sm font-bold" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} placeholder="Name" />
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                  <input className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="0xx-xxx-xxxx" />
                </div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                  <input className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@example.com" />
                </div>
              </div>
            </div>
            <div>
              <SectionTitle icon={Percent} title={language === 'th' ? "เงื่อนไขฝากขาย" : "Consignment Terms"} />
              <div className="bg-blue-50 p-6 rounded-[32px] space-y-4">
                <p className="text-[10px] font-black text-blue-600 uppercase">ส่วนแบ่งคู่ค้า (GP %)</p>
                <div className="relative">
                  <input type="number" className="w-full bg-white border-none rounded-2xl px-6 py-4 text-2xl font-black text-blue-600" value={formData.gpRate} onChange={e => setFormData({...formData, gpRate: Number(e.target.value)})} />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-blue-200 text-xl">%</span>
                </div>
                <p className="text-[9px] text-blue-400 font-medium leading-relaxed italic">* สัดส่วนที่ร้านจะทำการโอนยอดคืนให้คู่ค้าเมื่อมียอดขายเกิดขึ้น</p>
              </div>
            </div>
          </div>

          {/* Section: Financials */}
          <div>
            <SectionTitle icon={Landmark} title={language === 'th' ? "ข้อมูลการชำระเงิน" : "Financial Details"} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 px-2">ธนาคาร</label>
                <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-3.5 text-sm font-bold" value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} placeholder="e.g. KBANK" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 px-2">ชื่อบัญชี</label>
                <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-3.5 text-sm font-bold" value={formData.bankAccountName} onChange={e => setFormData({...formData, bankAccountName: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 px-2">เลขที่บัญชี</label>
                <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-3.5 text-sm font-bold" value={formData.bankAccountNumber} onChange={e => setFormData({...formData, bankAccountNumber: e.target.value})} placeholder="xxx-x-xxxxx-x" />
              </div>
            </div>
          </div>
        </form>

        <div className="p-8 lg:p-10 border-t border-gray-50 bg-white shrink-0">
          <button onClick={handleSubmit} className="w-full bg-[#1A1F3D] text-white font-black py-5 rounded-[24px] flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95">
            <Save size={20} /> {vendor ? (language === 'th' ? 'บันทึกการเปลี่ยนแปลง' : 'Save Changes') : (language === 'th' ? 'เพิ่มคู่ค้าเข้าระบบ' : 'Register Partner')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorModal;