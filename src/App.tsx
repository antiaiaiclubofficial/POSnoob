import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
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
  const { language, setSession, setCustomers, setServices } = useStore();

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    // Auth Session Handling
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session?.user ?? null);
      if (session) fetchInitialData();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session?.user ?? null);
      if (session) fetchInitialData();
    });

    // CRM & Services Data Sync Logic
    const fetchInitialData = async () => {
      // 1. Fetch Customers
      const { data: customersData } = await supabase
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
      
      if (customersData) {
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
              serviceHistory: [],
              notes: p.medical_condition || '',
              image: p.image_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&h=200&fit=crop'
            }))
          };
        });
        setCustomers(formattedCustomers);
      }

      // 2. Fetch Services
      const { data: servicesData } = await supabase
        .from('services')
        .select('*');

      if (servicesData) {
        const formattedServices = servicesData.map(s => ({
          id: s.id,
          title: s.name,
          category: 'Grooming',
          description: s.description || '',
          icon: 'grooming' as any,
          targetSpecies: 'Dog' as any,
          prices: {
            'Standard': { price: Number(s.price || 0), duration: s.duration_minutes || 60 }
          },
          isActive: true
        }));
        setServices(formattedServices);
      }

      // 3. Fetch Partners
      const { data: partnersData } = await supabase
        .from('partners')
        .select('*');

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

      // 4. Fetch Products (Inventory)
      const { data: productsData } = await supabase
        .from('products')
        .select('*');

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

      // 5. Fetch Stock Logs
      const { data: logsData } = await supabase
        .from('stock_logs')
        .select('*, products(name)');

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
    };

    return () => subscription.unsubscribe();
  }, [setSession, setCustomers, setServices]);

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