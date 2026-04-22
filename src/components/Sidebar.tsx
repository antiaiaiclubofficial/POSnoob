"use client";

import React from 'react';
import { 
  Users, 
  Scissors, 
  BarChart3, 
  HelpCircle, 
  LogOut,
  ShoppingBag
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Link, useLocation } from 'react-router-dom';

const menuItems = [
  { icon: ShoppingBag, label: 'Checkout', path: '/' },
  { icon: Users, label: 'Pet Queue', path: '/queue' },
  { icon: Scissors, label: 'Services', path: '/services' },
  { icon: Users, label: 'Customers', path: '/customers' },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="w-64 h-full bg-[#F8F9FD] flex flex-col p-6 border-r border-gray-100 shrink-0">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 bg-[#1A1F3D] rounded-xl flex items-center justify-center">
          <Scissors className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-[#1A1F3D] leading-tight">Tactile Sanctuary</h1>
          <p className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">Premium Pet Care</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200",
                isActive 
                  ? "bg-white shadow-sm text-[#1A1F3D] font-semibold" 
                  : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              )}
            >
              <item.icon size={20} />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto mb-8">
        <button className="w-full bg-[#D9ED5F] hover:bg-[#c8db54] text-[#1A1F3D] font-bold py-4 rounded-2xl flex items-center justify-center transition-colors shadow-sm">
          Quick Check-in
        </button>
      </div>

      <div className="space-y-4 px-4">
        <button className="flex items-center gap-3 text-gray-400 hover:text-gray-600 transition-colors">
          <HelpCircle size={20} />
          <span className="text-sm font-medium">Support</span>
        </button>
        <button className="flex items-center gap-3 text-gray-400 hover:text-gray-600 transition-colors">
          <LogOut size={20} />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;