"use client";

import React, { useState } from 'react';
import { 
  Store, Save, ShieldCheck, Trash2, Scissors, Plus, Search, Edit3, Dog, Cat, Clock, Star, Crown, Gem, Award, Percent, Phone, MessageSquare, Calendar, Share2, Send
} from 'lucide-react';
import { useStore, TierRule, MembershipLevel, Service } from '@/store/useStore';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ServiceModal from '@/components/ServiceModal';
import SlotPicker from '@/components/SlotPicker';
import TimePicker from '@/components/TimePicker';
import BroadcastModal from '@/components/BroadcastModal';
import { cn } from '@/lib/utils';
import { Switch } from "@/components/ui/switch";
import { DayPicker } from 'react-day-picker';
import { format, parseISO, isValid } from 'date-fns';

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
    shopName, shopAddress, shopPhone, shopLineId, currency, shopIsOpen, recurringHolidays, specificHolidays,
    updateBusinessProfile,
    services, deleteService, toggleServiceActive,
    slotDuration, openTime, closeTime, maxCapacity, updateBookingSettings
  } = useStore();

  const [localTierRules, setLocalTierRules] = useState<TierRule[]>(tierRules);
  const [localShopName, setLocalShopName] = useState(shopName);
  const [localShopAddress, setLocalShopAddress] = useState(shopAddress);
  const [localShopPhone, setLocalShopPhone] = useState(shopPhone);
  const [localShopLineId, setLocalShopLineId] = useState(shopLineId);
  const [localCurrency, setLocalCurrency] = useState(currency);
  const [localShopIsOpen, setLocalShopIsOpen] = useState(shopIsOpen);
  const [localRecurringHolidays, setLocalRecurringHolidays] = useState<number[]>(recurringHolidays);
  const [localSpecificHolidays, setLocalSpecificHolidays] = useState<string[]>(specificHolidays);

  const [localSlotDuration, setLocalSlotDuration] = useState(slotDuration);
  const [localMaxCapacity, setLocalMaxCapacity] = useState(maxCapacity);
  const [localOpenTime, setLocalOpenTime] = useState(openTime);
  const [localCloseTime, setLocalCloseTime] = useState(closeTime);

  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [speciesTab, setSpeciesTab] = useState<'Dog' | 'Cat'>('Dog');

  const handleSaveAll = () => {
    updateTierRules(localTierRules);
    updateBusinessProfile({ 
      shopName: localShopName, 
      shopAddress: localShopAddress,
      shopPhone: localShopPhone,
      shopLineId: localShopLineId,
      currency: localCurrency,
      shopIsOpen: localShopIsOpen,
      recurringHolidays: localRecurringHolidays,
      specificHolidays: localSpecificHolidays
    });
    updateBookingSettings({
      slotDuration: localSlotDuration,
      maxCapacity: localMaxCapacity,
      openTime: localOpenTime,
      closeTime: localCloseTime
    });
    toast.success("Settings Saved");
  };

  const toggleHoliday = (dayValue: number) => {
    setLocalRecurringHolidays(prev => 
      prev.includes(dayValue) ? prev.filter(d => d !== dayValue) : [...prev, dayValue]
    );
  };

  return (
    <main className="flex-1 p-6 lg:p-10 overflow-y-auto scrollbar-hide bg-[#F8F9FD]">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="pl-14 lg:pl-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-2xl lg:text-4xl font-black mb-1">Settings</h1>
            <p className="text-[10px] lg:text-sm text-gray-400 font-bold uppercase tracking-widest">Business Config</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={() => setIsBroadcastModalOpen(true)} className="flex-1 sm:flex-none bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <Send size={18} className="text-green-500" />
            </button>
            <button onClick={handleSaveAll} className="flex-[3] sm:flex-none bg-[#1A1F3D] text-white px-8 py-4 rounded-2xl font-black text-xs shadow-xl active:scale-95">
              <Save size={18} className="inline mr-2" /> Save All
            </button>
          </div>
        </header>

        <Tabs defaultValue="business" className="space-y-6 lg:space-y-8">
          <div className="overflow-x-auto scrollbar-hide -mx-6 px-6">
            <TabsList className="bg-white p-1 rounded-2xl border border-gray-100 shadow-sm flex min-w-max">
              <TabsTrigger value="business" className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase">Business</TabsTrigger>
              <TabsTrigger value="booking" className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase">Booking</TabsTrigger>
              <TabsTrigger value="services" className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase">Services</TabsTrigger>
              <TabsTrigger value="membership" className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase">Tiers</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="business" className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <section className="bg-white p-6 lg:p-10 rounded-[32px] lg:rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Store size={20} /></div>
                    <h2 className="font-black text-sm lg:text-lg">Shop Basic</h2>
                  </div>
                  <Switch checked={localShopIsOpen} onCheckedChange={setLocalShopIsOpen} />
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-gray-400 px-2">Shop Name</label>
                    <input className="w-full bg-[#F5F6FA] rounded-2xl px-5 py-3.5 text-xs font-bold" value={localShopName} onChange={e => setLocalShopName(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-gray-400 px-2">Address</label>
                    <input className="w-full bg-[#F5F6FA] rounded-2xl px-5 py-3.5 text-xs font-bold" value={localShopAddress} onChange={e => setLocalShopAddress(e.target.value)} />
                  </div>
                </div>
              </section>

              <section className="bg-white p-6 lg:p-10 rounded-[32px] lg:rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-50 text-red-600 rounded-2xl"><Calendar size={20} /></div>
                  <h2 className="font-black text-sm lg:text-lg">Weekly Holidays</h2>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {DAYS_OF_WEEK.map(day => (
                    <button 
                      key={day.value}
                      onClick={() => toggleHoliday(day.value)}
                      className={cn(
                        "py-3 rounded-xl text-[9px] font-black border-2 transition-all",
                        localRecurringHolidays.includes(day.value) ? "bg-red-500 border-red-500 text-white" : "bg-white border-gray-50 text-gray-400"
                      )}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </TabsContent>

          <TabsContent value="booking" className="animate-in fade-in slide-in-from-bottom-2">
             <div className="bg-white p-6 lg:p-10 rounded-[32px] lg:rounded-[40px] border border-gray-100 shadow-sm space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 px-2">Opening Time</label>
                      <TimePicker value={localOpenTime} onChange={setLocalOpenTime} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 px-2">Closing Time</label>
                      <TimePicker value={localCloseTime} onChange={setLocalCloseTime} />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 px-2">Slot Duration</label>
                      <div className="flex gap-2">
                        {[30, 60].map(d => (
                          <button key={d} onClick={() => setLocalSlotDuration(d)} className={cn("flex-1 py-3 rounded-xl border-2 font-black text-xs", localSlotDuration === d ? "bg-[#1A1F3D] border-[#1A1F3D] text-white" : "bg-white text-gray-300")}>{d}m</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
             </div>
          </TabsContent>

          <TabsContent value="services" className="animate-in fade-in slide-in-from-bottom-2">
             <div className="flex gap-2 mb-6">
                <button onClick={() => setSpeciesTab('Dog')} className={cn("px-6 py-2.5 rounded-xl text-[10px] font-black", speciesTab === 'Dog' ? "bg-[#1A1F3D] text-white" : "bg-white text-gray-400")}>DOGS</button>
                <button onClick={() => setSpeciesTab('Cat')} className={cn("px-6 py-2.5 rounded-xl text-[10px] font-black", speciesTab === 'Cat' ? "bg-[#1A1F3D] text-white" : "bg-white text-gray-400")}>CATS</button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.filter(s => s.targetSpecies === speciesTab).map(s => (
                  <div key={s.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center"><Scissors size={18} /></div>
                      <span className="text-xs font-black">{s.title}</span>
                    </div>
                    <Switch checked={s.isActive} onCheckedChange={() => toggleServiceActive(s.id)} />
                  </div>
                ))}
             </div>
          </TabsContent>
        </Tabs>
      </div>

      {isBroadcastModalOpen && <BroadcastModal onClose={() => setIsBroadcastModalOpen(false)} />}
      {isServiceModalOpen && <ServiceModal service={selectedService} defaultSpecies={speciesTab} onClose={() => setIsServiceModalOpen(false)} />}
    </main>
  );
};

export default Settings;