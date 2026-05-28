import { StateCreator } from 'zustand';
import { AppState } from '../types';
import { supabase } from '@/integrations/supabase/client';

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
      // ดึงข้อมูลโปรไฟล์จากฐานข้อมูลเพื่อตรวจสอบบทบาทจริง (เช่น superadmin)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, store_id')
        .eq('id', user.id)
        .single();

      const userRole = profile?.role || 'staff';
      const storeIdFromMetadata = profile?.store_id || user.user_metadata?.store_id || 'default-store';
      
      set({ 
        isAuthenticated: true, 
        isAuthLoading: false,
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
    set({ isAuthenticated: false, currentUser: null, storeId: null });
  },
});