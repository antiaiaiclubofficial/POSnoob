"use client";

import React, { useState, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Store, Save, ShieldCheck, Image, Trash2, Upload, Scissors, Plus, Search, Edit3, Dog, Cat, Clock, Star, Crown, Gem, Award, Percent, Bath, Sparkles, MapPin, Phone, MessageSquare, Receipt,
  Wind, Stethoscope, Brush, Home, Heart, Bone, Zap
} from 'lucide-react';
import { useStore, TierRule, MembershipLevel, Service, ServiceIcon } from '@/store/useStore';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ServiceModal from '@/components/ServiceModal';
import SlotPicker from '@/components/SlotPicker';
import TimePicker from '@/components/TimePicker';
import { cn } from '@/lib/utils';
import { Switch } from "@/components/ui/switch";

const Settings = () => {
  const { 
    tierRules, updateTierRules, 
    shopName, shopLogo, shopAddress, shopPhone, shopLineId, receiptHeader, currency,
    updateBusinessProfile,
    services, deleteService, toggleServiceActive,
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
  const [speciesTab, setSpeciesTab] = useState<'Dog' | 'Cat'>('Dog');

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

  const getIcon = (iconName: ServiceIcon, species: string) => {
    const isDog = species === 'Dog';
    const colorClass = isDog ? "text-blue-600" : "text-pink-600";
    
    switch(iconName) {
      case 'grooming': return <Scissors className={colorClass} size={24} />;
      case 'bath': return <Bath className={colorClass} size={24} />;
      case 'spa': return <Sparkles className={colorClass} size={24} />;
      case 'nail': return <Zap className={colorClass} size={24} />;
      case 'dry': return <Wind className={colorClass} size={24} />;
      case 'brush': return <Brush className={colorClass} size={24} />;
      case 'health': return <Stethoscope className={colorClass} size={24} />;
      case 'hotel': return <Home className={colorClass} size={24} />;
      case 'love': return <Heart className={colorClass} size={24} />;
      case 'food': return <Bone className={colorClass} size={24} />;
      case 'premium': return <Award className={colorClass} size={24} />;
      default: return isDog ? <Dog className={colorClass} size={24} /> : <Cat className={colorClass} size={24} />;
    }
  };

  const ServiceCatalogView = () => {
    const filtered = services.filter(s => 
      s.targetSpecies === speciesTab && 
      (s.title.toLowerCase().includes(serviceQuery.toLowerCase()) || 
       s.category.toLowerCase().includes(serviceQuery.toLowerCase()))
    );

    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-[#1A1F3D]">Service Catalog</h2>
            <p className="text-sm text-gray-400 font-medium">Manage your professional grooming services and pricing models.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-[#E9EBF1] p-1 rounded-full flex gap-1">
              <button 
                onClick={() => setSpeciesTab('Dog')}
                className={cn(
                  "px-5 py-2 rounded-full text-[10px] font-black flex items-center gap-2 transition-all",
                  speciesTab === 'Dog' ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400 hover:text-gray-600"
                )}
              >
                <Dog size={14} /> DOG SERVICES
              </button>
              <button 
                onClick={() => setSpeciesTab('Cat')}
                className={cn(
                  "px-5 py-2 rounded-full text-[10px] font-black flex items-center gap-2 transition-all",
                  speciesTab === 'Cat' ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400 hover:text-gray-600"
                )}
              >
                <Cat size={14} /> CAT SERVICES
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {filtered.map((svc) => (
            <div 
              key={svc.id} 
              className={cn(
                "bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 flex flex-col transition-all hover:shadow-xl",
                !svc.isActive && "opacity-60 grayscale-[0.5]"
              )}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-3xl flex items-center justify-center",
                    svc.targetSpecies === 'Dog' ? "bg-blue-50" : "bg-pink-50"
                  )}>
                    {getIcon(svc.icon, svc.targetSpecies)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-black text-[#1A1F3D]">{svc.title}</h3>
                      {svc.isPopular && (
                        <span className="bg-[#D9ED5F] text-[#1A1F3D] text-[8px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider">Popular</span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed max-w-[240px]">{svc.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Switch 
                    checked={svc.isActive} 
                    onCheckedChange={() => toggleServiceActive(svc.id)}
                    className="data-[state=checked]:bg-[#1A1F3D]"
                  />
                  <button 
                    onClick={() => { setSelectedService(svc); setIsServiceModalOpen(true); }}
                    className="p-2 text-gray-400 hover:text-[#1A1F3D] transition-colors"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button 
                    onClick={() => deleteService(svc.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="mt-auto">
                <div className="bg-[#1A1F3D] rounded-t-2xl px-6 py-2 flex justify-between">
                  <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Pet Size</span>
                  <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Price ({currency})</span>
                </div>
                <div className="bg-[#F8F9FD] rounded-b-2xl border-x border-b border-gray-100 divide-y divide-gray-100">
                  {Object.entries(svc.prices).map(([size, info]) => (
                    <div key={size} className="px-6 py-3.5 flex justify-between items-center">
                      <span className="text-[11px] font-bold text-gray-600">{size}</span>
                      <span className="text-xs font-black text-[#1A1F3D]">{currency}{info.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <button 
            onClick={() => { setSelectedService(null); setIsServiceModalOpen(true); }}
            className="bg-transparent border-2 border-dashed border-gray-200 rounded-[40px] flex flex-col items-center justify-center py-16 group hover:bg-white hover:border-[#1A1F3D]/20 transition-all cursor-pointer"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus size={24} className="text-gray-400" />
            </div>
            <h4 className="text-lg font-black text-[#1A1F3D] mb-1">Add New Service</h4>
            <p className="text-xs text-gray-400">Configure a new grooming or spa package</p>
          </button>
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

            <TabsContent value="business" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Shop Info */}
                <section className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                      <Store size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Shop Information</h2>
                      <p className="text-xs text-gray-400">Basic details for your business</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider ml-2 flex items-center gap-2">
                        <Store size={12} /> Shop Name
                      </label>
                      <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" value={localShopName} onChange={(e) => setLocalShopName(e.target.value)} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider ml-2 flex items-center gap-2">
                          <Phone size={12} /> Phone Number
                        </label>
                        <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" value={localShopPhone} onChange={(e) => setLocalShopPhone(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider ml-2 flex items-center gap-2">
                          <MessageSquare size={12} /> Line ID
                        </label>
                        <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" value={localShopLineId} onChange={(e) => setLocalShopLineId(e.target.value)} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider ml-2 flex items-center gap-2">
                        Currency Symbol
                      </label>
                      <select className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold appearance-none" value={localCurrency} onChange={(e) => setLocalCurrency(e.target.value)}>
                        <option value="฿">THB (฿)</option>
                        <option value="$">USD ($)</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Right Column: Logo & Address */}
                <section className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
                  <div className="flex flex-col items-center mb-4">
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

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider ml-2 flex items-center gap-2">
                        <MapPin size={12} /> Shop Address
                      </label>
                      <textarea className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold h-24 resize-none" value={localShopAddress} onChange={(e) => setLocalShopAddress(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider ml-2 flex items-center gap-2">
                        <Receipt size={12} /> Receipt Header
                      </label>
                      <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" value={localReceiptHeader} onChange={(e) => setLocalReceiptHeader(e.target.value)} />
                    </div>
                  </div>
                </section>
              </div>
            </TabsContent>

            <TabsContent value="booking" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Booking Settings */}
                <section className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl"><Clock size={24} /></div>
                    <div>
                      <h2 className="text-xl font-bold">Booking Rules</h2>
                      <p className="text-xs text-gray-400">Configure how clients book appointments</p>
                    </div>
                  </div>
                  
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Slot Duration</label>
                      <div className="flex gap-2">
                        {[30, 60].map(duration => (
                          <button key={duration} onClick={() => setLocalSlotDuration(duration)} className={cn("flex-1 py-4 rounded-2xl border-2 font-bold transition-all", localSlotDuration === duration ? "bg-[#1A1F3D] border-[#1A1F3D] text-white" : "bg-white border-gray-100 text-gray-400")}>{duration} Min</button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Max Capacity per Slot</label>
                      <input type="number" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" value={localMaxCapacity} onChange={e => setLocalMaxCapacity(Number(e.target.value))} />
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Opening Time</label>
                        <TimePicker value={localOpenTime} onChange={setLocalOpenTime} />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Closing Time</label>
                        <TimePicker value={localCloseTime} onChange={setLocalCloseTime} />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Right Column: Slot Preview */}
                <section className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
                  <SlotPicker selectedTime="" onSelect={() => {}} />
                </section>
              </div>
            </TabsContent>

            <TabsContent value="services" className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-12">
               <div className="flex justify-end mb-4">
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

               <ServiceCatalogView />
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
        <ServiceModal 
          service={selectedService} 
          defaultSpecies={speciesTab}
          onClose={() => setIsServiceModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default Settings;