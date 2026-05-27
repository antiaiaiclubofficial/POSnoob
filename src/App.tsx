import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => {
  const { language, setSession, setCustomers } = useStore();

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

    // CRM Data Sync Logic
    const fetchInitialData = async () => {
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
    };

    return () => subscription.unsubscribe();
  }, [setSession, setCustomers]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-right" closeButton />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
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