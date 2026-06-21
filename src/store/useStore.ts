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

// Re-export all types so that other files can import them from '@/store/useStore'
export * from './types';

export const useStore = create<AppState>()((set, get) => ({
  shopName: 'Mellow Fellow Sanctuary',
  shopLogo: null,
  shopAddress: '',
  shopPhone: '',
  shopLineId: '',
  currency: '฿',
  shopIsOpen: true,
  receiptHeader: 'Tax Invoice / Receipt',
  receiptFooter: 'Thank you for your visit!',
  receiptPaperSize: '80mm',
  slotDuration: 60,
  maxCapacity: 3,
  openTime: '09:00',
  closeTime: '19:00',
  kennelCapacity: 8,
  language: 'th',
  vatEnabled: false,
  liffId: '',
  liffChannelId: '',
  liffChannelSecret: '',
  liffEnabled: false,
  maxUsers: 5,
  
  customers: [],
  selectedOwner: null,
  activePet: null,
  activeQueueItemId: null,
  queue: [],
  services: [],
  addons: [],
  inventory: [],
  partners: [],
  stockLogs: [],
  transactions: [],
  packageTemplates: [],
  creditPackages: [],
  staff: [],
  logs: [],
  reportHistory: [],
  tierRules: [
    { level: 'Standard', label: 'Standard', minSpent: 0, discount: 0 },
    { level: 'Silver', label: 'Silver', minSpent: 5000, discount: 5 },
    { level: 'Gold', label: 'Gold', minSpent: 15000, discount: 10 },
    { level: 'VIP', label: 'VIP', minSpent: 30000, discount: 15 }
  ],
  cart: [],
  disabledSlots: [],
  recurringHolidays: [],
  specificHolidays: [],
  
  rolePermissions: {
    'superadmin': ['/', '/pos', '/queue', '/customers', '/inventory', '/marketing', '/staff', '/staff/performance', '/logs', '/reports', '/settings'],
    'Admin': ['/', '/pos', '/queue', '/customers', '/inventory', '/marketing', '/staff', '/staff/performance', '/logs', '/reports', '/settings'],
    'Groomer': ['/', '/pos', '/queue', '/customers', '/inventory'],
    'Assistant': ['/', '/queue', '/customers']
  },

  ...createAuthSlice(set, get, {} as any),

  setLanguage: (lang) => set({ language: lang }),
  selectOwner: (owner) => set({ selectedOwner: owner, activePet: owner ? owner.pets[0] : null, activeQueueItemId: null }),
  setActivePet: (pet) => set({ activePet: pet }),
  setActiveQueueItem: (id) => set({ activeQueueItemId: id }),

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
            receipt_header: profile.receipt_header !== undefined ? profile.receiptHeader : undefined,
            receipt_footer: profile.receipt_footer !== undefined ? profile.receiptFooter : undefined,
            receipt_paper_size: profile.receiptPaperSize !== undefined ? profile.receiptPaperSize : undefined,
            currency: localCurrency => localCurrency, // handled by other fields
            shopIsOpen: localShopIsOpen => localShopIsOpen, // handled by other fields
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

  setCustomers: (customers) => set({ customers }),
  addCustomer: (data) => set(s => ({ customers: [...s.customers, { ...data, id: Math.random().toString() }] })),
  updateCustomer: (id, data) => set(s => ({ customers: s.customers.map(c => c.id === id ? { ...c, ...data } : c) })),
  deleteCustomer: (id) => set(s => ({ customers: s.customers.filter(c => c.id !== id) })),
  bindLineToCustomer: (customerId, lineId) => set(s => ({ customers: s.customers.map(c => c.id === customerId ? { ...c, lineId } : c) })),

  addPet: (customerId, pet) => set(s => ({ customers: s.customers.map(c => c.id === customerId ? { ...c, pets: [...c.pets, { ...pet, id: Math.random().toString() }] } : c) })),
  updatePet: (customerId, petId, data) => set(s => ({ customers: s.customers.map(c => c.id === customerId ? { ...c, pets: c.pets.map(p => p.id === petId ? { ...p, ...data } : p) } : c) })),
  updatePetWeight: (customerId, petId, weight) => set(s => ({ customers: s.customers.map(c => c.id === customerId ? { ...c, pets: c.pets.map(p => p.id === petId ? { ...p, weightHistory: [...p.weightHistory, { date: new Date().toISOString().split('T')[0], value: weight }] } : p) } : c) })),
  saveIntakeRecord: (customerId, petId, record) => set(s => ({ customers: s.customers.map(c => c.id === customerId ? { ...c, pets: c.pets.map(p => p.id === petId ? { ...p, intakeHistory: [...(p.intakeHistory || []), record] } : p) } : c) })),

  addBooking: (booking) => set(s => ({ queue: [...s.queue, { ...booking, id: Math.random().toString() }] })),
  updateQueueStatus: (id, status) => set(s => ({ queue: s.queue.map(q => q.id === id ? { ...q, status } : q) })),
  removeQueueItem: (id) => set(s => ({ queue: s.queue.filter(q => q.id !== id) })),
  markAsPaid: (id) => set(s => ({ queue: s.queue.map(q => q.id === id ? { ...q, isPaid: true } : q) })),

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
        customerId: data.customer_id || 'walk-id',
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
        min_stock: item.min_stock || 5,
        price: item.price || 0,
        cost_price: item.costPrice || 0,
        unit: item.unit || 'ชิ้น',
        category: item.category || 'ทั่วไป',
        image_url: item.image || '',
        is_consignment: item.isConsignment || false,
        partner_id: item.partnerId || null,
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
        reason: logData.reason || '',
        staffName: logData.staff_name || 'System',
        timestamp: logData.created_at
      };
      set(s => ({ stockLogs: [newLog, ...s.stockLogs] }));
    } else {
      console.error("Error adding stock log to Supabase:", logError);
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
    const maxUsers = get().maxUsers || 5;
    const activeStaffCount = get().staff.filter(s => !s.isPendingInvite && s.status === 'Active').length;

    if (st.status === 'Active' && activeStaffCount >= maxUsers) {
      toast.error(get().language === 'th' 
        ? `ไม่สามารถเพิ่มพนักงานได้เนื่องจากจำนวน Active User เต็มแล้ว (${activeStaffCount}/${maxUsers} บัญชี)` 
        : `Cannot add staff. Active user limit reached (${activeStaffCount}/${maxUsers} accounts)`
      );
      return;
    }
    
    // Generate unique invite link
    const inviteId = 'invite-' + Math.random().toString(36).substr(2, 9);
    const inviteLink = `${window.location.origin}/login?invite=true&storeId=${currentStoreId}&role=${st.role}&name=${encodeURIComponent(st.name)}&commission=${st.commissionRate}&phone=${st.phone}&inviteId=${inviteId}`;

    const newInvite = {
      id: inviteId,
      name: st.name,
      role: st.role,
      phone: st.phone,
      status: 'Inactive' as const,
      avatar: st.avatar,
      username: 'Pending Google Link',
      commissionRate: st.commissionRate,
      isPendingInvite: true,
      inviteLink: inviteLink
    };

    // Save to localStorage
    const pendingInvitesStr = localStorage.getItem('pending_staff_invites');
    const pendingInvites = pendingInvitesStr ? JSON.parse(pendingInvitesStr) : [];
    pendingInvites.push(newInvite);
    localStorage.setItem('pending_staff_invites', JSON.stringify(pendingInvites));

    // Update state
    set(s => ({ staff: [...s.staff, newInvite] }));
    
    // Show success toast with link
    toast.success(`สร้างคำเชิญสำหรับ ${st.name} เรียบร้อยแล้ว!`);
  },

  updateStaff: async (id, st) => {
    const maxUsers = get().maxUsers || 5;
    const currentStaff = get().staff.find(s => s.id === id);
    const activeStaffCount = get().staff.filter(s => !s.isPendingInvite && s.status === 'Active' && s.id !== id).length;

    if (st.status === 'Active' && currentStaff?.status !== 'Active' && activeStaffCount >= maxUsers) {
      toast.error(get().language === 'th' 
        ? `ไม่สามารถเปิดใช้งานพนักงานได้เนื่องจากจำนวน Active User เต็มแล้ว (${activeStaffCount}/${maxUsers} บัญชี)` 
        : `Cannot activate staff. Active user limit reached (${activeStaffCount}/${maxUsers} accounts)`
      );
      return;
    }

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
    if (id.startsWith('invite-')) {
      const pendingInvitesStr = localStorage.getItem('pending_staff_invites');
      if (pendingInvitesStr) {
        const pendingInvites = JSON.parse(pendingInvitesStr);
        const updated = pendingInvites.filter((i: any) => i.id !== id);
        localStorage.setItem('pending_staff_invites', JSON.stringify(updated));
      }
      set(s => ({ staff: s.staff.filter(mem => mem.id !== id) }));
      toast.success("ลบลิงก์คำเชิญเรียบร้อยแล้ว");
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .delete()
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
</dyad-file><thought
Now let's update `src/App.tsx` to fetch and set `maxUsers` from `storeData.max_users`.
Let's check `src/App.tsx` around line 100:
```typescript
              vatEnabled: storeData.vat_enabled || false,
              vatRate: storeData.vat_rate || 7,
              maxUsers: storeData.max_users || 5
```
Let's write `src/App.tsx`.<dyad-write path="src/App.tsx" description="Updating App.tsx to fetch and set maxUsers from storeData.max_users during initialization.">
"use client";

import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useStore, BookingType, MembershipLevel, QueueStatus, StaffRole } from "@/store/useStore";
import { supabase } from "@/integrations/supabase/client";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import Queue import Queue from "./pages/Queue";
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
import LiffRegister from "./pages/LiffRegister";
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
              maxUsers: storeData.max_users || 5
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
        const { data: txData } = await txQuery;

        if (txData) {
          const formattedTransactions = txData.map((tx: any) => ({
            id: tx.id,
            date: tx.created_at.split('T')[0],
            amount: Number(tx.amount || 0),
            discountAmount: Number(tx.discount_amount || 0),
            customerId: tx.customer_id || 'walk-in',
            customerName: tx.customer_name,
            items: tx.items,
            paymentMethod: tx.payment_method,
            staffName: tx.staff_name || 'Admin',
            species: [],
            bookingType: 'Walk-in' as BookingType
          }));
          useStore.setState({ transactions: formattedTransactions });
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
          .from('membership_tiers')
          .select('*');
        if (tiersData && tiersData.length > 0) {
          const formattedTiers = tiersData.map(t => ({
            level: (t.tier_key.charAt(0).toUpperCase() + t.tier_key.slice(1)) as MembershipLevel,
            label: t.name,
            minSpent: Number(t.min_points || 0),
            discount: 0
          }));
          useStore.setState({ tierRules: formattedTiers });
        }
      } catch (e) {
        console.warn("Failed to fetch membership tiers:", e);
      }

      // 10. Fetch Report History
      try {
        let reportHistoryQuery = supabase.from('report_history').select('*').order('created_at', { ascending: false });
        if (storeId && storeId !== 'default-store') {
          reportHistoryQuery = reportHistoryQuery.eq('store_id', storeId);
        }
        const { data: reportData, error: reportError } = await reportHistoryQuery;

        if (reportError) throw reportError;

        if (reportData) {
          const formattedReports = reportData.map(r => ({
            id: r.id,
            reportName: r.report_name,
            filters: r.filters || '',
            staffName: r.staff_name || 'System',
            timestamp: r.created_at
          }));
          useStore.setState({ reportHistory: formattedReports });
        } else {
          useStore.setState({ reportHistory: [] });
        }
      } catch (err) {
        console.warn("Failed to fetch report history from Supabase:", err);
      }

      // 11. Fetch Staff (Profiles)
      try {
        let staffQuery = supabase.from('profiles').select('*');
        if (storeId && storeId !== 'default-store') {
          staffQuery = staffQuery.eq('store_id', storeId);
        }
        const { data: staffData, error: staffError } = await staffQuery;

        if (staffError) throw staffError;

        if (staffData) {
          const pendingInvitesStr = localStorage.getItem('pending_staff_invites');
          let pendingInvites = pendingInvitesStr ? JSON.parse(pendingInvitesStr) : [];

          const formattedStaff = staffData.map(s => ({
            id: s.id,
            name: s.full_name || s.email.split('@')[0],
            role: (s.role === 'admin' ? 'Admin' : s.role === 'staff' ? 'Assistant' : s.role) as StaffRole,
            phone: s.phone || '',
            status: (s.status || 'Active') as 'Active' | 'Inactive',
            avatar: s.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
            username: s.email,
            commissionRate: Number(s.commission_rate || 0)
          }));

          // Filter out pending invites that have been accepted (matched by phone or name)
          pendingInvites = pendingInvites.filter((invite: any) => {
            const accepted = formattedStaff.some(s => s.phone === invite.phone || s.name === invite.name);
            return !accepted;
          });
          localStorage.setItem('pending_staff_invites', JSON.stringify(pendingInvites));

          useStore.setState({ staff: [...formattedStaff, ...pendingInvites] });
        } else {
          useStore.setState({ staff: [] });
        }
      } catch (err) {
        console.warn("Failed to fetch staff from Supabase:", err);
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
            <Route path="/liff/register" element={<LiffRegister />} />
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