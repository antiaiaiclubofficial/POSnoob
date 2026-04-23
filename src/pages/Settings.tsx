"use client";

import React, { useState, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Store, Save, ShieldCheck, Image, Trash2, Upload, Scissors, Plus, Search, Edit3, Dog, Cat, Clock, Star, Crown, Gem, Award, Percent
} from 'lucide-react';
import { useStore, TierRule, MembershipLevel, Service } from '@/store/useStore';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ServiceModal from '@/components/ServiceModal';
import SlotPicker from '@/components/SlotPicker';
import TimePicker from '@/components/TimePicker';
import { cn } from '@/lib/utils';

const Settings = () => {
  const { 
    tierRules, updateTierRules, 
    shopName, shopLogo, shopAddress, shopPhone, shopLineId, receiptHeader, currency,
    updateBusinessProfile,
    services, deleteService,
    slotDuration, openTime, closeTime, maxCapacity, updateBookingSettings
  } = useStore();

  const [localTierRules, setLocalTierRules] = useState<TierRule[]>(tierRules);
  const [localShopName, setLocalShopName] = useState(shopName);
  const [localShopLogo, setLocalShopLogo] = useState<string | null>(shopLogo);
  const [localShopAddress, setLocalShopAddress] = useState(shopAddress);
  const [localShopPhone, setLocalShopPhone] = useState(shopPhone);
  const [localShopLineId, setLocalShopLineId] = useState(shopLineId);
  const [localReceiptHeader, setLocalReceiptHeader] = useState(receiptHeader);
  const [localCurrency, setLocalCurrency] = useState(currency);
  
  const [localSlotDuration, setLocalSlotDuration] = useState(slotDuration);
  const [localMaxCapacity, setLocalMaxCapacity] = useState(maxCapacity);
  const [localOpenTime, setLocalOpenTime] = useState(openTime);
  const [localCloseTime, setLocalCloseTime] = useState(closeTime);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceQuery, setServiceQuery] = useState('');

  const handleSaveAll = () => {
    updateTierRules(localTierRules);
    updateBusinessProfile({ 
      shopName: localShopName, 
      shopLogo: localShopLogo,
      shopAddress: localShopAddress,
      shopPhone: localShopPhone,
      shopLineId: localShopLineId,
      receiptHeader: localReceiptHeader,
      currency: localCurrency
    });
    updateBookingSettings({
      slotDuration: localSlotDuration,
      maxCapacity: localMaxCapacity,
      openTime: localOpenTime,
      closeTime: localCloseTime
    });
    toast.success("All settings saved successfully!");
  };

  const updateRule = (level: MembershipLevel, field: keyof TierRule, value: any) => {
    setLocalTierRules(prev => prev.map(r => 
      r.level === level ? { ...r, [field]: value } : r
    ));
  };

  const getTierIcon = (level: MembershipLevel) => {
    switch(level) {
      case 'Standard': return { icon: Star, color: 'text-gray-400', bg: 'bg-gray-50' };
      case 'Silver': return { icon: Award, color: 'text-blue-400', bg: 'bg-blue-50' };
      case 'Gold': return { icon: Crown, color: 'text-amber-400', bg: 'bg-amber-50' };
      case 'VIP': return { icon: Gem, color: 'text-purple-400', bg: 'bg-purple-50' };
    }
  };

  const ServiceTable = ({ species }: { species: 'Dog' | 'Cat' }) => {
    const isDog = species === 'Dog';
    const filtered = services.filter(s => 
      s.targetSpecies === species && 
      (s.title.toLowerCase().includes(serviceQuery.toLowerCase()) || 
       s.category.toLowerCase().includes(serviceQuery.toLowerCase()))
    );

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center px-4">
          <div className="flex items-center gap-3">
            <div className={cn("w-3 h-3 rounded-full animate-pulse", isDog ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]")} />
            <h3 className="text-sm font-black text-[#1A1F3D] uppercase tracking-[0.2em]">{species} Service Pricing</h3>
          </div>
          <button 
            onClick={() => { setSelectedService(null); setIsServiceModalOpen(true); }}
            className={cn(
              "px-5 py-2.5 rounded-2xl text-[10px] font-black text-white flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg",
              isDog ? "bg-blue-600 shadow-blue-600/20" : "bg-pink-600 shadow-pink-600/20"
            )}
          >
            <Plus size={14} /> Add {species} Service
          </button>
        </div>

        <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-10 py-6 text-left text-[10px] font-black uppercase text-gray-400 tracking-[0.15em] w-1/3">Service Identity</th>
                  <th className="px-10 py-6 text-left text-[10px] font-black uppercase text-gray-400 tracking-[0.15em]">Pricing Matrix</th>
                  <th className="px-10 py-6 text-right text-[10px] font-black uppercase text-gray-400 tracking-[0.15em] w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((svc) => (
                  <tr key={svc.id} className="group hover:bg-[#F8F9FD]/50 transition-all">
                    {/* Part 1: Identity */}
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                          isDog ? "bg-blue-50 text-blue-600" : "bg-pink-50 text-pink-600"
                        )}>
                          <Scissors size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-base text-[#1A1F3D] mb-1 truncate">{svc.title}</p>
                          <span className="inline-block bg-[#F1F3F9] text-[9px] font-black text-gray-400 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                            {svc.category}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Part 2: Pricing Structure (Size/Price) */}
                    <td className="px-10 py-8">
                      <div className="flex flex-wrap gap-2.5">
                        {Object.entries(svc.prices).map(([sz, p]) => (
                          <div key={sz} className="flex items-center overflow-hidden rounded-2xl border border-gray-100 shadow-sm bg-white hover:border-[#1A1F3D]/20 transition-all">
                            <div className={cn(
                              "px-3 py-2 text-[9px] font-black uppercase tracking-tighter",
                              isDog ? "bg-blue-600 text-white" : "bg-pink-600 text-white"
                            )}>
                              {sz}
                            </div>
                            <div className="px-4 py-2 bg-white flex items-center gap-1.5">
                              <span className="text-[10px] font-black text-gray-300">{currency}</span>
                              <span className="text-sm font-black text-[#1A1F3D]">{p.price.toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Part 3: Actions */}
                    <td className="px-10 py-8 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { setSelectedService(svc); setIsServiceModalOpen(true); }} 
                          className="p-3 bg-gray-50 text-gray-400 hover:bg-[#1A1F3D] hover:text-white rounded-xl transition-all"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={() => deleteService(svc.id)} 
                          className="p-3 bg-gray-50 text-gray-400 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-10 py-16 text-center text-gray-300 font-bold italic text-sm">
                      No matching services found in the catalog.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#F5F6FA] text-[#1A1F3D] overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-10 overflow-y-auto scrollbar-hide">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-4xl font-black mb-1">Settings</h1>
              <p className="text-gray-400 font-medium">Manage your shop configurations and business rules</p>
            </div>
            <button 
              onClick={handleSaveAll}
              className="bg-[#1A1F3D] text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-[#2A3152] transition-all shadow-xl shadow-[#1A1F3D]/10 active:scale-95"
            >
              <Save size={18} /> Save All Changes
            </button>
          </div>

          <Tabs defaultValue="business" className="space-y-8">
            <TabsList className="bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm w-auto inline-flex gap-1 h-auto">
              <TabsTrigger value="business" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white text-xs font-bold transition-all">
                <Store size={16} className="mr-2" /> Business
              </TabsTrigger>
              <TabsTrigger value="booking" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white text-xs font-bold transition-all">
                <Clock size={16} className="mr-2" /> Booking
              </TabsTrigger>
              <TabsTrigger value="services" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white text-xs font-bold transition-all">
                <Scissors size={16} className="mr-2" /> Services
              </TabsTrigger>
              <TabsTrigger value="membership" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white text-xs font-bold transition-all">
                <ShieldCheck size={16} className="mr-2" /> Membership
              </TabsTrigger>
            </TabsList>

            <TabsContent value="business" className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
              <section className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-10">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <Store size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Business Profile</h2>
                    <p className="text-xs text-gray-400">Basic identification for your shop</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                  <div className="md:col-span-3 flex flex-col items-center">
                    <div className="relative group">
                      <div className="w-40 h-40 bg-[#F5F6FA] rounded-[40px] flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-200 group-hover:border-blue-400 transition-all">
                        {localShopLogo ? (
                          <img src={localShopLogo} alt="Logo Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center p-4">
                            <Image size={32} className="mx-auto text-gray-300 mb-2" />
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Shop Logo</p>
                          </div>
                        )}
                      </div>
                      <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 right-2 w-10 h-10 bg-[#1A1F3D] text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-all">
                        <Upload size={18} />
                      </button>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setLocalShopLogo(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </div>
                  </div>
                  <div className="md:col-span-9 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider ml-2">Shop Name</label>
                        <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" value={localShopName} onChange={(e) => setLocalShopName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider ml-2">Currency Symbol</label>
                        <select className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold appearance-none" value={localCurrency} onChange={(e) => setLocalCurrency(e.target.value)}>
                          <option value="฿">THB (฿)</option>
                          <option value="$">USD ($)</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider ml-2">Address</label>
                      <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" value={localShopAddress} onChange={(e) => setLocalShopAddress(e.target.value)} />
                    </div>
                  </div>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="services" className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-12">
               <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-2xl font-black">Service Catalog</h2>
                    <p className="text-sm text-gray-400">Define your treatments and pricing matrix</p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                    <input 
                      type="text"
                      className="bg-white border border-gray-100 pl-10 pr-6 py-3 rounded-[20px] text-xs font-bold w-64 shadow-sm focus:ring-2 focus:ring-[#1A1F3D]/5"
                      placeholder="Search services..."
                      value={serviceQuery}
                      onChange={e => setServiceQuery(e.target.value)}
                    />
                  </div>
               </div>

               <ServiceTable species="Dog" />
               <ServiceTable species="Cat" />
            </TabsContent>

            <TabsContent value="booking" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
               <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <section className="xl:col-span-2 bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl"><Clock size={24} /></div>
                    <h2 className="text-xl font-bold">Booking Configuration</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Slot Duration</label>
                      <div className="flex gap-2">
                        {[30, 60].map(duration => (
                          <button key={duration} onClick={() => setLocalSlotDuration(duration)} className={cn("flex-1 py-4 rounded-2xl border-2 font-bold transition-all", localSlotDuration === duration ? "bg-[#1A1F3D] border-[#1A1F3D] text-white" : "bg-white border-gray-100 text-gray-400")}>{duration} Min</button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Max Capacity</label>
                      <input type="number" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" value={localMaxCapacity} onChange={e => setLocalMaxCapacity(Number(e.target.value))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <TimePicker value={localOpenTime} onChange={setLocalOpenTime} />
                    <TimePicker value={localCloseTime} onChange={setLocalCloseTime} />
                  </div>
                </section>
                <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                  <SlotPicker selectedTime="" onSelect={() => {}} />
                </section>
              </div>
            </TabsContent>

            <TabsContent value="membership" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
               <section className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-10">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Membership Tier Logic</h2>
                    <p className="text-xs text-gray-400">Define rewards and progression rules for your clients</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {localTierRules.map((rule) => {
                    const tier = getTierIcon(rule.level);
                    const Icon = tier.icon;
                    return (
                      <div key={rule.level} className="relative group bg-[#F5F6FA] p-8 rounded-[32px] border border-transparent hover:border-purple-100 transition-all">
                        <div className={cn("absolute -top-4 -left-4 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg", tier.bg, tier.color)}>
                          <Icon size={24} />
                        </div>
                        
                        <div className="space-y-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Public Label</label>
                              <input 
                                className="w-full bg-white border-none rounded-2xl px-5 py-3 text-sm font-black text-[#1A1F3D] focus:ring-2 focus:ring-purple-500/10" 
                                value={rule.label} 
                                onChange={(e) => updateRule(rule.level, 'label', e.target.value)} 
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Min. Spending</label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-xs font-bold">{currency}</span>
                                <input 
                                  type="number"
                                  className="w-full bg-white border-none rounded-2xl pl-10 pr-4 py-3 text-sm font-bold text-[#1A1F3D]" 
                                  value={rule.minSpent} 
                                  onChange={(e) => updateRule(rule.level, 'minSpent', Number(e.target.value))} 
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">Benefit Discount</label>
                              <div className="relative">
                                <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                                <input 
                                  type="number"
                                  className="w-full bg-white border-none rounded-2xl pl-10 pr-4 py-3 text-sm font-bold text-green-600" 
                                  value={rule.discount} 
                                  onChange={(e) => updateRule(rule.level, 'discount', Number(e.target.value))} 
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {isServiceModalOpen && (
        <ServiceModal service={selectedService} onClose={() => setIsServiceModalOpen(false)} />
      )}
    </div>
  );
};

export default Settings;