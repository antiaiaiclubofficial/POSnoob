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

  setSession: async (user, navigate) => { // Added navigate parameter
    if (user) {
      const isSuperAdminPath = window.location.pathname.startsWith('/superadmin');
      const isSuperAdminEmail = user.email === 'antiai.aiclub.official@gmail.com';
      const shouldBeSuperAdmin = isSuperAdminEmail && isSuperAdminPath;

      // Check if there is a pending invitation in localStorage
      const inviteDataStr = localStorage.getItem('pending_invite_data');
      if (inviteDataStr) {
        localStorage.removeItem('pending_invite_data'); // Clear immediately to prevent re-processing
        try {
          const inviteData = JSON.parse(inviteDataStr);
          
          const invitedEmail = inviteData.email || inviteData.username;

          if (!invitedEmail) {
            toast.error("ไม่พบข้อมูลอีเมลผู้รับเชิญในลิงก์คำเชิญนี้");
            await supabase.auth.signOut();
            window.location.href = `${window.location.origin}/login?error=invalid_invite`;
            return;
          }
          
          if (user.email && invitedEmail.trim().toLowerCase() !== user.email.trim().toLowerCase()) {
            toast.error(`อีเมล Google (${user.email}) ไม่ตรงกับอีเมลที่ได้รับเชิญ (${invitedEmail})`);
            await supabase.auth.signOut();
            window.location.href = `${window.location.origin}/login?error=email_mismatch`;
            return;
          }
          
          const googleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`;
          
          // This upsert is the critical part for auto-approval via invite
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
              base_salary: Number(inviteData.baseSalary || 15000),
              is_approved: true, // This is already correctly set to true for invite flow
              is_suspended: false,
              status: 'Active',
              avatar_url: googleAvatar
            });

          if (upsertError) throw upsertError;
          
          toast.success("เชื่อมต่อบัญชี Google และเข้าร่วมทีมสำเร็จ!", { id: 'invite-success' });

          await supabase.auth.signOut();
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

          const isRegisteredViaInvite = window.location.search.includes('registered=true');
          const inviteDataFromStorage = localStorage.getItem('pending_invite_data'); // Re-check for invite data
          let parsedInviteData = null;
          if (inviteDataFromStorage) {
            try {
              parsedInviteData = JSON.parse(inviteDataFromStorage);
            } catch (e) {
              console.error("Error parsing pending_invite_data from localStorage:", e);
            }
          }

          const shouldAutoApprove = shouldBeSuperAdmin || (isRegisteredViaInvite && parsedInviteData); // Auto-approve if superadmin or if it's an invite registration
          const assignedRole = shouldBeSuperAdmin ? 'superadmin' : (parsedInviteData?.role || 'Admin');
          const assignedStoreId = shouldBeSuperAdmin ? null : (parsedInviteData?.storeId || defaultStoreId);
          const assignedFullName = parsedInviteData?.name || user.email?.split('@')[0] || 'User';
          const assignedAvatar = parsedInviteData?.avatar || googleAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`;

          const newProfile = {
            id: user.id,
            email: user.email,
            role: assignedRole,
            store_id: assignedStoreId,
            is_approved: shouldAutoApprove, // Set approval based on logic
            is_suspended: false,
            status: 'Active',
            full_name: assignedFullName,
            avatar_url: assignedAvatar
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
            storeId: assignedStoreId,
            isAuthLoading: false,
            isPendingApproval: !shouldAutoApprove,
            isUserSuspended: false,
            isStoreSuspended: false
          });
          // Clear the 'registered=true' flag from URL after processing
          if (isRegisteredViaInvite) {
            navigate(window.location.pathname, { replace: true });
          }
          return;
        }

        // Existing profile logic
        if (!profile.is_suspended && !profile.is_approved && !shouldBeSuperAdmin) { // Added !profile.is_suspended check
          const isRegisteredViaInvite = window.location.search.includes('registered=true');
          if (isRegisteredViaInvite) {
            // This block is for existing unapproved users who *just* completed an invite flow.
            // This is a fallback/re-confirmation. The initial upsert in the inviteDataStr block
            // should have already set is_approved: true.
            // If we reach here and profile.is_approved is still false, it means the upsert failed
            // or there's a race condition. We try to approve it again.
            const { error: updateApprovalError } = await supabase
              .from('profiles')
              .update({ is_approved: true, status: 'Active' })
              .eq('id', user.id);
            if (updateApprovalError) throw updateApprovalError;
            
            profile.is_approved = true; // Update local profile object for current session
            profile.status = 'Active';
            navigate(window.location.pathname, { replace: true }); // Clear the flag
          } else {
            // This is the original path for unapproved users not from an invite.
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
        }
        
        // Handle suspended users (already done above, but ensuring consistency)
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
    // This is a placeholder. In a real app, you'd hash passwords and compare securely.
    // For now, it checks against hardcoded admin/superadmin or staff in store.
    const staffMember = get().staff.find(s => s.id === get().currentUser?.id);
    if (staffMember && staffMember.password === pass) {
      return true;
    }
    if (get().currentUser?.id === 'admin' && pass === '1234') return true;
    if (get().currentUser?.id === 'superadmin' && pass === 'superadmin') return true;
    return false;
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
    get().addLog({ staffName: get().currentUser?.name || 'System', action: 'Logout', details: 'User logged out', type: 'info' });
  }
});