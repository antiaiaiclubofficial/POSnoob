import { create } from 'zustand';

export type ServiceIcon = 'grooming' | 'bath' | 'spa' | 'nail' | 'dry' | 'health' | 'brush' | 'hotel' | 'love' | 'food' | 'premium';
export type MembershipLevel = 'Standard' | 'Silver' | 'Gold' | 'VIP';
export type QueueStatus = 'Waiting' | 'Checked-in' | 'In Progress' | 'Completed';
export type PaymentMethod = 'Cash' | 'Transfer' | 'Credit Card';
export type StaffRole = 'Admin' | 'Groomer' | 'Assistant';
export type BookingType = 'Appointment' | 'Walk-in';

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
  currentUser: { name: string; role: string } | null;
  shopName: string;
  shopLogo: string | null;
  shopAddress: string;
  shopPhone: string;
  shopLineId: string;
  receiptHeader: string;
  currency: string;
  shopIsOpen: boolean;
  recurringHolidays: number[];
  
  lineLiffId: string;
  lineChannelToken: string;
  
  services: Service[];
  customers: Customer[];
  staff: Staff[];
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
  
  login: (id: string, pass: string) => boolean;
  logout: () => void;
  
  updateBusinessProfile: (profile: { 
    shopName?: string, 
    shopLogo?: string | null,
    shopAddress?: string,
    shopPhone?: string,
    shopLineId?: string,
    receiptHeader?: string,
    currency?: string,
    shopIsOpen?: boolean,
    recurringHolidays?: number[],
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
  updateTierRules: (rules: TierRule[]) => void;
  
  addStaff: (staff: Omit<Staff, 'id'>) => void;
  updateStaff: (id: string, staff: Partial<Staff>) => void;
  deleteStaff: (id: string) => void;
  addLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;

  updateBookingSettings: (settings: { slotDuration?: number, maxCapacity?: number, openTime?: string, closeTime?: string }) => void;
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
  receiptHeader: "Thank you for visiting us!",
  currency: "฿",
  shopIsOpen: true,
  recurringHolidays: [],
  lineLiffId: "",
  lineChannelToken: "",
  
  services: [],
  customers: [],
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

  login: (id, pass) => {
    const { addLog } = get();
    // Check super admin
    if (id === 'admin' && pass === '1234') {
      const user = { name: 'Admin', role: 'Admin' };
      set({ isAuthenticated: true, currentUser: user });
      addLog({ staffName: 'System', action: 'Login Success', details: 'Super Admin logged into the system', type: 'success' });
      return true;
    }
    // Check registered staff
    const member = get().staff.find(s => s.username === id && s.password === pass && s.status === 'Active');
    if (member) {
      const user = { name: member.name, role: member.role };
      set({ isAuthenticated: true, currentUser: user });
      addLog({ staffName: 'System', action: 'Login Success', details: `Staff member ${member.name} logged in`, type: 'success' });
      return true;
    }
    addLog({ staffName: 'System', action: 'Login Failed', details: `Failed login attempt with ID: ${id}`, type: 'danger' });
    return false;
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
      currency: profile.currency ?? state.currency,
      shopIsOpen: profile.shopIsOpen ?? state.shopIsOpen,
      recurringHolidays: profile.recurringHolidays ?? state.recurringHolidays,
      lineLiffId: profile.lineLiffId ?? state.lineLiffId,
      lineChannelToken: profile.lineChannelToken ?? state.lineChannelToken,
    }));
    addLog({ 
      staffName: currentUser?.name || 'Unknown', 
      action: 'Update Business Profile', 
      details: 'Modified shop settings or contact information', 
      type: 'warning' 
    });
  },

  addToCart: (item) => set((state) => ({ cart: [...state.cart, item] })),
  removeFromCart: (index) => set((state) => ({ cart: state.cart.filter((_, i) => i !== index) })),
  clearCart: () => set({ cart: [], activeQueueItemId: null }),
  
  addService: (serviceData) => {
    const { currentUser, addLog } = get();
    set((state) => ({
      services: [...state.services, { ...serviceData, id: 'svc-' + Math.random().toString(36).substr(2, 5) }]
    }));
    addLog({ staffName: currentUser?.name || 'Unknown', action: 'Add Service', details: `Created new service: ${serviceData.title}`, type: 'info' });
  },
  updateService: (id, serviceData) => {
    const { currentUser, addLog, services } = get();
    const service = services.find(s => s.id === id);
    set((state) => ({
      services: state.services.map(s => s.id === id ? { ...s, ...serviceData } : s)
    }));
    addLog({ staffName: currentUser?.name || 'Unknown', action: 'Update Service', details: `Modified service details for: ${service?.title || id}`, type: 'warning' });
  },
  deleteService: (id) => {
    const { currentUser, addLog, services } = get();
    const service = services.find(s => s.id === id);
    set((state) => ({
      services: state.services.filter(s => s.id !== id)
    }));
    addLog({ staffName: currentUser?.name || 'Unknown', action: 'Delete Service', details: `Removed service: ${service?.title || id}`, type: 'danger' });
  },
  toggleServiceActive: (id) => {
    const { currentUser, addLog, services } = get();
    const service = services.find(s => s.id === id);
    set((state) => ({
      services: state.services.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s)
    }));
    addLog({ staffName: currentUser?.name || 'Unknown', action: 'Toggle Service', details: `Changed visibility for: ${service?.title || id}`, type: 'info' });
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
    addLog({ staffName: currentUser?.name || 'Unknown', action: 'New Booking', details: `Booked ${booking.petName} for ${booking.date} at ${booking.time}`, type: 'success' });
  },
  updateQueueStatus: (id, status) => {
    const { currentUser, addLog, queue } = get();
    const item = queue.find(q => q.id === id);
    set((state) => ({
      queue: state.queue.map(q => q.id === id ? { ...q, status } : q)
    }));
    addLog({ staffName: currentUser?.name || 'Unknown', action: 'Queue Status Change', details: `Moved ${item?.petName} to status: ${status}`, type: 'info' });
  },
  removeQueueItem: (id) => {
    const { currentUser, addLog, queue } = get();
    const item = queue.find(q => q.id === id);
    set((state) => ({
      queue: state.queue.filter(q => q.id !== id)
    }));
    addLog({ staffName: currentUser?.name || 'Unknown', action: 'Cancel Booking', details: `Removed ${item?.petName} from queue`, type: 'danger' });
  },
  markAsPaid: (id) => set((state) => ({
    queue: state.queue.map(q => q.id === id ? { ...q, isPaid: true } : q)
  })),

  addCustomer: (customerData) => {
    const { currentUser, addLog } = get();
    set((state) => ({
      customers: [
        ...state.customers,
        {
          ...customerData,
          id: 'c' + Math.random().toString(36).substr(2, 4),
          points: 0,
          pets: [],
          totalSpent: 0
        }
      ]
    }));
    addLog({ staffName: currentUser?.name || 'Unknown', action: 'Add Customer', details: `Registered new customer: ${customerData.name}`, type: 'success' });
  },
  updateCustomer: (id, customerData) => {
    const { currentUser, addLog, customers } = get();
    const customer = customers.find(c => c.id === id);
    set((state) => ({
      customers: state.customers.map(c => c.id === id ? { ...c, ...customerData } : c)
    }));
    addLog({ staffName: currentUser?.name || 'Unknown', action: 'Update Customer', details: `Modified profile for: ${customer?.name || id}`, type: 'warning' });
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
    addLog({ staffName: currentUser?.name || 'Unknown', action: 'Register Pet', details: `Added ${petData.name} to owner: ${customer?.name}`, type: 'info' });
  },
  updatePet: (customerId, petId, petData) => {
    const { currentUser, addLog } = get();
    set((state) => ({
      customers: state.customers.map(c => c.id === customerId ? {
        ...c,
        pets: c.pets.map(p => p.id === petId ? { ...p, ...petData } : p)
      } : c)
    }));
    addLog({ staffName: currentUser?.name || 'Unknown', action: 'Update Pet Profile', details: `Modified pet details`, type: 'warning' });
  },
  updatePetWeight: (customerId, petId, weight) => {
    const { currentUser, addLog, customers } = get();
    const customer = customers.find(c => c.id === customerId);
    const pet = customer?.pets.find(p => p.id === petId);
    set((state) => ({
      customers: state.customers.map(c => c.id === customerId ? {
        ...c,
        pets: c.pets.map(p => p.id === petId ? {
          ...p,
          weightHistory: [...p.weightHistory, { date: new Date().toISOString().split('T')[0], value: weight }]
        } : p)
      } : c)
    }));
    addLog({ staffName: currentUser?.name || 'Unknown', action: 'Update Weight', details: `Updated ${pet?.name}'s weight to ${weight}kg`, type: 'info' });
  },

  updateTierRules: (rules) => {
    const { currentUser, addLog } = get();
    set({ tierRules: rules });
    addLog({ staffName: currentUser?.name || 'Unknown', action: 'Update Membership Rules', details: 'Modified tier spending thresholds or discounts', type: 'warning' });
  },

  processPayment: (customerId, amount, discount, items, method = 'Cash', details) => {
    const { customers, tierRules, transactions, addLog, currentUser, currency } = get();
    const today = new Date().toISOString().split('T')[0];
    
    const isAppointment = items.some(item => !!item.queueItemId);
    const bookingType: BookingType = isAppointment ? 'Appointment' : 'Walk-in';
    
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
      bookingType,
      itemsCount: items.length,
      processedBy: currentUser?.name || 'Admin User',
      staffName: items[0]?.staffName || 'Sarah Wilson',
      paymentDetails: details
    };

    const updatedCustomers = customers.map(c => {
      if (c.id === customerId) {
        const newSpent = c.totalSpent + amount;
        const newPoints = c.points + Math.floor(amount);
        const sortedRules = [...tierRules].sort((a, b) => b.minSpent - a.minSpent);
        const newMembership = sortedRules.find(r => newSpent >= r.minSpent)?.level || 'Standard';
        
        const updatedPets = c.pets.map(pet => {
          const itemsForThisPet = items.filter(item => item.petId === pet.id);
          if (itemsForThisPet.length > 0) {
            const newHistoryEntries: ServiceHistoryEntry[] = itemsForThisPet.map(item => ({
              id: Math.random().toString(36).substr(2, 9),
              date: today,
              serviceName: item.title,
              price: item.price,
              size: item.size
            }));
            return {
              ...pet,
              serviceHistory: [...(pet.serviceHistory || []), ...newHistoryEntries]
            };
          }
          return pet;
        });

        return {
          ...c,
          totalSpent: newSpent,
          points: newPoints,
          membership: newMembership as MembershipLevel,
          pets: updatedPets
        };
      }
      return c;
    });

    set({ 
      customers: updatedCustomers,
      transactions: [...transactions, newTransaction]
    });

    addLog({
      staffName: currentUser?.name || 'Admin',
      action: 'Checkout Complete',
      details: `Received ${currency}${amount.toLocaleString()} from ${newTransaction.customerName} via ${method}`,
      type: 'success'
    });
    
    const currentSelected = get().selectedOwner;
    if (currentSelected?.id === customerId) {
      set({ selectedOwner: updatedCustomers.find(c => c.id === customerId) || null });
    }
  },

  addStaff: (staffData) => set((state) => {
    const { currentUser } = get();
    const newStaff = { ...staffData, id: 's' + Math.random().toString(36).substr(2, 4) };
    state.addLog({
      staffName: currentUser?.name || 'Admin',
      action: 'Staff Hired',
      details: `Added new staff: ${newStaff.name} (${newStaff.role})`,
      type: 'info'
    });
    return { staff: [...state.staff, newStaff] };
  }),
  updateStaff: (id, staffData) => {
    const { currentUser, addLog, staff } = get();
    const member = staff.find(s => s.id === id);
    set((state) => ({
      staff: state.staff.map(s => s.id === id ? { ...s, ...staffData } : s)
    }));
    addLog({ staffName: currentUser?.name || 'Admin', action: 'Update Staff', details: `Modified profile for employee: ${member?.name}`, type: 'warning' });
  },
  deleteStaff: (id) => {
    const { currentUser, addLog, staff } = get();
    const member = staff.find(s => s.id === id);
    set((state) => ({
      staff: state.staff.filter(s => s.id !== id)
    }));
    addLog({ staffName: currentUser?.name || 'Admin', action: 'Terminate Staff', details: `Removed employee: ${member?.name}`, type: 'danger' });
  },
  addLog: (logData) => set((state) => ({
    logs: [{ ...logData, id: 'l' + Math.random().toString(36).substr(2, 6), timestamp: new Date().toISOString() }, ...state.logs].slice(0, 100)
  })),

  updateBookingSettings: (settings) => {
    const { currentUser, addLog } = get();
    set((state) => ({
      ...state,
      ...settings
    }));
    addLog({ staffName: currentUser?.name || 'Admin', action: 'Update Booking Config', details: 'Modified shop hours, capacity, or slot duration', type: 'warning' });
  },

  toggleSlotStatus: (time) => {
    const { currentUser, addLog, disabledSlots } = get();
    const isBlocking = !disabledSlots.includes(time);
    set((state) => ({
      disabledSlots: isBlocking 
        ? [...state.disabledSlots, time]
        : state.disabledSlots.filter(t => t !== time)
    }));
    addLog({ staffName: currentUser?.name || 'Admin', action: 'Modify Calendar', details: `${isBlocking ? 'Blocked' : 'Unblocked'} time slot: ${time}`, type: 'info' });
  }
}));