import { create } from 'zustand';

export type ServiceIcon = 'grooming' | 'bath' | 'nail' | 'deshedding';

export interface Service {
  id: string;
  icon: ServiceIcon;
  title: string;
  description: string;
  category: string;
  // รองรับทั้งราคาเดียว (Fixed) หรือราคาตามขนาด (Size-based)
  prices: {
    S: number;
    M: number;
    L: number;
  } | number;
}

export interface CartItem {
  id: string;
  icon: ServiceIcon;
  title: string;
  price: number;
  petName: string;
  size?: 'S' | 'M' | 'L';
}

interface AppState {
  services: Service[];
  cart: CartItem[];
  currentPet: { name: string; breed: string; image: string } | null;
  addToCart: (item: CartItem) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  updateServicePrice: (id: string, prices: Service['prices']) => void;
}

const INITIAL_SERVICES: Service[] = [
  {
    id: "svc-1",
    icon: "grooming",
    title: "Full Grooming",
    description: "Haircut, bath, brush, nails, and ears.",
    category: "Grooming",
    prices: { S: 45, M: 55, L: 75 }
  },
  {
    id: "svc-2",
    icon: "bath",
    title: "Bath & Brush",
    description: "Deep clean shampoo, blow dry, and brushing.",
    category: "Hygiene",
    prices: { S: 35, M: 45, L: 60 }
  },
  {
    id: "svc-3",
    icon: "nail",
    title: "Nail Trim",
    description: "Professional trimming and filing.",
    category: "Quick Service",
    prices: 15
  },
  {
    id: "svc-4",
    icon: "deshedding",
    title: "De-Shedding",
    description: "Furminator treatment to reduce shedding.",
    category: "Special",
    prices: { S: 25, M: 35, L: 50 }
  }
];

export const useStore = create<AppState>((set) => ({
  services: INITIAL_SERVICES,
  cart: [],
  currentPet: {
    name: 'Bella',
    breed: 'Golden Retriever',
    image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=64&h=64&fit=crop'
  },
  addToCart: (item) => set((state) => ({
    cart: [...state.cart, item]
  })),
  removeFromCart: (index) => set((state) => ({
    cart: state.cart.filter((_, i) => i !== index)
  })),
  clearCart: () => set({ cart: [] }),
  updateServicePrice: (id, prices) => set((state) => ({
    services: state.services.map(s => s.id === id ? { ...s, prices } : s)
  })),
}));