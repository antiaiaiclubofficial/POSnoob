"use client";

import React from 'react';
import Sidebar from '@/components/Sidebar';
import ServiceCard from '@/components/ServiceCard';
import OrderSummary from '@/components/OrderSummary';
import CustomerSearch from '@/components/CustomerSearch';
import { UserPlus, X, Search, Home, CreditCard, Dog } from 'lucide-react';
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
      // 1. เลือกเจ้าของ
      selectOwner(owner);
      
      // 2. เลือกสัตว์เลี้ยงตัวนั้น
      const pet = owner.pets.find(p => p.id === item.petId);
      if (pet) {
        setActivePet(pet);
        // 3. จำ ID คิวไว้เพื่อ Mark Paid ตอนจ่ายเงิน
        setActiveQueueItem(item.id);
        toast.success(`Selected ${item.petName}. Please add services manually.`);
      }
    }
  };

  return (
    <div className="flex h-screen bg-[#F5F6FA] text-[#1A1F3D] overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-10 py-6 flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-2xl font-extrabold text-[#1A1F3D]">Checkout</h1>
            <p className="text-xs text-gray-400 font-medium">Add services or process pending payments</p>
          </div>
          <button className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm text-xs font-bold border border-gray-50 hover:bg-gray-50 transition-colors">
            <UserPlus size={14} />
            Quick New Client
          </button>
        </header>

        <div className="px-10 mb-6 flex flex-col gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <CustomerSearch />
            
            {selectedOwner && (
              <div className="flex items-center gap-3 bg-[#1A1F3D] text-white pl-3 pr-1.5 py-1.5 rounded-full shadow-lg">
                <div className="flex items-center gap-2">
                  <Home size={12} className="text-gray-400" />
                  <div className="text-left">
                    <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider leading-none mb-0.5">Household</p>
                    <p className="text-[10px] font-bold leading-none">{selectedOwner.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => selectOwner(null)}
                  className="w-6 h-6 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

          {pendingCheckout.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase text-orange-500 tracking-wider">Pending Checkout ({pendingCheckout.length})</span>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {pendingCheckout.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleQuickSelectFromQueue(item)}
                    className="flex items-center gap-3 bg-orange-50 hover:bg-orange-100 border border-orange-100 px-4 py-2.5 rounded-2xl shrink-0 transition-all group"
                  >
                    <img src={item.image} className="w-8 h-8 rounded-lg object-cover" />
                    <div className="text-left">
                      <p className="text-xs font-bold text-[#1A1F3D]">{item.petName}</p>
                      <p className="text-[9px] text-orange-600 font-medium">Waiting for Services</p>
                    </div>
                    <CreditCard size={14} className="text-orange-400 group-hover:scale-110 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedOwner && (
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-50/50">
              <span className="text-[9px] font-black uppercase text-gray-400 px-3">Select Pet:</span>
              <div className="flex gap-1.5">
                {selectedOwner.pets.map(pet => (
                  <button
                    key={pet.id}
                    onClick={() => {
                      setActivePet(pet);
                      setActiveQueueItem(null); // ล้างคิวเชื่อมโยงถ้าเลือกสัตว์เลี้ยงแมนนวลเอง
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all border",
                      activePet?.id === pet.id 
                        ? "bg-[#D9ED5F] border-[#D9ED5F] text-[#1A1F3D] font-bold shadow-sm" 
                        : "bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100"
                    )}
                  >
                    <img src={pet.image} alt={pet.name} className="w-5 h-5 rounded-lg object-cover" />
                    <span className="text-xs">{pet.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-10 pb-10 scrollbar-hide">
          {!selectedOwner ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <Search size={32} className="text-gray-400" />
              </div>
              <h2 className="text-xl font-bold mb-1">Select a Household</h2>
              <p className="text-sm text-gray-500 max-w-xs">Start by searching or selecting a pet from the pending bar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-300">
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