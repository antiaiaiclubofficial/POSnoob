"use client";

import React from 'react';
import { 
  Users, 
  BarChart3, 
  HelpCircle, 
  LogOut,
  ShoppingBag,
  Settings as SettingsIcon,
  LayoutDashboard,
  Scissors,
  Menu,
  ShieldCheck,
  History,
  CalendarDays,
  Target,
  Megaphone,
  Package
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { translations } from '@/utils/translations';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from 'sonner';

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

export const SidebarContent = ({ className, onClose }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { shopName, shopLogo, logout, language, currentUser, rolePermissions } = useStore();
  const t = translations[language];

  const menuItems = [
    { icon: LayoutDashboard, label: t.dashboard, path: '/' },
    { icon: ShoppingBag, label: t.pos, path: '/pos' },
    { icon: CalendarDays, label: t.queue, path: '/queue' },
    { icon: Users, label: t.customers, path: '/customers' },
    { icon: Package, label: t.inventory, path: '/inventory' },
    { icon: Megaphone, label: t.marketing, path: '/marketing' },
    { icon: ShieldCheck, label: t.staff, path: '/staff' },
    { icon: Target, label: t.performance, path: '/staff/performance' },
    { icon: History, label: t.logs, path: '/logs' },
    { icon: BarChart3, label: t.reports, path: '/reports' },
    { icon: SettingsIcon, label: t.settings, path: '/settings' },
  ];

  // Filter menu items based on role permissions
  const userRole = currentUser?.role || 'Assistant';
  const allowedPaths = rolePermissions[userRole] || ['/', '/queue', '/customers'];
  const filteredMenuItems = menuItems.filter(item => allowedPaths.includes(item.path));

  const handleLogout = () => {
    logout();
    toast.info("Logged out successfully.");
    navigate('/login');
    if (onClose) onClose();
  };

  const userDisplayName = currentUser?.name || 'Admin User';
  const userDisplayRole = currentUser?.role || 'Store Owner';
  const userAvatar = currentUser?.avatar;
  const userInitial = userDisplayName.charAt(0).toUpperCase();

  return (
    <div className={cn(
      "h-full bg-white flex flex-col border-r border-gray-100 shrink-0 transition-all duration-300 ease-in-out overflow-hidden group/sidebar z-50",
      "w-64 lg:w-[88px] lg:hover:w-64",
      className
    )}>
      <div className="flex items-center gap-4 mb-10 px-6 pt-8 shrink-0">
        <div className="w-10 h-10 bg-[#1A1F3D] rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-lg shadow-[#1A1F3D]/10">
          {shopLogo ? (
            <img src={shopLogo} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <Scissors className="text-white w-5 h-5" />
          )}
        </div>
        <div className="min-w-0 opacity-100 lg:opacity-0 lg:group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          <h1 className="font-black text-[#1A1F3D] leading-tight truncate text-sm">
            {shopName}
          </h1>
          <p className="text-[9px] text-gray-400 font-black tracking-widest uppercase opacity-60">Premium Care</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-4 overflow-y-auto scrollbar-hide">
        {filteredMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group overflow-hidden whitespace-nowrap",
                isActive 
                  ? "bg-[#1A1F3D] text-white shadow-xl shadow-[#1A1F3D]/10 font-bold" 
                  : "text-gray-400 hover:bg-gray-50 hover:text-[#1A1F3D]"
              )}
            >
              <item.icon size={20} className={cn("shrink-0 transition-transform group-hover:scale-110", isActive ? "text-[#D9ED5F]" : "")} />
              <span className="text-xs opacity-100 lg:opacity-0 lg:group-hover/sidebar:opacity-100 transition-opacity duration-300">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4 px-4 pb-8 shrink-0">
        <div className="pt-6 border-t border-gray-50 space-y-1">
          <a 
            href="https://lin.ee/wU8azb5" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-4 px-4 py-3 text-gray-400 hover:text-[#1A1F3D] transition-colors group overflow-hidden whitespace-nowrap"
          >
            <HelpCircle size={20} className="shrink-0 group-hover:rotate-12 transition-transform" />
            <span className="text-xs font-bold opacity-100 lg:opacity-0 lg:group-hover/sidebar:opacity-100 transition-opacity duration-300">{t.support}</span>
          </a>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3 text-gray-400 hover:text-red-500 transition-colors w-full group overflow-hidden whitespace-nowrap"
          >
            <LogOut size={20} className="shrink-0 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold opacity-100 lg:opacity-0 lg:group-hover/sidebar:opacity-100 transition-opacity duration-300">{t.logout}</span>
          </button>
        </div>
        
        <div className="bg-[#F5F6FA] p-3 rounded-2xl flex items-center gap-3 overflow-hidden whitespace-nowrap">
          <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-[10px] font-black border border-gray-100 shrink-0 overflow-hidden">
            {userAvatar ? (
              <img src={userAvatar} alt="User Avatar" className="w-full h-full object-cover" />
            ) : (
              userInitial
            )}
          </div>
          <div className="opacity-100 lg:opacity-0 lg:group-hover/sidebar:opacity-100 transition-opacity duration-300 min-w-0">
            <p className="text-[10px] font-black text-[#1A1F3D] truncate">{userDisplayName}</p>
            <p className="text-[8px] text-gray-400 font-bold uppercase">{userDisplayRole}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Sidebar = () => {
  return (
    <>
      <SidebarContent className="hidden lg:flex" />
      <div className="lg:hidden fixed top-6 left-6 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <button className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center text-[#1A1F3D] border border-gray-100">
              <Menu size={24} />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-none">
            <SidebarContent onClose={() => {}} className="w-64" />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default Sidebar;
</dyad-file>

Now let's update `src/components/Layout.tsx` to prevent direct URL access to unauthorized pages by showing a beautiful "Access Denied" screen.

<dyad-write path="src/components/Layout.tsx" description="Adding direct URL access control to Layout.tsx to block unauthorized pages.">
"use client";

import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useStore } from '@/store/useStore';
import { ShieldAlert, Home } from 'lucide-react';

const Layout = () => {
  const location = useLocation();
  const { currentUser, rolePermissions } = useStore();

  const userRole = currentUser?.role || 'Assistant';
  const allowedPaths = rolePermissions[userRole] || ['/', '/queue', '/customers'];
  const isAllowed = allowedPaths.includes(location.pathname);

  return (
    <div className="flex h-screen bg-[#F8F9FD] text-[#1A1F3D] overflow-hidden relative">
      <Sidebar />
      {isAllowed ? (
        <Outlet />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center bg-[#F8F9FD]">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[32px] flex items-center justify-center mb-6 shadow-lg shadow-red-500/5">
            <ShieldAlert size={40} />
          </div>
          <h2 className="text-3xl font-black text-[#1A1F3D] mb-2">ไม่มีสิทธิ์เข้าถึงหน้านี้</h2>
          <p className="text-sm text-gray-400 max-w-md font-medium mb-8">
            บัญชีของคุณไม่มีสิทธิ์เข้าใช้งานส่วนนี้ กรุณาติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์การเข้าถึงเพิ่มเติม
          </p>
          <Link 
            to="/" 
            className="bg-[#1A1F3D] text-white px-8 py-4 rounded-2xl font-black text-xs flex items-center gap-2 shadow-xl shadow-[#1A1F3D]/10 hover:scale-105 active:scale-95 transition-all"
          >
            <Home size={16} /> กลับสู่หน้าหลัก
          </Link>
        </div>
      )}
    </div>
  );
};

export default Layout;
</dyad-file>

Now let's update `src/pages/Staff.tsx` to add a new "กำหนดสิทธิ์การเข้าถึง" (Role Permissions) tab where admins can check/uncheck permissions for each role in real-time.

<dyad-write path="src/pages/Staff.tsx" description="Adding a Role Permissions tab to Staff.tsx to manage access rights for Admin, Groomer, and Assistant roles.">
"use client";

import React, { useState } from 'react';
import { Plus, Search, Edit3, Trash2, Phone, BadgeCheck, XCircle, Key, ShieldAlert, Check, ShieldCheck } from 'lucide-react';
import { useStore, Staff as StaffType, StaffRole } from '@/store/useStore';
import { cn } from '@/lib/utils';
import StaffModal from '@/components/StaffModal';
import { translations } from '@/utils/translations';
import { toast } from 'sonner';

const Staff = () => {
  const { staff, deleteStaff, language, rolePermissions, updateRolePermissions } = useStore();
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'list' | 'permissions'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffType | null>(null);

  // Selected role for permissions editing
  const [selectedRole, setSelectedRole] = useState<StaffRole>('Groomer');

  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.username && s.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleEdit = (s: StaffType) => {
    setEditingStaff(s);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingStaff(null);
    setIsModalOpen(true);
  };

  // Available features/pages to toggle permissions
  const availableFeatures = [
    { path: '/', label: 'Dashboard (แดชบอร์ด)', desc: 'ภาพรวมธุรกิจและคิวงานวันนี้' },
    { path: '/pos', label: 'POS System (ระบบขายหน้าร้าน)', desc: 'จุดชำระเงินและเลือกบริการ' },
    { path: '/queue', label: 'Operations (การจัดการคิว)', desc: 'ตารางนัดหมายและเช็คอินสัตว์เลี้ยง' },
    { path: '/customers', label: 'CRM / Clients (ข้อมูลลูกค้า)', desc: 'ประวัติลูกค้าและสัตว์เลี้ยง' },
    { path: '/inventory', label: 'Inventory & Stock (คลังสินค้า)', desc: 'จัดการสต็อกและสินค้าฝากขาย' },
    { path: '/marketing', label: 'Marketing & Rewards (การตลาด)', desc: 'โปรโมชั่น คูปอง และระดับสมาชิก' },
    { path: '/staff', label: 'Team Management (จัดการทีม)', desc: 'รายชื่อพนักงานและกำหนดสิทธิ์' },
    { path: '/staff/performance', label: 'Staff Analytics (วิเคราะห์ผลงาน)', desc: 'ยอดขายและค่าคอมมิชชั่นพนักงาน' },
    { path: '/logs', label: 'Activity Logs (บันทึกกิจกรรม)', desc: 'ประวัติการทำงานของระบบ' },
    { path: '/reports', label: 'Business Insights (รายงานธุรกิจ)', desc: 'รายงานรายได้และบัญชีธุรกรรม' },
    { path: '/settings', label: 'Settings (ตั้งค่าระบบ)', desc: 'ตั้งค่าร้านค้า ใบเสร็จ และ LINE LIFF' },
  ];

  const handleTogglePermission = (path: string) => {
    const currentPermissions = rolePermissions[selectedRole] || [];
    let newPermissions: string[];

    if (currentPermissions.includes(path)) {
      newPermissions = currentPermissions.filter(p => p !== path);
    } else {
      newPermissions = [...currentPermissions, path];
    }

    updateRolePermissions(selectedRole, newPermissions);
    toast.success(`อัปเดตสิทธิ์การเข้าถึงของตำแหน่ง ${selectedRole} เรียบร้อย`);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="px-10 py-10 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black mb-1">{t.ourTeam}</h1>
          <p className="text-gray-400 font-medium">{t.manageStaff}</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="bg-[#F5F6FA] p-1 rounded-2xl flex gap-1 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('list')}
              className={cn(
                "flex-1 sm:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'list' ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              รายชื่อพนักงาน
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={cn(
                "flex-1 sm:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'permissions' ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              กำหนดสิทธิ์การเข้าถึง
            </button>
          </div>

          {activeTab === 'list' && (
            <button 
              onClick={handleAdd}
              className="bg-[#1A1F3D] text-white px-6 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-[#1A1F3D]/10 shrink-0"
            >
              <Plus size={20} /> {t.addStaff}
            </button>
          )}
        </div>
      </header>

      {activeTab === 'list' ? (
        <>
          <div className="px-10 mb-8">
             <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold shadow-sm"
                  placeholder={t.searchStaff}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
             </div>
          </div>

          <div className="flex-1 overflow-y-auto px-10 pb-10 scrollbar-hide">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredStaff.map((member) => (
                <div key={member.id} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm group hover:shadow-xl transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <img src={member.avatar} className="w-20 h-20 rounded-[28px] object-cover shadow-lg border-4 border-white" />
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(member)} className="p-2 text-gray-300 hover:text-[#1A1F3D] bg-gray-50 rounded-xl transition-all"><Edit3 size={16}/></button>
                      <button onClick={() => deleteStaff(member.id)} className="p-2 text-gray-300 hover:text-red-500 bg-gray-50 rounded-xl transition-all"><Trash2 size={16}/></button>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-black">{member.name}</h3>
                      {member.status === 'Active' ? <BadgeCheck className="text-green-500" size={18} /> : <XCircle className="text-gray-300" size={18} />}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                        member.role === 'Admin' ? "bg-purple-100 text-purple-600" : 
                        member.role === 'Groomer' ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                      )}>
                        {member.role}
                      </span>
                      {member.username && (
                        <span className="bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1">
                          <Key size={10} /> {member.username}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 pt-6 border-t border-gray-50">
                     <div className="flex items-center gap-3 text-xs font-bold text-gray-400">
                        <Phone size={14} /> {member.phone}
                     </div>
                     <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                        <span className={member.status === 'Active' ? "text-green-500" : "text-red-400"}>
                          {member.status === 'Active' ? t.active : t.inactive}
                        </span>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto px-10 pb-10 scrollbar-hide max-w-4xl">
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
            <div>
              <h3 className="text-xl font-black text-[#1A1F3D] mb-1">กำหนดสิทธิ์การเข้าถึงตามตำแหน่ง</h3>
              <p className="text-xs text-gray-400 font-medium">เลือกตำแหน่งที่ต้องการแก้ไขสิทธิ์ จากนั้นเลือกฟังก์ชันที่อนุญาตให้เข้าถึงได้</p>
            </div>

            {/* Role Selector */}
            <div className="flex bg-[#F5F6FA] p-1.5 rounded-[22px] gap-2 max-w-md">
              {(['Admin', 'Groomer', 'Assistant'] as StaffRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all",
                    selectedRole === role ? "bg-[#1A1F3D] text-white shadow-sm" : "text-gray-400"
                  )}
                >
                  {role}
                </button>
              ))}
            </div>

            {/* Permissions Checklist */}
            <div className="space-y-4">
              {availableFeatures.map((feature) => {
                const isAllowed = (rolePermissions[selectedRole] || []).includes(feature.path);
                return (
                  <div 
                    key={feature.path}
                    onClick={() => handleTogglePermission(feature.path)}
                    className={cn(
                      "flex items-center justify-between p-5 rounded-3xl border transition-all cursor-pointer",
                      isAllowed ? "bg-indigo-50/30 border-indigo-100" : "bg-white border-gray-100 hover:border-gray-200"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors",
                        isAllowed ? "bg-indigo-500 text-white" : "bg-gray-50 text-gray-400"
                      )}>
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#1A1F3D]">{feature.label}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{feature.desc}</p>
                      </div>
                    </div>

                    <div className={cn(
                      "w-6 h-6 rounded-xl flex items-center justify-center border-2 transition-all",
                      isAllowed ? "bg-indigo-500 border-indigo-500 text-white" : "border-gray-200 bg-gray-50"
                    )}>
                      {isAllowed && <Check size={14} strokeWidth={4} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {isModalOpen && <StaffModal staff={editingStaff} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

export default Staff;
</dyad-file>

I have successfully implemented the staff role and permissions management feature. You can now switch to the "กำหนดสิทธิ์การเข้าถึง" tab on the Staff page to customize access rights for Admin, Groomer, and Assistant roles in real-time.

<dyad-chat-summary>Implementing staff role permissions and access control</dyad-chat-summary><dyad-problem-report summary="63 problems">
<problem file="src/store/types.ts" line="353" column="2" code="1110">Type expected.</problem>
<problem file="src/store/types.ts" line="355" column="1" code="1434">Unexpected keyword or identifier.</problem>
<problem file="src/store/types.ts" line="355" column="5" code="1440">Variable declaration not allowed at this location.</problem>
<problem file="src/store/types.ts" line="355" column="135" code="1002">Unterminated string literal.</problem>
<problem file="src/store/types.ts" line="357" column="13" code="1005">';' expected.</problem>
<problem file="src/store/types.ts" line="357" column="42" code="1005">';' expected.</problem>
<problem file="src/store/types.ts" line="358" column="1" code="1109">Expression expected.</problem>
<problem file="src/store/types.ts" line="355" column="1" code="2304">Cannot find name 'Now'.</problem>
<problem file="src/store/types.ts" line="355" column="5" code="2304">Cannot find name 'let'.</problem>
<problem file="src/store/types.ts" line="355" column="8" code="2365">Operator '&lt;' cannot be applied to types 'string' and 'number'.</problem>
<problem file="src/store/types.ts" line="357" column="2" code="2304">Cannot find name 'dyad'.</problem>
<problem file="src/store/types.ts" line="357" column="7" code="2304">Cannot find name 'write'.</problem>
<problem file="src/store/types.ts" line="357" column="13" code="2304">Cannot find name 'path'.</problem>
<problem file="src/store/types.ts" line="357" column="42" code="2304">Cannot find name 'description'.</problem>
<problem file="src/store/types.ts" line="361" column="3" code="2440">Import declaration conflicts with local declaration of 'AppState'.</problem>
<problem file="src/store/types.ts" line="361" column="13" code="2440">Import declaration conflicts with local declaration of 'QueueStatus'.</problem>
<problem file="src/store/types.ts" line="361" column="26" code="2440">Import declaration conflicts with local declaration of 'TierRule'.</problem>
<problem file="src/store/types.ts" line="361" column="36" code="2440">Import declaration conflicts with local declaration of 'MembershipLevel'.</problem>
<problem file="src/store/types.ts" line="361" column="53" code="2440">Import declaration conflicts with local declaration of 'Pet'.</problem>
<problem file="src/store/types.ts" line="361" column="58" code="2440">Import declaration conflicts with local declaration of 'Customer'.</problem>
<problem file="src/store/types.ts" line="362" column="3" code="2440">Import declaration conflicts with local declaration of 'QueueItem'.</problem>
<problem file="src/store/types.ts" line="362" column="14" code="2440">Import declaration conflicts with local declaration of 'Service'.</problem>
<problem file="src/store/types.ts" line="362" column="23" code="2440">Import declaration conflicts with local declaration of 'InventoryItem'.</problem>
<problem file="src/store/types.ts" line="362" column="38" code="2440">Import declaration conflicts with local declaration of 'Partner'.</problem>
<problem file="src/store/types.ts" line="362" column="47" code="2440">Import declaration conflicts with local declaration of 'StockLog'.</problem>
<problem file="src/store/types.ts" line="362" column="57" code="2440">Import declaration conflicts with local declaration of 'Transaction'.</problem>
<problem file="src/store/types.ts" line="363" column="3" code="2440">Import declaration conflicts with local declaration of 'Staff'.</problem>
<problem file="src/store/types.ts" line="363" column="10" code="2440">Import declaration conflicts with local declaration of 'ActivityLog'.</problem>
<problem file="src/store/types.ts" line="363" column="23" code="2440">Import declaration conflicts with local declaration of 'AddonItem'.</problem>
<problem file="src/store/types.ts" line="363" column="34" code="2440">Import declaration conflicts with local declaration of 'PackageTemplate'.</problem>
<problem file="src/store/types.ts" line="363" column="51" code="2440">Import declaration conflicts with local declaration of 'CreditPackageTemplate'.</problem>
<problem file="src/store/types.ts" line="364" column="3" code="2440">Import declaration conflicts with local declaration of 'PaymentMethod'.</problem>
<problem file="src/store/types.ts" line="364" column="18" code="2440">Import declaration conflicts with local declaration of 'ServicePriceInfo'.</problem>
<problem file="src/store/types.ts" line="364" column="36" code="2440">Import declaration conflicts with local declaration of 'SubService'.</problem>
<problem file="src/store/types.ts" line="364" column="48" code="2440">Import declaration conflicts with local declaration of 'BookingType'.</problem>
<problem file="src/store/types.ts" line="364" column="61" code="2440">Import declaration conflicts with local declaration of 'ServiceIcon'.</problem>
<problem file="src/store/types.ts" line="364" column="74" code="2440">Import declaration conflicts with local declaration of 'StaffRole'.</problem>
<problem file="src/store/types.ts" line="364" column="85" code="2440">Import declaration conflicts with local declaration of 'ReportHistory'.</problem>
<problem file="src/store/types.ts" line="368" column="3" code="2303">Circular definition of import alias 'AppState'.</problem>
<problem file="src/store/types.ts" line="368" column="13" code="2303">Circular definition of import alias 'QueueStatus'.</problem>
<problem file="src/store/types.ts" line="368" column="26" code="2303">Circular definition of import alias 'TierRule'.</problem>
<problem file="src/store/types.ts" line="368" column="36" code="2303">Circular definition of import alias 'MembershipLevel'.</problem>
<problem file="src/store/types.ts" line="368" column="53" code="2303">Circular definition of import alias 'Pet'.</problem>
<problem file="src/store/types.ts" line="368" column="58" code="2303">Circular definition of import alias 'Customer'.</problem>
<problem file="src/store/types.ts" line="369" column="3" code="2303">Circular definition of import alias 'QueueItem'.</problem>
<problem file="src/store/types.ts" line="369" column="14" code="2303">Circular definition of import alias 'Service'.</problem>
<problem file="src/store/types.ts" line="369" column="23" code="2303">Circular definition of import alias 'InventoryItem'.</problem>
<problem file="src/store/types.ts" line="369" column="38" code="2303">Circular definition of import alias 'Partner'.</problem>
<problem file="src/store/types.ts" line="369" column="47" code="2303">Circular definition of import alias 'StockLog'.</problem>
<problem file="src/store/types.ts" line="369" column="57" code="2303">Circular definition of import alias 'Transaction'.</problem>
<problem file="src/store/types.ts" line="370" column="3" code="2303">Circular definition of import alias 'Staff'.</problem>
<problem file="src/store/types.ts" line="370" column="10" code="2303">Circular definition of import alias 'ActivityLog'.</problem>
<problem file="src/store/types.ts" line="370" column="23" code="2303">Circular definition of import alias 'AddonItem'.</problem>
<problem file="src/store/types.ts" line="370" column="34" code="2303">Circular definition of import alias 'PackageTemplate'.</problem>
<problem file="src/store/types.ts" line="370" column="51" code="2303">Circular definition of import alias 'CreditPackageTemplate'.</problem>
<problem file="src/store/types.ts" line="371" column="3" code="2303">Circular definition of import alias 'PaymentMethod'.</problem>
<problem file="src/store/types.ts" line="371" column="18" code="2303">Circular definition of import alias 'ServicePriceInfo'.</problem>
<problem file="src/store/types.ts" line="371" column="36" code="2303">Circular definition of import alias 'SubService'.</problem>
<problem file="src/store/types.ts" line="371" column="48" code="2303">Circular definition of import alias 'BookingType'.</problem>
<problem file="src/store/types.ts" line="371" column="61" code="2303">Circular definition of import alias 'ServiceIcon'.</problem>
<problem file="src/store/types.ts" line="371" column="74" code="2303">Circular definition of import alias 'StaffRole'.</problem>
<problem file="src/store/types.ts" line="371" column="85" code="2303">Circular definition of import alias 'ReportHistory'.</problem>
<problem file="src/store/useStore.ts" line="17" column="58" code="2739">Type '{ language: &quot;th&quot;; setLanguage: (lang: Language) =&gt; void; currency: string; isAuthenticated: false; isAuthLoading: true; currentUser: any; storeId: string; shopName: string; shopLogo: any; ... 96 more ...; buyCreditPackage: (cid: string, pid: string) =&gt; void; }' is missing the following properties from type 'AppState': rolePermissions, updateRolePermissions</problem>
</dyad-problem-report><dyad-problem-report summary="63 problems">
<problem file="src/store/types.ts" line="353" column="2" code="1110">Type expected.</problem>
<problem file="src/store/types.ts" line="355" column="1" code="1434">Unexpected keyword or identifier.</problem>
<problem file="src/store/types.ts" line="355" column="5" code="1440">Variable declaration not allowed at this location.</problem>
<problem file="src/store/types.ts" line="355" column="135" code="1002">Unterminated string literal.</problem>
<problem file="src/store/types.ts" line="357" column="13" code="1005">';' expected.</problem>
<problem file="src/store/types.ts" line="357" column="42" code="1005">';' expected.</problem>
<problem file="src/store/types.ts" line="358" column="1" code="1109">Expression expected.</problem>
<problem file="src/store/types.ts" line="355" column="1" code="2304">Cannot find name 'Now'.</problem>
<problem file="src/store/types.ts" line="355" column="5" code="2304">Cannot find name 'let'.</problem>
<problem file="src/store/types.ts" line="355" column="8" code="2365">Operator '&lt;' cannot be applied to types 'string' and 'number'.</problem>
<problem file="src/store/types.ts" line="357" column="2" code="2304">Cannot find name 'dyad'.</problem>
<problem file="src/store/types.ts" line="357" column="7" code="2304">Cannot find name 'write'.</problem>
<problem file="src/store/types.ts" line="357" column="13" code="2304">Cannot find name 'path'.</problem>
<problem file="src/store/types.ts" line="357" column="42" code="2304">Cannot find name 'description'.</problem>
<problem file="src/store/types.ts" line="361" column="3" code="2440">Import declaration conflicts with local declaration of 'AppState'.</problem>
<problem file="src/store/types.ts" line="361" column="13" code="2440">Import declaration conflicts with local declaration of 'QueueStatus'.</problem>
<problem file="src/store/types.ts" line="361" column="26" code="2440">Import declaration conflicts with local declaration of 'TierRule'.</problem>
<problem file="src/store/types.ts" line="361" column="36" code="2440">Import declaration conflicts with local declaration of 'MembershipLevel'.</problem>
<problem file="src/store/types.ts" line="361" column="53" code="2440">Import declaration conflicts with local declaration of 'Pet'.</problem>
<problem file="src/store/types.ts" line="361" column="58" code="2440">Import declaration conflicts with local declaration of 'Customer'.</problem>
<problem file="src/store/types.ts" line="362" column="3" code="2440">Import declaration conflicts with local declaration of 'QueueItem'.</problem>
<problem file="src/store/types.ts" line="362" column="14" code="2440">Import declaration conflicts with local declaration of 'Service'.</problem>
<problem file="src/store/types.ts" line="362" column="23" code="2440">Import declaration conflicts with local declaration of 'InventoryItem'.</problem>
<problem file="src/store/types.ts" line="362" column="38" code="2440">Import declaration conflicts with local declaration of 'Partner'.</problem>
<problem file="src/store/types.ts" line="362" column="47" code="2440">Import declaration conflicts with local declaration of 'StockLog'.</problem>
<problem file="src/store/types.ts" line="362" column="57" code="2440">Import declaration conflicts with local declaration of 'Transaction'.</problem>
<problem file="src/store/types.ts" line="363" column="3" code="2440">Import declaration conflicts with local declaration of 'Staff'.</problem>
<problem file="src/store/types.ts" line="363" column="10" code="2440">Import declaration conflicts with local declaration of 'ActivityLog'.</problem>
<problem file="src/store/types.ts" line="363" column="23" code="2440">Import declaration conflicts with local declaration of 'AddonItem'.</problem>
<problem file="src/store/types.ts" line="363" column="34" code="2440">Import declaration conflicts with local declaration of 'PackageTemplate'.</problem>
<problem file="src/store/types.ts" line="363" column="51" code="2440">Import declaration conflicts with local declaration of 'CreditPackageTemplate'.</problem>
<problem file="src/store/types.ts" line="364" column="3" code="2440">Import declaration conflicts with local declaration of 'PaymentMethod'.</problem>
<problem file="src/store/types.ts" line="364" column="18" code="2440">Import declaration conflicts with local declaration of 'ServicePriceInfo'.</problem>
<problem file="src/store/types.ts" line="364" column="36" code="2440">Import declaration conflicts with local declaration of 'SubService'.</problem>
<problem file="src/store/types.ts" line="364" column="48" code="2440">Import declaration conflicts with local declaration of 'BookingType'.</problem>
<problem file="src/store/types.ts" line="364" column="61" code="2440">Import declaration conflicts with local declaration of 'ServiceIcon'.</problem>
<problem file="src/store/types.ts" line="364" column="74" code="2440">Import declaration conflicts with local declaration of 'StaffRole'.</problem>
<problem file="src/store/types.ts" line="364" column="85" code="2440">Import declaration conflicts with local declaration of 'ReportHistory'.</problem>
<problem file="src/store/types.ts" line="368" column="3" code="2303">Circular definition of import alias 'AppState'.</problem>
<problem file="src/store/types.ts" line="368" column="13" code="2303">Circular definition of import alias 'QueueStatus'.</problem>
<problem file="src/store/types.ts" line="368" column="26" code="2303">Circular definition of import alias 'TierRule'.</problem>
<problem file="src/store/types.ts" line="368" column="36" code="2303">Circular definition of import alias 'MembershipLevel'.</problem>
<problem file="src/store/types.ts" line="368" column="53" code="2303">Circular definition of import alias 'Pet'.</problem>
<problem file="src/store/types.ts" line="368" column="58" code="2303">Circular definition of import alias 'Customer'.</problem>
<problem file="src/store/types.ts" line="369" column="3" code="2303">Circular definition of import alias 'QueueItem'.</problem>
<problem file="src/store/types.ts" line="369" column="14" code="2303">Circular definition of import alias 'Service'.</problem>
<problem file="src/store/types.ts" line="369" column="23" code="2303">Circular definition of import alias 'InventoryItem'.</problem>
<problem file="src/store/types.ts" line="369" column="38" code="2303">Circular definition of import alias 'Partner'.</problem>
<problem file="src/store/types.ts" line="369" column="47" code="2303">Circular definition of import alias 'StockLog'.</problem>
<problem file="src/store/types.ts" line="369" column="57" code="2303">Circular definition of import alias 'Transaction'.</problem>
<problem file="src/store/types.ts" line="370" column="3" code="2303">Circular definition of import alias 'Staff'.</problem>
<problem file="src/store/types.ts" line="370" column="10" code="2303">Circular definition of import alias 'ActivityLog'.</problem>
<problem file="src/store/types.ts" line="370" column="23" code="2303">Circular definition of import alias 'AddonItem'.</problem>
<problem file="src/store/types.ts" line="370" column="34" code="2303">Circular definition of import alias 'PackageTemplate'.</problem>
<problem file="src/store/types.ts" line="370" column="51" code="2303">Circular definition of import alias 'CreditPackageTemplate'.</problem>
<problem file="src/store/types.ts" line="371" column="3" code="2303">Circular definition of import alias 'PaymentMethod'.</problem>
<problem file="src/store/types.ts" line="371" column="18" code="2303">Circular definition of import alias 'ServicePriceInfo'.</problem>
<problem file="src/store/types.ts" line="371" column="36" code="2303">Circular definition of import alias 'SubService'.</problem>
<problem file="src/store/types.ts" line="371" column="48" code="2303">Circular definition of import alias 'BookingType'.</problem>
<problem file="src/store/types.ts" line="371" column="61" code="2303">Circular definition of import alias 'ServiceIcon'.</problem>
<problem file="src/store/types.ts" line="371" column="74" code="2303">Circular definition of import alias 'StaffRole'.</problem>
<problem file="src/store/types.ts" line="371" column="85" code="2303">Circular definition of import alias 'ReportHistory'.</problem>
<problem file="src/store/useStore.ts" line="17" column="58" code="2739">Type '{ language: &quot;th&quot;; setLanguage: (lang: Language) =&gt; void; currency: string; isAuthenticated: false; isAuthLoading: true; currentUser: any; storeId: string; shopName: string; shopLogo: any; ... 96 more ...; buyCreditPackage: (cid: string, pid: string) =&gt; void; }' is missing the following properties from type 'AppState': rolePermissions, updateRolePermissions</problem>
</dyad-problem-report><think>**Diagnosing Compiler Issues**

I've got a mountain of TypeScript errors, 63 to be exact! It looks like there's some corrupted syntax in `src/store/types.ts`. I suspect a markdown fragment or rogue `＜dyad-write>` tag got appended at the end of the file, causing these compile-time headaches and circular dependencies.


**Analyzing File Structure**

I'm now delving into `src/store/useStore.ts`, aiming to initialize `rolePermissions` with sane defaults. I'm also implementing the `updateRolePermissions` function within this file. This should improve the overall architecture. I'm focusing on defining defaults in the store, and implementing `updateRolePermissions`, starting with a core set of imports.


</think><dyad-write path="src/store/types.ts" description="Rewriting types.ts cleanly to fix syntax errors and circular imports.">
import { Language } from '@/utils/translations';

// Basic Types
export type ServiceIcon = 'grooming' | 'bath' | 'spa' | 'nail' | 'dry' | 'health' | 'brush' | 'hotel' | 'love' | 'food' | 'premium';
export type MembershipLevel = 'Standard' | 'Silver' | 'Gold' | 'VIP';
export type QueueStatus = 'Waiting' | 'Checked-in' | 'In Progress' | 'Completed';
export type PaymentMethod = 'Cash' | 'Transfer' | 'Credit Card' | 'Package' | 'Store Credit';
export type StaffRole = 'Admin' | 'Groomer' | 'Assistant';
export type BookingType = 'Appointment' | 'Walk-in';

// Entities
export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  birthday: string;
  weightHistory: { date: string; value: number }[];
  serviceHistory: any[];
  intakeHistory?: any[];
  notes: string;
  image: string;
  coatType?: 'Short' | 'Long' | string;
  color?: string;
  temperament?: string;
  vaccineBookImage?: string;
  precautions?: string;
  medicalCondition?: string;
}

export interface Customer {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  age?: string;
  phone: string;
  email: string;
  membership: MembershipLevel;
  pets: Pet[];
  totalSpent: number;
  creditBalance: number;
  lineId?: string;
  packages?: any[];
  creditHistory?: any[];
  taxId?: string;
  branchName?: string;
  houseNo?: string;
  villageNo?: string;
  soi?: string;
  road?: string;
  subDistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
}

export interface QueueItem {
  id: string;
  petId: string;
  petName: string;
  ownerName: string;
  serviceName: string;
  date: string;
  time: string;
  status: QueueStatus;
  image: string;
  isPaid?: boolean;
  startTime?: string;
  endTime?: string;
}

export interface ServicePriceInfo {
  price: number;
  duration: number;
}

export interface SubService {
  name: string;
  price: number;
}

export interface Service {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: ServiceIcon;
  targetSpecies: 'Dog' | 'Cat';
  prices: Record<string, ServicePriceInfo>;
  isActive: boolean;
  isPopular?: boolean;
  subServices?: SubService[];
  coatType?: 'Short' | 'Long';
}

export interface InventoryItem {
  id: string;
  name: string;
  barcode?: string;
  stock: number;
  minStock: number;
  price: number;
  costPrice: number;
  unit: string;
  category: string;
  image?: string;
  isConsignment: boolean;
  partnerId?: string;
  consignmentRate?: number;
}

export interface Partner {
  id: string;
  companyName: string;
  taxId?: string;
  address?: string;
  phone: string;
  email: string;
  contactPerson: string;
  notes: string;
  mainCategory?: string;
  gpRate: number;
}

export interface StockLog {
  id: string;
  productId: string;
  productName: string;
  action: 'Add' | 'Adjust' | 'Sale' | 'Consignment' | 'In' | 'Out';
  oldQty: number;
  newQty: number;
  reason: string;
  staffName: string;
  timestamp: string;
}

export interface ReportHistory {
  id: string;
  reportName: string;
  filters: string;
  staffName: string;
  timestamp: string;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  discountAmount: number;
  customerId: string;
  customerName: string;
  items: any[];
  paymentMethod: PaymentMethod;
  staffName: string;
  staffId?: string;
  species: string[];
  actualDuration?: number;
  bookingType: BookingType;
}

export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  phone: string;
  status: 'Active' | 'Inactive';
  avatar: string;
  username?: string;
  password?: string;
  commissionRate?: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  staffName: string;
  action: string;
  details: string;
  type: 'info' | 'success' | 'warning' | 'danger';
}

export interface TierRule {
  level: MembershipLevel;
  label: string;
  minSpent: number;
  discount: number;
}

export interface AddonItem {
  id: string;
  name: string;
  price: number;
  icon: ServiceIcon;
}

export interface PackageTemplate {
  id: string;
  name: string;
  serviceId: string;
  paidSlots: number;
  freeSlots: number;
  price: number;
  recurringFreebie?: string;
  oneTimeFreebie?: string;
  bonusType?: 'none' | 'recurring' | 'limited';
  bonusName?: string;
  bonusCount?: number;
}

export interface CreditPackageTemplate {
  id: string;
  name: string;
  price: number;
  creditValue: number;
}

// App State Interface
export interface AppState {
  language: Language;
  setLanguage: (lang: Language) => void;
  currency: string;
  isAuthenticated: boolean;
  currentUser: any;
  isAuthLoading: boolean;
  storeId: string | null;
  
  // Business Profile
  shopName: string;
  shopLogo: string | null;
  shopAddress: string;
  shopPhone: string;
  shopLineId: string;
  shopIsOpen: boolean;
  receiptHeader: string;
  receiptFooter: string;
  receiptPaperSize: '58mm' | '80mm';

  // LINE LIFF Settings
  liffId: string;
  liffChannelId: string;
  liffChannelSecret: string;
  liffEnabled: boolean;
  
  // Lists
  customers: Customer[];
  selectedOwner: Customer | null;
  activePet: Pet | null;
  activeQueueItemId: string | null;
  queue: QueueItem[];
  services: Service[];
  addons: AddonItem[];
  inventory: InventoryItem[];
  partners: Partner[];
  stockLogs: StockLog[];
  reportHistory: ReportHistory[];
  transactions: Transaction[];
  tierRules: TierRule[];
  packageTemplates: PackageTemplate[];
  creditPackages: CreditPackageTemplate[];
  staff: Staff[];
  logs: ActivityLog[];
  cart: any[];
  rolePermissions: Record<StaffRole, string[]>;

  // Rules & Settings
  slotDuration: number;
  openTime: string;
  closeTime: string;
  maxCapacity: number;
  disabledSlots: string[];
  recurringHolidays: number[];
  specificHolidays: string[];
  kennelCapacity: number;

  // Actions
  login: (id: string, pass: string) => boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  verifyPassword: (pass: string) => boolean;
  setSession: (user: any) => void;
  addLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  addReportLog: (log: Omit<ReportHistory, 'id' | 'timestamp'>) => void;
  
  updateBusinessProfile: (profile: any) => void;
  updateBookingSettings: (settings: any) => void;
  updateTierRules: (rules: TierRule[]) => void;
  updateRolePermissions: (role: StaffRole, permissions: string[]) => void;
  
  setCustomers: (customers: Customer[]) => void;
  selectOwner: (owner: Customer | null) => void;
  setActivePet: (pet: Pet | null) => void;
  setActiveQueueItem: (id: string | null) => void;
  addCustomer: (data: any) => void;
  updateCustomer: (id: string, data: any) => void;
  deleteCustomer: (id: string) => void;
  bindLineToCustomer: (customerId: string, lineId: string) => void;
  
  addPet: (customerId: string, pet: any) => void;
  updatePet: (customerId: string, petId: string, data: any) => void;
  updatePetWeight: (customerId: string, petId: string, weight: number) => void;
  saveIntakeRecord: (customerId: string, petId: string, record: any) => void;
  
  addBooking: (booking: any) => void;
  updateQueueStatus: (id: string, status: QueueStatus) => void;
  removeQueueItem: (id: string) => void;
  toggleSlotStatus: (time: string) => void;
  maxCapacitySlot?: number;
  markAsPaid: (id: string) => void;

  addToCart: (item: any) => void;
  removeFromCart: (index: number) => void;
  updateCartQuantity: (index: number, delta: number) => void;
  updateCartItemDiscount: (index: number, discountType: 'percent' | 'amount' | null, discountValue: number) => void;
  clearCart: () => void;
  processPayment: (customerId: string, total: number, discount: number, items: any[], method: PaymentMethod, details: any, isTaxInvoice: boolean) => void;
  deleteTransaction: (id: string) => void;

  setServices: (services: Service[]) => void;
  addService: (service: any) => void;
  updateService: (id: string, service: any) => void;
  deleteService: (id: string) => void;
  toggleServiceActive: (id: string) => void;
  
  addAddon: (addon: any) => void;
  updateAddon: (id: string, addon: any) => void;
  deleteAddon: (id: string) => void;
  
  addInventoryItem: (item: any) => void;
  updateInventoryItem: (id: string, item: any) => void;
  deleteInventoryItem: (id: string) => void;
  adjustStock: (id: string, qty: number, mode: 'Add' | 'Set' | 'In' | 'Out', reason: string) => void;
  
  addPartner: (partner: any) => void;
  updatePartner: (id: string, partner: any) => void;
  deletePartner: (id: string) => void;
  
  addStaff: (staff: any) => void;
  updateStaff: (id: string, staff: any) => void;
  deleteStaff: (id: string) => void;
  
  addPackageTemplate: (pkg: any) => void;
  updatePackageTemplate: (id: string, pkg: any) => void;
  deletePackageTemplate: (id: string) => void;
  assignPackageToCustomer: (customerId: string, templateId: string) => void;
  
  addCreditPackage: (pkg: any) => void;
  updateCreditPackage: (id: string, pkg: any) => void;
  deleteCreditPackage: (id: string) => void;
  buyCreditPackage: (customerId: string, packageId: string) => void;
}