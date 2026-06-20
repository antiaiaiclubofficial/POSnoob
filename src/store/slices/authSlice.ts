import { StateCreator } from 'zustand';
import { AppState, Staff, StaffRole } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AuthSlice {
  isAuthenticated: boolean;
  currentUser: { id: string; name: string; role: StaffRole; email: string } | null;
  isAuthLoading: boolean;
  isPendingApproval?: boolean;
  isUserSuspended?: boolean;
  isStoreSuspended?: boolean;
  storeId: string | null;
  login: (id: string, pass: string) => boolean;
  loginWithGoogle: (redirectTo?: string) => Promise<void>;
  logout: () => void;
  verifyPassword: (pass: string) => boolean;
  setSession: (user: any) => void;
}

export const createAuthSlice: StateCreator<AppState, [], [], AuthSlice> = (set, get) => ({
  isAuthenticated: false,
  currentUser: null,
  isAuthLoading: true,
  isPendingApproval: false,
  isUserSuspended: false,
  isStoreSuspended: false,
  storeId: null,

  // --- DEPRECATED LOCAL LOGIN ---
  // This function is a mock and should be replaced with Supabase authentication.
  // It no longer uses 'username' or 'password' from the Staff interface.
  login: (email, pass) => {
    const staffMembers = get().staff;
    const member = staffMembers.find(s => s.email === email && s.status === 'Active');

    if (member) {
      // In a real application, 'pass' would be verified against a hashed password
      // stored securely via Supabase Auth, not locally.
      // This is a temporary mock for demonstration purposes.
      if (email === 'admin@example.com' && pass === '1234') { // Mock admin login
        const user = { id: member.id, name: member.name, role: member.role, email: member.email };
        set({ isAuthenticated: true, currentUser: user, storeId: 'default-store', isAuthLoading: false });
        return true;
      } else if (member.email === email && pass === 'password') { // Generic mock staff login
        const user = { id: member.id, name: member.name, role: member.role, email: member.email };
        set({ isAuthenticated: true, currentUser: user, storeId: 'default-store', isAuthLoading: false });
        return true;
      }
    }
    set({ isAuthenticated: false, currentUser: null, isAuthLoading: false });
    return false;
  },

  loginWithGoogle: async (redirectTo) => {
    set({ isAuthLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo || window.location.origin,
        },
      });

      if (error) {
        console.error('Google login error:', error);
        toast.error('Google login failed: ' + error.message);
        set({ isAuthLoading: false });
        return;
      }

      // No need to set session here, the onAuthStateChange listener will handle it
      // if (data.user) {
      //   get().setSession(data.user);
      // }
    } catch (error: any) {
      console.error('Google login exception:', error);
      toast.error('An unexpected error occurred during Google login.');
    } finally {
      // isAuthLoading will be set to false by setSession or onAuthStateChange listener
    }
  },

  logout: async () => {
    set({ isAuthLoading: true });
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed: ' + error.message);
      set({ isAuthLoading: false });
    } else {
      set({ isAuthenticated: false, currentUser: null, storeId: null, isAuthLoading: false, isPendingApproval: false, isUserSuspended: false, isStoreSuspended: false });
      toast.success('Logged out successfully!');
    }
  },

  setSession: async (user) => {
    if (!user) {
      set({ isAuthenticated: false, currentUser: null, storeId: null, isAuthLoading: false, isPendingApproval: false, isUserSuspended: false, isStoreSuspended: false });
      return;
    }

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, role, store_id, is_approved, status')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found
        throw profileError;
      }

      if (!profileData) {
        // User exists in auth.users but no profile yet. This might happen for new sign-ups.
        // We can create a basic profile here or redirect to a profile creation page.
        // For now, we'll set them as unapproved and pending profile creation.
        set({
          isAuthenticated: false,
          currentUser: null,
          storeId: null,
          isAuthLoading: false,
          isPendingApproval: true, // Indicate that a profile needs to be created/approved
          isUserSuspended: false,
          isStoreSuspended: false,
        });
        toast.info('Your profile is being set up or awaiting approval.');
        return;
      }

      const staffRole = profileData.role as StaffRole;
      const isApproved = profileData.is_approved;
      const userStatus = profileData.status; // Assuming 'status' in profiles can indicate suspension

      if (userStatus === 'Suspended') {
        set({
          isAuthenticated: false,
          currentUser: null,
          storeId: null,
          isAuthLoading: false,
          isPendingApproval: false,
          isUserSuspended: true,
          isStoreSuspended: false,
        });
        toast.error('Your account has been suspended. Please contact support.');
        return;
      }

      if (!isApproved && staffRole !== 'superadmin') {
        set({
          isAuthenticated: false,
          currentUser: null,
          storeId: null,
          isAuthLoading: false,
          isPendingApproval: true,
          isUserSuspended: false,
          isStoreSuspended: false,
        });
        toast.info('Your account is awaiting approval from an administrator.'); // Changed from toast.warn
        return;
      }

      // Check store suspension (if store_id exists)
      if (profileData.store_id) {
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('is_suspended')
          .eq('id', profileData.store_id)
          .single();

        if (storeError && storeError.code !== 'PGRST116') {
          throw storeError;
        }

        if (storeData && storeData.is_suspended) {
          set({
            isAuthenticated: false,
            currentUser: null,
            storeId: null,
            isAuthLoading: false,
            isPendingApproval: false,
            isUserSuspended: false,
            isStoreSuspended: true,
          });
          toast.error('The store associated with your account has been suspended. Please contact support.');
          return;
        }
      }

      set({
        isAuthenticated: true,
        currentUser: {
          id: profileData.id,
          name: profileData.full_name || user.email || 'Unknown User',
          role: staffRole,
          email: user.email || '',
        },
        storeId: profileData.store_id,
        isAuthLoading: false,
        isPendingApproval: false,
        isUserSuspended: false,
        isStoreSuspended: false,
      });
      // Fetch staff data after successful login and session set
      get().fetchStaff();
    } catch (error: any) {
      console.error('Error setting session or fetching profile:', error.message);
      toast.error('Failed to load user profile: ' + error.message);
      set({ isAuthenticated: false, currentUser: null, storeId: null, isAuthLoading: false, isPendingApproval: false, isUserSuspended: false, isStoreSuspended: false });
    }
  },

  // --- DEPRECATED LOCAL PASSWORD VERIFICATION ---
  // This function is a mock and should be replaced with a secure backend verification
  // if password re-verification is needed, or removed if not.
  verifyPassword: (pass) => {
    const { currentUser, staff } = get();
    if (!currentUser) return false;

    // Mock verification for a hardcoded admin email
    if (currentUser.email === 'admin@example.com') return pass === '1234';

    const member = staff.find(s => s.email === currentUser.email);
    // Since passwords are no longer stored locally, this check is purely illustrative.
    // In a real scenario, this would involve a secure API call to verify the password.
    return !!member; // Returns true if member is found, as we can't verify password locally.
  },
});