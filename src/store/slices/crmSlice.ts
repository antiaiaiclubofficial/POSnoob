import { StateCreator } from 'zustand';
import { AppState, Customer, Pet, QueueStatus, MembershipLevel, QueueItem } from '../types';

export const createCRMSlice: StateCreator<AppState, [], [], Pick<AppState, 'customers' | 'setCustomers' | 'queue' | 'selectedOwner' | 'activePet' | 'activeQueueItemId' | 'selectOwner' | 'setActivePet' | 'setActiveQueueItem' | 'addBooking' | 'updateQueueStatus' | 'removeQueueItem' | 'markAsPaid' | 'addCustomer' | 'updateCustomer' | 'deleteCustomer' | 'bindLineToCustomer' | 'addPet' | 'updatePet' | 'updatePetWeight'>> = (set, get) => ({
  customers: [],
  setCustomers: (customers) => set({ customers }),
  queue: [],
  selectedOwner: null,
  activePet: null,
  activeQueueItemId: null,

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
});