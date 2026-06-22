"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { 
  User, Phone, Mail, Clock, Scissors, Lock, Check, X, Ban, ArrowRight, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { translations } from '@/utils/translations';

const Login = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { 
    shopName, shopLogo, logout, language, setLanguage, isAuthenticated, currentUser, login, loginWithGoogle,
    isPendingApproval, isUserSuspended
  } = useStore();

  const t = translations[language];
  
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');

  const [inviteData, setInviteData] = useState<any>(null);
  const [isInviteSuccess, setIsInviteSuccess] = useState(false);
  const [successStoreName, setSuccessStoreName] = useState('');

  const isInvite = searchParams.get('invite') === 'true';
  const token = searchParams.get('token');
  const isEmailMismatch = searchParams.get('error') === 'email_mismatch';
  const isInvalidInvite = searchParams.get('error') === 'invalid_invite';

  useEffect(() => {
    if (isInvite && token) {
      try {
        const decodedData = JSON.parse(decodeURIComponent(atob(token)));
        
        if (decodedData && decodedData.inviteId) {
          const finalInviteData = {
            inviteId: decodedData.inviteId,
            storeId: decodedData.storeId,
            storeName: decodedData.storeName || 'Tactile Sanctuary',
            role: decodedData.role,
            name: decodedData.name,
            commissionRate: decodedData.commissionRate,
            phone: decodedData.phone,
            avatar: decodedData.avatar,
            email: decodedData.email // Ensure email is captured
          };

          setInviteData(finalInviteData);
          localStorage.setItem('pending_invite_data', JSON.stringify(finalInviteData));
        } else {
          // Only redirect if we are sure it's an invalid invite
          if (!isInvalidInvite) {
            navigate('/login?invite=true&error=invalid_invite', { replace: true });
          }
        }
      } catch (err) {
        console.error("Error decoding invite token:", err);
        if (!isInvalidInvite) {
          navigate('/login?invite=true&error=invalid_invite', { replace: true });
        }
      }
    }

    if (searchParams.get('registered') === 'true') {
      setIsInviteSuccess(true);
      const pendingData = localStorage.getItem('pending_invite_data');
      if (pendingData) {
        try {
          const parsed = JSON.parse(pendingData);
          setSuccessStoreName(parsed.storeName || '');
        } catch (e) {}
      }
    }
  }, [isInvite, token, searchParams, navigate, isInvalidInvite]);

  useEffect(() => {
    if (isAuthenticated && !isInvite) {
      if (currentUser?.role === 'superadmin') {
        navigate('/superadmin');
      } else {
        navigate('/');
      }
    }
  }, [isAuthenticated, currentUser, navigate, isInvite]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (id === 'superadmin') {
      toast.error("กรุณาเข้าสู่ระบบผู้ดูแลระบบสูงสุดผ่านช่องทางเฉพาะ", { id: 'superadmin-error' });
      return;
    }
    const success = login(id, password);
    if (success) {
      toast.success(t.welcomeBack, { id: 'login-success' });
      navigate('/');
    } else {
      toast.error(t.invalidCreds, { id: 'login-error' });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle(window.location.origin + '/login');
    } catch (error) {
      toast.error("Google Login failed", { id: 'google-login-error' });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  if (isEmailMismatch || isInvalidInvite) {
    return (
      <div className="min-h-screen bg-[#F8F9FD] flex items-center justify-center p-6 relative">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-red-500 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-500/20">
            <X className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-[#1A1F3D] mb-2">เชื่อมต่อไม่สำเร็จ</h1>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            {isEmailMismatch 
              ? "กรุณาติดต่อ Admin เพื่อขอ Invite Link ใหม่ และใช้ Google Account ให้ตรงกับในระบบที่ระบุไว้"
              : "ลิงก์คำเชิญไม่ถูกต้องหรือหมดอายุแล้ว กรุณาติดต่อ Admin เพื่อขอลิงก์ใหม่"}
          </p>
          <button
            onClick={() => {
              localStorage.removeItem('pending_invite_data');
              navigate('/login', { replace: true });
            }}
            className="w-full bg-[#1A1F3D] hover:bg-[#2A3152] text-white font-black py-5 rounded-[24px] flex items-center justify-center gap-3 shadow-xl shadow-[#1A1F3D]/10 transition-all active:scale-95"
          >
            กลับไปหน้าเข้าสู่ระบบ
          </button>
        </div>
      </div>
    );
  }

  if (isInviteSuccess) {
    return (
      <div className="min-h-screen bg-[#F8F9FD] flex items-center justify-center p-6 relative">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-green-500 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-500/20">
            <Check className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-[#1A1F3D] mb-2">เชื่อมต่อสำเร็จ!</h1>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            บัญชี Google ของคุณได้รับการเชื่อมต่อกับระบบ Tactile Sanctuary ของร้าน <span className="font-black text-[#1A1F3D]">{successStoreName || shopName}</span> เรียบร้อยแล้ว คุณสามารถเข้าสู่ระบบด้วย Google ได้ทันที
          </p>
          <button
            onClick={() => {
              setIsInviteSuccess(false);
              navigate('/login', { replace: true });
            }}
            className="w-full bg-[#1A1F3D] hover:bg-[#2A3152] text-white font-black py-5 rounded-[24px] flex items-center justify-center gap-3 shadow-xl shadow-[#1A1F3D]/10 transition-all active:scale-95"
          >
            เข้าสู่ระบบปกติ
          </button>
        </div>
      </div>
    );
  }

  if (isPendingApproval) {
    return (
      <div className="min-h-screen bg-[#F8F9FD] flex items-center justify-center p-6 relative">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-amber-500 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-amber-500/20">
            <Clock className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-[#1A1F3D] mb-2">รอการอนุมัติ</h1>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            บัญชีผู้ใช้งานของคุณอยู่ระหว่างรอการอนุมัติจากผู้ดูแลระบบสูงสุด (Super Admin) กรุณาติดต่อผู้ดูแลระบบของท่านเพื่อเปิดใช้งานบัญชี
          </p>
          <button
            onClick={() => {
              logout();
            }}
            className="w-full bg-[#1A1F3D] hover:bg-[#2A3152] text-white font-black py-5 rounded-[24px] flex items-center justify-center gap-3 shadow-xl shadow-[#1A1F3D]/10 transition-all active:scale-95"
          >
            กลับไปหน้าเข้าสู่ระบบ
          </button>
        </div>
      </div>
    );
  }

  if (isUserSuspended) {
    return (
      <div className="min-h-screen bg-[#F8F9FD] flex items-center justify-center p-6 relative">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-red-500 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-500/20">
            <Ban className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-[#1A1F3D] mb-2">บัญชีถูกระงับการใช้งาน</h1>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            บัญชีผู้ใช้งานของคุณถูกระงับการใช้งานชั่วคราว กรุณาติดต่อผู้ดูแลระบบเพื่อตรวจสอบข้อมูลเพิ่มเติม
          </p>
          <button
            onClick={() => {
              logout();
            }}
            className="w-full bg-[#1A1F3D] hover:bg-[#2A3152] text-white font-black py-5 rounded-[24px] flex items-center justify-center gap-3 shadow-xl shadow-[#1A1F3D]/10 transition-all active:scale-95"
          >
            กลับไปหน้าเข้าสู่ระบบ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FD] flex items-center justify-center p-6 relative">
      <div className="absolute top-8 right-8 flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 gap-1 z-10">
        <button onClick={() => setLanguage('th')} className={cn("px-4 py-2 rounded-xl text-[10px] font-black transition-all", language === 'th' ? "bg-[#1A1F3D] text-white shadow-md" : "text-gray-400 hover:text-gray-600")}>TH</button>
        <button onClick={() => setLanguage('en')} className={cn("px-4 py-2 rounded-xl text-[10px] font-black transition-all", language === 'en' ? "bg-[#1A1F3D] text-white shadow-md" : "text-gray-400 hover:text-gray-600")}>EN</button>
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#1A1F3D] rounded-[24px] flex items-center justify-center mx-auto mb-4 shadow-xl">
            {shopLogo ? <img src={shopLogo} alt="Logo" className="w-full h-full object-cover rounded-[24px]" /> : <Scissors className="text-[#D9ED5F] w-8 h-8" />}
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-[#1A1F3D]">{shopName}</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em]">{t.loginSystem}</p>
        </div>

        <div className="bg-white p-10 rounded-[48px] shadow-sm border border-gray-100 space-y-6">
          {inviteData && (
            <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-start gap-3 text-indigo-800 animate-in fade-in zoom-in-95">
              <Sparkles className="text-indigo-500 shrink-0 mt-0.5" size={18} />
              <div className="text-left">
                <p className="text-xs font-black uppercase tracking-wider mb-1">คุณได้รับเชิญเข้าร่วมทีม!</p>
                <p className="text-[11px] font-medium leading-relaxed text-indigo-700">
                  คุณได้รับคำเชิญให้เข้าสู่ระบบในตำแหน่ง <span className="font-black text-indigo-950">{inviteData.role}</span> ของร้าน <span className="font-black text-indigo-950">{inviteData.storeName}</span>
                  <br />กรุณาเข้าสู่ระบบด้วย Google เพื่อเชื่อมต่อบัญชีของคุณ
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
                  <input type="text" autoFocus className="w-full bg-[#F5F6FA] border-none rounded-[24px] pl-14 pr-6 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all" placeholder={t.enterAdminId} value={id} onChange={(e) => setId(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">{t.accessPin}</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input type="password" className="w-full bg-[#F5F6FA] border-none rounded-[24px] pl-14 pr-6 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all" placeholder={t.enterPassword} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </div>
            </div>
            <button type="submit" className="w-full text-white font-black py-5 rounded-[24px] flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 mt-4 bg-[#1A1F3D] hover:bg-[#2A3152] shadow-[#1A1F3D]/10">
              {t.signIn} <ArrowRight size={18} />
            </button>
          </form>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="flex-shrink mx-4 text-gray-300 text-[10px] font-black uppercase tracking-widest">Or</span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>

          <button onClick={handleGoogleLogin} onMouseMove={handleMouseMove} className="w-full bg-[#0d0e15] google-border-btn text-white font-bold py-4 rounded-full flex items-center justify-center gap-3 shadow-sm active:scale-95">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-3.3 3.28-8.17 3.28-13.83z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;