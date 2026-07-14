import { format } from 'date-fns';
"use client";

import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AppState, QueueStatus, TierRule, MembershipLevel, Pet, Customer,
  QueueItem, Service, InventoryItem, Partner, StockLog, Transaction,
  Staff, ActivityLog, AddonItem, PackageTemplate, CreditPackageTemplate,
  PaymentMethod, ServicePriceInfo, SubService, BookingType, ServiceIcon, StaffRole, ReportHistory, Role
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
  vatInclusive: true,
  serviceChargeEnabled: false,
  serviceChargeRate: 10,
  liffId: '',
  liffChannelId: '',
  liffChannelSecret: '',
  liffEnabled: false,
  scannerType: (typeof window !== 'undefined' ? localStorage.getItem('scanner_type') as any : null) || 'hid',
  printerType: (typeof window !== 'undefined' ? localStorage.getItem('printer_type') as any : null) || 'none',
  maxUsers: 5,
  maxStaff: 10,
  pointsEarnRate: 10,
  pointsRedeemRate: 1,
  // Multi-branch & Organization
  organizationId: null,
  organizationName: '',
  branches: [],
  setStoreId: (id) => set({ storeId: id }),

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
  roles: [], // Initialize roles array
  goodsReceipts: [],
  purchaseOrders: [],
  purchaseRequests: [],
  quotations: [],
  salesOrders: [],
  accountCodes: [],
  journalEntries: [],
  taxRecords: [],
  billingDocuments: [],
  staffSettings: {
    attendance: {
      requireGps: false,
      lateBufferMinutes: 15,
      autoCheckoutTime: '18:00',
    },
    schedule: {
      allowShiftSwapping: false,
      minHoursBetweenShifts: 8,
      releaseNoticeDays: 7,
    },
    payroll: {
      payFrequency: 'monthly',
      payDayOfMonth: 25,
      overtimeRate: 1.5,
      socialSecurityRate: 5,
      deductionPresets: [],
    },
  },
  tierRules: [
    { level: 'Standard', label: 'Standard', minSpent: 0, discount: 0 },
    { level: 'Silver', label: 'Silver', minSpent: 5000, discount: 5 },
    { level: 'Gold', label: 'Gold', minSpent: 15000, discount: 10 },
    { level: 'VIP', label: 'VIP', minSpent: 30000, discount: 15 }
  ],
  cart: [],
  heldBills: [],
  disabledSlots: [],
  recurringHolidays: [],
  specificHolidays: [],

  rolePermissions: {
    'superadmin': ['/', '/pos', '/queue', '/customers', '/inventory', '/marketing', '/staff', '/staff/performance', '/logs', '/reports', '/settings', '/hotel'],
    'Admin': ['/', '/pos', '/queue', '/customers', '/inventory', '/marketing', '/staff', '/staff/performance', '/logs', '/reports', '/settings', '/hotel'],
    'Groomer': ['/', '/pos', '/queue', '/customers', '/inventory'],
    'Assistant': ['/', '/queue', '/customers']
  },

  ...createAuthSlice(set, get, {} as any),
  ...createCRMSlice(set, get, {} as any),

  setLanguage: (lang) => set({ language: lang }),

  addLog: (log) => set(s => ({
    logs: [{ ...log, id: Math.random().toString(36).substr(2, 9), timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX") } as ActivityLog, ...s.logs]
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
        reportHistory: [{ ...log, id: `REP-${Math.random().toString(36).substr(2, 5).toUpperCase()}`, timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX") }, ...s.reportHistory]
      }));
    }
  },

  updateBusinessProfile: async (profile, showToast = true) => {
    set(s => ({ ...s, ...profile }));
    if (typeof window !== 'undefined') {
      if (profile.companyName !== undefined) localStorage.setItem('company_name', profile.companyName);
      if (profile.companyAddress !== undefined) localStorage.setItem('company_address', profile.companyAddress);
      if (profile.companyTaxId !== undefined) localStorage.setItem('company_tax_id', profile.companyTaxId);
      if (profile.companyPhone !== undefined) localStorage.setItem('company_phone', profile.companyPhone);
      if (profile.companyEmail !== undefined) localStorage.setItem('company_email', profile.companyEmail);
      if (profile.vatEnabled !== undefined) localStorage.setItem('vat_enabled', String(profile.vatEnabled));
      if (profile.vatRate !== undefined) localStorage.setItem('vat_rate', String(profile.vatRate));
      if (profile.vatInclusive !== undefined) localStorage.setItem('vat_inclusive', String(profile.vatInclusive));
      if (profile.serviceChargeEnabled !== undefined) localStorage.setItem('service_charge_enabled', String(profile.serviceChargeEnabled));
      if (profile.serviceChargeRate !== undefined) localStorage.setItem('service_charge_rate', String(profile.serviceChargeRate));
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
            vat_inclusive: profile.vatInclusive !== undefined ? profile.vatInclusive : undefined,
            service_charge_enabled: profile.serviceChargeEnabled !== undefined ? profile.serviceChargeEnabled : undefined,
            service_charge_rate: profile.serviceChargeRate !== undefined ? profile.serviceChargeRate : undefined,
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
    if (showToast) toast.success("Business profile updated successfully!");
  },

  updateBookingSettings: async (settings, showToast = true) => {
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
            recurring_holidays: settings.recurringHolidays !== undefined ? settings.recurringHolidays : undefined,
            specific_holidays: settings.specificHolidays !== undefined ? settings.specificHolidays : undefined,
          })
          .eq('id', storeId);
        if (error) throw error;
      } catch (err) {
        console.error("Failed to update store booking settings in Supabase:", err);
      }
    }
    if (showToast) toast.success("Booking settings updated successfully!");
  },

  updateHardwareSettings: (settings) => {
    set(s => ({ ...s, ...settings }));
    if (typeof window !== 'undefined') {
      if (settings.scannerType !== undefined) localStorage.setItem('scanner_type', settings.scannerType);
      if (settings.printerType !== undefined) localStorage.setItem('printer_type', settings.printerType);
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
    const partners = get().partners;
    const partner = partners.find(p => p.id === item.partnerId);
    const resolvedRate = partner ? partner.gpRate : 0;

    const { data, error } = await supabase
      .from('products')
      .insert([{
        store_id: currentStoreId && currentStoreId !== 'default-store' ? currentStoreId : null,
        name: item.name,
        barcode: item.barcode,
        stock: item.stock || 0,
        min_stock: item.minStock || item.min_stock || 5,
        price: item.price || 0,
        cost_price: 0,
        unit: item.unit || 'ชิ้น',
        category: item.category || 'ทั่วไป',
        image_url: item.image || '',
        is_consignment: item.isConsignment || false,
        partner_id: item.partnerId || null,
        consignment_rate: item.consignmentRate || item.consignment_rate || resolvedRate || 0,
        reorder_quantity: item.reorderQuantity || 20,
        fifo_batches: []
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
        consignmentRate: Number(data.consignment_rate || 0),
        reorderQuantity: data.reorder_quantity || 20,
        fifoBatches: data.fifo_batches || []
      };
      set(s => ({ inventory: [...s.inventory, newItem] }));
    } else {
      console.error("Error adding product:", error);
    }
  },

  updateInventoryItem: async (id, item) => {
    const partners = get().partners;
    const partner = partners.find(p => p.id === item.partnerId);
    const resolvedRate = partner ? partner.gpRate : 0;

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
        consignment_rate: item.consignmentRate || item.consignment_rate || resolvedRate || 0,
        reorder_quantity: item.reorderQuantity || 20
      })
      .eq('id', id);

    if (!error) {
      set(s => ({
        inventory: s.inventory.map(itemObj => itemObj.id === id ? {
          ...itemObj,
          ...item,
          consignmentRate: item.consignmentRate || item.consignment_rate || resolvedRate || 0
        } : itemObj)
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

  adjustStock: async (id, qty, mode, reason, replenishmentCostPrice) => {
    const item = get().inventory.find(i => i.id === id);
    if (!item) return;
    const oldQty = item.stock;
    const currentStoreId = get().storeId;

    let newQty = oldQty;
    let currentBatches = [...(item.fifoBatches || [])];

    // Initialize batches for backward compatibility
    if (currentBatches.length === 0 && oldQty > 0) {
      currentBatches = [{
        id: 'initial-' + id + '-' + Date.now(),
        quantity: oldQty,
        costPrice: item.costPrice || 0,
        created_at: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX")
      }];
    }

    let logCostPrice = 0;

    if (mode === 'Add' || mode === 'In') {
      newQty = oldQty + qty;
      const cost = replenishmentCostPrice !== undefined ? replenishmentCostPrice : (item.costPrice || 0);
      currentBatches.push({
        id: 'batch-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        quantity: qty,
        costPrice: cost,
        created_at: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX")
      });
      logCostPrice = cost;
    } else if (mode === 'Out') {
      newQty = Math.max(0, oldQty - qty);
      let toConsume = qty;
      let totalConsumedCost = 0;
      let actualConsumedQty = 0;
      while (toConsume > 0 && currentBatches.length > 0) {
        const batch = currentBatches[0];
        const consumed = Math.min(batch.quantity, toConsume);
        totalConsumedCost += consumed * batch.costPrice;
        actualConsumedQty += consumed;
        toConsume -= consumed;
        if (batch.quantity <= consumed) {
          currentBatches.shift();
        } else {
          batch.quantity -= consumed;
        }
      }
      logCostPrice = actualConsumedQty > 0 ? (totalConsumedCost / actualConsumedQty) : (item.costPrice || 0);
    } else if (mode === 'Set') {
      newQty = qty;
      if (qty < oldQty) {
        let toConsume = oldQty - qty;
        let totalConsumedCost = 0;
        let actualConsumedQty = 0;
        while (toConsume > 0 && currentBatches.length > 0) {
          const batch = currentBatches[0];
          const consumed = Math.min(batch.quantity, toConsume);
          totalConsumedCost += consumed * batch.costPrice;
          actualConsumedQty += consumed;
          toConsume -= consumed;
          if (batch.quantity <= consumed) {
            currentBatches.shift();
          } else {
            batch.quantity -= consumed;
          }
        }
        logCostPrice = actualConsumedQty > 0 ? (totalConsumedCost / actualConsumedQty) : (item.costPrice || 0);
      } else if (qty > oldQty) {
        const diff = qty - oldQty;
        const cost = replenishmentCostPrice !== undefined ? replenishmentCostPrice : (item.costPrice || 0);
        currentBatches.push({
          id: 'batch-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
          quantity: diff,
          costPrice: cost,
          created_at: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX")
        });
        logCostPrice = cost;
      }
    }

    // Calculate dynamic average cost price from remaining batches
    let newAverageCost = item.costPrice;
    const totalRemainingQty = currentBatches.reduce((acc, b) => acc + b.quantity, 0);
    if (totalRemainingQty > 0) {
      const totalRemainingCost = currentBatches.reduce((acc, b) => acc + (b.quantity * b.costPrice), 0);
      newAverageCost = totalRemainingCost / totalRemainingQty;
    }

    const { error: updateError } = await supabase
      .from('products')
      .update({
        stock: newQty,
        cost_price: newAverageCost,
        fifo_batches: currentBatches
      })
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
        staff_name: staffName,
        cost_price: logCostPrice
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
        timestamp: logData.created_at,
        costPrice: Number(logData.cost_price || 0)
      };
      set(s => ({
        stockLogs: [newLog, ...s.stockLogs],
        inventory: s.inventory.map(i => i.id === id ? {
          ...i,
          stock: newQty,
          costPrice: newAverageCost,
          fifoBatches: currentBatches
        } : i)
      }));
    } else {
      console.error("Error adding stock log to Supabase:", logError);
      set(s => ({
        inventory: s.inventory.map(i => i.id === id ? {
          ...i,
          stock: newQty,
          costPrice: newAverageCost,
          fifoBatches: currentBatches
        } : i)
      }));
    }
  },

  addPurchaseOrder: async (po) => {
    const currentStoreId = get().storeId;
    const newId = `PO${Date.now().toString().slice(-6)}`;
    const fullPo = { ...po, id: newId };

    // Optimistic update
    set(s => ({
      purchaseOrders: [fullPo, ...s.purchaseOrders]
    }));

    const { error } = await supabase
      .from('purchase_orders')
      .insert([{
        id: newId,
        store_id: currentStoreId && currentStoreId !== 'default-store' ? currentStoreId : null,
        date: fullPo.date,
        partner_id: fullPo.partnerId,
        items: fullPo.items,
        status: fullPo.status,
        total_amount: fullPo.totalAmount,
        created_by: fullPo.createdBy
      }]);

    if (error) {
      console.error("Error adding PO to Supabase:", error);
      toast.error("เกิดข้อผิดพลาดในการบันทึก PO ลงฐานข้อมูล");
      // Rollback
      set(s => ({
        purchaseOrders: s.purchaseOrders.filter(p => p.id !== newId)
      }));
    } else {
      if (fullPo.status === 'On Order') {
        const currentUser = get().currentUser;
        await get().addGoodsReceipt({
          date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX"),
          poId: fullPo.id,
          partnerId: fullPo.partnerId,
          items: fullPo.items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantityExpected: item.quantity,
            quantityReceived: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
            remarks: ''
          })),
          status: 'Pending',
          totalAmount: fullPo.totalAmount,
          receiverName: currentUser?.name || 'System'
        });
      }
      toast.success("สร้างใบสั่งซื้อเรียบร้อยแล้ว");
    }
  },

  updatePurchaseOrder: async (id, updates) => {
    const previousOrders = get().purchaseOrders;

    // Optimistic update
    set(s => ({
      purchaseOrders: s.purchaseOrders.map(po =>
        po.id === id ? { ...po, ...updates } : po
      )
    }));

    const updatePayload: any = {};
    if (updates.date !== undefined) updatePayload.date = updates.date;
    if (updates.partnerId !== undefined) updatePayload.partner_id = updates.partnerId;
    if (updates.items !== undefined) updatePayload.items = updates.items;
    if (updates.status !== undefined) updatePayload.status = updates.status;
    if (updates.totalAmount !== undefined) updatePayload.total_amount = updates.totalAmount;
    if (updates.createdBy !== undefined) updatePayload.created_by = updates.createdBy;

    const { error } = await supabase
      .from('purchase_orders')
      .update(updatePayload)
      .eq('id', id);

    if (error) {
      console.error("Error updating PO in Supabase:", error);
      toast.error("เกิดข้อผิดพลาดในการแก้ไข PO");
      // Rollback
      set({ purchaseOrders: previousOrders });
    } else {
      const updatedPo = get().purchaseOrders.find(p => p.id === id);
      if (updates.status === 'On Order' && updatedPo) {
        const existingGr = get().goodsReceipts.find(gr => gr.poId === id);
        if (!existingGr) {
          const currentUser = get().currentUser;
          await get().addGoodsReceipt({
            date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX"),
            poId: updatedPo.id,
            partnerId: updatedPo.partnerId,
            items: updatedPo.items.map(item => ({
              productId: item.productId,
              productName: item.productName,
              quantityExpected: item.quantity,
              quantityReceived: item.quantity,
              unitPrice: item.unitPrice,
              total: item.quantity * item.unitPrice,
              remarks: ''
            })),
            status: 'Pending',
            totalAmount: updatedPo.totalAmount,
            receiverName: currentUser?.name || 'System'
          });
        }
      }
      toast.success("อัปเดตใบสั่งซื้อเรียบร้อยแล้ว");
    }
  },

  updatePurchaseOrderStatus: async (id, status) => {
    // Optimistic update
    const previousOrders = get().purchaseOrders;
    const po = previousOrders.find(p => p.id === id);
    set(s => ({
      purchaseOrders: s.purchaseOrders.map(p => p.id === id ? { ...p, status } : p)
    }));

    const { error } = await supabase
      .from('purchase_orders')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error("Error updating PO status in Supabase:", error);
      toast.error("เกิดข้อผิดพลาดในการอัปเดตสถานะ PO");
      // Rollback
      set({ purchaseOrders: previousOrders });
    } else {
      if (status === 'Completed' && po && po.status !== 'Completed') {
        const existingGr = get().goodsReceipts.find(gr => gr.poId === po.id);
        if (!existingGr) {
          const currentUser = get().currentUser;
          await get().addGoodsReceipt({
            date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX"),
            poId: po.id,
            partnerId: po.partnerId,
            items: po.items.map(item => ({
              productId: item.productId,
              productName: item.productName,
              quantityExpected: item.quantity,
              quantityReceived: item.quantity,
              unitPrice: item.unitPrice,
              total: item.quantity * item.unitPrice,
              remarks: ''
            })),
            status: 'On Order',
            totalAmount: po.totalAmount,
            receiverName: currentUser?.name || 'System'
          });
        }
        toast.success("สั่งซื้อเรียบร้อยแล้วและสร้างใบรับสินค้า (Goods Receipt) อัตโนมัติ");
      }

      toast.success("อัปเดตสถานะ PO เรียบร้อยแล้ว");
    }
  },

  addGoodsReceipt: async (gr) => {
    const currentStoreId = get().storeId;
    const newId = `GR${Date.now().toString().slice(-6)}`;
    const fullGr = { ...gr, id: newId };

    set(s => ({
      goodsReceipts: [fullGr, ...s.goodsReceipts]
    }));

    const { error } = await supabase
      .from('goods_receipts')
      .insert({
        store_id: currentStoreId,
        data: fullGr
      });

    if (error) {
      console.error("Error inserting GR to Supabase:", error);
      toast.error("เกิดข้อผิดพลาดในการบันทึก GR ไปยังฐานข้อมูล");
      set(s => ({
        goodsReceipts: s.goodsReceipts.filter(g => g.id !== newId)
      }));
    }
  },

  updateGoodsReceipt: async (id, updates) => {
    const previousReceipts = get().goodsReceipts;
    const currentStoreId = get().storeId;
    set(s => ({
      goodsReceipts: s.goodsReceipts.map(gr =>
        gr.id === id ? { ...gr, ...updates } : gr
      )
    }));

    const updatedGr = get().goodsReceipts.find(gr => gr.id === id);
    if (!updatedGr) return;

    const { error } = await supabase
      .from('goods_receipts')
      .update({ data: updatedGr })
      .eq('store_id', currentStoreId)
      .eq("data->>id", id);

    if (error) {
      console.error("Error updating GR in Supabase:", error);
      toast.error("เกิดข้อผิดพลาดในการอัปเดต GR");
      set({ goodsReceipts: previousReceipts });
    }
  },

  updateGoodsReceiptStatus: async (id, status) => {
    const previousReceipts = get().goodsReceipts;
    const currentStoreId = get().storeId;
    const gr = previousReceipts.find(g => g.id === id);

    set(s => ({
      goodsReceipts: s.goodsReceipts.map(g => g.id === id ? { ...g, status } : g)
    }));

    const { error } = await supabase
      .from('goods_receipts')
      .update({ data: get().goodsReceipts.find(g => g.id === id) })
      .eq('store_id', currentStoreId)
      .eq("data->>id", id);

    if (error) {
      console.error("Error updating GR status in Supabase:", error);
      toast.error("เกิดข้อผิดพลาดในการอัปเดตสถานะ GR");
      set({ goodsReceipts: previousReceipts });
    } else {
      if (status === 'Completed' && gr && gr.status !== 'Completed') {
        for (const item of gr.items) {
          await get().adjustStock(item.productId, item.quantityReceived, 'Add', `Received from GR #${id}`, item.unitPrice);
        }
        toast.success("รับสินค้าเข้าสต็อกและอัปเดตสินค้าเรียบร้อยแล้ว");
      }
    }
  },

  addPurchaseRequest: async (pr) => {
    const currentStoreId = get().storeId;
    const newId = `PR${Date.now().toString().slice(-6)}`;
    const fullPr = { ...pr, id: newId };

    // Optimistic update
    set(s => ({
      purchaseRequests: [fullPr, ...s.purchaseRequests]
    }));

    const { error } = await supabase
      .from('purchase_requests')
      .insert([{
        id: newId,
        store_id: currentStoreId && currentStoreId !== 'default-store' ? currentStoreId : null,
        date: fullPr.date,
        partner_id: fullPr.partnerId,
        items: fullPr.items,
        status: fullPr.status,
        total_amount: fullPr.totalAmount,
        created_by: fullPr.createdBy
      }]);

    if (error) {
      console.error("Error adding PR to Supabase:", error);
      toast.error("เกิดข้อผิดพลาดในการบันทึก PR ลงฐานข้อมูล");
      // Rollback
      set(s => ({
        purchaseRequests: s.purchaseRequests.filter(p => p.id !== newId)
      }));
    } else {
      toast.success("สร้างใบขอสั่งซื้อ (PR) เรียบร้อยแล้ว");
    }
  },

  updatePurchaseRequest: async (id, updates) => {
    const previousRequests = get().purchaseRequests;

    // Optimistic update
    set(s => ({
      purchaseRequests: s.purchaseRequests.map(pr =>
        pr.id === id ? { ...pr, ...updates } : pr
      )
    }));

    const updatePayload: any = {};
    if (updates.date !== undefined) updatePayload.date = updates.date;
    if (updates.partnerId !== undefined) updatePayload.partner_id = updates.partnerId;
    if (updates.items !== undefined) updatePayload.items = updates.items;
    if (updates.status !== undefined) updatePayload.status = updates.status;
    if (updates.totalAmount !== undefined) updatePayload.total_amount = updates.totalAmount;
    if (updates.createdBy !== undefined) updatePayload.created_by = updates.createdBy;

    const { error } = await supabase
      .from('purchase_requests')
      .update(updatePayload)
      .eq('id', id);

    if (error) {
      console.error("Error updating PR in Supabase:", error);
      toast.error("เกิดข้อผิดพลาดในการแก้ไข PR");
      // Rollback
      set({ purchaseRequests: previousRequests });
    } else {
      toast.success("อัปเดตใบขอสั่งซื้อเรียบร้อยแล้ว");
    }
  },

  updatePurchaseRequestStatus: async (id, status) => {
    const previousRequests = get().purchaseRequests;

    // Optimistic update
    set(s => ({
      purchaseRequests: s.purchaseRequests.map(pr => pr.id === id ? { ...pr, status } : pr)
    }));

    const { error } = await supabase
      .from('purchase_requests')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error("Error updating PR status in Supabase:", error);
      toast.error("เกิดข้อผิดพลาดในการอัปเดตสถานะ PR");
      // Rollback
      set({ purchaseRequests: previousRequests });
    }
  },

  approvePurchaseRequestToPO: (id) => {
    const state = get();
    const pr = state.purchaseRequests.find(p => p.id === id);
    if (!pr) return;

    // 1. Update PR Status
    state.updatePurchaseRequestStatus(id, 'Approved');

    // 2. Create New PO
    const newPoItems = pr.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total
    }));

    state.addPurchaseOrder({
      date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX"),
      partnerId: pr.partnerId,
      items: newPoItems,
      status: 'Pending',
      totalAmount: pr.totalAmount,
      createdBy: state.currentUser?.name || 'Admin'
    });
  },

  addQuotation: async (qt) => {
    const currentStoreId = get().storeId;
    const newId = `QT${Date.now().toString().slice(-6)}`;
    const fullQt = { ...qt, id: newId };

    // Optimistic update
    set(s => ({
      quotations: [fullQt, ...s.quotations]
    }));

    const { error } = await supabase
      .from('quotations')
      .insert([{
        id: newId,
        store_id: currentStoreId && currentStoreId !== 'default-store' ? currentStoreId : null,
        date: fullQt.date,
        partner_id: fullQt.partnerId || null,
        customer_name: fullQt.customerName || null,
        customer_address: fullQt.customerAddress || null,
        customer_tax_id: fullQt.customerTaxId || null,
        customer_phone: fullQt.customerPhone || null,
        items: fullQt.items,
        status: fullQt.status,
        total_amount: fullQt.totalAmount,
        created_by: fullQt.createdBy
      }]);

    if (error) {
      console.error("Error adding Quotation to Supabase:", error);
      toast.error("เกิดข้อผิดพลาดในการบันทึกใบเสนอราคาลงฐานข้อมูล");
      // Rollback
      set(s => ({
        quotations: s.quotations.filter(q => q.id !== newId)
      }));
    } else {
      toast.success("สร้างใบเสนอราคาเรียบร้อยแล้ว");
    }
  },

  updateQuotation: async (id, updates) => {
    // Optimistic update
    set(s => ({
      quotations: s.quotations.map(qt =>
        qt.id === id ? { ...qt, ...updates } : qt
      )
    }));

    const updatePayload: any = {};
    if (updates.date !== undefined) updatePayload.date = updates.date;
    if (updates.partnerId !== undefined) updatePayload.partner_id = updates.partnerId;
    if (updates.customerName !== undefined) updatePayload.customer_name = updates.customerName;
    if (updates.customerAddress !== undefined) updatePayload.customer_address = updates.customerAddress;
    if (updates.customerTaxId !== undefined) updatePayload.customer_tax_id = updates.customerTaxId;
    if (updates.customerPhone !== undefined) updatePayload.customer_phone = updates.customerPhone;
    if (updates.items !== undefined) updatePayload.items = updates.items;
    if (updates.status !== undefined) updatePayload.status = updates.status;
    if (updates.totalAmount !== undefined) updatePayload.total_amount = updates.totalAmount;

    const { error } = await supabase
      .from('quotations')
      .update(updatePayload)
      .eq('id', id);

    if (error) {
      console.error("Error updating Quotation in Supabase:", error);
      toast.error("เกิดข้อผิดพลาดในการอัปเดตใบเสนอราคา");
      // Note: Full rollback requires keeping old state, keeping it simple for now
    } else {
      toast.success("อัปเดตใบเสนอราคาเรียบร้อยแล้ว");
    }
  },

  updateQuotationStatus: async (id, status) => {
    set(s => ({
      quotations: s.quotations.map(qt => qt.id === id ? { ...qt, status } : qt)
    }));

    const { error } = await supabase
      .from('quotations')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error("Error updating Quotation status in Supabase:", error);
      toast.error("เกิดข้อผิดพลาดในการอัปเดตสถานะใบเสนอราคา");
    }
  },

  addSalesOrder: (so) => {
    const newId = `SO${Date.now().toString().slice(-6)}`;
    const fullSo = { ...so, id: newId };
    set(s => ({
      salesOrders: [fullSo, ...s.salesOrders]
    }));
    toast.success("สร้างใบสั่งขายเรียบร้อยแล้ว");
  },

  updateSalesOrder: (id, updates) => {
    set(s => ({
      salesOrders: s.salesOrders.map(so =>
        so.id === id ? { ...so, ...updates } : so
      )
    }));
    toast.success("อัปเดตใบสั่งขายเรียบร้อยแล้ว");
  },

  updateSalesOrderStatus: (id, status) => {
    set(s => ({
      salesOrders: s.salesOrders.map(so => so.id === id ? { ...so, status } : so)
    }));
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
      return newPartner;
    } else {
      console.error("Error adding partner:", error);
      return null;
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
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
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
      baseSalary: st.baseSalary,
      avatar: st.avatar,
      email: st.username
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
      username: st.username || 'Pending Google Link',
      commissionRate: st.commissionRate,
      baseSalary: st.baseSalary,
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
        commission_rate: st.commissionRate,
        base_salary: st.baseSalary
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

  // Role Management Actions
  addRole: async (roleData) => {
    const currentStoreId = get().storeId;
    const { data, error } = await supabase
      .from('roles')
      .insert([{
        store_id: currentStoreId && currentStoreId !== 'default-store' ? currentStoreId : null,
        name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissions
      }])
      .select()
      .single();

    if (error) {
      console.error("Error adding role:", error);
      throw error;
    }
    if (data) {
      set(s => ({ roles: [...s.roles, data] }));
    }
  },

  updateRole: async (id, roleData) => {
    const { error } = await supabase
      .from('roles')
      .update(roleData)
      .eq('id', id);

    if (error) {
      console.error("Error updating role:", error);
      throw error;
    }
    set(s => ({
      roles: s.roles.map(r => r.id === id ? { ...r, ...roleData } : r)
    }));
  },

  deleteRole: async (id) => {
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting role:", error);
      throw error;
    }
    set(s => ({ roles: s.roles.filter(r => r.id !== id) }));
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
      purchaseDate: format(new Date(), 'yyyy-MM-dd')
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
              date: format(new Date(), 'yyyy-MM-dd'),
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
  setHeldBills: (bills) => set({ heldBills: bills }),
  holdBill: async (customerId, customerName, items) => {
    const currentStoreId = get().storeId;
    const newBill = {
      id: Math.random().toString(36).substring(2, 9),
      customerId,
      customerName,
      items,
      timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX")
    };
    
    set(state => ({
      heldBills: [...state.heldBills, newBill],
      cart: [],
      selectedOwner: null
    }));

    if (currentStoreId && currentStoreId !== 'default-store') {
      const { error } = await supabase
        .from('held_bills')
        .insert([{
          id: newBill.id,
          store_id: currentStoreId,
          customer_id: customerId,
          customer_name: customerName,
          items: items,
          timestamp: newBill.timestamp
        }]);
      if (error) {
        console.error("Error saving held bill to Supabase:", error);
      }
    }
  },
  removeHeldBill: async (id) => {
    const currentStoreId = get().storeId;
    
    set(state => ({
      heldBills: state.heldBills.filter(bill => bill.id !== id)
    }));

    if (currentStoreId && currentStoreId !== 'default-store') {
      const { error } = await supabase
        .from('held_bills')
        .delete()
        .eq('id', id)
        .eq('store_id', currentStoreId);
      
      if (error) {
        console.error("Error removing held bill from Supabase:", error);
      }
    }
  },

  processPayment: async (customerId, total, discount, items, method, details, isTaxInvoice, redeemedPoints, subtotal, vatAmount, vatRate) => {
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
        details: {
          ...details,
          vatInclusive: get().vatInclusive
        },
        is_tax_invoice: isTaxInvoice,
        subtotal: subtotal !== undefined ? subtotal : total,
        vat_amount: vatAmount !== undefined ? vatAmount : 0,
        vat_rate: vatRate !== undefined ? vatRate : 0
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
        createdAt: data.created_at,
        amount: Number(data.amount || 0),
        discountAmount: Number(data.discount_amount || 0),
        subtotal: Number(data.subtotal || 0),
        vatAmount: Number(data.vat_amount || 0),
        vatRate: Number(data.vat_rate || 0),
        isTaxInvoice: data.is_tax_invoice || false,
        details: data.details || {},
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

      // 5. Create a short receipt in the billing system
      const shortReceiptItems = items.map((item: any) => ({
        productId: item.id || '',
        productName: item.title || item.name || 'Unknown',
        quantity: item.quantity || 1,
        unitPrice: item.price || 0,
        total: (item.quantity || 1) * (item.price || 0),
        itemType: item.type?.toLowerCase() as any
      }));
      
      const newDocNo = `ABB-${format(new Date(), 'yyyy-MM-dd').replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

      get().addBillingDocument({
        documentNo: newDocNo,
        type: 'short_receipt',
        date: data.created_at.split('T')[0],
        customerId: data.customer_id && data.customer_id !== 'walk-in' ? data.customer_id : undefined,
        customerName: data.customer_name || 'Walk-in Customer',
        items: shortReceiptItems,
        subtotal: Number(data.subtotal || total),
        vatAmount: Number(data.vat_amount || 0),
        totalAmount: Number(data.amount || total),
        paymentMethod: data.payment_method,
        status: 'Paid',
        createdBy: data.staff_name || 'Admin',
        remarks: `Auto-generated from POS`
      });
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

  updateStaffSettings: async (settings) => {
    const currentSettings = get().staffSettings;
    const newSettings = {
      attendance: { ...currentSettings.attendance, ...settings.attendance },
      schedule: { ...currentSettings.schedule, ...settings.schedule },
      payroll: { ...currentSettings.payroll, ...settings.payroll },
    };

    set({ staffSettings: newSettings });

    const storeId = get().storeId;
    if (storeId && storeId !== 'default-store') {
      try {
        const { error } = await supabase
          .from('stores')
          .update({
            staff_settings: newSettings
          })
          .eq('id', storeId);
        if (error) throw error;
      } catch (err) {
        console.error("Failed to update staff settings in Supabase:", err);
        throw err;
      }
    }
  },

  // Accounting System Implementations
  setAccountCodes: (codes) => set({ accountCodes: codes }),
  
  addAccountCode: async (code) => {
    const storeId = get().storeId;
    if (!storeId || storeId === 'default-store') return;
    try {
      const { data, error } = await supabase.from('account_codes').insert({
        store_id: storeId,
        code: code.code,
        name: code.name,
        category: code.category,
        description: code.description,
        is_active: code.isActive
      }).select().single();
      if (error) throw error;
      if (data) {
        set(s => ({ accountCodes: [...s.accountCodes, { ...code, id: data.id }] }));
      }
    } catch (err) {
      console.error("Failed to add account code:", err);
    }
  },
  
  updateAccountCode: async (id, code) => {
    const storeId = get().storeId;
    if (!storeId || storeId === 'default-store') return;
    set(s => ({ accountCodes: s.accountCodes.map(c => c.id === id ? { ...c, ...code } : c) }));
    try {
      const { error } = await supabase.from('account_codes').update({
        code: code.code,
        name: code.name,
        category: code.category,
        description: code.description,
        is_active: code.isActive
      }).eq('id', id).eq('store_id', storeId);
      if (error) throw error;
    } catch (err) {
      console.error("Failed to update account code:", err);
    }
  },

  deleteAccountCode: async (id) => {
    const storeId = get().storeId;
    if (!storeId || storeId === 'default-store') {
      set(s => ({ accountCodes: s.accountCodes.filter(c => c.id !== id) }));
      return;
    }
    set(s => ({ accountCodes: s.accountCodes.filter(c => c.id !== id) }));
    try {
      const { error } = await supabase.from('account_codes').delete().eq('id', id).eq('store_id', storeId);
      if (error) throw error;
    } catch (err) {
      console.error("Failed to delete account code:", err);
    }
  },

  setJournalEntries: (entries) => set({ journalEntries: entries }),
  
  addJournalEntry: async (entry) => {
    const storeId = get().storeId;
    if (!storeId || storeId === 'default-store') return;
    const newId = `JV${Date.now().toString().slice(-6)}`;
    try {
      const { data, error } = await supabase.from('journal_entries').insert({
        id: newId,
        store_id: storeId,
        date: entry.date,
        journal_type: entry.journalType,
        reference_no: entry.referenceNo,
        description: entry.description,
        lines: entry.lines,
        status: entry.status,
        total_debit: entry.totalDebit,
        total_credit: entry.totalCredit,
        created_by: entry.createdBy,
        is_opening_balance: entry.isOpeningBalance,
        is_closing_entry: entry.isClosingEntry
      }).select().single();
      if (error) throw error;
      if (data) {
        set(s => ({ journalEntries: [{ ...entry, id: data.id }, ...s.journalEntries] }));
      }
    } catch (err) {
      console.error("Failed to add journal entry:", err);
    }
  },
  
  updateJournalEntryStatus: async (id, status) => {
    const storeId = get().storeId;
    if (!storeId || storeId === 'default-store') return;
    set(s => ({ journalEntries: s.journalEntries.map(e => e.id === id ? { ...e, status } : e) }));
    try {
      const { error } = await supabase.from('journal_entries').update({ status }).eq('id', id).eq('store_id', storeId);
      if (error) throw error;
    } catch (err) {
      console.error("Failed to update journal entry status:", err);
    }
  },

  setTaxRecords: (records) => set({ taxRecords: records }),
  
  addTaxRecord: async (record) => {
    const storeId = get().storeId;
    if (!storeId || storeId === 'default-store') return;
    const newId = `TAX${Date.now().toString().slice(-6)}`;
    try {
      const { data, error } = await supabase.from('tax_records').insert({
        id: newId,
        store_id: storeId,
        date: record.date,
        type: record.type,
        reference_no: record.referenceNo,
        partner_name: record.partnerName,
        tax_id: record.taxId,
        base_amount: record.baseAmount,
        tax_rate: record.taxRate,
        tax_amount: record.taxAmount,
        journal_entry_id: record.journalEntryId,
        status: record.status
      }).select().single();
      if (error) throw error;
      if (data) {
        set(s => ({ taxRecords: [{ ...record, id: data.id }, ...s.taxRecords] }));
      }
    } catch (err) {
      console.error("Failed to add tax record:", err);
    }
  },
  
  updateTaxRecordStatus: async (id, status) => {
    const storeId = get().storeId;
    if (!storeId || storeId === 'default-store') return;
    set(s => ({ taxRecords: s.taxRecords.map(t => t.id === id ? { ...t, status } : t) }));
    try {
      const { error } = await supabase.from('tax_records').update({ status }).eq('id', id).eq('store_id', storeId);
      if (error) throw error;
    } catch (err) {
      console.error("Failed to update tax record status:", err);
    }
  },

  addBillingDocument: async (doc) => {
    const storeId = get().storeId;
    const newId = doc.type.toUpperCase().substring(0,3) + Date.now().toString().slice(-6);
    const newDoc = { ...doc, id: newId };
    set(s => ({ billingDocuments: [newDoc, ...s.billingDocuments] }));
    if (!storeId || storeId === 'default-store') return;
    try {
      const { error } = await supabase.from('billing_documents').insert({
        id: newId,
        store_id: storeId,
        document_no: doc.documentNo,
        type: doc.type,
        date: doc.date,
        partner_id: doc.partnerId || null,
        customer_id: doc.customerId || null,
        customer_name: doc.customerName || null,
        customer_address: doc.customerAddress || null,
        customer_tax_id: doc.customerTaxId || null,
        items: doc.items,
        subtotal: doc.subtotal,
        vat_amount: doc.vatAmount,
        total_amount: doc.totalAmount,
        payment_method: doc.paymentMethod || null,
        status: doc.status,
        created_by: doc.createdBy,
        reference_document_no: doc.referenceDocumentNo || null,
        remarks: doc.remarks || null
      });
      if (error) throw error;
    } catch (err) {
      console.error("Failed to add billing document:", err);
    }
  },

  updateBillingDocument: async (id, updates) => {
    const storeId = get().storeId;
    set(s => ({ billingDocuments: s.billingDocuments.map(d => d.id === id ? { ...d, ...updates } : d) }));
    if (!storeId || storeId === 'default-store') return;
    try {
      const payload: any = {};
      if (updates.documentNo !== undefined) payload.document_no = updates.documentNo;
      if (updates.type !== undefined) payload.type = updates.type;
      if (updates.date !== undefined) payload.date = updates.date;
      if (updates.partnerId !== undefined) payload.partner_id = updates.partnerId;
      if (updates.customerId !== undefined) payload.customer_id = updates.customerId;
      if (updates.customerName !== undefined) payload.customer_name = updates.customerName;
      if (updates.customerAddress !== undefined) payload.customer_address = updates.customerAddress;
      if (updates.customerTaxId !== undefined) payload.customer_tax_id = updates.customerTaxId;
      if (updates.items !== undefined) payload.items = updates.items;
      if (updates.subtotal !== undefined) payload.subtotal = updates.subtotal;
      if (updates.vatAmount !== undefined) payload.vat_amount = updates.vatAmount;
      if (updates.totalAmount !== undefined) payload.total_amount = updates.totalAmount;
      if (updates.paymentMethod !== undefined) payload.payment_method = updates.paymentMethod;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.referenceDocumentNo !== undefined) payload.reference_document_no = updates.referenceDocumentNo;
      if (updates.remarks !== undefined) payload.remarks = updates.remarks;

      const { error } = await supabase.from('billing_documents').update(payload).eq('id', id).eq('store_id', storeId);
      if (error) throw error;
    } catch (err) {
      console.error("Failed to update billing document:", err);
    }
  },

  updateBillingDocumentStatus: async (id, status) => {
    const storeId = get().storeId;
    set(s => ({ billingDocuments: s.billingDocuments.map(d => d.id === id ? { ...d, status } : d) }));
    if (!storeId || storeId === 'default-store') return;
    try {
      const { error } = await supabase.from('billing_documents').update({ status }).eq('id', id).eq('store_id', storeId);
      if (error) throw error;
    } catch (err) {
      console.error("Failed to update billing document status:", err);
    }
  },

  deleteBillingDocument: async (id) => {
    const storeId = get().storeId;
    set(s => ({ billingDocuments: s.billingDocuments.filter(d => d.id !== id) }));
    if (!storeId || storeId === 'default-store') return;
    try {
      const { error } = await supabase.from('billing_documents').delete().eq('id', id).eq('store_id', storeId);
      if (error) throw error;
    } catch (err) {
      console.error("Failed to delete billing document:", err);
    }
  }

}));