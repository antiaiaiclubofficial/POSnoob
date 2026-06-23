"use client";

import React, { useState } from "react";
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
  AlertCircle
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
  googleConnected?: boolean;
  googleEmail?: string;
  isPendingInvite?: boolean;
  inviteLink?: string;
}

export default function Staff() {
  const queryClient = useQueryClient();
  const { staff, addStaff, updateStaff, deleteStaff, language, storeId, maxUsers, maxStaff, currentUser, roles } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);
  const [isRoleManagementOpen, setIsRoleManagementOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [activeTab, setActiveTab] = useState("profiles");

  // Form States
  const [name, setName] = useState("");
  const [role, setRole] = useState<StaffRole>("Assistant");
  const [phone, setPhone] = useState("");
  const [commissionRate, setCommissionRate] = useState("0");
  const [email, setEmail] = useState("");

  const { data: activeSessions = [], refetch: refetchSessions } = useQuery<any[]>({
    queryKey: ['active_sessions_list', storeId],
    queryFn: async () => {
      if (!storeId || storeId === 'default-store') return [];
      const { data, error } = await supabase.from('active_sessions').select('*').eq('store_id', storeId);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000,
    enabled: !!storeId
  });

  const { data: attendanceLogs = [] } = useQuery({
    queryKey: ['attendance_logs', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase.from('attendance_logs' as any).select('*, profiles(full_name, avatar_url)').eq('store_id', storeId).order('created_at', { ascending: false }).limit(20);
      if (error) return [];
      return data;
    },
    enabled: !!storeId && activeTab === 'attendance'
  });

  const { data: leaveRequests = [] } = useQuery({
    queryKey: ['leave_requests', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase.from('leave_requests' as any).select('*, profiles(full_name, avatar_url)').eq('store_id', storeId).order('created_at', { ascending: false });
      if (error) return [];
      return data;
    },
    enabled: !!storeId && activeTab === 'attendance'
  });

  const updateLeaveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase.from('leave_requests' as any).update({ status, approved_by: currentUser?.id }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave_requests'] });
      toast.success("อัปเดตสถานะการลาเรียบร้อยแล้ว");
    }
  });

  const handleApproveLeave = (id: string) => updateLeaveMutation.mutate({ id, status: 'approved' });
  const handleRejectLeave = (id: string) => updateLeaveMutation.mutate({ id, status: 'rejected' });

  const handleForceLogout = async (userId: string, staffName: string) => {
    if (currentUser?.role !== 'Admin' && currentUser?.role !== 'superadmin') {
      toast.error("คุณไม่มีสิทธิ์ในการสั่ง Logout (ต้องเป็น Admin เท่านั้น)");
      return;
    }
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการสั่ง Logout เซสชันของ "${staffName}"?`)) return;
    try {
      const { error } = await supabase.from('active_sessions').delete().eq('user_id', userId);
      if (error) throw error;
      toast.success(`สั่ง Logout เซสชันของ "${staffName}" เรียบร้อยแล้ว`);
      refetchSessions();
    } catch (err: any) {
      toast.error("เกิดข้อผิดพลาด: " + err.message);
    }
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    addStaff({
      name, role, phone, status: "Active",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
      username: email, commissionRate: Number(commissionRate || 0)
    });
    resetForm();
    setIsAddOpen(false);
  };

  const handleEditStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    updateStaff(editingStaff.id, { ...editingStaff, name, role, phone, username: email, commissionRate: Number(commissionRate) || 0 });
    resetForm();
    setEditingStaff(null);
  };

  const resetForm = () => {
    setName(""); setRole("Assistant"); setPhone(""); setCommissionRate("0"); setEmail("");
  };

  const filteredStaff = staff.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.username?.toLowerCase().includes(searchQuery.toLowerCase()));

  const canManageStaff = currentUser?.role === 'Admin' || currentUser?.role === 'superadmin';

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8F9FD]">
      <header className="px-10 py-8 bg-white border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pl-14 lg:pl-10 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1"><Sparkles size={14} className="text-[#D9ED5F]" /><p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Team Management</p></div>
          <h1 className="text-3xl font-black text-[#1A1F3D]">การจัดการพนักงาน</h1>
        </div>

        <div className="flex flex-wrap gap-3">
          {canManageStaff && <button onClick={() => setIsRoleManagementOpen(true)} className="bg-indigo-50 text-indigo-600 px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-indigo-500/10"><Shield size={18} /> จัดการบทบาท</button>}
          <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>{canManageStaff && <button className="bg-[#1A1F3D] text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl active:scale-95 transition-all"><Plus size={18} /> เพิ่มพนักงานใหม่</button>}</DialogTrigger>
            <DialogContent className="rounded-[32px] max-w-md p-8">
              <DialogHeader><DialogTitle className="text-xl font-black text-[#1A1F3D]">เพิ่มพนักงานใหม่</DialogTitle></DialogHeader>
              <form onSubmit={handleAddStaff} className="space-y-5 mt-4">
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">ชื่อ-นามสกุล *</Label><input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" value={name} onChange={(e) => setName(e.target.value)} required /></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">อีเมล *</Label><input type="email" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">บทบาท</Label><Select value={role} onValueChange={(v: StaffRole) => setRole(v)}><SelectTrigger className="border-none bg-[#F5F6FA] rounded-2xl h-12 font-bold"><SelectValue /></SelectTrigger><SelectContent>{roles.filter(r => r.name !== 'superadmin').map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">คอมมิชชัน (%)</Label><input type="number" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-3.5 text-sm font-bold" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} /></div>
                </div>
                <div className="flex gap-3 pt-4"><button type="button" onClick={() => setIsAddOpen(false)} className="flex-1 py-4 rounded-2xl text-xs font-black text-gray-400">ยกเลิก</button><button type="submit" className="flex-[2] bg-[#1A1F3D] text-white font-black py-4 rounded-2xl">เพิ่มพนักงาน</button></div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="px-10 py-4 bg-white border-b border-gray-50 shrink-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent h-auto p-0 flex gap-4">
            <TabsTrigger value="profiles" className="data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white rounded-2xl px-8 py-3 text-xs font-black uppercase tracking-widest transition-all">Profiles</TabsTrigger>
            <TabsTrigger value="schedule" className="data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white rounded-2xl px-8 py-3 text-xs font-black uppercase tracking-widest transition-all">Schedule</TabsTrigger>
            <TabsTrigger value="attendance" className="data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white rounded-2xl px-8 py-3 text-xs font-black uppercase tracking-widest transition-all">Attendance</TabsTrigger>
            <TabsTrigger value="payroll" className="data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white rounded-2xl px-8 py-3 text-xs font-black uppercase tracking-widest transition-all">Payroll</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
        <Tabs value={activeTab}>
          <TabsContent value="profiles" className="space-y-8 m-0">
            <div className="relative max-w-md bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input placeholder="ค้นหาพนักงาน..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-transparent pl-14 pr-6 py-4 text-sm font-bold border-none" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredStaff.map((member: any) => (
                <div key={member.id} className="bg-white rounded-[40px] p-8 border border-transparent hover:shadow-2xl transition-all group relative">
                  <div className="absolute top-6 right-6 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canManageStaff && <button onClick={() => deleteStaff(member.id)} className="p-2.5 text-gray-300 hover:text-red-500"><Trash2 size={16} /></button>}
                  </div>
                  <div className="flex items-center gap-5 mb-6">
                    <img src={member.avatar} className="w-16 h-16 rounded-[24px] object-cover border-4 border-white shadow-md" />
                    <div>
                      <h3 className="text-lg font-black text-[#1A1F3D] mb-1.5">{member.name}</h3>
                      <span className="px-2.5 py-1 rounded-lg text-[8px] font-black uppercase bg-indigo-50 text-indigo-600">{member.role}</span>
                    </div>
                  </div>
                  <div className="space-y-3 text-xs font-bold text-gray-500 border-t border-gray-50 pt-5 flex-1">
                    <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-gray-300" /><span>{member.username}</span></div>
                    <div className="flex items-center gap-3"><Percent className="h-4 w-4 text-gray-300" /><span>คอมมิชชัน: {member.commissionRate}%</span></div>
                  </div>
                  <div className="flex gap-3 pt-6">
                    <Dialog open={editingStaff?.id === member.id} onOpenChange={(open) => { if (!open) { setEditingStaff(null); resetForm(); } }}>
                      <DialogTrigger asChild>{canManageStaff && <button onClick={() => { setEditingStaff(member); setName(member.name); setRole(member.role); setPhone(member.phone); setEmail(member.username || ""); setCommissionRate(String(member.commissionRate || 0)); }} className="flex-1 bg-[#F5F6FA] hover:bg-gray-100 text-[#1A1F3D] font-black py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2"><Edit3 size={14} /> แก้ไข</button>}</DialogTrigger>
                      <DialogContent className="rounded-[32px] max-w-md p-8">
                        <DialogHeader><DialogTitle className="text-xl font-black text-[#1A1F3D]">แก้ไขข้อมูลพนักงาน</DialogTitle></DialogHeader>
                        <form onSubmit={handleEditStaff} className="space-y-5 mt-4">
                          <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400 px-1">ชื่อ-นามสกุล *</Label><input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" value={name} onChange={(e) => setName(e.target.value)} required /></div>
                          <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400 px-1">อีเมล *</Label><input type="email" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400 px-1">บทบาท</Label><Select value={role} onValueChange={(v: StaffRole) => setRole(v)}><SelectTrigger className="border-none bg-[#F5F6FA] h-12 font-bold"><SelectValue /></SelectTrigger><SelectContent>{roles.filter(r => r.name !== 'superadmin').map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}</SelectContent></Select></div>
                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400 px-1">คอมมิชชัน (%)</Label><input type="number" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-3.5 text-sm font-bold" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} /></div>
                          </div>
                          <div className="flex gap-3 pt-4"><button type="button" onClick={() => setEditingStaff(null)} className="flex-1 py-4 rounded-2xl text-xs font-black text-gray-400">ยกเลิก</button><button type="submit" className="flex-[2] bg-[#1A1F3D] text-white font-black py-4 rounded-2xl">บันทึก</button></div>
                        </form>
                      </DialogContent>
                    </Dialog>
                    {canManageStaff && <button onClick={() => updateStaff(member.id, { ...member, status: member.status === 'Active' ? 'Inactive' : 'Active' })} className={cn("flex-1 font-black py-3.5 rounded-2xl text-xs", member.status === "Active" ? "bg-red-500 text-white" : "bg-green-500 text-white")}>{member.status === "Active" ? "ปิดใช้งาน" : "เปิดใช้งาน"}</button>}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="schedule" className="m-0 h-full"><ScheduleTab storeId={storeId} /></TabsContent>
          <TabsContent value="attendance" className="m-0">
             <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col h-full">
                <h3 className="text-xl font-black text-[#1A1F3D] mb-6">Attendance Logs</h3>
                <div className="divide-y divide-gray-50">
                  {attendanceLogs.map((log: any) => (
                    <div key={log.id} className="py-4 flex justify-between items-center">
                      <div className="flex items-center gap-3"><img src={log.profiles?.avatar_url} className="w-10 h-10 rounded-xl" /><div><p className="text-sm font-bold">{log.profiles?.full_name}</p><p className="text-[9px] uppercase font-black text-gray-400">{log.type}</p></div></div>
                      <div className="text-right"><p className="text-xs font-black">{format(new Date(log.created_at), 'HH:mm')}</p><p className="text-[8px] text-gray-400">{format(new Date(log.created_at), 'dd MMM')}</p></div>
                    </div>
                  ))}
                </div>
             </div>
          </TabsContent>
          <TabsContent value="payroll" className="m-0 h-full"><PayrollTab /></TabsContent>
        </Tabs>
      </div>

      {isRoleManagementOpen && <RoleManagementModal onClose={() => setIsRoleManagementOpen(false)} />}
    </div>
  );
}