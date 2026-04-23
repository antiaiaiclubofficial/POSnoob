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
  History
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const menuItems = [
  { icon: ShoppingBag, label: 'Checkout', path: '/' },
  { icon: LayoutDashboard, label: 'Pet Queue', path: '/queue' },
  { icon: Users, label: 'Customers', path: '/customers' },
  { icon: ShieldCheck, label: 'Staff Management', path: '/staff' },
  { icon: History, label: 'Activity Logs', path: '/logs' },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
  { icon: SettingsIcon, label: 'Settings', path: '/settings' },
];

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

export const SidebarContent = ({ className, onClose }: SidebarProps) => {
  const location = useLocation();
  const { shopName, shopLogo } = useStore();

  return (
    <div className={cn("w-64 h-full bg-white flex flex-col p-6 border-r border-gray-100 shrink-0", className)}>
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 bg-[#1A1F3D] rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-lg shadow-[#1A1F3D]/10">
          {shopLogo ? (
            <img src={shopLogo} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <Scissors className="text-white w-5 h-5" />
          )}
        </div>
        <div className="min-w-0">
          <h1 className="font-black text-[#1A1F3D] leading-tight truncate text-sm" title={shopName}>
            {shopName}
          </h1>
          <p className="text-[9px] text-gray-400 font-black tracking-widest uppercase opacity-60">Premium Care</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group",
                isActive 
                  ? "bg-[#1A1F3D] text-white shadow-xl shadow-[#1A1F3D]/10 font-bold" 
                  : "text-gray-400 hover:bg-gray-50 hover:text-[#1A1F3D]"
              )}
            >
              <item.icon size={18} className={cn("transition-transform group-hover:scale-110", isActive ? "text-[#D9ED5F]" : "")} />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-6 pt-6 border-t border-gray-50">
        <div className="px-2 space-y-4">
          <a 
            href="https://www.elmony.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-gray-400 hover:text-[#1A1F3D] transition-colors w-full group"
          >
            <HelpCircle size={18} className="group-hover:rotate-12 transition-transform" />
            <span className="text-xs font-bold">Support</span>
          </a>
          <button className="flex items-center gap-3 text-gray-400 hover:text-red-500 transition-colors w-full group">
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold">Sign Out</span>
          </button>
        </div>
        
        <div className="bg-[#F5F6FA] p-4 rounded-[24px]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-[10px] font-black border border-gray-100">A</div>
            <span className="text-[10px] font-black text-[#1A1F3D] truncate">Admin User</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Sidebar = () => {
  return (
    <>
      {/* Desktop Sidebar */}
      <SidebarContent className="hidden lg:flex" />
      
      {/* Mobile Trigger */}
      <div className="lg:hidden fixed top-6 left-6 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <button className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center text-[#1A1F3D] border border-gray-100">
              <Menu size={24} />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-none">
            <SidebarContent className="w-full border-none" />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default Sidebar;