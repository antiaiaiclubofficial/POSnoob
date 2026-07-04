import { format } from 'date-fns';
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
    let dbStatus = 'pending';
    if (status === 'Checked-in' || status === 'In Progress') dbStatus = 'confirmed';
    else if (status === 'Completed') dbStatus = 'completed';

    const { error } = await supabase
      .from('appointments')
      .update({ status: dbStatus })
      .eq('id', id);

    if (error) {
      console.error("Error updating queue status:", error);
      throw error;
    }

    set((state) => ({
      queue: state.queue.map(q => q.id === id ? { ...q, status } : q)
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
      const { error: storeCustError } = await supabase.from('store_customers').insert([{
        customer_id: data.id,
        store_id: currentStoreId && currentStoreId !== 'default-store' ? currentStoreId : null,
        points: 0,
        tier: 'bronze'
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
          createdAt: data.created_at,
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
    try {
      console.log(`[deleteCustomer] Attempting to delete customer with ID: ${id}`);

      // 1. Fetch pets associated with the customer
      const { data: petsData, error: fetchPetsError } = await supabase
        .from('pets')
        .select('id')
        .eq('customer_id', id);
      console.log(`[deleteCustomer] Fetched pets for customer ${id}:`, petsData, "Supabase Error:", fetchPetsError);
      if (fetchPetsError) throw new Error(`Failed to fetch pets: ${fetchPetsError.message}`);
      
      const petIds = petsData?.map(p => p.id) || [];
      console.log(`[deleteCustomer] Pet IDs to delete:`, petIds);

      // Helper to perform delete and verify
      const performDeleteAndVerify = async (table: string, column: string, values: string[], logPrefix: string) => {
        if (values.length === 0) {
          console.log(`[deleteCustomer] No items to delete in ${table} for ${logPrefix}.`);
          return;
        }
        const { error: deleteError } = await supabase.from(table).delete().in(column, values);
        console.log(`[deleteCustomer] Attempted delete on ${table} for ${logPrefix}: Supabase Error:`, deleteError);
        if (deleteError) throw new Error(`Failed to delete ${table}: ${deleteError.message}`);

        // Verify deletion
        const { data: checkData, error: checkError } = await supabase.from(table).select('id').in(column, values);
        if (checkError) {
          console.error(`[deleteCustomer] Failed to verify ${table} deletion for ${logPrefix}:`, checkError.message);
        } else if (checkData && checkData.length > 0) {
          console.warn(`[deleteCustomer] WARNING: ${table} still exists for ${logPrefix} after delete attempt. Check RLS or foreign key setup. Remaining IDs:`, checkData.map(d => d.id));
        } else {
          console.log(`[deleteCustomer] Verified ${table} successfully deleted for ${logPrefix}.`);
        }
      };

      const performDeleteAndVerifyByCustomerId = async (table: string, customerId: string, logPrefix: string) => {
        const { error: deleteError } = await supabase.from(table).delete().eq('customer_id', customerId);
        console.log(`[deleteCustomer] Attempted delete on ${table} for ${logPrefix}: Supabase Error:`, deleteError);
        if (deleteError) throw new Error(`Failed to delete ${table}: ${deleteError.message}`);

        // Verify deletion
        const { data: checkData, error: checkError } = await supabase.from(table).select('id').eq('customer_id', customerId);
        if (checkError) {
          console.error(`[deleteCustomer] Failed to verify ${table} deletion for ${logPrefix}:`, checkError.message);
        } else if (checkData && checkData.length > 0) {
          console.warn(`[deleteCustomer] WARNING: ${table} still exists for ${logPrefix} after delete attempt. Check RLS or foreign key setup. Remaining IDs:`, checkData.map(d => d.id));
        } else {
          console.log(`[deleteCustomer] Verified ${table} successfully deleted for ${logPrefix}.`);
        }
      };

      // 2. Delete pet-related history
      if (petIds.length > 0) {
        await performDeleteAndVerify('pet_weight_history', 'pet_id', petIds, `pets ${petIds}`);
        await performDeleteAndVerify('pet_health_logs', 'pet_id', petIds, `pets ${petIds}`);
      }

      // 3. Delete service history
      await performDeleteAndVerifyByCustomerId('service_history', id, `customer ${id}`);
      if (petIds.length > 0) {
        await performDeleteAndVerify('service_history', 'pet_id', petIds, `pets ${petIds}`);
      }

      // 4. Delete appointments
      await performDeleteAndVerifyByCustomerId('appointments', id, `customer ${id}`);
      if (petIds.length > 0) {
        await performDeleteAndVerify('appointments', 'pet_id', petIds, `pets ${petIds}`);
      }

      // 5. Delete store_customers entry
      await performDeleteAndVerifyByCustomerId('store_customers', id, `customer ${id}`);

      // 6. Delete points_logs (optional, wrapped in try/catch)
      try {
        const { error: deletePointsLogsError } = await supabase.from('points_logs').delete().eq('customer_id', id);
        console.log(`[deleteCustomer] Attempted delete on points_logs for customer ${id}: Supabase Error:`, deletePointsLogsError);
        if (deletePointsLogsError) console.warn("Failed to delete from points_logs:", deletePointsLogsError.message);
        else {
          const { data: checkData, error: checkError } = await supabase.from('points_logs').select('id').eq('customer_id', id);
          if (checkError) {
            console.error(`[deleteCustomer] Failed to verify points_logs deletion for customer ${id}:`, checkError.message);
          } else if (checkData && checkData.length > 0) {
            console.warn(`[deleteCustomer] WARNING: points_logs still exists for customer ${id} after delete attempt. Check RLS or foreign key setup. Remaining IDs:`, checkData.map(d => d.id));
          } else {
            console.log(`[deleteCustomer] Verified points_logs successfully deleted for customer ${id}.`);
          }
        }
      } catch (e: any) {
        console.warn("Failed to delete from points_logs (catch block):", e.message);
      }

      // 7. Nullify customer_id in sales_transactions (optional, wrapped in try/catch)
      try {
        const { error: updateSalesTransactionsError } = await supabase.from('sales_transactions').update({ customer_id: null }).eq('customer_id', id);
        console.log(`[deleteCustomer] Attempted nullify customer_id in sales_transactions for customer ${id}: Supabase Error:`, updateSalesTransactionsError);
        if (updateSalesTransactionsError) console.warn("Failed to nullify customer_id in sales_transactions:", updateSalesTransactionsError.message);
        else {
          // Verify update: check if customer_id is still present for this customer
          const { data: checkData, error: checkError } = await supabase.from('sales_transactions').select('id').eq('customer_id', id);
          if (checkError) {
            console.error(`[deleteCustomer] Failed to verify sales_transactions update for customer ${id}:`, checkError.message);
          } else if (checkData && checkData.length > 0) {
            console.warn(`[deleteCustomer] WARNING: customer_id still exists in sales_transactions for customer ${id} after update attempt. Check RLS or foreign key setup. Remaining IDs:`, checkData.map(d => d.id));
          } else {
            console.log(`[deleteCustomer] Verified sales_transactions successfully updated for customer ${id}.`);
          }
        }
      } catch (e: any) {
        console.warn("Failed to nullify customer_id in sales_transactions (catch block):", e.message);
      }

      // 8. Delete pets
      if (petIds.length > 0) {
        await performDeleteAndVerify('pets', 'customer_id', [id], `customer ${id}`); // Delete pets by customer_id
      }

      // 9. Delete the customer itself
      const { error: deleteCustomerError } = await supabase.from('customers').delete().eq('id', id);
      console.log(`[deleteCustomer] Attempted delete on customer ${id}: Supabase Error:`, deleteCustomerError);
      if (deleteCustomerError) throw new Error(`Failed to delete customer: ${deleteCustomerError.message}`);
      else {
        const { data: checkData, error: checkError } = await supabase.from('customers').select('id').eq('id', id);
        if (checkError) {
          console.error(`[deleteCustomer] Failed to verify customer deletion for customer ${id}:`, checkError.message);
        } else if (checkData && checkData.length > 0) {
          console.warn(`[deleteCustomer] WARNING: customer still exists for customer ${id} after delete attempt. Check RLS or foreign key setup. Remaining IDs:`, checkData.map(d => d.id));
        } else {
          console.log(`[deleteCustomer] Verified customer successfully deleted for customer ${id}.`);
        }
      }

      // Update local state
      set((state) => ({
        customers: state.customers.filter(c => c.id !== id),
        selectedOwner: state.selectedOwner?.id === id ? null : state.selectedOwner,
        activePet: state.selectedOwner?.id === id ? null : state.activePet
      }));
      console.log(`[deleteCustomer] Customer ${id} successfully deleted from local state.`);
    } catch (error: any) {
      console.error("Comprehensive delete customer error:", error.message);
      throw new Error(`ไม่สามารถลบลูกค้าได้: ${error.message}`); // Re-throw with a user-friendly message
    }
  },

  bindLineToCustomer: async (customerId, lineId) => {
    const { error } = await supabase
      .from('customers')
      .update({ line_user_id: lineId })
      .eq('id', customerId);

    if (error) {
      console.error("Error binding LINE to customer:", error);
      throw error;
    }

    set(state => ({
      customers: state.customers.map(c => c.id === customerId ? { ...c, lineId } : c)
    }));
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
        weight: Number(petData.initialWeight),
        medical_condition: petData.medicalCondition,
        precautions: petData.precautions,
        fur_length: petData.coatType,
        image_url: petData.image,
        custom_preferences: {
          color: petData.color,
          temperament: petData.temperament,
          notes: petData.notes
        }
      }])
      .select()
      .single();

    if (error) {
      console.error("Error adding pet:", error);
      throw error;
    }

    if (data) {
      if (petData.initialWeight) {
        await supabase.from('pet_weight_history').insert([{
          pet_id: data.id,
          weight: Number(petData.initialWeight),
          date: format(new Date(), 'yyyy-MM-dd')
        }]);
      }

      const newPet: Pet = {
        id: data.id,
        name: data.name,
        species: data.type,
        breed: data.breed,
        birthday: data.birth_date,
        weightHistory: data.weight ? [{ date: format(new Date(), 'yyyy-MM-dd'), value: Number(data.weight) }] : [],
        serviceHistory: [],
        notes: data.medical_condition || '',
        image: data.image_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&h=200&fit=crop',
        coatType: data.fur_length,
        color: data.custom_preferences?.color,
        temperament: data.custom_preferences?.temperament,
        precautions: data.precautions,
        medicalCondition: data.medical_condition,
      };

      set(state => ({
        customers: state.customers.map(c =>
          c.id === customerId ? { ...c, pets: [...c.pets, newPet] } : c
        )
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
        custom_preferences: {
          color: petData.color,
          temperament: petData.temperament,
          notes: petData.notes
        }
      })
      .eq('id', petId);

    if (error) {
      console.error("Error updating pet:", error);
      throw error;
    }

    set(state => ({
      customers: state.customers.map(c =>
        c.id === customerId
          ? {
              ...c,
              pets: c.pets.map(p =>
                p.id === petId ? {
                  ...p,
                  name: petData.name,
                  species: petData.species,
                  breed: petData.breed,
                  birthday: petData.birthday,
                  notes: petData.medicalCondition, // This maps to medical_condition in DB
                  image: petData.image,
                  coatType: petData.coatType,
                  color: petData.color,
                  temperament: petData.temperament,
                  precautions: petData.precautions,
                  medicalCondition: petData.medicalCondition,
                } : p
              )
            }
          : c
      )
    }));
  },

  updatePetWeight: async (customerId, petId, weight) => {
    const { error } = await supabase
      .from('pet_weight_history')
      .insert([{
        pet_id: petId,
        weight: weight,
        date: format(new Date(), 'yyyy-MM-dd')
      }]);

    if (error) {
      console.error("Error updating pet weight:", error);
      throw error;
    }

    set(state => ({
      customers: state.customers.map(c =>
        c.id === customerId
          ? {
              ...c,
              pets: c.pets.map(p =>
                p.id === petId
                  ? {
                      ...p,
                      weightHistory: [...(p.weightHistory || []), { date: format(new Date(), 'yyyy-MM-dd'), value: weight }]
                    }
                  : p
              )
            }
          : c
      )
    }));
  },

  saveIntakeRecord: async (customerId, petId, record) => {
    const { error } = await supabase
      .from('pet_health_logs')
      .insert([{
        pet_id: petId,
        type: 'intake',
        date: record.date || format(new Date(), 'yyyy-MM-dd'),
        description: JSON.stringify(record.details),
        staff_name: record.staffName,
        signature_url: record.signature,
        weight: record.weight
      }]);

    if (error) {
      console.error("Error saving intake record:", error);
      throw error;
    }

    set(state => ({
      customers: state.customers.map(c =>
        c.id === customerId
          ? {
              ...c,
              pets: c.pets.map(p =>
                p.id === petId
                  ? {
                      ...p,
                      intakeHistory: [...(p.intakeHistory || []), {
                        id: `intake-${Date.now()}`,
                        queueItemId: record.queueItemId,
                        date: record.date || format(new Date(), 'yyyy-MM-dd'),
                        weight: record.weight,
                        details: record.details,
                        signature: record.signature,
                        staffName: record.staffName
                      }]
                    }
                  : p
              )
            }
          : c
      )
    }));
  }
});

const newStartIntake = (item: any) => {
  return {
    id: item.id,
    queueItemId: item.queueItemId,
    date: item.date,
    weight: item.weight,
    details: item.details,
    signature: item.signature,
    staffName: item.staffName
  };
};