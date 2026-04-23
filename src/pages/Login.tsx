"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Lock, User, Scissors, Sparkles, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const login = useStore(state => state.login);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(id, password);
    if (success) {
      toast.success("Welcome back, Admin!");
      navigate('/');
    } else {
      toast.error("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FD] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-[#1A1F3D] rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-[#1A1F3D]/20 animate-bounce duration-300">
            <Scissors className="text-[#D9ED5F] w-10 h-10" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles size={16} className="text-amber-400" />
            <h1 className="text-3xl font-black text-[#1A1F3D]">Tactile Sanctuary</h1>
          </div>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em]">Management System Login</p>
        </div>

        <div className="bg-white p-10 rounded-[48px] shadow-sm border border-gray-100">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">Operator ID</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input 
                    type="text"
                    autoFocus
                    className="w-full bg-[#F5F6FA] border-none rounded-[24px] pl-14 pr-6 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all"
                    placeholder="Enter admin ID"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest px-1">Access Pin</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input 
                    type="password"
                    className="w-full bg-[#F5F6FA] border-none rounded-[24px] pl-14 pr-6 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all"
                    placeholder="Enter password"
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
              Sign In <ArrowRight size={18} />
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-[10px] text-gray-300 font-bold uppercase">Authorized Access Only</p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400 font-medium">Forgot access pin? Please contact technical support.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;