"use client";

import React, { useState, useEffect } from "react";
import { useStore, StaffRole } from "@/store/useStore";
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
  DollarSign,
  Settings
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import StaffSettingsModal from "@/components/StaffSettingsModal";
import PayrollTab from "@/components/PayrollTab";
import ScheduleTab from "@/components/ScheduleTab";
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
  baseSalary?: number;
  googleConnected?: boolean;
  googleEmail?: string;
  isPendingInvite?: boolean;
  inviteLink?: string;
}

export default function Staff() {
  const queryClient = useQueryClient();
  const { staff, addStaff, updateStaff, deleteStaff, language, storeId, maxUsers, maxStaff, currentUser, roles, currency } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [activeTab, setActiveTab] = useState("profiles");

  // Form States
  const [name, setName] = useState("");
  const [role, setRole] = useState<StaffRole>("Assistant");
  const [phone, setPhone] = useState("");
  const [commissionRate, setCommissionRate] = useState("0");
  const [baseSalary, setBaseSalary] = useState("15000");
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
      commissionRate: Number(commissionRate || 0),
      baseSalary: Number(baseSalary || 15000),
      googleConnected: false,
      googleEmail: '',
      isPendingInvite: false
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
      baseSalary: Number(baseSalary) || 0,
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
    setBaseSalary("15000");
    setEmail("");
  };

  const openEditDialog = (member: StaffMember) => {
    setEditingStaff(member);
    setName(member.name);
    setRole(member.role);
    setPhone(member.phone);
    setCommissionRate(String(member.commissionRate || 0));
    setBaseSalary(String(member.baseSalary || 15000));
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

        <div className="flex flex-wrap items-center gap-3">
          <Dialog open={isSessionsOpen} onOpenChange={(open: boolean) => { setIsSessionsOpen(open); if (open) refetchSessions(); }}>
            <DialogTrigger asChild>
              <button className="bg-gradient-to-br from-white to-indigo-50/10 p-2.5 px-4 rounded-2xl shadow-[0_10px_25px_rgba(24,35,74,0.03)] hover:shadow-[0_15px_30px_rgba(24,35,74,0.06)] flex items-center justify-between text-left hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer w-[220px] group relative overflow-hidden border-none shrink-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none" />
                <div className="flex items-center gap-2.5 z-10">
                  <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/10 shrink-0">
                    <Chrome size={15} className="group-hover:rotate-12 transition-transform duration-300" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black uppercase text-indigo-500/80 tracking-wider mb-0.5">Concurrent Logins</p>
                    <h3 className="text-xs font-black text-[#1A1F3D] leading-none">
                      {activeSessionsCount} <span className="text-[9px] text-gray-400 font-bold">/ {userLimit}</span>
                    </h3>
                  </div>
                </div>
                <div className="text-right flex items-center gap-1 z-10">
                  <span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider", activeSessionsCount >= userLimit ? "bg-red-50 text-red-600" : "bg-indigo-50 text-indigo-600")}>
                    {activeSessionsCount >= userLimit ? "เต็ม" : "ว่าง"}
                  </span>
                  <ChevronRight size={12} className="text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            </DialogTrigger>
            <DialogContent className="bg-white/90 backdrop-blur-xl border-none shadow-[0_20px_40px_rgba(24,35,74,0.08)] rounded-[32px] max-w-md p-8">
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
                      {canManageStaff && <button type="button" onClick={() => handleForceLogout(session.user_id, staffName)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><LogOut className="h-4 w-4" /></button>}
                    </div>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>

          <div className="bg-gradient-to-br from-white to-emerald-50/10 p-2.5 px-4 rounded-2xl shadow-[0_10px_25px_rgba(24,35,74,0.03)] flex items-center justify-between text-left w-[200px] relative overflow-hidden border-none shrink-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none" />
            <div className="flex items-center gap-2.5 z-10">
              <div className="w-8 h-8 bg-gradient-to-tr from-emerald-500 to-teal-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/10 shrink-0"><Shield size={15} /></div>
              <div>
                <p className="text-[8px] font-black uppercase text-emerald-600 tracking-wider mb-0.5">Staff Accounts</p>
                <h3 className="text-xs font-black text-[#1A1F3D] leading-none">{activeStaffCount} <span className="text-[9px] text-gray-400 font-bold">/ {staffLimit}</span></h3>
              </div>
            </div>
            <div className="text-right z-10">
              <span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider", activeStaffCount >= staffLimit ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600")}>
                {activeStaffCount >= staffLimit ? "เต็ม" : "ว่าง"}
              </span>
            </div>
          </div>
          {canManageStaff && (
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="bg-[#F5F6FA] text-[#1A1F3D] hover:bg-gray-100 px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl active:scale-95 transition-all border border-gray-100"
            >
              <Settings size={18} /> ตั้งค่าระบบพนักงาน
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
                    <Label htmlFor="baseSalary" className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">ฐานเงินเดือน (บาท)</Label>
                    <input id="baseSalary" type="number" min="0" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-3.5 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commission" className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">ค่าคอมมิชชัน (%)</Label>
                  <input id="commission" type="number" min="0" max="100" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-3.5 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsAddOpen(false)} className="flex-1 py-4 rounded-2xl text-xs font-black text-gray-400">ยกเลิก</button>
                  <button type="submit" className="flex-[2] bg-[#1A1F3D] text-white font-black py-4 rounded-2xl">เพิ่มพนักงาน</button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="px-10 py-4 bg-white border-b border-gray-50 flex gap-2 overflow-x-auto scrollbar-hide shrink-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-transparent h-auto p-0 flex gap-4 justify-start">
            <TabsTrigger value="profiles" className="data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white data-[state=active]:shadow-lg bg-white border border-gray-100 rounded-2xl px-8 py-3 text-xs font-black uppercase tracking-widest transition-all">
              <Users size={16} className="mr-2" /> Profiles & Roles
            </TabsTrigger>
            <TabsTrigger value="attendance" className="data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white data-[state=active]:shadow-lg bg-white border border-gray-100 rounded-2xl px-8 py-3 text-xs font-black uppercase tracking-widest transition-all">
              <CalendarDays size={16} className="mr-2" /> Attendance
            </TabsTrigger>
            <TabsTrigger value="schedule" className="data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white data-[state=active]:shadow-lg bg-white border border-gray-100 rounded-2xl px-8 py-3 text-xs font-black uppercase tracking-widest transition-all">
              <CalendarDays size={16} className="mr-2" /> Shift & Schedule
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
                      <div className="bg-[#F5F6FA] p-3.5 rounded-2xl flex items-center justify-between mt-4"><div className="flex items-center gap-2"><Chrome className="h-4 w-4 text-blue-500" /><span className="text-xs font-bold">Google Account</span></div>{member.googleConnected ? <span className="text-[10px] font-black text-green-600 uppercase flex items-center gap-1"><CheckCircle2 size={12} /> Connected</span> : <span className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1"><XCircle size={12} /> Unlinked</span>}</div>
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
                              <div className="space-y-2"><Label htmlFor="edit-baseSalary" className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">ฐานเงินเดือน (บาท)</Label><input id="edit-baseSalary" type="number" min="0" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-3.5 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} /></div>
                            </div>
                            <div className="space-y-2"><Label htmlFor="edit-commission" className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">ค่าคอมมิชชัน (%)</Label><input id="edit-commission" type="number" min="0" max="100" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-3.5 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} /></div>
                            <div className="flex gap-3 pt-4"><button type="button" onClick={() => setEditingStaff(null)} className="flex-1 py-4 rounded-2xl text-xs font-black text-gray-400 hover:bg-gray-50 transition-all">ยกเลิก</button><button type="submit" className="flex-[2] bg-[#1A1F3D] text-white font-black py-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#1A1F3D]/10 active:scale-95 transition-all">บันทึกการเปลี่ยนแปลง</button></div>
                          </form>
                        </DialogContent>
                      </Dialog>
                      {canManageStaff && <button onClick={() => toggleStatus(member)} className={cn("flex-1 font-black py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-500/10 active:scale-95 transition-all", member.status === "Active" ? "bg-red-500 text-white" : "bg-green-500 text-white")}>{member.status === "Active" ? "ปิดใช้งาน" : "เปิดใช้งาน"}</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="attendance" className="m-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Attendance Logs */}
              <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col">
                <h3 className="text-xl font-black text-[#1A1F3D] mb-6">ประวัติการลงเวลาเข้า-ออกงาน</h3>
                <div className="divide-y divide-gray-50 overflow-y-auto max-h-[500px] scrollbar-hide">
                  {attendanceLogs.map((log: any) => (
                    <div key={log.id} className="py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={log.profiles?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop"} className="w-10 h-10 rounded-xl object-cover" />
                        <div>
                          <p className="text-sm font-black text-[#1A1F3D]">{log.profiles?.full_name}</p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase">{log.type === 'check_in' ? 'เข้างาน' : 'ออกงาน'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-[#1A1F3D]">{format(new Date(log.created_at), 'HH:mm น.')}</p>
                        <p className="text-[9px] text-gray-400 font-bold">{format(new Date(log.created_at), 'dd MMM yyyy')}</p>
                      </div>
                    </div>
                  ))}
                  {attendanceLogs.length === 0 && (
                    <div className="py-12 text-center opacity-20 font-black text-xs uppercase">
                      ไม่มีประวัติการลงเวลาในขณะนี้
                    </div>
                  )}
                </div>
              </div>

              {/* Leave Requests */}
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col">
                <h3 className="text-xl font-black text-[#1A1F3D] mb-6">คำขอลาหยุด</h3>
                <div className="divide-y divide-gray-50 overflow-y-auto max-h-[500px] scrollbar-hide">
                  {leaveRequests.map((request: any) => (
                    <div key={request.id} className="py-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <img src={request.profiles?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop"} className="w-8 h-8 rounded-lg object-cover" />
                          <div>
                            <p className="text-xs font-black text-[#1A1F3D]">{request.profiles?.full_name}</p>
                            <p className="text-[8px] text-indigo-500 font-black uppercase">{request.leave_type}</p>
                          </div>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 rounded-md text-[8px] font-black uppercase",
                          request.status === 'pending' ? "bg-amber-50 text-amber-600" :
                            request.status === 'approved' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                        )}>
                          {request.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-bold">วันที่: {request.start_date} ถึง {request.end_date}</p>
                      <p className="text-xs text-gray-600 italic">"{request.reason || 'ไม่ได้ระบุเหตุผล'}"</p>
                      {request.status === 'pending' && canManageStaff && (
                        <div className="flex gap-2 pt-1">
                          <button onClick={() => handleApproveLeave(request.id)} className="flex-1 bg-green-500 text-white py-1.5 rounded-lg text-[9px] font-black uppercase">Approve</button>
                          <button onClick={() => handleRejectLeave(request.id)} className="flex-1 bg-red-50 text-red-500 py-1.5 rounded-lg text-[9px] font-black uppercase">Reject</button>
                        </div>
                      )}
                    </div>
                  ))}
                  {leaveRequests.length === 0 && (
                    <div className="py-12 text-center opacity-20 font-black text-xs uppercase">
                      ไม่มีคำขอลาหยุดในขณะนี้
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="m-0 h-full animate-in fade-in duration-300">
            <ScheduleTab storeId={storeId} />
          </TabsContent>

          <TabsContent value="payroll" className="m-0 h-full animate-in fade-in duration-300">
            <PayrollTab storeId={storeId} />
          </TabsContent>
        </Tabs>
      </div>

      {isSettingsOpen && <StaffSettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </div>
  );
}