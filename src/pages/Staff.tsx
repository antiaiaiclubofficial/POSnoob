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
  Sparkles
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
}

export default function Staff() {
  const { staff, addStaff, updateStaff, deleteStaff, language } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  // Form States
  const [name, setName] = useState("");
  const [role, setRole] = useState<StaffRole>("Assistant");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [commissionRate, setCommissionRate] = useState("0");

  const filteredStaff = (staff as any[]).filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username) {
      toast.error("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }

    const newStaff: Omit<StaffMember, "id"> = {
      name,
      role,
      phone,
      status: "Active",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
      username,
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
      username,
      commissionRate: Number(commissionRate) || 0,
    };

    updateStaff(editingStaff.id, updated);
    toast.success("อัปเดตข้อมูลพนักงานเรียบร้อยแล้ว");
    resetForm();
    setEditingStaff(null);
  };

  const handleDeleteStaffMember = (id: string, name: string) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบพนักงาน "${name}"?`)) {
      deleteStaff(id);
      toast.success("ลบพนักงานเรียบร้อยแล้ว");
    }
  };

  const resetForm = () => {
    setName("");
    setRole("Assistant");
    setPhone("");
    setUsername("");
    setCommissionRate("0");
  };

  const openEditDialog = (member: StaffMember) => {
    setEditingStaff(member);
    setName(member.name);
    setRole(member.role);
    setPhone(member.phone);
    setUsername(member.username);
    setCommissionRate(String(member.commissionRate || 0));
  };

  const toggleStatus = (member: StaffMember) => {
    const updated: StaffMember = {
      ...member,
      status: member.status === "Active" ? "Inactive" : "Active",
    };
    updateStaff(member.id, updated);
    toast.success(`เปลี่ยนสถานะเป็น ${updated.status === "Active" ? "เปิดใช้งาน" : "ปิดใช้งาน"} เรียบร้อยแล้ว`);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8F9FD]">
      {/* Header */}
      <header className="px-10 py-8 bg-white border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pl-14 lg:pl-10 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} className="text-[#D9ED5F]" />
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Team Management</p>
          </div>
          <h1 className="text-3xl font-black text-[#1A1F3D]">การจัดการพนักงาน</h1>
          <p className="text-xs text-gray-400 font-bold mt-1">จัดการข้อมูลพนักงาน บทบาทหน้าที่ และค่าคอมมิชชัน</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <button className="bg-[#1A1F3D] text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-[#1A1F3D]/10 active:scale-95 transition-all">
              <Plus size={18} /> เพิ่มพนักงานใหม่
            </button>
          </DialogTrigger>
          <DialogContent className="rounded-[32px] max-w-md p-8">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-[#1A1F3D]">เพิ่มพนักงานใหม่</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddStaff} className="space-y-5 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">ชื่อ-นามสกุล *</Label>
                <input 
                  id="name" 
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all"
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="สมชาย ใจดี" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">อีเมล / ชื่อผู้ใช้ *</Label>
                <input 
                  id="username" 
                  type="email" 
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all"
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  placeholder="somchai@example.com" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">เบอร์โทรศัพท์</Label>
                <input 
                  id="phone" 
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all"
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="0812345678" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">บทบาท</Label>
                  <Select value={role} onValueChange={(value: StaffRole) => setRole(value)}>
                    <SelectTrigger className="border-none bg-[#F5F6FA] rounded-2xl h-12 focus:ring-4 focus:ring-[#1A1F3D]/5 font-bold text-sm">
                      <SelectValue placeholder="เลือกบทบาท" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                      <SelectItem value="Admin" className="text-xs font-bold py-3">ผู้ดูแลระบบ (Admin)</SelectItem>
                      <SelectItem value="Groomer" className="text-xs font-bold py-3">ช่างตัดขน (Groomer)</SelectItem>
                      <SelectItem value="Assistant" className="text-xs font-bold py-3">ผู้ช่วย (Assistant)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commission" className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">ค่าคอมมิชชัน (%)</Label>
                  <input 
                    id="commission" 
                    type="number" 
                    min="0" 
                    max="100" 
                    className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-3.5 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all"
                    value={commissionRate} 
                    onChange={(e) => setCommissionRate(e.target.value)} 
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 py-4 rounded-2xl text-xs font-black text-gray-400 hover:bg-gray-50 transition-all"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit"
                  className="flex-[2] bg-[#1A1F3D] text-white font-black py-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#1A1F3D]/10 active:scale-95 transition-all"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-10 scrollbar-hide space-y-8">
        {/* Search Bar */}
        <div className="relative max-w-md bg-white rounded-[24px] shadow-sm border border-gray-100/50 overflow-hidden">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            placeholder="ค้นหาพนักงานด้วยชื่อ, บทบาท หรืออีเมล..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent pl-14 pr-6 py-4 text-sm font-bold border-none focus:outline-none focus:ring-0"
          />
        </div>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredStaff.map((member: any) => (
            <div 
              key={member.id} 
              className={cn(
                "bg-white rounded-[40px] p-8 flex flex-col h-full transition-all duration-300 border border-transparent group hover:shadow-2xl hover:border-gray-100 relative",
                member.status === "Inactive" && "opacity-60 grayscale-[0.3]"
              )}
            >
              {/* Action Buttons on Hover */}
              <div className="absolute top-6 right-6 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button 
                  onClick={() => handleDeleteStaffMember(member.id, member.name)}
                  className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  title="ลบพนักงาน"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Top Section: Avatar & Basic Info */}
              <div className="flex items-center gap-5 mb-6">
                <div className="relative shrink-0">
                  <img 
                    src={member.avatar} 
                    alt={member.name} 
                    className="w-16 h-16 rounded-[24px] object-cover border-4 border-white shadow-md"
                  />
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                    member.status === "Active" ? "bg-green-500" : "bg-red-500"
                  )} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#1A1F3D] mb-1.5 line-clamp-1">{member.name}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider",
                      member.role === "Admin" ? "bg-blue-50 text-blue-600" : "bg-indigo-50 text-indigo-600"
                    )}>
                      {member.role}
                    </span>
                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider",
                      member.status === "Active" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                    )}>
                      {member.status === "Active" ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact & Commission Info */}
              <div className="space-y-3 text-xs font-bold text-gray-500 border-t border-gray-50 pt-5 mb-6 flex-1">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-300 shrink-0" />
                  <span className="truncate">{member.username}</span>
                </div>
                {member.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-300 shrink-0" />
                    <span>{member.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Percent className="h-4 w-4 text-gray-300 shrink-0" />
                  <span>ค่าคอมมิชชัน: <span className="text-[#1A1F3D] font-black">{member.commissionRate || 0}%</span></span>
                </div>

                {/* Google Calendar Connection Status */}
                <div className="bg-[#F5F6FA] p-3.5 rounded-2xl flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <Chrome className="h-4 w-4 text-blue-500" />
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Google Calendar</span>
                  </div>
                  {member.googleConnected ? (
                    <span className="bg-green-50 text-green-700 border border-green-100 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-600" /> Connected
                    </span>
                  ) : (
                    <span className="bg-gray-100 text-gray-400 border border-gray-200 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase flex items-center gap-1">
                      <XCircle className="h-3 w-3 text-gray-400" /> Disconnected
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-50">
                <Dialog open={editingStaff?.id === member.id} onOpenChange={(open) => { if (!open) { setEditingStaff(null); resetForm(); } }}>
                  <button 
                    onClick={() => openEditDialog(member)}
                    className="flex-1 bg-[#F5F6FA] hover:bg-gray-100 text-[#1A1F3D] font-black py-3.5 rounded-2xl text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <Edit3 size={14} /> แก้ไขข้อมูล
                  </button>
                  <DialogContent className="rounded-[32px] max-w-md p-8">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black text-[#1A1F3D]">แก้ไขข้อมูลพนักงาน</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEditStaff} className="space-y-5 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-name" className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">ชื่อ-นามสกุล *</Label>
                        <input 
                          id="edit-name" 
                          className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all"
                          value={name} 
                          onChange={(e) => setName(e.target.value)} 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-username" className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">อีเมล / ชื่อผู้ใช้ *</Label>
                        <input 
                          id="edit-username" 
                          type="email" 
                          className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all"
                          value={username} 
                          onChange={(e) => setUsername(e.target.value)} 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-phone" className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">เบอร์โทรศัพท์</Label>
                        <input 
                          id="edit-phone" 
                          className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all"
                          value={phone} 
                          onChange={(e) => setPhone(e.target.value)} 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-role" className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">บทบาท</Label>
                          <Select value={role} onValueChange={(value: StaffRole) => setRole(value)}>
                            <SelectTrigger className="border-none bg-[#F5F6FA] rounded-2xl h-12 focus:ring-4 focus:ring-[#1A1F3D]/5 font-bold text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                              <SelectItem value="Admin" className="text-xs font-bold py-3">ผู้ดูแลระบบ (Admin)</SelectItem>
                              <SelectItem value="Groomer" className="text-xs font-bold py-3">ช่างตัดขน (Groomer)</SelectItem>
                              <SelectItem value="Assistant" className="text-xs font-bold py-3">ผู้ช่วย (Assistant)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-commission" className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">ค่าคอมมิชชัน (%)</Label>
                          <input 
                            id="edit-commission" 
                            type="number" 
                            min="0" 
                            max="100" 
                            className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-3.5 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all"
                            value={commissionRate} 
                            onChange={(e) => setCommissionRate(e.target.value)} 
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <button 
                          type="button" 
                          onClick={() => setEditingStaff(null)}
                          className="flex-1 py-4 rounded-2xl text-xs font-black text-gray-400 hover:bg-gray-50 transition-all"
                        >
                          ยกเลิก
                        </button>
                        <button 
                          type="submit"
                          className="flex-[2] bg-[#1A1F3D] text-white font-black py-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#1A1F3D]/10 active:scale-95 transition-all"
                        >
                          บันทึกการเปลี่ยนแปลง
                        </button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                <button 
                  onClick={() => toggleStatus(member)}
                  className={cn(
                    "flex-1 font-black py-3.5 rounded-2xl text-xs transition-all active:scale-95 shadow-md",
                    member.status === "Active" 
                      ? "bg-red-50 hover:bg-red-100 text-red-600 shadow-red-500/5" 
                      : "bg-green-50 hover:bg-green-100 text-green-600 shadow-green-500/5"
                  )}
                >
                  {member.status === "Active" ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}