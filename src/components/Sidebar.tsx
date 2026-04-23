"use client";

import React from 'react';
import { 
  Users, 
  Scissors, 
  BarChart3, 
  HelpCircle, 
  LogOut,
  ShoppingBag,
  Settings as SettingsIcon,
  LayoutDashboard
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';

const menuItems = [
  { icon: ShoppingBag, label: 'Checkout', path: '/' },
  { icon: LayoutDashboard, label: 'Pet Queue', path: '/queue' },
  { icon: Scissors, label: 'Services', path: '/services' },
  { icon: Users, label: 'Customers', path: '/customers' },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
  { icon: SettingsIcon, label: 'Settings', path: '/settings' },
];

const Sidebar = () => {
  const location = useLocation();
  const { shopName, shopLogo } = useStore();

  return (
    <div className="w-64 h-full bg-white flex flex-col p-6 border-r border-gray-100 shrink-0">
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

      <nav className="flex-1 space-y-1.5">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
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
          <button className="flex items-center gap-3 text-gray-400 hover:text-[#1A1F3D] transition-colors w-full group">
            <HelpCircle size={18} className="group-hover:rotate-12 transition-transform" />
            <span className="text-xs font-bold">Support Center</span>
          </button>
          <button className="flex items-center gap-3 text-gray-400 hover:text-red-500 transition-colors w-full group">
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold">Sign Out</span>
          </button>
        </div>
        
        <div className="bg-[#F5F6FA] p-4 rounded-[24px]">
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">Logged in as</p>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-[10px] font-black border border-gray-100">A</div>
            <span className="text-[10px] font-black text-[#1A1F3D]">Admin User</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;