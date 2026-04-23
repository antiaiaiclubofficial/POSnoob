import { create } from 'zustand';

export type ServiceIcon = 'grooming' | 'bath' | 'nail' | 'deshedding';
export type MembershipLevel = 'Standard' | 'Silver' | 'Gold' | 'VIP';
export type QueueStatus = 'Waiting' | 'Checked-in' | 'In Progress' | 'Completed';
export type PaymentMethod = 'Cash' | 'Transfer' | 'Credit Card';

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
  customerId: string;
  customerName: string;
  species: ('Dog' | 'Cat' | 'Other')[];
  paymentMethod: PaymentMethod;
  itemsCount: number;
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

export interface Service {
  id: string;
  icon: ServiceIcon;
  title: string;
  description: string;
  category: string;
  prices: {
    dog: Record<string, number>;
    cat: Record<string, number>;
  };
}

export interface QueueItem {
  id: string;
  petId: string;
  petName: string;
  ownerName: string;
  serviceName: string;
  date: string; // เพิ่มช่องวันที่
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
}

interface AppState {
  shopName: string;
  shopLogo: string | null;
  shopAddress: string;
  shopPhone: string;
  shopLineId: string;
  receiptHeader: string;
  
  services: Service[];
  customers: Customer[];
  cart: CartItem[];
  queue: QueueItem[];
  transactions: Transaction[];
  tierRules: TierRule[];
  selectedOwner: Customer | null;
  activePet: Pet | null;
  activeQueueItemId: string | null;
  
  // Booking Settings
  slotDuration: number;
  maxCapacity: number;
  openTime: string;
  closeTime: string;
  disabledSlots: string[];
  
  updateBusinessProfile: (profile: { 
    shopName?: string, 
    shopLogo?: string | null,
    shopAddress?: string,
    shopPhone?: string,
    shopLineId?: string,
    receiptHeader?: string
  }) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  
  addService: (service: Omit<Service, 'id'>) => void;
  updateService: (id: string, service: Partial<Service>) => void;
  deleteService: (id: string) => void;
  
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
  processPayment: (customerId: string, amount: number, items: CartItem[], method?: PaymentMethod, details?: Transaction['paymentDetails']) => void;
  updateTierRules: (rules: TierRule[]) => void;
  
  updateBookingSettings: (settings: { slotDuration?: number, maxCapacity?: number, openTime?: string, closeTime?: string }) => void;
  toggleSlotStatus: (time: string) => void;
}

const INITIAL_TIER_RULES: TierRule[] = [
  { level: 'Standard', label: 'Standard', minSpent: 0, discount: 0 },
  { level: 'Silver', label: 'Silver Member', minSpent: 500, discount: 5 },
  { level: 'Gold', label: 'Gold Member', minSpent: 1500, discount: 10 },
  { level: 'VIP', label: 'VIP Exclusive', minSpent: 5000, discount: 15 },
];

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'John Doe',
    phone: '081-234-5678',
    email: 'john@example.com',
    membership: 'Gold',
    points: 450,
    totalSpent: 1250,
    pets: [
      { 
        id: 'p1', 
        name: 'Bella', 
        species: 'Dog', 
        breed: 'Golden Retriever', 
        birthday: '2021-03-15', 
        weightHistory: [{ date: '2023-10-01', value: 24.5 }, { date: '2024-01-20', value: 25.2 }], 
        serviceHistory: [
          { id: 'h1', date: '2024-01-20', serviceName: 'Full Grooming (M)', price: 55 }
        ],
        notes: 'Sensitive skin', 
        image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=64&h=64&fit=crop' 
      }
    ]
  }
];

const INITIAL_SERVICES: Service[] = [
  { 
    id: "svc-1", 
    icon: "grooming", 
    title: "Full Grooming", 
    description: "Haircut, bath, brush, nails, and ears.", 
    category: "Grooming", 
    prices: { 
      dog: { S: 45, M: 55, L: 75 },
      cat: { Standard: 50 }
    } 
  }
];

export const useStore = create<AppState>((set, get) => ({
  shopName: "Tactile Sanctuary",
  shopLogo: null,
  shopAddress: "123 Pet Street, Bangkok, Thailand",
  shopPhone: "02-xxx-xxxx",
  shopLineId: "@tactilesanctuary",
  receiptHeader: "Thank you for visiting us!",
  
  services: INITIAL_SERVICES,
  customers: INITIAL_CUSTOMERS,
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
  
  updateBusinessProfile: (profile) => set((state) => ({
    ...state,
    shopName: profile.shopName ?? state.shopName,
    shopLogo: profile.shopLogo !== undefined ? profile.shopLogo : state.shopLogo,
    shopAddress: profile.shopAddress ?? state.shopAddress,
    shopPhone: profile.shopPhone ?? state.shopPhone,
    shopLineId: profile.shopLineId ?? state.shopLineId,
    receiptHeader: profile.receiptHeader ?? state.receiptHeader,
  })),

  addToCart: (item) => set((state) => ({ cart: [...state.cart, item] })),
  removeFromCart: (index) => set((state) => ({ cart: state.cart.filter((_, i) => i !== index) })),
  clearCart: () => set({ cart: [], activeQueueItemId: null }),
  
  addService: (serviceData) => set((state) => ({
    services: [...state.services, { ...serviceData, id: 'svc-' + Math.random().toString(36).substr(2, 5) }]
  })),
  updateService: (id, serviceData) => set((state) => ({
    services: state.services.map(s => s.id === id ? { ...s, ...serviceData } : s)
  })),
  deleteService: (id) => set((state) => ({
    services: state.services.filter(s => s.id !== id)
  })),

  selectOwner: (owner) => set({ selectedOwner: owner, activePet: owner ? owner.pets[0] : null, activeQueueItemId: null }),
  setActivePet: (pet) => set({ activePet: pet }),
  setActiveQueueItem: (id) => set({ activeQueueItemId: id }),

  addBooking: (booking) => set((state) => ({
    queue: [...state.queue, { ...booking, id: Math.random().toString(36).substr(2, 9), isPaid: false }].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    })
  })),
  updateQueueStatus: (id, status) => set((state) => ({
    queue: state.queue.map(q => q.id === id ? { ...q, status } : q)
  })),
  removeQueueItem: (id) => set((state) => ({
    queue: state.queue.filter(q => q.id !== id)
  })),
  markAsPaid: (id) => set((state) => ({
    queue: state.queue.map(q => q.id === id ? { ...q, isPaid: true } : q)
  })),

  addCustomer: (customerData) => set((state) => ({
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
  })),
  updateCustomer: (id, customerData) => set((state) => ({
    customers: state.customers.map(c => c.id === id ? { ...c, ...customerData } : c)
  })),
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

  updateTierRules: (rules) => set({ tierRules: rules }),

  processPayment: (customerId, amount, items, method = 'Cash', details) => {
    const { customers, tierRules, transactions } = get();
    const today = new Date().toISOString().split('T')[0];
    
    const newTransaction: Transaction = {
      id: 'tx-' + Math.random().toString(36).substr(2, 9),
      date: today,
      amount: amount,
      customerId: customerId,
      customerName: customers.find(c => c.id === customerId)?.name || 'Unknown',
      species: Array.from(new Set(items.map(item => {
        const cust = customers.find(c => c.id === customerId);
        const pet = cust?.pets.find(p => p.id === item.petId);
        return pet?.species || 'Other';
      }))),
      paymentMethod: method,
      itemsCount: items.length,
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
    
    const currentSelected = get().selectedOwner;
    if (currentSelected?.id === customerId) {
      set({ selectedOwner: updatedCustomers.find(c => c.id === customerId) || null });
    }
  },

  updateBookingSettings: (settings) => set((state) => ({
    ...state,
    ...settings
  })),

  toggleSlotStatus: (time) => set((state) => ({
    disabledSlots: state.disabledSlots.includes(time) 
      ? state.disabledSlots.filter(t => t !== time)
      : [...state.disabledSlots, time]
  }))
}));