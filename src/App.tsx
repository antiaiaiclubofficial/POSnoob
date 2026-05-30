import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useStore, BookingType, MembershipLevel } from "@/store/useStore";
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
  const { language, isAuthenticated, setSession, setCustomers, setServices } = useStore();

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

      // 1. Fetch Customers & Service History
      try {
        const { data: customersData, error: customersError } = await supabase
          .from('customers')
          .select(`
            id,
            first_name,
            last_name,
            display_name,
            phone,
            email,
            line_user_id,
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
            store_customers (
              points,
              tier
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

        if (customersError) throw customersError;

        // Fetch service history
        const { data: serviceHistoryData } = await supabase
          .from('service_history')
          .select('*');
        
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
                weightHistory: p.weight ? [{ date: new Date().toISOString().split('T')[0], value: Number(p.weight) }] : [],
                serviceHistory: serviceHistoryMap[p.id] || [],
                notes: p.medical_condition || '',
                image: p.image_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&h=200&fit=crop'
              }))
            };
          });
          setCustomers(formattedCustomers);
        }
      } catch (err) {
        console.warn("Failed to fetch customers from Supabase:", err);
      }

      // 2. Fetch Services & Add-ons
      try {
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*');

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
        }
      } catch (err) {
        console.warn("Failed to fetch services from Supabase:", err);
      }

      // 3. Fetch Partners
      try {
        const { data: partnersData, error: partnersError } = await supabase
          .from('partners')
          .select('*');

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
        }
      } catch (err) {
        console.warn("Failed to fetch partners from Supabase:", err);
      }

      // 4. Fetch Products (Inventory)
      try {
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*');

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
        }
      } catch (err) {
        console.warn("Failed to fetch products from Supabase:", err);
      }

      // 5. Fetch Stock Logs
      try {
        const { data: logsData, error: logsError } = await supabase
          .from('stock_logs')
          .select('*, products(name)');

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
        }
      } catch (err) {
        console.warn("Failed to fetch stock logs from Supabase:", err);
      }

      // 6. Fetch Sales Transactions
      try {
        const { data: txData, error: txError } = await supabase
          .from('sales_transactions')
          .select('*')
          .order('created_at', { ascending: false });

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
        }
      } catch (err) {
        console.warn("Failed to fetch transactions from Supabase:", err);
      }

      // 7. Fetch Package Templates
      try {
        const { data: packagesData } = await supabase
          .from('package_templates')
          .select('*');

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
        }
      } catch (e) {
        console.warn("package_templates table might not exist yet:", e);
      }

      // 8. Fetch Credit Packages
      try {
        const { data: creditsData } = await supabase
          .from('credit_packages')
          .select('*');
        if (creditsData) {
          const formattedCredits = creditsData.map(c => ({
            id: c.id,
            name: c.name,
            price: Number(c.price || 0),
            creditValue: Number(c.credit_value || 0)
          }));
          useStore.setState({ creditPackages: formattedCredits });
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
  }, [isAuthenticated, setCustomers, setServices]);

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