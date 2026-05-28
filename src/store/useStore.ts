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
  isAuthenticated: false,
  isAuthLoading: true,
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

  // LINE LIFF Default Settings
  liffId: '2001234567-AbCdEfGh',
  liffChannelId: '1657483920',
  liffChannelSecret: '••••••••••••••••••••••••••••••••',
  liffEnabled: true,

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

  // Default Role Permissions
  rolePermissions: {
    Admin: ['/', '/pos', '/queue', '/customers', '/inventory', '/marketing', '/staff', '/staff/performance', '/logs', '/reports', '/settings'],
    Groomer: ['/', '/queue', '/customers'],
    Assistant: ['/', '/pos', '/queue', '/customers']
  },

  login: (id, pass) => {
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

  loginWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          prompt: 'select_account'
        },
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
  },

  setSession: (user) => {
    if (user) {
      const storeIdFromMetadata = user.user_metadata?.store_id || 'default-store';
      set({ 
        isAuthenticated: true, 
        isAuthLoading: false,
        currentUser: {
          id: user.id,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: 'Admin', 
          email: user.email,
          avatar: user.user_metadata?.avatar_url || undefined 
        },
        storeId: storeIdFromMetadata
      });
    } else {
      set({ isAuthenticated: false, isAuthLoading: false, currentUser: null, storeId: null });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ isAuthenticated: false, currentUser: null, storeId: null, isAuthLoading: false });
  },

  verifyPassword: (pass) => {
    const { currentUser, staff } = get();
    if (!currentUser) return false;
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
  updateTierRules: (rules) => set({ tierRules: rules }),
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
  updatePetWeight: (cid, pid, w) => set(s => ({ customers: s.customers.map(c => c.id === cid ? { ...c, pets: c.pets.map(p => p.id === pid ? { ...p, weightHistory: [...p.weightHistory, { date: new Date().toISOString().split('T')[0], value: w }] } : p) } : c) })),
  saveIntakeRecord: (cid, pid, rec) => {},

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
  processPayment: (cid, total, disc, items, method, details, isTaxInvoice) => {
    const tx = { id: `TX-${Date.now()}`, date: new Date().toISOString().split('T')[0], amount: total, discountAmount: disc, customerId: cid, customerName: get().customers.find(c => c.id === cid)?.name || 'Walk-in', items, paymentMethod: method, staffName: 'Admin', species: [], bookingType: 'Walk-in' };
    set(s => ({ transactions: [tx as any, ...s.transactions] }));

    // If the customer is not walk-in, process package/credit purchases and credit usage
    if (cid && cid !== 'walk-in') {
      // 1. Deduct credit balance if paid via Store Credit
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

      // 2. Process items in cart
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
  },
  deleteTransaction: (id) => set(s => ({ transactions: s.transactions.filter(t => t.id !== id) })),

  setServices: (services) => set({ services }),
  addService: async (ser) => {
    const priceKeys = Object.keys(ser.prices);
    const defaultPrice = priceKeys.length > 0 ? ser.prices[priceKeys[0]].price : 0;
    const defaultDuration = priceKeys.length > 0 ? ser.prices[priceKeys[0]].duration : 60;

    try {
      const { data, error } = await supabase
        .from('services')
        .insert([{
          name: ser.title,
          description: ser.description,
          price: defaultPrice,
          duration_minutes: defaultDuration
        }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newService: Service = {
          ...ser,
          id: data.id,
          prices: ser.prices || {
            'Standard': { price: data.price || 0, duration: data.duration_minutes || 60 }
          }
        };
        set(s => ({ services: [...s.services, newService] }));
      }
    } catch (err) {
      console.warn("Supabase insert failed, falling back to local state:", err);
      const localService: Service = {
        ...ser,
        id: `local-${Math.random().toString(36).substr(2, 9)}`,
        prices: ser.prices || {
          'Standard': { price: defaultPrice, duration: defaultDuration }
        }
      };
      set(s => ({ services: [...s.services, localService] }));
    }
  },
  updateService: async (id, ser) => {
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
          duration_minutes: defaultDuration
        })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.warn("Supabase update failed, falling back to local state:", err);
    }
    set(s => ({ services: s.services.map(item => item.id === id ? { ...item, ...ser } : item) }));
  },
  deleteService: async (id) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.warn("Supabase delete failed, falling back to local state:", err);
    }
    set(s => ({ services: s.services.filter(item => item.id !== id) }));
  },
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

  setStaff: (staff) => set({ staff }),
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