"use client";

import React, { useState, useRef } from 'react';
import { 
  Store, Save, Scissors, Plus, Search, Edit3, Dog, Cat, Clock, Star, Crown, Gem, Award, Percent, Phone, MessageSquare, Calendar, AlertCircle, Share2, Send, Camera, FileText, AlignLeft, Layout, Eye, MapPin, Globe, Package, Zap, Wallet, Trash2, ChevronRight
} from 'lucide-react';
import { useStore, Service, AddonItem } from '@/store/useStore';
import { translations } from '@/utils/translations';
import { toast } from 'sonner';
import ServiceModal from '@/components/ServiceModal';
import TimePicker from '@/components/TimePicker';
import BroadcastModal from '@/components/BroadcastModal';
import ReceiptPreview from '@/components/ReceiptPreview';
import PackageModal from '@/components/PackageModal';
import AddonSettingsModal from '@/components/AddonSettingsModal';
import StoreHolidaysConfig from '@/components/StoreHolidaysConfig';
import { cn } from '@/lib/utils';
import { Switch } from "@/components/ui/switch";

type SettingTab = 'profile' | 'operations' | 'services' | 'bundles' | 'system';

const Settings = () => {
  const { 
    shopName, shopLogo, shopAddress, shopPhone, shopLineId, currency, shopIsOpen,
    receiptHeader, receiptFooter, receiptPaperSize,
    updateBusinessProfile,
    services, toggleServiceActive, deleteService,
    addons, deleteAddon,
    packageTemplates, deletePackageTemplate,
    slotDuration, openTime, closeTime, maxCapacity, updateBookingSettings,
    recurringHolidays, specificHolidays,
    language, setLanguage
  } = useStore();

  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<SettingTab>('profile');
  
  // Local States for draft changes
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
  const [localRecurringHolidays, setLocalRecurringHolidays] = useState<number[]>(recurringHolidays);
  const [localSpecificHolidays, setLocalSpecificHolidays] = useState<string[]>(specificHolidays);

  // Modals
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isReceiptPreviewOpen, setIsReceiptPreviewOpen] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState<AddonItem | null>(null);
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [serviceQuery, setServiceQuery] = useState('');
  const [speciesTab, setSpeciesTab] = useState<'Dog' | 'Cat'>('Dog');
  const [coatFilter, setCoatFilter] = useState<'All' | 'Short' | 'Long'>('All');

  const filteredServices = services.filter(s => 
    s.targetSpecies === speciesTab && 
    (coatFilter === 'All' || s.coatType === coatFilter) &&
    s.title.toLowerCase().includes(serviceQuery.toLowerCase())
  );

  const handleSaveAll = () => {
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
      closeTime: localCloseTime,
      recurringHolidays: localRecurringHolidays,
      specificHolidays: localSpecificHolidays
    });
    toast.success("All settings synchronized successfully!");
  };

  const handleEditService = (s: Service) => {
    setSelectedService(s);
    setIsServiceModalOpen(true);
  };

  const handleAddService = () => {
    setSelectedService(null);
    setIsServiceModalOpen(true);
  };

  const navItems = [
    { id: 'profile', label: 'Store Profile', icon: Store, desc: 'Identity & Contacts' },
    { id: 'operations', label: 'Operations', icon: Clock, desc: 'Hours & Booking Rules' },
    { id: 'services', label: 'Services & Add-ons', icon: Scissors, desc: 'Manage your Catalog' },
    { id: 'bundles', label: 'Service Bundles', icon: Package, desc: 'Packages & Multi-sessions' },
    { id: 'system', label: 'System', icon: Globe, desc: 'Language & Preferences' },
  ];

  return (
    <main className="flex-1 flex overflow-hidden bg-[#F8F9FD]">
      {/* Settings Navigation Sidebar */}
      <aside className="w-80 border-r border-gray-100 bg-white flex flex-col shrink-0">
        <div className="p-8 pt-24 lg:pt-8">
          <h1 className="text-2xl font-black text-[#1A1F3D] mb-1">{t.settings}</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Configuration Center</p>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as SettingTab)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl transition-all group",
                activeTab === item.id 
                  ? "bg-[#1A1F3D] text-white shadow-xl shadow-[#1A1F3D]/10" 
                  : "text-gray-400 hover:bg-gray-50 hover:text-[#1A1F3D]"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                activeTab === item.id ? "bg-white/10" : "bg-gray-50 group-hover:bg-white"
              )}>
                <item.icon size={20} />
              </div>
              <div className="text-left">
                <p className="text-xs font-black">{item.label}</p>
                <p className={cn("text-[9px] font-bold uppercase", activeTab === item.id ? "opacity-40" : "opacity-60")}>{item.desc}</p>
              </div>
              {activeTab === item.id && <ChevronRight size={14} className="ml-auto opacity-40" />}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-gray-50">
          <button onClick={() => setIsBroadcastModalOpen(true)} className="w-full bg-green-50 text-green-600 p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-green-100 transition-all">
            <Send size={14} /> Send Broadcast
          </button>
        </div>
      </aside>

      {/* Settings Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Sticky Header */}
        <header className="px-10 py-6 bg-white/80 backdrop-blur-md border-b border-gray-100 flex justify-between items-center z-10 shrink-0">
          <div className="flex items-center gap-3">
            {navItems.find(n => n.id === activeTab)?.icon && (
              <div className="w-8 h-8 bg-[#F5F6FA] rounded-lg flex items-center justify-center text-[#1A1F3D]">
                {React.createElement(navItems.find(n => n.id === activeTab)!.icon, { size: 18 })}
              </div>
            )}
            <h2 className="text-lg font-black text-[#1A1F3D] uppercase tracking-tight">{navItems.find(n => n.id === activeTab)?.label}</h2>
          </div>
          <button 
            onClick={handleSaveAll}
            className="bg-[#1A1F3D] text-white px-8 py-3 rounded-xl font-black text-xs flex items-center gap-2 shadow-xl shadow-[#1A1F3D]/10 hover:scale-105 active:scale-95 transition-all"
          >
            <Save size={16} /> {t.saveAll}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
          <div className="max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
            
            {/* Tab: Store Profile */}
            {activeTab === 'profile' && (
              <div className="space-y-10">
                <section className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-10">
                    <div>
                      <h3 className="text-xl font-black text-[#1A1F3D] mb-1">Identity & Branding</h3>
                      <p className="text-xs text-gray-400 font-medium">How your shop appears to clients and on receipts.</p>
                    </div>
                    <div className={cn("flex items-center gap-3 px-4 py-2 rounded-2xl border", localShopIsOpen ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100")}>
                       <span className={cn("text-[10px] font-black uppercase tracking-widest", localShopIsOpen ? "text-green-600" : "text-red-600")}>{localShopIsOpen ? t.open : t.closed}</span>
                       <Switch checked={localShopIsOpen} onCheckedChange={setLocalShopIsOpen} className="data-[state=checked]:bg-green-600" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-1 flex flex-col items-center">
                       <div className="relative group mb-4">
                          <div className="w-32 h-32 bg-[#F5F6FA] rounded-[40px] overflow-hidden shadow-inner border-2 border-dashed border-gray-200 flex items-center justify-center">
                            {localShopLogo ? <img src={localShopLogo} alt="Logo" className="w-full h-full object-cover" /> : <Scissors className="text-gray-200" size={40} />}
                          </div>
                          <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 bg-[#1A1F3D] text-white p-3 rounded-2xl shadow-xl hover:scale-110 transition-transform"><Camera size={18} /></button>
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f) { const r = new FileReader(); r.onloadend = () => setLocalShopLogo(r.result as string); r.readAsDataURL(f); } }} />
                       </div>
                       <p className="text-[10px] font-black uppercase text-gray-300 tracking-widest">Shop Logo</p>
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Shop Name</label>
                          <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all" value={localShopName} onChange={e => setLocalShopName(e.target.value)} />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Phone</label>
                             <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" value={localShopPhone} onChange={e => setLocalShopPhone(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">LINE Official ID</label>
                             <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" value={localShopLineId} onChange={e => setLocalShopLineId(e.target.value)} />
                          </div>
                       </div>
                    </div>
                  </div>
                </section>

                {/* Store Holidays Configuration Section */}
                <StoreHolidaysConfig 
                  recurringHolidays={localRecurringHolidays}
                  onChangeRecurring={setLocalRecurringHolidays}
                  specificHolidays={localSpecificHolidays}
                  onChangeSpecific={setLocalSpecificHolidays}
                />

                <section className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm">
                   <div className="flex justify-between items-center mb-10">
                      <div>
                        <h3 className="text-xl font-black text-[#1A1F3D] mb-1">Receipt Customization</h3>
                        <p className="text-xs text-gray-400 font-medium">Fine-tune your printed and digital receipts.</p>
                      </div>
                      <button onClick={() => setIsReceiptPreviewOpen(true)} className="bg-blue-50 text-blue-600 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-blue-100 transition-all"><Eye size={16} /> Live Preview</button>
                   </div>
                   
                   <div className="space-y-6">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Paper Size</label>
                         <div className="flex bg-[#F5F6FA] p-1.5 rounded-[22px] gap-2 w-full max-w-sm">
                            {(['58mm', '80mm'] as const).map(size => (
                              <button key={size} onClick={() => setLocalReceiptPaperSize(size)} className={cn("flex-1 py-3 rounded-[18px] text-[10px] font-black transition-all", localReceiptPaperSize === size ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400")}>{size} Thermal</button>
                            ))}
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Header Title</label>
                         <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" value={localReceiptHeader} onChange={e => setLocalReceiptHeader(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Shop Address</label>
                         <textarea className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-xs font-bold h-24 resize-none leading-relaxed" value={localShopAddress} onChange={e => setLocalShopAddress(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Footer Message</label>
                         <textarea className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-xs font-bold h-24 resize-none leading-relaxed" value={localReceiptFooter} onChange={e => setLocalReceiptFooter(e.target.value)} />
                      </div>
                   </div>
                </section>
              </div>
            )}

            {/* Tab: Operations */}
            {activeTab === 'operations' && (
              <section className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm space-y-10">
                <div>
                  <h3 className="text-xl font-black text-[#1A1F3D] mb-1">Booking Logic & Business Hours</h3>
                  <p className="text-xs text-gray-400 font-medium">Configure how appointments are scheduled.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Slot Duration (Minutes)</label>
                        <input type="number" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" value={localSlotDuration} onChange={e => setLocalSlotDuration(Number(e.target.value))} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Max Capacity Per Slot</label>
                        <input type="number" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" value={localMaxCapacity} onChange={e => setLocalMaxCapacity(Number(e.target.value))} />
                      </div>
                   </div>
                   <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Opening Time</label>
                        <TimePicker value={localOpenTime} onChange={setLocalOpenTime} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Closing Time</label>
                        <TimePicker value={localCloseTime} onChange={setLocalCloseTime} />
                      </div>
                   </div>
                </div>

                <div className="p-8 bg-blue-50/50 rounded-[40px] border border-blue-100 flex items-start gap-4">
                   <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-500"><AlertCircle size={20} /></div>
                   <div>
                      <p className="text-xs font-black text-blue-900 mb-1">Advanced Availability</p>
                      <p className="text-[11px] text-blue-800/60 leading-relaxed font-medium">To block specific holidays or close slots manually, use the "Operations" page and right-click on the calendar slots.</p>
                   </div>
                </div>
              </section>
            )}

            {/* Tab: Services & Add-ons */}
            {activeTab === 'services' && (
              <div className="space-y-12">
                 <section className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm space-y-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                       <div>
                          <h3 className="text-xl font-black text-[#1A1F3D] mb-1">Service Catalog</h3>
                          <p className="text-xs text-gray-400 font-medium">Define your specialized grooming treatments.</p>
                       </div>
                       <div className="flex flex-wrap gap-3">
                          <div className="bg-[#F5F6FA] p-1 rounded-2xl flex gap-1">
                             <button onClick={() => setSpeciesTab('Dog')} className={cn("px-4 py-2 rounded-xl text-[10px] font-black transition-all", speciesTab === 'Dog' ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400")}>DOG</button>
                             <button onClick={() => setSpeciesTab('Cat')} className={cn("px-4 py-2 rounded-xl text-[10px] font-black transition-all", speciesTab === 'Cat' ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400")}>CAT</button>
                          </div>
                          <div className="bg-[#F5F6FA] p-1 rounded-2xl flex gap-1">
                             {(['All', 'Short', 'Long'] as const).map(type => (
                               <button
                                 key={type}
                                 onClick={() => setCoatFilter(type)}
                                 className={cn(
                                   "px-4 py-2 rounded-xl text-[10px] font-black transition-all",
                                   coatFilter === type ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400"
                                 )}
                               >
                                 {type === 'All' ? 'ALL' : type === 'Short' ? 'SHORT' : 'LONG'}
                               </button>
                             ))}
                          </div>
                          <button onClick={handleAddService} className="bg-[#1A1F3D] text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2"><Plus size={16} /> {t.add}</button>
                       </div>
                    </div>

                    <div className="relative"><Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} /><input className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-14 pr-6 py-4 text-sm font-bold" placeholder={t.searchServices} value={serviceQuery} onChange={e => setServiceQuery(e.target.value)} /></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {filteredServices.map(s => (
                          <div key={s.id} className="p-5 bg-white border border-gray-100 rounded-[32px] flex items-center justify-between group hover:shadow-lg transition-all">
                             <div className="flex items-center gap-4">
                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm", s.targetSpecies === 'Dog' ? "bg-blue-500" : "bg-pink-500")}><Scissors size={20}/></div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <h4 className="font-black text-[#1A1F3D] text-sm">{s.title}</h4>
                                    {s.coatType && (
                                      <span className={cn(
                                        "text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase",
                                        s.coatType === 'Short' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                                      )}>
                                        {s.coatType === 'Short' ? 'Short' : 'Long'}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase">{s.category}</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-3">
                                <Switch checked={s.isActive} onCheckedChange={() => toggleServiceActive(s.id)} className="data-[state=checked]:bg-[#1A1F3D]" />
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button onClick={() => handleEditService(s)} className="p-2 text-gray-300 hover:text-[#1A1F3D] bg-gray-50 rounded-lg"><Edit3 size={16}/></button>
                                   <button onClick={() => { if(confirm('Delete service?')) deleteService(s.id); }} className="p-2 text-gray-300 hover:text-red-500 bg-gray-50 rounded-lg"><Trash2 size={16}/></button>
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                 </section>

                 <section className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm space-y-8">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-black text-[#1A1F3D] mb-1">Global Add-ons</h3>
                        <p className="text-xs text-gray-400 font-medium">Extra items that can be added to any order.</p>
                      </div>
                      <button onClick={() => { setSelectedAddon(null); setIsAddonModalOpen(true); }} className="bg-[#1A1F3D] text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2"><Plus size={16} /> Add Add-on</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {addons.map(addon => (
                         <div key={addon.id} className="p-6 bg-[#F5F6FA] rounded-[32px] flex justify-between items-center group relative overflow-hidden">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm"><Zap size={18} /></div>
                               <div><p className="text-sm font-black text-[#1A1F3D]">{addon.name}</p><p className="text-[10px] text-gray-400 font-bold uppercase">{currency}{addon.price}</p></div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => { setSelectedAddon(addon); setIsAddonModalOpen(true); }} className="p-2 text-gray-300 hover:text-[#1A1F3D]"><Edit3 size={16}/></button>
                               <button onClick={() => deleteAddon(addon.id)} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                            </div>
                         </div>
                       ))}
                    </div>
                 </section>
              </div>
            )}

            {/* Tab: Bundles & Packages */}
            {activeTab === 'bundles' && (
              <section className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm space-y-8">
                 <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-black text-[#1A1F3D] mb-1">Service Bundle Templates</h3>
                      <p className="text-xs text-gray-400 font-medium">Configure multi-session packages (e.g., Buy 8 Get 2 Free).</p>
                    </div>
                    <button onClick={() => setIsPackageModalOpen(true)} className="bg-[#1A1F3D] text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-xl"><Plus size={16} /> Create Bundle</button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {packageTemplates.map(t => (
                       <div key={t.id} className="p-8 bg-[#F5F6FA] rounded-[40px] flex justify-between items-center group relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
                          <div>
                            <h4 className="font-black text-[#1A1F3D] text-lg">{t.name}</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{t.paidSlots}+{t.freeSlots} Sessions • {currency}{t.price.toLocaleString()}</p>
                          </div>
                          <button onClick={() => deletePackageTemplate(t.id)} className="p-3 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-xl shadow-sm"><Trash2 size={18} /></button>
                       </div>
                    ))}
                    {packageTemplates.length === 0 && (
                      <div className="col-span-full py-20 text-center opacity-20"><Package size={48} className="mx-auto mb-4"/><p className="font-black">No bundles created yet</p></div>
                    )}
                 </div>
              </section>
            )}

            {/* Tab: System & Language */}
            {activeTab === 'system' && (
              <section className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm space-y-10">
                <div>
                  <h3 className="text-xl font-black text-[#1A1F3D] mb-1">System Preferences</h3>
                  <p className="text-xs text-gray-400 font-medium">Language, currency, and global app settings.</p>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Application Language</label>
                  <div className="flex bg-[#F5F6FA] p-1.5 rounded-[22px] gap-2 max-w-sm">
                    <button onClick={() => setLanguage('th')} className={cn("flex-1 py-3 rounded-[18px] text-[10px] font-black transition-all flex items-center justify-center gap-2", language === 'th' ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400")}>🇹🇭 ภาษาไทย</button>
                    <button onClick={() => setLanguage('en')} className={cn("flex-1 py-3 rounded-[18px] text-[10px] font-black transition-all flex items-center justify-center gap-2", language === 'en' ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400")}>🇺🇸 English</button>
                  </div>
                </div>

                <div className="space-y-4 max-w-sm">
                   <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Primary Currency Symbol</label>
                   <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" value={localCurrency} onChange={e => setLocalCurrency(e.target.value)} />
                </div>
              </section>
            )}

          </div>
        </div>
      </div>

      {/* Reused Modals */}
      {isServiceModalOpen && <ServiceModal service={selectedService} defaultSpecies={speciesTab} onClose={() => setIsServiceModalOpen(false)} />}
      {isAddonModalOpen && <AddonSettingsModal addon={selectedAddon} onClose={() => setIsAddonModalOpen(false)} />}
      {isBroadcastModalOpen && <BroadcastModal onClose={() => setIsBroadcastModalOpen(false)} />}
      {isReceiptPreviewOpen && <ReceiptPreview shopName={localShopName} shopLogo={localShopLogo} shopAddress={localShopAddress} shopPhone={localShopPhone} header={localReceiptHeader} footer={localReceiptFooter} paperSize={localReceiptPaperSize} onClose={() => setIsReceiptPreviewOpen(false)} />}
      {isPackageModalOpen && <PackageModal onClose={() => setIsPackageModalOpen(false)} />}
    </main>
  );
};

export default Settings;