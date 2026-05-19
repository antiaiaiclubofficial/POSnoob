"use client";

import React, { useState, useEffect } from 'react';
import ServiceCard from '@/components/ServiceCard';
import ProductCard from '@/components/ProductCard';
import OrderSummary from '@/components/OrderSummary';
import CustomerSearch from '@/components/CustomerSearch';
import CustomerModal from '@/components/CustomerModal';
import GroomingServiceModal from '@/components/GroomingServiceModal';
import AddOnModal from '@/components/AddOnModal';
import { 
  UserPlus, X, Search, Home, CreditCard, Sparkles, ShoppingBag, 
  CheckCircle2, Dog, Cat, Scissors, Package, ClipboardList, Clock, Zap, Star, Heart, Brush, Wind, Stethoscope, Award, Bone, Bath, Gem
} from 'lucide-react';
import { useStore, QueueItem, ServiceIcon, CreditPackageTemplate } from '@/store/useStore';
import { translations } from '@/utils/translations';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';

const Index = () => {
  const isMobile = useIsMobile();
  const { 
    selectedOwner, activePet, services, addons, inventory, creditPackages,
    selectOwner, setActivePet, queue, customers, setActiveQueueItem, cart, addToCart, language, currency
  } = useStore();

  const t = translations[language];
  const today = format(new Date(), 'yyyy-MM-dd');

  const [posTab, setPosTab] = useState('services');
  const [speciesFilter, setSpeciesFilter] = useState<'Dog' | 'Cat'>('Dog');
  const [coatFilter, setCoatFilter] = useState<'Short' | 'Long'>('Short');
  const [productSearch, setProductQuery] = useState('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [intakeItem, setIntakeItem] = useState<QueueItem | null>(null);
  const [selectedAddOn, setSelectedAddOn] = useState<any>(null);

  useEffect(() => {
    if (activePet) setSpeciesFilter(activePet.species === 'Dog' ? 'Dog' : 'Cat');
  }, [activePet]);

  const todayQueue = queue.filter(q => q.date === today && !q.isPaid);

  const handleBuyCredit = (pkg: CreditPackageTemplate) => {
    if (!selectedOwner) {
      toast.error("Please select a customer first");
      return;
    }
    addToCart({
      id: pkg.id,
      title: pkg.name,
      price: pkg.price,
      quantity: 1,
      ownerName: selectedOwner.name,
      type: 'Credit',
      creditAmount: pkg.creditAmount
    });
    toast.success(`Added ${pkg.name} to order`);
  };

  const filteredServices = services.filter(s => s.targetSpecies === speciesFilter && s.isActive && (!s.coatType || s.coatType === coatFilter));
  const filteredProducts = inventory.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.category.toLowerCase().includes(productSearch.toLowerCase()));
  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

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
          <button onClick={() => setIsCustomerModalOpen(true)} className="hidden sm:flex items-center gap-2 bg-[#D9ED5F] text-[#1A1F3D] px-5 py-2.5 rounded-2xl shadow-sm text-xs font-black hover:scale-105 active:scale-95 transition-all"><UserPlus size={16} /> {t.newCustomer}</button>
        </header>

        <div className="px-6 lg:px-10 space-y-6 shrink-0 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <CustomerSearch />
            {selectedOwner && (
              <div className="flex items-center gap-3 bg-[#1A1F3D] text-white pl-4 pr-2 py-2 rounded-full shadow-xl shadow-[#1A1F3D]/10 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-2"><Home size={14} className="text-[#D9ED5F]" /><span className="text-[11px] font-black uppercase tracking-tight">{selectedOwner.name}</span></div>
                <div className="h-4 w-px bg-white/10 mx-1" />
                <div className="flex items-center gap-1.5 px-2 text-[#D9ED5F]"><Gem size={12}/><span className="text-[10px] font-black">{(selectedOwner.creditBalance || 0).toLocaleString()}</span></div>
                <button onClick={() => selectOwner(null)} className="w-7 h-7 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"><X size={14} /></button>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-gray-100 pb-2">
            <Tabs value={posTab} onValueChange={setPosTab} className="w-full sm:w-auto">
              <TabsList className="bg-[#F5F6FA] p-1 rounded-[20px] flex gap-1 h-auto">
                <TabsTrigger value="services" className="flex-1 sm:px-8 py-2.5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#1A1F3D] data-[state=active]:shadow-sm text-[10px] font-black uppercase transition-all"><Scissors size={14} className="mr-2" /> Services</TabsTrigger>
                <TabsTrigger value="addons" className="flex-1 sm:px-8 py-2.5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#1A1F3D] data-[state=active]:shadow-sm text-[10px] font-black uppercase transition-all"><Zap size={14} className="mr-2" /> Add-ons</TabsTrigger>
                <TabsTrigger value="products" className="flex-1 sm:px-8 py-2.5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#1A1F3D] data-[state=active]:shadow-sm text-[10px] font-black uppercase transition-all"><Package size={14} className="mr-2" /> Products</TabsTrigger>
                <TabsTrigger value="credit" className="flex-1 sm:px-8 py-2.5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#1A1F3D] data-[state=active]:shadow-sm text-[10px] font-black uppercase transition-all"><Gem size={14} className="mr-2" /> Credits</TabsTrigger>
              </TabsList>
            </Tabs>
            {/* Filter logic same as before... */}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-24 lg:pb-10 scrollbar-hide">
          <Tabs value={posTab} className="h-full">
            {/* Services Content same as before... */}
            <TabsContent value="credit" className="m-0 h-full">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-500">
                  {creditPackages.map(pkg => (
                    <button
                      key={pkg.id}
                      onClick={() => handleBuyCredit(pkg)}
                      className="bg-white rounded-[40px] p-8 border border-transparent hover:border-purple-100 hover:shadow-2xl transition-all flex flex-col items-center group text-center"
                    >
                      <div className="w-20 h-20 bg-purple-50 text-purple-600 rounded-[28px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                         <Gem size={32} />
                      </div>
                      <h3 className="text-xl font-black text-[#1A1F3D] mb-1">{pkg.name}</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">Store Prepaid</p>
                      <div className="bg-purple-100 text-purple-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter mb-8">
                         Receive {pkg.creditAmount} Credits
                      </div>
                      <div className="mt-auto w-full pt-6 border-t border-gray-50 flex justify-between items-center">
                         <span className="text-[10px] font-black text-gray-300 uppercase">Pay Only</span>
                         <span className="text-xl font-black text-[#1A1F3D]">{currency}{pkg.price.toLocaleString()}</span>
                      </div>
                    </button>
                  ))}
               </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <OrderSummary />

      {isCustomerModalOpen && <CustomerModal onClose={() => setIsCustomerModalOpen(false)} />}
      {intakeItem && <GroomingServiceModal item={intakeItem} onClose={() => setIntakeItem(null)} />}
      {selectedAddOn && <AddOnModal addOn={selectedAddOn} onClose={() => setSelectedAddOn(null)} />}
    </div>
  );
};

export default Index;