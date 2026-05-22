"use client";

import { StateCreator } from 'zustand';
import { AppState, Customer, Pet, QueueStatus, MembershipLevel, QueueItem } from '../types';
import { supabase } from '@/integrations/supabase/client';

export const createCRMSlice: StateCreator<AppState, [], [], Pick<AppState, 'customers' | 'setCustomers' | 'queue' | 'selectedOwner' | 'activePet' | 'activeQueueItemId' | 'selectOwner' | 'setActivePet' | 'setActiveQueueItem' | 'addBooking' | 'updateQueueStatus' | 'removeQueueItem' | 'markAsPaid' | 'addCustomer' | 'updateCustomer' | 'deleteCustomer' | 'bindLineToCustomer' | 'addPet' | 'updatePet' | 'updatePetWeight' | 'saveIntakeRecord'>> = (set, get) => ({
  customers: [],
  setCustomers: (customers) => set({ customers }),
  queue: [],
  selectedOwner: null,
  activePet: null,
  activeQueueItemId: null,

  selectOwner: (owner) => set({ selectedOwner: owner, activePet: owner?.pets[0] || null }),
  setActivePet: (pet) => set({ activePet: pet }),
  setActiveQueueItem: (id) => set({ activeQueueItemId: id }),

  addBooking: (booking) => set((state) => ({ queue: [...state.queue, booking] })),
  updateQueueStatus: (id, status) => set((state) => ({
    queue: state.queue.map(q => q.id === id ? { ...q, status } : q)
  })),
  removeQueueItem: (id) => set((state) => ({ queue: state.queue.filter(q => q.id !== id) })),
  markAsPaid: (id) => set((state) => ({
    queue: state.queue.map(q => q.id === id ? { ...q, isPaid: true } : q)
  })),

  addCustomer: (data) => set((state) => ({ customers: [...state.customers, data] })),
  updateCustomer: (id, data) => set((state) => ({
    customers: state.customers.map(c => c.id === id ? { ...c, ...data } : c)
  })),
  deleteCustomer: (id) => set((state) => ({ customers: state.customers.filter(c => c.id !== id) })),
  bindLineToCustomer: (cid, lid) => set((state) => ({
    customers: state.customers.map(c => c.id === cid ? { ...c, lineId: lid } : c)
  })),

  addPet: (cid, pet) => set((state) => ({
    customers: state.customers.map(c => c.id === cid ? { ...c, pets: [...c.pets, pet] } : c)
  })),
  updatePet: (cid, pid, data) => set((state) => ({
    customers: state.customers.map(c => c.id === cid ? {
      ...c,
      pets: c.pets.map(p => p.id === pid ? { ...p, ...data } : p)
    } : c)
  })),
  updatePetWeight: (cid, pid, w) => set((state) => ({
    customers: state.customers.map(c => c.id === cid ? {
      ...c,
      pets: c.pets.map(p => p.id === pid ? { ...p, weightHistory: [...p.weightHistory, { date: new Date().toISOString(), value: w }] } : p)
    } : c)
  })),
  saveIntakeRecord: () => {},
});