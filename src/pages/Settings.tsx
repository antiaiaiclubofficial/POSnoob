"use client";

import React, { useState, useRef } from 'react';
import { 
  Store, Save, ShieldCheck, Image, Trash2, Upload, Scissors, Plus, Search, Edit3, Dog, Cat, Clock, Star, Crown, Gem, Award, Percent, MapPin, Phone, MessageSquare, Receipt, Calendar, AlertCircle
} from 'lucide-react';
import { useStore, TierRule, MembershipLevel, Service } from '@/store/useStore';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ServiceModal from '@/components/ServiceModal';
import SlotPicker from '@/components/SlotPicker';
import TimePicker from '@/components/TimePicker';
import { cn } from '@/lib/utils';
import { Switch } from "@/components/ui/switch";

const DAYS_OF_WEEK = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

const Settings = () => {
  const { 
    tierRules, updateTierRules, 
    shopName, shopLogo, shopAddress, shopPhone, shopLineId, receiptHeader, currency, shopIsOpen, recurringHolidays,
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
  const [localShopIsOpen, setLocalShopIsOpen] = useState(shopIsOpen);
  const [localRecurringHolidays, setLocalRecurringHolidays] = useState<number[]>(recurringHolidays);
  
  const [localSlotDuration, setLocalSlotDuration] = useState(slotDuration);
  const [localMaxCapacity, setLocalMaxCapacity] = useState(maxCapacity);
  const [localOpenTime, setLocalOpenTime] = useState(openTime);
  const [localCloseTime, setLocalCloseTime] = useState(closeTime);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceQuery, setServiceQuery] = useState('');
  const [speciesTab, setSpeciesTab] = useState<'Dog' | 'Cat'>('Dog');

  const filteredServices = services.filter(s => 
    s.targetSpecies === speciesTab && 
    s.title.toLowerCase().includes(serviceQuery.toLowerCase())
  );

  const handleSaveAll = () => {
    updateTierRules(localTierRules);
    updateBusinessProfile({ 
      shopName: localShopName, 
      shopLogo: localShopLogo,
      shopAddress: localShopAddress,
      shopPhone: localShopPhone,
      shopLineId: localShopLineId,
      receiptHeader: localReceiptHeader,
      currency: localCurrency,
      shopIsOpen: localShopIsOpen,
      recurringHolidays: localRecurringHolidays
    });
    updateBookingSettings({
      slotDuration: localSlotDuration,
      maxCapacity: localMaxCapacity,
      openTime: localOpenTime,
      closeTime: localCloseTime
    });
    toast.success("All settings saved successfully!");
  };

  const toggleHoliday = (dayValue: number) => {
    setLocalRecurringHolidays(prev => 
      prev.includes(dayValue) 
        ? prev.filter(d => d !== dayValue) 
        : [...prev, dayValue]
    );
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

  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setIsServiceModalOpen(true);
  };

  const handleAddService = () => {
    setSelectedService(null);
    setIsServiceModalOpen(true);
  };

  return (
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
              <section className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                      <Store size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Shop Management</h2>
                      <p className="text-xs text-gray-400">Current status and contact info</p>
                    </div>
                  </div>
                  <div className={cn(
                    "flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all",
                    localShopIsOpen ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"
                  )}>
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", localShopIsOpen ? "text-green-600" : "text-red-600")}>
                      {localShopIsOpen ? 'Open' : 'Closed'}
                    </span>
                    <Switch checked={localShopIsOpen} onCheckedChange={setLocalShopIsOpen} className="data-[state=checked]:bg-green-600" />
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
                </div>
              </section>

              <section className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Weekly Holidays</h2>
                    <p className="text-xs text-gray-400">Recurring days the shop is closed</p>
                  </div>
                </div>

                <div className="bg-[#F5F6FA] p-6 rounded-[32px]">
                   <div className="grid grid-cols-4 gap-3">
                      {DAYS_OF_WEEK.map((day) => {
                        const isHoliday = localRecurringHolidays.includes(day.value);
                        return (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => toggleHoliday(day.value)}
                            className={cn(
                              "py-3 rounded-xl text-[10px] font-black transition-all border-2",
                              isHoliday 
                                ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20" 
                                : "bg-white border-white text-gray-400 hover:border-gray-200"
                            )}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                   </div>
                   <div className="mt-6 flex items-center gap-3 text-orange-600 bg-orange-50 p-4 rounded-2xl border border-orange-100">
                      <AlertCircle size={16} className="shrink-0" />
                      <p className="text-[10px] font-bold leading-relaxed">
                        Clients won't be able to book appointments on these days. Selected days will be greyed out in the booking calendar.
                      </p>
                   </div>
                </div>
              </section>
            </div>
          </TabsContent>

          <TabsContent value="booking" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

              <section className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
                <SlotPicker selectedTime="" onSelect={() => {}} />
              </section>
            </div>
          </TabsContent>

          <TabsContent value="services" className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-10">
             <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm shrink-0">
                  <button 
                    onClick={() => setSpeciesTab('Dog')}
                    className={cn(
                      "px-6 py-2.5 rounded-xl text-[10px] font-black flex items-center gap-2 transition-all",
                      speciesTab === 'Dog' ? "bg-[#1A1F3D] text-white shadow-lg" : "text-gray-400"
                    )}
                  >
                    <Dog size={14} /> DOGS
                  </button>
                  <button 
                    onClick={() => setSpeciesTab('Cat')}
                    className={cn(
                      "px-6 py-2.5 rounded-xl text-[10px] font-black flex items-center gap-2 transition-all",
                      speciesTab === 'Cat' ? "bg-[#1A1F3D] text-white shadow-lg" : "text-gray-400"
                    )}
                  >
                    <Cat size={14} /> CATS
                  </button>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                    <input 
                      type="text"
                      className="bg-white border border-gray-100 pl-10 pr-6 py-3 rounded-2xl text-xs font-bold w-full shadow-sm"
                      placeholder="Search services..."
                      value={serviceQuery}
                      onChange={e => setServiceQuery(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={handleAddService}
                    className="bg-[#D9ED5F] text-[#1A1F3D] p-3 rounded-2xl shadow-lg shadow-[#D9ED5F]/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Plus size={20} />
                  </button>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredServices.map((service) => (
                  <div key={service.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between group transition-all hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                        service.targetSpecies === 'Dog' ? "bg-blue-50 text-blue-600" : "bg-pink-50 text-pink-600"
                      )}>
                        <Scissors size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-[#1A1F3D]">{service.title}</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{service.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Switch 
                        checked={service.isActive} 
                        onCheckedChange={() => toggleServiceActive(service.id)}
                        className="data-[state=checked]:bg-[#1A1F3D]"
                      />
                      <button onClick={() => handleEditService(service)} className="p-2 text-gray-300 hover:text-[#1A1F3D] transition-colors">
                        <Edit3 size={18} />
                      </button>
                      <button onClick={() => deleteService(service.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
             </div>
          </TabsContent>
        </Tabs>
      </div>

      {isServiceModalOpen && (
        <ServiceModal 
          service={selectedService} 
          defaultSpecies={speciesTab}
          onClose={() => setIsServiceModalOpen(false)} 
        />
      )}
    </main>
  );
};

export default Settings;