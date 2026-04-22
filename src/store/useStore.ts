import { create } from 'zustand';

export type ServiceIcon = 'grooming' | 'bath' | 'nail' | 'deshedding';
export type MembershipLevel = 'Standard' | 'Silver' | 'Gold' | 'VIP';
export type QueueStatus = 'Waiting' | 'In Progress' | 'Completed';

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

export interface Service {
  id: string;
  icon: ServiceIcon;
  title: string;
  description: string;
  category: string;
  prices: { S: number; M: number; L: number } | number;
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
}

export interface CartItem {
  id: string;
  icon: ServiceIcon;
  title: string;
  price: number;
  petId: string;
  petName: string;
  ownerName: string;
  size?: 'S' | 'M' | 'L';
}

interface AppState {
  services: Service[];
  customers: Customer[];
  cart: CartItem[];
  queue: QueueItem[];
  selectedOwner: Customer | null;
  activePet: Pet | null;
  
  addToCart: (item: CartItem) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  updateServicePrice: (id: string, prices: Service['prices']) => void;
  selectOwner: (owner: Customer | null) => void;
  setActivePet: (pet: Pet | null) => void;
  
  // Queue Actions
  addBooking: (booking: Omit<QueueItem, 'id'>) => void;
  updateQueueStatus: (id: string, status: QueueStatus) => void;
  removeQueueItem: (id: string) => void;
}

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
  { id: "svc-1", icon: "grooming", title: "Full Grooming", description: "Haircut, bath, brush, nails, and ears.", category: "Grooming", prices: { S: 45, M: 55, L: 75 } },
  { id: "svc-2", icon: "bath", title: "Bath & Brush", description: "Deep clean shampoo, blow dry, and brushing.", category: "Hygiene", prices: { S: 35, M: 45, L: 60 } },
  { id: "svc-3", icon: "nail", title: "Nail Trim", description: "Professional trimming and filing.", category: "Quick Service", prices: 15 },
  { id: "svc-4", icon: "deshedding", title: "De-Shedding", description: "Furminator treatment to reduce shedding.", category: "Special", prices: { S: 25, M: 35, L: 50 } }
];

const INITIAL_QUEUE: QueueItem[] = [
  { id: 'q1', petId: 'p1', petName: 'Bella', ownerName: 'John Doe', serviceName: 'Full Grooming', time: '10:00', status: 'In Progress', image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=64&h=64&fit=crop' },
  { id: 'q2', petId: 'p3', petName: 'Max', ownerName: 'Sarah Smith', serviceName: 'Bath & Brush', time: '11:00', status: 'Waiting', image: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=64&h=64&fit=crop' }
];

export const useStore = create<AppState>((set) => ({
  services: INITIAL_SERVICES,
  customers: INITIAL_CUSTOMERS,
  cart: [],
  queue: INITIAL_QUEUE,
  selectedOwner: null,
  activePet: null,
  
  addToCart: (item) => set((state) => ({ cart: [...state.cart, item] })),
  removeFromCart: (index) => set((state) => ({ cart: state.cart.filter((_, i) => i !== index) })),
  clearCart: () => set({ cart: [] }),
  updateServicePrice: (id, prices) => set((state) => ({
    services: state.services.map(s => s.id === id ? { ...s, prices } : s)
  })),
  selectOwner: (owner) => set({ selectedOwner: owner, activePet: owner ? owner.pets[0] : null }),
  setActivePet: (pet) => set({ activePet: pet }),

  addBooking: (booking) => set((state) => ({
    queue: [...state.queue, { ...booking, id: Math.random().toString(36).substr(2, 9) }].sort((a, b) => a.time.localeCompare(b.time))
  })),
  updateQueueStatus: (id, status) => set((state) => ({
    queue: state.queue.map(q => q.id === id ? { ...q, status } : q)
  })),
  removeQueueItem: (id) => set((state) => ({
    queue: state.queue.filter(q => q.id !== id)
  })),
}));