import { StateCreator } from 'zustand';
import { AppState, Customer, Pet, QueueStatus, MembershipLevel, QueueItem } from '../types';
import { supabase } from '@/integrations/supabase/client';

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

  addBooking: async (booking) => {
    const { data, error } = await supabase
      .from('bookings')
      .insert([{ ...booking, is_paid: false }])
      .select()
      .single();

    if (!error && data) {
      set((state) => ({
        queue: [...state.queue, data].sort((a, b) => a.time.localeCompare(b.time))
      }));
    }
  },

  updateQueueStatus: async (id, status) => {
    const now = new Date().toISOString();
    const update: any = { status };
    if (status === 'In Progress') update.start_time = now;
    if (status === 'Completed') update.end_time = now;

    const { error } = await supabase
      .from('bookings')
      .update(update)
      .eq('id', id);

    if (!error) {
      set((state) => ({
        queue: state.queue.map(q => {
          if (q.id !== id) return q;
          return { ...q, status, startTime: update.start_time || q.startTime, endTime: update.end_time || q.endTime };
        })
      }));
    }
  },

  removeQueueItem: async (id) => {
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (!error) {
      set((state) => ({ queue: state.queue.filter(q => q.id !== id) }));
    }
  },

  markAsPaid: async (id) => {
    const { error } = await supabase.from('bookings').update({ is_paid: true }).eq('id', id);
    if (!error) {
      set((state) => ({ queue: state.queue.map(q => q.id === id ? { ...q, isPaid: true } : q) }));
    }
  },

  addCustomer: async (customerData) => {
    const { data, error } = await supabase
      .from('customers')
      .insert([{ 
        ...customerData, 
        points: 0, 
        total_spent: 0,
        credit_balance: 0
      }])
      .select()
      .single();

    if (!error && data) {
      set((state) => ({
        customers: [...state.customers, { ...data, pets: [], packages: [], creditHistory: [] }]
      }));
    }
  },

  updateCustomer: async (id, customerData) => {
    const { error } = await supabase.from('customers').update(customerData).eq('id', id);
    if (!error) {
      set((state) => ({ customers: state.customers.map(c => c.id === id ? { ...c, ...customerData } : c) }));
    }
  },

  deleteCustomer: async (id) => {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (!error) {
      set((state) => ({
        customers: state.customers.filter(c => c.id !== id),
        selectedOwner: state.selectedOwner?.id === id ? null : state.selectedOwner,
        activePet: state.selectedOwner?.id === id ? null : state.activePet
      }));
    }
  },

  bindLineToCustomer: async (customerId, lineId) => {
    const { error } = await supabase.from('customers').update({ line_id: lineId }).eq('id', customerId);
    if (!error) {
      set((state) => ({ customers: state.customers.map(c => c.id === customerId ? { ...c, lineId } : c) }));
    }
  },

  addPet: async (customerId, petData) => {
    const { data, error } = await supabase
      .from('pets')
      .insert([{ ...petData, customer_id: customerId }])
      .select()
      .single();

    if (!error && data) {
      set((state) => ({
        customers: state.customers.map(c => c.id === customerId ? {
          ...c,
          pets: [...c.pets, { ...data, serviceHistory: [] }]
        } : c)
      }));
    }
  },

  updatePet: async (customerId, petId, petData) => {
    const { error } = await supabase.from('pets').update(petData).eq('id', petId);
    if (!error) {
      set((state) => ({
        customers: state.customers.map(c => c.id === customerId ? {
          ...c,
          pets: c.pets.map(p => p.id === petId ? { ...p, ...petData } : p)
        } : c)
      }));
    }
  },

  updatePetWeight: async (customerId, petId, weight) => {
    const { data: currentPet } = await supabase.from('pets').select('weight_history').eq('id', petId).single();
    const newHistory = [...(currentPet?.weight_history || []), { date: new Date().toISOString().split('T')[0], value: weight }];
    
    const { error } = await supabase.from('pets').update({ weight_history: newHistory }).eq('id', petId);
    
    if (!error) {
      set((state) => ({
        customers: state.customers.map(c => c.id === customerId ? {
          ...c,
          pets: c.pets.map(p => p.id === petId ? { ...p, weightHistory: newHistory } : p)
        } : c)
      }));
    }
  },
});