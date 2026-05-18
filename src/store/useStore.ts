import { create } from 'zustand';
import { Language } from '@/utils/translations';
import { supabase } from '@/integrations/supabase/client';

export type ServiceIcon = 'grooming' | 'bath' | 'spa' | 'nail' | 'dry' | 'health' | 'brush' | 'hotel' | 'love' | 'food' | 'premium';
export type MembershipLevel = 'Standard' | 'Silver' | 'Gold' | 'VIP';
export type QueueStatus = 'Waiting' | 'Checked-in' | 'In Progress' | 'Completed';
export type PaymentMethod = 'Cash' | 'Transfer' | 'Credit Card' | 'Package';
export type StaffRole = 'Admin' | 'Groomer' | 'Assistant';
export type BookingType = 'Appointment' | 'Walk-in';

export interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  price: number;
  costPrice?: number;
  unit: string;
  category: string;
  image?: string;
  isConsignment: boolean;
  vendorId?: string;
  consignmentRate?: number; // % that goes to vendor
}

export interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  notes: string;
}

export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  phone: string;
  status: 'Active' | 'Inactive';
  avatar: string;
  username?: string;
  password?: string;
  commissionRate: number; 
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  staffName: string;
  action: string;
  details: string;
  type: 'info' | 'success' | 'warning' | 'danger';
}

export interface WeightEntry {
  date: string;
  value: number;
}

export interface ServiceHistoryEntry {
  id: string;
  date: string;
  serviceName: string;
  price: number;
  size?: string;
}

export interface PackageUsage {
  id: string;
  date: string;
  serviceName: string;
  isFreebie: boolean;
}

export interface CustomerPackage {
  id: string;
  templateId: string;
  name: string;
  targetServiceId: string;
  totalSlots: number; 
  usedSlots: number;
  remainingSlots: number;
  recurringFreebie?: string;
  oneTimeFreebie?: {
    name: string;
    isUsed: boolean;
  };
  usageHistory: PackageUsage[];
  purchaseDate: string;
  expiryDate?: string;
}

export interface PackageTemplate {
  id: string;
  name: string;
  serviceId: string;
  paidSlots: number;
  freeSlots: number;
  price: number;
  recurringFreebie?: string;
  oneTimeFreebie?: string;
}

export interface Pet {
  id: string;
  name: string;
  species: 'Dog' | 'Cat' | 'Other';
  breed: string;
  birthday: string;
  weightHistory: WeightEntry[];
  serviceHistory: ServiceHistoryEntry[];
  notes: string;
  image: string;
}

export interface Customer {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  age?: string;
  phone: string;
  email: string;
  membership: MembershipLevel;
  points: number;
  pets: Pet[];
  packages: CustomerPackage[];
  totalSpent: number;
  lineId?: string;
  houseNo?: string;
  villageNo?: string;
  soi?: string;
  road?: string;
  subDistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
}

export interface TransactionItem {
  id: string;
  title: string;
  price: number;
  type: 'Service' | 'Product';
  isConsignment: boolean;
  vendorId?: string;
  consignmentRate?: number;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  discountAmount: number;
  customerId: string;
  customerName: string;
  species: ('Dog' | 'Cat' | 'Other')[];
  paymentMethod: PaymentMethod;
  bookingType: BookingType;
  itemsCount: number;
  items: TransactionItem[];
  staffId: string; 
  staffName: string;
  processedBy: string;
  actualDuration?: number; 
  paymentDetails?: {
    cashReceived?: number;
    change?: number;
    cardLast4?: string;
    cardType?: string;
    referenceNo?: string;
    packageId?: string;
  };
}

export interface TierRule {
  level: MembershipLevel;
  label: string;
  minSpent: number;
  discount: number;
}

export interface ServicePriceInfo {
  price: number;
  duration: number;
}

export interface Service {
  id: string;
  icon: ServiceIcon;
  title: string;
  description: string;
  subServices: string[];
  category: string;
  targetSpecies: 'Dog' | 'Cat';
  prices: Record<string, ServicePriceInfo>;
  isActive: boolean;
  isPopular?: boolean;
}

export interface QueueItem {
  id: string;
  petId: string;
  petName: string;
  ownerName: string;
  serviceName: string;
  date: string;
  time: string;
  status: QueueStatus;
  image: string;
  isPaid?: boolean;
  staffId?: string;
  startTime?: string; 
  endTime?: string;   
}

export interface CartItem {
  id: string;
  icon?: ServiceIcon;
  title: string;
  price: number;
  petId?: string;
  petName?: string;
  ownerName?: string;
  size?: string;
  queueItemId?: string;
  staffId?: string;
  staffName?: string;
  isPackageUsage?: boolean;
  type: 'Service' | 'Product';
}

interface AppState {
  language: Language;
  setLanguage: (lang: Language) => void;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  currentUser: { id: string; name: string; role: string; username?: string; email?: string; avatar?: string } | null;
  storeId: string | null;
  shopName: string;
  shopLogo: string | null;
  shopAddress: string;
  shopPhone: string;
  shopLineId: string;
  receiptHeader: string;
  receiptFooter: string;
  receiptPaperSize: '58mm' | '80mm';
  currency: string;
  shopIsOpen: boolean;
  recurringHolidays: number[];
  specificHolidays: string[];
  
  lineLiffId: string;
  lineChannelToken: string;
  
  services: Service[];
  packageTemplates: PackageTemplate[];
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
  staff: Staff[];
  inventory: InventoryItem[];
  vendors: Vendor[];
  logs: ActivityLog[];
  cart: CartItem[];
  queue: QueueItem[];
  transactions: Transaction[];
  tierRules: TierRule[];
  selectedOwner: Customer | null;
  activePet: Pet | null;
  activeQueueItemId: string | null;
  
  slotDuration: number;
  maxCapacity: number;
  openTime: string;
  closeTime: string;
  disabledSlots: string[];
  kennelCapacity: number;
  
  login: (id: string, pass: string) => boolean;
  loginWithGoogle: () => Promise<void>;
  setSession: (user: any) => void;
  verifyPassword: (pass: string) => boolean;
  logout: () => Promise<void>;
  
  updateBusinessProfile: (profile: { 
    shopName?: string, 
    shopLogo?: string | null,
    shopAddress?: string,
    shopPhone?: string,
    shopLineId?: string,
    receiptHeader?: string,
    receiptFooter?: string,
    receiptPaperSize?: '58mm' | '80mm',
    currency?: string,
    shopIsOpen?: boolean,
    recurringHolidays?: number[],
    specificHolidays?: string[],
    lineLiffId?: string,
    lineChannelToken?: string
  }) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (index: number) => void;
  customAddToCart: (item: CartItem) => void;
  clearCart: () => void;
  
  addService: (service: Omit<Service, 'id'>) => void;
  updateService: (id: string, service: Partial<Service>) => void;
  deleteService: (id: string) => void;
  toggleServiceActive: (id: string) => void;
  
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (id: string, item: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  adjustStock: (id: string, amount: number) => void;

  addVendor: (vendor: Omit<Vendor, 'id'>) => void;
  updateVendor: (id: string, vendor: Partial<Vendor>) => void;
  deleteVendor: (id: string) => void;

  addPackageTemplate: (template: Omit<PackageTemplate, 'id'>) => void;
  updatePackageTemplate: (id: string, template: Partial<PackageTemplate>) => void;
  deletePackageTemplate: (id: string) => void;
  assignPackageToCustomer: (customerId: string, templateId: string) => void;

  selectOwner: (owner: Customer | null) => void;
  setActivePet: (pet: Pet | null) => void;
  setActiveQueueItem: (id: string | null) => void;
  
  addBooking: (booking: Omit<QueueItem, 'id'>) => void;
  updateQueueStatus: (id: string, status: QueueStatus) => void;
  removeQueueItem: (id: string) => void;
  markAsPaid: (queueItemId: string) => void;

  addCustomer: (customer: Omit<Customer, 'id' | 'points' | 'pets' | 'packages' | 'totalSpent'>) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  bindLineToCustomer: (customerId: string, lineId: string) => void;
  addPet: (customerId: string, pet: Omit<Pet, 'id'>) => void;
  updatePet: (customerId: string, petId: string, pet: Partial<Pet>) => void;
  updatePetWeight: (customerId: string, petId: string, weight: number) => void;
  processPayment: (customerId: string, amount: number, discount: number, items: CartItem[], method?: PaymentMethod, details?: Transaction['paymentDetails']) => void;
  
  updateTransaction: (id: string, data: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  recalculateCustomerStats: (customerId: string) => void;

  updateTierRules: (rules: TierRule[]) => void;
  
  addStaff: (staff: Omit<Staff, 'id'>) => void;
  updateStaff: (id: string, staff: Partial<Staff>) => void;
  deleteStaff: (id: string) => void;
  addLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;

  updateBookingSettings: (settings: { slotDuration?: number, maxCapacity?: number, openTime?: string, closeTime?: string, kennelCapacity?: number }) => void;
  toggleSlotStatus: (time: string) => void;
}

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
  { id: 'prod-1', name: 'Organic Shampoo', stock: 15, minStock: 5, price: 450, costPrice: 280, unit: 'Bottle', category: 'Supplies', isConsignment: false },
  { id: 'prod-2', name: 'Consigned Dog Treats', stock: 24, minStock: 10, price: 180, unit: 'Pack', category: 'Food', isConsignment: true, vendorId: 'v2', consignmentRate: 70 }
];

export const useStore = create<AppState>((set, get) => ({
  language: 'th',
  setLanguage: (lang) => set({ language: lang }),
  isAuthenticated: false,
  isAuthLoading: true,
  currentUser: null,
  storeId: null,
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
  
  services: INITIAL_SERVICES,
  packageTemplates: [],
  customers: [],
  setCustomers: (customers) => set({ customers }),
  inventory: INITIAL_INVENTORY,
  vendors: INITIAL_VENDORS,
  staff: INITIAL_STAFF,
  logs: [],
  cart: [],
  queue: [],
  transactions: [],
  tierRules: INITIAL_TIER_RULES,
  selectedOwner: null,
  activePet: null,
  activeQueueItemId: null,
  
  slotDuration: 30,
  maxCapacity: 2,
  openTime: "09:00",
  closeTime: "19:00",
  disabledSlots: [],
  kennelCapacity: 12,

  login: (id, pass) => {
    const { addLog } = get();
    if (id === 'admin' && pass === '1234') {
      const user = { id: 'admin', name: 'Admin', role: 'Admin', username: 'admin' };
      set({ isAuthenticated: true, currentUser: user, storeId: 'default-store', isAuthLoading: false });
      addLog({ staffName: 'System', action: 'Login Success', details: 'Super Admin logged into the system', type: 'success' });
      return true;
    }
    const member = get().staff.find(s => s.username === id && s.password === pass && s.status === 'Active');
    if (member) {
      const user = { id: member.id, name: member.name, role: member.role, username: member.username };
      set({ isAuthenticated: true, currentUser: user, storeId: 'default-store', isAuthLoading: false });
      addLog({ staffName: 'System', action: 'Login Success', details: `Staff member ${member.name} logged in`, type: 'success' });
      return true;
    }
    return false;
  },

  loginWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
  },

  setSession: (user) => {
    if (user) {
      const storeIdFromMetadata = user.user_metadata?.store_id || 'default-store';
      set({ 
        isAuthenticated: true, 
        isAuthLoading: false,
        currentUser: {
          id: user.id,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: 'Admin', 
          email: user.email,
          avatar: user.user_metadata?.avatar_url || undefined 
        },
        storeId: storeIdFromMetadata
      });
    } else {
      set({ isAuthenticated: false, isAuthLoading: false, currentUser: null, storeId: null });
    }
  },

  verifyPassword: (pass) => {
    const { currentUser, staff } = get();
    if (!currentUser) return false;
    if (currentUser.username === 'admin') return pass === '1234';
    const member = staff.find(s => s.username === currentUser.username);
    return member?.password === pass;
  },
  
  logout: async () => {
    await supabase.auth.signOut();
    set({ isAuthenticated: false, currentUser: null, storeId: null });
  },
  
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

  selectOwner: (owner) => set({ selectedOwner: owner, activePet: owner ? owner.pets[0] : null, activeQueueItemId: null }),
  setActivePet: (pet) => set({ activePet: pet }),
  setActiveQueueItem: (id) => set({ activeQueueItemId: id }),

  addBooking: (booking) => set((state) => ({
    queue: [...state.queue, { ...booking, id: Math.random().toString(36).substr(2, 9), isPaid: false }].sort((a, b) => a.time.localeCompare(b.time))
  })),

  updateQueueStatus: (id, status) => {
    const now = new Date().toISOString();
    set((state) => ({
      queue: state.queue.map(q => {
        if (q.id !== id) return q;
        let update: Partial<QueueItem> = { status };
        if (status === 'In Progress') update.startTime = now;
        if (status === 'Completed') update.endTime = now;
        return { ...q, ...update };
      })
    }));
  },

  removeQueueItem: (id) => set((state) => ({ queue: state.queue.filter(q => q.id !== id) })),
  markAsPaid: (id) => set((state) => ({ queue: state.queue.map(q => q.id === id ? { ...q, isPaid: true } : q) })),

  addCustomer: (customerData) => set((state) => ({
    customers: [...state.customers, { ...customerData, id: 'c' + Math.random().toString(36).substr(2, 4), points: 0, pets: [], packages: [], totalSpent: 0 }]
  })),
  updateCustomer: (id, customerData) => set((state) => ({ customers: state.customers.map(c => c.id === id ? { ...c, ...customerData } : c) })),
  deleteCustomer: (id) => set((state) => ({
    customers: state.customers.filter(c => c.id !== id),
    selectedOwner: state.selectedOwner?.id === id ? null : state.selectedOwner,
    activePet: state.selectedOwner?.id === id ? null : state.activePet
  })),
  bindLineToCustomer: (customerId, lineId) => set((state) => ({ customers: state.customers.map(c => c.id === customerId ? { ...c, lineId } : c) })),
  addPet: (customerId, petData) => set((state) => ({
    customers: state.customers.map(c => c.id === customerId ? {
      ...c,
      pets: [...c.pets, { ...petData, id: 'p' + Math.random().toString(36).substr(2, 4), serviceHistory: [] }]
    } : c)
  })),
  updatePet: (customerId, petId, petData) => set((state) => ({
    customers: state.customers.map(c => c.id === customerId ? {
      ...c,
      pets: c.pets.map(p => p.id === petId ? { ...p, ...petData } : p)
    } : c)
  })),
  updatePetWeight: (customerId, petId, weight) => set((state) => ({
    customers: state.customers.map(c => c.id === customerId ? {
      ...c,
      pets: c.pets.map(p => p.id === petId ? {
        ...p,
        weightHistory: [...p.weightHistory, { date: new Date().toISOString().split('T')[0], value: weight }]
      } : p)
    } : c)
  })),

  processPayment: (customerId, amount, discount, items, method = 'Cash', details) => {
    const { customers, transactions, queue, currentUser, inventory } = get();
    const today = new Date().toISOString().split('T')[0];
    
    // Deduct Stock and collect transaction item details
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
      customers: state.customers.map(c => c.id === customerId ? { ...c, totalSpent, points, membership: membership as MembershipLevel } : c)
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