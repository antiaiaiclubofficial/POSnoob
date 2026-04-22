import React from 'react';
import Sidebar from '@/components/Sidebar';
import { BarChart, TrendingUp, DollarSign, Users } from 'lucide-react';

const Reports = () => {
  return (
    <div className="flex h-screen bg-[#F5F6FA] text-[#1A1F3D] overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-10 overflow-y-auto">
        <h1 className="text-4xl font-extrabold mb-1">Reports</h1>
        <p className="text-gray-400 font-medium mb-10">Insight into your business performance</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6">
              <DollarSign size={24} />
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Daily Revenue</p>
            <h2 className="text-3xl font-extrabold">$1,240.50</h2>
            <div className="mt-4 flex items-center gap-2 text-green-500 text-xs font-bold">
              <TrendingUp size={14} /> +12% from yesterday
            </div>
          </div>
          
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <Users size={24} />
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Total Appointments</p>
            <h2 className="text-3xl font-extrabold">24</h2>
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
              <BarChart size={24} />
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Service Mix</p>
            <div className="mt-2 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>Grooming</span>
                <span>65%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full w-[65%]" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm h-64 flex items-center justify-center text-gray-300 font-bold uppercase tracking-widest italic">
          Revenue Chart Placeholder
        </div>
      </main>
    </div>
  );
};

export default Reports;