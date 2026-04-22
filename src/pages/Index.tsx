"use client";

import React from 'react';
import Sidebar from '@/components/Sidebar';
import ServiceCard from '@/components/ServiceCard';
import OrderSummary from '@/components/OrderSummary';
import CustomerSearch from '@/components/CustomerSearch';
import { UserPlus, X, Search } from 'lucide-react';
import { useStore } from '@/store/useStore';

const Index = () => {
  const { selectedPet, services, selectPet } = useStore();

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
            Quick New Client
          </button>
        </header>

        <div className="px-10 mb-8 flex items-center gap-6 shrink-0">
          <CustomerSearch />
          
          {selectedPet && (
            <div className="flex items-center gap-4 bg-[#1A1F3D] text-white pl-4 pr-2 py-2 rounded-full shadow-lg animate-in fade-in slide-in-from-right-4">
              <div className="text-left">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Active Client:</p>
                <p className="text-xs font-bold">{selectedPet.pet.name} ({selectedPet.owner.name})</p>
              </div>
              <button 
                onClick={() => selectPet(null as any, null as any)}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-10 pb-10 scrollbar-hide">
          {!selectedPet && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6">
                <Search size={40} className="text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Ready to Start?</h2>
              <p className="text-gray-500 max-w-xs">Search for a customer or pet above to begin adding services to the cart.</p>
            </div>
          )}
          
          {selectedPet && (
            <div className="grid grid-cols-2 gap-8 animate-in fade-in zoom-in-95 duration-300">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          )}
        </div>
      </main>

      <OrderSummary />
    </div>
  );
};

export default Index;