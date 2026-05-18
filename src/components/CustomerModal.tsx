"use client";

import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Shield, MapPin, Info, FileText } from 'lucide-react';
import { useStore, Customer, MembershipLevel } from '@/store/useStore';
import { translations } from '@/utils/translations';
import { toast } from 'sonner';

interface CustomerModalProps {
  customer?: Customer | null;
  onClose: () => void;
}

const CustomerModal = ({ customer, onClose }: CustomerModalProps) => {
  const { addCustomer, updateCustomer, language } = useStore();
  const t = translations[language];
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'Male',
    age: '',
    phone: '',
    email: '',
    membership: 'Standard' as MembershipLevel,
    taxId: '',
    branchName: '',
    houseNo: '',
    villageNo: '',
    soi: '',
    road: '',
    subDistrict: '',
    district: '',
    province: '',
    postalCode: ''
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        firstName: customer.firstName || customer.name.split(' ')[0] || '',
        lastName: customer.lastName || customer.name.split(' ').slice(1).join(' ') || '',
        gender: customer.gender || 'Male',
        age: customer.age || '',
        phone: customer.phone,
        email: customer.email,
        membership: customer.membership,
        taxId: customer.taxId || '',
        branchName: customer.branchName || '',
        houseNo: customer.houseNo || '',
        villageNo: customer.villageNo || '',
        soi: customer.soi || '',
        road: customer.road || '',
        subDistrict: customer.subDistrict || '',
        district: customer.district || '',
        province: customer.province || '',
        postalCode: customer.postalCode || ''
      });
    }
  }, [customer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.phone) {
      toast.error(language === 'th' ? "กรุณากรอกชื่อและเบอร์โทรศัพท์" : "First Name and Phone are required");
      return;
    }

    const customerPayload = {
      ...formData,
      name: `${formData.firstName} ${formData.lastName}`.trim()
    };

    if (customer) {
      updateCustomer(customer.id, customerPayload);
      toast.success(language === 'th' ? "อัปเดตข้อมูลลูกค้าเรียบร้อย" : "Customer updated successfully");
    } else {
      addCustomer(customerPayload);
      toast.success(language === 'th' ? "ลงทะเบียนลูกค้าใหม่เรียบร้อย" : "New customer added");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-[#1A1F3D]">{customer ? t.editProfile : t.addClient}</h2>
            <p className="text-xs text-gray-400 font-medium">{t.customerContact}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl transition-colors"><X size={20} className="text-gray-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto scrollbar-hide">
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-2"><Info size={16} className="text-blue-500" /><h3 className="text-[11px] font-black uppercase text-[#1A1F3D] tracking-widest">{t.personalInfo}</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">{t.firstName}</label><input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-5 py-3.5 text-sm font-bold" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} /></div>
              <div><label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">{t.lastName}</label><input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-5 py-3.5 text-sm font-bold" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">{t.gender}</label><select className="w-full bg-[#F5F6FA] border-none rounded-2xl px-5 py-3.5 text-sm font-bold appearance-none" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}><option value="Male">{t.male}</option><option value="Female">{t.female}</option><option value="Other">{t.other}</option></select></div>
              <div><label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">{t.age}</label><input type="number" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-5 py-3.5 text-sm font-bold" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} /></div>
              <div><label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">{t.membershipLevel}</label><select className="w-full bg-[#F5F6FA] border-none rounded-2xl px-5 py-3.5 text-sm font-bold appearance-none" value={formData.membership} onChange={e => setFormData({...formData, membership: e.target.value as MembershipLevel})}><option value="Standard">Standard</option><option value="Silver">Silver</option><option value="Gold">Gold</option><option value="VIP">VIP</option></select></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">{t.phoneNumber}</label><div className="relative"><Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} /><input type="tel" className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div></div>
              <div><label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">{t.emailAddress}</label><div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} /><input type="email" className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div></div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-2"><FileText size={16} className="text-purple-500" /><h3 className="text-[11px] font-black uppercase text-[#1A1F3D] tracking-widest">{language === 'th' ? 'ข้อมูลภาษี' : 'Tax Information'}</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">Tax ID / เลขผู้เสียภาษี</label><input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-5 py-3.5 text-sm font-bold" value={formData.taxId} onChange={e => setFormData({...formData, taxId: e.target.value})} placeholder="0123456789xxx" /></div>
              <div><label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">Branch / สาขา</label><input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-5 py-3.5 text-sm font-bold" value={formData.branchName} onChange={e => setFormData({...formData, branchName: e.target.value})} placeholder="Head Office / สาขา..." /></div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-2"><MapPin size={16} className="text-orange-500" /><h3 className="text-[11px] font-black uppercase text-[#1A1F3D] tracking-widest">{t.addressInfo}</h3></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">{t.houseNo}</label><input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-5 py-3.5 text-sm font-bold" value={formData.houseNo} onChange={e => setFormData({...formData, houseNo: e.target.value})} /></div>
              <div><label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">{t.villageNo}</label><input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-5 py-3.5 text-sm font-bold" value={formData.villageNo} onChange={e => setFormData({...formData, villageNo: e.target.value})} /></div>
              <div><label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">{t.soi}</label><input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-5 py-3.5 text-sm font-bold" value={formData.soi} onChange={e => setFormData({...formData, soi: e.target.value})} /></div>
              <div><label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">{t.road}</label><input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-5 py-3.5 text-sm font-bold" value={formData.road} onChange={e => setFormData({...formData, road: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">{t.subDistrict}</label><input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-5 py-3.5 text-sm font-bold" value={formData.subDistrict} onChange={e => setFormData({...formData, subDistrict: e.target.value})} /></div>
              <div><label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">{t.district}</label><input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-5 py-3.5 text-sm font-bold" value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">{t.province}</label><input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-5 py-3.5 text-sm font-bold" value={formData.province} onChange={e => setFormData({...formData, province: e.target.value})} /></div>
              <div><label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">{t.postalCode}</label><input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-5 py-3.5 text-sm font-bold" value={formData.postalCode} onChange={e => setFormData({...formData, postalCode: e.target.value})} /></div>
            </div>
          </div>

          <div className="pt-4 shrink-0"><button className="w-full bg-[#D9ED5F] hover:bg-[#c8db54] text-[#1A1F3D] font-black py-4 rounded-2xl shadow-lg">{customer ? t.updateInformation : t.registerCustomer}</button></div>
        </form>
      </div>
    </div>
  );
};

export default CustomerModal;