// ... (imports and other code)

const HomeRedirect = () => {
  const { currentUser } = useStore();
  if (currentUser?.role === 'superadmin') {
    return <Navigate to="/superadmin" replace />;
  }
  return <Dashboard />;
};

const App = () => {
  // ... (useEffect hooks and other code)

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
              <Route path="/" element={<HomeRedirect />} /> {/* ตรงนี้คือส่วนที่จัดการ */}
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