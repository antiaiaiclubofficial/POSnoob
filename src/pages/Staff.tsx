import { useState } from "react";
import { useStore, StaffRole } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  Shield, 
  Percent, 
  CheckCircle2, 
  XCircle, 
  Chrome
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

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
  const { staff, addStaff, updateStaff } = useStore();
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
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
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

    updateStaff(updated.id, updated);
    toast.success("อัปเดตข้อมูลพนักงานเรียบร้อยแล้ว");
    resetForm();
    setEditingStaff(null);
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
    updateStaff(updated.id, updated);
    toast.success(`เปลี่ยนสถานะเป็น ${updated.status === "Active" ? "เปิดใช้งาน" : "ปิดใช้งาน"} เรียบร้อยแล้ว`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">การจัดการพนักงาน</h1>
          <p className="text-muted-foreground">จัดการข้อมูลพนักงาน บทบาทหน้าที่ และค่าคอมมิชชัน</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto gap-2">
              <Plus className="h-4 w-4" /> เพิ่มพนักงานใหม่
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>เพิ่มพนักงานใหม่</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddStaff} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">ชื่อ-นามสกุล *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="สมชาย ใจดี" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">อีเมล / ชื่อผู้ใช้ *</Label>
                <Input id="username" type="email" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="somchai@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0812345678" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">บทบาท</Label>
                  <Select value={role} onValueChange={(value: StaffRole) => setRole(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกบทบาท" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">ผู้ดูแลระบบ (Admin)</SelectItem>
                      <SelectItem value="Groomer">ช่างตัดขน (Groomer)</SelectItem>
                      <SelectItem value="Assistant">ผู้ช่วย (Assistant)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commission">ค่าคอมมิชชัน (%)</Label>
                  <Input id="commission" type="number" min="0" max="100" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>ยกเลิก</Button>
                <Button type="submit">บันทึก</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-2 max-w-md bg-background border rounded-lg px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="ค้นหาพนักงานด้วยชื่อ, บทบาท หรืออีเมล..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((member: any) => (
          <Card key={member.id} className="relative overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>{member.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg leading-none mb-1.5">{member.name}</h3>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <Badge variant={member.role === "Admin" ? "default" : "secondary"}>
                        <Shield className="h-3 w-3 mr-1" /> {member.role}
                      </Badge>
                      <Badge variant={member.status === "Active" ? "default" : "destructive"} className={member.status === "Active" ? "bg-green-600 hover:bg-green-700 text-white" : ""}>
                        {member.status === "Active" ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-2.5 text-sm text-muted-foreground border-t pt-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">{member.username}</span>
                </div>
                {member.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{member.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 shrink-0" />
                  <span>ค่าคอมมิชชัน: {member.commissionRate || 0}%</span>
                </div>

                {/* Real-time Google Connection Status Badge */}
                <div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg mt-2">
                  <div className="flex items-center gap-2">
                    <Chrome className="h-4 w-4 text-blue-500" />
                    <span className="text-xs font-medium">Google Calendar</span>
                  </div>
                  {member.googleConnected ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1 text-[10px] py-0.5">
                      <CheckCircle2 className="h-3 w-3 text-green-600" /> เชื่อมต่อแล้ว
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 gap-1 text-[10px] py-0.5">
                      <XCircle className="h-3 w-3 text-gray-400" /> ยังไม่เชื่อมต่อ
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-6 pt-4 border-t">
                <Dialog open={editingStaff?.id === member.id} onOpenChange={(open) => !open && setEditingStaff(null)}>
                  <Button variant="outline" className="flex-1" onClick={() => openEditDialog(member)}>
                    แก้ไขข้อมูล
                  </Button>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>แก้ไขข้อมูลพนักงาน</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEditStaff} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">ชื่อ-นามสกุล *</Label>
                        <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-username">อีเมล / ชื่อผู้ใช้ *</Label>
                        <Input id="edit-username" type="email" value={username} onChange={(e) => setUsername(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-phone">เบอร์โทรศัพท์</Label>
                        <Input id="edit-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-role">บทบาท</Label>
                          <Select value={role} onValueChange={(value: StaffRole) => setRole(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Admin">ผู้ดูแลระบบ (Admin)</SelectItem>
                              <SelectItem value="Groomer">ช่างตัดขน (Groomer)</SelectItem>
                              <SelectItem value="Assistant">ผู้ช่วย (Assistant)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-commission">ค่าคอมมิชชัน (%)</Label>
                          <Input id="edit-commission" type="number" min="0" max="100" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setEditingStaff(null)}>ยกเลิก</Button>
                        <Button type="submit">บันทึกการเปลี่ยนแปลง</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                <Button 
                  variant={member.status === "Active" ? "destructive" : "outline"} 
                  className="flex-1"
                  onClick={() => toggleStatus(member)}
                >
                  {member.status === "Active" ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}