"use client";

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore, StaffRole } from '@/store/useStore';
import { translations } from '@/utils/translations';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, Store, Users, Megaphone, Star, Package, 
  History, Activity, Globe, LogOut, ChevronRight, HelpCircle, Scissors,
  ShoppingBag, CalendarDays, ShieldCheck, Target, Settings, Menu
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
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
    { icon: Activity, label: t.reports, path: '/reports' },
    { icon: Settings, label: t.settings, path: '/settings' },
  ];

  const userRole = (currentUser?.role || 'Assistant') as StaffRole;
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
      "w-64 lg:w-[88px] lg:hover:w-64 lg:hover:shadow-2xl lg:hover:shadow-gray-200/50",
      className
    )}>
      {/* Sidebar Header */}
      <div className="flex items-center gap-4 lg:gap-0 lg:group-hover/sidebar:gap-4 mb-10 px-6 pt-8 shrink-0 justify-start lg:justify-center lg:group-hover/sidebar:justify-start transition-all duration-300">
        <div className="w-10 h-10 bg-[#1A1F3D] rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-lg shadow-[#1A1F3D]/10">
          {shopLogo && userRole !== 'superadmin' ? (
            <img src={shopLogo} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <Scissors className="text-white w-5 h-5" />
          )}
        </div>
        <div className="min-w-0 opacity-100 max-w-xs lg:opacity-0 lg:max-w-0 lg:group-hover/sidebar:opacity-100 lg:group-hover/sidebar:max-w-xs overflow-hidden transition-all duration-300 whitespace-nowrap">
          <h1 className="font-black text-[#1A1F3D] leading-tight truncate text-sm">
            {userRole === 'superadmin' ? 'System Central' : shopName}
          </h1>
          <p className="text-[9px] text-gray-400 font-black tracking-widest uppercase opacity-60">
            {userRole === 'superadmin' ? 'Platform Owner' : 'Premium Care'}
          </p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto scrollbar-hide">
        {filteredMenuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-2xl transition-all group",
              window.location.pathname === item.path 
                ? "bg-[#1A1F3D] text-white shadow-xl shadow-[#1A1F3D]/10" 
                : "text-gray-400 hover:bg-gray-50 hover:text-[#1A1F3D]"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0",
              window.location.pathname === item.path ? "bg-white/10" : "bg-gray-50 group-hover:bg-white"
            )}>
              <item.icon size={20} className={cn("shrink-0 transition-transform group-hover:scale-110", window.location.pathname === item.path ? "text-[#D9ED5F]" : "")} />
            </div>
            <span className="text-xs font-bold opacity-100 max-w-xs lg:opacity-0 lg:max-w-0 lg:group-hover/sidebar:opacity-100 lg:group-hover/sidebar:max-w-xs overflow-hidden transition-all duration-300">
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="mt-auto space-y-2 px-4 pb-8 shrink-0 border-t border-gray-50 pt-6">
        {/* Help Button */}
        <button className="w-full flex items-center gap-4 lg:gap-0 lg:group-hover/sidebar:gap-4 px-4 py-3.5 rounded-2xl text-gray-400 hover:bg-gray-50 hover:text-[#1A1F3D] transition-all duration-300 justify-start lg:justify-center lg:group-hover/sidebar:justify-start group">
          <HelpCircle size={20} className="shrink-0 transition-transform group-hover:scale-110" />
          <span className="text-xs font-bold opacity-100 max-w-xs lg:opacity-0 lg:max-w-0 lg:group-hover/sidebar:opacity-100 lg:group-hover/sidebar:max-w-xs overflow-hidden transition-all duration-300">
            {t.support}
          </span>
        </button>

        {/* Logout Button */}
        <button 
          onClick={handleLogout} 
          className="w-full flex items-center gap-4 lg:gap-0 lg:group-hover/sidebar:gap-4 px-4 py-3.5 rounded-2xl text-red-400 hover:bg-red-50 hover:text-red-600 transition-all duration-300 mb-4 justify-start lg:justify-center lg:group-hover/sidebar:justify-start group"
        >
          <LogOut size={20} className="shrink-0 transition-transform group-hover:scale-110" />
          <span className="text-xs font-bold opacity-100 max-w-xs lg:opacity-0 lg:max-w-0 lg:group-hover/sidebar:opacity-100 lg:group-hover/sidebar:max-w-xs overflow-hidden transition-all duration-300">
            {t.logout}
          </span>
        </button>
        
        {/* User Profile Card */}
        <div className="bg-[#F5F6FA] p-3 rounded-2xl flex items-center gap-3 lg:gap-0 lg:group-hover/sidebar:gap-3 justify-start lg:justify-center lg:group-hover/sidebar:justify-start transition-all duration-300 overflow-hidden whitespace-nowrap">
          <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-[10px] font-black border border-gray-100 shrink-0 overflow-hidden">
            {userAvatar ? (
              <img 
                src={userAvatar} 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userDisplayName)}`;
                }}
                alt="User Avatar" 
                className="w-full h-full object-cover" 
              />
            ) : (
              userInitial
            )}
          </div>
          <div className="opacity-100 max-w-xs lg:opacity-0 lg:max-w-0 lg:group-hover/sidebar:opacity-100 lg:group-hover/sidebar:max-w-xs overflow-hidden transition-all duration-300 min-w-0">
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