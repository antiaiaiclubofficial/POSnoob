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
  vatEnabled: typeof window !== 'undefined' ? (localStorage.getItem('vat_enabled') === 'true') : false,
  companyName: typeof window !== 'undefined' ? localStorage.getItem('company_name') || 'Mellow Fellow Co., Ltd.' : 'Mellow Fellow Co., Ltd.',
  companyAddress: typeof window !== 'undefined' ? localStorage.getItem('company_address') || '123 Sukhumvit, Bangkok 10110' : '123 Sukhumvit, Bangkok 10110',
  companyTaxId: typeof window !== 'undefined' ? localStorage.getItem('company_tax_id') || '0105564000123' : '0105564000123',
  companyPhone: typeof window !== 'undefined' ? localStorage.getItem('company_phone') || '02-999-9999' : '02-999-9999',
  companyEmail: typeof window !== 'undefined' ? localStorage.getItem('company_email') || 'contact@mellowfellow.com' : 'contact@mellowfellow.com',
  vatRate: typeof window !== 'undefined' ? Number(localStorage.getItem('vat_rate') || '7') : 7,
  pointsEarnRate: 10,
  pointsRedeemRate: 1,

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
      // ถ้าไม่มี session จาก Supabase ให้ทำการ Auto-login เป็น Admin ทันที เพื่อไม่ให้ติดหน้า Authen ใน Preview
      const mockAdmin = { id: 'admin', name: 'Admin (Auto-login)', role: 'Admin', username: 'admin' };
      set({ 
        isAuthenticated: true, 
        isAuthLoading: false, 
        currentUser: mockAdmin, 
        storeId: 'default-store',
        isPendingApproval: false,
        isUserSuspended: false,
        isStoreSuspended: false
      });
    }
  },

  verifyPassword: (pass) => {
    const { currentUser, staff } = get();
    if (!currentUser) return false;
    if (currentUser.username === 'superadmin') return pass === 'superadmin';
    if (currentUser.username === 'admin') return pass === '1234';
    const member = staff.find(s => s.username === currentUser.username);
    return member?.password === pass;
  },
  
  logout: async () => {
    await supabase.auth.signOut();
    set({ isAuthenticated: false, currentUser: null, storeId: null, isPendingApproval: false, isUserSuspended: false, isStoreSuspended: false });
  },

  addLog: (log) => set(s => ({ 
    logs: [{ ...log, id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toISOString() } as ActivityLog, ...s.logs] 
  })),
  addReportLog: (log) => set(s => ({
    reportHistory: [{ ...log, id: `REP-${Math.random().toString(36).substr(2, 5).toUpperCase()}`, timestamp: new Date().toISOString() }, ...s.reportHistory]
  })),

  updateBusinessProfile: async (profile) => {
    set(s => ({ ...s, ...profile }));
    if (typeof window !== 'undefined') {
      if (profile.companyName !== undefined) localStorage.setItem('company_name', profile.companyName);
      if (profile.companyAddress !== undefined) localStorage.setItem('company_address', profile.companyAddress);
      if (profile.companyTaxId !== undefined) localStorage.setItem('company_tax_id', profile.companyTaxId);
      if (profile.companyPhone !== undefined) localStorage.setItem('company_phone', profile.companyPhone);
      if (profile.companyEmail !== undefined) localStorage.setItem('company_email', profile.companyEmail);
      if (profile.vatEnabled !== undefined) localStorage.setItem('vat_enabled', String(profile.vatEnabled));
      if (profile.vatRate !== undefined) localStorage.setItem('vat_rate', String(profile.vatRate));
    }
    const storeId = get().storeId;
    if (storeId && storeId !== 'default-store') {
      try {
        const { error } = await supabase
          .from('stores')
          .update({
            name: profile.shopName !== undefined ? profile.shopName : undefined,
            logo_url: profile.shopLogo !== undefined ? profile.shopLogo : undefined,
            address: profile.shopAddress !== undefined ? profile.shopAddress : undefined,
            phone: profile.shopPhone !== undefined ? profile.shopPhone : undefined,
            line_id: profile.shopLineId !== undefined ? profile.shopLineId : undefined,
            receipt_header: profile.receiptHeader !== undefined ? profile.receiptHeader : undefined,
            receipt_footer: profile.receiptFooter !== undefined ? profile.receiptFooter : undefined,
            receipt_paper_size: profile.receiptPaperSize !== undefined ? profile.receiptPaperSize : undefined,
            company_name: profile.companyName !== undefined ? profile.companyName : undefined,
            company_address: profile.companyAddress !== undefined ? profile.companyAddress : undefined,
            company_tax_id: profile.companyTaxId !== undefined ? profile.companyTaxId : undefined,
            company_phone: profile.companyPhone !== undefined ? profile.companyPhone : undefined,
            company_email: profile.companyEmail !== undefined ? profile.companyEmail : undefined,
            vat_enabled: profile.vatEnabled !== undefined ? profile.vatEnabled : undefined,
            vat_rate: profile.vatRate !== undefined ? profile.vatRate : undefined,
            points_earn_rate: profile.pointsEarnRate !== undefined ? profile.pointsEarnRate : undefined,
            points_redeem_rate: profile.pointsRedeemRate !== undefined ? profile.pointsRedeemRate : undefined,
          })
          .eq('id', storeId);
        if (error) throw error;
      } catch (err) {
        console.error("Failed to update store profile in Supabase:", err);
      }
    }
  },

  updateBookingSettings: async (settings) => {
    set(s => ({ ...s, ...settings }));
    const storeId = get().storeId;
    if (storeId && storeId !== 'default-store') {
      try {
        const { error } = await supabase
          .from('stores')
          .update({
            slot_duration: settings.slotDuration !== undefined ? settings.slotDuration : undefined,
            max_capacity: settings.maxCapacity !== undefined ? settings.maxCapacity : undefined,
            open_time: settings.openTime !== undefined ? settings.openTime : undefined,
            close_time: settings.closeTime !== undefined ? settings.closeTime : undefined,
          })
          .eq('id', storeId);
        if (error) throw error;
      } catch (err) {
        console.error("Failed to update store booking settings in Supabase:", err);
      }
    }
  },
  
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
    const currentStoreId = get().storeId;
    
    const { data, error } = await supabase
      .from('sales_transactions')
      .insert([{
        store_id: currentStoreId && currentStoreId !== 'default-store' ? currentStoreId : null,
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
        bookingType: 'Walk-in' as BookingType
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
                store_id: currentStoreId && currentStoreId !== 'default-store' ? currentStoreId : null,
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
    const currentStoreId = get().storeId;
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
          store_id: currentStoreId && currentStoreId !== 'default-store' ? currentStoreId : null,
          name: ser.title,
          description: ser.description,
          price: defaultPrice,
          duration_minutes: defaultDuration,
          category: ser.category || 'Grooming',
          icon: ser.icon || 'grooming',
          target_species: ser.targetSpecies || 'Dog',
          prices: ser.prices || {},
          is_active: ser.isActive !== false,
          coat_type: ser.coat_type || null,
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
          target_species: ser.target_species || 'Dog',
          prices: ser.prices || {},
          is_active: ser.isActive !== false,
          coat_type: ser.coat_type || null
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
    const currentStoreId = get().storeId;
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
          store_id: currentStoreId && currentStoreId !== 'default-store' ? currentStoreId : null,
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
    const currentStoreId = get().storeId;
    const { data, error } = await supabase
      .from('products')
      .insert([{
        store_id: currentStoreId && currentStoreId !== 'default-store' ? currentStoreId : null,
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
    const currentStoreId = get().storeId;

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
        store_id: currentStoreId && currentStoreId !== 'default-store' ? currentStoreId : null,
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
    const currentStoreId = get().storeId;
    const { data, error } = await supabase
      .from('partners')
      .insert([{
        store_id: currentStoreId && currentStoreId !== 'default-store' ? currentStoreId : null,
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
</dyad-file>

<dyad-write path="src/App.tsx" description="อัปเดต App.tsx เพื่อดึงค่า points_earn_rate และ points_redeem_rate จาก Supabase มาใส่ใน useStore">
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useStore, BookingType, MembershipLevel, QueueStatus } from "@/store/useStore";
import { supabase } from "@/integrations/supabase/client";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import Queue = from "./pages/Queue";
import Services from "./pages/Services";
import Customers from "./pages/Customers";
import Inventory from "./pages/Inventory";
import Marketing from "./pages/Marketing";
import Staff from "./pages/Staff";
import StaffPerformance from "./pages/StaffPerformance";
import Logs from "./pages/Logs";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import SuperAdmin from "./pages/SuperAdmin";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

// คอมโพเนนต์สำหรับจัดการหน้าแรกตามบทบาทของผู้ใช้
const HomeRedirect = () => {
  const { currentUser } = useStore();
  if (currentUser?.role === 'superadmin') {
    return <Navigate to="/superadmin" replace />;
  }
  return <Dashboard />;
};

const App = () => {
  const { language, isAuthenticated, setSession, setCustomers, setServices, storeId } = useStore();

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    // Auth Session Handling
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  // CRM & Services Data Sync Logic - Runs whenever authenticated
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!isAuthenticated) return;

      // 0. Fetch Store Settings
      if (storeId && storeId !== 'default-store') {
        try {
          const { data: storeData, error: storeError } = await supabase
            .from('stores')
            .select('*')
            .eq('id', storeId)
            .single();
          
          if (storeError) throw storeError;
          if (storeData) {
            useStore.setState({
              shopName: storeData.name || 'Mellow Fellow Sanctuary',
              shopLogo: storeData.logo_url || null,
              shopAddress: storeData.address || '',
              shopPhone: storeData.phone || '',
              shopLineId: storeData.line_id || '',
              receiptHeader: storeData.receipt_header || 'Tax Invoice / Receipt',
              receiptFooter: storeData.receipt_footer || 'Thank you for your visit!',
              receiptPaperSize: (storeData.receipt_paper_size || '80mm') as '58mm' | '80mm',
              slotDuration: storeData.slot_duration || 60,
              maxCapacity: storeData.max_capacity || 3,
              openTime: storeData.open_time || '09:00',
              closeTime: storeData.close_time || '19:00',
              shopIsOpen: !storeData.is_suspended,
              companyName: storeData.company_name || 'Mellow Fellow Co., Ltd.',
              companyAddress: storeData.company_address || '',
              companyTaxId: storeData.company_tax_id || '',
              companyPhone: storeData.company_phone || '',
              companyEmail: storeData.company_email || '',
              vatEnabled: storeData.vat_enabled || false,
              vatRate: storeData.vat_rate || 7,
              pointsEarnRate: storeData.points_earn_rate || 10,
              pointsRedeemRate: storeData.points_redeem_rate || 1
            });
          }
        } catch (err) {
          console.warn("Failed to fetch store settings from Supabase:", err);
        }
      }

      // 1. Fetch Customers & Service History
      try {
        let customersQuery = supabase
          .from('customers')
          .select(`
            id,
            first_name,
            last_name,
            display_name,
            phone,
            email,
            line_user_id,
            avatar_url,
            gender,
            age,
            house_no,
            village_no,
            soi,
            road,
            sub_district,
            district,
            province,
            postal_code,
            store_customers!inner (
              points,
              tier,
              store_id
            ),
            pets (
              id,
              name,
              type,
              breed,
              birth_date,
              weight,
              medical_condition,
              image_url
            )
          `);

        if (storeId && storeId !== 'default-store') {
          customersQuery = customersQuery.eq('store_customers.store_id', storeId);
        }

        const { data: customersData, error: customersError } = await customersQuery;

        if (customersError) throw customersError;

        // Fetch service history
        let serviceHistoryQuery = supabase.from('service_history').select('*');
        if (storeId && storeId !== 'default-store') {
          serviceHistoryQuery = serviceHistoryQuery.eq('store_id', storeId);
        }
        const { data: serviceHistoryData } = await serviceHistoryQuery;
        
        const serviceHistoryMap: Record<string, any[]> = {};
        if (serviceHistoryData) {
          serviceHistoryData.forEach(sh => {
            if (sh.pet_id) {
              if (!serviceHistoryMap[sh.pet_id]) {
                serviceHistoryMap[sh.pet_id] = [];
              }
              serviceHistoryMap[sh.pet_id].push({
                id: sh.id,
                serviceName: sh.note || 'บริการ',
                date: sh.created_at.split('T')[0],
                price: Number(sh.price || 0)
              });
            }
          });
        }

        // Fetch weight history
        const { data: weightHistoryData } = await supabase
          .from('pet_weight_history')
          .select('*')
          .order('date', { ascending: true });

        const weightHistoryMap: Record<string, any[]> = {};
        if (weightHistoryData) {
          weightHistoryData.forEach(wh => {
            if (wh.pet_id) {
              if (!weightHistoryMap[wh.pet_id]) {
                weightHistoryMap[wh.pet_id] = [];
              }
              weightHistoryMap[wh.pet_id].push({
                date: wh.date,
                value: Number(wh.weight)
              });
            }
          });
        }

        // Fetch intake history (pet_health_logs)
        const { data: healthLogsData } = await supabase
          .from('pet_health_logs')
          .select('*')
          .eq('type', 'intake');

        const intakeHistoryMap: Record<string, any[]> = {};
        if (healthLogsData) {
          healthLogsData.forEach(log => {
            if (log.pet_id) {
              if (!intakeHistoryMap[log.pet_id]) {
                intakeHistoryMap[log.pet_id] = [];
              }
              try {
                const parsed = JSON.parse(log.description || '{}');
                intakeHistoryMap[log.pet_id].push({
                  id: log.id,
                  queueItemId: parsed.queueItemId,
                  date: log.date,
                  weight: parsed.weight,
                  details: parsed.details,
                  signature: parsed.signature,
                  staffName: parsed.staffName
                });
              } catch (e) {
                console.error("Failed to parse intake log description:", e);
              }
            }
          });
        }
        
        if (customersData && customersData.length > 0) {
          const formattedCustomers = customersData.map(c => {
            const storeCustomer = (c.store_customers?.[0] || {}) as any;
            return {
              id: c.id,
              name: c.display_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Unnamed',
              firstName: c.first_name || '',
              lastName: c.last_name || '',
              phone: c.phone || '-',
              email: c.email || '-',
              lineId: c.line_user_id || '',
              avatarUrl: c.avatar_url || '',
              membership: storeCustomer.tier || 'Standard',
              points: storeCustomer.points || 0,
              totalSpent: 0,
              creditBalance: 0,
              gender: c.gender || 'Male',
              age: c.age || '',
              houseNo: c.house_no || '',
              villageNo: c.village_no || '',
              soi: c.soi || '',
              road: c.road || '',
              subDistrict: c.sub_district || '',
              district: c.district || '',
              province: c.province || '',
              postalCode: c.postal_code || '',
              creditHistory: [],
              packages: [],
              pets: (c.pets || []).map((p: any) => ({
                id: p.id,
                name: p.name,
                species: p.type || 'Dog',
                breed: p.breed || '-',
                birthday: p.birth_date || '',
                weightHistory: weightHistoryMap[p.id] || (p.weight ? [{ date: new Date().toISOString().split('T')[0], value: Number(p.weight) }] : []),
                serviceHistory: serviceHistoryMap[p.id] || [],
                intakeHistory: intakeHistoryMap[p.id] || [],
                notes: p.medical_condition || '',
                image: p.image_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&h=200&fit=crop'
              }))
            };
          });
          setCustomers(formattedCustomers);
        } else {
          setCustomers([]);
        }
      } catch (err) {
        console.warn("Failed to fetch customers from Supabase:", err);
      }

      // 1.5 Fetch Appointments (Queue)
      try {
        let appointmentsQuery = supabase
          .from('appointments')
          .select(`
            id,
            pet_id,
            status,
            start_time,
            notes,
            pets (
              name,
              image_url,
              customers (
                display_name,
                first_name,
                last_name
              )
            )
          `);

        if (storeId && storeId !== 'default-store') {
          appointmentsQuery = appointmentsQuery.eq('store_id', storeId);
        }

        const { data: appointmentsData, error: appointmentsError } = await appointmentsQuery;

        if (appointmentsError) throw appointmentsError;

        if (appointmentsData) {
          const formattedQueue = appointmentsData.map((app: any) => {
            const pet = app.pets || {};
            const customer = pet.customers || {};
            const ownerName = customer.display_name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Walk-in';
            
            const dateObj = new Date(app.start_time);
            const date = dateObj.toISOString().split('T')[0];
            const time = dateObj.toTimeString().slice(0, 5);
            
            let status: QueueStatus = 'Waiting';
            if (app.status === 'confirmed') status = 'Checked-in';
            else if (app.status === 'completed') status = 'Completed';
            
            return {
              id: app.id,
              petId: app.pet_id,
              petName: pet.name || 'Unknown',
              ownerName: ownerName,
              serviceName: app.notes || 'Grooming',
              date: date,
              time: time,
              status: status,
              image: pet.image_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&h=200&fit=crop',
              isPaid: app.status === 'completed'
            };
          });
          useStore.setState({ queue: formattedQueue });
        }
      } catch (err) {
        console.warn("Failed to fetch appointments from Supabase:", err);
      }

      // 2. Fetch Services & Add-ons
      try {
        let servicesQuery = supabase.from('services').select('*');
        if (storeId && storeId !== 'default-store') {
          servicesQuery = servicesQuery.eq('store_id', storeId);
        }
        const { data: servicesData, error: servicesError } = await servicesQuery;

        if (servicesError) throw servicesError;

        if (servicesData && servicesData.length > 0) {
          // แยกบริการหลัก
          const mainServices = servicesData
            .filter(s => !s.is_addon)
            .map(s => ({
              id: s.id,
              title: s.name,
              category: s.category || 'Grooming',
              description: s.description || '',
              icon: (s.icon || 'grooming') as any,
              targetSpecies: (s.target_species || 'Dog') as any,
              prices: s.prices && Object.keys(s.prices).length > 0 ? s.prices : {
                'Standard': { price: Number(s.price || 0), duration: s.duration_minutes || 60 }
              },
              isActive: s.is_active !== false,
              coatType: s.coat_type || undefined
            }));
          setServices(mainServices);

          // แยกบริการเสริม (Add-ons)
          const addonsList = servicesData
            .filter(s => s.is_addon)
            .map(s => ({
              id: s.id,
              name: s.name,
              price: Number(s.price || 0),
              icon: (s.icon || 'nail') as any
            }));
          useStore.setState({ addons: addonsList });
        } else {
          setServices([]);
          useStore.setState({ addons: [] });
        }
      } catch (err) {
        console.warn("Failed to fetch services from Supabase:", err);
      }

      // 3. Fetch Partners
      try {
        let partnersQuery = supabase.from('partners').select('*');
        if (storeId && storeId !== 'default-store') {
          partnersQuery = partnersQuery.eq('store_id', storeId);
        }
        const { data: partnersData, error: partnersError } = await partnersQuery;

        if (partnersError) throw partnersError;

        if (partnersData) {
          const formattedPartners = partnersData.map(p => ({
            id: p.id,
            companyName: p.company_name,
            taxId: p.tax_id || '',
            address: p.address || '',
            phone: p.phone || '',
            email: p.email || '',
            contactPerson: p.contact_person || '',
            notes: p.notes || '',
            mainCategory: p.main_category || '',
            gpRate: Number(p.gp_rate || 0)
          }));
          useStore.setState({ partners: formattedPartners });
        } else {
          useStore.setState({ partners: [] });
        }
      } catch (err) {
        console.warn("Failed to fetch partners from Supabase:", err);
      }

      // 4. Fetch Products (Inventory)
      try {
        let productsQuery = supabase.from('products').select('*');
        if (storeId && storeId !== 'default-store') {
          productsQuery = productsQuery.eq('store_id', storeId);
        }
        const { data: productsData, error: productsError } = await productsQuery;

        if (productsError) throw productsError;

        if (productsData) {
          const formattedInventory = productsData.map(p => ({
            id: p.id,
            name: p.name,
            barcode: p.barcode || '',
            stock: p.stock || 0,
            minStock: p.min_stock || 5,
            price: Number(p.price || 0),
            costPrice: Number(p.cost_price || 0),
            unit: p.unit || 'ชิ้น',
            category: p.category || 'ทั่วไป',
            image: p.image_url || '',
            isConsignment: p.is_consignment || false,
            partnerId: p.partner_id || '',
            consignmentRate: Number(p.consignment_rate || 0)
          }));
          useStore.setState({ inventory: formattedInventory });
        } else {
          useStore.setState({ inventory: [] });
        }
      } catch (err) {
        console.warn("Failed to fetch products from Supabase:", err);
      }

      // 5. Fetch Stock Logs
      try {
        let logsQuery = supabase.from('stock_logs').select('*, products(name)');
        if (storeId && storeId !== 'default-store') {
          logsQuery = logsQuery.eq('store_id', storeId);
        }
        const { data: logsData, error: logsError } = await logsQuery;

        if (logsError) throw logsError;

        if (logsData) {
          const formattedLogs = logsData.map(l => ({
            id: l.id,
            productId: l.product_id,
            productName: l.products?.name || 'Unknown Product',
            action: l.action as any,
            oldQty: l.old_qty,
            newQty: l.new_qty,
            reason: l.reason || '',
            staffName: l.staff_name || 'System',
            timestamp: l.created_at
          }));
          useStore.setState({ stockLogs: formattedLogs });
        } else {
          useStore.setState({ stockLogs: [] });
        }
      } catch (err) {
        console.warn("Failed to fetch stock logs from Supabase:", err);
      }

      // 6. Fetch Sales Transactions
      try {
        let txQuery = supabase.from('sales_transactions').select('*').order('created_at', { ascending: false });
        if (storeId && storeId !== 'default-store') {
          txQuery = txQuery.eq('store_id', storeId);
        }
        const { data: txData, error: txError } = await txQuery;

        if (txError) throw txError;

        if (txData) {
          const formattedTx = txData.map(t => ({
            id: t.id,
            date: t.created_at.split('T')[0],
            amount: Number(t.amount),
            discountAmount: Number(t.discount_amount),
            customerId: t.customer_id || 'walk-in',
            customerName: t.customer_name,
            items: t.items,
            paymentMethod: t.payment_method,
            staffName: t.staff_name || 'Admin',
            species: [],
            bookingType: 'Walk-in' as BookingType
          }));
          useStore.setState({ transactions: formattedTx });
        } else {
          useStore.setState({ transactions: [] });
        }
      } catch (err) {
        console.warn("Failed to fetch transactions from Supabase:", err);
      }

      // 7. Fetch Package Templates
      try {
        let packagesQuery = supabase.from('package_templates').select('*');
        if (storeId && storeId !== 'default-store') {
          packagesQuery = packagesQuery.eq('store_id', storeId);
        }
        const { data: packagesData } = await packagesQuery;

        if (packagesData) {
          const formattedPackages = packagesData.map(p => ({
            id: p.id,
            name: p.name,
            serviceId: p.service_id,
            paidSlots: p.paid_slots || 0,
            freeSlots: p.free_slots || 0,
            price: Number(p.price || 0),
            bonusType: p.bonus_type || 'none',
            bonusName: p.bonus_name || '',
            bonusCount: p.bonus_count || 1
          }));
          useStore.setState({ packageTemplates: formattedPackages });
        } else {
          useStore.setState({ packageTemplates: [] });
        }
      } catch (e) {
        console.warn("package_templates table might not exist yet:", e);
      }

      // 8. Fetch Credit Packages
      try {
        let creditsQuery = supabase.from('credit_packages').select('*');
        if (storeId && storeId !== 'default-store') {
          creditsQuery = creditsQuery.eq('store_id', storeId);
        }
        const { data: creditsData } = await creditsQuery;
        if (creditsData) {
          const formattedCredits = creditsData.map(c => ({
            id: c.id,
            name: c.name,
            price: Number(c.price || 0),
            creditValue: Number(c.credit_value || 0)
          }));
          useStore.setState({ creditPackages: formattedCredits });
        } else {
          useStore.setState({ creditPackages: [] });
        }
      } catch (e) {
        console.warn("credit_packages table might not exist yet:", e);
      }

      // 9. Fetch Tier Rules
      try {
        const { data: tiersData } = await supabase
          .from('tier_rules')
          .select('*');
        if (tiersData && tiersData.length > 0) {
          const formattedTiers = tiersData.map(t => ({
            level: t.level as MembershipLevel,
            label: t.label,
            minSpent: Number(t.min_spent || 0),
            discount: Number(t.discount || 0)
          }));
          useStore.setState({ tierRules: formattedTiers });
        }
      } catch (e) {
        console.warn("tier_rules table might not exist yet:", e);
      }
    };

    if (isAuthenticated) {
      fetchInitialData();
    }
  }, [isAuthenticated, setCustomers, setServices, storeId]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-right" closeButton />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/superadmin" element={<SuperAdmin />} />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<HomeRedirect />} />
              <Route path="/pos" element={<Index />} />
              <Route path="/queue" element={<Queue />} />
              <Route path="/services" element={<Services />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/marketing" element={<Marketing />} />
              <Route path="/staff" element={<Staff />} />
              <Route path="/staff/performance" element={<StaffPerformance />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;