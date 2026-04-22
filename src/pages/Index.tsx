"use client";

import React from 'react';
import Sidebar from '@/components/Sidebar';
import ServiceCard from '@/components/ServiceCard';
import OrderSummary from '@/components/OrderSummary';
import { Search, UserPlus } from 'lucide-react';

const Index = () => {
  return (
    <div className="flex h-screen bg-[#F5F6FA] text-[#1A1F3D] overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header Section */}
        <header className="p-10 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-extrabold mb-1">Checkout</h1>
            <p className="text-gray-400 font-medium">Create a new transaction for your furry client</p>
          </div>
          <button className="flex items-center gap-2 bg-white px-6 py-3 rounded-2xl shadow-sm text-sm font-bold border border-gray-50 hover:bg-gray-50 transition-colors">
            <UserPlus size={18} />
            Walk-in Customer
          </button>
        </header>

        {/* Search and Queue Bar */}
        <div className="px-10 mb-8 flex items-center gap-6">
          <div className="flex-1 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search customers, pets or phone"
              className="w-full bg-white pl-16 pr-6 py-5 rounded-[24px] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1A1F3D]/10 transition-all font-medium"
            />
          </div>
          
          <div className="flex items-center gap-3 bg-white/50 px-6 py-2 rounded-full border border-gray-100">
            <div className="flex -space-x-2">
              <img src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=64&h=64&fit=crop" alt="Pet 1" className="w-10 h-10 rounded-full border-2 border-white object-cover" />
              <img src="https://images.unsplash.com/photo-1517849845537-4d257902454a?w=64&h=64&fit=crop" alt="Pet 2" className="w-10 h-10 rounded-full border-2 border-white object-cover" />
            </div>
            <div className="text-left">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Current Queue:</p>
              <p className="text-xs font-bold">Bella (Golden Retriever)</p>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="flex-1 overflow-y-auto px-10 pb-10">
          <div className="grid grid-cols-2 gap-8">
            <ServiceCard 
              icon="grooming"
              title="Full Grooming"
              description="Haircut, bath, brush, nails, and ears."
              priceType="starting"
              price={45}
              sizes={['SMALL', 'MEDIUM', 'LARGE']}
            />
            <ServiceCard 
              icon="bath"
              title="Bath & Brush"
              description="Deep clean shampoo, blow dry, and brushing."
              priceType="starting"
              price={35}
              sizes={['SMALL', 'MEDIUM', 'LARGE']}
            />
            <ServiceCard 
              icon="nail"
              title="Nail Trim"
              description="Professional trimming and filing."
              priceType="fixed"
              price={15}
              active={true}
            />
            <ServiceCard 
              icon="deshedding"
              title="De-Shedding"
              description="Furminator treatment to reduce shedding."
              priceType="starting"
              price={25}
              sizes={['S', 'M', 'L']}
            />
          </div>
        </div>
      </main>

      {/* Right Order Summary */}
      <OrderSummary />
    </div>
  );
};

export default Index;