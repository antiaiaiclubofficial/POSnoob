"use client";

import { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useStore, StaffRole, QueueStatus, ServiceIcon, BookingType, MembershipLevel, PaymentMethod } from "@/store/useStore"; // Import PaymentMethod
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Index from "@/pages/Index";
import Queue from "@/pages/Queue";
import Services from "@/pages/Services";
import Customers from "@/pages/Customers";
import Inventory from "@/pages/Inventory";
import Marketing from "@/pages/Marketing";
import Staff from "@/pages/Staff";
import StaffPerformance from "@/pages/StaffPerformance";
import Logs from "@/pages/Logs";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import SuperAdmin from "@/pages/SuperAdmin";
import LiffRegister from "@/pages/LiffRegister";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// คอมโพเนนต์สำหรับจัดการหน้าแรกตามบทบาทของผู้ใช้
const HomeRedirect = () => {
  const { currentUser } = useStore();
  if (currentUser?.role === 'superadmin') {
    return <Navigate to="/superadmin" replace />;
  }
  return <Dashboard />;
};

const AuthInitializer = () => {
  const { 
    language, isAuthenticated, setSession, setCustomers, setServices, storeId, currentUser, logout 
  } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    // Auth Session Handling
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session?.user ?? null, navigate);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session?.user ?? null, navigate);
    });

    return () => subscription.unsubscribe();
  }, [setSession, navigate]);

  // Highly reliable Session Heartbeat to check if session is still valid and update last_active_at
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.id || !storeId || storeId === 'default-store' || currentUser?.role === 'superadmin') return;

    const checkAndHeartbeat = async () => {
      try {
        // 1. Check if our session still exists in active_sessions
        const { data, error } = await supabase
          .from('active_sessions')
          .select('id')
          .eq('user_id', currentUser.id)
          .maybeSingle();

        if (error) {
          console.error("Error checking active session:", error);
          return;
        }

        if (!data) {
          // Session was deleted by Admin! Force logout immediately
          toast.error(language === 'th' ? "เซสชันของคุณถูกปิดโดยผู้ดูแลระบบ" : "Your session was terminated by an administrator.");
          logout();
        } else {
          // Session is valid, update last_active_at to keep it alive
          await supabase
            .from('active_sessions')
            .update({ last_active_at: new Date().toISOString() })
            .eq('user_id', currentUser.id);
        }
      } catch (err) {
        console.error("Heartbeat error:", err);
      }
    };

    // Run immediately on mount/auth change
    checkAndHeartbeat();

    // Run every 5 seconds
    const interval = setInterval(checkAndHeartbeat, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [isAuthenticated, currentUser?.id, storeId, logout, language]);

  // Real-time Staff (Profiles) Sync Logic
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchStaffData = async () => {
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
            status: (s.status === 'Pending' ? 'Inactive' : (s.status || 'Active')) as 'Active' | 'Inactive',
            avatar: s.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
            username: s.email,
            commissionRate: Number(s.commission_rate || 0),
            baseSalary: Number(s.base_salary || 15000),
            googleConnected: !!s.google_connected || !!s.google_email,
            googleEmail: s.google_email || '',
            isPendingInvite: s.status === 'Pending',
            inviteLink: s.status === 'Pending' ? `${window.location.origin}/login?invite=true&inviteId=${s.id}` : undefined
          }));

          pendingInvites = pendingInvites.filter((invite: any) => {
            const accepted = formattedStaff.some(s => s.username.toLowerCase() === invite.username.toLowerCase());
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

    fetchStaffData();

    const channel = supabase
      .channel('realtime-profiles')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          console.log('Realtime profile update detected, re-fetching staff...');
          fetchStaffData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, storeId]);

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
              receiptPaperSize: storeData.receipt_paper_size || '80mm',
              vatEnabled: storeData.vat_enabled || false,
              vatInclusive: storeData.vat_inclusive !== undefined ? storeData.vat_inclusive : true,
              companyName: storeData.company_name || '',
              companyAddress: storeData.company_address || '',
              companyTaxId: storeData.company_tax_id || '',
              companyPhone: storeData.company_phone || '',
              companyEmail: storeData.company_email || '',
              vatRate: storeData.vat_rate || 7,
              pointsEarnRate: storeData.points_earn_rate || 10,
              pointsRedeemRate: storeData.points_redeem_rate || 1,
              maxUsers: storeData.max_users || 5,
              maxStaff: storeData.max_staff || 10,
              staffSettings: storeData.staff_settings ? {
                attendance: {
                  requireGps: storeData.staff_settings.attendance?.requireGps ?? false,
                  lateBufferMinutes: Number(storeData.staff_settings.attendance?.lateBufferMinutes ?? 15),
                  autoCheckoutTime: storeData.staff_settings.attendance?.autoCheckoutTime ?? '18:00',
                },
                schedule: {
                  allowShiftSwapping: storeData.staff_settings.schedule?.allowShiftSwapping ?? false,
                  minHoursBetweenShifts: Number(storeData.staff_settings.schedule?.minHoursBetweenShifts ?? 8),
                  releaseNoticeDays: Number(storeData.staff_settings.schedule?.releaseNoticeDays ?? 7),
                },
                payroll: {
                  payFrequency: storeData.staff_settings.payroll?.payFrequency ?? 'monthly',
                  payDayOfMonth: Number(storeData.staff_settings.payroll?.payDayOfMonth ?? 25),
                  overtimeRate: Number(storeData.staff_settings.payroll?.overtimeRate ?? 1.5),
                  socialSecurityRate: Number(storeData.staff_settings.payroll?.socialSecurityRate ?? 5),
                  deductionPresets: storeData.staff_settings.payroll?.deductionPresets ?? [],
                }
              } : useStore.getState().staffSettings
            });
          }
        } catch (err) {
          console.warn("Failed to fetch store settings from Supabase:", err);
        }
      }

      // 0.5 Fetch Roles
      try {
        let rolesQuery = supabase.from('roles').select('*');
        if (storeId && storeId !== 'default-store') {
          rolesQuery = rolesQuery.or(`store_id.is.null,store_id.eq.${storeId}`);
        }
        const { data: rolesData, error: rolesError } = await rolesQuery;
        if (rolesError) throw rolesError;
        if (rolesData) {
          useStore.setState({ roles: rolesData });
          const newRolePermissions: Record<string, string[]> = {};
          rolesData.forEach(role => {
            newRolePermissions[role.name] = role.permissions;
          });
          useStore.setState({ rolePermissions: newRolePermissions });
        }
      } catch (err) {
        console.warn("Failed to fetch roles from Supabase:", err);
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
                species: (p.type || 'Dog') as BookingType,
                breed: p.breed || '-',
                birthday: p.birth_date || '',
                weightHistory: p.weight ? [{ date: new Date().toISOString().split('T')[0], value: Number(p.weight) }] : [],
                serviceHistory: [],
                intakeHistory: [],
                notes: p.medical_condition || '',
                image: p.image_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&h=200&fit=crop'
              }))
            };
          });
          useStore.setState({ customers: formattedCustomers });
        } else {
          useStore.setState({ customers: [] });
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
          const mainServices = servicesData
            .filter(s => !s.is_addon)
            .map(s => ({
              id: s.id,
              title: s.name,
              category: s.category || 'Grooming',
              description: s.description || '',
              icon: s.icon as ServiceIcon,
              targetSpecies: s.target_species as 'Dog' | 'Cat',
              prices: s.prices,
              isActive: s.is_active !== false,
              coatType: s.coat_type
            }));
          useStore.setState({ services: mainServices });

          const mainAddons = servicesData
            .filter(s => s.is_addon)
            .map(s => ({
              id: s.id,
              name: s.name,
              price: Number(s.price || 0),
              icon: (s.icon || 'nail') as ServiceIcon
            }));
          useStore.setState({ addons: mainAddons });
        } else {
          useStore.setState({ services: [] });
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
          const formattedInventory = productsData.map(p => {
            const stock = p.stock || 0;
            const costPrice = Number(p.cost_price || 0);
            let fifoBatches = p.fifo_batches;
            if (!Array.isArray(fifoBatches) || fifoBatches.length === 0) {
              if (stock > 0) {
                fifoBatches = [{
                  id: 'initial-' + p.id,
                  quantity: stock,
                  costPrice: costPrice,
                  created_at: p.created_at || new Date().toISOString()
                }];
              } else {
                fifoBatches = [];
              }
            }
            return {
              id: p.id,
              name: p.name,
              barcode: p.barcode || '',
              stock: stock,
              minStock: p.min_stock || 5,
              price: Number(p.price || 0),
              costPrice: costPrice,
              unit: p.unit || 'ชิ้น',
              category: p.category || 'ทั่วไป',
              image: p.image_url || '',
              isConsignment: p.is_consignment || false,
              partnerId: p.partner_id || '',
              consignmentRate: Number(p.consignment_rate || 0),
              reorderQuantity: p.reorder_quantity || 20,
              fifoBatches: fifoBatches
            };
          });
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
            action: l.action as 'Add' | 'Adjust' | 'Sale' | 'Consignment' | 'In' | 'Out',
            oldQty: l.old_qty,
            newQty: l.new_qty,
            reason: l.reason || '',
            staffName: l.staff_name || 'System',
            timestamp: l.created_at,
            costPrice: Number(l.cost_price || 0)
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
            createdAt: tx.created_at,
            amount: Number(tx.amount || 0),
            discountAmount: Number(tx.discount_amount || 0),
            subtotal: Number(tx.subtotal || 0),
            vatAmount: Number(tx.vat_amount || 0),
            vatRate: Number(tx.vat_rate || 0),
            isTaxInvoice: tx.is_tax_invoice || false,
            details: tx.details || {},
            customerId: tx.customer_id || 'walk-in',
            customerName: tx.customer_name,
            items: tx.items,
            paymentMethod: tx.payment_method as PaymentMethod,
            staffName: tx.staff_name || 'Admin',
            staffId: tx.staff_id,
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
        let packageQuery = supabase.from('package_templates').select('*');
        if (storeId && storeId !== 'default-store') {
          packageQuery = packageQuery.eq('store_id', storeId);
        }
        const { data: packageData } = await packageQuery;
        if (packageData) {
          const formattedPackages = packageData.map(p => ({
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

      // 11. Fetch Purchase Orders
      try {
        let poQuery = supabase.from('purchase_orders').select('*').order('created_at', { ascending: false });
        if (storeId && storeId !== 'default-store') {
          poQuery = poQuery.eq('store_id', storeId);
        }
        const { data: poData, error: poError } = await poQuery;

        if (poError) throw poError;

        if (poData) {
          const formattedPOs = poData.map(po => ({
            id: po.id,
            date: po.date,
            partnerId: po.partner_id,
            items: po.items,
            status: po.status,
            totalAmount: Number(po.total_amount || 0),
            createdBy: po.created_by
          }));
          useStore.setState({ purchaseOrders: formattedPOs });
        } else {
          useStore.setState({ purchaseOrders: [] });
        }
      } catch (err) {
        console.warn("Failed to fetch purchase orders from Supabase:", err);
      }
    };

    if (isAuthenticated) {
      fetchInitialData();
    }
  }, [isAuthenticated, setCustomers, setServices, storeId]);

  return (
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
  );
};

export default AuthInitializer;