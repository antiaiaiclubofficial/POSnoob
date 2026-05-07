"use client";

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isAuthLoading } = useStore();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FD]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#1A1F3D]/10 border-t-[#1A1F3D] rounded-full animate-spin" />
          <p className="text-xs font-black text-[#1A1F3D] uppercase tracking-widest">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;