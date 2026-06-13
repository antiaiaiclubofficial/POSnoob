"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/store/useStore';
import { 
  Store, Users, ShieldAlert, Plus, Edit3, Trash2, Search, 
  Database, LayoutDashboard, Calendar, Scissors, Tag, Package, 
  Check, X, RefreshCw, Eye, ArrowLeft, Settings, Layers, Dog, Lock, User, LogOut, Chrome, CheckCircle2, XCircle, AlertCircle, Ban, Play
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

type SuperAdminTab = 'dashboard' | 'stores' | 'users' | 'approvals' | 'explorer';

const SuperAdmin = () => {
  const navigate = useNavigate();
  const { currentUser, loginWithGoogle, logout } = useStore();

  // SuperAdmin States
  const [activeTab, setActiveTab] = useState<SuperAdminTab>('dashboard');
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [stores, setStores] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    storesCount: 0,
    usersCount: 0,
    pendingCount: 0,
    petsCount: 0,
    appointmentsCount: 0,
    customersCount: 0
  });

  // Explorer States
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [selectedTable, setSelectedTable] = useState<string>('customers');
  const [explorerData, setExplorerData] = useState<any[]>([]);
  const [explorerLoading, setExplorerLoading] = useState(false);

  // Modal States
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Form States - Store
  const [storeForm, setStoreForm] = useState({
    name: '',
    slug: '',
    primary_color: '#1A1F3D',
    secondary_color: '#D9ED5F',
    logo_url: ''
  });

  // Form States - User
  const [userForm, setUserForm] = useState({
    id: '', // UUID from auth.users
    email: '',
    role: 'staff',
    store_id: ''
  });

  // Approval States
  const [selectedStoreForApproval, setSelectedStoreForApproval] = useState<Record<string, string>>({});

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (currentUser && currentUser.role !== 'superadmin') {
      toast.info("เข้าสู่ระบบร้านค้าปกติเรียบร้อยแล้ว");
      navigate('/');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (currentUser?.role === 'superadmin') {
      fetchInitialData();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.role === 'superadmin' && activeTab === 'explorer') {
      fetchExplorerData();
    }
  }, [selectedStoreId, selectedTable, activeTab, currentUser]);

  const handleLocalLogout = () => {
    logout();
    toast.info("ออกจากระบบ Super Admin เรียบร้อยแล้ว");
    navigate('/login');
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle(window.location.origin + '/superadmin');
    } catch (error) {
      toast.error("Google Login failed");
    }
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Stores
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false });
      if (storesError) throw storesError;
      setStores(storesData || []);

      // 2. Fetch Profiles (Approved Users)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_approved', true)
        .order('updated_at', { ascending: false });
      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      // 3. Fetch Pending Users
      const { data: pendingData, error: pendingError } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_approved', false)
        .order('updated_at', { ascending: false });
      if (pendingError) throw pendingError;
      setPendingUsers(pendingData || []);

      // 4. Fetch Stats
      const { count: petsCount } = await supabase.from('pets').select('*', { count: 'exact', head: true });
      const { count: appointmentsCount } = await supabase.from('appointments').select('*', { count: 'exact', head: true });
      const { count: customersCount } = await supabase.from('customers').select('*', { count: 'exact', head: true });

      setStats({
        storesCount: storesData?.length || 0,
        usersCount: profilesData?.length || 0,
        pendingCount: pendingData?.length || 0,
        petsCount: petsCount || 0,
        appointmentsCount: appointmentsCount || 0,
        customersCount: customersCount || 0
      });

      // Initialize default store selection for approvals
      if (storesData && storesData.length > 0) {
        const initialApprovals: Record<string, string> = {};
        pendingData?.forEach(user => {
          initialApprovals[user.id] = storesData[0].id;
        });
        setSelectedStoreForApproval(initialApprovals);
      }

    } catch (error: any) {
      console.error("Error fetching superadmin data:", error);
      toast.error("ไม่สามารถดึงข้อมูลระบบได้: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchExplorerData = async () => {
    setExplorerLoading(true);
    try {
      let query = supabase.from(selectedTable).select('*');
      
      if (selectedStoreId !== 'all') {
        const tablesWithStoreId = ['appointments', 'services', 'coupon_templates', 'deal_templates', 'package_templates', 'customer_coupons', 'customers_deals', 'customer_packages', 'store_customers'];
        if (tablesWithStoreId.includes(selectedTable)) {
          query = query.eq('store_id', selectedStoreId);
        }
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      setExplorerData(data || []);
    } catch (error: any) {
      console.error("Error fetching explorer data:", error);
      toast.error("ไม่สามารถดึงข้อมูลตารางได้: " + error.message);
      setExplorerData([]);
    } finally {
      setExplorerLoading(false);
    }
  };

  // Store Actions
  const handleStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStore) {
        const { error } = await supabase
          .from('stores')
          .update(storeForm)
          .eq('id', editingStore.id);
        if (error) throw error;
        toast.success("อัปเดตร้านค้าเรียบร้อยแล้ว");
      } else {
        const { error } = await supabase
          .from('stores')
          .insert([storeForm]);
        if (error) throw error;
        toast.success("สร้างร้านค้าใหม่เรียบร้อยแล้ว");
      }
      setIsStoreModalOpen(false);
      setEditingStore(null);
      fetchInitialData();
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    }
  };

  const handleDeleteStore = async (id: string) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบร้านค้านี้? ข้อมูลทั้งหมดที่เกี่ยวข้องจะถูกลบออกด้วย")) return;
    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success("ลบร้านค้าเรียบร้อยแล้ว");
      fetchInitialData();
    } catch (error: any) {
      toast.error("ไม่สามารถลบได้: " + error.message);
    }
  };

  const handleToggleStoreSuspension = async (id: string, currentStatus: boolean) => {
    const actionText = currentStatus ? "เปิดใช้งานร้านค้า" : "พักสิทธิ์ร้านค้า";
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการ ${actionText}?`)) return;
    
    try {
      const { error } = await supabase
        .from('stores')
        .update({ is_suspended: !currentStatus })
        .eq('id', id);
      if (error) throw error;
      toast.success(`${actionText}เรียบร้อยแล้ว`);
      fetchInitialData();
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    }
  };

  // User Actions
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const { error } = await supabase
          .from('profiles')
          .update({
            role: userForm.role,
            store_id: userForm.store_id || null
          })
          .eq('id', editingUser.id);
        if (error) throw error;
        toast.success("อัปเดตสิทธิ์ผู้ใช้งานเรียบร้อยแล้ว");
      } else {
        const { error } = await supabase
          .from('profiles')
          .insert([{
            id: userForm.id,
            email: userForm.email,
            role: userForm.role,
            store_id: userForm.store_id || null,
            is_approved: true,
            is_suspended: false
          }]);
        if (error) throw error;
        toast.success("เพิ่มผู้ใช้งานในระบบเรียบร้อยแล้ว");
      }
      setIsUserModalOpen(false);
      setEditingUser(null);
      fetchInitialData();
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบโปรไฟล์ผู้ใช้นี้ออกจากระบบจัดการ?")) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success("ลบโปรไฟล์ผู้ใช้เรียบร้อยแล้ว");
      fetchInitialData();
    } catch (error: any) {
      toast.error("ไม่สามารถลบได้: " + error.message);
    }
  };

  const handleToggleUserSuspension = async (id: string, currentStatus: boolean) => {
    const actionText = currentStatus ? "เปิดใช้งานผู้ใช้" : "พักสิทธิ์ผู้ใช้";
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการ ${actionText}?`)) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_suspended: !currentStatus })
        .eq('id', id);
      if (error) throw error;
      toast.success(`${actionText}เรียบร้อยแล้ว`);
      fetchInitialData();
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    }
  };

  // Approval Actions
  const handleAcceptUser = async (userId: string, email: string) => {
    const assignedStoreId = selectedStoreForApproval[userId];
    if (!assignedStoreId) {
      toast.error("กรุณาเลือกร้านค้าที่จะมอบหมายให้ผู้ใช้นี้");
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_approved: true,
          store_id: assignedStoreId,
          role: 'Admin' // กำหนดบทบาทเริ่มต้นเป็น Admin ของร้านค้านั้นๆ
        })
        .eq('id', userId);

      if (error) throw error;
      toast.success(`อนุมัติผู้ใช้ ${email} เรียบร้อยแล้ว!`);
      fetchInitialData();
    } catch (error: any) {
      toast.error("ไม่สามารถอนุมัติได้: " + error.message);
    }
  };

  const handleRejectUser = async (userId: string, email: string) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธคำขอของ ${email}? บัญชีนี้จะถูกลบออกจากระบบ`)) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      toast.success(`ปฏิเสธคำขอของ ${email} เรียบร้อยแล้ว`);
      fetchInitialData();
    } catch (error: any) {
      toast.error("ไม่สามารถปฏิเสธได้: " + error.message);
    }
  };

  const openStoreModal = (store: any = null) => {
    if (store) {
      setEditingStore(store);
      setStoreForm({
        name: store.name,
        slug: store.slug,
        primary_color: store.primary_color || '#1A1F3D',
        secondary_color: store.secondary_color || '#D9ED5F',
        logo_url: store.logo_url || ''
      });
    } else {
      setEditingStore(null);
      setStoreForm({
        name: '',
        slug: '',
        primary_color: '#1A1F3D',
        secondary_color: '#D9ED5F',
        logo_url: ''
      });
    }
    setIsStoreModalOpen(true);
  };

  const openUserModal = (user: any = null) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        id: user.id,
        email: user.email,
        role: user.role || 'staff',
        store_id: user.store_id || ''
      });
    } else {
      setEditingUser(null);
      setUserForm({
        id: '',
        email: '',
        role: 'staff',
        store_id: stores[0]?.id || ''
      });
    }
    setIsUserModalOpen(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // คำนวณมุมองศาจากจุดศูนย์กลางของปุ่มไปยังตำแหน่งเมาส์
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI) + 90;

    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
    e.currentTarget.style.setProperty('--gradient-angle', `${angle}deg`);
  };

  const filteredStores = stores.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProfiles = profiles.filter(p => 
    p.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPendingUsers = pendingUsers.filter(p => 
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (currentUser?.role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-[#0F111A] flex items-center justify-center p-6 relative">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <ShieldAlert className="text-red-500 w-10 h-10 animate-pulse" />
            </div>
            <h1 className="text-3xl font-black text-white mb-2">Super Admin Gate</h1>
            <p className="text-xs text-gray-500 font-black uppercase tracking-[0.2em]">System Owner Authentication</p>
          </div>

          <div className="bg-[#151824] p-10 rounded-[48px] border border-gray-800 shadow-2xl text-center space-y-6">
            {currentUser ? (
              <div className="space-y-6">
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold leading-relaxed">
                  ปฏิเสธการเข้าถึง: บัญชี Google ของคุณ ({currentUser.email}) ไม่มีสิทธิ์ผู้ดูแลระบบสูงสุด (Super Admin)
                </div>
                <button 
                  onClick={handleLocalLogout}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white font-black py-4 rounded-[24px] flex items-center justify-center gap-3 transition-all"
                >
                  <LogOut size={18} /> ออกจากระบบ / สลับบัญชี
                </button>
              </div>
            ) : (
              <div className="space-y-6 text-center">
                <p className="text-xs text-gray-400 leading-relaxed">
                  กรุณาลงชื่อเข้าใช้งานด้วยบัญชีผู้ดูแลระบบสูงสุด (Super Admin) เพื่อเข้าสู่แผงควบคุมระบบส่วนกลาง
                </p>
                <button 
                  onClick={handleGoogleLogin}
                  onMouseMove={handleMouseMove}
                  className="w-full bg-[#0d0e15] google-border-btn text-white border border-[#3a3f50] font-bold py-5 rounded-full flex items-center justify-center gap-3 shadow-xl active:scale-95"
                >
                  <div className="flex items-center justify-center gap-3 relative z-10">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-3.3 3.28-8.17 3.28-13.83z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    Sign in with Google
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F8F9FD] overflow-hidden h-screen">
      {/* SuperAdmin Header */}
      <header className="px-10 py-6 bg-white border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pl-14 lg:pl-10 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert size={14} className="text-red-500 animate-pulse" />
            <p className="text-[10px] text-red-500 font-black uppercase tracking-[0.2em]">System Super Administrator</p>
          </div>
          <h1 className="text-3xl font-black text-[#1A1F3D]">Super Admin Panel</h1>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleLocalLogout}
            className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-5 py-3 rounded-2xl text-xs font-black transition-all"
          >
            <LogOut size={16} /> ออกจากระบบ Super Admin
          </button>
          <button 
            onClick={fetchInitialData}
            className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl text-gray-500 transition-all"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="px-10 py-4 bg-white border-b border-gray-50 flex gap-2 overflow-x-auto scrollbar-hide shrink-0">
        {[
          { id: 'dashboard', label: 'ภาพรวมระบบ', icon: LayoutDashboard },
          { id: 'stores', label: 'จัดการร้านค้า', icon: Store },
          { id: 'users', label: 'สิทธิ์ผู้ใช้งาน', icon: Users },
          { id: 'approvals', label: `คำขออนุมัติ (${stats.pendingCount})`, icon: AlertCircle },
          { id: 'explorer', label: 'สำรวจข้อมูลตาราง', icon: Database }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as SuperAdminTab);
              setSearchQuery('');
            }}
            className={cn(
              "px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-[#1A1F3D] text-white shadow-lg" 
                : "text-gray-400 hover:bg-gray-50 hover:text-[#1A1F3D]"
            )}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">กำลังโหลดข้อมูลระบบ...</p>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
            
            {/* Tab: Dashboard */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
                  <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                    <Store size={24} className="text-blue-500 mb-4" />
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-1">ร้านค้าทั้งหมด</p>
                    <h2 className="text-3xl font-black text-[#1A1F3D]">{stats.storesCount}</h2>
                  </div>
                  <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                    <Users size={24} className="text-purple-500 mb-4" />
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-1">ผู้ใช้งานระบบ</p>
                    <h2 className="text-3xl font-black text-[#1A1F3D]">{stats.usersCount}</h2>
                  </div>
                  <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                    <AlertCircle size={24} className="text-amber-500 mb-4" />
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-1">คำขอรออนุมัติ</p>
                    <h2 className="text-3xl font-black text-amber-600">{stats.pendingCount}</h2>
                  </div>
                  <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                    <Users size={24} className="text-emerald-500 mb-4" />
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-1">ลูกค้าลงทะเบียน</p>
                    <h2 className="text-3xl font-black text-[#1A1F3D]">{stats.customersCount}</h2>
                  </div>
                  <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                    <Dog size={24} className="text-amber-500 mb-4" />
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-1">สัตว์เลี้ยงทั้งหมด</p>
                    <h2 className="text-3xl font-black text-[#1A1F3D]">{stats.petsCount}</h2>
                  </div>
                  <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                    <Calendar size={24} className="text-rose-500 mb-4" />
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-1">นัดหมายทั้งหมด</p>
                    <h2 className="text-3xl font-black text-[#1A1F3D]">{stats.appointmentsCount}</h2>
                  </div>
                </div>

                {/* Quick Info Alert */}
                <div className="bg-blue-50 border border-blue-100 p-6 rounded-[32px] flex items-start gap-4">
                  <ShieldAlert className="text-blue-500 shrink-0 mt-1" size={20} />
                  <div>
                    <h4 className="text-sm font-black text-blue-900 mb-1">ระบบจัดการส่วนกลาง (Super Admin Mode)</h4>
                    <p className="text-xs text-blue-800/80 leading-relaxed font-medium">
                      คุณกำลังอยู่ในโหมดผู้ดูแลระบบสูงสุด คุณสามารถสร้างร้านค้าใหม่ กำหนดสิทธิ์ผู้ใช้งาน และตรวจสอบข้อมูลดิบในตารางต่างๆ ของฐานข้อมูล Supabase ได้โดยตรง โปรดระมัดระวังในการแก้ไขหรือลบข้อมูลเนื่องจากจะส่งผลกระทบต่อการทำงานของร้านค้าจริง
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Stores */}
            {activeTab === 'stores' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-6 py-3 text-sm font-bold"
                      placeholder="ค้นหาร้านค้า..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={() => openStoreModal()}
                    className="w-full sm:w-auto bg-[#1A1F3D] text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-md"
                  >
                    <Plus size={16} /> เพิ่มร้านค้าใหม่
                  </button>
                </div>

                <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                          <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">โลโก้ / ชื่อร้าน</th>
                          <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">Slug (URL)</th>
                          <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">สีหลัก / สีรอง</th>
                          <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">สถานะ</th>
                          <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredStores.map(store => (
                          <tr key={store.id} className={cn("hover:bg-gray-50/50 transition-colors", store.is_suspended && "bg-red-50/30")}>
                            <td className="px-8 py-5 flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center">
                                {store.logo_url ? (
                                  <img src={store.logo_url} className="w-full h-full object-cover" alt="Logo" />
                                ) : (
                                  <Store className="text-gray-300" size={20} />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-black text-[#1A1F3D]">{store.name}</p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase">ID: {store.id}</p>
                              </div>
                            </td>
                            <td className="px-8 py-5 text-sm font-bold text-gray-600">{store.slug}</td>
                            <td className="px-8 py-5 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <span className="w-6 h-6 rounded-full border border-gray-200 inline-block" style={{ backgroundColor: store.primary_color }} title="Primary Color" />
                                <span className="w-6 h-6 rounded-full border border-gray-200 inline-block" style={{ backgroundColor: store.secondary_color }} title="Secondary Color" />
                              </div>
                            </td>
                            <td className="px-8 py-5 text-center">
                              <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                                store.is_suspended ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                              )}>
                                {store.is_suspended ? "ถูกระงับ" : "ปกติ"}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => handleToggleStoreSuspension(store.id, store.is_suspended)}
                                  className={cn(
                                    "p-2 rounded-xl transition-all",
                                    store.is_suspended ? "text-green-600 hover:bg-green-50" : "text-amber-600 hover:bg-amber-50"
                                  )}
                                  title={store.is_suspended ? "เปิดใช้งานร้านค้า" : "พักสิทธิ์ร้านค้า"}
                                >
                                  {store.is_suspended ? <Play size={16} /> : <Ban size={16} />}
                                </button>
                                <button 
                                  onClick={() => openStoreModal(store)}
                                  className="p-2 text-gray-400 hover:text-[#1A1F3D] hover:bg-gray-100 rounded-xl transition-all"
                                >
                                  <Edit3 size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteStore(store.id)}
                                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredStores.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-20 text-center opacity-20 font-black">ไม่พบข้อมูลร้านค้า</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Users */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-6 py-3 text-sm font-bold"
                      placeholder="ค้นหาผู้ใช้งาน..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={() => openUserModal()}
                    className="w-full sm:w-auto bg-[#1A1F3D] text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-md"
                  >
                    <Plus size={16} /> เพิ่มสิทธิ์ผู้ใช้ใหม่
                  </button>
                </div>

                <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                          <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">อีเมลผู้ใช้</th>
                          <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">สังกัดร้านค้า</th>
                          <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">บทบาท (Role)</th>
                          <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">สถานะ</th>
                          <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredProfiles.map(profile => {
                          const userStore = stores.find(s => s.id === profile.store_id);
                          return (
                            <tr key={profile.id} className={cn("hover:bg-gray-50/50 transition-colors", profile.is_suspended && "bg-red-50/30")}>
                              <td className="px-8 py-5">
                                <p className="text-sm font-black text-[#1A1F3D]">{profile.email}</p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase">UID: {profile.id}</p>
                              </td>
                              <td className="px-8 py-5 text-sm font-bold text-gray-600">
                                {userStore ? userStore.name : <span className="text-red-400 italic">ไม่ได้สังกัดร้านค้า</span>}
                              </td>
                              <td className="px-8 py-5 text-center">
                                <span className={cn(
                                  "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                                  profile.role === 'admin' ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                                )}>
                                  {profile.role}
                                </span>
                              </td>
                              <td className="px-8 py-5 text-center">
                                <span className={cn(
                                  "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                                  profile.is_suspended ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                                )}>
                                  {profile.is_suspended ? "ถูกระงับ" : "ปกติ"}
                                </span>
                              </td>
                              <td className="px-8 py-5 text-right">
                                <div className="flex justify-end gap-2">
                                  <button 
                                    onClick={() => handleToggleUserSuspension(profile.id, profile.is_suspended)}
                                    className={cn(
                                      "p-2 rounded-xl transition-all",
                                      profile.is_suspended ? "text-green-600 hover:bg-green-50" : "text-amber-600 hover:bg-amber-50"
                                    )}
                                    title={profile.is_suspended ? "เปิดใช้งานผู้ใช้" : "พักสิทธิ์ผู้ใช้"}
                                  >
                                    {profile.is_suspended ? <Play size={16} /> : <Ban size={16} />}
                                  </button>
                                  <button 
                                    onClick={() => openUserModal(profile)}
                                    className="p-2 text-gray-400 hover:text-[#1A1F3D] hover:bg-gray-100 rounded-xl transition-all"
                                  >
                                    <Edit3 size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteUser(profile.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredProfiles.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-20 text-center opacity-20 font-black">ไม่พบข้อมูลผู้ใช้งาน</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Approvals */}
            {activeTab === 'approvals' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-6 py-3 text-sm font-bold"
                      placeholder="ค้นหาคำขออนุมัติ..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                    <h4 className="text-xs font-black text-[#1A1F3D] uppercase tracking-widest">
                      คำขอลงทะเบียนผู้ใช้ใหม่ที่รอการอนุมัติ ({filteredPendingUsers.length} รายการ)
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                          <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">อีเมลผู้สมัคร</th>
                          <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">มอบหมายร้านค้า (Assign Store)</th>
                          <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">วันที่สมัคร</th>
                          <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">การดำเนินการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredPendingUsers.map(user => (
                          <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-8 py-5">
                              <p className="text-sm font-black text-[#1A1F3D]">{user.email}</p>
                              <p className="text-[9px] text-gray-400 font-bold uppercase">UID: {user.id}</p>
                            </td>
                            <td className="px-8 py-5">
                              <select 
                                className="bg-[#F5F6FA] border-none rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500/10"
                                value={selectedStoreForApproval[user.id] || ''}
                                onChange={e => setSelectedStoreForApproval({
                                  ...selectedStoreForApproval,
                                  [user.id]: e.target.value
                                })}
                              >
                                {stores.map(s => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-8 py-5 text-center text-xs text-gray-400 font-bold">
                              {new Date(user.updated_at).toLocaleDateString()}
                            </td>
                            <td className="px-8 py-5 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => handleAcceptUser(user.id, user.email)}
                                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm"
                                >
                                  <CheckCircle2 size={14} /> อนุมัติ (Accept)
                                </button>
                                <button 
                                  onClick={() => handleRejectUser(user.id, user.email)}
                                  className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5"
                                >
                                  <XCircle size={14} /> ปฏิเสธ (Reject)
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredPendingUsers.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-20 text-center opacity-20 font-black">ไม่มีคำขออนุมัติใหม่ในขณะนี้</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Explorer */}
            {activeTab === 'explorer' && (
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">1. เลือกร้านค้า</label>
                    <select 
                      className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold appearance-none"
                      value={selectedStoreId}
                      onChange={e => setSelectedStoreId(e.target.value)}
                    >
                      <option value="all">ทั้งหมด (All Stores)</option>
                      {stores.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">2. เลือกตารางข้อมูล</label>
                    <select 
                      className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold appearance-none"
                      value={selectedTable}
                      onChange={e => setSelectedTable(e.target.value)}
                    >
                      <option value="customers">ลูกค้า (customers)</option>
                      <option value="pets">สัตว์เลี้ยง (pets)</option>
                      <option value="appointments">นัดหมาย (appointments)</option>
                      <option value="services">บริการ (services)</option>
                      <option value="coupon_templates">เทมเพลตคูปอง (coupon_templates)</option>
                      <option value="deal_templates">เทมเพลตดีล (deal_templates)</option>
                      <option value="package_templates">เทมเพลตแพ็กเกจ (package_templates)</option>
                      <option value="customer_coupons">คูปองของลูกค้า (customer_coupons)</option>
                      <option value="customer_packages">แพ็กเกจของลูกค้า (customer_packages)</option>
                    </select>
                  </div>
                </div>

                <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
                    <h4 className="text-xs font-black text-[#1A1F3D] uppercase tracking-widest">
                      ข้อมูลดิบในตาราง: {selectedTable} ({explorerData.length} รายการล่าสุด)
                    </h4>
                    <button 
                      onClick={fetchExplorerData}
                      className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-all"
                      title="รีเฟรชตาราง"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>

                  {explorerLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                      <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">กำลังดึงข้อมูลตาราง...</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto max-h-[500px] scrollbar-hide">
                      {explorerData.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                              {Object.keys(explorerData[0]).map(key => (
                                <th key={key} className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 whitespace-nowrap">
                                  {key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {explorerData.map((row, idx) => (
                              <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                                {Object.values(row).map((val: any, cellIdx) => (
                                  <td key={cellIdx} className="px-6 py-4 text-xs font-medium text-gray-600 max-w-xs truncate">
                                    {val === null ? (
                                      <span className="text-gray-300 italic">null</span>
                                    ) : typeof val === 'object' ? (
                                      JSON.stringify(val)
                                    ) : (
                                      String(val)
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="py-20 text-center opacity-20 font-black">
                          ไม่มีข้อมูลในตารางนี้ตามเงื่อนไขที่เลือก
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Modal: Store Form */}
      {isStoreModalOpen && (
        <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[250] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#1A1F3D] rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Store size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#1A1F3D]">{editingStore ? 'แก้ไขร้านค้า' : 'เพิ่มร้านค้าใหม่'}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Store Specification</p>
                </div>
              </div>
              <button onClick={() => setIsStoreModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleStoreSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">ชื่อร้านค้า (Store Name)</label>
                  <input 
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold"
                    value={storeForm.name}
                    onChange={e => setStoreForm({ ...storeForm, name: e.target.value })}
                    placeholder="เช่น Mellow Fellow Sanctuary"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">Slug (URL Path)</label>
                  <input 
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold"
                    value={storeForm.slug}
                    onChange={e => setStoreForm({ ...storeForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    placeholder="เช่น mellow-fellow"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">สีหลัก (Primary)</label>
                    <input 
                      type="color"
                      className="w-full h-12 bg-[#F5F6FA] border-none rounded-2xl p-1 cursor-pointer"
                      value={storeForm.primary_color}
                      onChange={e => setStoreForm({ ...storeForm, primary_color: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">สีรอง (Secondary)</label>
                    <input 
                      type="color"
                      className="w-full h-12 bg-[#F5F6FA] border-none rounded-2xl p-1 cursor-pointer"
                      value={storeForm.secondary_color}
                      onChange={e => setStoreForm({ ...storeForm, secondary_color: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">โลโก้ URL (Logo URL)</label>
                  <input 
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold"
                    value={storeForm.logo_url}
                    onChange={e => setStoreForm({ ...storeForm, logo_url: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-[#1A1F3D] text-white font-black py-5 rounded-[24px] shadow-xl transition-all active:scale-95"
              >
                บันทึกข้อมูลร้านค้า
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: User Form */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[250] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#1A1F3D] rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#1A1F3D]">{editingUser ? 'แก้ไขสิทธิ์ผู้ใช้' : 'เพิ่มสิทธิ์ผู้ใช้ใหม่'}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">User Profile & Role</p>
                </div>
              </div>
              <button onClick={() => setIsUserModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleUserSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                {!editingUser && (
                  <>
                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">User ID (UUID จาก auth.users)</label>
                      <input 
                        className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold"
                        value={userForm.id}
                        onChange={e => setUserForm({ ...userForm, id: e.target.value })}
                        placeholder="เช่น 123e4567-e89b-12d3-a456-426614174000"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">อีเมลผู้ใช้ (Email)</label>
                      <input 
                        type="email"
                        className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold"
                        value={userForm.email}
                        onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                        placeholder="user@example.com"
                        required
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">สังกัดร้านค้า (Store)</label>
                  <select 
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold appearance-none"
                    value={userForm.store_id}
                    onChange={e => setUserForm({ ...userForm, store_id: e.target.value })}
                  >
                    <option value="">-- ไม่สังกัดร้านค้า (ส่วนกลาง) --</option>
                    {stores.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">บทบาท (Role)</label>
                  <select 
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold appearance-none"
                    value={userForm.role}
                    onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                  >
                    <option value="admin">Admin (ผู้จัดการร้าน)</option>
                    <option value="staff">Staff (พนักงานทั่วไป)</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-[#1A1F3D] text-white font-black py-5 rounded-[24px] shadow-xl transition-all active:scale-95"
              >
                บันทึกสิทธิ์ผู้ใช้งาน
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SuperAdmin;