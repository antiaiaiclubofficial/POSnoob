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
    const currentStoreId = get().storeId;
    const { data, error } = await supabase
      .from('appointments')
      .insert([{ 
        store_id: currentStoreId && currentStoreId !== 'default-store' ? currentStoreId : null,
        customer_id: get().selectedOwner?.id,
        pet_id: booking.petId,
        status: 'pending',
        start_time: new Date(`${booking.date}T${booking.time}:00`).toISOString(),
        notes: booking.serviceName
      }])
      .select()
      .single();

    if (error) {
      console.error("Error adding booking:", error);
      throw error;
    }

    if (data) {
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

    if (error) {
      console.error("Error updating queue status:", error);
      throw error;
    }

    set((state) => ({
      queue: state.queue.map(q => {
        if (q.id !== id) return q;
        return { ...q, status };
      })
    }));
  },

  removeQueueItem: async (id) => {
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) {
      console.error("Error removing queue item:", error);
      throw error;
    }
    set((state) => ({ queue: state.queue.filter(q => q.id !== id) }));
  },

  markAsPaid: async (id) => {
    set((state) => ({ queue: state.queue.map(q => q.id === id ? { ...q, isPaid: true } : q) }));
  },

  addCustomer: async (customerData) => {
    const currentStoreId = get().storeId;
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

    if (error) {
      console.error("Error inserting customer:", error);
      throw error;
    }

    if (data) {
      // Create store_customer entry with explicit store_id
      const { error: storeCustError } = await supabase.from('store_customers').insert([{
        customer_id: data.id,
        store_id: currentStoreId && currentStoreId !== 'default-store' ? currentStoreId : null,
        points: 0,
        tier: 'bronze' // Use 'bronze' as default to match DB trigger expectations
      }]);

      if (storeCustError) {
        console.error("Error inserting store_customer:", storeCustError);
        throw storeCustError;
      }

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

    if (error) {
      console.error("Error updating customer:", error);
      throw error;
    }

    set((state) => ({
      customers: state.customers.map(c => c.id === id ? { ...c, ...customerData } : c)
    }));
  },

  deleteCustomer: async (id) => {
    // 1. Get all pet IDs for this customer
    const { data: petsData } = await supabase
      .from('pets')
      .select('id')
      .eq('customer_id', id);
    
    const petIds = petsData?.map(p => p.id) || [];

    // 2. Delete related records for those pets
    if (petIds.length > 0) {
      await supabase.from('pet_weight_history').delete().in('pet_id', petIds);
      await supabase.from('pet_health_logs').delete().in('pet_id', petIds);
    }

    // 3. Delete service history
    await supabase.from('service_history').delete().eq('customer_id', id);
    if (petIds.length > 0) {
      await supabase.from('service_history').delete().in('pet_id', petIds);
    }

    // 4. Delete appointments
    await supabase.from('appointments').delete().eq('customer_id', id);
    if (petIds.length > 0) {
      await supabase.from('appointments').delete().in('pet_id', petIds);
    }

    // 5. Delete store_customers
    await supabase.from('store_customers').delete().eq('customer_id', id);

    // 6. Delete points_logs (safely)
    try {
      await supabase.from('points_logs').delete().eq('customer_id', id);
    } catch (e) {
      console.warn("Failed to delete from points_logs:", e);
    }

    // 7. Nullify customer_id in sales_transactions (safely)
    try {
      await supabase.from('sales_transactions').update({ customer_id: null }).eq('customer_id', id);
    } catch (e) {
      console.warn("Failed to nullify customer_id in sales_transactions:", e);
    }

    // 8. Delete pets
    if (petIds.length > 0) {
      await supabase.from('pets').delete().eq('customer_id', id);
    }

    // 9. Finally delete customer
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) {
      console.error("Error deleting customer:", error);
      throw error;
    }

    set((state) => ({
      customers: state.customers.filter(c => c.id !== id),
      selectedOwner: state.selectedOwner?.id === id ? null : state.selectedOwner,
      activePet: state.selectedOwner?.id === id ? null : state.activePet
    }));
  },

  bindLineToCustomer: async (customerId, lineId) => {
    const { error } = await supabase.from('customers').update({ line_user_id: lineId }).eq('id', customerId);
    if (error) {
      console.error("Error binding LINE ID:", error);
      throw error;
    }
    set((state) => ({ customers: state.customers.map(c => c.id === customerId ? { ...c, lineId } : c) }));
  },

  addPet: async (customerId, petData) => {
    const initialWeight = petData.weightHistory?.[0]?.value || 0;
    const { data, error } = await supabase
      .from('pets')
      .insert([{ 
        customer_id: customerId,
        name: petData.name,
        type: petData.species,
        breed: petData.breed,
        birth_date: petData.birthday,
        medical_condition: petData.medicalCondition,
        precautions: petData.precautions,
        fur_length: petData.coatType,
        image_url: petData.image,
        weight: initialWeight,
        custom_preferences: [
          { key: 'color', value: petData.color || '' },
          { key: 'temperament', value: petData.temperament || '' },
          { key: 'vaccineBookImage', value: petData.vaccineBookImage || '' },
          { key: 'notes', value: petData.notes || '' }
        ]
      }])
      .select()
      .single();

    if (error) {
      console.error("Error adding pet:", error);
      throw error;
    }

    if (data) {
      set((state) => ({
        customers: state.customers.map(c => c.id === customerId ? {
          ...c,
          pets: [...c.pets, {
            id: data.id,
            name: data.name,
            species: data.type,
            breed: data.breed || '',
            birthday: data.birth_date || '',
            notes: petData.notes || '',
            image: data.image_url || '',
            weightHistory: [{ date: new Date().toISOString().split('T')[0], value: Number(data.weight || 0) }],
            serviceHistory: [],
            coatType: petData.coatType,
            color: petData.color,
            temperament: petData.temperament,
            vaccineBookImage: petData.vaccineBookImage,
            precautions: petData.precautions,
            medicalCondition: petData.medicalCondition
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
        medical_condition: petData.medicalCondition,
        precautions: petData.precautions,
        fur_length: petData.coatType,
        image_url: petData.image,
        custom_preferences: [
          { key: 'color', value: petData.color || '' },
          { key: 'temperament', value: petData.temperament || '' },
          { key: 'vaccineBookImage', value: petData.vaccineBookImage || '' },
          { key: 'notes', value: petData.notes || '' }
        ]
      })
      .eq('id', petId);

    if (error) {
      console.error("Error updating pet:", error);
      throw error;
    }

    set((state) => ({
      customers: state.customers.map(c => c.id === customerId ? {
        ...c,
        pets: c.pets.map(p => p.id === petId ? { ...p, ...petData } : p)
      } : c)
    }));
  },

  updatePetWeight: async (customerId, petId, weight) => {
    await supabase
      .from('pets')
      .update({ weight: weight })
      .eq('id', petId);

    const { data, error } = await supabase
      .from('pet_weight_history')
      .insert([{
        pet_id: petId,
        weight: weight,
        date: new Date().toISOString().split('T')[0]
      }])
      .select()
      .single();

    if (error) {
      console.error("Error updating pet weight:", error);
      throw error;
    }

    set((state) => ({
      customers: state.customers.map(c => {
        if (c.id !== customerId) return c;
        return {
          ...c,
          pets: c.pets.map(p => {
            if (p.id !== petId) return p;
            return {
              ...p,
              weightHistory: [...(p.weightHistory || []), { date: data.date, value: Number(data.weight) }]
            };
          })
        };
      })
    }));
  },
});