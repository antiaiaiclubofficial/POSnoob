"use client";

import React, { useState, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { Store, Save, ShieldCheck, TrendingUp, Percent, Tag, DollarSign, Image, Trash2, Upload } from 'lucide-react';
import { useStore, TierRule, MembershipLevel } from '@/store/useStore';
import { toast } from 'sonner';

const Settings = () => {
  const { tierRules, updateTierRules, shopName, shopLogo, updateBusinessProfile } = useStore();
  const [localTierRules, setLocalTierRules] = useState<TierRule[]>(tierRules);
  const [localShopName, setLocalShopName] = useState(shopName);
  const [localShopLogo, setLocalShopLogo] = useState<string | null>(shopLogo);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    updateTierRules(localTierRules);
    updateBusinessProfile({ 
      shopName: localShopName, 
      shopLogo: localShopLogo 
    });
    toast.success("Settings saved successfully!");
  };

  const updateRule = (level: MembershipLevel, field: keyof TierRule, value: any) => {
    setLocalTierRules(prev => prev.map(r => 
      r.level === level ? { ...r, [field]: value } : r
    ));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalShopLogo(reader.result as string);
        toast.success("Logo uploaded!");
      };
      reader.readAsDataURL(file);
    }
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

          <div className="space-y-8 pb-10">
            {/* Business Profile */}
            <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <Store size={24} />
                </div>
                <h2 className="text-xl font-bold">Business Profile</h2>
              </div>
              
              <div className="space-y-8">
                <div className="flex items-center gap-8">
                  <div className="relative group">
                    <div className="w-32 h-32 bg-[#F5F6FA] rounded-[32px] flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-200 group-hover:border-blue-400 transition-all">
                      {localShopLogo ? (
                        <img src={localShopLogo} alt="Logo Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-4">
                          <Image size={24} className="mx-auto text-gray-300 mb-2" />
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Logo</p>
                        </div>
                      )}
                    </div>
                    {localShopLogo && (
                      <button 
                        onClick={() => setLocalShopLogo(null)}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-2 right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
                    >
                      <Upload size={14} />
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleLogoUpload} 
                    />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Shop Name</label>
                      <input 
                        className="w-full bg-[#F5F6FA] border-none rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-500/20" 
                        value={localShopName}
                        onChange={(e) => setLocalShopName(e.target.value)}
                        placeholder="Enter shop name..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Contact Email</label>
                      <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-5 py-3.5 text-sm font-bold" defaultValue="hello@tactilesanctuary.com" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Membership Tier Rules */}
            <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Auto-Promotion Rules & Benefits</h2>
                  <p className="text-xs text-gray-400">Configure tier names, thresholds, and discounts</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {localTierRules.map((rule) => (
                  <div key={rule.level} className="p-6 bg-[#F5F6FA] rounded-2xl border border-transparent hover:border-purple-200 transition-all group space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 opacity-60">{rule.level} (System ID)</span>
                      <TrendingUp size={16} className="text-purple-300" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1 h-4">
                        <Tag size={10} /> Tier Display Name
                      </label>
                      <input 
                        type="text"
                        className="w-full bg-white border-none rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm focus:ring-2 focus:ring-purple-500/20" 
                        value={rule.label}
                        onChange={(e) => updateRule(rule.level, 'label', e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1 h-4">
                          <DollarSign size={10} /> Min. Spent ($)
                        </label>
                        <input 
                          type="number"
                          className="w-full bg-white border-none rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50" 
                          value={rule.minSpent}
                          onChange={(e) => updateRule(rule.level, 'minSpent', Number(e.target.value))}
                          disabled={rule.level === 'Standard'}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1 h-4">
                          <Percent size={10} /> Discount (%)
                        </label>
                        <input 
                          type="number"
                          className="w-full bg-white border-none rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm focus:ring-2 focus:ring-purple-500/20" 
                          value={rule.discount}
                          onChange={(e) => updateRule(rule.level, 'discount', Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;