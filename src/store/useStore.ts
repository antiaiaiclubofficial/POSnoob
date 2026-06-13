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
          { id: 'sh-1', serviceName: 'อาบน้ำตัดขนสุนัขใหญ่', date: '2024-05-20', price: 1200 }
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

export const useStore = create<AppState>()((set, get) => ({
  language: 'th',
  setLanguage: (lang) => set({ language: lang }),
  currency: '฿',
  
  isAuthenticated: false,
  isAuthLoading: true,
  isPendingApproval: false,
  isUserSuspended: false,
  isStoreSuspended: false,
  
  currentUser: null,
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
  vatEnabled: true,

  liffId: '2001234567-AbCdEfGh',
  liffChannelId: '1657483920',
  liffChannelSecret: '••••••••••••••••••••••••••••••••',
  liffEnabled: true,

  customers: DEFAULT_MOCK_CUSTOMERS,
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

  services: DEFAULT_MOCK_SERVICES,
  addons: DEFAULT_MOCK_ADDONS,
  inventory: [],
  partners: [],
  stockLogs: [],
  reportHistory: [],
  transactions: [],
  staff: [],
  logs: [],
  cart: [],
  packageTemplates: [
    {
      id: 'pkg-temp-1',
      name: 'อาบน้ำตัดขนสุนัขเล็ก 5 ครั้ง แถม 1 ครั้ง',
      serviceId: '1',
      paidSlots: 5,
      freeSlots: 1,
      price: 2500,
      bonusType: 'none',
      bonusName: '',
      bonusCount: 1
    },
    {
      id: 'pkg-temp-2',
      name: 'สปาแมวพรีเมียม 8 ครั้ง แถม 2 ครั้ง',
      serviceId: '2',
      paidSlots: 8,
      freeSlots: 2,
      price: 6400,
      bonusType: 'recurring',
      bonusName: 'แปรงฟัน',
      bonusCount: 1
    }
  ],
  creditPackages: [
    {
      id: 'cred-pkg-1',
      name: 'Bronze Saver (เติม 1,000 ได้ 1,100)',
      price: 1000,
      creditValue: 1100
    },
    {
      id: 'cred-pkg-2',
      name: 'Silver Value (เติม 3,000 ได้ 3,500)',
      price: 3000,
      creditValue: 3500
    },
    {
      id: 'cred-pkg-3',
      name: 'Gold Ultimate (เติม 5,000 ได้ 6,000)',
      price: 5000,
      creditValue: 6000
    }
  ],
  tierRules: [
    { level: 'Standard', label: 'Standard', minSpent: 0, discount: 0 },
    { level: 'Silver', label: 'Silver Member', minSpent: 5000, discount: 5 },
    { level: 'Gold', label: 'Gold Member', minSpent: 15000, discount: 10 },
    { level: 'VIP', label: 'VIP Member', minSpent: 50000, discount: 15 },
  ],

  rolePermissions: {
    superadmin: ['/superadmin'],
    Admin: ['/', '/pos', '/queue', '/customers', '/inventory', '/marketing', '/staff', '/staff/performance', '/logs', '/reports', '/settings'],
    Groomer: ['/', '/queue', '/customers'],
    Assistant: ['/', '/pos', '/queue', '/customers']
  },

  login: (id, pass) => {
    if (id === 'superadmin' && pass === 'superadmin') {
      const user = { id: 'superadmin', name: 'System Owner', role: 'superadmin', username: 'superadmin' };
      set({ isAuthenticated: true, currentUser: user, storeId: null, isAuthLoading: false });
      get().addLog({ staffName: 'System', action: 'Login Success', details: 'Super Administrator logged into the system', type: 'success' });
      return true;
    }
    if (id === 'admin' && pass === '1234') {
      const user = { id: 'admin', name: 'Admin', role: 'Admin', username: 'admin' };
      set({ isAuthenticated: true, currentUser: user, storeId: 'default-store', isAuthLoading: false });
      get().addLog({ staffName: 'System', action: 'Login Success', details: 'Super Admin logged into the system', type: 'success' });
      return true;
    }
    const member = get().staff.find(s => s.username === id && s.password === pass && s.status === 'Active');
    if (member) {
      const user = { id: member.id, name: member.name, role: member.role, username: member.username };
      set({ isAuthenticated: true, currentUser: user, storeId: 'default-store', isAuthLoading: false });
      get().addLog({ staffName: 'System', action: 'Login Success', details: `Staff member ${member.name} logged in`, type: 'success' });
      return true;
    }
    return false;
  },

  loginWithGoogle: async (redirectTo) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo || window.location.origin,
      },
    });
    if (error) {
      toast.error(error.message);
    }
  },

  setSession: async (user) => {
    if (user) {
      const isSuperAdminPath = window.location.pathname.startsWith('/superadmin');
      const isSuperAdminEmail = user.email === 'antiai.aiclub.official@gmail.com';
      const shouldBeSuperAdmin = isSuperAdminEmail && isSuperAdminPath;

      // 1. ดึงข้อมูลโปรไฟล์จริงจากฐานข้อมูล Supabase
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('role, store_id, is_approved, is_suspended')
        .eq('id', user.id)
        .maybeSingle();

      // 2. หากเกิดข้อผิดพลาดในการดึงข้อมูล ให้หยุดทำงานเพื่อความปลอดภัย
      if (error) {
        console.error("Error fetching profile:", error);
        set({ isAuthLoading: false });
        return;
      }

      // 3. หากไม่มีโปรไฟล์ในฐานข้อมูลจริงๆ (profile เป็น null)
      if (!profile) {
        // ดึง ID ของร้านค้าแรกในระบบเพื่อเป็นค่าเริ่มต้น
        const { data: stores } = await supabase.from('stores').select('id').limit(1);
        const defaultStoreId = stores && stores.length > 0 ? stores[0].id : null;

        // กำหนดให้ผู้ใช้ใหม่ทุกคนต้องรออนุมัติ (is_approved = false) ยกเว้น Super Admin เท่านั้น
        const shouldAutoApprove = shouldBeSuperAdmin;

        const newProfile = {
          id: user.id,
          email: user.email,
          role: shouldBeSuperAdmin ? 'superadmin' : 'Admin',
          store_id: shouldBeSuperAdmin ? null : defaultStoreId,
          is_approved: shouldAutoApprove,
          is_suspended: false
        };

        const { error: insertError } = await supabase
          .from('profiles')
          .insert([newProfile]);

        if (!insertError) {
          profile = { role: newProfile.role, store_id: newProfile.store_id, is_approved: newProfile.is_approved, is_suspended: false };
        } else {
          console.error("Failed to insert profile:", insertError);
          set({ 
            isAuthenticated: false, 
            isAuthLoading: false, 
            currentUser: null, 
            storeId: null,
            isPendingApproval: true
          });
          return;
        }
      }

      // 4. ตรวจสอบการพักสิทธิ์ผู้ใช้ (is_suspended)
      if (profile.is_suspended && !isSuperAdminEmail) {
        await supabase.auth.signOut();
        set({ 
          isAuthenticated: false, 
          isAuthLoading: false, 
          currentUser: null, 
          storeId: null,
          isUserSuspended: true,
          isStoreSuspended: false,
          isPendingApproval: false
        });
        return;
      }

      // 5. ตรวจสอบสถานะการอนุมัติ (is_approved)
      if (!profile.is_approved && !isSuperAdminEmail) {
        await supabase.auth.signOut();
        set({ 
          isAuthenticated: false, 
          isAuthLoading: false, 
          currentUser: null, 
          storeId: null,
          isPendingApproval: true,
          isUserSuspended: false,
          isStoreSuspended: false
        });
        return;
      }

      // ปรับแต่งบทบาทและร้านค้าให้ถูกต้อง
      let userRole = profile.role || 'Assistant';
      let storeIdFromMetadata = profile.store_id || 'default-store';

      if (userRole === 'admin') {
        userRole = 'Admin';
      } else if (userRole === 'staff') {
        userRole = 'Assistant';
      }

      if (isSuperAdminEmail) {
        if (shouldBeSuperAdmin) {
          userRole = 'superadmin';
          storeIdFromMetadata = null;
        } else {
          userRole = 'Admin';
          if (!storeIdFromMetadata || storeIdFromMetadata === 'default-store') {
            const { data: stores } = await supabase.from('stores').select('id').limit(1);
            storeIdFromMetadata = stores && stores.length > 0 ? stores[0].id : 'default-store';
          }
        }
      }

      // 6. ตรวจสอบการพักสิทธิ์ร้านค้า
      if (storeIdFromMetadata && storeIdFromMetadata !== 'default-store' && userRole !== 'superadmin') {
        const { data: storeData } = await supabase
          .from('stores')
          .select('is_suspended')
          .eq('id', storeIdFromMetadata)
          .single();

        if (storeData && storeData.is_suspended) {
          await supabase.auth.signOut();
          set({ 
            isAuthenticated: false, 
            isAuthLoading: false, 
            currentUser: null, 
            storeId: null,
            isStoreSuspended: true,
            isUserSuspended: false,
            isPendingApproval: false
          });
          return;
        }
      }

      set({ 
        isAuthenticated: true, 
        isAuthLoading: false,
        isPendingApproval: false,
        isUserSuspended: false,
        isStoreSuspended: false,
        currentUser: {
          id: user.id,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: userRole, 
          email: user.email,
          avatar: user.user_metadata?.avatar_url || undefined 
        },
        storeId: userRole === 'superadmin' ? null : storeIdFromMetadata
      });
    } else {
      const current = get().currentUser;
      if (current && (current.id === 'superadmin' || current.id === 'admin' || get().staff.some(s => s.id === current.id))) {
        set({ isAuthLoading: false });
        return;
      }
      set({ isAuthenticated: false, isAuthLoading: false, currentUser: null, storeId: null });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ isAuthenticated: false, currentUser: null, storeId: null, isPendingApproval: false, isUserSuspended: false, isStoreSuspended: false });
  },

  verifyPassword: (pass) => {
    const { currentUser, staff } = get();
    if (!currentUser) return false;
    if (currentUser.username === 'superadmin') return pass === 'superadmin';
    if (currentUser.username === 'admin') return pass === '1234';
    const member = staff.find(s => s.username === currentUser.username);
    return member?.password === pass;
  },

  addLog: (log) => set(s => ({ 
    logs: [{ ...log, id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toISOString() } as ActivityLog, ...s.logs] 
  })),
  addReportLog: (log) => set(s => ({
    reportHistory: [{ ...log, id: `REP-${Math.random().toString(36).substr(2, 5).toUpperCase()}`, timestamp: new Date().toISOString() }, ...s.reportHistory]
  })),

  updateBusinessProfile: (profile) => set(s => ({ ...s, ...profile })),
  updateBookingSettings: (settings) => set(s => ({ ...s, ...settings })),
  
  updateTierRules: async (rules) => {
    try {
      for (const rule of rules) {
        await supabase
          .from('tier_rules')
          .upsert({
            level: rule.level,
            label: rule.label,
            min_spent: rule.minSpent,
            discount: rule.discount
          }, { onConflict: 'level' });
      }
    } catch (e) {
      console.warn("Failed to save tier rules to Supabase, falling back to local:", e);
    }
    set({ tierRules: rules });
  },

  updateRolePermissions: (role, permissions) => set(s => ({
    rolePermissions: {
      ...s.rolePermissions,
      [role]: permissions
    }
  })),

  setCustomers: (customers) => set({ customers }),
  selectOwner: (owner) => set({ selectedOwner: owner, activePet: owner ? owner.pets[0] : null, activeQueueItemId: null }),
  setActivePet: (pet) => set({ activePet: pet }),
  setActiveQueueItem: (id) => set({ activeQueueItemId: id }),
  addCustomer: (data) => set(s => ({ customers: [...s.customers, { ...data, id: Math.random().toString(), pets: [], totalSpent: 0, creditBalance: 0 }] })),
  updateCustomer: (id, data) => set(s => ({ customers: s.customers.map(c => c.id === id ? { ...c, ...data } : c) })),
  deleteCustomer: (id) => set(s => ({ customers: s.customers.filter(c => c.id !== id) })),
  bindLineToCustomer: (cid, lid) => set(s => ({ customers: s.customers.map(c => c.id === cid ? { ...c, lineId: lid } : c) })),

  addPet: (cid, pet) => set(s => ({ customers: s.customers.map(c => c.id === cid ? { ...c, pets: [...c.pets, { ...pet, id: Math.random().toString() }] } : c) })),
  updatePet: (cid, pid, data) => set(s => ({ customers: s.customers.map(c => c.id === cid ? { ...c, pets: c.pets.map(p => p.id === pid ? { ...p, ...data } : p) } : c) })),
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

    if (!error) {
      set((state) => ({
        customers: state.customers.map(c => c.id === customerId ? {
          ...c,
          pets: c.pets.map(p => p.id === petId ? { 
            ...p, 
            weightHistory: [...(p.weightHistory || []), { date: data.date, value: Number(data.weight) }] 
          } : p)
        } : c)
      }));
    }
  },
  saveIntakeRecord: async (customerId, petId, record) => {
    try {
      const { data, error } = await supabase
        .from('pet_health_logs')
        .insert([{
          pet_id: petId,
          type: 'intake',
          title: 'Grooming Intake Form',
          description: JSON.stringify({
            details: record.details,
            signature: record.signature,
            weight: record.weight,
            staffName: record.staffName,
            queueItemId: record.queueItemId
          }),
          date: new Date().toISOString().split('T')[0],
          status: 'completed'
        }])
        .select()
        .single();

      if (!error && data) {
        set((state) => ({
          customers: state.customers.map(c => {
            if (c.id !== customerId) return c;
            return {
              ...c,
              pets: c.pets.map(p => {
                if (p.id !== petId) return p;
                const newIntake = {
                  id: data.id,
                  queueItemId: record.queueItemId,
                  date: data.date,
                  weight: record.weight,
                  details: record.details,
                  signature: record.signature,
                  staffName: record.staffName
                };
                return {
                  ...p,
                  intakeHistory: [...(p.intakeHistory || []), newIntake]
                };
              })
            };
          })
        }));
      }
    } catch (e) {
      console.error("Failed to save intake record:", e);
    }
  },

  addBooking: (b) => set(s => ({ queue: [...s.queue, { ...b, id: Math.random().toString() }] })),
  updateQueueStatus: (id, status) => set(s => ({ queue: s.queue.map(q => q.id === id ? { ...q, status } : q) })),
  removeQueueItem: (id) => set(s => ({ queue: s.queue.filter(q => q.id !== id) })),
  toggleSlotStatus: (time) => set(s => ({ disabledSlots: s.disabledSlots.includes(time) ? s.disabledSlots.filter(t => t !== time) : [...s.disabledSlots, time] })),
  markAsPaid: (id) => set(s => ({ queue: s.queue.map(q => q.id === id ? { ...q, isPaid: true } : q) })),

  addToCart: (item) => set(s => ({ cart: [...s.cart, { ...item, discountType: null, discountValue: 0 }] })),
  removeFromCart: (idx) => set(s => ({ cart: s.cart.filter((_, i) => i !== idx) })),
  updateCartQuantity: (idx, delta) => set(s => ({ cart: s.cart.map((item, i) => i === idx ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item) })),
  updateCartItemDiscount: (idx, type, val) => set(s => ({ cart: s.cart.map((item, i) => i === idx ? { ...item, discountType: type, discountValue: val } : item) })),
  clearCart: () => set({ cart: [] }),
  processPayment: async (cid, total, disc, items, method, details, isTaxInvoice) => {
    const customerName = cid === 'walk-in' ? 'ลูกค้าทั่วไป (Walk-in)' : (get().customers.find(c => c.id === cid)?.name || 'Walk-in');
    
    const { data, error } = await supabase
      .from('sales_transactions')
      .insert([{
        customer_id: cid === 'walk-in' ? null : cid,
        customer_name: customerName,
        amount: total,
        discount_amount: disc,
        payment_method: method,
        items: items,
        staff_name: get().currentUser?.name || 'Admin'
      }])
      .select()
      .single();

    if (error) {
      console.error("Error saving transaction:", error);
      toast.error("ไม่สามารถบันทึกธุรกรรมลงฐานข้อมูลได้");
      return;
    }

    if (data) {
      const tx = {
        id: data.id,
        date: data.created_at.split('T')[0],
        amount: Number(data.amount),
        discountAmount: Number(data.discount_amount),
        customerId: cid,
        customerName: customerName,
        items: items,
        paymentMethod: method,
        staffName: data.staff_name || 'Admin',
        species: [],
        bookingType: 'Walk-in'
      };

      items.forEach(item => {
        if (item.type === 'Product') {
          get().adjustStock(item.id, item.quantity, 'Out', `ขายสินค้าผ่านบิล ${data.id}`);
        }
      });

      set(s => ({ transactions: [tx as any, ...s.transactions] }));

      if (cid && cid !== 'walk-in') {
        if (method === 'Store Credit') {
          set(s => ({
            customers: s.customers.map(c => {
              if (c.id !== cid) return c;
              const prevBalance = c.creditBalance || 0;
              return {
                ...c,
                creditBalance: Math.max(0, prevBalance - total),
                creditHistory: [
                  ...(c.creditHistory || []),
                  {
                    id: `cr-use-${Date.now()}`,
                    date: new Date().toISOString().split('T')[0],
                    amount: -total,
                    type: 'Usage',
                    description: `Paid for order ${tx.id}`
                  }
                ]
              };
            })
          }));
        }

        const serviceItems = items.filter(item => item.type === 'Service');
        for (const item of serviceItems) {
          if (item.petId) {
            const { data: historyData, error: historyError } = await supabase
              .from('service_history')
              .insert([{
                store_id: data.store_id,
                customer_id: cid === 'walk-in' ? null : cid,
                pet_id: item.petId,
                price: item.price * item.quantity,
                note: item.title
              }])
              .select()
              .single();

            if (!historyError && historyData) {
              set(s => ({
                customers: s.customers.map(c => {
                  if (c.id !== cid) return c;
                  return {
                    ...c,
                    pets: c.pets.map(p => {
                      if (p.id !== item.petId) return p;
                      return {
                        ...p,
                        serviceHistory: [
                          ...(p.serviceHistory || []),
                          {
                            id: historyData.id,
                            serviceName: item.title,
                            date: historyData.created_at.split('T')[0],
                            price: Number(historyData.price)
                          }
                        ]
                      };
                    })
                  };
                })
              }));
            } else {
              console.error("Error saving service history:", historyError);
            }
          }
        }

        items.forEach(item => {
          if (item.type === 'Package') {
            const templateId = item.id.replace('package-', '');
            get().assignPackageToCustomer(cid, templateId);
          } else if (item.type === 'Credit') {
            const packageId = item.id.replace('credit-', '');
            get().buyCreditPackage(cid, packageId);
          }
        });
      }
    }
  },
  deleteTransaction: async (id) => {
    const { error } = await supabase
      .from('sales_transactions')
      .delete()
      .eq('id', id);

    if (!error) {
      set(s => ({ transactions: s.transactions.filter(t => t.id !== id) }));
      toast.success("ลบธุรกรรมเรียบร้อยแล้ว");
    } else {
      console.error("Error deleting transaction:", error);
      toast.error("ไม่สามารถลบธุรกรรมได้");
    }
  },

  setServices: (services) => set({ services }),
  addService: async (ser) => {
    const priceKeys = Object.keys(ser.prices);
    const defaultPrice = priceKeys.length > 0 ? ser.prices[priceKeys[0]].price : 0;
    const defaultDuration = priceKeys.length > 0 ? ser.prices[priceKeys[0]].duration : 60;

    const localNewService: Service = {
      id: Math.random().toString(),
      title: ser.title,
      category: ser.category || 'Grooming',
      description: ser.description || '',
      icon: ser.icon || 'grooming',
      targetSpecies: ser.targetSpecies || 'Dog',
      prices: ser.prices || {
        'Standard': { price: defaultPrice, duration: defaultDuration }
      },
      isActive: ser.isActive !== false,
      coatType: ser.coatType || undefined
    };

    set(s => ({ services: [...s.services, localNewService] }));

    try {
      const { data, error } = await supabase
        .from('services')
        .insert([{
          name: ser.title,
          description: ser.description,
          price: defaultPrice,
          duration_minutes: defaultDuration,
          category: ser.category || 'Grooming',
          icon: ser.icon || 'grooming',
          target_species: ser.targetSpecies || 'Dog',
          prices: ser.prices || {},
          is_active: ser.isActive !== false,
          coat_type: ser.coatType || null,
          is_addon: false
        }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newService: Service = {
          id: data.id,
          title: data.name,
          category: data.category || 'Grooming',
          description: data.description || '',
          icon: (data.icon || 'grooming') as any,
          targetSpecies: (data.target_species || 'Dog') as any,
          prices: data.prices && Object.keys(data.prices).length > 0 ? data.prices : {
            'Standard': { price: Number(data.price || 0), duration: data.duration_minutes || 60 }
          },
          isActive: data.is_active !== false,
          coatType: data.coat_type || undefined
        };
        set(s => ({ services: [...s.services.filter(item => item.id !== localNewService.id), newService] }));
      }
    } catch (err) {
      console.error("Supabase insert failed, using local fallback:", err);
    }
  },
  updateService: async (id, ser) => {
    set(s => ({ services: s.services.map(item => item.id === id ? { ...item, ...ser, targetSpecies: ser.targetSpecies || 'Dog' } : item) }));

    const priceKeys = Object.keys(ser.prices);
    const defaultPrice = priceKeys.length > 0 ? ser.prices[priceKeys[0]].price : 0;
    const defaultDuration = priceKeys.length > 0 ? ser.prices[priceKeys[0]].duration : 60;

    try {
      const { error } = await supabase
        .from('services')
        .update({
          name: ser.title,
          description: ser.description,
          price: defaultPrice,
          duration_minutes: defaultDuration,
          category: ser.category || 'Grooming',
          icon: ser.icon || 'grooming',
          target_species: ser.targetSpecies || 'Dog',
          prices: ser.prices || {},
          is_active: ser.isActive !== false,
          coat_type: ser.coatType || null
        })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error("Supabase update failed, local state preserved:", err);
    }
  },
  deleteService: async (id) => {
    set(s => ({ services: s.services.filter(item => item.id !== id) }));

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error("Supabase delete failed, local state preserved:", err);
    }
  },
  toggleServiceActive: async (id) => {
    const service = get().services.find(s => s.id === id);
    if (!service) return;
    const nextActive = !service.isActive;

    set(s => ({ services: s.services.map(item => item.id === id ? { ...item, isActive: nextActive } : item) }));

    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: nextActive })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error("Supabase toggle active failed, local state preserved:", err);
    }
  },

  addAddon: async (ad) => {
    const localNewAddon: AddonItem = {
      id: Math.random().toString(),
      name: ad.name,
      price: ad.price || 0,
      icon: ad.icon || 'nail'
    };

    set(s => ({ addons: [...s.addons, localNewAddon] }));

    try {
      const { data, error } = await supabase
        .from('services')
        .insert([{
          name: ad.name,
          price: ad.price || 0,
          icon: ad.icon || 'nail',
          is_addon: true,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newAddon: AddonItem = {
          id: data.id,
          name: data.name,
          price: Number(data.price || 0),
          icon: (data.icon || 'nail') as any
        };
        set(s => ({ addons: [...s.addons.filter(a => a.id !== localNewAddon.id), newAddon] }));
      }
    } catch (err) {
      console.error("Supabase add addon failed, using local fallback:", err);
    }
  },
  updateAddon: async (id, ad) => {
    set(s => ({ addons: s.addons.map(a => a.id === id ? { ...a, ...ad } : a) }));

    try {
      const { error } = await supabase
        .from('services')
        .update({
          name: ad.name,
          price: ad.price || 0,
          icon: ad.icon || 'nail'
        })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error("Supabase update addon failed, local state preserved:", err);
    }
  },
  deleteAddon: async (id) => {
    set(s => ({ addons: s.addons.filter(a => a.id !== id) }));

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error("Supabase delete addon failed, local state preserved:", err);
    }
  },

  addInventoryItem: async (item) => {
    const { data, error } = await supabase
      .from('products')
      .insert([{
        name: item.name,
        barcode: item.barcode,
        stock: item.stock || 0,
        min_stock: item.minStock || 5,
        price: item.price || 0,
        cost_price: item.costPrice || 0,
        unit: item.unit || 'ชิ้น',
        category: item.category || 'ทั่วไป',
        image_url: item.image || '',
        is_consignment: item.isConsignment || false,
        partner_id: item.partner_id || null,
        consignment_rate: item.consignment_rate || 0
      }])
      .select()
      .single();

    if (!error && data) {
      const newItem = {
        id: data.id,
        name: data.name,
        barcode: data.barcode || '',
        stock: data.stock || 0,
        minStock: data.min_stock || 5,
        price: Number(data.price || 0),
        costPrice: Number(data.cost_price || 0),
        unit: data.unit || 'ชิ้น',
        category: data.category || 'ทั่วไป',
        image: data.image_url || '',
        isConsignment: data.is_consignment || false,
        partnerId: data.partner_id || '',
        consignmentRate: Number(data.consignment_rate || 0)
      };
      set(s => ({ inventory: [...s.inventory, newItem] }));
    } else {
      console.error("Error adding product:", error);
    }
  },
  updateInventoryItem: async (id, item) => {
    const { error } = await supabase
      .from('products')
      .update({
        name: item.name,
        barcode: item.barcode,
        stock: item.stock,
        min_stock: item.minStock,
        price: item.price,
        cost_price: item.costPrice,
        unit: item.unit,
        category: item.category,
        image_url: item.image,
        is_consignment: item.isConsignment,
        partner_id: item.partnerId || null,
        consignment_rate: item.consignment_rate || 0
      })
      .eq('id', id);

    if (!error) {
      set(s => ({
        inventory: s.inventory.map(itemObj => itemObj.id === id ? { ...itemObj, ...item } : itemObj)
      }));
    } else {
      console.error("Error updating product:", error);
    }
  },
  deleteInventoryItem: async (id) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (!error) {
      set(s => ({ inventory: s.inventory.filter(i => i.id !== id) }));
    } else {
      console.error("Error deleting product:", error);
    }
  },
  adjustStock: async (id, qty, mode, reason) => {
    const item = get().inventory.find(i => i.id === id);
    if (!item) return;
    const oldQty = item.stock;
    const newQty = mode === 'Add' || mode === 'In' ? oldQty + qty : mode === 'Out' ? oldQty - qty : qty;

    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: newQty })
      .eq('id', id);

    if (updateError) {
      console.error("Error adjusting stock:", updateError);
      return;
    }

    const staffName = get().currentUser?.name || 'System';
    const { data: logData, error: logError } = await supabase
      .from('stock_logs')
      .insert([{
        product_id: id,
        action: mode,
        old_qty: oldQty,
        new_qty: newQty,
        reason: reason,
        staff_name: staffName
      }])
      .select()
      .single();

    if (!logError && logData) {
      const newLog: StockLog = {
        id: logData.id,
        productId: id,
        productName: item.name,
        action: (mode === 'Set' ? 'Adjust' : mode) as StockLog['action'],
        oldQty: oldQty,
        newQty: newQty,
        reason: reason,
        staffName: staffName,
        timestamp: logData.created_at
      };

      set(s => ({
        inventory: s.inventory.map(i => i.id === id ? { ...i, stock: newQty } : i),
        stockLogs: [newLog, ...s.stockLogs]
      }));
    } else {
      console.error("Error inserting stock log:", logError);
      set(s => ({
        inventory: s.inventory.map(i => i.id === id ? { ...i, stock: newQty } : i)
      }));
    }
  },

  addPartner: async (v) => {
    const { data, error } = await supabase
      .from('partners')
      .insert([{
        company_name: v.companyName,
        tax_id: v.taxId,
        address: v.address,
        phone: v.phone,
        email: v.email,
        contact_person: v.contactPerson,
        notes: v.notes,
        main_category: v.mainCategory,
        gp_rate: v.gpRate || 0
      }])
      .select()
      .single();

    if (!error && data) {
      const newPartner = {
        id: data.id,
        companyName: data.company_name,
        taxId: data.tax_id || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        contactPerson: data.contact_person || '',
        notes: data.notes || '',
        mainCategory: data.main_category || '',
        gpRate: Number(data.gp_rate || 0)
      };
      set(s => ({ partners: [...s.partners, newPartner] }));
    } else {
      console.error("Error adding partner:", error);
    }
  },
  updatePartner: async (id, v) => {
    const { error } = await supabase
      .from('partners')
      .update({
        company_name: v.companyName,
        tax_id: v.taxId,
        address: v.address,
        phone: v.phone,
        email: v.email,
        contact_person: v.contact_person || '',
        notes: v.notes,
        main_category: v.mainCategory,
        gp_rate: v.gpRate || 0
      })
      .eq('id', id);

    if (!error) {
      set(s => ({
        partners: s.partners.map(p => p.id === id ? { ...p, ...v } : p)
      }));
    } else {
      console.error("Error updating partner:", error);
    }
  },
  deletePartner: async (id) => {
    const { error } = await supabase
      .from('partners')
      .delete()
      .eq('id', id);

    if (!error) {
      set(s => ({ partners: s.partners.filter(p => p.id !== id) }));
    } else {
      console.error("Error deleting partner:", error);
    }
  },

  addStaff: (st) => set(s => ({ staff: [...s.staff, { ...st, id: Math.random().toString() }] })),
  updateStaff: (id, st) => set(s => ({ staff: s.staff.map(mem => mem.id === id ? { ...mem, ...st } : mem) })),
  deleteStaff: (id) => set(s => ({ staff: s.staff.filter(mem => mem.id !== id) })),

  addPackageTemplate: (pkg) => set(s => ({ packageTemplates: [...s.packageTemplates, { ...pkg, id: Math.random().toString() }] })),
  updatePackageTemplate: (id, pkg) => set(s => ({ packageTemplates: s.packageTemplates.map(p => p.id === id ? { ...p, ...pkg } : p) })),
  deletePackageTemplate: (id) => set(s => ({ packageTemplates: s.packageTemplates.filter(p => p.id !== id) })),
  
  assignPackageToCustomer: (cid, tid) => {
    const template = get().packageTemplates.find(t => t.id === tid);
    if (!template) return;
    
    set(s => ({
      customers: s.customers.map(c => {
        if (c.id !== cid) return c;
        const newPackage = {
          id: `cpkg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          templateId: tid,
          name: template.name,
          targetServiceId: template.serviceId,
          totalSlots: template.paidSlots + template.freeSlots,
          remainingSlots: template.paidSlots + template.freeSlots,
          bonusType: template.bonusType,
          bonusName: template.bonusName,
          bonusCount: template.bonusCount,
          purchaseDate: new Date().toISOString().split('T')[0]
        };
        return {
          ...c,
          packages: [...(c.packages || []), newPackage]
        };
      })
    }));
    
    get().addLog({
      staffName: 'System',
      action: 'Package Assigned',
      details: `Assigned package "${template.name}" to customer`,
      type: 'success'
    });
  },

  addCreditPackage: (pkg) => set(s => ({ creditPackages: [...s.creditPackages, { ...pkg, id: Math.random().toString() }] })),
  updateCreditPackage: (id, pkg) => set(s => ({ creditPackages: s.creditPackages.map(p => p.id === id ? { ...p, ...pkg } : p) })),
  deleteCreditPackage: (id) => set(s => ({ creditPackages: s.creditPackages.filter(p => p.id !== id) })),
  
  buyCreditPackage: (cid, pid) => {
    const pkg = get().creditPackages.find(p => p.id === pid);
    if (!pkg) return;
    
    set(s => ({
      customers: s.customers.map(c => {
        if (c.id !== cid) return c;
        const prevBalance = c.creditBalance || 0;
        const newBalance = prevBalance + pkg.creditValue;
        return {
          ...c,
          creditBalance: newBalance,
          creditHistory: [
            ...(c.creditHistory || []),
            {
              id: `cr-${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
              amount: pkg.creditValue,
              type: 'Top-up',
              description: `Purchased ${pkg.name}`
            }
          ]
        };
      })
    }));
    
    get().addLog({
      staffName: 'System',
      action: 'Credit Top-up',
      details: `Topped up ${pkg.creditValue} credits for customer via package "${pkg.name}"`,
      type: 'success'
    });
  },
}));