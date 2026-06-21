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
        } catch (err: any) {
          console.error("Error processing invite:", err);
          toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อบัญชี: " + err.message);
        }
      }

      // 1. ดึงข้อมูลโปรไฟล์จริงจากฐานข้อมูล Supabase
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('role, store_id, is_approved, is_suspended, status')
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
          status: 'Active'
        };

        const { error: insertError } = await supabase
          .from('profiles')
          .insert([newProfile]);

        if (!insertError) {
          profile = { role: newProfile.role, store_id: newProfile.store_id, is_approved: newProfile.is_approved, is_suspended: false, status: 'Active' };
        } else {
          console.error("Failed to insert profile:", insertError);
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
            storeId: null,
            isStoreSuspended: true,
            isUserSuspended: false,
            isPendingApproval: false
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
  };

  verifyPassword: (pass) => {
    return pass === '1234';
  },

  setSession: (user) => {
    // Handled by the auth listener in App.tsx
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
  },

  addLog: (log) => {
    set((state) => ({
      logs: [{
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        ...log
      }, ...state.logs].slice(0, 100)
    }));
  },

  addReportLog: (log) => {
    set((state) => ({
      reportHistory: [{
        id: `rep-${Date.now()}`,
        timestamp: new Date().toISOString(),
        ...log
      }, ...state.reportHistory]
    }));
  }
});
```eof
```

Now, let's check if there are any other files that restrict user creation based on `max_users`.
In `src/components/StaffModal.tsx`, we have:
```typescript
    const limit = maxUsers || 5;
    const activeStaffCount = allStaff.filter(s => !s.isPendingInvite && s.status === 'Active' && s.id !== (staff?.id || '')).length;

    if (st.status === 'Active' && (!staff || staff.status !== 'Active') && activeStaffCount >= limit) {
      toast.error(
        language === 'th' 
          ? `ไม่สามารถตั้งสถานะเป็นใช้งานได้เนื่องจากจำนวน Active User เต็มแล้ว (${activeStaffCount}/${limit} บัญชี)` 
          : `Cannot set status to Active. Active user limit reached (${activeStaffCount}/${limit} accounts)`
      );
      return;
    }
```
And in `src/pages/Staff.tsx`:
```typescript
  // นับเฉพาะพนักงานที่เปิดใช้งานอยู่ (status === 'Active') และเชื่อมต่อ Google สำเร็จแล้ว (ไม่มีสถานะ isPendingInvite)
  const usedSlots = staff.filter(s => !s.isPendingInvite && s.status === 'Active').length;
  const remainingSlots = Math.max(0, maxUsers - usedSlots);
  const isQuotaFull = usedSlots >= maxUsers;
  const quotaPercentage = Math.min(100, (usedSlots / maxUsers) * 100);
```
And in `src/store/slices/authSlice.ts` (which we just updated, but let's check if there are other places like `addStaff` or `updateStaff` in `src/store/useStore.ts`):
In `src/store/useStore.ts`:
```typescript
  addStaff: async (st) => {
    const currentStoreId = get().storeId;
    const maxUsers = get().maxUsers || 5;
    const activeStaffCount = get().staff.filter(s => !s.isPendingInvite && s.status === 'Active').length;

    if (st.status === 'Active' && activeStaffCount >= maxUsers) {
      toast.error(get().language === 'th' 
        ? `ไม่สามารถเพิ่มพนักงานได้เนื่องจากจำนวน Active User เต็มแล้ว (${activeStaffCount}/${maxUsers} บัญชี)` 
        : `Cannot add staff. Active user limit reached (${activeStaffCount}/${maxUsers} accounts)`
      );
      return;
    }
```
And `updateStaff`:
```typescript
  updateStaff: async (id, st) => {
    const maxUsers = get().maxUsers || 5;
    const currentStaff = get().staff.find(s => s.id === id);
    const activeStaffCount = get().staff.filter(s => !s.isPendingInvite && s.status === 'Active' && s.id !== id).length;

    if (st.status === 'Active' && currentStaff?.status !== 'Active' && activeStaffCount >= maxUsers) {
      toast.error(get().language === 'th' 
        ? `ไม่สามารถเปิดใช้งานพนักงานได้เนื่องจากจำนวน Active User เต็มแล้ว (${activeStaffCount}/${maxUsers} บัญชี)` 
        : `Cannot activate staff. Active user limit reached (${activeStaffCount}/${maxUsers} accounts)`
      );
      return;
    }
```

Since the user wants to change `max_users` from limiting *created* users to limiting *concurrently logged-in* users, we should remove these creation/activation limits from `StaffModal.tsx`, `Staff.tsx`, and `useStore.ts`!
Let's update these files to remove the creation limits and instead display the concurrent login limit information.I will now remove the creation/activation limits from the staff management files (`StaffModal.tsx`, `Staff.tsx`, and `useStore.ts`) since `max_users` is now used exclusively to limit concurrent logins rather than the total number of registered staff accounts. I will also update the UI in `Staff.tsx` to clearly explain that the limit applies to concurrent logins.

Let's update `src/components/StaffModal.tsx` first.

<dyad-write path="src/components/StaffModal.tsx" description="Remove the total registered user limit check from StaffModal">
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, User, Phone, Briefcase, Camera, Percent, Upload, Sparkles } from 'lucide-react';
import { useStore, Staff, StaffRole } from '@/store/useStore';
import { translations } from '@/utils/translations';
import { toast } from 'sonner';

interface StaffModalProps {
  staff?: Staff | null;
  onClose: () => void;
}

const StaffModal = ({ staff, onClose }: StaffModalProps) => {
  const { addStaff, updateStaff, language } = useStore();
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    role: 'Assistant' as StaffRole,
    phone: '',
    status: 'Active' as 'Active' | 'Inactive',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    commissionRate: 0
  });

  useEffect(() => {
    if (staff) {
      setFormData({
        name: staff.name,
        role: staff.role,
        phone: staff.phone,
        status: staff.status,
        avatar: staff.avatar,
        commissionRate: staff.commissionRate || 0
      });
    }
  }, [staff]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error(language === 'th' ? "กรุณากรอกชื่อและเบอร์โทรศัพท์" : "Name and Phone are required");
      return;
    }

    if (staff) {
      updateStaff(staff.id, formData);
      toast.success(language === 'th' ? "อัปเดตข้อมูลพนักงานเรียบร้อย" : "Staff updated successfully");
    } else {
      addStaff(formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-[#1A1F3D]">{staff ? t.editStaff : t.addStaff}</h2>
            <p className="text-xs text-gray-400 font-medium">{t.staffManagement}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto scrollbar-hide">
          {/* Avatar Upload Section */}
          <div className="flex justify-center mb-4">
             <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-24 h-24 rounded-[32px] overflow-hidden border-4 border-[#F5F6FA] shadow-md transition-transform group-hover:scale-105">
                  <img src={formData.avatar} className="w-full h-full object-cover" alt="Staff Avatar" />
                </div>
                <div className="absolute inset-0 bg-[#1A1F3D]/40 rounded-[32px] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white mb-1" size={20} />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#1A1F3D] text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                  <Upload size={12} />
                </div>
             </div>
             <input 
               type="file" 
               ref={fileInputRef} 
               className="hidden" 
               accept="image/*" 
               onChange={handleImageUpload} 
             />
          </div>

          <div className="space-y-4">
            {!staff && (
              <div className="bg-indigo-50/50 p-5 rounded-[28px] border border-indigo-100 flex items-start gap-3 text-indigo-800">
                <Sparkles className="text-indigo-500 shrink-0 mt-0.5" size={16} />
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-wider mb-1">เชื่อมต่อผ่าน Google</p>
                  <p className="text-[11px] font-medium leading-relaxed text-indigo-700">
                    ระบบจะสร้างลิงก์คำเชิญให้โดยอัตโนมัติหลังจากกดเพิ่มพนักงาน เพื่อให้พนักงานนำไปเชื่อมต่อบัญชี Google ของตนเอง
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">{t.profileInfo}</p>
              <div>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input 
                    type="text"
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder={t.employeeFullName}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">{t.role}</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                    <select 
                      className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-10 pr-4 py-3.5 text-xs font-bold appearance-none"
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value as StaffRole})}
                    >
                      <option value="Admin">Admin</option>
                      <option value="Groomer">Groomer</option>
                      <option value="Assistant">Assistant</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">{t.commissionRate}</label>
                  <div className="relative">
                    <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                    <input 
                      type="number"
                      className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-10 pr-4 py-3.5 text-xs font-bold"
                      value={formData.commissionRate}
                      onChange={e => setFormData({...formData, commissionRate: Number(e.target.value)})}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">{t.phone}</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      type="tel"
                      className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      placeholder={t.contactNumber}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">{t.status}</label>
                  <select 
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl px-4 py-3.5 text-xs font-bold appearance-none"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                  >
                    <option value="Active">{t.active}</option>
                    <option value="Inactive">{t.inactive}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <button className="w-full bg-[#1A1F3D] text-white font-black py-4 rounded-2xl shadow-xl shadow-[#1A1F3D]/10 hover:bg-[#2A3152] transition-all mt-4">
            {staff ? t.updateStaffMember : t.addToTeam}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StaffModal;