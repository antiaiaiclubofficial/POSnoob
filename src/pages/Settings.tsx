"use client";

import React, { useState, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Store, Save, ShieldCheck, TrendingUp, Percent, Tag, DollarSign, 
  Image, Trash2, Upload, Scissors, Plus, Search, Edit3 
} from 'lucide-react';
import { useStore, TierRule, MembershipLevel, Service } from '@/store/useStore';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ServiceModal from '@/components/ServiceModal';
import { cn } from '@/lib/utils';

const Settings = () => {
  const { 
    tierRules, updateTierRules, 
    shopName, shopLogo, updateBusinessProfile,
    services, deleteService 
  } = useStore();

  const [localTierRules, setLocalTierRules] = useState<TierRule[]>(tierRules);
  const [localShopName, setLocalShopName] = useState(shopName);
  const [localShopLogo, setLocalShopLogo] = useState<string | null>(shopLogo);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Service management states
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceQuery, setServiceQuery] = useState('');

  const handleSaveBusiness = () => {
    updateTierRules(localTierRules);
    updateBusinessProfile({ 
      shopName: localShopName, 
      shopLogo: localShopLogo 
    });
    toast.success("Settings saved successfully!");
  };

  const updateRule = (level: MembershipLevel, field: keyof TierRule, value: any) => {
    setLocalTierRules(prev => prev.map(r => 
      r.level === level ? { ...r, [field]: value } : r
    ));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalShopLogo(reader.result as string);
        toast.success("Logo uploaded!");
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredServices = services.filter(s => 
    s.title.toLowerCase().includes(serviceQuery.toLowerCase()) || 
    s.category.toLowerCase().includes(serviceQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#F5F6FA] text-[#1A1F3D] overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-4xl font-black mb-1">Settings</h1>
              <p className="text-gray-400 font-medium">Manage your shop configurations and business rules</p>
            </div>
          </div>

          <Tabs defaultValue="business" className="space-y-8">
            <TabsList className="bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm w-auto inline-flex gap-1 h-auto">
              <TabsTrigger value="business" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white text-xs font-bold transition-all">
                <Store size={16} className="mr-2" /> Business
              </TabsTrigger>
              <TabsTrigger value="services" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white text-xs font-bold transition-all">
                <Scissors size={16} className="mr-2" /> Services
              </TabsTrigger>
              <TabsTrigger value="membership" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white text-xs font-bold transition-all">
                <ShieldCheck size={16} className="mr-2" /> Membership
              </TabsTrigger>
            </TabsList>

            {/* Business Profile Content */}
            <TabsContent value="business" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                      <Store size={24} />
                    </div>
                    <h2 className="text-xl font-bold">Shop Profile</h2>
                  </div>
                  <button 
                    onClick={handleSaveBusiness}
                    className="bg-[#1A1F3D] text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
                  >
                    <Save size={16} /> Save Business Profile
                  </button>
                </div>
                
                <div className="flex items-center gap-8">
                  <div className="relative group">
                    <div className="w-32 h-32 bg-[#F5F6FA] rounded-[32px] flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-200 group-hover:border-blue-400 transition-all">
                      {localShopLogo ? (
                        <img src={localShopLogo} alt="Logo Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-4">
                          <Image size={24} className="mx-auto text-gray-300 mb-2" />
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Logo</p>
                        </div>
                      )}
                    </div>
                    {localShopLogo && (
                      <button 
                        onClick={() => setLocalShopLogo(null)}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-2 right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
                    >
                      <Upload size={14} />
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleLogoUpload} 
                    />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Shop Name</label>
                      <input 
                        className="w-full bg-[#F5F6FA] border-none rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-500/20" 
                        value={localShopName}
                        onChange={(e) => setLocalShopName(e.target.value)}
                        placeholder="Enter shop name..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Contact Email</label>
                      <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-5 py-3.5 text-sm font-bold" defaultValue="hello@tactilesanctuary.com" />
                    </div>
                  </div>
                </div>
              </section>
            </TabsContent>

            {/* Service Management Content */}
            <TabsContent value="services" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                      <Scissors size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Service Management</h2>
                      <p className="text-xs text-gray-400">Configure prices and service offerings</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                      <input 
                        type="text"
                        placeholder="Search services..."
                        className="bg-[#F5F6FA] border-none pl-10 pr-4 py-2.5 rounded-xl text-xs font-bold w-48 focus:ring-2 focus:ring-[#1A1F3D]/5"
                        value={serviceQuery}
                        onChange={e => setServiceQuery(e.target.value)}
                      />
                    </div>
                    <button 
                      onClick={() => { setSelectedService(null); setIsServiceModalOpen(true); }}
                      className="bg-[#1A1F3D] text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
                    >
                      <Plus size={16} /> Add Service
                    </button>
                  </div>
                </div>

                <div className="overflow-hidden border border-gray-50 rounded-2xl">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50/50">
                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">Service</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">Pricing (Dog/Cat)</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-gray-400 tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredServices.map((svc) => (
                        <tr key={svc.id} className="group hover:bg-gray-50/30 transition-colors">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-[#F5F6FA] rounded-xl flex items-center justify-center text-[#1A1F3D]">
                                <Scissors size={18} />
                              </div>
                              <div>
                                <p className="font-bold text-sm text-[#1A1F3D]">{svc.title}</p>
                                <span className="text-[9px] font-bold text-gray-400 uppercase">{svc.category}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex gap-4">
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(svc.prices.dog).slice(0, 2).map(([sz, p]) => (
                                  <span key={sz} className="text-[9px] font-black px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded uppercase">{sz}:${p}</span>
                                ))}
                                {Object.keys(svc.prices.dog).length > 2 && <span className="text-[9px] text-gray-300 font-bold">...</span>}
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(svc.prices.cat).slice(0, 1).map(([sz, p]) => (
                                  <span key={sz} className="text-[9px] font-black px-1.5 py-0.5 bg-pink-50 text-pink-600 rounded uppercase">{sz}:${p}</span>
                                ))}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => { setSelectedService(svc); setIsServiceModalOpen(true); }}
                                className="p-2 text-gray-400 hover:text-[#1A1F3D] transition-colors"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button 
                                onClick={() => deleteService(svc.id)}
                                className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </TabsContent>

            {/* Membership Rules Content */}
            <TabsContent value="membership" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Membership Tier Rules</h2>
                      <p className="text-xs text-gray-400">Configure promotion thresholds and benefits</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleSaveBusiness}
                    className="bg-[#1A1F3D] text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
                  >
                    <Save size={16} /> Save Membership Rules
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {localTierRules.map((rule) => (
                    <div key={rule.level} className="p-6 bg-[#F5F6FA] rounded-2xl border border-transparent hover:border-purple-200 transition-all group space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 opacity-60">{rule.level} Tier</span>
                        <TrendingUp size={16} className="text-purple-300" />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1">
                          <Tag size={10} /> Tier Label
                        </label>
                        <input 
                          type="text"
                          className="w-full bg-white border-none rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm focus:ring-2 focus:ring-purple-500/20" 
                          value={rule.label}
                          onChange={(e) => updateRule(rule.level, 'label', e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1">
                            <DollarSign size={10} /> Min. Spent ($)
                          </label>
                          <input 
                            type="number"
                            className="w-full bg-white border-none rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50" 
                            value={rule.minSpent}
                            onChange={(e) => updateRule(rule.level, 'minSpent', Number(e.target.value))}
                            disabled={rule.level === 'Standard'}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1">
                            <Percent size={10} /> Discount (%)
                          </label>
                          <input 
                            type="number"
                            className="w-full bg-white border-none rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm focus:ring-2 focus:ring-purple-500/20" 
                            value={rule.discount}
                            onChange={(e) => updateRule(rule.level, 'discount', Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {isServiceModalOpen && (
        <ServiceModal 
          service={selectedService} 
          onClose={() => setIsServiceModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default Settings;