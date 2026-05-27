import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  AppState, QueueStatus, TierRule, MembershipLevel, Pet, Customer, 
  QueueItem, Service, InventoryItem, Partner, StockLog, Transaction, 
  Staff, ActivityLog, AddonItem, PackageTemplate, CreditPackageTemplate, 
  PaymentMethod, ServicePriceInfo, SubService, BookingType, ServiceIcon, StaffRole, ReportHistory 
} from './types';

export type { 
  AppState, QueueStatus, TierRule, MembershipLevel, Pet, Customer, 
  QueueItem, Service, InventoryItem, Partner, StockLog, Transaction, 
  Staff, ActivityLog, AddonItem, PackageTemplate, CreditPackageTemplate, 
  PaymentMethod, ServicePriceInfo, SubService, BookingType, ServiceIcon, StaffRole, ReportHistory 
};

export const useStore = create<AppState>()((set, get) => ({
  language: 'th',
  setLanguage: (lang) => set({ language: lang }),
  currency: '฿',
  isAuthenticated: true,
  isAuthLoading: false,
  currentUser: { id: 'admin', name: 'Admin User', role: 'Admin', username: 'admin' },
  storeId: 'default-store',

  shopName: 'Mellow Fellow Sanctuary',
  shopLogo: null,
  shopAddress: '123 Sukhumvit, Bangkok 10110',
  shopPhone: '02-999-9999',
  shopLineId: '@mellowfellow',
  shopIsOpen: true,
  receiptHeader: 'Tax Invoice / Receipt',
  receiptFooter: 'Thank you for your visit!',
  receiptPaperSize: '80mm',

  customers: [],
  selectedOwner: null,
  activePet: null,
  activeQueueItemId: null,
  queue: [],
  slotDuration: 60,
  openTime: '09:00',
  closeTime: '19:00',
  maxCapacity: 3,
  disabledSlots: [],
  recurringHolidays: [0], 
  specificHolidays: [],
  kennelCapacity: 12,

  services: [],
  addons: [],
  inventory: [],
  partners: [
    { 
      id: 'p1', 
      companyName: 'บริษัท เพ็ทฟู้ด จำกัด', 
      gpRate: 20,
      contactPerson: 'คุณสมชาย',
      phone: '081-234-5678',
      email: 'contact@petfood.com',
      notes: 'ส่งสินค้าทุกวันจันทร์',
      mainCategory: 'อาหารสัตว์'
    }
  ],
  stockLogs: [],
  reportHistory: [],
  transactions: [],
  staff: [],
  logs: [],
  cart: [],
  packageTemplates: [],
  creditPackages: [],
  tierRules: [
    { level: 'Standard', label: 'Standard', minSpent: 0, discount: 0 },
    { level: 'Silver', label: 'Silver Member', minSpent: 5000, discount: 5 },
    { level: 'Gold', label: 'Gold Member', minSpent: 15000, discount: 10 },
    { level: 'VIP', label: 'VIP Member', minSpent: 50000, discount: 15 },
  ],

  login: (id, pass) => true,
  loginWithGoogle: async () => {},
  setSession: (user) => {},
  logout: () => set({ isAuthenticated: false, currentUser: null, storeId: null }),
  verifyPassword: (pass) => pass === '1234',
  addLog: (log) => set(s => ({ 
    logs: [{ ...log, id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toISOString() } as ActivityLog, ...s.logs] 
  })),
  addReportLog: (log) => set(s => ({
    reportHistory: [{ ...log, id: `REP-${Math.random().toString(36).substr(2, 5).toUpperCase()}`, timestamp: new Date().toISOString() }, ...s.reportHistory]
  })),

  updateBusinessProfile: (profile) => set(s => ({ ...s, ...profile })),
  updateBookingSettings: (settings) => set(s => ({ ...s, ...settings })),
  updateTierRules: (rules) => set({ tierRules: rules }),

  setCustomers: (customers) => set({ customers }),
  selectOwner: (owner) => set({ selectedOwner: owner, activePet: owner ? owner.pets[0] : null, activeQueueItemId: null }),
  setActivePet: (pet) => set({ activePet: pet }),
  setActiveQueueItem: (id) => set({ activeQueueItemId: id }),

  addCustomer: async (customerData) => {
    const { data: inserted, error } = await supabase
      .from('customers')
      .insert([{ 
        first_name: customerData.firstName || customerData.name.split(' ')[0] || '',
        last_name: customerData.lastName || customerData.name.split(' ').slice(1).join(' ') || '',
        display_name: customerData.name,
        phone: customerData.phone,
        email: customerData.email,
        membership: customerData.membership || 'Standard',
        tax_id: customerData.taxId,
        branch_name: customerData.branchName,
        house_no: customerData.houseNo,
        village_no: customerData.villageNo,
        soi: customerData.soi,
        road: customerData.road,
        sub_district: customerData.subDistrict,
        district: customerData.district,
        province: customerData.province,
        postal_code: customerData.postalCode,
        points: 0, 
        total_spent: 0,
        credit_balance: 0
      }])
      .select()
      .single();

    if (error) {
      toast.error("Failed to add customer to Supabase");
      console.error(error);
      return;
    }

    if (inserted) {
      const formatted = {
        id: inserted.id,
        name: inserted.display_name || `${inserted.first_name || ''} ${inserted.last_name || ''}`.trim(),
        firstName: inserted.first_name,
        lastName: inserted.last_name,
        phone: inserted.phone || '-',
        email: inserted.email || '-',
        lineId: inserted.line_id,
        membership: (inserted.membership as MembershipLevel) || 'Standard',
        points: inserted.points || 0,
        totalSpent: inserted.total_spent || 0,
        creditBalance: inserted.credit_balance || 0,
        pets: [],
        packages: [],
        creditHistory: []
      };
      set((state) => ({
        customers: [...state.customers, formatted]
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
        membership: customerData.membership,
        tax_id: customerData.taxId,
        branch_name: customerData.branchName,
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
      toast.error("Failed to update customer in Supabase");
      console.error(error);
      return;
    }

    set((state) => ({
      customers: state.customers.map(c => c.id === id ? { ...c, ...customerData } : c)
    }));
  },

  deleteCustomer: async (id) => {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Failed to delete customer from Supabase");
      console.error(error);
      return;
    }

    set((state) => ({
      customers: state.customers.filter(c => c.id !== id),
      selectedOwner: state.selectedOwner?.id === id ? null : state.selectedOwner,
      activePet: state.selectedOwner?.id === id ? null : state.activePet
    }));
  },

  bindLineToCustomer: async (customerId, lineId) => {
    const { error } = await supabase
      .from('customers')
      .update({ line_id: lineId })
      .eq('id', customerId);

    if (error) {
      toast.error("Failed to bind LINE ID in Supabase");
      console.error(error);
      return;
    }

    set((state) => ({
      customers: state.customers.map(c => c.id === customerId ? { ...c, lineId } : c)
    }));
  },

  addPet: async (customerId, petData) => {
    const { data: inserted, error } = await supabase
      .from('pets')
      .insert([{ 
        customer_id: customerId,
        name: petData.name,
        species: petData.species,
        breed: petData.breed,
        birthday: petData.birthday,
        notes: petData.notes,
        image: petData.image,
        weight_history: petData.weightHistory || []
      }])
      .select()
      .single();

    if (error) {
      toast.error("Failed to add pet to Supabase");
      console.error(error);
      return;
    }

    if (inserted) {
      const formattedPet = {
        id: inserted.id,
        name: inserted.name,
        species: inserted.species as 'Dog' | 'Cat' | 'Other',
        breed: inserted.breed || '-',
        birthday: inserted.birthday || '',
        notes: inserted.notes || '',
        image: inserted.image || '',
        weightHistory: inserted.weight_history || [],
        serviceHistory: []
      };
      set((state) => ({
        customers: state.customers.map(c => c.id === customerId ? {
          ...c,
          pets: [...c.pets, formattedPet]
        } : c)
      }));
    }
  },

  updatePet: async (customerId, petId, petData) => {
    const { error } = await supabase
      .from('pets')
      .update({
        name: petData.name,
        species: petData.species,
        breed: petData.breed,
        birthday: petData.birthday,
        notes: petData.notes,
        image: petData.image
      })
      .eq('id', petId);

    if (error) {
      toast.error("Failed to update pet in Supabase");
      console.error(error);
      return;
    }

    set((state) => ({
      customers: state.customers.map(c => c.id === customerId ? {
        ...c,
        pets: c.pets.map(p => p.id === petId ? { ...p, ...petData } : p)
      } : c)
    }));
  },

  updatePetWeight: async (customerId, petId, weight) => {
    const { data: currentPet, error: fetchError } = await supabase
      .from('pets')
      .select('weight_history')
      .eq('id', petId)
      .single();

    if (fetchError) {
      toast.error("Failed to fetch pet weight history");
      return;
    }

    const newHistory = [...(currentPet?.weight_history || []), { date: new Date().toISOString().split('T')[0], value: weight }];
    
    const { error: updateError } = await supabase
      .from('pets')
      .update({ weight_history: newHistory })
      .eq('id', pid => petId);
    
    if (updateError) {
      toast.error("Failed to update pet weight in Supabase");
      return;
    }

    set((state) => ({
      customers: state.customers.map(c => c.id === customerId ? {
        ...c,
        pets: c.pets.map(p => p.id === petId ? { ...p, weightHistory: newHistory } : p)
      } : c)
    }));
  },

  saveIntakeRecord: (cid, pid, rec) => {},

  addBooking: (b) => set(s => ({ queue: [...s.queue, { ...b, id: Math.random().toString() }] })),
  updateQueueStatus: (id, status) => set(s => ({ queue: s.queue.map(q => q.id === id ? { ...q, status } : q) })),
  removeQueueItem: (id) => set(s => ({ queue: s.queue.filter(q => q.id !== id) })),
  toggleSlotStatus: (time) => set(s => ({ disabledSlots: s.disabledSlots.includes(time) ? s.disabledSlots.filter(t => t !== time) : [...s.disabledSlots, time] })),
  markAsPaid: (id) => set(s => ({ queue: s.queue.map(q => q.id === id ? { ...q, isPaid: true } : q) })),

  addToCart: (item) => set(s => ({ cart: [...s.cart, item] })),
  removeFromCart: (idx) => set(s => ({ cart: s.cart.filter((_, i) => i !== idx) })),
  updateCartQuantity: (idx, delta) => set(s => ({ cart: s.cart.map((item, i) => i === idx ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item) })),
  clearCart: () => set({ cart: [] }),
  processPayment: (cid, total, disc, items, method, details, tax) => {
    const tx = { id: `TX-${Date.now()}`, date: new Date().toISOString().split('T')[0], amount: total, discountAmount: disc, customerId: cid, customerName: get().customers.find(c => c.id === cid)?.name || 'Walk-in', items, paymentMethod: method, staffName: 'Admin', species: [], bookingType: 'Walk-in' };
    set(s => ({ transactions: [tx as any, ...s.transactions] }));
  },
  deleteTransaction: (id) => set(s => ({ transactions: s.transactions.filter(t => t.id !== id) })),

  addService: (ser) => set(s => ({ services: [...s.services, { ...ser, id: Math.random().toString() }] })),
  updateService: (id, ser) => set(s => ({ services: s.services.map(s => s.id === id ? { ...s, ...ser } : s) })),
  deleteService: (id) => set(s => ({ services: s.services.filter(s => s.id !== id) })),
  toggleServiceActive: (id) => set(s => ({ services: s.services.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s) })),

  addAddon: (ad) => set(s => ({ addons: [...s.addons, { ...ad, id: Math.random().toString() }] })),
  updateAddon: (id, ad) => set(s => ({ addons: s.addons.map(a => a.id === id ? { ...a, ...ad } : a) })),
  deleteAddon: (id) => set(s => ({ addons: s.addons.filter(a => a.id !== id) })),

  addInventoryItem: (i) => set(s => ({ inventory: [...s.inventory, { ...i, id: Math.random().toString() }] })),
  updateInventoryItem: (id, i) => set(s => ({ inventory: s.inventory.map(item => item.id === id ? { ...item, ...i } : item) })),
  deleteInventoryItem: (id) => set(s => ({ inventory: s.inventory.filter(i => i.id !== id) })),
  adjustStock: (id, qty, mode, reason) => {
    const item = get().inventory.find(i => i.id === id);
    if (!item) return;
    const oldQty = item.stock;
    const newQty = mode === 'Add' || mode === 'In' ? oldQty + qty : mode === 'Out' ? oldQty - qty : qty;
    set(s => ({ inventory: s.inventory.map(i => i.id === id ? { ...i, stock: newQty } : i) }));
  },

  addPartner: (v) => set(s => ({ partners: [...s.partners, { ...v, id: Math.random().toString() }] })),
  updatePartner: (id, v) => set(s => ({ partners: s.partners.map(p => p.id === id ? { ...p, ...v } : p) })),
  deletePartner: (id) => set(s => ({ partners: s.partners.filter(p => p.id !== id) })),

  addStaff: (st) => set(s => ({ staff: [...s.staff, { ...st, id: Math.random().toString() }] })),
  updateStaff: (id, st) => set(s => ({ staff: s.staff.map(mem => mem.id === id ? { ...mem, ...st } : mem) })),
  deleteStaff: (id) => set(s => ({ staff: s.staff.filter(mem => mem.id !== id) })),

  addPackageTemplate: (pkg) => set(s => ({ packageTemplates: [...s.packageTemplates, { ...pkg, id: Math.random().toString() }] })),
  updatePackageTemplate: (id, pkg) => set(s => ({ packageTemplates: s.packageTemplates.map(p => p.id === id ? { ...p, ...pkg } : p) })),
  deletePackageTemplate: (id) => set(s => ({ packageTemplates: s.packageTemplates.filter(p => p.id !== id) })),
  assignPackageToCustomer: (cid, tid) => {},

  addCreditPackage: (pkg) => set(s => ({ creditPackages: [...s.creditPackages, { ...pkg, id: Math.random().toString() }] })),
  updateCreditPackage: (id, pkg) => set(s => ({ creditPackages: s.creditPackages.map(p => p.id === id ? { ...p, ...pkg } : p) })),
  deleteCreditPackage: (id) => set(s => ({ creditPackages: s.creditPackages.filter(p => p.id !== id) })),
  buyCreditPackage: (cid, pid) => {},
}));