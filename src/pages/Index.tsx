"use client";

import React from 'react';
import Sidebar from '@/components/Sidebar';
import ServiceCard from '@/components/ServiceCard';
import OrderSummary from '@/components/OrderSummary';
import CustomerSearch from '@/components/CustomerSearch';
import { UserPlus, X, Search, Home } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

const Index = () => {
  const { selectedOwner, activePet, services, selectOwner, setActivePet } = useStore();

  return (
    <div className="flex h-screen bg-[#F5F6FA] text-[#1A1F3D] overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="p-10 flex justify-between items-start shrink-0">
          <div>
            <h1 className="text-4xl font-extrabold mb-1">Checkout</h1>
            <p className="text-gray-400 font-medium">Add services for the entire household</p>
          </div>
          <button className="flex items-center gap-2 bg-white px-6 py-3 rounded-2xl shadow-sm text-sm font-bold border border-gray-50 hover:bg-gray-50 transition-colors">
            <UserPlus size={18} />
            Quick New Client
          </button>
        </header>

        <div className="px-10 mb-8 flex flex-col gap-6 shrink-0">
          <div className="flex items-center gap-6">
            <CustomerSearch />
            
            {selectedOwner && (
              <div className="flex items-center gap-4 bg-[#1A1F3D] text-white pl-4 pr-2 py-2 rounded-full shadow-lg">
                <div className="flex items-center gap-2">
                  <Home size={14} className="text-gray-400" />
                  <div className="text-left">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Household:</p>
                    <p className="text-xs font-bold">{selectedOwner.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => selectOwner(null)}
                  className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {selectedOwner && (
            <div className="flex items-center gap-3 bg-white p-2 rounded-[24px] shadow-sm animate-in fade-in slide-in-from-top-2">
              <span className="text-[10px] font-black uppercase text-gray-400 px-4">Select Pet:</span>
              <div className="flex gap-2">
                {selectedOwner.pets.map(pet => (
                  <button
                    key={pet.id}
                    onClick={() => setActivePet(pet)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2 rounded-2xl transition-all border",
                      activePet?.id === pet.id 
                        ? "bg-[#D9ED5F] border-[#D9ED5F] text-[#1A1F3D] font-bold shadow-md scale-105" 
                        : "bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100"
                    )}
                  >
                    <img src={pet.image} alt={pet.name} className="w-6 h-6 rounded-lg object-cover" />
                    <span className="text-sm">{pet.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-10 pb-10 scrollbar-hide">
          {!selectedOwner ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6">
                <Search size={40} className="text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Select a Household</h2>
              <p className="text-gray-500 max-w-xs">Start by searching for a customer. You can then add services for all pets in their family.</p>
            </div>
          ) : (
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