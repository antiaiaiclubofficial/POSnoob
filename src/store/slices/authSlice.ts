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

      // 1. ดึงข้อมูลโปรไฟล์จริงจากฐานข้อมูล Supabase
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('role, store_id, is_approved, is_suspended')
        .eq('id', user.id)
        .maybeSingle();

      // 2. หากเกิดข้อผิดพลาดในการดึงข้อมูล (เช่น ปัญหาเครือข่าย) ให้หยุดทำงานเพื่อความปลอดภัย ห้ามเขียนทับหรือล้างเซสชัน
      if (error) {
        console.error("Error fetching profile:", error);
        set({ isAuthLoading: false });
        return;
      }

      // 3. หากไม่มีโปรไฟล์ในฐานข้อมูลจริงๆ (profile เป็น null และไม่มี error)
      if (!profile) {
        // ดึง ID ของร้านค้าแรกในระบบเพื่อเป็นค่าเริ่มต้น
        const { data: stores } = await supabase.from('stores').select('id').limit(1);
        const defaultStoreId = stores && stores.length > 0 ? stores[0].id : null;

        const newProfile = {
          id: user.id,
          email: user.email,
          role: shouldBeSuperAdmin ? 'superadmin' : 'Admin',
          store_id: shouldBeSuperAdmin ? null : defaultStoreId,
          is_approved: shouldBeSuperAdmin ? true : false, // ผู้ใช้ทั่วไปต้องรออนุมัติ
          is_suspended: false
        };

        // ใช้ insert แทน upsert เพื่อป้องกันการเขียนทับข้อมูลเดิมโดยเด็ดขาด
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([newProfile]);

        if (!insertError) {
          profile = { role: newProfile.role, store_id: newProfile.store_id, is_approved: newProfile.is_approved, is_suspended: false };
        } else {
          console.error("Failed to insert profile:", insertError);
          // หาก insert ไม่สำเร็จ ให้ถือว่ายังไม่ได้รับการอนุมัติเพื่อความปลอดภัย
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

      // 5. ตรวจสอบสถานะการอนุมัติ (is_approved)
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
      
      // แปลงบทบาทตัวพิมพ์เล็กให้ตรงกับระบบสิทธิ์
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

      // 6. ตรวจสอบการพักสิทธิ์ร้านค้า
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
      const current = get().currentUser;
      if (current && (current.id === 'superadmin' || current.id === 'admin' || get().staff.some(s => s.id === current.id))) {
        set({ isAuthLoading: false });
        return;
      }
      set({ isAuthenticated: false, isAuthLoading: false, currentUser: null, storeId: null });
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