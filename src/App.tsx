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
        .select('*, pets(*), packages(*), credit_history(*)');
      
      if (customersData) {
        // Map snake_case from DB to camelCase for the app
        const formattedCustomers = customersData.map(c => ({
          ...c,
          creditBalance: c.credit_balance,
          totalSpent: c.total_spent,
          lineId: c.line_id,
          pets: c.pets.map(p => ({
            ...p,
            weightHistory: p.weight_history || [],
            serviceHistory: p.service_history || []
          }))
        }));
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