"use client";

import React, { useState, useEffect } from 'react';
import { X, Package, Plus, Trash2, Edit3, CheckCircle2, Star, Gift, AlertCircle } from 'lucide-react';
import { useStore, PackageTemplate } from '@/store/useStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PackageModalProps {
  onClose: () => void;
  customerId?: string; // If provided, we are assigning a package to this customer
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

  // Mutually exclusive logic: update one and clear the other
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
            <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Package size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1A1F3D]">
                {customerId ? "Assign Package" : "Package Management"}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                {customerId ? "Select a bundle for this client" : "Create and manage your service bundles"}
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
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Package Name</label>
                  <input 
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold"
                    placeholder="e.g. Package 8 Free 2"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Target Service</label>
                  <select 
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold appearance-none"
                    value={formData.serviceId}
                    onChange={e => setFormData({...formData, serviceId: e.target.value})}
                  >
                    {services.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Total Price</label>
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
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Paid Sessions</label>
                  <input 
                    type="number"
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold"
                    value={formData.paidSlots}
                    onChange={e => setFormData({...formData, paidSlots: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Free Sessions</label>
                  <input 
                    type="number"
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold"
                    value={formData.freeSlots}
                    onChange={e => setFormData({...formData, freeSlots: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="p-6 bg-indigo-50/50 rounded-[32px] space-y-4 border border-indigo-100">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Bonus Service (Select one)</p>
                  <AlertCircle size={14} className="text-indigo-300" />
                </div>
                
                <div className="space-y-4">
                  <div className={cn("transition-opacity", formData.oneTimeFreebie && "opacity-50")}>
                    <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Recurring Bonus (Every visit)</label>
                    <div className="relative">
                      <Star className={cn("absolute left-3 top-1/2 -translate-y-1/2", formData.recurringFreebie ? "text-green-500" : "text-gray-300")} size={14} />
                      <input 
                        className="w-full bg-white border-none rounded-xl pl-10 pr-4 py-3 text-xs font-bold shadow-sm focus:ring-2 focus:ring-indigo-500/10"
                        placeholder="e.g. Free Tooth Brushing"
                        disabled={!!formData.oneTimeFreebie}
                        value={formData.recurringFreebie}
                        onChange={e => handleUpdateRecurring(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-indigo-100" />
                    <span className="text-[8px] font-black text-indigo-200 uppercase">OR</span>
                    <div className="h-px flex-1 bg-indigo-100" />
                  </div>

                  <div className={cn("transition-opacity", formData.recurringFreebie && "opacity-50")}>
                    <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">One-time Special (Once per package)</label>
                    <div className="relative">
                      <Gift className={cn("absolute left-3 top-1/2 -translate-y-1/2", formData.oneTimeFreebie ? "text-amber-500" : "text-gray-300")} size={14} />
                      <input 
                        className="w-full bg-white border-none rounded-xl pl-10 pr-4 py-3 text-xs font-bold shadow-sm focus:ring-2 focus:ring-indigo-500/10"
                        placeholder="e.g. Free Mud Spa 1 time"
                        disabled={!!formData.recurringFreebie}
                        value={formData.oneTimeFreebie}
                        onChange={e => handleUpdateOneTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-4 text-sm font-black text-gray-400"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 bg-[#1A1F3D] text-white py-4 rounded-2xl font-black shadow-xl"
                >
                  {editingId ? "Update Template" : "Create Template"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {packageTemplates.map(pkg => {
                const targetService = services.find(s => s.id === pkg.serviceId);
                return (
                  <div key={pkg.id} className="bg-white border border-gray-100 p-6 rounded-[32px] flex items-center justify-between group hover:shadow-lg transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center">
                        <Package size={20} />
                      </div>
                      <div>
                        <h4 className="font-black text-[#1A1F3D]">{pkg.name}</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">
                          {targetService?.title} • {pkg.paidSlots}+{pkg.freeSlots} Sessions
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[9px] font-black text-gray-400 uppercase">Total Price</p>
                        <p className="text-lg font-black text-[#1A1F3D]">{currency}{pkg.price.toLocaleString()}</p>
                      </div>
                      
                      {customerId ? (
                        <button 
                          onClick={() => handleAssign(pkg.id)}
                          className="bg-[#1A1F3D] text-[#D9ED5F] px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-[#1A1F3D]/10"
                        >
                          Select
                        </button>
                      ) : (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(pkg)} className="p-2 text-gray-300 hover:text-[#1A1F3D]"><Edit3 size={16}/></button>
                          <button onClick={() => deletePackageTemplate(pkg.id)} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {!customerId && (
                <button 
                  onClick={() => setIsCreating(true)}
                  className="w-full border-2 border-dashed border-gray-100 rounded-[32px] py-10 flex flex-col items-center justify-center text-gray-300 hover:text-[#1A1F3D] hover:bg-gray-50 transition-all"
                >
                  <Plus size={24} className="mb-2" />
                  <span className="text-xs font-black uppercase tracking-widest">Create New Bundle Template</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PackageModal;