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
  Package,
  ShieldAlert
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
    { icon: ShieldAlert, label: 'Super Admin', path: '/superadmin' },
  ];

  // Filter menu items based on role permissions
  const userRole = currentUser?.role || 'Assistant';
  const allowedPaths = rolePermissions[userRole] || ['/', '/queue', '/customers'];
  
  // Always allow Super Admin path for Admin role
  const finalAllowedPaths = userRole === 'Admin' ? [...allowedPaths, '/superadmin'] : allowedPaths;
  const filteredMenuItems = menuItems.filter(item => finalAllowedPaths.includes(item.path));

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