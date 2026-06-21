import { StateCreator } from 'zustand';
import { AppState } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const createAuthSlice: StateCreator<
  AppState,
  [],
  [],
  Pick<AppState, 'isAuthenticated' | 'isAuthLoading' | 'currentUser' | 'storeId' | 'login' | 'loginWithGoogle' | 'setSession' | 'verifyPassword' | 'logout'>
> = (set, get) => ({
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

          // Sign out immediately so it doesn't count towards concurrent logins or auto-login to dashboard
          await supabase.auth.signOut();

          // Redirect to login with success param
          window.location.href = window.location.origin + '/login?inviteSuccess=true';
          return;
        } catch (err: any) {
          console.error("Error processing invite:", err);
          toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อบัญชี: " + err.message);
        }
      }

      // 1. ดึงข้อมูลโปรไฟล์จริงจากฐานข้อมูล Supabase
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('role, store_id, is_approved, is_suspended, status, full_name, avatar_url')
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
          status: 'Active',
          full_name: user.email?.split('@')[0] || 'User',
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
        };

        const { error: insertError } = await supabase
          .from('profiles')
          .insert([newProfile]);

        if (!insertError) {
          profile = { 
            role: newProfile.role, 
            store_id: newProfile.store_id, 
            is_approved: newProfile.is_approved, 
            is_suspended: false, 
            status: 'Active',
            full_name: newProfile.full_name,
            avatar_url: newProfile.avatar_url
          };
        } else {
          console.error("Failed to insert profile:", insertError);
          set({ 
            isAuthenticated: false, 
            isAuthLoading: false, 
            currentUser: null, 
            storeId: null
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
          storeId: null
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
          storeId: null
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
            storeId: null
          });
          return;
        }
      }

      // 8. ตรวจสอบและจัดการจำนวนผู้ใช้งานพร้อมกัน (Concurrent Login Limit)
      if (storeIdFromMetadata && storeIdFromMetadata !== 'default-store' && userRole !== 'superadmin') {
        try {
          // ลบเซสชันที่หมดอายุ (ไม่มีความเคลื่อนไหวเกิน 5 นาที)
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
          await supabase
            .from('active_sessions')
            .delete()
            .lt('last_active_at', fiveMinutesAgo);

          // ดึงข้อมูลจำนวนผู้ใช้สูงสุดที่อนุญาตให้เข้าสู่ระบบพร้อมกัน
          const { data: storeData } = await supabase
            .from('stores')
            .select('max_users')
            .eq('id', storeIdFromMetadata)
            .single();

          const maxConcurrentUsers = storeData?.max_users || 5;

          // ตรวจสอบว่าผู้ใช้คนนี้มีเซสชันอยู่แล้วหรือไม่
          const { data: existingSession } = await supabase
            .from('active_sessions')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (existingSession) {
            // อัปเดตเวลาความเคลื่อนไหวล่าสุด
            await supabase
              .from('active_sessions')
              .update({ last_active_at: new Date().toISOString() })
              .eq('user_id', user.id);
          } else {
            // นับจำนวนเซสชันที่ใช้งานอยู่ของร้านค้านี้ (ไม่รวมผู้ใช้ปัจจุบัน)
            const { count, error: countError } = await supabase
              .from('active_sessions')
              .select('id', { count: 'exact', head: true })
              .eq('store_id', storeIdFromMetadata);

            if (countError) throw countError;

            if (count !== null && count >= maxConcurrentUsers) {
              // แจ้งเตือนและปฏิเสธการเข้าสู่ระบบ
              await supabase.auth.signOut();
              set({ 
                isAuthenticated: false, 
                isAuthLoading: false, 
                currentUser: null, 
                storeId: null 
              });
              toast.error(`ไม่สามารถเข้าสู่ระบบได้: จำนวนผู้ใช้งานพร้อมกันของร้านค้าเต็มแล้ว (จำกัดสูงสุด ${maxConcurrentUsers} บัญชีพร้อมกัน)`);
              return;
            }

            // บันทึกเซสชันใหม่
            await supabase
              .from('active_sessions')
              .insert([{
                user_id: user.id,
                store_id: storeIdFromMetadata,
                last_active_at: new Date().toISOString()
              }]);
          }
        } catch (sessionErr) {
          console.error("Error managing active session:", sessionErr);
        }
      }

      set({
        isAuthenticated: true,
        currentUser: {
          id: user.id,
          email: user.email,
          name: profile.full_name || user.email?.split('@')[0] || 'User',
          role: userRole,
          avatar: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
        },
        storeId: storeIdFromMetadata,
        isAuthLoading: false
      });
    } else {
      set({
        isAuthenticated: false,
        currentUser: null,
        storeId: null,
        isAuthLoading: false
      });
    }
  },

  verifyPassword: (pass) => {
    return pass === '1234';
  },

  logout: async () => {
    const user = get().currentUser;
    if (user?.id) {
      try {
        // ลบเซสชันออกจาก active_sessions เมื่อออกจากระบบ
        await supabase
          .from('active_sessions')
          .delete()
          .eq('user_id', user.id);
      } catch (err) {
        console.error("Error deleting active session on logout:", err);
      }
    }

    await supabase.auth.signOut();
    set({
      isAuthenticated: false,
      currentUser: null,
      storeId: null
    });
  }
});