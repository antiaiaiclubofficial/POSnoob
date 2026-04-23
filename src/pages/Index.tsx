"use client";

import React from 'react';
import Sidebar from '@/components/Sidebar';
import ServiceCard from '@/components/ServiceCard';
import OrderSummary from '@/components/OrderSummary';
import CustomerSearch from '@/components/CustomerSearch';
import { UserPlus, X, Search, Home, CreditCard, Sparkles } from 'lucide-react';
import { useStore, QueueItem } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const Index = () => {
  const { 
    selectedOwner, 
    activePet, 
    services, 
    selectOwner, 
    setActivePet, 
    queue, 
    customers,
    setActiveQueueItem
  } = useStore();

  const pendingCheckout = queue.filter(q => 
    (q.status === 'Checked-in' || q.status === 'In Progress') && !q.isPaid
  );

  const handleQuickSelectFromQueue = (item: QueueItem) => {
    const owner = customers.find(c => c.name === item.ownerName);
    if (owner) {
      selectOwner(owner);
      const pet = owner.pets.find(p => p.id === item.petId);
      if (pet) {
        setActivePet(pet);
        setActiveQueueItem(item.id);
        toast.success(`Active Session: ${item.petName}`);
      }
    }
  };

  return (
    <div className="flex h-screen bg-[#F8F9FD] text-[#1A1F3D] overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-10 py-8 flex justify-between items-center shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={14} className="text-amber-400" />
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Point of Sale</p>
            </div>
            <h1 className="text-3xl font-black text-[#1A1F3D]">Checkout</h1>
          </div>
          <button className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-2xl shadow-sm text-xs font-bold border border-gray-100 hover:bg-gray-50 transition-all hover:scale-105 active:scale-95">
            <UserPlus size={16} />
            Quick Registration
          </button>
        </header>

        <div className="px-10 space-y-6 shrink-0 mb-8">
          {/* Step 1: Search & Identification */}
          <div className="flex items-center gap-4">
            <CustomerSearch />
            
            {selectedOwner && (
              <div className="flex items-center gap-3 bg-[#1A1F3D] text-white pl-4 pr-2 py-2 rounded-full shadow-xl shadow-[#1A1F3D]/10 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-2">
                  <Home size={14} className="text-[#D9ED5F]" />
                  <span className="text-[11px] font-black uppercase tracking-tight">{selectedOwner.name}</span>
                </div>
                <button 
                  onClick={() => selectOwner(null)}
                  className="w-7 h-7 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Pending Bar */}
          {pendingCheckout.length > 0 && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Active Queue ({pendingCheckout.length})</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {pendingCheckout.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleQuickSelectFromQueue(item)}
                    className={cn(
                      "flex items-center gap-3 bg-white border px-4 py-3 rounded-[20px] shrink-0 transition-all group hover:border-[#1A1F3D]/20",
                      activePet?.id === item.petId ? "border-orange-200 bg-orange-50/30" : "border-gray-100"
                    )}
                  >
                    <img src={item.image} className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                    <div className="text-left">
                      <p className="text-xs font-black text-[#1A1F3D]">{item.petName}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Wait for payment</p>
                    </div>
                    <CreditCard size={14} className="text-orange-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Pet Selection */}
          {selectedOwner && (
            <div className="bg-white p-2 rounded-[24px] shadow-sm border border-gray-100 inline-flex items-center gap-2 animate-in fade-in duration-500">
              <div className="px-4 py-2 text-[10px] font-black uppercase text-gray-400 tracking-wider border-r border-gray-50">Select Member</div>
              <div className="flex gap-1">
                {selectedOwner.pets.map(pet => (
                  <button
                    key={pet.id}
                    onClick={() => {
                      setActivePet(pet);
                      setActiveQueueItem(null);
                    }}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl transition-all border font-bold text-xs",
                      activePet?.id === pet.id 
                        ? "bg-[#D9ED5F] border-[#D9ED5F] text-[#1A1F3D] shadow-md shadow-[#D9ED5F]/20" 
                        : "bg-transparent border-transparent text-gray-400 hover:bg-gray-50"
                    )}
                  >
                    <img src={pet.image} alt={pet.name} className="w-5 h-5 rounded-lg object-cover" />
                    {pet.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-10 pb-10 scrollbar-hide">
          {!selectedOwner ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center mb-6 shadow-sm border border-gray-100">
                <Search size={32} className="text-gray-200" />
              </div>
              <h2 className="text-2xl font-black mb-2">Identify Customer</h2>
              <p className="text-sm text-gray-400 max-w-xs font-medium">Search by name or select from the active queue bar above to begin.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 2xl:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-500">
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