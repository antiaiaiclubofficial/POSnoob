import { create } from 'zustand';

export type ServiceIcon = 'grooming' | 'bath' | 'spa' | 'nail' | 'dry' | 'health' | 'brush' | 'hotel' | 'love' | 'food' | 'premium';
export type MembershipLevel = 'Standard' | 'Silver' | 'Gold' | 'VIP';
export type QueueStatus = 'Waiting' | 'Checked-in' | 'In Progress' | 'Completed';
export type PaymentMethod = 'Cash' | 'Transfer' | 'Credit Card';
export type StaffRole = 'Admin' | 'Groomer' | 'Assistant';
export type BookingType = 'Appointment' | 'Walk-in';

export interface BroadcastLog {
  id: string;
  timestamp: string;
  channel: 'LINE' | 'SMS' | 'Both';
  target: string;
  message: string;
  status: 'Sent' | 'Failed';
}

// ... (Interface อื่นๆ คงเดิม)

interface AppState {
  // ... (ฟิลด์เดิม)
  shopName: string;
  shopLogo: string | null;
  shopAddress: string;
  shopPhone: string;
  shopLineId: string;
  receiptHeader: string;
  currency: string;
  shopIsOpen: boolean;
  recurringHolidays: number[];
  
  // New Integration Fields
  liffId: string;
  lineChannelToken: string;
  smsApiKey: string;
  smsSenderName: string;
  
  services: Service[];
  customers: Customer[];
  staff: Staff[];
  logs: ActivityLog[];
  broadcastLogs: BroadcastLog[];
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
  
  updateBusinessProfile: (profile: any) => void;
  updateIntegrations: (config: { liffId?: string, lineChannelToken?: string, smsApiKey?: string, smsSenderName?: string }) => void;
  sendBroadcast: (broadcast: Omit<BroadcastLog, 'id' | 'timestamp' | 'status'>) => void;
  // ... (Actions อื่นๆ)
}

// ... (Initial data คงเดิม)

export const useStore = create<AppState>((set, get) => ({
  shopName: "Tactile Sanctuary",
  shopLogo: null,
  shopAddress: "123 Pet Street, Bangkok, Thailand",
  shopPhone: "02-xxx-xxxx",
  shopLineId: "@tactilesanctuary",
  receiptHeader: "Thank you for visiting us!",
  currency: "฿",
  shopIsOpen: true,
  recurringHolidays: [],
  
  liffId: "",
  lineChannelToken: "",
  smsApiKey: "",
  smsSenderName: "TACTILE",
  
  services: [],
  customers: [],
  staff: [],
  logs: [],
  broadcastLogs: [],
  cart: [],
  queue: [],
  transactions: [],
  tierRules: [],
  selectedOwner: null,
  activePet: null,
  activeQueueItemId: null,
  
  slotDuration: 30,
  maxCapacity: 2,
  openTime: "09:00",
  closeTime: "19:00",
  disabledSlots: [],

  updateBusinessProfile: (profile) => set((state) => ({ ...state, ...profile })),
  
  updateIntegrations: (config) => set((state) => ({ ...state, ...config })),
  
  sendBroadcast: (data) => {
    const newLog: BroadcastLog = {
      ...data,
      id: 'br-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      status: 'Sent'
    };
    set((state) => ({ broadcastLogs: [newLog, ...state.broadcastLogs] }));
    get().addLog({
      staffName: 'Marketing',
      action: 'Broadcast Sent',
      details: `Sent ${data.channel} message to ${data.target}`,
      type: 'success'
    });
  },

  // ... (Actions อื่นๆ คงเดิมตามไฟล์เดิมที่ได้รับมา)
  addToCart: (item) => set((state) => ({ cart: [...state.cart, item] })),
  removeFromCart: (index) => set((state) => ({ cart: state.cart.filter((_, i) => i !== index) })),
  clearCart: () => set({ cart: [], activeQueueItemId: null }),
  addService: (serviceData) => set((state) => ({ services: [...state.services, { ...serviceData, id: 'svc-' + Math.random().toString(36).substr(2, 5) }] })),
  updateService: (id, serviceData) => set((state) => ({ services: state.services.map(s => s.id === id ? { ...s, ...serviceData } : s) })),
  deleteService: (id) => set((state) => ({ services: state.services.filter(s => s.id !== id) })),
  toggleServiceActive: (id) => set((state) => ({ services: state.services.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s) })),
  selectOwner: (owner) => set({ selectedOwner: owner, activePet: owner ? owner.pets[0] : null, activeQueueItemId: null }),
  setActivePet: (pet) => set({ activePet: pet }),
  setActiveQueueItem: (id) => set({ activeQueueItemId: id }),
  addBooking: (booking) => set((state) => ({ queue: [...state.queue, { ...booking, id: Math.random().toString(36).substr(2, 9), isPaid: false }] })),
  updateQueueStatus: (id, status) => set((state) => ({ queue: state.queue.map(q => q.id === id ? { ...q, status } : q) })),
  removeQueueItem: (id) => set((state) => ({ queue: state.queue.filter(q => q.id !== id) })),
  markAsPaid: (id) => set((state) => ({ queue: state.queue.map(q => q.id === id ? { ...q, isPaid: true } : q) })),
  addCustomer: (customerData) => set((state) => ({ customers: [...state.customers, { ...customerData, id: 'c' + Math.random().toString(36).substr(2, 4), points: 0, pets: [], totalSpent: 0 }] })),
  updateCustomer: (id, customerData) => set((state) => ({ customers: state.customers.map(c => c.id === id ? { ...c, ...customerData } : c) })),
  addPet: (customerId, petData) => set((state) => ({ customers: state.customers.map(c => c.id === customerId ? { ...c, pets: [...c.pets, { ...petData, id: 'p' + Math.random().toString(36).substr(2, 4), serviceHistory: [] }] } : c) })),
  updatePet: (customerId, petId, petData) => set((state) => ({ customers: state.customers.map(c => c.id === customerId ? { ...c, pets: c.pets.map(p => p.id === petId ? { ...p, ...petData } : p) } : c) })),
  updatePetWeight: (customerId, petId, weight) => set((state) => ({ customers: state.customers.map(c => c.id === customerId ? { ...c, pets: c.pets.map(p => p.id === petId ? { ...p, weightHistory: [...p.weightHistory, { date: new Date().toISOString().split('T')[0], value: weight }] } : p) } : c) })),
  updateTierRules: (rules) => set({ tierRules: rules }),
  processPayment: (customerId, amount, discount, items, method = 'Cash', details) => { /* logicเดิม */ },
  addStaff: (staffData) => set((state) => ({ staff: [...state.staff, { ...staffData, id: 's' + Math.random().toString(36).substr(2, 4) }] })),
  updateStaff: (id, staffData) => set((state) => ({ staff: state.staff.map(s => s.id === id ? { ...s, ...staffData } : s) })),
  deleteStaff: (id) => set((state) => ({ staff: state.staff.filter(s => s.id !== id) })),
  addLog: (logData) => set((state) => ({ logs: [{ ...logData, id: 'l' + Math.random().toString(36).substr(2, 6), timestamp: new Date().toISOString() }, ...state.logs].slice(0, 100) })),
  updateBookingSettings: (settings) => set((state) => ({ ...state, ...settings })),
  toggleSlotStatus: (time) => set((state) => ({ disabledSlots: state.disabledSlots.includes(time) ? state.disabledSlots.filter(t => t !== time) : [...state.disabledSlots, time] }))
}));