"use client";

import { StateCreator } from 'zustand';
import { AppState, Staff } from '../types';
import { supabase } from '@/integrations/supabase/client';

export const createAuthSlice: StateCreator<AppState, [], [], Pick<AppState, 'isAuthenticated' | 'isAuthLoading' | 'currentUser' | 'storeId' | 'login' | 'loginWithGoogle' | 'setSession' | 'verifyPassword' | 'logout'>> = (set, get) => ({
  isAuthenticated: false,
  isAuthLoading: true,
  currentUser: null,
  storeId: null,

  login: (id, pass) => {
    if (id === 'admin' && pass === '1234') {
      const user: Staff = { 
        id: 'admin', 
        name: 'Admin', 
        role: 'Admin', 
        username: 'admin',
        phone: '000-000-0000',
        status: 'Active',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'
      };
      set({ isAuthenticated: true, currentUser: user, storeId: 'default-store', isAuthLoading: false });
      get().addLog({ staffName: 'System', action: 'Login Success', details: 'Super Admin logged into the system', type: 'success' });
      return true;
    }
    const member = get().staff.find(s => s.username === id && s.password === pass && s.status === 'Active');
    if (member) {
      set({ isAuthenticated: true, currentUser: member, storeId: 'default-store', isAuthLoading: false });
      get().addLog({ staffName: 'System', action: 'Login Success', details: `Staff member ${member.name} logged in`, type: 'success' });
      return true;
    }
    return false;
  },

  loginWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) throw error;
  },

  setSession: (user) => {
    if (user) {
      const storeIdFromMetadata = user.user_metadata?.store_id || 'default-store';
      const currentUser: Staff = {
        id: user.id,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        role: 'Admin', 
        email: user.email,
        avatar: user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
        status: 'Active',
        phone: 'N/A'
      };
      set({ 
        isAuthenticated: true, 
        isAuthLoading: false,
        currentUser: currentUser,
        storeId: storeIdFromMetadata
      });
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