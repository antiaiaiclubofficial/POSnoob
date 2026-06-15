"use client";

import React, { useState, useRef } from 'react';
import { 
  Store, Save, Clock, Phone, MessageSquare, Calendar, AlertCircle, Send, Camera, Eye, Globe, ChevronRight, Copy, ShieldCheck, ExternalLink, Building2, Percent
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { translations } from '@/utils/translations';
import { toast } from 'sonner';
import TimePicker from '@/components/TimePicker';
import BroadcastModal from '@/components/BroadcastModal';
import ReceiptPreview from '@/components/ReceiptPreview';
import StoreHolidaysConfig from '@/components/StoreHolidaysConfig';
import { cn } from '@/lib/utils';
import { Switch } from "@/components/ui/switch";

type SettingTab = 'profile' | 'company' | 'operations' | 'integrations' | 'system';

const Settings = () => {
  const { 
    shopName, shopLogo, shopAddress, shopPhone, shopLineId, currency, shopIsOpen,
    receiptHeader, receiptFooter, receiptPaperSize,
    liffId, liffChannelId, liffChannelSecret, liffEnabled,
    companyName, companyAddress, companyTaxId, vatEnabled, vatRate,
    updateBusinessProfile,
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

  // Company Profile Local States
  const [localCompanyName, setLocalCompanyName] = useState(companyName || '');
  const [localCompanyAddress, setLocalCompanyAddress] = useState(companyAddress || '');
  const [localCompanyTaxId, setLocalCompanyTaxId] = useState(companyTaxId || '');
  const [localVatEnabled, setLocalVatEnabled] = useState(vatEnabled);
  const [localVatRate, setLocalVatRate] = useState(vatRate || 7);

  // LINE LIFF Local States
  const [localLiffId, setLocalLiffId] = useState(liffId);
  const [localLiffChannelId, setLocalLiffChannelId] = useState(liffChannelId);
  const [localLiffChannelSecret, setLocalLiffChannelSecret] = useState(liffChannelSecret);
  const [localLiffEnabled, setLocalLiffEnabled] = useState(liffEnabled);

  // Modals
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isReceiptPreviewOpen, setIsReceiptPreviewOpen] = useState(false);

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
      liffId: localLiffId,
      liffChannelId: localLiffChannelId,
      liffChannelSecret: localLiffChannelSecret,
      liffEnabled: localLiffEnabled,
      companyName: localCompanyName,
      companyAddress: localCompanyAddress,
      companyTaxId: localCompanyTaxId,
      vatEnabled: localVatEnabled,
      vatRate: localVatRate,
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

  const handleCopyLiffUrl = () => {
    const url = `https://liff.line.me/${localLiffId || 'liff-id'}`;
    navigator.clipboard.writeText(url);
    toast.success("LIFF URL copied to clipboard!");
  };

  const navItems = [
    { id: 'profile', label: 'Store Profile', icon: Store, desc: 'Identity & Contacts' },
    { id: 'company', label: 'Company Profile', icon: Building2, desc: 'Legal & Tax Settings' },
    { id: 'operations', label: 'Operations', icon: Clock, desc: 'Hours & Booking Rules' },
    { id: 'integrations', label: 'LINE Integrations', icon: MessageSquare, desc: 'LIFF & Messaging' },
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
                            {localShopLogo ? <img src={localShopLogo} alt="Logo" className="w-full h-full object-cover" /> : <Store className="text-gray-200" size={40} />}
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

            {/* Tab: Company Profile */}
            {activeTab === 'company' && (
              <section className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm space-y-10">
                <div>
                  <h3 className="text-xl font-black text-[#1A1F3D] mb-1">Company Profile & Tax Settings</h3>
                  <p className="text-xs text-gray-400 font-medium">Configure your legal company details and VAT settings for invoicing.</p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Legal Company Name</label>
                      <input 
                        className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all" 
                        value={localCompanyName} 
                        onChange={e => setLocalCompanyName(e.target.value)} 
                        placeholder="e.g. Mellow Fellow Co., Ltd."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Tax ID (เลขประจำตัวผู้เสียภาษี)</label>
                      <input 
                        className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all" 
                        value={localCompanyTaxId} 
                        onChange={e => setLocalCompanyTaxId(e.target.value)} 
                        placeholder="e.g. 0105564000123"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Company Address</label>
                    <textarea 
                      className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-xs font-bold h-24 resize-none leading-relaxed focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all" 
                      value={localCompanyAddress} 
                      onChange={e => setLocalCompanyAddress(e.target.value)} 
                      placeholder="Legal registered address..."
                    />
                  </div>

                  <div className="border-t border-gray-100 pt-6 space-y-6">
                    <div className="flex items-center justify-between bg-[#F8F9FD] p-6 rounded-3xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <Percent size={18} className="text-indigo-500" />
                        <div>
                          <span className="text-sm font-black text-[#1A1F3D]">Enable VAT (ภาษีมูลค่าเพิ่ม)</span>
                          <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Apply VAT to sales transactions</p>
                        </div>
                      </div>
                      <Switch checked={localVatEnabled} onCheckedChange={setLocalVatEnabled} className="data-[state=checked]:bg-indigo-600" />
                    </div>

                    {localVatEnabled && (
                      <div className="space-y-2 max-w-xs animate-in slide-in-from-top-2 duration-200">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">VAT Rate (%)</label>
                        <div className="relative">
                          <Percent className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                          <input 
                            type="number"
                            className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all" 
                            value={localVatRate} 
                            onChange={e => setLocalVatRate(Number(e.target.value))} 
                            placeholder="7"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
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

            {/* Tab: LINE Integrations */}
            {activeTab === 'integrations' && (
              <div className="space-y-10">
                <section className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm space-y-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-black text-[#1A1F3D] mb-1">LINE Front-end Framework (LIFF)</h3>
                      <p className="text-xs text-gray-400 font-medium">เชื่อมต่อระบบ CRM และการจองคิวเข้ากับ LINE Official Account ของคุณ</p>
                    </div>
                    <div className={cn("flex items-center gap-3 px-4 py-2 rounded-2xl border", localLiffEnabled ? "bg-green-50 border-green-100" : "bg-gray-50 border-gray-100")}>
                       <span className={cn("text-[10px] font-black uppercase tracking-widest", localLiffEnabled ? "text-green-600" : "text-gray-400")}>{localLiffEnabled ? "Enabled" : "Disabled"}</span>
                       <Switch checked={localLiffEnabled} onCheckedChange={setLocalLiffEnabled} className="data-[state=checked]:bg-green-600" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">LIFF ID</label>
                      <input 
                        className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all" 
                        value={localLiffId} 
                        onChange={e => setLocalLiffId(e.target.value)} 
                        placeholder="e.g. 2001234567-AbCdEfGh"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Channel ID</label>
                      <input 
                        className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all" 
                        value={localLiffChannelId} 
                        onChange={e => setLocalLiffChannelId(e.target.value)} 
                        placeholder="e.g. 1657483920"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Channel Secret</label>
                      <input 
                        type="password"
                        className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all" 
                        value={localLiffChannelSecret} 
                        onChange={e => setLocalLiffChannelSecret(e.target.value)} 
                        placeholder="••••••••••••••••••••••••••••••••"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">LIFF URL (สำหรับนำไปใส่ใน LINE OA Rich Menu)</label>
                    <div className="flex gap-3">
                      <input 
                        className="flex-1 bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-xs font-mono text-gray-500 select-all" 
                        value={`https://liff.line.me/${localLiffId || 'liff-id'}`} 
                        readOnly 
                      />
                      <button 
                        type="button" 
                        onClick={handleCopyLiffUrl} 
                        className="bg-[#1A1F3D] text-white px-6 py-4 rounded-2xl font-black text-xs flex items-center gap-2 hover:bg-[#2A3152] transition-all"
                      >
                        <Copy size={14} /> Copy
                      </button>
                    </div>
                  </div>

                  <div className="p-8 bg-green-50/50 rounded-[40px] border border-green-100 flex items-start gap-4">
                     <div className="p-3 bg-white rounded-2xl shadow-sm text-green-600"><ShieldCheck size={20} /></div>
                     <div>
                        <p className="text-xs font-black text-green-900 mb-1">ขั้นตอนการตั้งค่า LINE LIFF</p>
                        <ol className="list-decimal list-inside text-[11px] text-green-800/80 leading-relaxed font-medium space-y-1.5 mt-2">
                          <li>ไปที่ <a href="https://developers.line.biz" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1 text-green-700 font-bold">LINE Developers Console <ExternalLink size={10} /></a></li>
                          <li>สร้าง Provider และสร้าง Channel ประเภท <b>LINE Login</b></li>
                          <li>ไปที่แท็บ <b>LIFF</b> แล้วกดสร้าง LIFF App ใหม่</li>
                          <li>คัดลอก <b>LIFF ID</b>, <b>Channel ID</b> และ <b>Channel Secret</b> มากรอกในหน้านี้</li>
                          <li>กำหนด Endpoint URL ใน LINE Developers เป็น URL ของแอปพลิเคชันนี้</li>
                        </ol>
                     </div>
                  </div>
                </section>
              </div>
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
      {isBroadcastModalOpen && <BroadcastModal onClose={() => setIsBroadcastModalOpen(false)} />}
      {isReceiptPreviewOpen && <ReceiptPreview shopName={localShopName} shopLogo={localShopLogo} shopAddress={localShopAddress} shopPhone={localShopPhone} header={localReceiptHeader} footer={localReceiptFooter} paperSize={localReceiptPaperSize} onClose={() => setIsReceiptPreviewOpen(false)} />}
    </main>
  );
};

export default Settings;