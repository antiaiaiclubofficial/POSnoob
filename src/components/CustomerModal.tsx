"use client";

import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Shield } from 'lucide-react';
import { useStore, Customer, MembershipLevel } from '@/store/useStore';
import { toast } from 'sonner';

interface CustomerModalProps {
  customer?: Customer | null;
  onClose: () => void;
}

const CustomerModal = ({ customer, onClose }: CustomerModalProps) => {
  const { addCustomer, updateCustomer } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    membership: 'Standard' as MembershipLevel
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        membership: customer.membership
      });
    }
  }, [customer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error("Name and Phone are required");
      return;
    }

    if (customer) {
      updateCustomer(customer.id, formData);
      toast.success("Customer updated successfully");
    } else {
      addCustomer(formData);
      toast.success("New customer added");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-[#1A1F3D]">{customer ? 'Edit Profile' : 'Add New Client'}</h2>
            <p className="text-xs text-gray-400 font-medium">Customer contact information</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  type="text"
                  placeholder="e.g. Jane Doe"
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-[#1A1F3D]/5"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  type="tel"
                  placeholder="08x-xxx-xxxx"
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-[#1A1F3D]/5"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  type="email"
                  placeholder="jane@example.com"
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-[#1A1F3D]/5"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-wider">Membership Level</label>
              <div className="relative">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <select 
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-[#1A1F3D]/5 appearance-none"
                  value={formData.membership}
                  onChange={e => setFormData({...formData, membership: e.target.value as MembershipLevel})}
                >
                  <option value="Standard">Standard</option>
                  <option value="Silver">Silver</option>
                  <option value="Gold">Gold</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>
            </div>
          </div>

          <button className="w-full bg-[#D9ED5F] hover:bg-[#c8db54] text-[#1A1F3D] font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg mt-4">
            {customer ? 'Update Information' : 'Register Customer'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CustomerModal;