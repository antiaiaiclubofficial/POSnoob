import { create } from 'zustand';
import { AppState, TierRule, Partner } from './types';
import { createAuthSlice } from './slices/authSlice';
import { createCRMSlice } from './slices/crmSlice';

export const useStore = create<AppState>()((set, get) => ({
  ...createAuthSlice(set, get, []),
  ...createCRMSlice(set, get, []),

  // Business Profile
  shopName: 'Tactile Sanctuary',
  shopLogo: null,
  shopAddress: '123 Pet Street, Bangkok, Thailand',
  shopPhone: '02-123-4567',
  shopLineId: '@tactilesanctuary',
  shopIsOpen: true,
  currency: '฿',
  language: 'en',
  receiptHeader: 'TAX INVOICE / RECEIPT',
  receiptFooter: 'Thank you for choosing Tactile Sanctuary!',
  receiptPaperSize: '80mm',
  
  updateBusinessProfile: (data) => set((state) => ({ ...state, ...data })),
  setLanguage: (lang) => set({ language: lang }),

  // POS State
  cart: [],
  addToCart: (item) => set((state) => ({ cart: [...state.cart, item] })),
  removeFromCart: (index) => set((state) => ({ cart: state.cart.filter((_, i) => i !== index) })),
  updateCartQuantity: (index, delta) => set((state) => ({
    cart: state.cart.map((item, i) => i === index ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item)
  })),
  clearCart: () => set({ cart: [] }),
  
  // Catalog
  services: [],
  addons: [],
  inventory: [],
  partners: [],
  vendors: [],
  stockLogs: [],
  transactions: [],
  staff: [],
  logs: [],
  packageTemplates: [],
  creditPackages: [],
  tierRules: [
    { level: 'Standard', label: 'Standard', minSpent: 0, discount: 0 },
    { level: 'Silver', label: 'Silver', minSpent: 5000, discount: 5 },
    { level: 'Gold', label: 'Gold', minSpent: 15000, discount: 10 },
    { level: 'VIP', label: 'VIP', minSpent: 50000, discount: 15 },
  ],

  // Operations Defaults
  slotDuration: 30,
  openTime: '09:00',
  closeTime: '19:00',
  maxCapacity: 2,
  kennelCapacity: 10,
  disabledSlots: [],
  recurringHolidays: [],
  specificHolidays: [],

  // Actions
  addLog: (log) => set((state) => ({ 
    logs: [{ ...log, id: Math.random().toString(), timestamp: new Date().toISOString() }, ...state.logs] 
  })),
  updateBookingSettings: (data) => set((state) => ({ ...state, ...data })),
  toggleSlotStatus: (time) => set((state) => ({
    disabledSlots: state.disabledSlots.includes(time) 
      ? state.disabledSlots.filter(t => t !== time) 
      : [...state.disabledSlots, time]
  })),
  processPayment: (cid, total, disc, items, method, details, tax) => {
    // Add logic to save transaction
    const newTx = { id: 'TX' + Date.now(), date: new Date().toISOString().split('T')[0], amount: total, customerId: cid, items, paymentMethod: method, staffName: 'Admin', species: ['Dog'], bookingType: 'Walk-in' };
    set(s => ({ transactions: [newTx, ...s.transactions] }));
  },
  deleteTransaction: (id) => set(s => ({ transactions: s.transactions.filter(t => t.id !== id) })),
  addService: (s) => set(s => ({ services: [...s.services, { ...s, id: 'SER'+Date.now(), isActive: true }] })),
  updateService: (id, data) => set(s => ({ services: s.services.map(ser => ser.id === id ? { ...ser, ...data } : ser) })),
  deleteService: (id) => set(s => ({ services: s.services.map(ser => ser.id === id ? { ...ser, isActive: false } : ser) })),
  toggleServiceActive: (id) => set(s => ({ services: s.services.map(ser => ser.id === id ? { ...ser, isActive: !ser.isActive } : ser) })),
  addAddon: (a) => set(s => ({ addons: [...s.addons, { ...a, id: 'AD'+Date.now() }] })),
  updateAddon: (id, data) => set(s => ({ addons: s.addons.map(a => a.id === id ? { ...a, ...data } : a) })),
  deleteAddon: (id) => set(s => ({ addons: s.addons.filter(a => a.id !== id) })),
  addInventoryItem: (i) => set(s => ({ inventory: [...s.inventory, { ...i, id: 'INV'+Date.now() }] })),
  updateInventoryItem: (id, data) => set(s => ({ inventory: s.inventory.map(i => i.id === id ? { ...i, ...data } : i) })),
  deleteInventoryItem: (id) => set(s => ({ inventory: s.inventory.filter(i => i.id !== id) })),
  adjustStock: (id, qty, mode, reason) => set(s => {
     const item = s.inventory.find(i => i.id === id);
     if (!item) return s;
     const newStock = mode === 'Add' ? item.stock + qty : mode === 'Out' ? item.stock - qty : qty;
     return { 
       inventory: s.inventory.map(i => i.id === id ? { ...i, stock: newStock } : i),
       stockLogs: [{ id: 'LOG'+Date.now(), timestamp: new Date().toISOString(), productName: item.name, oldQty: item.stock, newQty: newStock, reason, staffName: 'Admin' }, ...s.stockLogs]
     };
  }),
  addStaff: (st) => set(s => ({ staff: [...s.staff, { ...st, id: 'ST'+Date.now() }] })),
  updateStaff: (id, data) => set(s => ({ staff: s.staff.map(st => st.id === id ? { ...st, ...data } : st) })),
  deleteStaff: (id) => set(s => ({ staff: s.staff.filter(st => st.id !== id) })),
  addPackageTemplate: (p) => set(s => ({ packageTemplates: [...s.packageTemplates, { ...p, id: 'PK'+Date.now() }] })),
  updatePackageTemplate: (id, data) => set(s => ({ packageTemplates: s.packageTemplates.map(p => p.id === id ? { ...p, ...data } : p) })),
  deletePackageTemplate: (id) => set(s => ({ packageTemplates: s.packageTemplates.filter(p => p.id !== id) })),
  assignPackageToCustomer: (cid, tid) => { /* logic */ },
  addCreditPackage: (p) => set(s => ({ creditPackages: [...s.creditPackages, { ...p, id: 'CP'+Date.now() }] })),
  updateCreditPackage: (id, data) => set(s => ({ creditPackages: s.creditPackages.map(p => p.id === id ? { ...p, ...data } : p) })),
  deleteCreditPackage: (id) => set(s => ({ creditPackages: s.creditPackages.filter(p => p.id !== id) })),
  buyCreditPackage: (cid, pid) => { /* logic */ },
  updateTierRules: (rules) => set({ tierRules: rules }),
  saveIntakeRecord: (cid, pid, rec) => { /* logic */ },
}));

export * from './types';