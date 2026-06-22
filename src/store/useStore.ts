"use client";

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
  maxStaff: 10,
  pointsEarnRate: 10,
  pointsRedeemRate: 1,
  
  // Lists
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
  ...createCRMSlice(set, get, {} as any),

  setLanguage: (lang) => set({ language: lang }),

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
            max_users: profile.maxUsers !== undefined ? profile.maxUsers : undefined,
            max_staff: profile.maxStaff !== undefined ? profile.maxStaff : undefined,
          })
          .eq('id', storeId);
        if (error) throw error;
      } catch (err) {
        console.error("Failed to update store profile in Supabase:", err);
      }
    }
    toast.success("Business profile updated successfully!");
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
    toast.success("Booking settings updated successfully!");
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
          })
          .eq('id', rule.level);
      }
    } catch (e) {
      console.error("Error updating tier rules:", e);
    }
  },

  updateRolePermissions: (role, permissions) => {
    set(state => ({
      rolePermissions: {
        ...state.rolePermissions,
        [role]: permissions
      }
    }));
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
      console.error("Error updating service active status:", error);
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
        icon: (data.icon || 'grooming') as any
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
      addons: s.addons.map(a => a.id === id ? { ...a, ...addon } : a)
    }));
  },

  deleteAddon: async (id) => {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) {
      console.error("Error deleting addon:", error);
      throw error;
    }
    set(s => ({ addons: s.addons.filter(a => a.id !== id) }));
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
        cost_price: item.cost_price || 0,
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
        contact_person: v.contact_person || '',
        notes: v.notes,
        main_category: v.mainCategory,
        gp_rate: v.gp_rate || 0
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
    const maxStaff = get().maxStaff || 10;
    const activeStaffCount = get().staff.filter(s => !s.isPendingInvite && s.status === 'Active').length;

    if (st.status === 'Active' && activeStaffCount >= maxStaff) {
      toast.error(get().language === 'th' 
        ? `ไม่สามารถเพิ่มพนักงานได้เนื่องจากจำนวนบัญชีพนักงานเต็มแล้ว (${activeStaffCount}/${maxStaff} บัญชี)` 
        : `Cannot add staff. Staff account limit reached (${activeStaffCount}/${maxStaff} accounts)`
      );
      return;
    }
    
    // Generate unique invite link using a valid UUID
    const generateUUID = () => {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    const inviteId = generateUUID();
    
    // Encode invitation details into a secure token to bypass foreign key constraints
    const inviteData = {
      inviteId,
      storeId: currentStoreId,
      storeName: get().shopName,
      role: st.role,
      name: st.name,
      phone: st.phone,
      commissionRate: st.commissionRate,
      avatar: st.avatar
    };
    const token = btoa(encodeURIComponent(JSON.stringify(inviteData)));
    const inviteLink = `${window.location.origin}/login?invite=true&token=${token}`;

    // Save pending invite locally to localStorage so it displays in the staff list
    const pendingInvitesStr = localStorage.getItem('pending_staff_invites');
    const pendingInvites = pendingInvitesStr ? JSON.parse(pendingInvitesStr) : [];
    
    const newPendingInvite = {
      id: `invite-${inviteId}`,
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

    const updatedInvites = [...pendingInvites, newPendingInvite];
    localStorage.setItem('pending_staff_invites', JSON.stringify(updatedInvites));

    // Update local state immediately
    set(s => ({ staff: [...s.staff, newPendingInvite] }));

    // Show success toast with link and copy action
    toast.success(`สร้างคำเชิญสำหรับ ${st.name} เรียบร้อยแล้ว!`, {
      action: {
        label: 'คัดลอกลิงก์',
        onClick: () => {
          navigator.clipboard.writeText(inviteLink);
          toast.success('คัดลอกลิงก์คำเชิญเรียบร้อยแล้ว!');
        }
      },
      duration: 10000
    });
  },

  updateStaff: async (id, st) => {
    const maxStaff = get().maxStaff || 10;
    const currentStaff = get().staff.find(s => s.id === id);
    const activeStaffCount = get().staff.filter(s => s.status === 'Active' && s.id !== id).length;

    if (st.status === 'Active' && currentStaff?.status !== 'Active' && activeStaffCount >= maxStaff) {
      toast.error(get().language === 'th' 
        ? `ไม่สามารถเปิดใช้งานพนักงานได้เนื่องจากจำนวนบัญชีพนักงานเต็มแล้ว (${activeStaffCount}/${maxStaff} บัญชี)` 
        : `Cannot activate staff. Staff account limit reached (${activeStaffCount}/${maxStaff} accounts)`
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

    // If status is set to Inactive, delete active session
    if (st.status === 'Inactive') {
      try {
        await supabase
          .from('active_sessions')
          .delete()
          .eq('user_id', id);
        console.log(`[updateStaff] Deleted active session for user ${id} due to deactivation.`);
      } catch (err) {
        console.error("Error deleting active session on staff deactivation:", err);
      }
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
  assignPackageToCustomer: (customerId, templateId) => {
    const template = get().packageTemplates.find(t => t.id === templateId);
    if (!template) return;

    const newPackage = {
      id: `assigned-${Date.now()}`,
      templateId: template.id,
      name: template.name,
      targetServiceId: template.serviceId,
      totalSlots: template.paidSlots + template.freeSlots,
      remainingSlots: template.paidSlots + template.freeSlots,
      bonusType: template.bonusType,
      bonusName: template.bonusName,
      bonusCount: template.bonusCount,
      purchaseDate: new Date().toISOString().split('T')[0]
    };

    set(s => {
      const updatedCustomers = s.customers.map(c => {
        if (c.id !== customerId) return c;
        return {
          ...c,
          packages: [...(c.packages || []), newPackage]
        };
      });
      return { customers: updatedCustomers };
    });
  },

  addCreditPackage: (pkg) => set(s => ({ creditPackages: [...s.creditPackages, { ...pkg, id: Math.random().toString() }] })),
  updateCreditPackage: (id, pkg) => set(s => ({ creditPackages: s.creditPackages.map(p => p.id === id ? { ...p, ...pkg } : p) })),
  deleteCreditPackage: (id) => set(s => ({ creditPackages: s.creditPackages.filter(p => p.id !== id) })),
  buyCreditPackage: (customerId, packageId) => {
    const pkg = get().creditPackages.find(p => p.id === packageId);
    if (!pkg) return;

    set(s => ({
      customers: s.customers.map(c => {
        if (c.id !== customerId) return c;
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
  },

  toggleSlotStatus: (time) => set(state => ({
    disabledSlots: state.disabledSlots.includes(time)
      ? state.disabledSlots.filter(t => t !== time)
      : [...state.disabledSlots, time]
  })),

  addToCart: (item) => set(state => {
    const existingIndex = state.cart.findIndex(i => i.id === item.id && i.petId === item.petId);
    if (existingIndex > -1) {
      const newCart = [...state.cart];
      newCart[existingIndex].quantity += item.quantity;
      return { cart: newCart };
    }
    return { cart: [...state.cart, item] };
  }),

  removeFromCart: (index) => set(state => ({
    cart: state.cart.filter((_, i) => i !== index)
  })),

  updateCartQuantity: (index, delta) => set(state => {
    const newCart = [...state.cart];
    newCart[index].quantity = Math.max(1, newCart[index].quantity + delta);
    return { cart: newCart };
  }),

  updateCartItemDiscount: (index, discountType, discountValue) => set(state => {
    const newCart = [...state.cart];
    newCart[index].discountType = discountType;
    newCart[index].discountValue = discountValue;
    return { cart: newCart };
  }),

  clearCart: () => set({ cart: [] }),

  processPayment: async (customerId, total, discount, items, method, details, isTaxInvoice, redeemedPoints) => {
    const currentStoreId = get().storeId;
    const staffName = get().currentUser?.name || 'Admin';
    const staffId = get().currentUser?.id;

    // 1. Insert transaction into Supabase
    const { data, error } = await supabase
      .from('sales_transactions')
      .insert([{
        store_id: currentStoreId && currentStoreId !== 'default-store' ? currentStoreId : null,
        customer_id: customerId === 'walk-id' || customerId === 'walk-in' ? null : customerId,
        customer_name: get().selectedOwner?.name || 'Walk-in Customer',
        amount: total,
        discount_amount: discount,
        items: items,
        payment_method: method,
        staff_name: staffName,
        staff_id: staffId,
        details: details,
        is_tax_invoice: isTaxInvoice
      }])
      .select()
      .single();

    if (error) {
      console.error("Error processing payment:", error);
      toast.error("Payment failed: " + error.message);
      throw error;
    }

    // 2. Update customer points and credit balance if applicable
    if (customerId && customerId !== 'walk-in' && customerId !== 'walk-id') {
      const customer = get().customers.find(c => c.id === customerId);
      if (customer) {
        let newPoints = customer.points || 0;
        let newCreditBalance = customer.creditBalance || 0;

        // Deduct store credit if payment method is Store Credit
        if (method === 'Store Credit') {
          newCreditBalance = Math.max(0, newCreditBalance - total);
        }

        // Deduct package slots if payment method is Package
        let updatedPackages = [...(customer.packages || [])];
        if (method === 'Package' && details.packageId) {
          updatedPackages = updatedPackages.map(pkg => {
            if (pkg.id === details.packageId) {
              return { ...pkg, remainingSlots: Math.max(0, pkg.remainingSlots - 1) };
            }
            return pkg;
          });
        }

        // Add points based on pointsEarnRate
        const earnRate = get().pointsEarnRate || 10;
        const earnedPoints = Math.floor(total / earnRate);
        newPoints += earnedPoints;

        // Deduct redeemed points if applicable
        if (redeemedPoints) {
          newPoints = Math.max(0, newPoints - redeemedPoints);
        }

        // Update in Supabase
        const { error: updateError } = await supabase
          .from('store_customers')
          .update({
            points: newPoints,
          })
          .eq('customer_id', customerId)
          .eq('store_id', currentStoreId && currentStoreId !== 'default-store' ? currentStoreId : null);

        if (updateError) {
          console.error("Error updating customer points:", updateError);
        }

        // Update local state
        set(state => ({
          customers: state.customers.map(c => {
            if (c.id === customerId) {
              return {
                ...c,
                points: newPoints,
                creditBalance: newCreditBalance,
                packages: updatedPackages
              };
            }
            return c;
          }),
          selectedOwner: state.selectedOwner?.id === customerId ? {
            ...state.selectedOwner,
            points: newPoints,
            creditBalance: newCreditBalance,
            packages: updatedPackages
          } : state.selectedOwner
        }));
      }
    }

    // 3. Deduct inventory stock for products in the cart
    for (const item of items) {
      if (item.type === 'Product') {
        const invItem = get().inventory.find(i => i.id === item.id);
        if (invItem) {
          await get().adjustStock(item.id, item.quantity, 'Out', `Sale (Tx: ${data?.id || 'N/A'})`);
        }
      }
    }

    // 4. Add transaction to local state
    if (data) {
      const newTx: Transaction = {
        id: data.id,
        date: data.created_at.split('T')[0],
        amount: Number(data.amount || 0),
        discountAmount: Number(data.discount_amount || 0),
        customerId: data.customer_id || 'walk-in',
        customerName: data.customer_name,
        items: data.items,
        paymentMethod: data.payment_method,
        staffName: data.staff_name || 'Admin',
        species: [],
        bookingType: 'Walk-in'
      };

      set(state => ({
        transactions: [newTx, ...state.transactions]
      }));
    }
  },

  deleteTransaction: async (id) => {
    const { error } = await supabase
      .from('sales_transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting transaction:", error);
      throw error;
    }

    set(state => ({
      transactions: state.transactions.filter(t => t.id !== id)
    }));
  },
}));