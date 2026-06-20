import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  AppState, QueueStatus, TierRule, MembershipLevel, Pet, Customer, 
  QueueItem, Service, InventoryItem, Partner, StockLog, Transaction, 
  Staff, ActivityLog, AddonItem, PackageTemplate, CreditPackageTemplate, 
  PaymentMethod, ServicePriceInfo, SubService, BookingType, ServiceIcon, StaffRole, ReportHistory 
} from './types';
import { createAuthSlice } from './slices/authSlice';
import { createCRMSlice } from './slices/crmSlice';

export type { 
  AppState, QueueStatus, TierRule, MembershipLevel, Pet, Customer, 
  QueueItem, Service, InventoryItem, Partner, StockLog, Transaction, 
  Staff, ActivityLog, AddonItem, PackageTemplate, CreditPackageTemplate, 
  PaymentMethod, ServicePriceInfo, SubService, BookingType, ServiceIcon, StaffRole, ReportHistory 
};

const DEFAULT_MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'mock-cust-1',
    name: 'คุณสมชาย ใจดี',
    firstName: 'สมชาย',
    lastName: 'ใจดี',
    phone: '081-234-5678',
    email: 'somchai@gmail.com',
    lineId: 'somchai_line',
    membership: 'Gold',
    totalSpent: 12500,
    creditBalance: 1500,
    points: 120,
    gender: 'Male',
    age: '34',
    houseNo: '12/3',
    villageNo: '5',
    soi: 'สุขุมวิท 23',
    road: 'สุขุมวิท',
    subDistrict: 'คลองเตยเหนือ',
    district: 'วัฒนา',
    province: 'กรุงเทพมหานคร',
    postalCode: '10110',
    creditHistory: [],
    packages: [],
    pets: [
      {
        id: 'mock-pet-1',
        name: 'บัดดี้ (Buddy)',
        species: 'Dog',
        breed: 'Golden Retriever',
        birthday: '2021-06-15',
        weightHistory: [
          { date: '2024-01-10', value: 28.5 },
          { date: '2024-03-15', value: 29.2 },
          { date: '2024-05-20', value: 30.1 }
        ],
        serviceHistory: [
          { id: 'sh-1', serviceName: 'อาบน้ำตัดขนสุนัsขใหญ่', date: '2024-05-20', price: 1200 }
        ],
        notes: 'แพ้แชมพูสูตรเย็น, กลัวเสียงไดร์เป่าผมแรงๆ',
        image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop',
        coatType: 'Long',
        color: 'สีทอง',
        temperament: 'เป็นมิตร ขี้เล่น',
        precautions: 'ระวังเรื่องหูอักเสบง่าย',
        medicalCondition: 'ไม่มี'
      }
    ]
  },
  {
    id: 'mock-cust-2',
    name: 'คุณวิภาดา รักดี',
    firstName: 'วิภาดา',
    lastName: 'รักดี',
    phone: '089-876-5432',
    email: 'wipada@hotmail.com',
    lineId: '',
    membership: 'Standard',
    totalSpent: 3200,
    creditBalance: 0,
    points: 45,
    gender: 'Female',
    age: '28',
    houseNo: '99/1',
    villageNo: '2',
    soi: 'ลาดพร้าว 101',
    road: 'ลาดพร้าว',
    subDistrict: 'คลองจั่น',
    district: 'บางกะปิ',
    province: 'กรุงเทพมหานคร',
    postalCode: '10240',
    creditHistory: [],
    packages: [],
    pets: [
      {
        id: 'mock-pet-2',
        name: 'มิมี่ (Mimi)',
        species: 'Cat',
        breed: 'Persian',
        birthday: '2022-02-10',
        weightHistory: [
          { date: '2024-02-10', value: 4.1 },
          { date: '2024-04-12', value: 4.3 }
        ],
        serviceHistory: [
          { id: 'sh-2', serviceName: 'สปาแมวพรีเมียม', date: '2024-04-12', price: 800 }
        ],
        notes: 'ไม่ชอบให้จับหาง, ดุเวลากล้อนขนหน้าท้อง',
        image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop',
        coatType: 'Long',
        color: 'สีขาว-เทา',
        temperament: 'รักสงบ ขี้กลัว',
        precautions: 'ระวังการแปรงขนบริเวณท้อง',
        medicalCondition: 'โรคผิวหนังอักเสบง่าย'
      }
    ]
  }
];

const DEFAULT_MOCK_SERVICES: Service[] = [
  {
    id: '1',
    title: 'อาบน้ำตัดขนสุนัข',
    category: 'Grooming',
    description: 'บริการอาบน้ำ แปรงขน ตัดเล็บ เช็ดหู และตัดแต่งทรงผมสำหรับสุนัข',
    icon: 'grooming',
    targetSpecies: 'Dog',
    prices: {
      'Small': { price: 500, duration: 60 },
      'Medium': { price: 700, duration: 90 },
      'Large': { price: 1000, duration: 120 }
    },
    isActive: true,
    coatType: 'Short'
  },
  {
    id: '2',
    title: 'สปาแมวพรีเมียม',
    category: 'Spa',
    description: 'บริการสปาบำรุงขนด้วยแชมพูสูตรพิเศษ นวดผ่อนคลาย และเป่าขนไล่น้ำ',
    icon: 'spa',
    targetSpecies: 'Cat',
    prices: {
      'Standard': { price: 800, duration: 90 }
    },
    isActive: true,
    coatType: 'Long'
  }
];

const DEFAULT_MOCK_ADDONS: AddonItem[] = [
  { id: 'addon-1', name: 'ตัดเล็บและตะไบเล็บ', price: 150, icon: 'nail' },
  { id: 'addon-2', name: 'แปรงฟันลดกลิ่นปาก', price: 100, icon: 'brush' },
  { id: 'addon-3', name: 'สปาโคลนบำรุงผิวหนัง', price: 300, icon: 'spa' }
];

export const useStore = create<AppState>()((set, get, store) => ({
  // Spread Slices
  ...createAuthSlice(set, get, store),
  ...createCRMSlice(set, get, store),

  // Global State
  language: 'th',
  setLanguage: (lang) => set({ language: lang }),
  currency: '฿',

  shopName: 'Mellow Fellow Sanctuary',
  shopLogo: null,
  shopAddress: '123 Sukhumvit, Bangkok 10110',
  shopPhone: '02-999-9999',
  shopLineId: '@mellowfellow',
  shopIsOpen: true,
  receiptHeader: 'Tax Invoice / Receipt',
  receiptFooter: 'Thank you for your visit!',
  receiptPaperSize: '80mm',
  vatEnabled: typeof window !== 'undefined' ? (localStorage.getItem('vat_enabled') === 'true') : false,
  companyName: typeof window !== 'undefined' ? localStorage.getItem('company_name') || 'Mellow Fellow Co., Ltd.' : 'Mellow Fellow Co., Ltd.',
  companyAddress: typeof window !== 'undefined' ? localStorage.getItem('company_address') || '123 Sukhumvit, Bangkok 10110' : '123 Sukhumvit, Bangkok 10110',
  companyTaxId: typeof window !== 'undefined' ? localStorage.getItem('company_tax_id') || '0105550000000' : '0105550000000',
  companyPhone: typeof window !== 'undefined' ? localStorage.getItem('company_phone') || '02-999-9999' : '02-999-9999',
  companyEmail: typeof window !== 'undefined' ? localStorage.getItem('company_email') || 'info@mellowfellow.com' : 'info@mellowfellow.com',
  vatRate: typeof window !== 'undefined' ? parseFloat(localStorage.getItem('vat_rate') || '7') : 7,
  pointsEarnRate: typeof window !== 'undefined' ? parseFloat(localStorage.getItem('points_earn_rate') || '100') : 100, // 1 point per X baht
  pointsRedeemRate: typeof window !== 'undefined' ? parseFloat(localStorage.getItem('points_redeem_rate') || '1') : 1, // 1 point = X baht

  liffId: typeof window !== 'undefined' ? localStorage.getItem('liff_id') || '' : '',
  liffChannelId: typeof window !== 'undefined' ? localStorage.getItem('liff_channel_id') || '' : '',
  liffChannelSecret: typeof window !== 'undefined' ? localStorage.getItem('liff_channel_secret') || '' : '',
  liffEnabled: typeof window !== 'undefined' ? (localStorage.getItem('liff_enabled') === 'true') : false,

  customers: DEFAULT_MOCK_CUSTOMERS,
  selectedOwner: null,
  activePet: null,
  activeQueueItemId: null,
  queue: [],
  services: DEFAULT_MOCK_SERVICES,
  addons: DEFAULT_MOCK_ADDONS,
  inventory: [],
  partners: [],
  stockLogs: [],
  reportHistory: [],
  transactions: [],
  tierRules: [
    { level: 'Standard', label: 'Standard', minSpent: 0, discount: 0 },
    { level: 'Silver', label: 'Silver', minSpent: 5000, discount: 5 },
    { level: 'Gold', label: 'Gold', minSpent: 15000, discount: 10 },
    { level: 'VIP', label: 'VIP', minSpent: 30000, discount: 15 },
  ],
  packageTemplates: [],
  creditPackages: [],
  staff: [], // This will now be populated from profiles table
  logs: [],
  cart: [],
  rolePermissions: {
    'superadmin': ['all'],
    'Admin': ['manage_customers', 'manage_pets', 'manage_queue', 'manage_services', 'manage_inventory', 'manage_partners', 'view_reports', 'manage_staff', 'manage_settings', 'process_transactions'],
    'Groomer': ['manage_customers', 'manage_pets', 'manage_queue', 'process_transactions'],
    'Assistant': ['manage_customers', 'manage_pets', 'manage_queue', 'process_transactions'],
  },

  slotDuration: 30,
  openTime: '09:00',
  closeTime: '18:00',
  maxCapacity: 5,
  disabledSlots: [],
  recurringHolidays: [0, 6], // Sunday and Saturday
  specificHolidays: [],
  kennelCapacity: 10,

  // Actions
  addLog: (log) => set((state) => ({
    logs: [...state.logs, { ...log, id: crypto.randomUUID(), timestamp: new Date().toISOString() }]
  })),
  addReportLog: (log) => set((state) => ({
    reportHistory: [...state.reportHistory, { ...log, id: crypto.randomUUID(), timestamp: new Date().toISOString() }]
  })),

  updateBusinessProfile: (profile) => {
    set(profile);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vat_enabled', profile.vatEnabled);
      localStorage.setItem('company_name', profile.companyName);
      localStorage.setItem('company_address', profile.companyAddress);
      localStorage.setItem('company_tax_id', profile.companyTaxId);
      localStorage.setItem('company_phone', profile.companyPhone);
      localStorage.setItem('company_email', profile.companyEmail);
      localStorage.setItem('vat_rate', profile.vatRate);
      localStorage.setItem('points_earn_rate', profile.pointsEarnRate);
      localStorage.setItem('points_redeem_rate', profile.pointsRedeemRate);
      localStorage.setItem('liff_id', profile.liffId);
      localStorage.setItem('liff_channel_id', profile.liffChannelId);
      localStorage.setItem('liff_channel_secret', profile.liffChannelSecret);
      localStorage.setItem('liff_enabled', profile.liffEnabled);
    }
    toast.success('Business profile updated!');
  },
  updateBookingSettings: (settings) => {
    set(settings);
    toast.success('Booking settings updated!');
  },
  updateTierRules: (rules) => {
    set({ tierRules: rules });
    toast.success('Tier rules updated!');
  },
  updateRolePermissions: (role, permissions) => {
    set((state) => ({
      rolePermissions: {
        ...state.rolePermissions,
        [role]: permissions,
      },
    }));
    toast.success(`Permissions for ${role} updated!`);
  },

  setCustomers: (customers) => set({ customers }),
  selectOwner: (owner) => set({ selectedOwner: owner }),
  setActivePet: (pet) => set({ activePet: pet }),
  setActiveQueueItem: (id) => set({ activeQueueItemId: id }),
  addCustomer: (data) => set((state) => ({
    customers: [...state.customers, { id: crypto.randomUUID(), pets: [], totalSpent: 0, creditBalance: 0, membership: 'Standard', ...data }]
  })),
  updateCustomer: (id, data) => set((state) => ({
    customers: state.customers.map(c => c.id === id ? { ...c, ...data } : c)
  })),
  deleteCustomer: (id) => set((state) => ({
    customers: state.customers.filter(c => c.id !== id)
  })),
  bindLineToCustomer: (customerId, lineId) => set((state) => ({
    customers: state.customers.map(c => c.id === customerId ? { ...c, lineId } : c)
  })),

  addPet: (customerId, pet) => set((state) => ({
    customers: state.customers.map(c =>
      c.id === customerId ? { ...c, pets: [...c.pets, { id: crypto.randomUUID(), weightHistory: [], serviceHistory: [], notes: '', image: '', ...pet }] } : c
    )
  })),
  updatePet: (customerId, petId, data) => set((state) => ({
    customers: state.customers.map(c =>
      c.id === customerId ? { ...c, pets: c.pets.map(p => p.id === petId ? { ...p, ...data } : p) } : c
    )
  })),
  updatePetWeight: (customerId, petId, weight) => set((state) => ({
    customers: state.customers.map(c =>
      c.id === customerId ? {
        ...c,
        pets: c.pets.map(p =>
          p.id === petId ? { ...p, weightHistory: [...p.weightHistory, { date: new Date().toISOString().split('T')[0], value: weight }] } : p
        )
      } : c
    )
  })),
  saveIntakeRecord: (customerId, petId, record) => set((state) => ({
    customers: state.customers.map(c =>
      c.id === customerId ? {
        ...c,
        pets: c.pets.map(p =>
          p.id === petId ? { ...p, intakeHistory: [...(p.intakeHistory || []), record] } : p
        )
      } : c
    )
  })),

  addBooking: (booking) => set((state) => ({
    queue: [...state.queue, { id: crypto.randomUUID(), status: 'Waiting', ...booking }]
  })),
  updateQueueStatus: (id, status) => set((state) => ({
    queue: state.queue.map(item => item.id === id ? { ...item, status } : item)
  })),
  removeQueueItem: (id) => set((state) => ({
    queue: state.queue.filter(item => item.id !== id)
  })),
  toggleSlotStatus: (time) => set((state) => ({
    disabledSlots: state.disabledSlots.includes(time)
      ? state.disabledSlots.filter(slot => slot !== time)
      : [...state.disabledSlots, time]
  })),
  markAsPaid: (id) => set((state) => ({
    queue: state.queue.map(item => item.id === id ? { ...item, isPaid: true } : item)
  })),

  addToCart: (item) => set((state) => ({ cart: [...state.cart, { ...item, cartItemId: crypto.randomUUID() }] })),
  removeFromCart: (cartItemId) => set((state) => ({ cart: state.cart.filter(item => item.cartItemId !== cartItemId) })),
  updateCartQuantity: (cartItemId, delta) => set((state) => ({
    cart: state.cart.map(item => item.cartItemId === cartItemId ? { ...item, quantity: Math.max(1, (item.quantity || 1) + delta) } : item)
  })),
  updateCartItemDiscount: (cartItemId, discountType, discountValue) => set((state) => ({
    cart: state.cart.map(item => item.cartItemId === cartItemId ? { ...item, discountType, discountValue } : item)
  })),
  clearCart: () => set({ cart: [] }),
  processPayment: (customerId, total, discount, items, method, details, isTaxInvoice, redeemedPoints) => {
    set((state) => {
      const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        date: new Date().toISOString().split('T')[0],
        amount: total,
        discountAmount: discount,
        customerId: customerId,
        customerName: state.customers.find(c => c.id === customerId)?.name || 'Unknown',
        items: items,
        paymentMethod: method,
        staffName: state.currentUser?.name || 'System',
        staffId: state.currentUser?.id,
        species: Array.from(new Set(items.flatMap((item: any) => item.species || []))),
        bookingType: 'Walk-in', // Default, can be updated
      };
      return {
        transactions: [...state.transactions, newTransaction],
        cart: [],
      };
    });
    toast.success('Payment processed successfully!');
  },
  deleteTransaction: (id) => set((state) => ({
    transactions: state.transactions.filter(t => t.id !== id)
  })),

  setServices: (services) => set({ services }),
  addService: (service) => set((state) => ({
    services: [...state.services, { id: crypto.randomUUID(), isActive: true, ...service }]
  })),
  updateService: (id, service) => set((state) => ({
    services: state.services.map(s => s.id === id ? { ...s, ...service } : s)
  })),
  deleteService: (id) => set((state) => ({
    services: state.services.filter(s => s.id !== id)
  })),
  toggleServiceActive: (id) => set((state) => ({
    services: state.services.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s)
  })),

  addAddon: (addon) => set((state) => ({
    addons: [...state.addons, { id: crypto.randomUUID(), ...addon }]
  })),
  updateAddon: (id, addon) => set((state) => ({
    addons: state.addons.map(a => a.id === id ? { ...a, ...addon } : a)
  })),
  deleteAddon: (id) => set((state) => ({
    addons: state.addons.filter(a => a.id !== id)
  })),

  addInventoryItem: (item) => set((state) => ({
    inventory: [...state.inventory, { id: crypto.randomUUID(), stock: 0, minStock: 0, isConsignment: false, ...item }]
  })),
  updateInventoryItem: (id, item) => set((state) => ({
    inventory: state.inventory.map(i => i.id === id ? { ...i, ...item } : i)
  })),
  deleteInventoryItem: (id) => set((state) => ({
    inventory: state.inventory.filter(i => i.id !== id)
  })),
  adjustStock: (id, qty, mode, reason) => set((state) => {
    const item = state.inventory.find(i => i.id === id);
    if (!item) return state;

    const oldQty = item.stock;
    let newQty = oldQty;
    let actionType: StockLog['action'] = 'Adjust'; // Default to Adjust

    if (mode === 'Add') {
      newQty = oldQty + qty;
      actionType = 'Add';
    } else if (mode === 'Set') {
      newQty = qty;
      actionType = 'Adjust'; // Map 'Set' to 'Adjust' for logging
    } else if (mode === 'In') {
      newQty = oldQty + qty;
      actionType = 'In';
    } else if (mode === 'Out') {
      newQty = oldQty - qty;
      actionType = 'Out';
    }

    const newLog: StockLog = {
      id: crypto.randomUUID(),
      productId: id,
      productName: item.name,
      action: actionType, // Use the determined actionType
      oldQty: oldQty,
      newQty: newQty,
      reason: reason,
      staffName: state.currentUser?.name || 'System',
      timestamp: new Date().toISOString(),
    };

    return {
      inventory: state.inventory.map(i => i.id === id ? { ...i, stock: newQty } : i),
      stockLogs: [...state.stockLogs, newLog],
    };
  }),

  addPartner: (partner) => set((state) => ({
    partners: [...state.partners, { id: crypto.randomUUID(), ...partner }]
  })),
  updatePartner: (id, partner) => set((state) => ({
    partners: state.partners.map(p => p.id === id ? { ...p, ...partner } : p)
  })),
  deletePartner: (id) => set((state) => ({
    partners: state.partners.filter(p => p.id !== id)
  })),

  // Staff Management with Supabase
  fetchStaff: async () => {
    set({ isAuthLoading: true }); // Use a general loading state or a specific one for staff
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, phone, status, avatar_url, email, commission_rate')
        .eq('store_id', get().storeId) // Filter by current store_id
        .order('full_name', { ascending: true });

      if (error) {
        throw error;
      }

      const fetchedStaff: Staff[] = data.map(profile => ({
        id: profile.id,
        name: profile.full_name || 'N/A',
        role: profile.role as StaffRole, // Ensure type safety
        phone: profile.phone || 'N/A',
        status: profile.status === 'Active' ? 'Active' : 'Inactive', // Ensure type safety
        avatar: profile.avatar_url || '',
        email: profile.email || 'N/A',
        commissionRate: profile.commission_rate || 0,
      }));

      set({ staff: fetchedStaff });
    } catch (error: any) {
      console.error('Error fetching staff:', error.message);
      toast.error('Failed to fetch staff: ' + error.message);
      set({ staff: [] }); // Clear staff on error
    } finally {
      set({ isAuthLoading: false });
    }
  },

  addStaff: async (newStaffData) => {
    // For adding new staff, we need to create a user in auth.users first,
    // or ensure the email exists and then link the profile.
    // For simplicity, this assumes the user might already exist or will be created externally.
    // If creating a new user, you'd use supabase.auth.signUp and then insert into profiles.
    // Here, we're directly inserting into profiles, assuming the 'id' comes from an existing auth.users entry
    // or will be handled by the handle_new_admin_user trigger if a new user signs up.
    // For now, we'll assume newStaffData might contain an 'id' if pre-existing, or Supabase will generate.

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        full_name: newStaffData.name,
        email: newStaffData.email,
        role: newStaffData.role,
        phone: newStaffData.phone,
        status: newStaffData.status,
        avatar_url: newStaffData.avatar,
        commission_rate: newStaffData.commissionRate,
        store_id: get().storeId, // Link to current store
        is_approved: true, // Assuming newly added staff are approved by default
      })
      .select('id, full_name, role, phone, status, avatar_url, email, commission_rate')
      .single();

    if (error) {
      console.error('Error adding staff:', error.message);
      toast.error('Failed to add staff: ' + error.message);
      return;
    }

    const addedStaff: Staff = {
      id: data.id,
      name: data.full_name || 'N/A',
      role: data.role as StaffRole,
      phone: data.phone || 'N/A',
      status: data.status === 'Active' ? 'Active' : 'Inactive',
      avatar: data.avatar_url || '',
      email: data.email || 'N/A',
      commissionRate: data.commission_rate || 0,
    };

    set((state) => ({ staff: [...state.staff, addedStaff] }));
    toast.success('Staff added successfully!');
  },

  updateStaff: async (id, updatedStaffData) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: updatedStaffData.name,
        email: updatedStaffData.email,
        role: updatedStaffData.role,
        phone: updatedStaffData.phone,
        status: updatedStaffData.status,
        avatar_url: updatedStaffData.avatar,
        commission_rate: updatedStaffData.commissionRate,
      })
      .eq('id', id)
      .select('id, full_name, role, phone, status, avatar_url, email, commission_rate')
      .single();

    if (error) {
      console.error('Error updating staff:', error.message);
      toast.error('Failed to update staff: ' + error.message);
      return;
    }

    const updatedStaff: Staff = {
      id: data.id,
      name: data.full_name || 'N/A',
      role: data.role as StaffRole,
      phone: data.phone || 'N/A',
      status: data.status === 'Active' ? 'Active' : 'Inactive',
      avatar: data.avatar_url || '',
      email: data.email || 'N/A',
      commissionRate: data.commission_rate || 0,
    };

    set((state) => ({
      staff: state.staff.map((s) => (s.id === id ? updatedStaff : s)),
    }));
    toast.success('Staff updated successfully!');
  },

  deleteStaff: async (id) => {
    // Note: Deleting a profile does not delete the associated user in auth.users.
    // If full user deletion is required, it must be done via Supabase Admin API
    // or by the user themselves if allowed.
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting staff:', error.message);
      toast.error('Failed to delete staff: ' + error.message);
      return;
    }

    set((state) => ({
      staff: state.staff.filter((s) => s.id !== id),
    }));
    toast.success('Staff deleted successfully!');
  },

  addPackageTemplate: (pkg) => set((state) => ({
    packageTemplates: [...state.packageTemplates, { id: crypto.randomUUID(), ...pkg }]
  })),
  updatePackageTemplate: (id, pkg) => set((state) => ({
    packageTemplates: state.packageTemplates.map(p => p.id === id ? { ...p, ...pkg } : p)
  })),
  deletePackageTemplate: (id) => set((state) => ({
    packageTemplates: state.packageTemplates.filter(p => p.id !== id)
  })),
  assignPackageToCustomer: (customerId, templateId) => {
    // This is a placeholder. Real implementation would involve adding a package to customer's packages array
    // and managing slots/usage.
    console.log(`Assigning package ${templateId} to customer ${customerId}`);
    toast.info('Package assignment logic not fully implemented.');
  },

  addCreditPackage: (pkg) => set((state) => ({
    creditPackages: [...state.creditPackages, { id: crypto.randomUUID(), ...pkg }]
  })),
  updateCreditPackage: (id, pkg) => set((state) => ({
    creditPackages: state.creditPackages.map(p => p.id === id ? { ...p, ...pkg } : p)
  })),
  deleteCreditPackage: (id) => set((state) => ({
    creditPackages: state.creditPackages.filter(p => p.id !== id)
  })),
  buyCreditPackage: (customerId, packageId) => {
    // This is a placeholder. Real implementation would involve updating customer's credit balance
    // and recording the transaction.
    console.log(`Customer ${customerId} buying credit package ${packageId}`);
    toast.info('Credit package purchase logic not fully implemented.');
  },
}));