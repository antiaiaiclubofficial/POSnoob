import { create } from 'zustand';
import { AppState, Service, InventoryItem, Vendor, TierRule, Staff, PackageUsage, Transaction, TransactionItem, CustomerPackage, StockMovement, StockTakeRecord, IntakeRecord } from './types';
import { createAuthSlice } from './slices/authSlice';
import { createCRMSlice } from './slices/crmSlice';

export * from './types';

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
    subServices: [
      { name: 'ตัดเล็บ', price: 0 },
      { name: 'เช็ดหู', price: 0 },
      { name: 'แปรงฟัน (เพิ่ม)', price: 100 }
    ],
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
  { id: 'prod-1', name: 'Organic Shampoo', barcode: '8850000001', stock: 15, minStock: 5, price: 450, costPrice: 280, unit: 'Bottle', category: 'Supplies', isConsignment: false },
  { id: 'prod-2', name: 'Consigned Dog Treats', barcode: '8850000002', stock: 24, minStock: 10, price: 180, unit: 'Pack', category: 'Food', isConsignment: true, vendorId: 'v2', consignmentRate: 70 }
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
  stockMovements: [],
  stockTakeHistory: [],
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

  addToCart: (item) => set((state) => {
    // If it's a product and already in cart for same pet (or no pet), merge quantity
    if (item.type === 'Product') {
      const existingIdx = state.cart.findIndex(i => i.id === item.id && i.type === 'Product');
      if (existingIdx > -1) {
        const newCart = [...state.cart];
        newCart[existingIdx].quantity += item.quantity || 1;
        return { cart: newCart };
      }
    }
    return { cart: [...state.cart, { ...item, quantity: item.quantity || 1 }] };
  }),

  updateCartQuantity: (index, delta) => set((state) => {
    const newCart = [...state.cart];
    const item = newCart[index];
    if (!item) return state;
    
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      return { cart: state.cart.filter((_, i) => i !== index) };
    }
    
    newCart[index] = { ...item, quantity: newQty };
    return { cart: newCart };
  }),

  removeFromCart: (index) => set((state) => ({ cart: state.cart.filter((_, i) => i !== index) })),
  customAddToCart: (item) => set((state) => ({ cart: [...state.cart, item] })),
  clearCart: () => set({ cart: [], activeQueueItemId: null }),
  
  addService: (serviceData) => set((state) => ({ services: [...state.services, { ...serviceData, id: 'svc-' + Math.random().toString(36).substr(2, 5) }] })),
  updateService: (id, serviceData) => set((state) => ({ services: state.services.map(s => s.id === id ? { ...s, ...serviceData } : s) })),
  deleteService: (id) => set((state) => ({ services: state.services.filter(s => s.id !== id) })),
  toggleServiceActive: (id) => set((state) => ({ services: state.services.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s) })),

  addInventoryItem: (item) => set((state) => ({ inventory: [...state.inventory, { ...item, id: 'prod-' + Math.random().toString(36).substr(2, 5) }] })),
  
  updateInventoryItem: (id, item, reason = 'Manual Adjustment') => {
    const { inventory, adjustStock } = get();
    const oldItem = inventory.find(i => i.id === id);
    if (oldItem && item.stock !== undefined && item.stock !== oldItem.stock) {
      adjustStock(id, item.stock - oldItem.stock, 'Adjustment', reason);
    } else {
      set((state) => ({ inventory: state.inventory.map(i => i.id === id ? { ...i, ...item } : i) }));
    }
  },

  deleteInventoryItem: (id) => set((state) => ({ inventory: state.inventory.filter(i => i.id !== id) })),

  adjustStock: (id, amount, type, reason) => set((state) => {
    const itemIdx = state.inventory.findIndex(i => i.id === id);
    if (itemIdx === -1) return state;

    const item = state.inventory[itemIdx];
    const previousStock = item.stock;
    const currentStock = previousStock + amount;

    const movement: StockMovement = {
      id: 'm-' + Math.random().toString(36).substr(2, 9),
      itemId: id,
      itemName: item.name,
      type,
      quantity: Math.abs(amount),
      previousStock,
      currentStock,
      reason,
      timestamp: new Date().toISOString(),
      staffName: state.currentUser?.name || 'System'
    };

    const newInventory = [...state.inventory];
    newInventory[itemIdx] = { ...item, stock: currentStock };

    return {
      inventory: newInventory,
      stockMovements: [movement, ...state.stockMovements].slice(0, 500)
    };
  }),

  saveStockTake: (record) => set((state) => {
    const newRecord: StockTakeRecord = {
      ...record,
      id: 'st-' + Math.random().toString(36).substr(2, 9)
    };
    
    // Update inventory levels based on stock take
    const newInventory = state.inventory.map(item => {
      const takeItem = record.items.find(i => i.itemId === item.id);
      if (takeItem) {
        return { ...item, stock: takeItem.actualStock };
      }
      return item;
    });

    return {
      stockTakeHistory: [newRecord, ...state.stockTakeHistory],
      inventory: newInventory
    };
  }),

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

  saveIntakeRecord: (customerId, petId, record) => set((state) => ({
    customers: state.customers.map(c => {
      if (c.id !== customerId) return c;
      return {
        ...c,
        pets: c.pets.map(p => {
          if (p.id !== petId) return p;
          const newIntake: IntakeRecord = {
            ...record,
            id: 'intake-' + Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString()
          };
          return {
            ...p,
            intakeHistory: [newIntake, ...(p.intakeHistory || [])]
          };
        })
      };
    })
  })),

  processPayment: (customerId, amount, discount, items, method = 'Cash', details, isTaxInvoice = false) => {
    const { customers, transactions, queue, currentUser, inventory, adjustStock } = get();
    const today = new Date().toISOString().split('T')[0];
    
    const txItems: TransactionItem[] = items.map(item => {
      const invItem = inventory.find(i => i.id === item.id);
      if (invItem && item.type === 'Product') {
        adjustStock(invItem.id, -item.quantity, 'Out', `Sale: ${item.title}`);
      }
      return {
        id: item.id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
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
      itemsCount: items.reduce((acc, i) => acc + i.quantity, 0),
      items: txItems,
      processedBy: currentUser?.name || 'Admin User',
      staffId: relatedQueueItem?.staffId || 's2', 
      staffName: get().staff.find(s => s.id === (relatedQueueItem?.staffId || 's2'))?.name || 'Unknown',
      actualDuration,
      isTaxInvoice,
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