"use client";

import React, { useState, useEffect } from "react";
import { useStore, StaffRole, PayrollRecord } from "@/store/useStore";
import { 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  Shield, 
  Percent, 
  CheckCircle2, 
  XCircle, 
  Chrome,
  Edit3,
  User,
  Trash2,
  Sparkles,
  LogOut,
  ChevronRight,
  Copy,
  Clock,
  Wallet,
  CalendarDays,
  Users,
  Check,
  X,
  AlertCircle,
  TrendingUp,
  DollarSign
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import RoleManagementModal from "@/components/RoleManagementModal";
import PayrollModal from "@/components/PayrollModal"; // Import the new PayrollModal
import { format } from "date-fns";

interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  phone: string;
  status: "Active" | "Inactive";
  avatar: string;
  username: string;
  commissionRate: number;
  googleConnected?: boolean;
  googleEmail?: string;
  isPendingInvite?: boolean;
  inviteLink?: string;
}

export default function Staff() {
  const queryClient = useQueryClient();
  const { 
    staff, addStaff, updateStaff, deleteStaff, language, storeId, maxUsers, maxStaff, currentUser, roles, currency,
    addPayrollRecord, updatePayrollRecord, payrollRecords // Destructure new actions and state
  } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);
  const [isRoleManagementOpen, setIsRoleManagementOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [activeTab, setActiveTab] = useState("profiles");

  // Payroll Modal States
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [editingPayrollRecord, setEditingPayrollRecord] = useState<PayrollRecord | null>(null);

  // Form States
  const [name, setName] = useState("");
  const [role, setRole] = useState<StaffRole>("Assistant");
  const [phone, setPhone] = useState("");
  const [commissionRate, setCommissionRate] = useState("0");
  const [email, setEmail] = useState("");

  // Fetch active sessions
  const { data: activeSessions = [], refetch: refetchSessions } = useQuery<any[]>({
    queryKey: ['active_sessions_list', storeId],
    queryFn: async () => {
      if (!storeId || storeId === 'default-store') return [];
      const { data, error } = await supabase
        .from('active_sessions')
        .select('*')
        .eq('store_id', storeId);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000,
    enabled: !!storeId
  });

  // Fetch Attendance Logs
  const { data: attendanceLogs = [] } = useQuery({
    queryKey: ['attendance_logs', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from('attendance_logs' as any)
        .select('*, profiles(full_name, avatar_url)')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) return [];
      return data;
    },
    enabled: !!storeId && activeTab === 'attendance'
  });

  // Fetch Leave Requests
  const { data: leaveRequests = [], refetch: refetchLeaves } = useQuery({
    queryKey: ['leave_requests', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from('leave_requests' as any)
        .select('*, profiles(full_name, avatar_url)')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });
      if (error) return [];
      return data;
    },
    enabled: !!storeId && activeTab === 'attendance'
  });

  // Fetch Commissions Data
  const { data: commissionsData = [], isLoading: commissionsLoading } = useQuery({
    queryKey: ['commissions_list', storeId],
    queryFn: async () => {
      if (!storeId || storeId === 'default-store') return [];
      const { data: txData, error: txError } = await supabase
        .from('sales_transactions')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });
      if (txError) throw txError;
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, commission_rate, avatar_url')
        .eq('store_id', storeId);
      if (profileError) throw profileError;
      return (txData || []).map(tx => {
        const staff = (profileData || []).find(p => p.full_name === tx.staff_name || p.id === tx.staff_id);
        const rate = staff?.commission_rate || 0;
        return {
          ...tx,
          staff_profile: staff,
          calculated_commission: (Number(tx.amount || 0) * rate) / 100,
          commission_rate: rate
        };
      });
    },
    enabled: !!storeId && activeTab === 'commissions'
  });

  // Fetch Payroll Records
  const { data: fetchedPayrollRecords = [], isLoading: payrollLoading, refetch: refetchPayroll } = useQuery<PayrollRecord[]>({
    queryKey: ['payroll_records', storeId],
    queryFn: async () => {
      if (!storeId || storeId === 'default-store') return [];
      const { data, error } = await supabase
        .from('payroll_records' as any)
        .select('*, profiles(full_name, avatar_url, role)')
        .eq('store_id', storeId)
        .order('month', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!storeId && activeTab === 'payroll'
  });

  useEffect(() => {
    // Sync fetched payroll records with Zustand store
    if (fetchedPayrollRecords) {
      useStore.setState({ payrollRecords: fetchedPayrollRecords });
    }
  }, [fetchedPayrollRecords]);

  // Mutation for Approving Payroll
  const approvePayrollMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payroll_records' as any)
        .update({ status: 'paid' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll_records'] });
      toast.success("บันทึกการจ่ายเงินเดือนเรียบร้อยแล้ว");
    },
    onError: (err: any) => {
      toast.error("เกิดข้อผิดพลาด: " + err.message);
    }
  });

  const handleApprovePayroll = (id: string) => {
    if (!window.confirm("ยืนยันการจ่ายเงินเดือนสำหรับพนักงานท่านนี้ใช่หรือไม่?")) return;
    approvePayrollMutation.mutate(id);
  };

  // Mutations for Leave Management
  const updateLeaveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase
        .from('leave_requests' as any)
        .update({ status, approved_by: currentUser?.id })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave_requests'] });
      toast.success("อัปเดตสถานะการลาเรียบร้อยแล้ว");
    },
    onError: (err: any) => {
      toast.error("เกิดข้อผิดพลาด: " + err.message);
    }
  });

  const handleApproveLeave = (id: string) => updateLeaveMutation.mutate({ id, status: 'approved' });
  const handleRejectLeave = (id: string) => updateLeaveMutation.mutate({ id, status: 'rejected' });

  const activeSessionsCount = activeSessions.length;

  const handleForceLogout = async (userId: string, staffName: string) => {
    if (currentUser?.role !== 'Admin' && currentUser?.role !== 'superadmin') {
      toast.error("คุณไม่มีสิทธิ์ในการสั่ง Logout พนักงานคนนี้ (ต้องเป็น Admin เท่านั้น)");
      return;
    }
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการสั่ง Logout เซสชันของ "${staffName}"?`)) return;
    try {
      const { error } = await supabase
        .from('active_sessions')
        .delete()
        .eq('user_id', userId);
      if (error) throw error;
      toast.success(`สั่ง Logout เซสชันของ "${staffName}" เรียบร้อยแล้ว`);
      refetchSessions();
    } catch (err: any) {
      toast.error("เกิดข้อผิดพลาด: " + err.message);
    }
  };

  const activeStaffCount = staff.filter(s => !s.isPendingInvite && s.status === 'Active').length;
  const staffLimit = maxStaff || 10;
  const userLimit = maxUsers || 5;

  const filteredStaff = (staff as any[]).filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }
    const newStaff: Omit<StaffMember, "id"> = {
      name,
      role,
      phone,
      status: "Active",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
      username: email,
      commissionRate: Number(commissionRate) || 0,
    };
    addStaff(newStaff);
    toast.success("เพิ่มพนักงานเรียบร้อยแล้ว");
    resetForm();
    setIsAddOpen(false);
  };

  const handleEditStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    const updated: StaffMember = {
      ...editingStaff,
      name,
      role,
      phone,
      username: email,
      commissionRate: Number(commissionRate) || 0,
    };
    updateStaff(editingStaff.id, updated);
    toast.success("อัปเดตข้อมูลพนักงานเรียบร้อยแล้ว");
    resetForm();
    setEditingStaff(null);
  };

  const handleDeleteStaffMember = (id: string, name: string) => {
    if (currentUser?.role !== 'Admin' && currentUser?.role !== 'superadmin') {
      toast.error("คุณไม่มีสิทธิ์ในการลบพนักงาน (ต้องเป็น Admin เท่านั้น)");
      return;
    }
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบพนักงาน "${name}"?`)) {
      deleteStaff(id);
      toast.success("ลบพนักงานเรียบร้อยแล้ว");
    }
  };

  const resetForm = () => {
    setName("");
    setRole("Assistant");
    setPhone("");
    setCommissionRate("0");
    setEmail("");
  };

  const openEditDialog = (member: StaffMember) => {
    setEditingStaff(member);
    setName(member.name);
    setRole(member.role);
    setPhone(member.phone);
    setCommissionRate(String(member.commissionRate || 0));
    setEmail(member.username || "");
  };

  const toggleStatus = (member: StaffMember) => {
    if (currentUser?.role !== 'Admin' && currentUser?.role !== 'superadmin') {
      toast.error("คุณไม่มีสิทธิ์ในการเปลี่ยนสถานะพนักงาน (ต้องเป็น Admin เท่านั้น)");
      return;
    }
    const updated: StaffMember = {
      ...member,
      status: member.status === "Active" ? "Inactive" : "Active",
    };
    updateStaff(member.id, updated);
    toast.success(`เปลี่ยนสถานะเป็น ${updated.status === "Active" ? "เปิดใช้งาน" : "ปิดใช้งาน"} เรียบร้อยแล้ว`);
  };

  const canManageStaff = currentUser?.role === 'Admin' || currentUser?.role === 'superadmin';

  // Payroll Modal Handlers
  const handleOpenPayrollModal = (record: PayrollRecord | null = null) => {
    setEditingPayrollRecord(record);
    setIsPayrollModalOpen(true);
  };

  const handleSavePayroll = async (data: any) => {
    if (data.id) {
      await updatePayrollRecord(data.id, data);
      toast.success("Payroll record updated successfully!");
    } else {
      await addPayrollRecord(data);
      toast.success("Payroll record created successfully!");
    }
    refetchPayroll(); // Refetch payroll data after save
    setIsPayrollModalOpen(false);
    setEditingPayrollRecord(null);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8F9FD]">
      {/* Header */}
      <header className="px-10 py-8 bg-white border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pl-14 lg:pl-10 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} className="text-[#D9ED5F]" />
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-0.2em">Team Management</p>
          </div>
          <h1 className="text-3xl font-black text-[#1A1F3D]">การจัดการพนักงาน</h1>
          <p className="text-xs text-gray-400 font-bold mt-1">จัดการข้อมูลพนักงาน บทบาทหน้าที่ และค่าคอมมิชชัน</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {canManageStaff && (
            <button 
              onClick={() => setIsRoleManagementOpen(true)}
              className="bg-indigo-50 text-indigo-600 px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-indigo-500/10 active:scale-95 transition-all"
            >
              <Shield size={18} /> จัดการบทบาท
            </button>
          )}
          <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              {canManageStaff && (
                <button className="bg-[#1A1F3D] text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-[#1A1F3D]/10 active:scale-95 transition-all">
                  <Plus size={18} /> เพิ่มพนักงานใหม่
                </button>
              )}
            </DialogTrigger>
            <DialogContent className="rounded-[32px] max-w-md p-8">
              <DialogHeader>
                <DialogTitle className="text-xl font-black text-[#1A1F3D]">เพิ่มพนักงานใหม่</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddStaff} className="space-y-5 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">ชื่อ-นามสกุล *</Label>
                  <input id="name" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all" value={name} onChange={(e) => setName(e.target.value)} placeholder="สมชาย ใจดี" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">อีเมล (Google Account) *</Label>
                  <input id="email" type="email" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="somchai@gmail.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">เบอร์โทรศัพท์</Label>
                  <input id="phone" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0812345678" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">บทบาท</Label>
                    <Select value={role} onValueChange={(value: StaffRole) => setRole(value)}>
                      <SelectTrigger className="border-none bg-[#F5F6FA] rounded-2xl h-12 focus:ring-4 focus:ring-[#1A1F3D]/5 font-bold text-sm">
                        <SelectValue placeholder="เลือกบทบาท" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                        {roles.filter(r => r.name !== 'superadmin').map(r => (
                          <SelectItem key={r.id} value={r.name} className="text-xs font-bold py-3">{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commission" className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">ค่าคอมมิชชัน (%)</Label>
                    <input id="commission" type="number" min="0" max="100" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-3.5 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsAddOpen(false)} className="flex-1 py-4 rounded-2xl text-xs font-black text-gray-400 hover:bg-gray-50 transition-all">ยกเลิก</button>
                  <button type="submit" className="flex-[2] bg-[#1A1F3D] text-white font-black py-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#1A1F3D]/10 active:scale-95 transition-all">บันทึก</button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Tabs List */}
      <div className="px-10 py-4 bg-white border-b border-gray-50 overflow-x-auto scrollbar-hide shrink-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-transparent h-auto p-0 flex gap-4">
            <TabsTrigger value="profiles" className="data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white data-[state=active]:shadow-lg bg-white border border-gray-100 rounded-2xl px-8 py-3 text-xs font-black uppercase tracking-widest transition-all">
              <Users size={16} className="mr-2" /> Profiles & Roles
            </TabsTrigger>
            <TabsTrigger value="attendance" className="data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white data-[state=active]:shadow-lg bg-white border border-gray-100 rounded-2xl px-8 py-3 text-xs font-black uppercase tracking-widest transition-all">
              <CalendarDays size={16} className="mr-2" /> Attendance
            </TabsTrigger>
            <TabsTrigger value="commissions" className="data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white data-[state=active]:shadow-lg bg-white border border-gray-100 rounded-2xl px-8 py-3 text-xs font-black uppercase tracking-widest transition-all">
              <Percent size={16} className="mr-2" /> Commissions
            </TabsTrigger>
            <TabsTrigger value="payroll" className="data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white data-[state=active]:shadow-lg bg-white border border-gray-100 rounded-2xl px-8 py-3 text-xs font-black uppercase tracking-widest transition-all">
              <Wallet size={16} className="mr-2" /> Payroll
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
        <Tabs value={activeTab} className="h-full">
          <TabsContent value="profiles" className="space-y-8 m-0 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Dialog open={isSessionsOpen} onOpenChange={(open: boolean) => { setIsSessionsOpen(open); if (open) refetchSessions(); }}>
                <DialogTrigger asChild>
                  <button className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between text-left hover:shadow-md transition-all cursor-pointer w-full">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                        <Chrome size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-gray-400 mb-0.5">ผู้ใช้งานพร้อมกัน (Concurrent Logins)</p>
                        <h3 className="text-xl font-black text-[#1A1F3D]">
                          {activeSessionsCount} / {userLimit} <span className="text-xs text-gray-400 font-bold">เซสชัน</span>
                        </h3>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className={cn("text-[9px] font-black px-2.5 py-1 rounded-full uppercase", activeSessionsCount >= userLimit ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600")}>{activeSessionsCount >= userLimit ? "เต็มแล้ว" : "ใช้งานได้"}</span>
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent className="rounded-[32px] max-w-md p-8">
                  <DialogHeader><DialogTitle className="text-xl font-black text-[#1A1F3D]">เซสชันที่ใช้งานอยู่ (Active Sessions)</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-4 max-h-[400px] overflow-y-auto scrollbar-hide">
                    {activeSessions.length === 0 ? <p className="text-xs text-gray-400 font-bold text-center py-6 italic">ไม่มีเซสชันที่ใช้งานอยู่</p> : activeSessions.map((session: any) => {
                        const member = staff.find((s: any) => s.id === session.user_id);
                        const staffName = member?.name || "Unknown User";
                        const staffEmail = member?.username || "No Email";
                        const lastActive = session.last_active_at ? new Date(session.last_active_at).toLocaleTimeString() : "N/A";
                        return (
                          <div key={session.id} className="flex items-center justify-between p-4 bg-[#F5F6FA] rounded-2xl">
                            <div className="flex items-center gap-3 min-w-0">
                              <img src={member?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop"} alt={staffName} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                              <div className="min-w-0"><p className="text-xs font-black text-[#1A1F3D] truncate">{staffName}</p><p className="text-[9px] text-gray-400 font-bold truncate">{staffEmail}</p><p className="text-[8px] text-indigo-500 font-bold mt-0.5">Active: {lastActive}</p></div>
                            </div>
                            {canManageStaff && <button type="button" onClick={() => handleForceLogout(session.user_id, staffName)} className="p-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl transition-all shrink-0"><LogOut className="h-4 w-4" /></button>}
                          </div>
                        );
                      })}
                  </div>
                </DialogContent>
              </Dialog>

              <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center"><Shield size={24} /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-0.5">บัญชีพนักงาน (Staff Accounts)</p>
                    <h3 className="text-xl font-black text-[#1A1F3D]">{activeStaffCount} / {staffLimit} <span className="text-xs text-gray-400 font-bold">บัญชี</span></h3>
                  </div>
                </div>
                <div className="text-right"><span className={cn("text-[9px] font-black px-2.5 py-1 rounded-full uppercase", activeStaffCount >= staffLimit ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600")}>{activeStaffCount >= staffLimit ? "เต็มแล้ว" : "ใช้งานได้"}</span></div>
              </div>
            </div>

            <div className="relative max-w-md bg-white rounded-[24px] shadow-sm border border-gray-100/50 overflow-hidden">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input placeholder="ค้นหาพนักงานด้วยชื่อ, บทบาท หรืออีเมล..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-transparent pl-14 pr-6 py-4 text-sm font-bold border-none focus:outline-none focus:ring-0" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredStaff.map((member: any) => {
                const isUserLoggedIn = activeSessions.some((s: any) => s.user_id === member.id);
                return (
                  <div key={member.id} className={cn("bg-white rounded-[40px] p-8 flex flex-col h-full transition-all duration-300 border border-transparent group hover:shadow-2xl hover:border-gray-100 relative", member.status === "Inactive" && "opacity-60 grayscale-0.3")}>
                    <div className="absolute top-6 right-6 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      {member.isPendingInvite && <button onClick={() => { navigator.clipboard.writeText(member.inviteLink || ""); toast.success('คัดลอกลิงก์คำเชิญเรียบร้อยแล้ว!'); }} className="p-2.5 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Copy size={16} /></button>}
                      {canManageStaff && <button onClick={() => handleDeleteStaffMember(member.id, member.name)} className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>}
                    </div>
                    <div className="flex items-center gap-5 mb-6">
                      <div className="relative shrink-0"><img src={member.avatar} alt={member.name} className="w-16 h-16 rounded-[24px] object-cover border-4 border-white shadow-md" /><div className={cn("absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white", isUserLoggedIn ? "bg-green-500" : "bg-red-500")} /></div>
                      <div>
                        <h3 className="text-lg font-black text-[#1A1F3D] mb-1.5 line-clamp-1">{member.name}</h3>
                        <div className="flex flex-wrap gap-1.5">
                          <span className={cn("px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider", member.role === "Admin" ? "bg-blue-50 text-blue-600" : "bg-indigo-50 text-indigo-600")}>{member.role}</span>
                          {member.isPendingInvite ? <span className="px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider bg-amber-50 text-amber-600">Pending Invite</span> : <span className={cn("px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider", member.status === "Active" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600")}>{member.status === "Active" ? "Active" : "Inactive"}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3 text-xs font-bold text-gray-500 border-t border-gray-50 pt-5 mb-6 flex-1">
                      <div className="flex items-center justify-between"><div className="flex items-center gap-3 min-w-0"><Mail className="h-4 w-4 text-gray-300 shrink-0" /><span className="truncate">{member.username}</span></div>{member.isPendingInvite && <button onClick={() => { navigator.clipboard.writeText(member.inviteLink || ""); toast.success('คัดลอกลิงก์คำเชิญเรียบร้อยแล้ว!'); }} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all flex items-center gap-1 text-[10px] font-black uppercase shrink-0"><Copy size={12} /> Copy Link</button>}</div>
                      {member.phone && <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-gray-300 shrink-0" /><span>{member.phone}</span></div>}
                      <div className="flex items-center gap-3"><Percent className="h-4 w-4 text-gray-300 shrink-0" /><span>ค่าคอมมิชชัน: <span className="text-[#1A1F3D] font-black">{member.commissionRate || 0}%</span></span></div>
                      <div className="bg-[#F5F6FA] p-3.5 rounded-2xl flex items-center justify-between mt-4"><div className="flex items-center gap-2"><Chrome className="h-4 w-4 text-blue-500" /><span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Google Calendar</span></div>{member.googleConnected ? <span className="bg-green-50 text-green-700 border border-green-100 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-600" /> Connected</span> : <span className="bg-gray-100 text-gray-400 border border-gray-200 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase flex items-center gap-1"><XCircle className="h-3 w-3 text-gray-400" /> Disconnected</span>}</div>
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-gray-50">
                      <Dialog open={editingStaff?.id === member.id} onOpenChange={(open) => { if (!open) { setEditingStaff(null); resetForm(); } }}>
                        {canManageStaff && <button onClick={() => openEditDialog(member)} className="flex-1 bg-[#F5F6FA] hover:bg-gray-100 text-[#1A1F3D] font-black py-3.5 rounded-2xl text-xs transition-all flex items-center justify-center gap-2"><Edit3 size={14} /> แก้ไขข้อมูล</button>}
                        <DialogContent className="rounded-[32px] max-w-md p-8">
                          <DialogHeader><DialogTitle className="text-xl font-black text-[#1A1F3D]">แก้ไขข้อมูลพนักงาน</DialogTitle></DialogHeader>
                          <form onSubmit={handleEditStaff} className="space-y-5 mt-4">
                            <div className="space-y-2"><Label htmlFor="edit-name" className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">ชื่อ-นามสกุล *</Label><input id="edit-name" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all" value={name} onChange={(e) => setName(e.target.value)} required /></div>
                            <div className="space-y-2"><Label htmlFor="edit-email" className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">อีเมล (Google Account) *</Label><input id="edit-email" type="email" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                            <div className="space-y-2"><Label htmlFor="edit-phone" className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">เบอร์โทรศัพท์</Label><input id="edit-phone" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2"><Label htmlFor="edit-role" className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">บทบาท</Label><Select value={role} onValueChange={(value: StaffRole) => setRole(value)}><SelectTrigger className="border-none bg-[#F5F6FA] rounded-2xl h-12 focus:ring-4 focus:ring-[#1A1F3D]/5 font-bold text-sm"><SelectValue /></SelectTrigger><SelectContent className="rounded-2xl border-gray-100 shadow-2xl">{roles.filter(r => r.name !== 'superadmin').map(r => (<SelectItem key={r.id} value={r.name} className="text-xs font-bold py-3">{r.name}</SelectItem>))}</SelectContent></Select></div>
                              <div className="space-y-2"><Label htmlFor="edit-commission" className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">ค่าคอมมิชชัน (%)</Label><input id="edit-commission" type="number" min="0" max="100" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-3.5 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} /></div>
                            </div>
                            <div className="flex gap-3 pt-4"><button type="button" onClick={() => setEditingStaff(null)} className="flex-1 py-4 rounded-2xl text-xs font-black text-gray-400 hover:bg-gray-50 transition-all">ยกเลิก</button><button type="submit" className="flex-[2] bg-[#1A1F3D] text-white font-black py-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#1A1F3D]/10 active:scale-95 transition-all">บันทึกการเปลี่ยนแปลง</button></div>
                          </form>
                        </DialogContent>
                      </Dialog>
                      {canManageStaff && <button onClick={() => toggleStatus(member)} className={cn("flex-1 font-black py-3.5 rounded-2xl text-xs transition-all active:scale-95 shadow-md", member.status === "Active" ? "bg-red-50 hover:bg-red-100 text-red-600 shadow-red-500/5" : "bg-green-50 hover:bg-green-100 text-green-600 shadow-green-500/5")}>{member.status === "Active" ? "ปิดใช้งาน" : "เปิดใช้งาน"}</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="attendance" className="m-0 h-full animate-in fade-in duration-300">
            <div className="space-y-8">
              <div className="flex justify-between items-end mb-2"><div><h3 className="text-xl font-black text-[#1A1F3D]">คำขออนุมัติการลา (Leave Requests)</h3><p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Pending approval from staff</p></div></div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {leaveRequests.length === 0 ? <div className="col-span-full py-12 text-center bg-white rounded-[32px] border border-dashed border-gray-200 opacity-40"><p className="font-black text-xs uppercase tracking-widest">No pending leave requests</p></div> : leaveRequests.map((request: any) => (
                    <div key={request.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3"><img src={request.profiles?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop"} className="w-10 h-10 rounded-xl object-cover" /><div><p className="text-sm font-black text-[#1A1F3D]">{request.profiles?.full_name}</p><p className="text-[10px] text-indigo-500 font-black uppercase">{request.leave_type}</p></div></div>
                        <span className={cn("px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider", request.status === 'pending' ? "bg-amber-50 text-amber-600" : request.status === 'approved' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600")}>{request.status}</span>
                      </div>
                      <div className="bg-[#F5F6FA] p-4 rounded-2xl space-y-2"><div className="flex items-center gap-2 text-[10px] font-bold text-gray-500"><CalendarDays size={12} /><span>{request.start_date} ถึง {request.end_date}</span></div><p className="text-xs text-gray-600 leading-relaxed italic">"{request.reason || 'ไม่ได้ระบุเหตุผล'}"</p></div>
                      {request.status === 'pending' && canManageStaff && <div className="flex gap-2 pt-2"><button onClick={() => handleApproveLeave(request.id)} className="flex-1 bg-green-500 text-white py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5 shadow-lg shadow-green-500/10 active:scale-95"><Check size={14} /> Approve</button><button onClick={() => handleRejectLeave(request.id)} className="flex-1 bg-red-50 text-red-500 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5 active:scale-95"><X size={14} /> Reject</button></div>}
                    </div>
                  ))}
              </div>
              <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden mt-10">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/20"><div><h3 className="text-xl font-black text-[#1A1F3D]">ประวัติการลงเวลา (Recent Logs)</h3><p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Check-in / Check-out history</p></div></div>
                <div className="overflow-x-auto"><table className="w-full"><thead><tr className="bg-white border-b border-gray-50"><th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">พนักงาน</th><th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">ประเภท</th><th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">เวลา</th><th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">หมายเหตุ / พิกัด</th></tr></thead><tbody className="divide-y divide-gray-50">{attendanceLogs.length === 0 ? <tr><td colSpan={4} className="py-20 text-center opacity-20 font-black">ไม่พบข้อมูลการลงเวลา</td></tr> : attendanceLogs.map((log: any) => (
                          <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-8 py-5 flex items-center gap-3"><img src={log.profiles?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop"} className="w-8 h-8 rounded-lg object-cover" /><span className="text-sm font-bold text-[#1A1F3D]">{log.profiles?.full_name}</span></td>
                            <td className="px-8 py-5 text-center"><span className={cn("px-3 py-1 rounded-lg text-[9px] font-black uppercase", log.type === 'check_in' ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600")}>{log.type === 'check_in' ? 'Check In' : 'Check Out'}</span></td>
                            <td className="px-8 py-5 text-center"><p className="text-xs font-black text-[#1A1F3D]">{format(new Date(log.created_at), 'HH:mm')}</p><p className="text-[9px] text-gray-400 font-bold">{format(new Date(log.created_at), 'dd MMM yyyy')}</p></td>
                            <td className="px-8 py-5"><p className="text-xs text-gray-500">{log.notes || 'Normal Check'}</p><p className="text-[8px] text-gray-300 uppercase font-black">{log.location_name || 'In Shop'}</p></td>
                          </tr>
                        ))}</tbody></table></div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="commissions" className="m-0 h-full animate-in fade-in duration-300">
            <div className="space-y-8">
              {!commissionsLoading && commissionsData.length > 0 && <div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm"><p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">Total Service Sales</p><h2 className="text-3xl font-black text-[#1A1F3D]">{currency}{commissionsData.reduce((acc, curr) => acc + Number(curr.amount || 0), 0).toLocaleString()}</h2></div><div className="bg-[#1A1F3D] p-8 rounded-[40px] shadow-xl relative overflow-hidden"><div className="absolute top-0 right-0 p-6 opacity-10 text-[#D9ED5F]"><TrendingUp size={60} /></div><p className="text-[10px] font-black uppercase text-white/40 tracking-wider mb-2">Total Payout</p><h2 className="text-3xl font-black text-[#D9ED5F]">{currency}{commissionsData.reduce((acc, curr) => acc + curr.calculated_commission, 0).toLocaleString()}</h2></div><div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm"><p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">Avg. Reward Per Job</p><h2 className="text-3xl font-black text-[#1A1F3D]">{currency}{Math.round(commissionsData.reduce((acc, curr) => acc + curr.calculated_commission, 0) / commissionsData.length).toLocaleString()}</h2></div></div>}
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                <div className="flex justify-between items-center"><div><h3 className="text-xl font-black text-[#1A1F3D]">สรุปยอดค่าคอมมิชชัน (Commissions)</h3><p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Earnings based on service performance</p></div></div>
                <div className="overflow-x-auto"><table className="w-full"><thead><tr className="bg-gray-50/50 border-b border-gray-100"><th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">วันที่ / เลขที่สั่งซื้อ</th><th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">พนักงาน</th><th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">ยอดขาย</th><th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">อัตรา (%)</th><th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">รางวัลตอบแทน</th></tr></thead><tbody className="divide-y divide-gray-50">{commissionsLoading ? <tr><td colSpan={5} className="py-20 text-center opacity-40 font-black animate-pulse uppercase text-xs">Loading Commission Data...</td></tr> : commissionsData.length === 0 ? <tr><td colSpan={5} className="py-20 text-center opacity-20 font-black uppercase text-xs tracking-widest">No sales records found</td></tr> : commissionsData.map((tx: any) => (
                          <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-8 py-5"><p className="text-xs font-black text-[#1A1F3D]">{format(new Date(tx.created_at), 'dd MMM yyyy')}</p><p className="text-[9px] text-gray-400 font-bold uppercase">{tx.id}</p></td>
                            <td className="px-8 py-5 flex items-center gap-3"><img src={tx.staff_profile?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop"} className="w-8 h-8 rounded-lg object-cover" /><span className="text-sm font-bold text-[#1A1F3D]">{tx.staff_name || 'Admin'}</span></td>
                            <td className="px-8 py-5 text-right font-black text-[#1A1F3D]">{currency}{Number(tx.amount || 0).toLocaleString()}</td>
                            <td className="px-8 py-5 text-center"><span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{tx.commission_rate}%</span></td>
                            <td className="px-8 py-5 text-right font-black text-green-600">+{currency}{tx.calculated_commission.toLocaleString()}</td>
                          </tr>
                        ))}</tbody></table></div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payroll" className="m-0 h-full animate-in fade-in duration-300">
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/20">
                <div>
                  <h3 className="text-xl font-black text-[#1A1F3D]">ระบบจ่ายเงินเดือน (Payroll)</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Monthly Salary & Commission Summary</p>
                </div>
                {canManageStaff && (
                  <button 
                    onClick={() => handleOpenPayrollModal()}
                    className="bg-[#1A1F3D] text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-[#1A1F3D]/10 active:scale-95 transition-all"
                  >
                    <Plus size={16} /> เพิ่มรายการเงินเดือน
                  </button>
                )}
              </div>
              <div className="overflow-x-auto flex-1 scrollbar-hide">
                <table className="w-full">
                  <thead>
                    <tr className="bg-white border-b border-gray-50">
                      <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">พนักงาน / รอบเดือน</th>
                      <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">ฐานเงินเดือน</th>
                      <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">คอมมิชชัน</th>
                      <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">โบนัส / หัก</th>
                      <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">สุทธิ (Net)</th>
                      <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">สถานะ</th>
                      <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {payrollLoading ? (
                      <tr><td colSpan={7} className="py-20 text-center opacity-40 font-black animate-pulse uppercase text-xs">Loading Payroll Data...</td></tr>
                    ) : payrollRecords.length === 0 ? (
                      <tr><td colSpan={7} className="py-20 text-center opacity-20 font-black uppercase text-xs tracking-widest">No payroll records found</td></tr>
                    ) : (
                      payrollRecords.map((record: any) => {
                        const netSalary = Number(record.basic_salary || 0) + Number(record.commission || 0) + Number(record.bonus || 0) - Number(record.deductions || 0);
                        return (
                          <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-3">
                                <img src={record.profiles?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop"} className="w-10 h-10 rounded-xl object-cover" />
                                <div>
                                  <p className="text-sm font-bold text-[#1A1F3D]">{record.profiles?.full_name}</p>
                                  <p className="text-[10px] text-indigo-500 font-black uppercase">{record.month}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5 text-right text-xs font-bold text-gray-600">{currency}{Number(record.basic_salary || 0).toLocaleString()}</td>
                            <td className="px-8 py-5 text-right text-xs font-bold text-blue-600">{currency}{Number(record.commission || 0).toLocaleString()}</td>
                            <td className="px-8 py-5 text-right">
                              <p className="text-[10px] text-green-600 font-bold">+{currency}{Number(record.bonus || 0).toLocaleString()}</p>
                              <p className="text-[10px] text-red-400 font-bold">-{currency}{Number(record.deductions || 0).toLocaleString()}</p>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <p className="text-lg font-black text-[#1A1F3D]">{currency}{netSalary.toLocaleString()}</p>
                            </td>
                            <td className="px-8 py-5 text-center">
                              <span className={cn(
                                "px-3 py-1 rounded-lg text-[9px] font-black uppercase",
                                record.status === 'paid' ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                              )}>
                                {record.status === 'paid' ? 'Paid' : 'Pending'}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-right">
                              {record.status === 'pending' && canManageStaff && (
                                <div className="flex justify-end gap-2">
                                  <button 
                                    onClick={() => handleApprovePayroll(record.id)}
                                    className="bg-[#1A1F3D] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-[#2A3152] transition-all shadow-md active:scale-95"
                                  >
                                    ชำระเงิน
                                  </button>
                                  <button 
                                    onClick={() => handleOpenPayrollModal(record)}
                                    className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-all"
                                  >
                                    <Edit3 size={16} />
                                  </button>
                                </div>
                              )}
                              {record.status === 'paid' && canManageStaff && (
                                <button 
                                  onClick={() => handleOpenPayrollModal(record)}
                                  className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-all"
                                >
                                  <Edit3 size={16} />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {isRoleManagementOpen && <RoleManagementModal onClose={() => setIsRoleManagementOpen(false)} />}
      
      {isPayrollModalOpen && (
        <PayrollModal
          payrollRecord={editingPayrollRecord}
          onClose={() => setIsPayrollModalOpen(false)}
          onSave={handleSavePayroll}
        />
      )}
    </div>
  );
}