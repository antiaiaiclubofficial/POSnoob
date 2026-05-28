import { StateCreator } from 'zustand';
import { AppState, StaffRole } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const createAuthSlice: StateCreator<AppState, [], [], Pick<AppState, 'isAuthenticated' | 'isAuthLoading' | 'currentUser' | 'storeId' | 'login' | 'loginWithGoogle' | 'setSession' | 'verifyPassword' | 'logout'>> = (set, get) => ({
  isAuthenticated: false,
  isAuthLoading: true,
  currentUser: null,
  storeId: null,

  login: (id, pass) => {
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

  loginWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          prompt: 'select_account'
        },
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
  },

  setSession: async (user) => {
    if (user) {
      set({ isAuthLoading: true });
      try {
        // ตรวจสอบว่าอีเมลนี้มีอยู่ในตาราง staff ของ Supabase หรือไม่
        const { data: staffMember, error } = await supabase
          .from('staff')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();

        if (error) {
          console.error("Error checking staff authorization:", error);
        }

        // อนุญาตเฉพาะอีเมลที่มีในตาราง staff และมีสถานะ Active
        const isAllowed = !!staffMember && staffMember.status === 'Active';

        if (!isAllowed) {
          await supabase.auth.signOut();
          set({ isAuthenticated: false, isAuthLoading: false, currentUser: null, storeId: null });
          toast.error("บัญชีนี้ไม่มีสิทธิ์เข้าใช้งานระบบ กรุณาติดต่อผู้ดูแลระบบเพื่อลงทะเบียน");
          return;
        }

        const storeIdFromMetadata = user.user_metadata?.store_id || 'default-store';
        set({ 
          isAuthenticated: true, 
          isAuthLoading: false,
          currentUser: {
            id: user.id,
            name: staffMember?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            role: (staffMember?.role || 'Admin') as StaffRole, 
            email: user.email,
            avatar: user.user_metadata?.avatar_url || undefined 
          },
          storeId: storeIdFromMetadata
        });
      } catch (err) {
        console.error("Auth check failed:", err);
        await supabase.auth.signOut();
        set({ isAuthenticated: false, isAuthLoading: false, currentUser: null, storeId: null });
        toast.error("เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์การเข้าใช้งาน");
      }
    } else {
      set({ isAuthenticated: false, isAuthLoading: false, currentUser: null, storeId: null });
    }
  },

  verifyPassword: (pass) => {
    const { currentUser, staff } = get();
    if (!currentUser) return false;
    if (currentUser.username === 'admin') return pass === '1234';
    const member = staff.find(s => s.username === currentUser.username);
    return member?.password === pass;
  },
  
  logout: async () => {
    await supabase.auth.signOut();
    set({ isAuthenticated: false, currentUser: null, storeId: null });
  },
});