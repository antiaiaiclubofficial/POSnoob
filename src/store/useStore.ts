import { create } from 'zustand';
import { AppState, Service, InventoryItem, Vendor, TierRule, Staff, PackageUsage, Transaction, TransactionItem, CustomerPackage } from './types';
import { createAuthSlice } from './slices/authSlice';
import { createCRMSlice } from './slices/crmSlice';

export * from './types'; // Re-export for components that expect types here

const INITIAL_TIER_RULES: TierRule[] = [
  { level: 'Standard', label: 'Standard', minSpent: 0, discount: 0 },
  { level: 'Silver', label: 'Silver Member', minSpent: 500, discount: 5 },
  { level: 'Gold', label: 'Gold Member', minSpent: 1500, discount: 10 },
  { level: 'VIP', label: 'VIP Exclusive', minSpent: 5000, discount: 15 },
];

const INITIAL_STAFF: Staff[] = [
  { id: 's1', name: 'Alex Smith', role: 'Admin', phone: '081-111-2222', status: 'Active', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', username: 'alex', password: 'password', commissionRate: 10 },
  { id: 's2', name: 'Sarah Wilson', role: 'Groomer', phone: '081-333-4444', status: 'Active', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', username: 'sarah', password: 'password', commissionRate: 15 }
];

const INITIAL_SERVICES: Service[] = [
  {
    id: 'svc-bath',
    title: 'อาบน้ำสุนัข',
    description: 'อาบน้ำทำความสะอาด ล้างหู และตัดเล็บพื้นฐาน',
    category: 'Grooming',
    icon: 'bath',
    targetSpecies: 'Dog',
    isActive: true,
    subServices: ['ตัดเล็บ', 'เช็ดหู', 'เป่าขน'],
    prices: {
      'Small (<10kg)': { price: 350, duration: 45 },
      'Medium (10-25kg)': { price: 500, duration: 60 },
      'Large (>25kg)': { price: 750, duration: 90 }
    }
  }
];

const INITIAL_VENDORS: Vendor[] = [
  { id: 'v1', name: 'PetCare Co., Ltd.', contactPerson: 'Somchai', phone: '02-111-2222', email: 'sales@petcare.com', notes: 'Main supplier for shampoos' },
  { id: 'v2', name: 'Organic Pet Treats', contactPerson: 'Mary', phone: '089-888-7777', email: 'mary@organic.com', notes: 'Consignment partner for healthy snacks' }
];

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'prod-1', name: 'Organic Shampoo', stock: 15, minStock: 5, price: 450, unit: 'Bottle', category: 'Supplies', isConsignment: false },
  { id: 'prod-2', name: 'Consigned Dog Treats', stock: 24, minStock: 10, price: 180, unit: 'Pack', category: 'Food', isConsignment: true, vendorId: 'v2', consignmentRate: 70 }
];

export const useStore = create<AppState>()((set, get, ...args) => ({
  // Business Profile
  language: 'th',
  setLanguage: (lang) => set({ language: lang }),
  shopName: "Tactile Sanctuary",
  shopLogo: null,
  shopAddress: "123 Pet Street, Bangkok, Thailand",
  shopPhone: "02-xxx-xxxx",
  shopLineId: "@tactilesanctuary",
  receiptHeader: "Tactile Sanctuary - Premium Pet Care",
  receiptFooter: "Thank you for trusting us with your furry friend!",
  receiptPaperSize: '58mm',
  currency: "฿",
  shopIsOpen: true,
  recurringHolidays: [],
  specificHolidays: [],
  lineLiffId: "",
  lineChannelToken: "",

  // Slices
  ...createAuthSlice(set, get, ...args),
  ...createCRMSlice(set, get, ...args),

  // Operations State
  services: INITIAL_SERVICES,
  packageTemplates: [],
  inventory: INITIAL_INVENTORY,
  vendors: INITIAL_VENDORS,
  staff: INITIAL_STAFF,
  logs: [],
  cart: [],
  transactions: [],
  tierRules: INITIAL_TIER_RULES,

  // Booking Settings
  slotDuration: 30,
  maxCapacity: 2,
  openTime: "09:00",
  closeTime: "19:00",
  disabledSlots: [],
  kennelCapacity: 12,

  // Remaining Actions
  updateBusinessProfile: (profile) => set((state) => ({ ...state, ...profile })),

  addToCart: (item) => set((state) => ({ cart: [...state.cart, item] })),
  removeFromCart: (index) => set((state) => ({ cart: state.cart.filter((_, i) => i !== index) })),
  customAddToCart: (item) => set((state) => ({ cart: [...state.cart, item] })),
  clearCart: () => set({ cart: [], activeQueueItemId: null }),
  
  addService: (serviceData) => set((state) => ({ services: [...state.services, { ...serviceData, id: 'svc-' + Math.random().toString(36).substr(2, 5) }] })),
  updateService: (id, serviceData) => set((state) => ({ services: state.services.map(s => s.id === id ? { ...s, ...serviceData } : s) })),
  deleteService: (id) => set((state) => ({ services: state.services.filter(s => s.id !== id) })),
  toggleServiceActive: (id) => set((state) => ({ services: state.services.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s) })),

  addInventoryItem: (item) => set((state) => ({ inventory: [...state.inventory, { ...item, id: 'prod-' + Math.random().toString(36).substr(2, 5) }] })),
  updateInventoryItem: (id, item) => set((state) => ({ inventory: state.inventory.map(i => i.id === id ? { ...i, ...item } : i) })),
  deleteInventoryItem: (id) => set((state) => ({ inventory: state.inventory.filter(i => i.id !== id) })),
  adjustStock: (id, amount) => set((state) => ({ inventory: state.inventory.map(i => i.id === id ? { ...i, stock: i.stock + amount } : i) })),

  addVendor: (vendor) => set((state) => ({ vendors: [...state.vendors, { ...vendor, id: 'v-' + Math.random().toString(36).substr(2, 5) }] })),
  updateVendor: (id, vendor) => set((state) => ({ vendors: state.vendors.map(v => v.id === id ? { ...v, ...vendor } : v) })),
  deleteVendor: (id) => set((state) => ({ vendors: state.vendors.filter(v => v.id !== id) })),

  addPackageTemplate: (template) => set((state) => ({ packageTemplates: [...state.packageTemplates, { ...template, id: 'pkg-' + Math.random().toString(36).substr(2, 5) }] })),
  updatePackageTemplate: (id, template) => set((state) => ({ packageTemplates: state.packageTemplates.map(t => t.id === id ? { ...t, ...template } : t) })),
  deletePackageTemplate: (id) => set((state) => ({ packageTemplates: state.packageTemplates.filter(t => t.id !== id) })),
  assignPackageToCustomer: (customerId, templateId) => {
    const template = get().packageTemplates.find(t => t.id === templateId);
    if (!template) return;
    const newPackage: CustomerPackage = {
      id: 'cpkg-' + Math.random().toString(36).substr(2, 5),
      templateId: template.id,
      name: template.name,
      targetServiceId: template.serviceId,
      totalSlots: template.paidSlots + template.freeSlots,
      usedSlots: 0,
      remainingSlots: template.paidSlots + template.freeSlots,
      recurringFreebie: template.recurringFreebie,
      oneTimeFreebie: template.oneTimeFreebie ? { name: template.oneTimeFreebie, isUsed: false } : undefined,
      usageHistory: [],
      purchaseDate: new Date().toISOString().split('T')[0]
    };
    set((state) => ({
      customers: state.customers.map(c => c.id === customerId ? { ...c, packages: [...(c.packages || []), newPackage] } : c)
    }));
  },

  processPayment: (customerId, amount, discount, items, method = 'Cash', details) => {
    const { customers, transactions, queue, currentUser, inventory } = get();
    const today = new Date().toISOString().split('T')[0];
    
    const txItems: TransactionItem[] = items.map(item => {
      const invItem = inventory.find(i => i.id === item.id);
      if (invItem && item.type === 'Product') {
        get().adjustStock(invItem.id, -1);
      }
      return {
        id: item.id,
        title: item.title,
        price: item.price,
        type: item.type,
        isConsignment: invItem?.isConsignment || false,
        vendorId: invItem?.vendorId,
        consignmentRate: invItem?.consignmentRate
      };
    });

    if (method === 'Package' && details?.packageId) {
      set((state) => ({
        customers: state.customers.map(c => {
          if (c.id !== customerId) return c;
          return {
            ...c,
            packages: c.packages.map(pkg => {
              if (pkg.id !== details.packageId) return pkg;
              const usageRecord = { id: Math.random().toString(36).substr(2, 9), date: today, serviceName: items[0].title, isFreebie: false };
              return { ...pkg, usedSlots: pkg.usedSlots + 1, remainingSlots: pkg.remainingSlots - 1, usageHistory: [...pkg.usageHistory, usageRecord] };
            })
          };
        })
      }));
    }

    const relatedQueueItem = items[0]?.queueItemId ? queue.find(q => q.id === items[0].queueItemId) : null;
    let actualDuration = undefined;
    if (relatedQueueItem?.startTime && relatedQueueItem?.endTime) {
      const start = new Date(relatedQueueItem.startTime).getTime();
      const end = new Date(relatedQueueItem.endTime).getTime();
      actualDuration = Math.round((end - start) / 60000); 
    }

    const newTransaction: Transaction = {
      id: 'tx-' + Math.random().toString(36).substr(2, 9),
      date: today,
      amount: method === 'Package' ? 0 : amount,
      discountAmount: discount,
      customerId: customerId,
      customerName: customers.find(c => c.id === customerId)?.name || 'Unknown',
      species: Array.from(new Set(items.map(item => {
        const cust = customers.find(c => c.id === customerId);
        const pet = cust?.pets.find(p => p.id === item.petId);
        return pet?.species || 'Other';
      }))),
      paymentMethod: method,
      bookingType: relatedQueueItem ? 'Appointment' : 'Walk-in',
      itemsCount: items.length,
      items: txItems,
      processedBy: currentUser?.name || 'Admin User',
      staffId: relatedQueueItem?.staffId || 's2', 
      staffName: get().staff.find(s => s.id === (relatedQueueItem?.staffId || 's2'))?.name || 'Unknown',
      actualDuration,
      paymentDetails: details
    };

    set({ transactions: [...transactions, newTransaction] });
    get().recalculateCustomerStats(customerId);
  },

  updateTransaction: (id, data) => set((state) => ({ transactions: state.transactions.map(t => t.id === id ? { ...t, ...data } : t) })),
  deleteTransaction: (id) => set((state) => ({ transactions: state.transactions.filter(t => t.id !== id) })),
  recalculateCustomerStats: (customerId) => {
    const { transactions, customers, tierRules } = get();
    const customerTransactions = transactions.filter(t => t.customerId === customerId);
    const totalSpent = customerTransactions.reduce((acc, t) => acc + t.amount, 0);
    const points = Math.floor(totalSpent);
    const sortedRules = [...tierRules].sort((a, b) => b.minSpent - a.minSpent);
    const membership = sortedRules.find(r => totalSpent >= r.minSpent)?.level || 'Standard';
    set((state) => ({
      customers: state.customers.map(c => c.id === customerId ? { ...c, totalSpent, points, membership: membership as any } : c)
    }));
  },

  updateTierRules: (rules) => set({ tierRules: rules }),
  
  addStaff: (staffData) => set((state) => ({ staff: [...state.staff, { ...staffData, id: 's' + Math.random().toString(36).substr(2, 4) }] })),
  updateStaff: (id, staffData) => set((state) => ({ staff: state.staff.map(s => s.id === id ? { ...s, ...staffData } : s) })),
  deleteStaff: (id) => set((state) => ({ staff: state.staff.filter(s => s.id !== id) })),
  addLog: (logData) => set((state) => ({
    logs: [{ ...logData, id: 'l' + Math.random().toString(36).substr(2, 6), timestamp: new Date().toISOString() }, ...state.logs].slice(0, 100)
  })),

  updateBookingSettings: (settings) => set((state) => ({ ...state, ...settings })),
  toggleSlotStatus: (time) => set((state) => ({
    disabledSlots: state.disabledSlots.includes(time) ? state.disabledSlots.filter(t => t !== time) : [...state.disabledSlots, time]
  }))
}));