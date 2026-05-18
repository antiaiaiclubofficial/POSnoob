"use client";

import React, { useState, useEffect } from 'react';
import ServiceCard from '@/components/ServiceCard';
import ProductCard from '@/components/ProductCard';
import OrderSummary from '@/components/OrderSummary';
import CustomerSearch from '@/components/CustomerSearch';
import CustomerModal from '@/components/CustomerModal';
import { UserPlus, X, Search, Home, CreditCard, Sparkles, ShoppingBag, CheckCircle2, Dog, Cat, Scissors, Package } from 'lucide-react';
import { useStore, QueueItem } from '@/store/useStore';
import { translations } from '@/utils/translations';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const isMobile = useIsMobile();
  const { 
    selectedOwner, 
    activePet, 
    services, 
    inventory,
    selectOwner, 
    setActivePet, 
    queue, 
    customers,
    setActiveQueueItem,
    cart,
    language
  } = useStore();

  const t = translations[language];

  const [posTab, setPosTab] = useState('services');
  const [speciesFilter, setSpeciesFilter] = useState<'Dog' | 'Cat'>('Dog');
  const [productSearch, setProductQuery] = useState('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  useEffect(() => {
    if (activePet) {
      setSpeciesFilter(activePet.species === 'Dog' ? 'Dog' : 'Cat');
    }
  }, [activePet]);

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
        setPosTab('services');
      }
    }
  };

  const filteredServices = services.filter(s => s.targetSpecies === speciesFilter && s.isActive);
  const filteredProducts = inventory.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );
  
  const cartTotal = cart.reduce((acc, item) => acc + item.price, 0);

  return (
    <div className="flex-1 flex overflow-hidden">
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-6 lg:px-10 py-6 lg:py-8 flex justify-between items-center shrink-0">
          <div className="pl-14 lg:pl-0">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={14} className="text-[#D9ED5F]" />
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">{t.pointOfSale}</p>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-[#1A1F3D]">{t.pos}</h1>
          </div>
          <button 
            onClick={() => setIsCustomerModalOpen(true)}
            className="hidden sm:flex items-center gap-2 bg-[#D9ED5F] text-[#1A1F3D] px-5 py-2.5 rounded-2xl shadow-sm text-xs font-black hover:scale-105 active:scale-95 transition-all"
          >
            <UserPlus size={16} />
            {t.newCustomer}
          </button>
        </header>

        <div className="px-6 lg:px-10 space-y-6 shrink-0 mb-6">
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

          {pendingCheckout.length > 0 && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t.activeServices} ({pendingCheckout.length})</span>
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
                        {item.status === 'Completed' ? t.readyToPay : t.inProgress}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-gray-100 pb-2">
            <Tabs value={posTab} onValueChange={setPosTab} className="w-full sm:w-auto">
              <TabsList className="bg-[#F5F6FA] p-1 rounded-[20px] flex gap-1 h-auto">
                <TabsTrigger value="services" className="flex-1 sm:px-8 py-2.5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#1A1F3D] data-[state=active]:shadow-sm text-[10px] font-black uppercase transition-all">
                  <Scissors size={14} className="mr-2" /> Grooming
                </TabsTrigger>
                <TabsTrigger value="products" className="flex-1 sm:px-8 py-2.5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#1A1F3D] data-[state=active]:shadow-sm text-[10px] font-black uppercase transition-all">
                  <Package size={14} className="mr-2" /> Products
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {posTab === 'services' && (
               <div className="bg-white p-1 rounded-2xl border border-gray-100 flex gap-1 animate-in zoom-in-95">
                 <button onClick={() => setSpeciesFilter('Dog')} className={cn("px-5 py-2 rounded-xl text-[9px] font-black flex items-center gap-2 transition-all", speciesFilter === 'Dog' ? "bg-[#1A1F3D] text-white shadow-md" : "text-gray-400")}><Dog size={12} /> DOG</button>
                 <button onClick={() => setSpeciesFilter('Cat')} className={cn("px-5 py-2 rounded-xl text-[9px] font-black flex items-center gap-2 transition-all", speciesFilter === 'Cat' ? "bg-[#1A1F3D] text-white shadow-md" : "text-gray-400")}><Cat size={12} /> CAT</button>
               </div>
            )}

            {posTab === 'products' && (
              <div className="relative w-full sm:w-64 animate-in zoom-in-95">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                <input 
                  className="w-full bg-[#F5F6FA] border-none rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={e => setProductQuery(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-24 lg:pb-10 scrollbar-hide">
          <Tabs value={posTab} className="h-full">
            <TabsContent value="services" className="m-0 h-full">
              {filteredServices.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                  <ShoppingBag size={48} className="mb-4" />
                  <h2 className="text-xl font-black">{language === 'th' ? 'ไม่พบบริการ' : 'No services found'}</h2>
                  <p className="text-xs font-bold uppercase">For {speciesFilter} category</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 lg:gap-6 animate-in fade-in zoom-in-95 duration-500">
                  {filteredServices.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="products" className="m-0 h-full">
              {filteredProducts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                  <Package size={48} className="mb-4" />
                  <h2 className="text-xl font-black">{language === 'th' ? 'ไม่พบสินค้า' : 'No products found'}</h2>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6 animate-in fade-in zoom-in-95 duration-500">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
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
                  <p className="text-[8px] font-black uppercase opacity-60 leading-none mb-0.5">{language === 'th' ? 'ดูตะกร้า' : 'View Cart'}</p>
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