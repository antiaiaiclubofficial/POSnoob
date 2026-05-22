import { create } from 'zustand';
import { AppState, InventoryItem, Vendor, StockLog, TierRule, Staff, Log, Transaction, Service, AddonItem, PackageTemplate, CreditPackageTemplate, QueueItem } from './types';
import { createAuthSlice } from './slices/authSlice';
import { createCRMSlice } from './slices/crmSlice';

export * from './types';

const INITIAL_TIER_RULES: TierRule[] = [
  { level: 'Standard', label: 'Standard', minSpent: 0, discount: 0 },
  { level: 'Silver', label: 'Silver', minSpent: 5000, discount: 5 },
  { level: 'Gold', label: 'Gold', minSpent: 15000, discount: 10 },
  { level: 'VIP', label: 'VIP', minSpent: 50000, discount: 15 },
];

export const useStore = create<AppState>()((set, get, ...args) => ({
  // Core Settings
  language: 'th',
  setLanguage: (lang) => set({ language: lang }),
  shopName: "Tactile Sanctuary",
  shopLogo: null,
  shopAddress: "123 Pet Avenue, Bangkok",
  shopPhone: "02-123-4567",
  shopLineId: "@tactile",
  currency: "฿",
  shopIsOpen: true,
  receiptHeader: "Tax Invoice / Receipt",
  receiptFooter: "Thank you for visiting!",
  receiptPaperSize: '80mm',
  kennelCapacity: 12,
  slotDuration: 60,
  maxCapacity: 2,
  openTime: "09:00",
  closeTime: "19:00",
  recurringHolidays: [0], // Sunday
  specificHolidays: [],
  disabledSlots: [],
  
  updateBusinessProfile: (profile) => set((state) => ({ ...state, ...profile })),
  updateBookingSettings: (settings) => set((state) => ({ ...state, ...settings })),
  toggleSlotStatus: (time) => set((state) => ({
    disabledSlots: state.disabledSlots.includes(time) 
      ? state.disabledSlots.filter(t => t !== time)
      : [...state.disabledSlots, time]
  })),

  // Auth & CRM Slices
  ...createAuthSlice(set, get, ...args),
  ...createCRMSlice(set, get, ...args),

  // Inventory & WMS
  inventory: [],
  vendors: [],
  stockLogs: [],
  addInventoryItem: (item) => set((state) => ({
    inventory: [...state.inventory, { ...item, id: 'prod-' + Math.random().toString(36).substr(2, 5) }]
  })),
  updateInventoryItem: (id, item) => set((state) => ({
    inventory: state.inventory.map(i => i.id === id ? { ...i, ...item } : i)
  })),
  deleteInventoryItem: (id) => set((state) => ({
    inventory: state.inventory.filter(i => i.id !== id)
  })),
  adjustStock: (productId, amount, mode, reason) => {
    const item = get().inventory.find(i => i.id === productId);
    if (!item) return;
    const newStock = mode === 'Add' ? item.stock + amount : amount;
    get().updateInventoryItem(productId, { stock: newStock });
    get().addLog({ staffName: get().currentUser?.name || 'Admin', action: 'Stock Adjustment', details: `${item.name}: ${mode} ${amount} (${reason})`, type: 'info' });
  },

  addVendor: (vendor) => set((state) => ({
    vendors: [...state.vendors, { ...vendor, id: 'v-' + Math.random().toString(36).substr(2, 5) }]
  })),
  updateVendor: (id, vendor) => set((state) => ({
    vendors: state.vendors.map(v => v.id === id ? { ...v, ...vendor } : v)
  })),
  deleteVendor: (id) => set((state) => ({
    vendors: state.vendors.filter(v => v.id !== id)
  })),

  // POS & Transactions
  cart: [],
  addToCart: (item) => set((state) => ({ cart: [...state.cart, item] })),
  removeFromCart: (index) => set((state) => ({ cart: state.cart.filter((_, i) => i !== index) })),
  updateCartQuantity: (index, delta) => set((state) => ({
    cart: state.cart.map((item, i) => i === index ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item)
  })),
  clearCart: () => set({ cart: [] }),
  transactions: [],
  processPayment: (customerId, total, discount, items, method, details, isTaxInvoice) => {
    const tx: Transaction = {
      id: 'TX-' + Date.now(),
      customerId,
      customerName: get().customers.find(c => c.id === customerId)?.name || 'Unknown',
      amount: total,
      discountAmount: discount,
      items,
      paymentMethod: method,
      date: new Date().toISOString().split('T')[0],
      species: ['Dog'], // Mock
      bookingType: 'Appointment'
    };
    set(state => ({ transactions: [...state.transactions, tx] }));
  },
  deleteTransaction: (id) => set(state => ({ transactions: state.transactions.filter(t => t.id !== id) })),

  // Services & Addons
  services: [],
  addService: (service) => set(state => ({ services: [...state.services, { ...service, id: 's-' + Math.random().toString(36).substr(2, 5) }] })),
  updateService: (id, service) => set(state => ({ services: state.services.map(s => s.id === id ? { ...s, ...service } : s) })),
  deleteService: (id) => set(state => ({ services: state.services.filter(s => s.id !== id) })),
  toggleServiceActive: (id) => set(state => ({ services: state.services.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s) })),
  addons: [],
  addAddon: (addon) => set(state => ({ addons: [...state.addons, { ...addon, id: 'ad-' + Math.random().toString(36).substr(2, 5) }] })),
  updateAddon: (id, addon) => set(state => ({ addons: state.addons.map(a => a.id === id ? { ...a, ...addon } : a) })),
  deleteAddon: (id) => set(state => ({ addons: state.addons.filter(a => a.id !== id) })),

  // Staff & Logs
  staff: [],
  addStaff: (member) => set(state => ({ staff: [...state.staff, { ...member, id: 'st-' + Math.random().toString(36).substr(2, 5) }] })),
  updateStaff: (id, member) => set(state => ({ staff: state.staff.map(s => s.id === id ? { ...s, ...member } : s) })),
  deleteStaff: (id) => set(state => ({ staff: state.staff.filter(s => s.id !== id) })),
  logs: [],
  addLog: (log) => set(state => ({ 
    logs: [{ ...log, id: 'log-' + Date.now(), timestamp: new Date().toISOString() }, ...state.logs].slice(0, 1000) 
  })),

  // Loyalty & Packages
  tierRules: INITIAL_TIER_RULES,
  updateTierRules: (rules) => set({ tierRules: rules }),
  packageTemplates: [],
  addPackageTemplate: (pkg) => set(state => ({ packageTemplates: [...state.packageTemplates, { ...pkg, id: 'pkg-' + Math.random().toString(36).substr(2, 5) }] })),
  updatePackageTemplate: (id, pkg) => set(state => ({ packageTemplates: state.packageTemplates.map(p => p.id === id ? { ...p, ...pkg } : p) })),
  deletePackageTemplate: (id) => set(state => ({ packageTemplates: state.packageTemplates.filter(p => p.id !== id) })),
  assignPackageToCustomer: (customerId, templateId) => {},
  creditPackages: [],
  addCreditPackage: (pkg) => set(state => ({ creditPackages: [...state.creditPackages, { ...pkg, id: 'cr-' + Math.random().toString(36).substr(2, 5) }] })),
  updateCreditPackage: (id, pkg) => set(state => ({ creditPackages: state.creditPackages.map(p => p.id === id ? { ...p, ...pkg } : p) })),
  deleteCreditPackage: (id) => set(state => ({ creditPackages: state.creditPackages.filter(p => p.id !== id) })),
  buyCreditPackage: (customerId, packageId) => {},
}));