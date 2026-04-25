import { create } from 'zustand';

export type ServiceIcon = 'grooming' | 'bath' | 'spa' | 'nail' | 'dry' | 'health' | 'brush' | 'hotel' | 'love' | 'food' | 'premium';
export type MembershipLevel = 'Standard' | 'Silver' | 'Gold' | 'VIP';
export type QueueStatus = 'Waiting' | 'Checked-in' | 'In Progress' | 'Completed';
export type PaymentMethod = 'Cash' | 'Transfer' | 'Credit Card';
export type StaffRole = 'Admin' | 'Groomer' | 'Assistant';
export type BookingType = 'Appointment' | 'Walk-in';

export interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  unit: string;
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
  phone: string;
  email: string;
  membership: MembershipLevel;
  points: number;
  pets: Pet[];
  totalSpent: number;
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
  staffName?: string;
  processedBy: string;
  paymentDetails?: {
    cashReceived?: number;
    change?: number;
    cardLast4?: string;
    cardType?: string;
    referenceNo?: string;
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
}

export interface CartItem {
  id: string;
  icon: ServiceIcon;
  title: string;
  price: number;
  petId: string;
  petName: string;
  ownerName: string;
  size?: string;
  queueItemId?: string;
  staffName?: string;
}

interface AppState {
  isAuthenticated: boolean;
  currentUser: { name: string; role: string; username?: string } | null;
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
  customers: Customer[];
  staff: Staff[];
  inventory: InventoryItem[];
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
  verifyPassword: (pass: string) => boolean;
  logout: () => void;
  
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
  clearCart: () => void;
  
  addService: (service: Omit<Service, 'id'>) => void;
  updateService: (id: string, service: Partial<Service>) => void;
  deleteService: (id: string) => void;
  toggleServiceActive: (id: string) => void;
  
  selectOwner: (owner: Customer | null) => void;
  setActivePet: (pet: Pet | null) => void;
  setActiveQueueItem: (id: string | null) => void;
  
  addBooking: (booking: Omit<QueueItem, 'id'>) => void;
  updateQueueStatus: (id: string, status: QueueStatus) => void;
  removeQueueItem: (id: string) => void;
  markAsPaid: (queueItemId: string) => void;

  addCustomer: (customer: Omit<Customer, 'id' | 'points' | 'pets' | 'totalSpent'>) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
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
  { id: 's1', name: 'Alex Smith', role: 'Admin', phone: '081-111-2222', status: 'Active', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', username: 'alex', password: 'password' },
  { id: 's2', name: 'Sarah Wilson', role: 'Groomer', phone: '081-333-4444', status: 'Active', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', username: 'sarah', password: 'password' }
];

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'inv1', name: 'Sensitive Shampoo', stock: 3, minStock: 5, unit: 'Bottle' },
  { id: 'inv2', name: 'Pet Perfume (Classic)', stock: 12, minStock: 5, unit: 'Bottle' },
  { id: 'inv3', name: 'Hair Conditioning Cream', stock: 2, minStock: 8, unit: 'Tub' },
];

const INITIAL_LOGS: ActivityLog[] = [
  { id: 'l1', timestamp: new Date().toISOString(), staffName: 'System', action: 'Store Initialized', details: 'The application store was successfully created.', type: 'info' }
];

export const useStore = create<AppState>((set, get) => ({
  isAuthenticated: false,
  currentUser: null,
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
  
  services: [],
  customers: [],
  inventory: INITIAL_INVENTORY,
  staff: INITIAL_STAFF,
  logs: INITIAL_LOGS,
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
      const user = { name: 'Admin', role: 'Admin', username: 'admin' };
      set({ isAuthenticated: true, currentUser: user });
      addLog({ staffName: 'System', action: 'Login Success', details: 'Super Admin logged into the system', type: 'success' });
      return true;
    }
    const member = get().staff.find(s => s.username === id && s.password === pass && s.status === 'Active');
    if (member) {
      const user = { name: member.name, role: member.role, username: member.username };
      set({ isAuthenticated: true, currentUser: user });
      addLog({ staffName: 'System', action: 'Login Success', details: `Staff member ${member.name} logged in`, type: 'success' });
      return true;
    }
    addLog({ staffName: 'System', action: 'Login Failed', details: `Failed login attempt with ID: ${id}`, type: 'danger' });
    return false;
  },

  verifyPassword: (pass) => {
    const { currentUser, staff } = get();
    if (!currentUser) return false;
    if (currentUser.username === 'admin') return pass === '1234';
    const member = staff.find(s => s.username === currentUser.username);
    return member?.password === pass;
  },
  
  logout: () => {
    const { currentUser, addLog } = get();
    if (currentUser) {
      addLog({ staffName: 'System', action: 'Logout', details: `${currentUser.name} signed out of the system`, type: 'info' });
    }
    set({ isAuthenticated: false, currentUser: null });
  },
  
  updateBusinessProfile: (profile) => {
    const { currentUser, addLog } = get();
    set((state) => ({
      ...state,
      shopName: profile.shopName ?? state.shopName,
      shopLogo: profile.shopLogo !== undefined ? profile.shopLogo : state.shopLogo,
      shopAddress: profile.shopAddress ?? state.shopAddress,
      shopPhone: profile.shopPhone ?? state.shopPhone,
      shopLineId: profile.shopLineId ?? state.shopLineId,
      receiptHeader: profile.receiptHeader ?? state.receiptHeader,
      receiptFooter: profile.receiptFooter ?? state.receiptFooter,
      receiptPaperSize: profile.receiptPaperSize ?? state.receiptPaperSize,
      currency: profile.currency ?? state.currency,
      shopIsOpen: profile.shopIsOpen ?? state.shopIsOpen,
      recurringHolidays: profile.recurringHolidays ?? state.recurringHolidays,
      specificHolidays: profile.specificHolidays ?? state.specificHolidays,
      lineLiffId: profile.lineLiffId ?? state.lineLiffId,
      lineChannelToken: profile.lineChannelToken ?? state.lineChannelToken,
    }));
    addLog({ staffName: currentUser?.name || 'Unknown', action: 'Update Business Profile', details: 'Modified shop settings', type: 'warning' });
  },

  addToCart: (item) => set((state) => ({ cart: [...state.cart, item] })),
  removeFromCart: (index) => set((state) => ({ cart: state.cart.filter((_, i) => i !== index) })),
  clearCart: () => set({ cart: [], activeQueueItemId: null }),
  
  addService: (serviceData) => {
    const { currentUser, addLog } = get();
    set((state) => ({
      services: [...state.services, { ...serviceData, id: 'svc-' + Math.random().toString(36).substr(2, 5) }]
    }));
    addLog({ staffName: currentUser?.name || 'Unknown', action: 'Add Service', details: `Created: ${serviceData.title}`, type: 'info' });
  },
  updateService: (id, serviceData) => {
    const { currentUser, addLog, services } = get();
    const service = services.find(s => s.id === id);
    set((state) => ({
      services: state.services.map(s => s.id === id ? { ...s, ...serviceData } : s)
    }));
    addLog({ staffName: currentUser?.name || 'Unknown', action: 'Update Service', details: `Modified: ${service?.title}`, type: 'warning' });
  },
  deleteService: (id) => {
    const { currentUser, addLog, services } = get();
    const service = services.find(s => s.id === id);
    set((state) => ({
      services: state.services.filter(s => s.id !== id)
    }));
    addLog({ staffName: currentUser?.name || 'Unknown', action: 'Delete Service', details: `Removed: ${service?.title}`, type: 'danger' });
  },
  toggleServiceActive: (id) => {
    const { currentUser, addLog, services } = get();
    const service = services.find(s => s.id === id);
    set((state) => ({
      services: state.services.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s)
    }));
    addLog({ staffName: currentUser?.name || 'Unknown', action: 'Toggle Service', details: `Visibility: ${service?.title}`, type: 'info' });
  },

  selectOwner: (owner) => set({ selectedOwner: owner, activePet: owner ? owner.pets[0] : null, activeQueueItemId: null }),
  setActivePet: (pet) => set({ activePet: pet }),
  setActiveQueueItem: (id) => set({ activeQueueItemId: id }),

  addBooking: (booking) => {
    const { currentUser, addLog } = get();
    set((state) => ({
      queue: [...state.queue, { ...booking, id: Math.random().toString(36).substr(2, 9), isPaid: false }].sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      })
    }));
    addLog({ staffName: currentUser?.name || 'Unknown', action: 'New Booking', details: `Booked ${booking.petName}`, type: 'success' });
  },
  updateQueueStatus: (id, status) => {
    const { currentUser, addLog, queue } = get();
    const item = queue.find(q => q.id === id);
    set((state) => ({
      queue: state.queue.map(q => q.id === id ? { ...q, status } : q)
    }));
    addLog({ staffName: currentUser?.name || 'Unknown', action: 'Queue Status Change', details: `${item?.petName} -> ${status}`, type: 'info' });
  },
  removeQueueItem: (id) => {
    const { currentUser, addLog, queue } = get();
    const item = queue.find(q => q.id === id);
    set((state) => ({
      queue: state.queue.filter(q => q.id !== id)
    }));
    addLog({ staffName: currentUser?.name || 'Unknown', action: 'Cancel Booking', details: `Removed ${item?.petName}`, type: 'danger' });
  },
  markAsPaid: (id) => set((state) => ({
    queue: state.queue.map(q => q.id === id ? { ...q, isPaid: true } : q)
  })),

  addCustomer: (customerData) => {
    const { currentUser, addLog } = get();
    set((state) => ({
      customers: [...state.customers, { ...customerData, id: 'c' + Math.random().toString(36).substr(2, 4), points: 0, pets: [], totalSpent: 0 }]
    }));
    addLog({ staffName: currentUser?.name || 'Unknown', action: 'Add Customer', details: `New client: ${customerData.name}`, type: 'success' });
  },
  updateCustomer: (id, customerData) => {
    const { currentUser, addLog, customers } = get();
    const customer = customers.find(c => c.id === id);
    set((state) => ({
      customers: state.customers.map(c => c.id === id ? { ...c, ...customerData } : c)
    }));
    addLog({ staffName: currentUser?.name || 'Unknown', action: 'Update Customer', details: `Modified: ${customer?.name}`, type: 'warning' });
  },
  addPet: (customerId, petData) => {
    const { currentUser, addLog, customers } = get();
    const customer = customers.find(c => c.id === customerId);
    set((state) => ({
      customers: state.customers.map(c => c.id === customerId ? {
        ...c,
        pets: [...c.pets, { ...petData, id: 'p' + Math.random().toString(36).substr(2, 4), serviceHistory: [] }]
      } : c)
    }));
    addLog({ staffName: currentUser?.name || 'Unknown', action: 'Register Pet', details: `Added ${petData.name} to ${customer?.name}`, type: 'info' });
  },
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
    const { customers, tierRules, transactions, addLog, currentUser, currency } = get();
    const today = new Date().toISOString().split('T')[0];
    const isAppointment = items.some(item => !!item.queueItemId);
    
    const newTransaction: Transaction = {
      id: 'tx-' + Math.random().toString(36).substr(2, 9),
      date: today,
      amount: amount,
      discountAmount: discount,
      customerId: customerId,
      customerName: customers.find(c => c.id === customerId)?.name || 'Unknown',
      species: Array.from(new Set(items.map(item => {
        const cust = customers.find(c => c.id === customerId);
        const pet = cust?.pets.find(p => p.id === item.petId);
        return pet?.species || 'Other';
      }))),
      paymentMethod: method,
      bookingType: isAppointment ? 'Appointment' : 'Walk-in',
      itemsCount: items.length,
      processedBy: currentUser?.name || 'Admin User',
      staffName: items[0]?.staffName || 'Sarah Wilson',
      paymentDetails: details
    };

    set({ transactions: [...transactions, newTransaction] });
    get().recalculateCustomerStats(customerId);
    
    addLog({
      staffName: currentUser?.name || 'Admin',
      action: 'Checkout Complete',
      details: `Received ${currency}${amount.toLocaleString()} from ${newTransaction.customerName}`,
      type: 'success'
    });
  },

  updateTransaction: (id, data) => {
    const { currentUser, addLog, transactions } = get();
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    set((state) => ({
      transactions: state.transactions.map(t => t.id === id ? { ...t, ...data } : t)
    }));

    if (tx.customerId) {
      get().recalculateCustomerStats(tx.customerId);
    }

    addLog({
      staffName: currentUser?.name || 'Admin',
      action: 'Update Bill',
      details: `Modified transaction ${id} (${tx.customerName})`,
      type: 'warning'
    });
  },

  deleteTransaction: (id) => {
    const { currentUser, addLog, transactions } = get();
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    set((state) => ({
      transactions: state.transactions.filter(t => t.id !== id)
    }));

    if (tx.customerId) {
      get().recalculateCustomerStats(tx.customerId);
    }

    addLog({
      staffName: currentUser?.name || 'Admin',
      action: 'Delete Bill',
      details: `Permanently removed transaction ${id} for ${tx.customerName}`,
      type: 'danger'
    });
  },

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

    const currentSelected = get().selectedOwner;
    if (currentSelected?.id === customerId) {
      set({ selectedOwner: { ...currentSelected, totalSpent, points, membership: membership as MembershipLevel } });
    }
  },

  updateTierRules: (rules) => {
    const { currentUser, addLog } = get();
    set({ tierRules: rules });
    addLog({ staffName: currentUser?.name || 'Unknown', action: 'Update Membership Rules', details: 'Modified tiers', type: 'warning' });
  },

  addStaff: (staffData) => {
    const { currentUser, addLog } = get();
    const newStaff = { ...staffData, id: 's' + Math.random().toString(36).substr(2, 4) };
    set((state) => ({ staff: [...state.staff, newStaff] }));
    addLog({ staffName: currentUser?.name || 'Admin', action: 'Staff Hired', details: `Added ${newStaff.name}`, type: 'info' });
  },
  updateStaff: (id, staffData) => set((state) => ({
    staff: state.staff.map(s => s.id === id ? { ...s, ...staffData } : s)
  })),
  deleteStaff: (id) => set((state) => ({
    staff: state.staff.filter(s => s.id !== id)
  })),
  addLog: (logData) => set((state) => ({
    logs: [{ ...logData, id: 'l' + Math.random().toString(36).substr(2, 6), timestamp: new Date().toISOString() }, ...state.logs].slice(0, 100)
  })),

  updateBookingSettings: (settings) => set((state) => ({ ...state, ...settings })),
  toggleSlotStatus: (time) => set((state) => ({
    disabledSlots: state.disabledSlots.includes(time) ? state.disabledSlots.filter(t => t !== time) : [...state.disabledSlots, time]
  }))
}));