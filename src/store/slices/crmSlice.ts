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
      .from('appointments')
      .insert([{ 
        customer_id: get().selectedOwner?.id,
        pet_id: booking.petId,
        status: 'pending',
        start_time: new Date(`${booking.date}T${booking.time}:00`).toISOString(),
        notes: booking.serviceName
      }])
      .select()
      .single();

    if (!error && data) {
      set((state) => ({
        queue: [...state.queue, {
          id: data.id,
          petId: data.pet_id,
          petName: booking.petName,
          ownerName: booking.ownerName,
          serviceName: booking.serviceName,
          date: booking.date,
          time: booking.time,
          status: 'Waiting' as QueueStatus,
          image: booking.image
        }].sort((a, b) => a.time.localeCompare(b.time))
      }));
    }
  },

  updateQueueStatus: async (id, status) => {
    const dbStatus = status === 'Waiting' ? 'pending' : status === 'Checked-in' ? 'confirmed' : status === 'In Progress' ? 'confirmed' : 'completed';
    const { error } = await supabase
      .from('appointments')
      .update({ status: dbStatus })
      .eq('id', id);

    if (!error) {
      set((state) => ({
        queue: state.queue.map(q => {
          if (q.id !== id) return q;
          return { ...q, status };
        })
      }));
    }
  },

  removeQueueItem: async (id) => {
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (!error) {
      set((state) => ({ queue: state.queue.filter(q => q.id !== id) }));
    }
  },

  markAsPaid: async (id) => {
    set((state) => ({ queue: state.queue.map(q => q.id === id ? { ...q, isPaid: true } : q) }));
  },

  addCustomer: async (customerData) => {
    const { data, error } = await supabase
      .from('customers')
      .insert([{ 
        first_name: customerData.firstName,
        last_name: customerData.lastName,
        display_name: customerData.name,
        phone: customerData.phone,
        email: customerData.email,
        gender: customerData.gender,
        age: customerData.age,
        house_no: customerData.houseNo,
        village_no: customerData.villageNo,
        soi: customerData.soi,
        road: customerData.road,
        sub_district: customerData.subDistrict,
        district: customerData.district,
        province: customerData.province,
        postal_code: customerData.postalCode
      }])
      .select()
      .single();

    if (!error && data) {
      // Create store_customer entry
      await supabase.from('store_customers').insert([{
        customer_id: data.id,
        points: 0,
        tier: 'Standard'
      }]);

      set((state) => ({
        customers: [...state.customers, {
          id: data.id,
          name: data.display_name || `${data.first_name} ${data.last_name}`,
          firstName: data.first_name,
          lastName: data.last_name,
          phone: data.phone || '',
          email: data.email || '',
          membership: 'Standard',
          points: 0,
          totalSpent: 0,
          creditBalance: 0,
          pets: [],
          packages: [],
          creditHistory: []
        }]
      }));
    }
  },

  updateCustomer: async (id, customerData) => {
    const { error } = await supabase
      .from('customers')
      .update({
        first_name: customerData.firstName,
        last_name: customerData.lastName,
        display_name: customerData.name,
        phone: customerData.phone,
        email: customerData.email,
        gender: customerData.gender,
        age: customerData.age,
        house_no: customerData.houseNo,
        village_no: customerData.villageNo,
        soi: customerData.soi,
        road: customerData.road,
        sub_district: customerData.subDistrict,
        district: customerData.district,
        province: customerData.province,
        postal_code: customerData.postalCode
      })
      .eq('id', id);

    if (!error) {
      set((state) => ({
        customers: state.customers.map(c => c.id === id ? { ...c, ...customerData } : c)
      }));
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
    const { error } = await supabase.from('customers').update({ line_user_id: lineId }).eq('id', customerId);
    if (!error) {
      set((state) => ({ customers: state.customers.map(c => c.id === customerId ? { ...c, lineId } : c) }));
    }
  },

  addPet: async (customerId, petData) => {
    const { data, error } = await supabase
      .from('pets')
      .insert([{ 
        customer_id: customerId,
        name: petData.name,
        type: petData.species,
        breed: petData.breed,
        birth_date: petData.birthday,
        notes: petData.notes,
        image_url: petData.image,
        weight_history: petData.weightHistory || []
      }])
      .select()
      .single();

    if (!error && data) {
      set((state) => ({
        customers: state.customers.map(c => c.id === customerId ? {
          ...c,
          pets: [...c.pets, {
            id: data.id,
            name: data.name,
            species: data.type as 'Dog' | 'Cat' | 'Other',
            breed: data.breed || '',
            birthday: data.birth_date || '',
            notes: data.notes || '',
            image: data.image_url || '',
            weightHistory: data.weight_history || [],
            serviceHistory: []
          }]
        } : c)
      }));
    }
  },

  updatePet: async (customerId, petId, petData) => {
    const { error } = await supabase
      .from('pets')
      .update({
        name: petData.name,
        type: petData.species,
        breed: petData.breed,
        birth_date: petData.birthday,
        notes: petData.notes,
        image_url: petData.image
      })
      .eq('id', petId);

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