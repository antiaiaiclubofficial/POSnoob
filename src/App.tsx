import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useStore } from "@/store/useStore";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import Queue from "./pages/Queue";
import Services from "./pages/Services";
import Customers from "./pages/Customers";
import Promotions from "./pages/Promotions";
import Coupons from "./pages/Coupons";
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
  const language = useStore((state) => state.language);

  // Sync language state with HTML lang attribute for CSS font selection
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

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
              <Route path="/promotions" element={<Promotions />} />
              <Route path="/coupons" element={<Coupons />} />
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