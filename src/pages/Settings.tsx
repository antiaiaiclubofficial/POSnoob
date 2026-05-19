"use client";

import React, { useState, useRef } from 'react';
import { 
  Store, Save, ShieldCheck, Scissors, Plus, Search, Edit3, Dog, Cat, Clock, Star, Crown, Gem, Award, Percent, Phone, MessageSquare, Calendar, AlertCircle, Share2, Send, Camera, FileText, AlignLeft, Layout, Eye, MapPin, Globe, Package, Zap, Wallet, Trash2
} from 'lucide-react';
import { useStore, TierRule, Service, AddonItem } from '@/store/useStore';
import { translations } from '@/utils/translations';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ServiceModal from '@/components/ServiceModal';
import SlotPicker from '@/components/SlotPicker';
import TimePicker from '@/components/TimePicker';
import BroadcastModal from '@/components/BroadcastModal';
import ReceiptPreview from '@/components/ReceiptPreview';
import PackageModal from '@/components/PackageModal';
import AddonSettingsModal from '@/components/AddonSettingsModal';
import CreditPackageModal from '@/components/CreditPackageModal';
import { cn } from '@/lib/utils';
import { Switch } from "@/components/ui/switch";

const Settings = () => {
  const { 
    tierRules, updateTierRules, 
    shopName, shopLogo, shopAddress, shopPhone, shopLineId, currency, shopIsOpen, recurringHolidays, specificHolidays,
    receiptHeader, receiptFooter, receiptPaperSize,
    updateBusinessProfile,
    services, toggleServiceActive, deleteService,
    addons, deleteAddon,
    packageTemplates, deletePackageTemplate,
    creditPackages, deleteCreditPackage,
    slotDuration, openTime, closeTime, maxCapacity, updateBookingSettings,
    language, setLanguage
  } = useStore();

  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localTierRules, setLocalTierRules] = useState<TierRule[]>(tierRules);
  const [localShopName, setLocalShopName] = useState(shopName);
  const [localShopLogo, setLocalShopLogo] = useState(shopLogo);
  const [localShopAddress, setLocalShopAddress] = useState(shopAddress);
  const [localShopPhone, setLocalShopPhone] = useState(shopPhone);
  const [localShopLineId, setLocalShopLineId] = useState(shopLineId);
  const [localCurrency, setLocalCurrency] = useState(currency);
  const [localShopIsOpen, setLocalShopIsOpen] = useState(shopIsOpen);
  
  const [localReceiptHeader, setLocalReceiptHeader] = useState(receiptHeader);
  const [localReceiptFooter, setLocalReceiptFooter] = useState(receiptFooter);
  const [localReceiptPaperSize, setLocalReceiptPaperSize] = useState<'58mm' | '80mm'>(receiptPaperSize);

  const [localSlotDuration, setLocalSlotDuration] = useState(slotDuration);
  const [localMaxCapacity, setLocalMaxCapacity] = useState(maxCapacity);
  const [localOpenTime, setLocalOpenTime] = useState(openTime);
  const [localCloseTime, setLocalCloseTime] = useState(closeTime);

  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isReceiptPreviewOpen, setIsReceiptPreviewOpen] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState<AddonItem | null>(null);
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
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
      receiptFooter: localReceiptFooter,
      receiptPaperSize: localReceiptPaperSize,
      currency: localCurrency,
      shopIsOpen: localShopIsOpen,
    });
    updateBookingSettings({
      slotDuration: localSlotDuration,
      maxCapacity: localMaxCapacity,
      openTime: localOpenTime,
      closeTime: localCloseTime
    });
    toast.success("Settings saved successfully!");
  };

  const handleEditService = (s: Service) => {
    setSelectedService(s);
    setIsServiceModalOpen(true);
  };

  const handleAddService = () => {
    setSelectedService(null);
    setIsServiceModalOpen(true);
  };

  return (
    <main className="flex-1 p-10 overflow-y-auto scrollbar-hide">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <div><h1 className="text-4xl font-black mb-1">{t.settings}</h1><p className="text-gray-400 font-medium">Manage your shop configurations</p></div>
          <div className="flex gap-3">
            <button onClick={() => setIsBroadcastModalOpen(true)} className="bg-white border border-gray-100 px-6 py-4 rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-sm"><Send size={18} className="text-green-500" /> Messaging</button>
            <button onClick={handleSaveAll} className="bg-[#1A1F3D] text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl"><Save size={18} /> {t.saveAll}</button>
          </div>
        </div>

        <Tabs defaultValue="business" className="space-y-8">
          <TabsList className="bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm w-auto inline-flex gap-1 h-auto overflow-x-auto scrollbar-hide">
            <TabsTrigger value="business" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white text-xs font-bold transition-all"><Store size={16} className="mr-2" /> Business</TabsTrigger>
            <TabsTrigger value="booking" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white text-xs font-bold transition-all"><Clock size={16} className="mr-2" /> Booking</TabsTrigger>
            <TabsTrigger value="services" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white text-xs font-bold transition-all"><Scissors size={16} className="mr-2" /> Services</TabsTrigger>
            <TabsTrigger value="packages" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white text-xs font-bold transition-all"><Package size={16} className="mr-2" /> Bundles</TabsTrigger>
            <TabsTrigger value="credits" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white text-xs font-bold transition-all"><Wallet size={16} className="mr-2" /> Credit Packs</TabsTrigger>
            <TabsTrigger value="membership" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white text-xs font-bold transition-all"><ShieldCheck size={16} className="mr-2" /> Membership</TabsTrigger>
          </TabsList>

          <TabsContent value="business" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="space-y-8">
                  <section className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
                    <div className="flex items-center gap-3 mb-2"><div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Globe size={24} /></div><div><h2 className="text-xl font-bold">{t.language}</h2><p className="text-xs text-gray-400">{t.selectLanguage}</p></div></div>
                    <div className="flex bg-[#F5F6FA] p-1.5 rounded-2xl gap-2">
                      <button onClick={() => setLanguage('th')} className={cn("flex-1 py-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2", language === 'th' ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400")}>🇹🇭 ภาษาไทย</button>
                      <button onClick={() => setLanguage('en')} className={cn("flex-1 py-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2", language === 'en' ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400")}>🇺🇸 English</button>
                    </div>
                  </section>
                  <section className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
                    <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-3"><div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Store size={24} /></div><div><h2 className="text-xl font-bold">{t.shopManagement}</h2><p className="text-xs text-gray-400">{t.shopIdentityDesc}</p></div></div><div className={cn("flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all", localShopIsOpen ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100")}><span className={cn("text-[10px] font-black uppercase tracking-widest", localShopIsOpen ? "text-green-600" : "text-red-600")}>{localShopIsOpen ? t.open : t.closed}</span><Switch checked={localShopIsOpen} onCheckedChange={setLocalShopIsOpen} className="data-[state=checked]:bg-green-600" /></div></div>
                    <div className="flex flex-col items-center gap-4 bg-[#F5F6FA] p-8 rounded-[32px] relative overflow-hidden"><div className="relative group"><div className="w-24 h-24 bg-white rounded-[28px] overflow-hidden shadow-md border-2 border-dashed border-gray-200 flex items-center justify-center">{localShopLogo ? <img src={localShopLogo} alt="Shop Logo" className="w-full h-full object-cover" /> : <Scissors className="text-gray-200" size={32} />}</div><button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 bg-[#1A1F3D] text-white p-2 rounded-xl shadow-lg hover:scale-110 transition-transform"><Camera size={16} /></button></div><div className="text-center"><p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t.shopLogo}</p></div><input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f) { const r = new FileReader(); r.onloadend = () => setLocalShopLogo(r.result as string); r.readAsDataURL(f); } }} /></div>
                    <div className="space-y-6"><div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 tracking-wider ml-2 flex items-center gap-2"><Store size={12} /> {t.shopName}</label><input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" value={localShopName} onChange={(e) => setLocalShopName(e.target.value)} /></div><div className="grid grid-cols-2 gap-6"><div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 tracking-wider ml-2 flex items-center gap-2"><Phone size={12} /> {t.phone}</label><input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" value={localShopPhone} onChange={(e) => setLocalShopPhone(e.target.value)} /></div><div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 tracking-wider ml-2 flex items-center gap-2"><MessageSquare size={12} /> LINE ID</label><input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" value={localShopLineId} onChange={(e) => setLocalShopLineId(e.target.value)} /></div></div></div>
                  </section>
               </div>
               <div className="space-y-8">
                  <section className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
                    <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-3"><div className="p-3 bg-green-50 text-green-600 rounded-2xl"><FileText size={24} /></div><div><h2 className="text-xl font-bold">{t.receiptConfig}</h2><p className="text-xs text-gray-400">Manage details</p></div></div><button onClick={() => setIsReceiptPreviewOpen(true)} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-blue-100 transition-all"><Eye size={14} /> {t.preview}</button></div>
                    <div className="space-y-6"><div className="space-y-3"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2 flex items-center gap-2"><Layout size={12} /> {t.paperSize}</label><div className="flex bg-[#F5F6FA] p-1.5 rounded-2xl gap-2">{(['58mm', '80mm'] as const).map(size => (<button key={size} onClick={() => setLocalReceiptPaperSize(size)} className={cn("flex-1 py-3 rounded-xl text-[10px] font-black transition-all", localReceiptPaperSize === size ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400")}>{size}</button>))}</div></div><div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 tracking-wider ml-2 flex items-center gap-2"><AlignLeft size={12} /> {t.receiptHeader}</label><input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" value={localReceiptHeader} onChange={(e) => setLocalReceiptHeader(e.target.value)} /></div><div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 tracking-wider ml-2 flex items-center gap-2"><MapPin size={12} /> {t.address}</label><textarea className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-xs font-bold h-20 resize-none leading-relaxed" value={localShopAddress} onChange={(e) => setLocalShopAddress(e.target.value)} /></div><div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 tracking-wider ml-2 flex items-center gap-2"><FileText size={12} /> {t.receiptFooter}</label><textarea className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-xs font-bold h-24 resize-none leading-relaxed" value={localReceiptFooter} onChange={(e) => setLocalReceiptFooter(e.target.value)} /></div></div>
                  </section>
               </div>
             </div>
          </TabsContent>

          <TabsContent value="booking" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
                <div className="flex items-center gap-3 mb-2"><div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Clock size={24} /></div><div><h2 className="text-xl font-bold">{t.bookingRules}</h2><p className="text-xs text-gray-400">{t.bookingConfigDesc}</p></div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">{t.slotDuration} (Min)</label><input type="number" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" value={localSlotDuration} onChange={e => setLocalSlotDuration(Number(e.target.value))} /></div>
                   <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">{t.maxCapacitySlot}</label><input type="number" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" value={localMaxCapacity} onChange={e => setLocalMaxCapacity(Number(e.target.value))} /></div>
                   <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">{t.openingTime}</label><TimePicker value={localOpenTime} onChange={setLocalOpenTime} /></div>
                   <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">{t.closingTime}</label><TimePicker value={localCloseTime} onChange={setLocalCloseTime} /></div>
                </div>
             </div>
          </TabsContent>

          <TabsContent value="services" className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
             <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                   <div className="flex items-center gap-3"><div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><Scissors size={24} /></div><div><h2 className="text-xl font-bold">Service Catalog</h2><p className="text-xs text-gray-400">Add or update your services</p></div></div>
                   <div className="flex items-center gap-4">
                      <div className="bg-[#F5F6FA] p-1 rounded-2xl flex gap-1">
                        <button onClick={() => setSpeciesTab('Dog')} className={cn("px-4 py-2 rounded-xl text-[10px] font-black transition-all", speciesTab === 'Dog' ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400")}>DOG</button>
                        <button onClick={() => setSpeciesTab('Cat')} className={cn("px-4 py-2 rounded-xl text-[10px] font-black transition-all", speciesTab === 'Cat' ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400")}>CAT</button>
                      </div>
                      <button onClick={handleAddService} className="bg-[#1A1F3D] text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2"><Plus size={16} /> {t.add}</button>
                   </div>
                </div>

                <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} /><input className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold" placeholder={t.searchServices} value={serviceQuery} onChange={e => setServiceQuery(e.target.value)} /></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {filteredServices.map(s => (
                      <div key={s.id} className="p-5 bg-white border border-gray-100 rounded-[28px] flex items-center justify-between group hover:shadow-lg transition-all">
                         <div className="flex items-center gap-4">
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm", s.targetSpecies === 'Dog' ? "bg-blue-500" : "bg-pink-500")}><Scissors size={20}/></div>
                            <div><h4 className="font-black text-[#1A1F3D] text-sm">{s.title}</h4><p className="text-[10px] text-gray-400 font-bold uppercase">{s.category}</p></div>
                         </div>
                         <div className="flex items-center gap-3">
                            <Switch checked={s.isActive} onCheckedChange={() => toggleServiceActive(s.id)} className="data-[state=checked]:bg-[#1A1F3D]" />
                            <button onClick={() => handleEditService(s)} className="p-2 text-gray-300 hover:text-[#1A1F3D]"><Edit3 size={16}/></button>
                            <button onClick={() => { if(confirm('Delete service?')) deleteService(s.id); }} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Zap size={24} /></div>
                    <div><h2 className="text-xl font-bold">Global Add-ons</h2><p className="text-xs text-gray-400">Configurable extra services for any appointment</p></div>
                  </div>
                  <button onClick={() => { setSelectedAddon(null); setIsAddonModalOpen(true); }} className="bg-[#1A1F3D] text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2"><Plus size={16} /> Add Add-on</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {addons.map(addon => (
                     <div key={addon.id} className="p-6 bg-[#F5F6FA] rounded-[32px] flex justify-between items-center group">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm"><Zap size={18} /></div>
                           <div><p className="text-sm font-black text-[#1A1F3D]">{addon.name}</p><p className="text-[10px] text-gray-400 font-bold uppercase">{currency}{addon.price}</p></div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => { setSelectedAddon(addon); setIsAddonModalOpen(true); }} className="p-2 text-gray-300 hover:text-[#1A1F3D]"><Edit3 size={14}/></button>
                           <button onClick={() => deleteAddon(addon.id)} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={14}/></button>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </TabsContent>

          <TabsContent value="packages" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
                <div className="flex justify-between items-center">
                   <div className="flex items-center gap-3">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Package size={24} /></div>
                      <div><h2 className="text-xl font-bold">Service Bundle Templates</h2><p className="text-xs text-gray-400">Manage multi-session packages (e.g. 8 Free 2)</p></div>
                   </div>
                   <button onClick={() => setIsPackageModalOpen(true)} className="bg-[#1A1F3D] text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2"><Plus size={16} /> Manage Bundles</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {packageTemplates.map(t => (
                      <div key={t.id} className="p-6 bg-[#F5F6FA] rounded-[32px] flex justify-between items-center group">
                         <div><h4 className="font-black text-[#1A1F3D]">{t.name}</h4><p className="text-[10px] text-gray-400 font-bold uppercase">{t.paidSlots}+{t.freeSlots} Sessions • {currency}{t.price.toLocaleString()}</p></div>
                         <button onClick={() => deletePackageTemplate(t.id)} className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18} /></button>
                      </div>
                   ))}
                </div>
             </div>
          </TabsContent>

          <TabsContent value="credits" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Wallet size={24} /></div>
                    <div><h2 className="text-xl font-bold">Credit Package Templates</h2><p className="text-xs text-gray-400">Configure prepaid top-up deals</p></div>
                  </div>
                  <button onClick={() => setIsCreditModalOpen(true)} className="bg-[#1A1F3D] text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2"><Plus size={16} /> Manage Credits</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {creditPackages.map(pkg => (
                    <div key={pkg.id} className="p-6 bg-[#F5F6FA] rounded-[32px] flex justify-between items-center group">
                      <div><h4 className="font-black text-[#1A1F3D]">{pkg.name}</h4><p className="text-[10px] text-gray-400 font-bold uppercase">Paid: {currency}{pkg.price.toLocaleString()} → Recv: {currency}{pkg.creditValue.toLocaleString()}</p></div>
                      <button onClick={() => deleteCreditPackage(pkg.id)} className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18} /></button>
                    </div>
                  ))}
                </div>
             </div>
          </TabsContent>

          <TabsContent value="membership" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-10">
                <div className="flex items-center gap-3"><div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><ShieldCheck size={24} /></div><div><h2 className="text-xl font-bold">{t.membershipTierLogic}</h2><p className="text-xs text-gray-400">{t.membershipDesc}</p></div></div>
                <div className="grid grid-cols-1 gap-6">
                  {localTierRules.map((rule, idx) => (
                    <div key={rule.level} className="flex flex-col lg:flex-row items-center gap-6 p-8 bg-[#F5F6FA] rounded-[32px] relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-2 h-full bg-[#1A1F3D]" />
                       <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                          {rule.level === 'VIP' ? <Gem className="text-purple-500" size={24} /> : rule.level === 'Gold' ? <Crown className="text-amber-500" size={24} /> : <Star className="text-blue-500" size={24} />}
                       </div>
                       <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">{t.publicLabel}</label><input className="w-full bg-white border-none rounded-xl px-4 py-3 text-xs font-bold" value={rule.label} onChange={e => { const newRules = [...localTierRules]; newRules[idx].label = e.target.value; setLocalTierRules(newRules); }} /></div>
                          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">{t.minSpending}</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 font-bold text-xs">{currency}</span><input type="number" className="w-full bg-white border-none rounded-xl pl-8 pr-4 py-3 text-xs font-bold" value={rule.minSpent} onChange={e => { const newRules = [...localTierRules]; newRules[idx].minSpent = Number(e.target.value); setLocalTierRules(newRules); }} /></div></div>
                          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">{t.benefitDiscount}</label><div className="relative"><Percent className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} /><input type="number" className="w-full bg-white border-none rounded-xl px-4 py-3 text-xs font-bold" value={rule.discount} onChange={e => { const newRules = [...localTierRules]; newRules[idx].discount = Number(e.target.value); setLocalTierRules(newRules); }} /></div></div>
                       </div>
                    </div>
                  ))}
                </div>
             </div>
          </TabsContent>
        </Tabs>
      </div>

      {isServiceModalOpen && <ServiceModal service={selectedService} defaultSpecies={speciesTab} onClose={() => setIsServiceModalOpen(false)} />}
      {isAddonModalOpen && <AddonSettingsModal addon={selectedAddon} onClose={() => setIsAddonModalOpen(false)} />}
      {isBroadcastModalOpen && <BroadcastModal onClose={() => setIsBroadcastModalOpen(false)} />}
      {isReceiptPreviewOpen && <ReceiptPreview shopName={localShopName} shopLogo={localShopLogo} shopAddress={localShopAddress} shopPhone={localShopPhone} header={localReceiptHeader} footer={localReceiptFooter} paperSize={localReceiptPaperSize} onClose={() => setIsReceiptPreviewOpen(false)} />}
      {isPackageModalOpen && <PackageModal onClose={() => setIsPackageModalOpen(false)} />}
      {isCreditModalOpen && <CreditPackageModal onClose={() => setIsCreditModalOpen(false)} />}
    </main>
  );
};

export default Settings;