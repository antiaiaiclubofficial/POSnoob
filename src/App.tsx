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
import Queue from "./pages/Queue";
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
              vatRate: storeData.vat_rate || 7
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
          useStore.setState({ staff: formattedStaff });
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