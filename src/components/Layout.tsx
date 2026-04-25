"use client";

import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="flex h-screen bg-[#F8F9FD] text-[#1A1F3D] overflow-hidden relative">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;