"use client";

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { AlertCircle, ArrowRight, User, Lock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { login, isPendingApproval, isUserSuspended, language } = useStore();
  const navigate = useNavigate();
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(id, password);
    if (success) {
      navigate('/');
    } else {
      toast.error("ข้อมูลไม่ถูกต้อง");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FD] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white p-10 rounded-[48px] shadow-xl border border-gray-100 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-[#1A1F3D]">เข้าสู่ระบบ</h1>
        </div>

        {isPendingApproval && (
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-4 animate-in fade-in">
            <AlertCircle className="text-amber-600 shrink-0" size={24} />
            <div>
              <h4 className="text-sm font-black text-amber-900">รอการอนุมัติ</h4>
              <p className="text-xs text-amber-800/70 mt-1">บัญชีของคุณลงทะเบียนเรียบร้อยแล้ว กรุณารอผู้ดูแลระบบอนุมัติสิทธิ์การเข้าใช้งาน</p>
            </div>
          </div>
        )}

        {isUserSuspended && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-4 animate-in fade-in">
            <AlertCircle className="text-red-600 shrink-0" size={24} />
            <div>
              <h4 className="text-sm font-black text-red-900">บัญชีถูกระงับ</h4>
              <p className="text-xs text-red-800/70 mt-1">บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ</p>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" placeholder="ID" value={id} onChange={e => setId(e.target.value)} />
          <input type="password" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
          <button type="submit" className="w-full bg-[#1A1F3D] text-white font-black py-5 rounded-[24px] flex items-center justify-center gap-2">
            เข้าสู่ระบบ <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;