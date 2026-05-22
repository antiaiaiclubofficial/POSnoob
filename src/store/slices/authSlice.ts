"use client";

import { StateCreator } from 'zustand';
import { AppState } from '../types';
import { supabase } from '@/integrations/supabase/client';

export const createAuthSlice: StateCreator<AppState, [], [], Pick<AppState, 'isAuthenticated' | 'isAuthLoading' | 'currentUser' | 'setSession' | 'login' | 'loginWithGoogle' | 'logout'>> = (set, get) => ({
  isAuthenticated: false,
  isAuthLoading: true,
  currentUser: null,

  setSession: (user) => {
    if (user) {
      // Find matching staff member
      const member = get().staff.find(s => s.username === user.email);
      set({ 
        isAuthenticated: true, 
        isAuthLoading: false, 
        currentUser: member || null 
      });
      
      if (member) {
        get().addLog({
          id: Math.random().toString(),
          timestamp: new Date().toISOString(),
          action: 'Login Success',
          details: `Staff member ${member.name} logged in`,
          staffName: member.name,
          type: 'success'
        });
      }
    } else {
      set({ isAuthenticated: false, isAuthLoading: false, currentUser: null });
    }
  },

  login: (id, pass) => {
    const member = get().staff.find(s => s.username === id && s.password === pass);
    if (member) {
      set({ isAuthenticated: true, currentUser: member });
      return true;
    }
    return false;
  },

  loginWithGoogle: async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ isAuthenticated: false, currentUser: null });
  }
});