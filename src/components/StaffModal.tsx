"use client";

import React, { useState, useEffect } from 'react';
import { X, User, Phone, Briefcase, Camera, Lock, Key } from 'lucide-react';
import { useStore, Staff, StaffRole } from '@/store/useStore';
import { toast } from 'sonner';

interface StaffModalProps {
  staff?: Staff | null;
  onClose: () => void;
}

const StaffModal = ({ staff, onClose }: StaffModalProps) => {
  const { addStaff, updateStaff } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    role: 'Assistant' as StaffRole,
    phone: '',
    status: 'Active' as 'Active' | 'Inactive',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    username: '',
    password: ''
  });

  useEffect(() => {
    if (staff) {
      setFormData({
        name: staff.name,
        role: staff.role,
        phone: staff.phone,
        status: staff.status,
        avatar: staff.avatar,
        username: staff.username || '',
        password: staff.password || ''
      });
    }
  }, [staff]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error("Name and Phone are required");
      return;
    }

    if (staff) {
      updateStaff(staff.id, formData);
      toast.success("Staff updated successfully");
    } else {
      addStaff(formData);
      toast.success("New staff registered");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-[#1A1F3D]">{staff ? 'Edit Staff' : 'Add New Staff'}</h2>
            <p className="text-xs text-gray-400 font-medium">Manage team member details & login access</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
          <div className="flex justify-center mb-4">
             <div className="relative group">
                <img src={formData.avatar} className="w-24 h-24 rounded-[32px] object-cover border-4 border-[#F5F6FA]" />
                <div className="absolute inset-0 bg-[#1A1F3D]/20 rounded-[32px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="text-white" size={24} />
                </div>
             </div>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50/50 p-6 rounded-[28px] border border-blue-100 space-y-4 mb-2">
              <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest px-1">Login Credentials</p>
              <div>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300" size={18} />
                  <input 
                    type="text"
                    className="w-full bg-white border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500/10"
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                    placeholder="Login Username"
                  />
                </div>
              </div>
              <div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300" size={18} />
                  <input 
                    type="password"
                    className="w-full bg-white border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500/10"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    placeholder="Login Password"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Profile Info</p>
              <div>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input 
                    type="text"
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Employee Full Name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">Role</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                    <select 
                      className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-10 pr-4 py-3.5 text-xs font-bold appearance-none"
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value as StaffRole})}
                    >
                      <option value="Admin">Admin</option>
                      <option value="Groomer">Groomer</option>
                      <option value="Assistant">Assistant</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">Status</label>
                  <select 
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl px-4 py-3.5 text-xs font-bold appearance-none"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input 
                    type="tel"
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="Contact Number"
                  />
                </div>
              </div>
            </div>
          </div>

          <button className="w-full bg-[#1A1F3D] text-white font-black py-4 rounded-2xl shadow-xl shadow-[#1A1F3D]/10 hover:bg-[#2A3152] transition-all mt-4">
            {staff ? 'Update Staff Member' : 'Add to Team'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StaffModal;