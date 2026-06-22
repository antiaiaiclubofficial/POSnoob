"use client";

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
    if (id === 'admin' && pass === '1234') {
      const user = { id: 'admin', name: 'Admin', role: 'Admin', username: 'admin' };
      set({ 
        isAuthenticated: true, 
        currentUser: user, 
        storeId: 'default-store', 
        isAuthLoading: false,
        isPendingApproval: false,
        isUserSuspended: false,
        isStoreSuspended: false
      });
      get().addLog({ staffName: 'System', action: 'Login Success', details: 'Super Admin logged into the system', type: 'success' });
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
        queryParams: {
          prompt: 'select_account' // Force Google to show account selection to prevent auto-login with wrong account
        }
      },
    });
    if (error) {
      toast.error(error.message, { id: 'google-login-error' });
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
        // Remove it immediately to prevent race conditions from multiple setSession calls
        localStorage.removeItem('pending_invite_data');
        try {
          const inviteData = JSON.parse(inviteDataStr);
          
          // Get the invited email from either 'email' or 'username' (for backward compatibility)
          const invitedEmail = inviteData.email || inviteData.username;

          if (!invitedEmail) {
            toast.error("ไม่พบข้อมูลอีเมลผู้รับเชิญในลิงก์คำเชิญนี้");
            await supabase.auth.signOut();
            window.location.href = `${window.location.origin}/login?error=invalid_invite`;
            return;
          }
          
          // Verify that the Google Account email matches the invited email exactly
          if (user.email && invitedEmail.trim().toLowerCase() !== user.email.trim().toLowerCase()) {
            toast.error(`อีเมล Google (${user.email}) ไม่ตรงกับอีเมลที่ได้รับเชิญ (${invitedEmail})`);
            await supabase.auth.signOut();
            window.location.href = `${window.location.origin}/login?error=email_mismatch`;
            return;
          }
          
          const googleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`;
          
          // Create or update profile with invite data
          const { error: upsertError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email,
              role: inviteData.role === 'Admin' ? 'admin' : inviteData.role === 'Assistant' ? 'staff' : inviteData.role,
              store_id: inviteData.storeId,
              full_name: inviteData.name,
              phone: inviteData.phone,
              commission_rate: Number(inviteData.commissionRate || 0),
              is_approved: true,
              is_suspended: false,
              status: 'Active',
              avatar_url: googleAvatar
            });

          if (upsertError) throw upsertError;
          
          toast.success("เชื่อมต่อบัญชี Google และเข้าร่วมทีมสำเร็จ!", { id: 'invite-success' });

          // Sign out immediately so they can log in with their newly linked Google account
          await supabase.auth.signOut();

          // Redirect to login page with success message
          window.location.href = `${window.location.origin}/login?registered=true`;
          return;
        } catch (error: any) {
          console.error("LIFF Registration Error:", error);
          toast.error("เกิดข้อผิดพลาดในการลงทะเบียน: " + error.message);
        }
      }

      // Normal session handling
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, store_id, is_approved, is_suspended, status, full_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        const googleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;

        if (!profile) {
          // Create a new profile for first-time Google sign-in
          const { data: stores } = await supabase.from('stores').select('id').limit(1);
          const defaultStoreId = stores && stores.length > 0 ? stores[0].id : null;

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
            avatar_url: googleAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
          };

          const { error: insertError } = await supabase
            .from('profiles')
            .insert([newProfile]);

          if (insertError) throw insertError;

          set({
            isAuthenticated: shouldAutoApprove,
            currentUser: shouldAutoApprove ? {
              id: user.id,
              email: user.email,
              name: newProfile.full_name,
              role: newProfile.role,
              avatar: newProfile.avatar_url
            } : null,
            storeId: shouldAutoApprove ? null : defaultStoreId,
            isAuthLoading: false,
            isPendingApproval: !shouldAutoApprove,
            isUserSuspended: false,
            isStoreSuspended: false
          });
          return;
        }

        if (profile.is_suspended && !isSuperAdminEmail) {
          await supabase.auth.signOut();
          set({ 
            isAuthenticated: false, 
            isAuthLoading: false, 
            currentUser: null, 
            storeId: null,
            isUserSuspended: true,
            isPendingApproval: false,
            isStoreSuspended: false
          });
          return;
        }

        if (!profile.is_approved && !shouldBeSuperAdmin) {
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

        // Update avatar if Google avatar is newer/available
        if (googleAvatar && googleAvatar !== profile.avatar_url) {
          await supabase
            .from('profiles')
            .update({ avatar_url: googleAvatar })
            .eq('id', user.id);
        }

        let userRole = profile.role;
        let storeId = profile.store_id;

        if (shouldBeSuperAdmin) {
          userRole = 'superadmin';
          storeId = null;
        }

        // Upsert active session to prevent immediate logout
        if (storeId && storeId !== 'default-store' && userRole !== 'superadmin') {
          try {
            await supabase
              .from('active_sessions')
              .upsert({
                user_id: user.id,
                store_id: storeId,
                last_active_at: new Date().toISOString()
              });
          } catch (err) {
            console.error("Failed to upsert active session:", err);
          }
        }

        set({
          isAuthenticated: true,
          currentUser: {
            id: user.id,
            email: user.email,
            name: profile.full_name || user.email?.split('@')[0],
            role: userRole,
            avatar: googleAvatar || profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
          },
          storeId: storeId,
          isAuthLoading: false,
          isPendingApproval: false,
          isUserSuspended: false,
          isStoreSuspended: false
        });
      } catch (err: any) {
        console.error("Error in setSession:", err);
        set({ isAuthLoading: false });
      }
    } else {
      set({
        isAuthenticated: false,
        currentUser: null,
        storeId: null,
        isAuthLoading: false,
        isPendingApproval: false,
        isUserSuspended: false,
        isStoreSuspended: false
      });
    }
  },

  verifyPassword: (pass) => {
    return pass === '1234';
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({
      isAuthenticated: false,
      currentUser: null,
      storeId: null,
      isAuthLoading: false,
      isPendingApproval: false,
      isUserSuspended: false,
      isStoreSuspended: false
    });
  }
});