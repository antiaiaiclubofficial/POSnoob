"use client";

import React, { useState, useEffect } from 'react';
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
  Package,
  Calculator,
  BookOpen,
  ChevronDown
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { translations } from '@/utils/translations';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from 'sonner';
import { BranchSwitcher } from './BranchSwitcher';

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

export const SidebarContent = ({ className, onClose }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { shopName, shopLogo, logout, language, currentUser, rolePermissions } = useStore();
  const t = translations[language];

  const menuGroups = [
    { icon: LayoutDashboard, label: t.dashboard, path: '/' },
    { icon: ShoppingBag, label: t.pos, path: '/pos' },
    { icon: CalendarDays, label: t.queue, path: '/queue' },
    { icon: Users, label: t.customers, path: '/customers' },
    {
      icon: Package, 
      label: 'สต๊อก & บัญชี',
      submenu: [
        { icon: Package, label: t.inventory, path: '/inventory' },
        { icon: Calculator, label: t.accounting || 'Sales & Procurement', path: '/sales-procurement' },
        { icon: BookOpen, label: 'ระบบบัญชี', path: '/accounting' },
      ]
    },
    {
      icon: ShieldCheck, 
      label: 'พนักงาน',
      submenu: [
        { icon: ShieldCheck, label: t.staff, path: '/staff' },
        { icon: Target, label: t.performance, path: '/staff/performance' },
      ]
    },
    {
      icon: BarChart3, 
      label: 'รายงาน & ระบบ',
      submenu: [
        { icon: Megaphone, label: t.marketing, path: '/marketing' },
        { icon: BarChart3, label: t.reports, path: '/reports' },
        { icon: History, label: t.logs, path: '/logs' }
      ]
    }
  ];

  // ตรวจสอบสิทธิ์การเข้าถึงเมนูตามบทบาทของผู้ใช้
  const userRole = currentUser?.role || 'Assistant';
  let allowedPaths = rolePermissions[userRole] || ['/', '/queue', '/customers'];
  
  // Ensure accounting is available for Admin and superadmin even if DB roles aren't updated yet
  if (userRole === 'Admin' || userRole === 'superadmin') {
    if (!allowedPaths.includes('/sales-procurement')) {
      allowedPaths = [...allowedPaths, '/sales-procurement'];
    }
    if (!allowedPaths.includes('/accounting')) {
      allowedPaths = [...allowedPaths, '/accounting'];
    }
  }

  // กรองเมนูตามสิทธิ์ที่กำหนดไว้ใน useStore
  const filteredMenuGroups = menuGroups.map(group => {
    if (group.submenu) {
      const filteredSubmenu = group.submenu.filter(sub => allowedPaths.includes(sub.path));
      return { ...group, submenu: filteredSubmenu };
    }
    return group;
  }).filter(group => {
    if (group.submenu) {
      return group.submenu.length > 0;
    }
    return allowedPaths.includes(group.path as string);
  });

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    filteredMenuGroups.forEach(group => {
      if (group.submenu) {
        if (group.submenu.some(sub => location.pathname === sub.path)) {
          initialState[group.label] = true;
        } else {
          initialState[group.label] = false;
        }
      }
    });
    return initialState;
  });

  const [isBranchSelectOpen, setIsBranchSelectOpen] = useState(false);
  const isExpanded = isBranchSelectOpen;

  useEffect(() => {
    setOpenMenus(prev => {
      const next = { ...prev };
      let changed = false;
      filteredMenuGroups.forEach(group => {
        if (group.submenu && group.submenu.some(sub => location.pathname === sub.path)) {
          if (!next[group.label]) {
            next[group.label] = true;
            changed = true;
          }
        }
      });
      return changed ? next : prev;
    });
  }, [location.pathname]);

  const toggleMenu = (label: string) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

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
      isExpanded && "lg:!w-64",
      className
    )}>
      <div className="flex items-center gap-4 mb-6 px-6 pt-8 shrink-0">
        <div className="w-10 h-10 bg-[#1A1F3D] rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-lg shadow-[#1A1F3D]/10">
          {shopLogo && userRole !== 'superadmin' ? (
            <img src={shopLogo} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <Scissors className="text-white w-5 h-5" />
          )}
        </div>
        <div className={cn("min-w-0 opacity-100 lg:opacity-0 lg:group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap", isExpanded && "lg:!opacity-100")}>
          <h1 className="font-black text-[#1A1F3D] leading-tight truncate text-sm">
            {userRole === 'superadmin' ? 'System Central' : shopName}
          </h1>
          <p className="text-[9px] text-gray-400 font-black tracking-widest uppercase opacity-60">
            {userRole === 'superadmin' ? 'Platform Owner' : 'Premium Care'}
          </p>
        </div>
      </div>

      <div className={cn(
        "px-4 transition-all duration-300 overflow-hidden",
        "max-h-[100px] opacity-100 mb-5 py-1",
        "lg:max-h-0 lg:opacity-0 lg:mb-0 lg:py-0",
        "lg:group-hover/sidebar:max-h-[100px] lg:group-hover/sidebar:opacity-100 lg:group-hover/sidebar:mb-5 lg:group-hover/sidebar:py-1",
        isExpanded && "lg:!max-h-[100px] lg:!opacity-100 lg:!mb-5 lg:!py-1"
      )}>
        <BranchSwitcher onOpenChange={setIsBranchSelectOpen} />
      </div>

      <nav className="flex-1 space-y-2 px-4 overflow-y-auto scrollbar-hide pb-4">
        {filteredMenuGroups.map((group) => {
          if (group.submenu) {
            const isOpen = openMenus[group.label];
            const hasActiveChild = group.submenu.some(sub => location.pathname === sub.path);
            
            return (
              <div key={group.label} className="space-y-1">
                <button
                  onClick={() => toggleMenu(group.label)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group overflow-hidden whitespace-nowrap",
                    hasActiveChild 
                      ? "bg-gray-100/50 text-[#1A1F3D] font-bold" 
                      : "text-gray-400 hover:bg-gray-50 hover:text-[#1A1F3D]"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <group.icon size={20} className={cn("shrink-0 transition-transform group-hover:scale-110", hasActiveChild ? "text-[#1A1F3D]" : "")} />
                    <span className={cn("text-xs font-medium opacity-100 lg:opacity-0 lg:group-hover/sidebar:opacity-100 transition-opacity duration-300", isExpanded && "lg:!opacity-100")}>
                      {group.label}
                    </span>
                  </div>
                  <ChevronDown 
                    size={16} 
                    className={cn(
                      "shrink-0 opacity-100 lg:opacity-0 lg:group-hover/sidebar:opacity-100 transition-all duration-300",
                      isOpen ? "rotate-180" : "",
                      isExpanded && "lg:!opacity-100"
                    )} 
                  />
                </button>
                
                {isOpen && (
                  <div className={cn("pl-4 space-y-1 block lg:hidden lg:group-hover/sidebar:block mt-1", isExpanded && "lg:!block")}>
                    {group.submenu.map(sub => {
                      const isActive = location.pathname === sub.path;
                      return (
                        <Link
                          key={sub.path}
                          to={sub.path}
                          onClick={onClose}
                          className={cn(
                            "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group overflow-hidden whitespace-nowrap",
                            isActive 
                              ? "bg-[#1A1F3D] text-white shadow-xl shadow-[#1A1F3D]/10 font-bold" 
                              : "text-gray-400 hover:bg-gray-50 hover:text-[#1A1F3D]"
                          )}
                        >
                          <sub.icon size={18} className={cn("shrink-0 transition-transform group-hover:scale-110", isActive ? "text-[#D9ED5F]" : "")} />
                          <span className="text-xs">
                            {sub.label}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive = location.pathname === group.path;
          return (
            <Link
              key={group.path}
              to={group.path as string}
              onClick={onClose}
              className={cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group overflow-hidden whitespace-nowrap",
                isActive 
                  ? "bg-[#1A1F3D] text-white shadow-xl shadow-[#1A1F3D]/10 font-bold" 
                  : "text-gray-400 hover:bg-gray-50 hover:text-[#1A1F3D]"
              )}
            >
              <group.icon size={20} className={cn("shrink-0 transition-transform group-hover:scale-110", isActive ? "text-[#D9ED5F]" : "")} />
              <span className={cn("text-xs font-medium opacity-100 lg:opacity-0 lg:group-hover/sidebar:opacity-100 transition-opacity duration-300", isExpanded && "lg:!opacity-100")}>
                {group.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4 px-4 pb-8 shrink-0">
        <div className="pt-6 border-t border-gray-50 space-y-1">
          {allowedPaths.includes('/settings') && (
            <Link 
              to="/settings"
              onClick={onClose}
              className="flex items-center gap-4 px-4 py-3 text-gray-400 hover:text-[#1A1F3D] transition-colors group overflow-hidden whitespace-nowrap"
            >
              <SettingsIcon size={20} className="shrink-0 group-hover:rotate-90 transition-transform duration-300" />
              <span className={cn("text-xs font-bold opacity-100 lg:opacity-0 lg:group-hover/sidebar:opacity-100 transition-opacity duration-300", isExpanded && "lg:!opacity-100")}>{t.settings}</span>
            </Link>
          )}
          <a 
            href="https://lin.ee/wU8azb5" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-4 px-4 py-3 text-gray-400 hover:text-[#1A1F3D] transition-colors group overflow-hidden whitespace-nowrap"
          >
            <HelpCircle size={20} className="shrink-0 group-hover:rotate-12 transition-transform" />
            <span className={cn("text-xs font-bold opacity-100 lg:opacity-0 lg:group-hover/sidebar:opacity-100 transition-opacity duration-300", isExpanded && "lg:!opacity-100")}>{t.support}</span>
          </a>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3 text-gray-400 hover:text-red-500 transition-colors w-full group overflow-hidden whitespace-nowrap"
          >
            <LogOut size={20} className="shrink-0 group-hover:-translate-x-1 transition-transform" />
            <span className={cn("text-xs font-bold opacity-100 lg:opacity-0 lg:group-hover/sidebar:opacity-100 transition-opacity duration-300", isExpanded && "lg:!opacity-100")}>{t.logout}</span>
          </button>
        </div>
        
        <div className="bg-[#F3F3F3] p-3 rounded-2xl flex items-center gap-3 overflow-hidden whitespace-nowrap">
          <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-[10px] font-black border border-gray-100 shrink-0 overflow-hidden">
            {userAvatar ? (
              <img src={userAvatar} alt="User Avatar" className="w-full h-full object-cover" />
            ) : (
              userInitial
            )}
          </div>
          <div className={cn("opacity-100 lg:opacity-0 lg:group-hover/sidebar:opacity-100 transition-opacity duration-300 min-w-0", isExpanded && "lg:!opacity-100")}>
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