import { create } from 'zustand';
import { 
  AppState, QueueStatus, TierRule, MembershipLevel, Pet, Customer, 
  QueueItem, Service, InventoryItem, Vendor, Partner, StockLog, Transaction, 
  Staff, ActivityLog, AddonItem, PackageTemplate, CreditPackageTemplate, 
  PaymentMethod, ServicePriceInfo, SubService, BookingType, ServiceIcon, StaffRole 
} from './types';

// Re-export all types so components can import them from '@/store/useStore'
export type { 
  AppState, QueueStatus, TierRule, MembershipLevel, Pet, Customer, 
  QueueItem, Service, InventoryItem, Vendor, Partner, StockLog, Transaction, 
  Staff, ActivityLog, AddonItem, PackageTemplate, CreditPackageTemplate, 
  PaymentMethod, ServicePriceInfo, SubService, BookingType, ServiceIcon, StaffRole 
};

export const useStore = create<AppState>()((set, get) => ({
  language: 'th',
  setLanguage: (lang) => set({ language: lang }),
  currency: '฿',
  isAuthenticated: true,
  isAuthLoading: false,
  currentUser: { id: 'admin', name: 'Admin User', role: 'Admin', username: 'admin' },
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
  partners: [
    { id: 'p1', companyName: 'บริษัท เพ็ทฟู้ด จำกัด', gpRate: 20 }
  ],
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
  login: (id, pass) => true,
  loginWithGoogle: async () => {},
  setSession: (user) => {},
  logout: () => set({ isAuthenticated: false, currentUser: null, storeId: null }),
  verifyPassword: (pass) => pass === '1234',
  addLog: (log) => set(s => ({ 
    logs: [{ ...log, id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toISOString() } as ActivityLog, ...s.logs] 
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

  addVendor: (v) => set(s => ({ vendors: [...s.vendors, { ...v, id: Math.random().toString() }] })),
  updateVendor: (id, v) => set(s => ({ vendors: s.vendors.map(vendor => vendor.id === id ? { ...vendor, ...v } : vendor) })),
  deleteVendor: (id) => set(s => ({ vendors: s.vendors.filter(v => v.id !== id) })),

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