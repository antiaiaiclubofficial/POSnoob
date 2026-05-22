"use client";

import React, { useState, useEffect } from 'react';
import { X, Users, Phone, Mail, FileText, MapPin, Tag, Save, Percent } from 'lucide-react';
import { useStore, Partner } from '@/store/useStore';
import { toast } from 'sonner';

interface VendorModalProps {
  partner?: Partner | null;
  onClose: () => void;
}

const VendorModal = ({ partner, onClose }: VendorModalProps) => {
  const { addPartner, updatePartner, language } = useStore();
  
  const [formData, setFormData] = useState({
    companyName: '',
    taxId: '',
    address: '',
    mainCategory: '',
    contactPerson: '',
    phone: '',
    email: '',
    notes: '',
    gpRate: 0
  });

  useEffect(() => {
    if (partner) {
      setFormData({
        companyName: partner.companyName,
        taxId: partner.taxId || '',
        address: partner.address || '',
        mainCategory: partner.mainCategory || '',
        contactPerson: partner.contactPerson,
        phone: partner.phone,
        email: partner.email,
        notes: partner.notes,
        gpRate: partner.gpRate || 0
      });
    }
  }, [partner]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName) {
      toast.error("Company Name is required");
      return;
    }

    if (partner) {
      updatePartner(partner.id, formData);
      toast.success("Partner updated successfully");
    } else {
      addPartner(formData);
      toast.success("New partner added");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="p-8 lg:p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#1A1F3D] rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Users size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-[#1A1F3D]">{partner ? 'Edit Partner' : 'New Partner'}</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Business Information</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-xl transition-all"><X size={24} className="text-gray-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 lg:p-10 space-y-8 scrollbar-hide">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Company Name</label>
                <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} placeholder="e.g. Pet Supplies Co., Ltd." />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Tax ID</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-6 py-4 text-sm font-bold" value={formData.taxId} onChange={e => setFormData({...formData, taxId: e.target.value})} placeholder="0123456789xxx" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Consignment GP Rate (%)</label>
                <div className="relative">
                  <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" size={18} />
                  <input 
                    type="number"
                    className="w-full bg-indigo-50 border-none rounded-2xl pl-12 pr-6 py-4 text-sm font-black text-indigo-600" 
                    value={formData.gpRate} 
                    onChange={e => setFormData({...formData, gpRate: Number(e.target.value)})} 
                    placeholder="20" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Main Category</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-6 py-4 text-sm font-bold" value={formData.mainCategory} onChange={e => setFormData({...formData, mainCategory: e.target.value})} placeholder="e.g. Shampoos, Toys, Food" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 text-gray-300" size={18} />
                <textarea className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-6 py-4 text-sm font-bold h-24 resize-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Full business address..." />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Contact Person</label>
                <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} placeholder="Name" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-6 py-4 text-sm font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="0xx-xxx-xxxx" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-6 py-4 text-sm font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="contact@company.com" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Private Notes</label>
              <textarea className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold h-20 resize-none" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="..." />
            </div>
          </div>
        </form>

        <div className="p-8 lg:p-10 border-t border-gray-50 bg-white shrink-0">
          <button onClick={handleSubmit} className="w-full bg-[#1A1F3D] text-white font-black py-5 rounded-[24px] flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95">
            <Save size={20} /> {partner ? 'Update Partner Info' : 'Register Partner'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorModal;