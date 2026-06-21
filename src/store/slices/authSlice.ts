import { StateCreator } from 'zustand';
import { AppState } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const createAuthSlice: StateCreator<AppState, [], [], Pick<AppState, 'isAuthenticated' | 'isAuthLoading' | 'currentUser' | 'storeId' | 'login' | 'loginWithGoogle' | 'setSession' | 'verifyPassword' | 'logout'>> = (set, get) => ({
  isAuthenticated: false,
  isAuthLoading: true,
  currentUser: null,
  storeId: null,

  login: (id, pass) => {
    if (id === 'superadmin' && pass === 'superadmin') {
      const user = { id: 'superadmin', name: 'System Owner', role: 'superadmin', username: 'superadmin' };
      set({ isAuthenticated: true, currentUser: user, storeId: null, isAuthLoading: false });
      get().addLog({ staffName: 'System', action: 'Login Success', details: 'Super Administrator logged into the system', type: 'success' });
      return true;
    }
    if (id === 'admin' && pass === '1234') {
      const user = { id: 'admin', name: 'Admin', role: 'Admin', username: 'admin' };
      set({ isAuthenticated: true, currentUser: user, storeId: 'default-store', isAuthLoading: false });
      get().addLog({ staffName: 'System', action: 'Login Success', details: 'Super Admin logged into the system', type: 'success' });
      return true;
    }
    const member = get().staff.find(s => s.username === id && s.password === pass && s.status === 'Active');
    if (member) {
      const user = { id: member.id, name: member.name, role: member.role, username: member.username };
      set({ isAuthenticated: true, currentUser: user, storeId: 'default-store', isAuthLoading: false });
      get().addLog({ staffName: 'System', action: 'Login Success', details: `Staff member ${member.name} logged in`, type: 'success' });
      return true;
    }
    return false;
  },

  loginWithGoogle: async (redirectTo) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo || window.location.origin,
      },
    });
    if (error) {
      toast.error(error.message);
    }
  },

  setSession: async (user) => {
    if (user) {
      const isSuperAdminPath = window.location.pathname.startsWith('/superadmin');
      const isSuperAdminEmail = user.email === 'antiai.aiclub.official@gmail.com';
      const shouldBeSuperAdmin = isSuperAdminEmail && isSuperAdminPath;

      // Check if there is a pending invitation in localStorage
      const inviteDataStr = localStorage.getItem('pending_invite_data');
      if (inviteDataStr) {
        try {
          const inviteData = JSON.parse(inviteDataStr);
          
          // Check max_users quota for the store
          const { data: store, error: storeError } = await supabase
            .from('stores')
            .select('max_users')
            .eq('id', inviteData.storeId)
            .single();
          
          if (store) {
            const maxUsers = store.max_users || 5;
            const { count, error: countError } = await supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true })
              .eq('store_id', inviteData.storeId)
              .eq('status', 'Active');
            
            if (count !== null && count >= maxUsers) {
              toast.error(`ไม่สามารถเชื่อมต่อได้: ร้านค้าจำกัดจำนวนผู้ใช้งานสูงสุดไว้ที่ ${maxUsers} บัญชี`);
              localStorage.removeItem('pending_invite_data');
              await supabase.auth.signOut();
              set({ isAuthenticated: false, isAuthLoading: false, currentUser: null, storeId: null });
              return;
            }
          }

          // Create or update profile with invite data
          const { error: upsertError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email,
              role: inviteData.role === 'Admin' ? 'admin' : 'staff',
              store_id: inviteData.storeId,
              full_name: inviteData.name,
              phone: inviteData.phone,
              commission_rate: Number(inviteData.commissionRate || 0),
              is_approved: true,
              is_suspended: false,
              status: 'Active'
            });

          if (upsertError) throw upsertError;
          
          toast.success("เชื่อมต่อบัญชี Google และเข้าร่วมทีมสำเร็จ!");
          localStorage.removeItem('pending_invite_data');
        } catch (err: any) {
          console.error("Error processing invite:", err);
          toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อบัญชี: " + err.message);
        }
      }

      // 1. ดึงข้อมูลโปรไฟล์จริงจากฐานข้อมูล Supabase
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('role, store_id, is_approved, is_suspended, status')
        .eq('id', user.id)
        .maybeSingle();

      // 2. หากเกิดข้อผิดพลาดในการดึงข้อมูล ให้หยุดทำงานเพื่อความปลอดภัย
      if (error) {
        console.error("Error fetching profile:", error);
        set({ isAuthLoading: false });
        return;
      }

      // 3. หากไม่มีโปรไฟล์ในฐานข้อมูลจริงๆ (profile เป็น null)
      if (!profile) {
        // ดึง ID ของร้านค้าแรกในระบบเพื่อเป็นค่าเริ่มต้น
        const { data: stores } = await supabase.from('stores').select('id').limit(1);
        const defaultStoreId = stores && stores.length > 0 ? stores[0].id : null;

        // กำหนดให้ผู้ใช้ใหม่ทุกคนต้องรออนุมัติ (is_approved = false) ยกเว้น Super Admin เท่านั้น
        const shouldAutoApprove = shouldBeSuperAdmin;

        const newProfile = {
          id: user.id,
          email: user.email,
          role: shouldBeSuperAdmin ? 'superadmin' : 'Admin',
          store_id: shouldBeSuperAdmin ? null : defaultStoreId,
          is_approved: shouldAutoApprove,
          is_suspended: false,
          status: 'Active'
        };

        const { error: insertError } = await supabase
          .from('profiles')
          .insert([newProfile]);

        if (!insertError) {
          profile = { role: newProfile.role, store_id: newProfile.store_id, is_approved: newProfile.is_approved, is_suspended: false, status: 'Active' };
        } else {
          console.error("Failed to insert profile:", insertError);
          set({ 
            isAuthenticated: false, 
            isAuthLoading: false, 
            currentUser: null, 
            storeId: null,
            isPendingApproval: true
          });
          return;
        }
      }

      // 4. ตรวจสอบการพักสิทธิ์ผู้ใช้ (is_suspended)
      if (profile.is_suspended && !isSuperAdminEmail) {
        await supabase.auth.signOut();
        set({ 
          isAuthenticated: false, 
          isAuthLoading: false, 
          currentUser: null, 
          storeId: null,
          isUserSuspended: true,
          isStoreSuspended: false,
          isPendingApproval: false
        });
        return;
      }

      // 5. ตรวจสอบสถานะการเปิดใช้งาน (status === 'Inactive')
      if (profile.status === 'Inactive' && !isSuperAdminEmail) {
        await supabase.auth.signOut();
        set({ 
          isAuthenticated: false, 
          isAuthLoading: false, 
          currentUser: null, 
          storeId: null
        });
        toast.error("บัญชีของคุณถูกปิดใช้งานชั่วคราว (Inactive)");
        return;
      }

      // 6. ตรวจสอบสถานะการอนุมัติ (is_approved)
      if (!profile.is_approved && !isSuperAdminEmail) {
        await supabase.auth.signOut();
        set({ 
          isAuthenticated: false, 
          isAuthLoading: false, 
          currentUser: null, 
          storeId: null,
          isPendingApproval: true,
          isUserSuspended: false,
          isStoreSuspended: false
        });
        return;
      }

      // ปรับแต่งบทบาทและร้านค้าให้ถูกต้อง
      let userRole = profile.role || 'Assistant';
      let storeIdFromMetadata = profile.store_id || 'default-store';
      
      if (userRole === 'admin') {
        userRole = 'Admin';
      } else if (userRole === 'staff') {
        userRole = 'Assistant';
      }

      if (isSuperAdminEmail) {
        if (shouldBeSuperAdmin) {
          userRole = 'superadmin';
          storeIdFromMetadata = null;
        } else {
          userRole = 'Admin';
          if (!storeIdFromMetadata || storeIdFromMetadata === 'default-store') {
            const { data: storesData } = await supabase.from('stores').select('id').limit(1);
            storeIdFromMetadata = storesData && storesData.length > 0 ? storesData[0].id : 'default-store';
          }
        }
      }

      // 7. ตรวจสอบการพักสิทธิ์ร้านค้า
      if (storeIdFromMetadata && storeIdFromMetadata !== 'default-store' && userRole !== 'superadmin') {
        const { data: storeData } = await supabase
          .from('stores')
          .select('is_suspended')
          .eq('id', storeIdFromMetadata)
          .single();

        if (storeData && storeData.is_suspended) {
          await supabase.auth.signOut();
          set({ 
            isAuthenticated: false, 
            isAuthLoading: false, 
            currentUser: null, 
            storeId: null,
            isStoreSuspended: true,
            isUserSuspended: false,
            isPendingApproval: false
          });
          return;
        }
      }

      set({ 
        isAuthenticated: true, 
        isAuthLoading: false,
        isPendingApproval: false,
        isUserSuspended: false,
        isStoreSuspended: false,
        currentUser: {
          id: user.id,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: userRole, 
          email: user.email,
          avatar: user.user_metadata?.avatar_url || undefined 
        },
        storeId: userRole === 'superadmin' ? null : storeIdFromMetadata
      });
    } else {
      // Check if we are on login or superadmin page
      const isLoginPage = window.location.pathname === '/login';
      const isSuperAdminPage = window.location.pathname.startsWith('/superadmin');
      
      if (isLoginPage || isSuperAdminPage) {
        set({ 
          isAuthenticated: false, 
          isAuthLoading: false, 
          currentUser: null, 
          storeId: null,
          isPendingApproval: false,
          isUserSuspended: false,
          isStoreSuspended: false
        });
        return;
      }

      // ตรวจสอบว่าเป็น localhost หรือไม่
      const isLocalhost = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' || 
         window.location.hostname.startsWith('192.168.'));

      if (isLocalhost) {
        // ถ้าไม่มี session จาก Supabase ให้ทำการ Auto-login เป็น Admin ทันที เพื่อไม่ให้ติดหน้า Authen ใน Preview
        const mockAdmin = { id: 'admin', name: 'Admin (Auto-login)', role: 'Admin', username: 'admin' };
        set({ 
          isAuthenticated: true, 
          isAuthLoading: false, 
          currentUser: mockAdmin, 
          storeId: 'default-store',
          isPendingApproval: false,
          isUserSuspended: false,
          isStoreSuspended: false
        });
      } else {
        set({ 
          isAuthenticated: false, 
          isAuthLoading: false, 
          currentUser: null, 
          storeId: null,
          isPendingApproval: false,
          isUserSuspended: false,
          isStoreSuspended: false
        });
      }
    }
  },

  verifyPassword: (pass) => {
    const { currentUser, staff } = get();
    if (!currentUser) return false;
    if (currentUser.username === 'superadmin') return pass === 'superadmin';
    if (currentUser.username === 'admin') return pass === '1234';
    const member = staff.find(s => s.username === currentUser.username);
    return member?.password === pass;
  },
  
  logout: async () => {
    await supabase.auth.signOut();
    set({ isAuthenticated: false, currentUser: null, storeId: null, isPendingApproval: false, isUserSuspended: false, isStoreSuspended: false });
  },
});