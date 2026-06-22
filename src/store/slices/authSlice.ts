"use client";

import { StateCreator } from 'zustand';
import { AppState } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const createAuthSlice: StateCreator<
  AppState,
  [],
  [],
  Pick<AppState, 'isAuthenticated' | 'isAuthLoading' | 'currentUser' | 'storeId' | 'isPendingApproval' | 'isUserSuspended' | 'isStoreSuspended' | 'login' | 'loginWithGoogle' | 'setSession' | 'verifyPassword' | 'logout'>
> = (set, get) => ({
  isAuthenticated: false,
  isAuthLoading: true,
  currentUser: null,
  storeId: null,
  isPendingApproval: false,
  isUserSuspended: false,
  isStoreSuspended: false,

  login: (id, pass) => {
    if (id === 'superadmin' && pass === 'superadmin') {
      const user = { id: 'superadmin', name: 'System Owner', role: 'superadmin', username: 'superadmin' };
      set({ 
        isAuthenticated: true, 
        currentUser: user, 
        storeId: null, 
        isAuthLoading: false,
        isPendingApproval: false,
        isUserSuspended: false,
        isStoreSuspended: false
      });
      get().addLog({ staffName: 'System', action: 'Login Success', details: 'Super Administrator logged into the system', type: 'success' });
      return true;
    }
    const member = get().staff.find(s => s.username === id && s.password === pass && s.status === 'Active');
    if (member) {
      const user = { id: member.id, name: member.name, role: member.role, username: member.username };
      set({ 
        isAuthenticated: true, 
        currentUser: user, 
        storeId: 'default-store', 
        isAuthLoading: false,
        isPendingApproval: false,
        isUserSuspended: false,
        isStoreSuspended: false
      });
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
        queryParams: { prompt: 'select_account' }
      },
    });
    if (error) toast.error(error.message);
  },

  setSession: async (user) => {
    if (user) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, store_id, is_approved, is_suspended, status, full_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!profile) {
          set({ isAuthenticated: false, isAuthLoading: false, isPendingApproval: true });
          return;
        }

        if (profile.is_suspended) {
          await supabase.auth.signOut();
          set({ isAuthenticated: false, isAuthLoading: false, isUserSuspended: true });
          return;
        }

        if (!profile.is_approved) {
          await supabase.auth.signOut();
          set({ isAuthenticated: false, isAuthLoading: false, isPendingApproval: true });
          return;
        }

        set({
          isAuthenticated: true,
          currentUser: {
            id: user.id,
            email: user.email,
            name: profile.full_name || user.email?.split('@')[0],
            role: profile.role,
            avatar: profile.avatar_url
          },
          storeId: profile.store_id,
          isAuthLoading: false,
          isPendingApproval: false
        });
      } catch (err) {
        set({ isAuthLoading: false });
      }
    } else {
      set({ isAuthenticated: false, isAuthLoading: false, currentUser: null });
    }
  },

  verifyPassword: (pass) => pass === '1234',

  logout: async () => {
    await supabase.auth.signOut();
    set({ isAuthenticated: false, currentUser: null, storeId: null, isPendingApproval: false });
  }
});