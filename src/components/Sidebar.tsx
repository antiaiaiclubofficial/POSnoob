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
  Megaphone
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const menuItems = [
  { icon: ShoppingBag, label: 'Checkout', path: '/' },
  { icon: LayoutDashboard, label: 'Pet Queue', path: '/queue' },
  { icon: Users, label: 'Customers', path: '/customers' },
  { icon: Megaphone, label: 'Marketing', path: '/marketing' }, // เพิ่มเมนูใหม่
  { icon: ShieldCheck, label: 'Staff Management', path: '/staff' },
  { icon: History, label: 'Activity Logs', path: '/logs' },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
  { icon: SettingsIcon, label: 'Settings', path: '/settings' },
];

export const SidebarContent = ({ className, onClose }: { className?: string; onClose?: () => void }) => {
  const location = useLocation();
  const { shopName, shopLogo } = useStore();

  return (
    <div className={cn(
      "h-full bg-white flex flex-col border-r border-gray-100 shrink-0 transition-all duration-300 ease-in-out overflow-hidden group/sidebar z-50",
      "w-[88px] hover:w-64",
      className
    )}>
      <div className="flex items-center gap-4 mb-10 px-6 pt-8 shrink-0">
        <div className="w-10 h-10 bg-[#1A1F3D] rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-lg shadow-[#1A1F3D]/10">
          {shopLogo ? <img src={shopLogo} className="w-full h-full object-cover" /> : <Scissors className="text-white w-5 h-5" />}
        </div>
        <div className="min-w-0 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          <h1 className="font-black text-[#1A1F3D] leading-tight truncate text-sm">{shopName}</h1>
          <p className="text-[9px] text-gray-400 font-black tracking-widest uppercase opacity-60">Premium Care</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-4 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group overflow-hidden whitespace-nowrap",
                isActive ? "bg-[#1A1F3D] text-white shadow-xl shadow-[#1A1F3D]/10 font-bold" : "text-gray-400 hover:bg-gray-50 hover:text-[#1A1F3D]"
              )}
            >
              <item.icon size={20} className={cn("shrink-0 transition-transform group-hover:scale-110", isActive ? "text-[#D9ED5F]" : "")} />
              <span className="text-xs opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4 px-4 pb-8 shrink-0">
        <div className="pt-6 border-t border-gray-50 space-y-1">
          <button className="flex items-center gap-4 px-4 py-3 text-gray-400 hover:text-red-500 transition-colors w-full group overflow-hidden whitespace-nowrap">
            <LogOut size={20} className="shrink-0 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">Sign Out</span>
          </button>
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
            <button className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center text-[#1A1F3D] border border-gray-100"><Menu size={24} /></button>
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