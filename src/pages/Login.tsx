"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Lock, User, Scissors, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { translations } from '@/utils/translations';
import { cn } from '@/lib/utils';

const Login = () => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  
  const { login, language, setLanguage, isAuthenticated, isPendingApproval, isUserSuspended, isStoreSuspended } = useStore();
  
  const t = translations[language];
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(id, password);
    if (success) {
      toast.success(t.welcomeBack);
      navigate('/');
    } else {
      toast.error(t.invalidCreds);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FD] flex items-center justify-center p-6 relative">
      {/* Language Toggle in Corner */}
      <div className="absolute top-8 right-8 flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 gap-1 z-10">
        <button 
          onClick={() => setLanguage('th')}
          className={cn(
            "px-4 py-2 rounded-xl text-[10px] font-black transition-all",
            language === 'th' ? "bg-[#1A1F3D] text-white shadow-md" : "text-gray-400 hover:text-gray-600"
          )}
        >
          TH
        </button>
        <button 
          onClick={() => setLanguage('en')}
          className={cn(
            "px-4 py-2 rounded-xl text-[10px] font-black transition-all",
            language === 'en' ? "bg-[#1A1F3D] text-white shadow-md" : "text-gray-400 hover:text-gray-600"
          )}
        >
          EN
        </button>
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-[#1A1F3D] rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-[#1A1F3D]/20">
            <Scissors className="text-[#D9ED5F] w-10 h-10" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles size={16} className="text-amber-400" />
            <h1 className="text-3xl font-black text-[#1A1F3D]">Tactile Sanctuary</h1>
          </div>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em]">{t.loginSystem}</p>
        </div>

        <div className="bg-white p-10 rounded-[48px] shadow-sm border border-gray-100 space-y-6">
          {/* Pending Approval Alert */}
          {isPendingApproval && (
            <div className="p-5 bg-amber-50 border border-amber-100 rounded-3xl flex items-start gap-3 text-amber-800 animate-in fade-in zoom-in-95">
              <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
              <div className="text-left">
                <p className="text-xs font-black uppercase tracking-wider mb-1">อยู่ระหว่างรอการอนุมัติ</p>
                <p className="text-[11px] font-medium leading-relaxed text-amber-700">
                  บัญชีของคุณลงทะเบียนสำเร็จแล้ว แต่ต้องรอให้ Super Admin อนุมัติและกำหนดร้านค้าให้ก่อน จึงจะสามารถเข้าใช้งานระบบได้
                </p>
              </div>
            </div>
          )}

          {/* User Suspended Alert */}
          {isUserSuspended && (
            <div className="p-5 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-3 text-red-800 animate-in fade-in zoom-in-95">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
              <div className="text-left">
                <p className="text-xs font-black uppercase tracking-wider mb-1">บัญชีถูกระงับการใช้งาน</p>
                <p className="text-[11px] font-medium leading-relaxed text-red-700">
                  ขออภัย บัญชีผู้ใช้ของคุณถูกระงับการใช้งานชั่วคราวโดยผู้ดูแลระบบสูงสุด กรุณาติดต่อฝ่ายสนับสนุนเพื่อขอข้อมูลเพิ่มเติม
                </p>
              </div>
            </div>
          )}

          {/* Store Suspended Alert */}
          {isStoreSuspended && (
            <div className="p-5 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-3 text-red-800 animate-in fade-in zoom-in-95">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
              <div className="text-left">
                <p className="text-xs font-black uppercase tracking-wider mb-1">ร้านค้าถูกระงับการให้บริการ</p>
                <p className="text-[11px] font-medium leading-relaxed text-red-700">
                  ขออภัย ร้านค้าต้นสังกัดของคุณถูกระงับการให้บริการชั่วคราวโดยผู้ดูแลระบบสูงสุด ส่งผลให้ไม่สามารถเข้าใช้งานระบบจัดการร้านค้าได้ในขณะนี้
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">{t.operatorId}</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input 
                    type="text"
                    autoFocus
                    className="w-full bg-[#F5F6FA] border-none rounded-[24px] pl-14 pr-6 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all"
                    placeholder={t.enterAdminId}
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">{t.accessPin}</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input 
                    type="password"
                    className="w-full bg-[#F5F6FA] border-none rounded-[24px] pl-14 pr-6 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all"
                    placeholder={t.enterPassword}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-[#1A1F3D] hover:bg-[#2A3152] text-white font-black py-5 rounded-[24px] flex items-center justify-center gap-3 shadow-xl shadow-[#1A1F3D]/10 transition-all active:scale-95 mt-4"
            >
              {t.signIn} <ArrowRight size={18} />
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-[10px] text-gray-300 font-bold uppercase">{t.authorizedOnly}</p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400 font-medium">{t.forgotPin}</p>
        </div>
      </div>
    </div>
  );
};

export default Login;