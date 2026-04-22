"use client";

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Store, Globe, Save, ShieldCheck, TrendingUp } from 'lucide-react';
import { useStore, TierRule, MembershipLevel } from '@/store/useStore';
import { toast } from 'sonner';

const Settings = () => {
  const { tierRules, updateTierRules } = useStore();
  const [localTierRules, setLocalTierRules] = useState<TierRule[]>(tierRules);

  const handleSave = () => {
    updateTierRules(localTierRules);
    toast.success("Settings saved successfully!");
  };

  const updateRuleValue = (level: MembershipLevel, value: string) => {
    setLocalTierRules(prev => prev.map(r => 
      r.level === level ? { ...r, minSpent: Number(value) } : r
    ));
  };

  return (
    <div className="flex h-screen bg-[#F5F6FA] text-[#1A1F3D] overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-10 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-4xl font-extrabold mb-1">Settings</h1>
              <p className="text-gray-400 font-medium">Manage your shop preferences and membership rules</p>
            </div>
            <button 
              onClick={handleSave}
              className="bg-[#1A1F3D] text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-[#2A3152] transition-colors shadow-lg shadow-[#1A1F3D]/10"
            >
              <Save size={20} /> Save Changes
            </button>
          </div>

          <div className="space-y-8">
            {/* Membership Tier Rules */}
            <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Auto-Promotion Rules</h2>
                  <p className="text-xs text-gray-400">Set the minimum total spent required to reach each tier</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {localTierRules.map((rule) => (
                  <div key={rule.level} className="p-5 bg-[#F5F6FA] rounded-2xl border border-transparent hover:border-purple-200 transition-all group">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-black uppercase tracking-widest text-purple-600">{rule.level}</span>
                      <TrendingUp size={16} className="text-purple-300 group-hover:text-purple-500 transition-colors" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Min. Total Spent ($)</label>
                      <input 
                        type="number"
                        className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-purple-500/20" 
                        value={rule.minSpent}
                        onChange={(e) => updateRuleValue(rule.level, e.target.value)}
                        disabled={rule.level === 'Standard'}
                      />
                    </div>
                    {rule.level === 'Standard' && <p className="text-[9px] text-gray-400 mt-2 italic">* Default entry level</p>}
                  </div>
                ))}
              </div>
            </section>

            {/* Business Profile */}
            <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <Store size={24} />
                </div>
                <h2 className="text-xl font-bold">Business Profile</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Shop Name</label>
                  <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-5 py-3.5 text-sm font-bold" defaultValue="Tactile Sanctuary" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Contact Email</label>
                  <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-5 py-3.5 text-sm font-bold" defaultValue="hello@tactilesanctuary.com" />
                </div>
              </div>
            </section>

            {/* System Preferences */}
            <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                  <Globe size={24} />
                </div>
                <h2 className="text-xl font-bold">System Preferences</h2>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between py-4 border-b border-gray-50">
                  <div>
                    <h4 className="font-bold">Currency Symbol</h4>
                    <p className="text-xs text-gray-400">Used for all pricing display</p>
                  </div>
                  <select className="bg-[#F5F6FA] border-none rounded-xl px-4 py-2 text-sm font-bold">
                    <option value="USD">USD ($)</option>
                    <option value="THB">THB (฿)</option>
                  </select>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;