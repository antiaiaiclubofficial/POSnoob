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
  
  const { login, loginWithGoogle, language, setLanguage, isAuthenticated, isPendingApproval, isUserSuspended, isStoreSuspended } = useStore();
  
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

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle(window.location.origin);
    } catch (error) {
      toast.error("Google Login failed");
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

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="flex-shrink mx-4 text-gray-300 text-[10px] font-black uppercase tracking-widest">Or</span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            className="w-full bg-[#0d0e15] hover-gemini text-white border border-[#3a3f50] font-bold py-4 rounded-full flex items-center justify-center gap-3 shadow-sm active:scale-95"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-3.3 3.28-8.17 3.28-13.83z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Sign in with Google
          </button>
          
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