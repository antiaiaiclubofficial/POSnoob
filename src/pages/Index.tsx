"use client";

import React from 'react';
import Sidebar from '@/components/Sidebar';
import ServiceCard from '@/components/ServiceCard';
import OrderSummary from '@/components/OrderSummary';
import { Search, UserPlus } from 'lucide-react';
import { useStore } from '@/store/useStore';

const Index = () => {
  const currentPet = useStore((state) => state.currentPet);

  return (
    <div className="flex h-screen bg-[#F5F6FA] text-[#1A1F3D] overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="p-10 flex justify-between items-start shrink-0">
          <div>
            <h1 className="text-4xl font-extrabold mb-1">Checkout</h1>
            <p className="text-gray-400 font-medium">Create a new transaction for your furry client</p>
          </div>
          <button className="flex items-center gap-2 bg-white px-6 py-3 rounded-2xl shadow-sm text-sm font-bold border border-gray-50 hover:bg-gray-50 transition-colors">
            <UserPlus size={18} />
            Walk-in Customer
          </button>
        </header>

        <div className="px-10 mb-8 flex items-center gap-6 shrink-0">
          <div className="flex-1 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search customers, pets or phone"
              className="w-full bg-white pl-16 pr-6 py-5 rounded-[24px] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1A1F3D]/10 transition-all font-medium"
            />
          </div>
          
          {currentPet && (
            <div className="flex items-center gap-3 bg-white/50 px-6 py-2 rounded-full border border-gray-100">
              <div className="flex -space-x-2">
                <img src={currentPet.image} alt={currentPet.name} className="w-10 h-10 rounded-full border-2 border-white object-cover" />
                <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">+1</div>
              </div>
              <div className="text-left">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Current Queue:</p>
                <p className="text-xs font-bold">{currentPet.name} ({currentPet.breed})</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-10 pb-10 scrollbar-hide">
          <div className="grid grid-cols-2 gap-8">
            <ServiceCard 
              id="svc-1"
              icon="grooming"
              title="Full Grooming"
              description="Haircut, bath, brush, nails, and ears."
              priceType="starting"
              price={45}
              sizes={['SMALL', 'MEDIUM', 'LARGE']}
            />
            <ServiceCard 
              id="svc-2"
              icon="bath"
              title="Bath & Brush"
              description="Deep clean shampoo, blow dry, and brushing."
              priceType="starting"
              price={35}
              sizes={['SMALL', 'MEDIUM', 'LARGE']}
            />
            <ServiceCard 
              id="svc-3"
              icon="nail"
              title="Nail Trim"
              description="Professional trimming and filing."
              priceType="fixed"
              price={15}
            />
            <ServiceCard 
              id="svc-4"
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

      <OrderSummary />
    </div>
  );
};

export default Index;