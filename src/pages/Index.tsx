"use client";

import React, { useState, useEffect } from 'react';
import ServiceCard from '@/components/ServiceCard';
import OrderSummary from '@/components/OrderSummary';
import CustomerSearch from '@/components/CustomerSearch';
import CustomerModal from '@/components/CustomerModal';
import { UserPlus, X, Search, Home, CreditCard, Sparkles, ShoppingBag, CheckCircle2, Dog, Cat } from 'lucide-react';
import { useStore, QueueItem } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const isMobile = useIsMobile();
  const { 
    selectedOwner, 
    activePet, 
    services, 
    selectOwner, 
    setActivePet, 
    queue, 
    customers,
    setActiveQueueItem,
    cart
  } = useStore();

  const [speciesFilter, setSpeciesFilter] = useState<'Dog' | 'Cat'>('Dog');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // เมื่อเลือกสัตว์เลี้ยง ให้ปรับตัวกรองประเภทสัตว์โดยอัตโนมัติ
  useEffect(() => {
    if (activePet) {
      setSpeciesFilter(activePet.species === 'Dog' ? 'Dog' : 'Cat');
    }
  }, [activePet]);

  // รายการที่เข้าสู่กระบวนการแล้วและยังไม่ได้จ่ายเงิน
  const pendingCheckout = queue.filter(q => 
    (q.status !== 'Waiting') && !q.isPaid
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

  const filteredServices = services.filter(s => s.targetSpecies === speciesFilter && s.isActive);
  const cartTotal = cart.reduce((acc, item) => acc + item.price, 0);

  return (
    <div className="flex-1 flex overflow-hidden">
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-6 lg:px-10 py-6 lg:py-8 flex justify-between items-center shrink-0">
          <div className="pl-14 lg:pl-0">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={14} className="text-[#D9ED5F]" />
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Point of Sale</p>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-[#1A1F3D]">POS System</h1>
          </div>
          <button 
            onClick={() => setIsCustomerModalOpen(true)}
            className="hidden sm:flex items-center gap-2 bg-[#D9ED5F] text-[#1A1F3D] px-5 py-2.5 rounded-2xl shadow-sm text-xs font-black hover:scale-105 active:scale-95 transition-all"
          >
            <UserPlus size={16} />
            New Customer
          </button>
        </header>

        <div className="px-6 lg:px-10 space-y-6 shrink-0 mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
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

          {/* Quick Queue Bar */}
          {pendingCheckout.length > 0 && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Active Services ({pendingCheckout.length})</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {pendingCheckout.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleQuickSelectFromQueue(item)}
                    className={cn(
                      "flex items-center gap-3 bg-white border px-4 py-3 rounded-[20px] shrink-0 transition-all group hover:border-[#1A1F3D]/20",
                      activePet?.id === item.petId ? "border-orange-200 bg-orange-50/30" : "border-gray-100",
                      item.status === 'Completed' && "border-green-100"
                    )}
                  >
                    <img src={item.image} className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                    <div className="text-left">
                      <p className="text-xs font-black text-[#1A1F3D]">{item.petName}</p>
                      <p className={cn(
                        "text-[9px] font-bold uppercase tracking-tighter",
                        item.status === 'Completed' ? "text-green-600" : "text-gray-400"
                      )}>
                        {item.status === 'Completed' ? 'Ready to Pay' : 'In Service'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Species & Pet Selector */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="bg-white p-1.5 rounded-[22px] shadow-sm border border-gray-100 flex gap-1 w-fit shrink-0">
              <button 
                onClick={() => setSpeciesFilter('Dog')}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-[10px] font-black flex items-center gap-2 transition-all",
                  speciesFilter === 'Dog' ? "bg-[#1A1F3D] text-white shadow-lg" : "text-gray-400 hover:text-gray-600"
                )}
              >
                <Dog size={14} /> DOGS
              </button>
              <button 
                onClick={() => setSpeciesFilter('Cat')}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-[10px] font-black flex items-center gap-2 transition-all",
                  speciesFilter === 'Cat' ? "bg-[#1A1F3D] text-white shadow-lg" : "text-gray-400 hover:text-gray-600"
                )}
              >
                <Cat size={14} /> CATS
              </button>
            </div>

            {selectedOwner && (
              <div className="flex-1 bg-white p-1.5 rounded-[22px] shadow-sm border border-gray-100 flex items-center gap-2 overflow-x-auto scrollbar-hide animate-in fade-in slide-in-from-left-2">
                <span className="px-3 py-1 border-r border-gray-100 text-[8px] font-black text-gray-300 uppercase tracking-widest shrink-0">Select Pet</span>
                <div className="flex gap-1">
                  {selectedOwner.pets.filter(p => p.species === speciesFilter).map(pet => (
                    <button
                      key={pet.id}
                      onClick={() => {
                        setActivePet(pet);
                        setActiveQueueItem(null);
                      }}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl transition-all border font-bold text-xs shrink-0",
                        activePet?.id === pet.id 
                          ? "bg-[#D9ED5F] border-[#D9ED5F] text-[#1A1F3D] shadow-md" 
                          : "bg-transparent border-transparent text-gray-400 hover:bg-gray-50"
                      )}
                    >
                      <img src={pet.image} alt={pet.name} className="w-5 h-5 rounded-lg object-cover" />
                      {pet.name}
                    </button>
                  ))}
                  {selectedOwner.pets.filter(p => p.species === speciesFilter).length === 0 && (
                    <p className="text-[9px] text-gray-300 font-bold px-4">No {speciesFilter}s found</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-24 lg:pb-10 scrollbar-hide">
          {filteredServices.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
              <ShoppingBag size={48} className="mb-4" />
              <h2 className="text-xl font-black">No services found</h2>
              <p className="text-xs font-bold uppercase">For {speciesFilter} category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 lg:gap-6 animate-in fade-in zoom-in-95 duration-500">
              {filteredServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          )}
        </div>
      </main>

      <div className="hidden lg:block">
        <OrderSummary />
      </div>

      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-6 right-6 z-40">
          <Sheet>
            <SheetTrigger asChild>
              <button className="bg-[#1A1F3D] text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-500">
                <div className="relative">
                  <ShoppingBag size={20} />
                  <span className="absolute -top-2 -right-2 bg-[#D9ED5F] text-[#1A1F3D] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                    {cart.length}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-[8px] font-black uppercase opacity-60 leading-none mb-0.5">View Cart</p>
                  <p className="text-sm font-black">฿{cartTotal.toLocaleString()}</p>
                </div>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0 w-full sm:max-w-md border-none">
              <OrderSummary isMobile />
            </SheetContent>
          </Sheet>
        </div>
      )}

      {isCustomerModalOpen && (
        <CustomerModal onClose={() => setIsCustomerModalOpen(false)} />
      )}
    </div>
  );
};

export default Index;