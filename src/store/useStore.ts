import { create } from 'zustand';

export interface Service {
  id: string;
  icon: 'grooming' | 'bath' | 'nail' | 'deshedding';
  title: string;
  price: number;
  description: string;
}

export interface CartItem extends Service {
  petName: string;
}

interface AppState {
  cart: CartItem[];
  currentPet: { name: string; breed: string; image: string } | null;
  addToCart: (service: Service) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  setCurrentPet: (pet: { name: string; breed: string; image: string } | null) => void;
}

export const useStore = create<AppState>((set) => ({
  cart: [],
  currentPet: {
    name: 'Bella',
    breed: 'Golden Retriever',
    image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=64&h=64&fit=crop'
  },
  addToCart: (service) => set((state) => ({
    cart: [...state.cart, { ...service, petName: state.currentPet?.name || 'Walk-in' }]
  })),
  removeFromCart: (index) => set((state) => ({
    cart: state.cart.filter((_, i) => i !== index)
  })),
  clearCart: () => set({ cart: [] }),
  setCurrentPet: (pet) => set({ currentPet: pet }),
}));