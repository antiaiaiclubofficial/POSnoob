"use client";

import React, { useState } from 'react';
import { X, Wallet, Plus, Trash2, Edit3, DollarSign, Sparkles } from 'lucide-react';
import { useStore, CreditPackageTemplate } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CreditPackageModalProps {
  onClose: () => void;
  customerId?: string; // If provided, we are performing a top-up
}

const CreditPackageModal = ({ onClose, customerId }: CreditPackageModalProps) => {
  const { creditPackages, addCreditPackage, updateCreditPackage, deleteCreditPackage, buyCreditPackage, currency, language } = useStore();
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<CreditPackageTemplate, 'id'>>({
    name: '',
    price: 0,
    creditValue: 0
  });

  const handleSave = () => {
    if (!formData.name || formData.price <= 0 || formData.creditValue <= 0) {
      toast.error("Please fill in all fields with valid values");
      return;
    }

    if (editingId) {
      updateCreditPackage(editingId, formData);
      toast.success("Package updated");
    } else {
      addCreditPackage(formData);
      toast.success("Package created");
    }
    setIsCreating(false);
    setEditingId(null);
    setFormData({ name: '', price: 0, creditValue: 0 });
  };

  const handleEdit = (pkg: CreditPackageTemplate) => {
    setEditingId(pkg.id);
    setFormData({ name: pkg.name, price: pkg.price, creditValue: pkg.creditValue });
    setIsCreating(true);
  };

  const handleBuy = (packageId: string) => {
    if (customerId) {
      buyCreditPackage(customerId, packageId);
      toast.success("Wallet topped up successfully!");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Wallet size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1A1F3D]">
                {customerId ? "Top-up Credits" : "Credit Package Management"}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                {customerId ? "Increase client wallet balance" : "Manage prepaid credit deals"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
          {isCreating ? (
            <div className="space-y-6 animate-in slide-in-from-top-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Package Name</label>
                <input 
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold"
                  placeholder="e.g. Bronze Saver"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Price (Paid)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-black">{currency}</span>
                    <input 
                      type="number"
                      className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-10 pr-6 py-4 text-sm font-bold"
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Credit Value (Received)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-black">{currency}</span>
                    <input 
                      type="number"
                      className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-10 pr-6 py-4 text-sm font-black text-amber-600"
                      value={formData.creditValue}
                      onChange={e => setFormData({...formData, creditValue: Number(e.target.value)})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setIsCreating(false)} className="flex-1 py-4 text-sm font-black text-gray-400">Cancel</button>
                <button onClick={handleSave} className="flex-[2] bg-[#1A1F3D] text-white py-4 rounded-2xl font-black shadow-xl">
                  {editingId ? "Update Package" : "Create Package"}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {creditPackages.map(pkg => (
                <div key={pkg.id} className="bg-white border-2 border-gray-50 p-6 rounded-[32px] group hover:border-amber-200 hover:shadow-xl transition-all relative overflow-hidden">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                      <Sparkles size={20} />
                    </div>
                    {!customerId && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(pkg)} className="p-2 text-gray-300 hover:text-[#1A1F3D]"><Edit3 size={16}/></button>
                        <button onClick={() => deleteCreditPackage(pkg.id)} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                      </div>
                    )}
                  </div>
                  
                  <h4 className="font-black text-[#1A1F3D] text-lg mb-1">{pkg.name}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mb-6">Receive {currency}{pkg.creditValue.toLocaleString()} Credits</p>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase">One-time Price</p>
                      <p className="text-xl font-black text-[#1A1F3D]">{currency}{pkg.price.toLocaleString()}</p>
                    </div>
                    {customerId && (
                      <button 
                        onClick={() => handleBuy(pkg.id)}
                        className="bg-amber-500 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                      >
                        Buy Now
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {!customerId && (
                <button 
                  onClick={() => setIsCreating(true)}
                  className="border-2 border-dashed border-gray-100 rounded-[32px] p-8 flex flex-col items-center justify-center text-gray-300 hover:text-[#1A1F3D] hover:bg-gray-50 transition-all"
                >
                  <Plus size={24} className="mb-2" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Add Credit Deal</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreditPackageModal;