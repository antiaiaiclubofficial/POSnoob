import { create } from 'zustand';
import { 
  AppState, QueueStatus, TierRule, MembershipLevel, Pet, Customer, 
  QueueItem, Service, InventoryItem, Partner, StockLog, Transaction, 
  Staff, ActivityLog, AddonItem, PackageTemplate, CreditPackageTemplate, 
  PaymentMethod, ServicePriceInfo, SubService, BookingType, ServiceIcon, StaffRole, ReportHistory 
} from './types';

export type { 
  AppState, QueueStatus, TierRule, MembershipLevel, Pet, Customer, 
  QueueItem, Service, InventoryItem, Partner, StockLog, Transaction, 
  Staff, ActivityLog, AddonItem, PackageTemplate, CreditPackageTemplate, 
  PaymentMethod, ServicePriceInfo, SubService, BookingType, ServiceIcon, StaffRole, ReportHistory 
};

export const useStore = create<AppState>()((set, get) => ({
  language: 'th',
  setLanguage: (lang) => set({ language: lang }),
  currency: '฿',
  isAuthenticated: true,
  isAuthLoading: false,
  currentUser: { id: 'admin', name: 'Admin User', role: 'Admin', username: 'admin' },
  storeId: 'default-store',

  shopName: 'Mellow Fellow Sanctuary',
  shopLogo: null,
  shopAddress: '123 Sukhumvit, Bangkok 10110',
  shopPhone: '02-999-9999',
  shopLineId: '@mellowfellow',
  shopIsOpen: true,
  receiptHeader: 'Tax Invoice / Receipt',
  receiptFooter: 'Thank you for your visit!',
  receiptPaperSize: '80mm',

  // LINE LIFF Default Settings
  liffId: '2001234567-aBcDeFgH',
  lineChannelId: '2001234567',
  lineChannelSecret: '8f9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c',
  lineChannelToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',

  customers: [],
  selectedOwner: null,
  activePet: null,
  activeQueueItemId: null,
  queue: [],
  slotDuration: 60,
  openTime: '09:00',
  closeTime: '19:00',
  maxCapacity: 3,
  disabledSlots: [],
  recurringHolidays: [0], 
  specificHolidays: [],
  kennelCapacity: 12,

  services: [],
  addons: [],
  inventory: [],
  partners: [
    { 
      id: 'p1', 
      companyName: 'บริษัท เพ็ทฟู้ด จำกัด', 
      gpRate: 20,
      contactPerson: 'คุณสมชาย',
      phone: '081-234-5678',
      email: 'contact@petfood.com',
      notes: 'ส่งสินค้าทุกวันจันทร์',
      mainCategory: 'อาหารสัตว์'
    }
  ],
  stockLogs: [],
  reportHistory: [],
  transactions: [],
  staff: [],
  logs: [],
  cart: [],
  packageTemplates: [],
  creditPackages: [],
  tierRules: [
    { level: 'Standard', label: 'Standard', minSpent: 0, discount: 0 },
    { level: 'Silver', label: 'Silver Member', minSpent: 5000, discount: 5 },
    { level: 'Gold', label: 'Gold Member', minSpent: 15000, discount: 10 },
    { level: 'VIP', label: 'VIP Member', minSpent: 50000, discount: 15 },
  ],

  login: (id, pass) => true,
  loginWithGoogle: async () => {},
  setSession: (user) => {},
  logout: () => set({ isAuthenticated: false, currentUser: null, storeId: null }),
  verifyPassword: (pass) => pass === '1234',
  addLog: (log) => set(s => ({ 
    logs: [{ ...log, id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toISOString() } as ActivityLog, ...s.logs] 
  })),
  addReportLog: (log) => set(s => ({
    reportHistory: [{ ...log, id: `REP-${Math.random().toString(36).substr(2, 5).toUpperCase()}`, timestamp: new Date().toISOString() }, ...s.reportHistory]
  })),

  updateBusinessProfile: (profile) => set(s => ({ ...s, ...profile })),
  updateBookingSettings: (settings) => set(s => ({ ...s, ...settings })),
  updateTierRules: (rules) => set({ tierRules: rules }),

  setCustomers: (customers) => set({ customers }),
  selectOwner: (owner) => set({ selectedOwner: owner, activePet: owner ? owner.pets[0] : null, activeQueueItemId: null }),
  setActivePet: (pet) => set({ activePet: pet }),
  setActiveQueueItem: (id) => set({ activeQueueItemId: id }),
  addCustomer: (data) => set(s => ({ customers: [...s.customers, { ...data, id: Math.random().toString(), pets: [], totalSpent: 0, creditBalance: 0 }] })),
  updateCustomer: (id, data) => set(s => ({ customers: s.customers.map(c => c.id === id ? { ...c, ...data } : c) })),
  deleteCustomer: (id) => set(s => ({ customers: s.customers.filter(c => c.id !== id) })),
  bindLineToCustomer: (cid, lid) => set(s => ({ customers: s.customers.map(c => c.id === cid ? { ...c, lineId: lid } : c) })),

  addPet: (cid, pet) => set(s => ({ customers: s.customers.map(c => c.id === cid ? { ...c, pets: [...c.pets, { ...pet, id: Math.random().toString() }] } : c) })),
  updatePet: (cid, pid, data) => set(s => ({ customers: s.customers.map(c => c.id === cid ? { ...c, pets: c.pets.map(p => p.id === pid ? { ...p, ...data } : p) } : c) })),
  updatePetWeight: (cid, pid, w) => set(s => ({ customers: s.customers.map(c => c.id === cid ? { ...c, pets: c.pets.map(p => p.id === pid ? { ...p, weightHistory: [...p.weightHistory, { date: new Date().toISOString(), value: w }] } : p) } : c) })),
  saveIntakeRecord: (cid, pid, rec) => {},

  addBooking: (b) => set(s => ({ queue: [...s.queue, { ...b, id: Math.random().toString() }] })),
  updateQueueStatus: (id, status) => set(s => ({ queue: s.queue.map(q => q.id === id ? { ...q, status } : q) })),
  removeQueueItem: (id) => set(s => ({ queue: s.queue.filter(q => q.id !== id) })),
  toggleSlotStatus: (time) => set(s => ({ disabledSlots: s.disabledSlots.includes(time) ? s.disabledSlots.filter(t => t !== time) : [...s.disabledSlots, time] })),
  markAsPaid: (id) => set(s => ({ queue: s.queue.map(q => q.id === id ? { ...q, isPaid: true } : q) })),

  addToCart: (item) => set(s => ({ cart: [...s.cart, item] })),
  removeFromCart: (idx) => set(s => ({ cart: s.cart.filter((_, i) => i !== idx) })),
  updateCartQuantity: (idx, delta) => set(s => ({ cart: s.cart.map((item, i) => i === idx ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item) })),
  clearCart: () => set({ cart: [] }),
  processPayment: (cid, total, disc, items, method, details, tax) => {
    const tx = { id: `TX-${Date.now()}`, date: new Date().toISOString().split('T')[0], amount: total, discountAmount: disc, customerId: cid, customerName: get().customers.find(c => c.id === cid)?.name || 'Walk-in', items, paymentMethod: method, staffName: 'Admin', species: [], bookingType: 'Walk-in' };
    set(s => ({ transactions: [tx as any, ...s.transactions] }));
  },
  deleteTransaction: (id) => set(s => ({ transactions: s.transactions.filter(t => t.id !== id) })),

  addService: (ser) => set(s => ({ services: [...s.services, { ...ser, id: Math.random().toString() }] })),
  updateService: (id, ser) => set(s => ({ services: s.services.map(s => s.id === id ? { ...s, ...ser } : s) })),
  deleteService: (id) => set(s => ({ services: s.services.filter(s => s.id !== id) })),
  toggleServiceActive: (id) => set(s => ({ services: s.services.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s) })),

  addAddon: (ad) => set(s => ({ addons: [...s.addons, { ...ad, id: Math.random().toString() }] })),
  updateAddon: (id, ad) => set(s => ({ addons: s.addons.map(a => a.id === id ? { ...a, ...ad } : a) })),
  deleteAddon: (id) => set(s => ({ addons: s.addons.filter(a => a.id !== id) })),

  addInventoryItem: (i) => set(s => ({ inventory: [...s.inventory, { ...i, id: Math.random().toString() }] })),
  updateInventoryItem: (id, i) => set(s => ({ inventory: s.inventory.map(item => item.id === id ? { ...item, ...i } : item) })),
  deleteInventoryItem: (id) => set(s => ({ inventory: s.inventory.filter(i => i.id !== id) })),
  adjustStock: (id, qty, mode, reason) => {
    const item = get().inventory.find(i => i.id === id);
    if (!item) return;
    const oldQty = item.stock;
    const newQty = mode === 'Add' || mode === 'In' ? oldQty + qty : mode === 'Out' ? oldQty - qty : qty;
    set(s => ({ inventory: s.inventory.map(i => i.id === id ? { ...i, stock: newQty } : i) }));
  },

  addPartner: (v) => set(s => ({ partners: [...s.partners, { ...v, id: Math.random().toString() }] })),
  updatePartner: (id, v) => set(s => ({ partners: s.partners.map(p => p.id === id ? { ...p, ...v } : p) })),
  deletePartner: (id) => set(s => ({ partners: s.partners.filter(p => p.id !== id) })),

  addStaff: (st) => set(s => ({ staff: [...s.staff, { ...st, id: Math.random().toString() }] })),
  updateStaff: (id, st) => set(s => ({ staff: s.staff.map(mem => mem.id === id ? { ...mem, ...st } : mem) })),
  deleteStaff: (id) => set(s => ({ staff: s.staff.filter(mem => mem.id !== id) })),

  addPackageTemplate: (pkg) => set(s => ({ packageTemplates: [...s.packageTemplates, { ...pkg, id: Math.random().toString() }] })),
  updatePackageTemplate: (id, pkg) => set(s => ({ packageTemplates: s.packageTemplates.map(p => p.id === id ? { ...p, ...pkg } : p) })),
  deletePackageTemplate: (id) => set(s => ({ packageTemplates: s.packageTemplates.filter(p => p.id !== id) })),
  assignPackageToCustomer: (cid, tid) => {},

  addCreditPackage: (pkg) => set(s => ({ creditPackages: [...s.creditPackages, { ...pkg, id: Math.random().toString() }] })),
  updateCreditPackage: (id, pkg) => set(s => ({ creditPackages: s.creditPackages.map(p => p.id === id ? { ...p, ...pkg } : p) })),
  deleteCreditPackage: (id) => set(s => ({ creditPackages: s.creditPackages.filter(p => p.id !== id) })),
  buyCreditPackage: (cid, pid) => {},
}));
</dyad-file>

<dyad-write path="src/pages/Settings.tsx" description="เพิ่มแท็บ LINE LIFF และฟอร์มการตั้งค่าการเชื่อมต่อ LINE Mini App">
"use client";

import React, { useState, useRef } from 'react';
import { 
  Store, Save, Clock, AlertCircle, Camera, Eye, Globe, ChevronRight, Send, MessageSquare, Key, ShieldAlert, Copy
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

type SettingTab = 'profile' | 'operations' | 'liff' | 'system';

const Settings = () => {
  const { 
    shopName, shopLogo, shopAddress, shopPhone, shopLineId, currency, shopIsOpen,
    receiptHeader, receiptFooter, receiptPaperSize,
    liffId, lineChannelId, lineChannelSecret, lineChannelToken,
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

  // LINE LIFF Local States
  const [localLiffId, setLocalLiffId] = useState(liffId || '');
  const [localLineChannelId, setLocalLineChannelId] = useState(lineChannelId || '');
  const [localLineChannelSecret, setLocalLineChannelSecret] = useState(lineChannelSecret || '');
  const [localLineChannelToken, setLocalLineChannelToken] = useState(lineChannelToken || '');

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
      lineChannelId: localLineChannelId,
      lineChannelSecret: localLineChannelSecret,
      lineChannelToken: localLineChannelToken,
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
    const url = `https://liff.line.me/${localLiffId}`;
    navigator.clipboard.writeText(url);
    toast.success("คัดลอก LIFF URL เรียบร้อยแล้ว");
  };

  const navItems = [
    { id: 'profile', label: 'Store Profile', icon: Store, desc: 'Identity & Contacts' },
    { id: 'operations', label: 'Operations', icon: Clock, desc: 'Hours & Booking Rules' },
    { id: 'liff', label: 'LINE LIFF', icon: MessageSquare, desc: 'LINE Mini App Integration' },
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

            {/* Tab: LINE LIFF */}
            {activeTab === 'liff' && (
              <div className="space-y-10">
                <section className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm space-y-8">
                  <div>
                    <h3 className="text-xl font-black text-[#1A1F3D] mb-1">LINE LIFF Integration</h3>
                    <p className="text-xs text-gray-400 font-medium">เชื่อมต่อระบบจองคิวและ CRM เข้ากับ LINE Mini App เพื่อให้ลูกค้าใช้งานผ่าน LINE OA ได้ทันที</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">LIFF ID</label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                        <input 
                          className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-6 py-4 text-sm font-bold" 
                          placeholder="เช่น 2001234567-aBcDeFgH"
                          value={localLiffId} 
                          onChange={e => setLocalLiffId(e.target.value)} 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">LINE Channel ID</label>
                      <div className="relative">
                        <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                        <input 
                          className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-6 py-4 text-sm font-bold" 
                          placeholder="เช่น 2001234567"
                          value={localLineChannelId} 
                          onChange={e => setLocalLineChannelId(e.target.value)} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">LINE Channel Secret</label>
                    <input 
                      type="password"
                      className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" 
                      placeholder="ระบุ Channel Secret จาก LINE Developers Console"
                      value={localLineChannelSecret} 
                      onChange={e => setLocalLineChannelSecret(e.target.value)} 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Channel Access Token</label>
                    <textarea 
                      className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-xs font-bold h-24 resize-none leading-relaxed" 
                      placeholder="ระบุ Long-lived Channel Access Token"
                      value={localLineChannelToken} 
                      onChange={e => setLocalLineChannelToken(e.target.value)} 
                    />
                  </div>
                </section>

                {/* LIFF URL Preview Card */}
                {localLiffId && (
                  <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-4 animate-in zoom-in-95">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-black text-[#1A1F3D] uppercase tracking-wider">Your LIFF URL</h4>
                        <p className="text-[10px] text-gray-400 font-bold">คัดลอกลิงก์นี้ไปใส่ใน Rich Menu หรือปุ่มใน LINE OA ของคุณ</p>
                      </div>
                      <button 
                        onClick={handleCopyLiffUrl}
                        className="p-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-[#1A1F3D] transition-all flex items-center gap-2 text-xs font-bold"
                      >
                        <Copy size={14} /> คัดลอกลิงก์
                      </button>
                    </div>
                    <div className="bg-[#F5F6FA] p-4 rounded-2xl border border-gray-100 font-mono text-xs text-blue-600 select-all break-all">
                      https://liff.line.me/{localLiffId}
                    </div>
                  </section>
                )}

                <section className="bg-amber-50/50 p-8 rounded-[40px] border border-amber-100 flex items-start gap-4">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm text-amber-500"><ShieldAlert size={20} /></div>
                  <div>
                    <p className="text-xs font-black text-amber-900 mb-1">ขั้นตอนการตั้งค่าบน LINE Developers</p>
                    <ol className="list-decimal list-inside text-[11px] text-amber-800/70 leading-relaxed font-medium space-y-1 mt-2">
                      <li>สร้าง Provider และสร้าง LINE Login Channel ใน LINE Developers Console</li>
                      <li>ไปที่แท็บ LIFF แล้วกด Add เพื่อสร้าง LIFF App ใหม่</li>
                      <li>คัดลอก LIFF ID มากรอกในช่องด้านบน</li>
                      <li>ตั้งค่า Endpoint URL ใน LINE Developers ให้ชี้มาที่ URL ของระบบนี้</li>
                    </ol>
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