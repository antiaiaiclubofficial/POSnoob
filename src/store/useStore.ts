import { create } from 'zustand';

export type ServiceIcon = 'grooming' | 'bath' | 'nail' | 'deshedding';
export type MembershipLevel = 'Standard' | 'Silver' | 'Gold' | 'VIP';
export type QueueStatus = 'Waiting' | 'Checked-in' | 'In Progress' | 'Completed';

export interface Pet {
  id: string;
  name: string;
  species: 'Dog' | 'Cat' | 'Other';
  breed: string;
  age: string;
  weight: string;
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
  // โครงสร้างราคาใหม่: แยกตามประเภทสัตว์ และระบุขนาดที่ต้องการเองได้
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
  services: Service[];
  customers: Customer[];
  cart: CartItem[];
  queue: QueueItem[];
  tierRules: TierRule[];
  selectedOwner: Customer | null;
  activePet: Pet | null;
  activeQueueItemId: string | null;
  
  updateBusinessProfile: (profile: { shopName?: string, shopLogo?: string | null }) => void;
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
  processPayment: (customerId: string, amount: number) => void;
  updateTierRules: (rules: TierRule[]) => void;
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
      { id: 'p1', name: 'Bella', species: 'Dog', breed: 'Golden Retriever', age: '3 years', weight: '25kg', notes: 'Sensitive skin', image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=64&h=64&fit=crop' },
      { id: 'p2', name: 'Rocky', species: 'Dog', breed: 'Bulldog', age: '1 year', weight: '18kg', notes: 'Very energetic', image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=64&h=64&fit=crop' }
    ]
  },
  {
    id: 'c2',
    name: 'Sarah Smith',
    phone: '089-999-8888',
    email: 'sarah@example.com',
    membership: 'Silver',
    points: 120,
    totalSpent: 450,
    pets: [
      { id: 'p3', name: 'Max', species: 'Dog', breed: 'Beagle', age: '5 years', weight: '12kg', notes: 'Loves treats', image: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=64&h=64&fit=crop' }
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
  },
  { 
    id: "svc-2", 
    icon: "bath", 
    title: "Bath & Brush", 
    description: "Deep clean shampoo, blow dry, and brushing.", 
    category: "Hygiene", 
    prices: { 
      dog: { S: 35, M: 45, L: 60 },
      cat: { Standard: 40 }
    } 
  }
];

export const useStore = create<AppState>((set, get) => ({
  shopName: "Tactile Sanctuary",
  shopLogo: null,
  services: INITIAL_SERVICES,
  customers: INITIAL_CUSTOMERS,
  cart: [],
  queue: [
    { id: 'q1', petId: 'p1', petName: 'Bella', ownerName: 'John Doe', serviceName: 'Full Grooming', time: '10:00', status: 'In Progress', image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=64&h=64&fit=crop', isPaid: false },
    { id: 'q2', petId: 'p3', petName: 'Max', ownerName: 'Sarah Smith', serviceName: 'Bath & Brush', time: '11:00', status: 'Waiting', image: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=64&h=64&fit=crop', isPaid: false }
  ],
  tierRules: INITIAL_TIER_RULES,
  selectedOwner: null,
  activePet: null,
  activeQueueItemId: null,
  
  updateBusinessProfile: (profile) => set((state) => ({
    ...state,
    shopName: profile.shopName ?? state.shopName,
    shopLogo: profile.shopLogo !== undefined ? profile.shopLogo : state.shopLogo
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
    queue: [...state.queue, { ...booking, id: Math.random().toString(36).substr(2, 9), isPaid: false }].sort((a, b) => a.time.localeCompare(b.time))
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
      pets: [...c.pets, { ...petData, id: 'p' + Math.random().toString(36).substr(2, 4) }]
    } : c)
  })),

  updateTierRules: (rules) => set({ tierRules: rules }),

  processPayment: (customerId, amount) => {
    const { customers, tierRules } = get();
    const updatedCustomers = customers.map(c => {
      if (c.id === customerId) {
        const newSpent = c.totalSpent + amount;
        const newPoints = c.points + Math.floor(amount);
        const sortedRules = [...tierRules].sort((a, b) => b.minSpent - a.minSpent);
        const newMembership = sortedRules.find(r => newSpent >= r.minSpent)?.level || 'Standard';
        return {
          ...c,
          totalSpent: newSpent,
          points: newPoints,
          membership: newMembership as MembershipLevel
        };
      }
      return c;
    });
    set({ customers: updatedCustomers });
    const currentSelected = get().selectedOwner;
    if (currentSelected?.id === customerId) {
      set({ selectedOwner: updatedCustomers.find(c => c.id === customerId) || null });
    }
  }
}));