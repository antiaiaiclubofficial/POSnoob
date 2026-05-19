"use client";

import React, { useState, useEffect } from 'react';
import { X, Gem, Save, Trash2, Plus } from 'lucide-react';
import { useStore, CreditPackageTemplate } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CreditPackageSettingsModalProps {
  onClose: () => void;
}

const CreditPackageSettingsModal = ({ onClose }: CreditPackageSettingsModalProps) => {
  const { creditPackages, addCreditPackage, updateCreditPackage, deleteCreditPackage, currency } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    creditAmount: 0
  });

  const handleSave = () => {
    if (!formData.name || formData.price <= 0 || formData.creditAmount <= 0) {
      toast.error("Please fill in all fields correctly");
      return;
    }

    if (editingId) {
      updateCreditPackage(editingId, formData);
      toast.success("Package updated");
    } else {
      addCreditPackage(formData);
      toast.success("New package created");
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', price: 0, creditAmount: 0 });
    setIsEditing(false);
    setEditingId(null);
  };

  const startEdit = (pkg: CreditPackageTemplate) => {
    setFormData({ name: pkg.name, price: pkg.price, creditAmount: pkg.creditAmount });
    setEditingId(pkg.id);
    setIsEditing(true);
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-lg rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="p-8 lg:p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Gem size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1A1F3D]">Credit Packages</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Manage Prepaid Top-ups</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-xl transition-all"><X size={20} className="text-gray-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 lg:p-10 space-y-8 scrollbar-hide">
          {/* List Section */}
          {!isEditing && (
            <div className="space-y-4">
              {creditPackages.map(pkg => (
                <div key={pkg.id} className="bg-[#F5F6FA] p-6 rounded-[32px] flex items-center justify-between group">
                  <div>
                    <h4 className="font-black text-[#1A1F3D]">{pkg.name}</h4>
                    <p className="text-[10px] text-purple-600 font-black uppercase">Get {pkg.creditAmount} Credits • Pay {currency}{pkg.price}</p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(pkg)} className="p-2 text-gray-400 hover:text-[#1A1F3D]"><Edit3 size={16}/></button>
                    <button onClick={() => deleteCreditPackage(pkg.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
              <button 
                onClick={() => setIsEditing(true)}
                className="w-full py-6 border-2 border-dashed border-gray-200 rounded-[32px] text-gray-300 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-50 hover:text-purple-400 hover:border-purple-200 transition-all"
              >
                <Plus size={16} /> Create New Prepaid Tier
              </button>
            </div>
          )}

          {/* Form Section */}
          {isEditing && (
            <div className="space-y-6 animate-in slide-in-from-top-4">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">Package Name</label>
                  <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Bronze Top-up" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">Selling Price</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-black">{currency}</span>
                      <input type="number" className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-10 pr-6 py-4 text-sm font-bold" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">Credit Received</label>
                    <div className="relative">
                      <Gem className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300" size={16} />
                      <input type="number" className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-purple-600" value={formData.creditAmount} onChange={e => setFormData({...formData, creditAmount: Number(e.target.value)})} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={resetForm} className="flex-1 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cancel</button>
                <button onClick={handleSave} className="flex-[2] bg-[#1A1F3D] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl"><Save size={16}/> {editingId ? 'Update' : 'Save Package'}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreditPackageSettingsModal;