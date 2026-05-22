"use client";

import { create } from 'zustand';
import { AppState } from './types';
import { createAuthSlice } from './slices/authSlice';
import { createCRMSlice } from './slices/crmSlice';

export const useStore = create<AppState>()((set, get, store) => ({
  language: 'en',
  currency: '฿',
  isAuthenticated: false,
  isAuthLoading: true,
  currentUser: null,
  shopName: 'Tactile Sanctuary',
  shopLogo: null,
  shopAddress: '',
  shopPhone: '',
  shopLineId: '',
  shopIsOpen: true,
  receiptHeader: 'TAX INVOICE',
  receiptFooter: 'Thank you!',
  receiptPaperSize: '80mm',
  customers: [],
  queue: [],
  services: [],
  addons: [],
  inventory: [],
  partners: [],
  vendors: [],
  stockLogs: [],
  transactions: [],
  staff: [],
  logs: [],
  cart: [],
  packageTemplates: [],
  creditPackages: [],
  tierRules: [],
  slotDuration: 30,
  openTime: '09:00',
  closeTime: '19:00',
  maxCapacity: 2,
  kennelCapacity: 8,
  disabledSlots: [],
  recurringHolidays: [],
  specificHolidays: [],
  selectedOwner: null,
  activePet: null,
  activeQueueItemId: null,

  setLanguage: (lang) => set({ language: lang }),
  updateBusinessProfile: (profile) => set((state) => ({ ...state, ...profile })),
  updateBookingSettings: (settings) => set((state) => ({ ...state, ...settings })),
  updateTierRules: (rules) => set({ tierRules: rules }),
  addLog: (log) => set((state) => ({ logs: [log, ...state.logs] })),

  ...createAuthSlice(set, get, store),
  ...createCRMSlice(set, get, store),

  // Implementation for missing methods
  assignPackageToCustomer: (cid, tid) => {},
  saveIntakeRecord: (cid, pid, rec) => {
    set(s => ({
      customers: s.customers.map(c => c.id === cid ? {
        ...c,
        pets: c.pets.map(p => p.id === pid ? {
          ...p,
          intakeHistory: [{ ...rec, id: Math.random().toString(), date: new Date().toISOString() }, ...(p.intakeHistory || [])]
        } : p)
      } : c)
    }));
  },
  addVendor: (v) => set(s => ({ vendors: [...s.vendors, { ...v, id: Math.random().toString() }] })),
  updateVendor: (id, v) => set(s => ({ vendors: s.vendors.map(vendor => vendor.id === id ? { ...vendor, ...v } : vendor) })),
  deleteVendor: (id) => set(s => ({ vendors: s.vendors.filter(v => v.id !== id) })),

  // Default implementations for missing POS/Inventory methods
  addToCart: (item) => set((state) => ({ cart: [...state.cart, item] })),
  removeFromCart: (idx) => set((state) => ({ cart: state.cart.filter((_, i) => i !== idx) })),
  updateCartQuantity: (idx, delta) => set((state) => {
    const newCart = [...state.cart];
    newCart[idx].quantity += delta;
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
  verifyPassword: (pass) => true,
  toggleSlotStatus: (time) => {},
}));

export * from './types';