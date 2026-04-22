"use client";

import React from 'react';
import Sidebar from '@/components/Sidebar';
import { Store, Bell, Shield, Palette, Globe, Save } from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
  const handleSave = () => {
    toast.success("Settings saved successfully!");
  };

  return (
    <div className="flex h-screen bg-[#F5F6FA] text-[#1A1F3D] overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-10 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-4xl font-extrabold mb-1">Settings</h1>
              <p className="text-gray-400 font-medium">Manage your shop preferences and system configurations</p>
            </div>
            <button 
              onClick={handleSave}
              className="bg-[#1A1F3D] text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-[#2A3152] transition-colors shadow-lg shadow-[#1A1F3D]/10"
            >
              <Save size={20} /> Save Changes
            </button>
          </div>

          <div className="space-y-8">
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
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Address</label>
                  <textarea className="w-full bg-[#F5F6FA] border-none rounded-2xl px-5 py-3.5 text-sm font-bold h-24 resize-none" defaultValue="123 Pet Lane, Grooming District, PC 54321" />
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
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between py-4 border-b border-gray-50">
                  <div>
                    <h4 className="font-bold">Tax Rate (%)</h4>
                    <p className="text-xs text-gray-400">Default tax applied at checkout</p>
                  </div>
                  <input type="number" className="w-24 bg-[#F5F6FA] border-none rounded-xl px-4 py-2 text-sm font-bold text-right" defaultValue="7" />
                </div>

                <div className="flex items-center justify-between py-4">
                  <div>
                    <h4 className="font-bold">Language</h4>
                    <p className="text-xs text-gray-400">Select system interface language</p>
                  </div>
                  <select className="bg-[#F5F6FA] border-none rounded-xl px-4 py-2 text-sm font-bold">
                    <option value="EN">English</option>
                    <option value="TH">Thai</option>
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