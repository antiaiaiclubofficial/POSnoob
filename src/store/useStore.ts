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

  // Global Actions
  addLog: (log) => set(s => ({ 
    logs: [{ ...log, id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toISOString() } as ActivityLog, ...s.logs] 
  })),

  addReportLog: async (log) => {
    const currentStoreId = get().storeId;
    const { data, error } = await supabase
      .from('report_history')
      .insert([{
        store_id: currentStoreId && currentStoreId !== 'default-store' ? currentStoreId : null,
        report_name: log.reportName,
        filters: log.filters,
        staff_name: log.staffName
      }])
      .select()
      .single();

    if (!error && data) {
      const newLog: ReportHistory = {
        id: data.id,
        reportName: data.report_name,
        filters: data.filters || '',
        staffName: data.staff_name,
        timestamp: data.created_at
      };
      set(s => ({ reportHistory: [newLog, ...s.reportHistory] }));
    } else {
      console.error("Error adding report log to Supabase:", error);
      set(s => ({
        reportHistory: [{ ...log, id: `REP-${Math.random().toString(36).substr(2, 5).toUpperCase()}`, timestamp: new Date().toISOString() }, ...s.reportHistory]
      }));
    }
  },

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
          .from('membership_tiers')
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

  toggleSlotStatus: (time) => set(s => {
    const isDisabled = s.disabledSlots.includes(time);
    return {
      disabledSlots: isDisabled 
        ? s.disabledSlots.filter(t => t !== time)
        : [...s.disabledSlots, time]
    };
  }),

  addToCart: (item) => set(s => ({ cart: [...s.cart, item] })),
  removeFromCart: (index) => set(s => ({ cart: s.cart.filter((_, i) => i !== index) })),
  updateCartQuantity: (index, delta) => set(s => ({
    cart: s.cart.map((item, i) => i === index ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item)
  })),
  updateCartItemDiscount: (index, discountType, discountValue) => set(s => ({
    cart: s.cart.map((item, i) => i === index ? { ...item, discountType, discountValue } : item)
  })),
  clearCart: () => set({ cart: [] }),

  processPayment: async (customerId, total, discount, items, method, details, isTaxInvoice, redeemedPoints) => {
    const currentStoreId = get().storeId;
    const staffName = get().currentUser?.name || 'Admin';
    
    const { data, error } = await supabase
      .from('sales_transactions')
      .insert([{
        store_id: currentStoreId && currentStoreId !== 'default-store' ? currentStoreId : null,
        customer_id: customerId === 'walk-in' ? null : customerId,
        customer_name: customerId === 'walk-in' ? 'Walk-in' : get().customers.find(c => c.id === customerId)?.name || 'Customer',
        amount: total,
        discount_amount: discount,
        items: items,
        payment_method: method,
        staff_name: staffName,
        is_tax_invoice: isTaxInvoice
      }])
      .select()
      .single();

    if (error) {
      console.error("Error saving transaction:", error);
      throw error;
    }

    if (data) {
      const newTx: Transaction = {
        id: data.id,
        date: data.created_at.split('T')[0],
        amount: Number(data.amount),
        discountAmount: Number(data.discount_amount),
        customerId: data.customer_id || 'walk-in',
        customerName: data.customer_name,
        items: data.items,
        paymentMethod: data.payment_method as PaymentMethod,
        staffName: data.staff_name || 'Admin',
        species: [],
        bookingType: 'Walk-in' as BookingType
      };

      set(s => {
        const updatedCustomers = s.customers.map(c => {
          if (c.id !== customerId) return c;
          
          let newCreditBalance = c.creditBalance;
          if (method === 'Store Credit') {
            newCreditBalance = Math.max(0, c.creditBalance - total);
          }

          const pointsEarned = Math.floor(total / (s.pointsEarnRate || 10));
          const newPoints = (c.points || 0) + pointsEarned - (redeemedPoints || 0);

          return {
            ...c,
            creditBalance: newCreditBalance,
            points: newPoints,
            totalSpent: c.totalSpent + total
          };
        });

        return {
          transactions: [newTx, ...s.transactions],
          customers: updatedCustomers
        };
      });

      for (const item of items) {
        if (item.type === 'Product') {
          const prod = get().inventory.find(i => i.id === item.id);
          if (prod) {
            get().adjustStock(prod.id, item.quantity, 'Out', `Sale #${data.id}`);
          }
        }
      }
    }
  },

  deleteTransaction: async (id) => {
    const { error } = await supabase.from('sales_transactions').delete().eq('id', id);
    if (error) {
      console.error("Error deleting transaction:", error);
      throw error;
    }
    set(s => ({ transactions: s.transactions.filter(t => t.id !== id) }));
  },

  setServices: (services) => set({ services }),

  addService: async (service) => {
    const currentStoreId = get().storeId;
    const { data, error } = await supabase
      .from('services')
      .insert([{
        store_id: currentStoreId && currentStoreId !== 'default-store' ? currentStoreId : null,
        name: service.title,
        category: service.category,
        description: service.description,
        icon: service.icon,
        target_species: service.targetSpecies,
        prices: service.prices,
        is_active: service.isActive,
        coat_type: service.coatType,
        is_addon: false
      }])
      .select()
      .single();

    if (error) {
      console.error("Error adding service:", error);
      throw error;
    }

    if (data) {
      const newService: Service = {
        id: data.id,
        title: data.name,
        category: data.category || 'Grooming',
        description: data.description || '',
        icon: data.icon as ServiceIcon,
        targetSpecies: data.target_species as 'Dog' | 'Cat',
        prices: data.prices,
        isActive: data.is_active !== false,
        coatType: data.coat_type
      };
      set(s => ({ services: [...s.services, newService] }));
    }
  },

  updateService: async (id, service) => {
    const { error } = await supabase
      .from('services')
      .update({
        name: service.title,
        category: service.category,
        description: service.description,
        icon: service.icon,
        target_species: service.targetSpecies,
        prices: service.prices,
        is_active: service.isActive,
        coat_type: service.coatType
      })
      .eq('id', id);

    if (error) {
      console.error("Error updating service:", error);
      throw error;
    }

    set(s => ({
      services: s.services.map(ser => ser.id === id ? { ...ser, ...service } : ser)
    }));
  },

  deleteService: async (id) => {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) {
      console.error("Error deleting service:", error);
      throw error;
    }
    set(s => ({ services: s.services.filter(ser => ser.id !== id) }));
  },

  toggleServiceActive: async (id) => {
    const service = get().services.find(s => s.id === id);
    if (!service) return;
    const newActive = !service.isActive;

    const { error } = await supabase
      .from('services')
      .update({ is_active: newActive })
      .eq('id', id);

    if (error) {
      console.error("Error toggling service active:", error);
      throw error;
    }

    set(s => ({
      services: s.services.map(ser => ser.id === id ? { ...ser, isActive: newActive } : ser)
    }));
  },

  addAddon: async (addon) => {
    const currentStoreId = get().storeId;
    const { data, error } = await supabase
      .from('services')
      .insert([{
        store_id: currentStoreId && currentStoreId !== 'default-store' ? currentStoreId : null,
        name: addon.name,
        price: addon.price,
        icon: addon.icon,
        is_addon: true,
        is_active: true
      }])
      .select()
      .single();

    if (error) {
      console.error("Error adding addon:", error);
      throw error;
    }

    if (data) {
      const newAddon: AddonItem = {
        id: data.id,
        name: data.name,
        price: Number(data.price || 0),
        icon: data.icon as ServiceIcon
      };
      set(s => ({ addons: [...s.addons, newAddon] }));
    }
  },

  updateAddon: async (id, addon) => {
    const { error } = await supabase
      .from('services')
      .update({
        name: addon.name,
        price: addon.price,
        icon: addon.icon
      })
      .eq('id', id);

    if (error) {
      console.error("Error updating addon:", error);
      throw error;
    }

    set(s => ({
      addons: s.addons.map(add => add.id === id ? { ...add, ...addon } : add)
    }));
  },

  deleteAddon: async (id) => {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) {
      console.error("Error deleting addon:", error);
      throw error;
    }
    set(s => ({ addons: s.addons.filter(add => add.id !== id) }));
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
        partner_id: item.partnerId || null,
        consignment_rate: item.consignmentRate || 0
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
        consignment_rate: item.consignmentRate || 0
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
        contact_person: v.contactPerson || '',
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

  addStaff: async (st) => {
    const currentStoreId = get().storeId;
    const email = st.username || st.email;

    if (!email) {
      toast.error("Email is required to add staff");
      return;
    }

    // 1. Search for existing profile by email
    const { data: existingProfiles, error: searchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email);

    if (searchError) {
      console.error("Error searching for staff profile:", searchError);
      toast.error("Error searching for staff profile");
      return;
    }

    if (existingProfiles && existingProfiles.length > 0) {
      const profile = existingProfiles[0];
      
      // 2. Update the existing profile with the current store_id and other details
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          store_id: currentStoreId && currentStoreId !== 'default-store' ? currentStoreId : null,
          full_name: st.name,
          role: st.role === 'Assistant' ? 'staff' : st.role,
          phone: st.phone,
          status: st.status,
          avatar_url: st.avatar,
          commission_rate: st.commissionRate,
          is_approved: true // Auto-approve since the store admin is adding them
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error("Error assigning staff to store:", updateError);
        toast.error("Failed to assign staff to store");
        return;
      }

      const newStaff: Staff = {
        id: profile.id,
        name: st.name,
        role: st.role,
        phone: st.phone,
        status: st.status,
        avatar: st.avatar,
        username: email,
        commissionRate: st.commissionRate
      };

      set(s => ({ staff: [...s.staff, newStaff] }));
      toast.success(`Added ${st.name} to the team!`);
    } else {
      // Profile not found - explain that they need to sign up first
      toast.error(`ไม่พบผู้ใช้ที่มีอีเมล ${email} ในระบบ กรุณาให้พนักงานสมัครสมาชิกก่อน แล้วจึงเพิ่มเข้าสู่ร้านค้าที่นี่`, {
        duration: 6000
      });
    }
  },

  updateStaff: async (id, st) => {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: st.name,
        role: st.role === 'Assistant' ? 'staff' : st.role,
        phone: st.phone,
        status: st.status,
        avatar_url: st.avatar,
        commission_rate: st.commissionRate
      })
      .eq('id', id);

    if (error) {
      console.error("Error updating staff:", error);
      throw error;
    }

    set(s => ({
      staff: s.staff.map(mem => mem.id === id ? { ...mem, ...st } : mem)
    }));
  },

  deleteStaff: async (id) => {
    const { error } = await supabase
      .from('profiles')
      .update({ store_id: null })
      .eq('id', id);

    if (error) {
      console.error("Error deleting staff:", error);
      throw error;
    }

    set(s => ({ staff: s.staff.filter(mem => mem.id !== id) }));
  },

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