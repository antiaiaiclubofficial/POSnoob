"use client";

import { create } from 'zustand';
import { AppState } from './types';
import { createAuthSlice } from './slices/authSlice';
import { createCRMSlice } from './slices/crmSlice';

export const useStore = create<AppState>()((set, get, store) => ({
  language: 'th',
  currency: '฿',
  isAuthenticated: true,
  isAuthLoading: false,
  currentUser: { 
    id: 'admin', 
    name: 'Admin User', 
    role: 'Admin', 
    username: 'admin',
    phone: '000-000-0000',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'
  },
  storeId: 'default-store',

  // Business Profile
  shopName: 'Mellow Fellow Sanctuary',
  shopLogo: null,
  shopAddress: '123 Sukhumvit, Bangkok 10110',
  shopPhone: '02-999-9999',
  shopLineId: '@mellowfellow',
  shopIsOpen: true,
  receiptHeader: 'Tax Invoice / Receipt',
  receiptFooter: 'Thank you for your visit!',
  receiptPaperSize: '80mm',

  // CRM & Booking
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

  // Lists
  services: [],
  addons: [],
  inventory: [],
  vendors: [],
  partners: [],
  stockLogs: [],
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

  // Actions
  setLanguage: (lang) => set({ language: lang }),
  addLog: (log) => set(s => ({ 
    logs: [{ ...log, id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toISOString() }, ...s.logs] 
  })),

  updateBusinessProfile: (profile) => set(s => ({ ...s, ...profile })),
  updateBookingSettings: (settings) => set(s => ({ ...s, ...settings })),
  updateTierRules: (rules) => set({ tierRules: rules }),

  ...createAuthSlice(set, get, store),
  ...createCRMSlice(set, get, store),

  // Default implementations for missing POS/Inventory methods
  assignPackageToCustomer: (cid, tid) => {},
  addToCart: (item) => set((state) => ({ cart: [...state.cart, item] })),
  removeFromCart: (idx) => set((state) => ({ cart: state.cart.filter((_, i) => i !== idx) })),
  updateCartQuantity: (idx, delta) => set((state) => {
    const newCart = [...state.cart];
    newCart[idx].quantity = Math.max(1, (newCart[idx].quantity || 1) + delta);
    return { cart: newCart };
  }),
  clearCart: () => set({ cart: [] }),
  processPayment: () => {},
  deleteTransaction: (id) => set((state) => ({ transactions: state.transactions.filter(t => t.id !== id) })),
  addService: (ser) => set((state) => ({ services: [...state.services, { ...ser, id: Math.random().toString() }] })),
  updateService: (id, ser) => set((state) => ({ services: state.services.map(s => s.id === id ? { ...s, ...ser } : s) })),
  deleteService: (id) => set((state) => ({ services: state.services.filter(s => s.id !== id) })),
  toggleServiceActive: (id) => set((state) => ({ services: state.services.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s) })),
  addAddon: (ad) => set((state) => ({ addons: [...state.addons, { ...ad, id: Math.random().toString() }] })),
  updateAddon: (id, ad) => set((state) => ({ addons: state.addons.map(a => a.id === id ? { ...a, ...ad } : a) })),
  deleteAddon: (id) => set((state) => ({ addons: state.addons.filter(a => a.id !== id) })),
  addInventoryItem: (i) => set((state) => ({ inventory: [...state.inventory, { ...i, id: Math.random().toString() }] })),
  updateInventoryItem: (id, i) => set((state) => ({ inventory: state.inventory.map(item => item.id === id ? { ...item, ...i } : item) })),
  deleteInventoryItem: (id) => set((state) => ({ inventory: state.inventory.filter(item => item.id !== id) })),
  adjustStock: () => {},
  addStaff: (st) => set((state) => ({ staff: [...state.staff, { ...st, id: Math.random().toString() }] })),
  updateStaff: (id, st) => set((state) => ({ staff: state.staff.map(s => s.id === id ? { ...s, ...st } : s) })),
  deleteStaff: (id) => set((state) => ({ staff: state.staff.filter(s => s.id !== id) })),
  addPackageTemplate: (pkg) => set((state) => ({ packageTemplates: [...state.packageTemplates, { ...pkg, id: Math.random().toString() }] })),
  updatePackageTemplate: (id, pkg) => set((state) => ({ packageTemplates: state.packageTemplates.map(p => p.id === id ? { ...p, ...pkg } : p) })),
  deletePackageTemplate: (id) => set((state) => ({ packageTemplates: state.packageTemplates.filter(p => p.id !== id) })),
  addCreditPackage: (pkg) => set((state) => ({ creditPackages: [...state.creditPackages, { ...pkg, id: Math.random().toString() }] })),
  updateCreditPackage: (id, pkg) => set((state) => ({ creditPackages: state.creditPackages.map(p => p.id === id ? { ...p, ...pkg } : p) })),
  deleteCreditPackage: (id) => set((state) => ({ creditPackages: state.creditPackages.filter(p => p.id !== id) })),
  buyCreditPackage: () => {},
  verifyPassword: (pass) => pass === '1234',
  toggleSlotStatus: (time) => set(s => ({ 
    disabledSlots: s.disabledSlots.includes(time) ? s.disabledSlots.filter(t => t !== time) : [...s.disabledSlots, time] 
  })),
  addVendor: (v) => set(s => ({ vendors: [...s.vendors, { ...v, id: Math.random().toString() }] })),
  updateVendor: (id, v) => set(s => ({ vendors: s.vendors.map(vendor => vendor.id === id ? { ...vendor, ...v } : vendor) })),
  deleteVendor: (id) => set(s => ({ vendors: s.vendors.filter(v => v.id !== id) })),
}));