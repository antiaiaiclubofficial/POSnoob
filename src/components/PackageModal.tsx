"use client";

import React, { useState, useEffect } from 'react';
import { X, Package, Plus, Trash2, Edit3, CheckCircle2, Star, Gift, AlertCircle } from 'lucide-react';
import { useStore, PackageTemplate } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PackageModalProps {
  onClose: () => void;
  customerId?: string; 
}

const PackageModal = ({ onClose, customerId }: PackageModalProps) => {
  const { services, packageTemplates, addPackageTemplate, updatePackageTemplate, deletePackageTemplate, assignPackageToCustomer, currency, language } = useStore();
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<PackageTemplate, 'id'>>({
    name: '',
    serviceId: services[0]?.id || '',
    paidSlots: 8,
    freeSlots: 2,
    price: 0,
    validDays: 365, // Added missing property
    recurringFreebie: '',
    oneTimeFreebie: ''
  });

  const handleSave = () => {
    if (!formData.name || !formData.serviceId) {
      toast.error("Please fill in package name and select a service");
      return;
    }

    if (editingId) {
      updatePackageTemplate(editingId, formData);
      toast.success("Package template updated");
    } else {
      addPackageTemplate(formData);
      toast.success("Package template created");
    }
    setIsCreating(false);
    setEditingId(null);
    setFormData({
      name: '',
      serviceId: services[0]?.id || '',
      paidSlots: 8,
      freeSlots: 2,
      price: 0,
      validDays: 365,
      recurringFreebie: '',
      oneTimeFreebie: ''
    });
  };

  const handleEdit = (pkg: PackageTemplate) => {
    setEditingId(pkg.id);
    setFormData({
      name: pkg.name,
      serviceId: pkg.serviceId,
      paidSlots: pkg.paidSlots,
      freeSlots: pkg.freeSlots,
      price: pkg.price,
      validDays: pkg.validDays || 365,
      recurringFreebie: pkg.recurringFreebie || '',
      oneTimeFreebie: pkg.oneTimeFreebie || ''
    });
    setIsCreating(true);
  };

  const handleAssign = (templateId: string) => {
    if (customerId) {
      assignPackageToCustomer(customerId, templateId);
      toast.success("Package assigned to customer successfully");
      onClose();
    }
  };

  const handleUpdateRecurring = (val: string) => {
    setFormData({ 
      ...formData, 
      recurringFreebie: val,
      oneTimeFreebie: val ? '' : formData.oneTimeFreebie 
    });
  };

  const handleUpdateOneTime = (val: string) => {
    setFormData({ 
      ...formData, 
      oneTimeFreebie: val,
      recurringFreebie: val ? '' : formData.recurringFreebie 
    });
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[150] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center">
              <Package size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1A1F3D]">
                {customerId ? "Assign Package" : "Package Management"}
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
          {isCreating ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400">Package Name</label>
                  <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400">Price</label>
                  <input type="number" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400">Validity (Days)</label>
                  <input type="number" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" value={formData.validDays} onChange={e => setFormData({...formData, validDays: Number(e.target.value)})} />
                </div>
              </div>
              <button onClick={handleSave} className="w-full bg-[#1A1F3D] text-white py-4 rounded-2xl font-black">{editingId ? "Update" : "Create"}</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {packageTemplates.map(pkg => (
                <div key={pkg.id} className="bg-white border-2 border-gray-50 p-6 rounded-[32px] group hover:border-[#1A1F3D] transition-all">
                  <h4 className="font-black text-[#1A1F3D]">{pkg.name}</h4>
                  <div className="flex justify-between items-center mt-6">
                    <p className="text-xl font-black">{currency}{pkg.price.toLocaleString()}</p>
                    {customerId ? (
                      <button onClick={() => handleAssign(pkg.id)} className="bg-[#1A1F3D] text-[#D9ED5F] px-4 py-2 rounded-xl text-[10px] font-black uppercase">Select</button>
                    ) : (
                      <button onClick={() => deletePackageTemplate(pkg.id)} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                    )}
                  </div>
                </div>
              ))}
              <button onClick={() => setIsCreating(true)} className="border-2 border-dashed border-gray-100 rounded-[32px] p-8 flex flex-col items-center justify-center text-gray-300">
                <Plus size={24} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PackageModal;