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
  CheckCircle2, Dog, Cat, Scissors, Package, ClipboardList, Clock, Zap, Star, Heart, Brush, Wind, Stethoscope, Award, Bone, Bath, Wallet, Plus, AlertCircle, ArrowRight
} from 'lucide-react';
import { useStore, QueueItem, ServiceIcon, Customer } from '@/store/useStore';
import { translations } from '@/utils/translations';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';

const getIcon = (iconName: ServiceIcon) => {
  switch(iconName) {
    case 'grooming': return Scissors;
    case 'bath': return Bath;
    case 'spa': return Sparkles;
    case 'nail': return Zap;
    case 'dry': return Wind;
    case 'brush': return Brush;
    case 'health': return Stethoscope;
    case 'hotel': return Home;
    case 'love': return Heart;
    case 'food': return Bone;
    case 'premium': return Award;
    default: return Zap;
  }
};

// ข้อมูลลูกค้า Walk-in สำหรับระบบ Quick Sale
const walkInCustomer: Customer = {
  id: 'walk-in',
  name: 'ลูกค้าทั่วไป (Walk-in)',
  phone: '-',
  email: '-',
  membership: 'Standard',
  pets: [
    {
      id: 'walk-in-dog',
      name: 'สุนัขทั่วไป',
      species: 'Dog',
      breed: 'Mixed Breed',
      birthday: new Date().toISOString().split('T')[0],
      weightHistory: [],
      serviceHistory: [],
      notes: '',
      image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&h=200&fit=crop'
    },
    {
      id: 'walk-in-cat',
      name: 'แมวทั่วไป',
      species: 'Cat',
      breed: 'Mixed Breed',
      birthday: new Date().toISOString().split('T')[0],
      weightHistory: [],
      serviceHistory: [],
      notes: '',
      image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&h=200&fit=crop'
    }
  ],
  totalSpent: 0,
  creditBalance: 0
};

const Index = () => {
  const isMobile = useIsMobile();
  const { 
    selectedOwner, 
    activePet, 
    services, 
    addons,
    inventory,
    packageTemplates,
    creditPackages,
    selectOwner, 
    setActivePet, 
    queue, 
    customers,
    setActiveQueueItem,
    cart,
    addToCart,
    currency,
    language
  } = useStore();

  const t = translations[language];
  const today = format(new Date(), 'yyyy-MM-dd');

  const [posTab, setPosTab] = useState('services');
  const [speciesFilter, setSpeciesFilter] = useState<'Dog' | 'Cat'>('Dog');
  const [coatFilter, setCoatFilter] = useState<'All' | 'Short' | 'Long'>('Short');
  const [productSearch, setProductQuery] = useState('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [intakeItem, setIntakeItem] = useState<QueueItem | null>(null);
  const [selectedAddOn, setSelectedAddOn] = useState<any>(null);

  useEffect(() => {
    if (activePet) {
      setSpeciesFilter(activePet.species === 'Dog' ? 'Dog' : 'Cat');
    }
  }, [activePet]);

  const todayQueue = queue.filter(q => q.date === today && !q.isPaid);

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

  const handleQuickSale = () => {
    selectOwner(walkInCustomer);
    toast.success(language === 'th' ? "เปิดโหมดขายด่วน (ลูกค้าทั่วไป)" : "Quick Sale Mode Activated");
  };

  const filteredServices = services.filter(s => 
    s.targetSpecies === speciesFilter && 
    s.isActive && 
    (!s.coatType || s.coatType === coatFilter)
  );
  
  const filteredProducts = inventory.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );
  
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
          <div className="flex gap-3">
            <button 
              onClick={handleQuickSale}
              className="flex items-center gap-2 bg-[#1A1F3D] text-[#D9ED5F] px-5 py-2.5 rounded-2xl shadow-sm text-xs font-black hover:scale-105 active:scale-95 transition-all"
            >
              <Zap size={16} />
              {language === 'th' ? 'ขายด่วน (Quick Sale)' : 'Quick Sale'}
            </button>
            <button 
              onClick={() => setIsCustomerModalOpen(true)}
              className="hidden sm:flex items-center gap-2 bg-[#D9ED5F] text-[#1A1F3D] px-5 py-2.5 rounded-2xl shadow-sm text-xs font-black hover:scale-105 active:scale-95 transition-all"
            >
              <UserPlus size={16} />
              {t.newCustomer}
            </button>
          </div>
        </header>

        <div className="px-6 lg:px-10 space-y-6 shrink-0 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <CustomerSearch />
            
            {selectedOwner && (
              <div className="flex flex-wrap items-center gap-3">
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

                {/* ตัวเลือกสัตว์เลี้ยงสำหรับลูกค้าที่เลือกอยู่ */}
                {selectedOwner.pets.length > 0 && (
                  <div className="flex gap-1.5 bg-white p-1 rounded-full border border-gray-100 shadow-sm animate-in fade-in duration-300">
                    {selectedOwner.pets.map(pet => (
                      <button
                        key={pet.id}
                        onClick={() => setActivePet(pet)}
                        className={cn(
                          "px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all flex items-center gap-1.5",
                          activePet?.id === pet.id 
                            ? "bg-[#1A1F3D] text-white shadow-sm" 
                            : "text-gray-400 hover:text-gray-600"
                        )}
                      >
                        {pet.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {todayQueue.length > 0 && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Today's Appointments ({todayQueue.length})</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {todayQueue.map(item => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-3 bg-white border px-4 py-3 rounded-[24px] shrink-0 transition-all group relative",
                      activePet?.id === item.petId ? "border-[#1A1F3D] ring-2 ring-[#1A1F3D]/5" : "border-gray-100",
                      item.status === 'Waiting' ? "border-orange-100" : "border-green-100"
                    )}
                  >
                    <button onClick={() => handleQuickSelectFromQueue(item)} className="flex items-center gap-3 text-left">
                      <img src={item.image} className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                      <div className="pr-10">
                        <p className="text-xs font-black text-[#1A1F3D]">{item.petName}</p>
                        <div className="flex items-center gap-1.5">
                           <Clock size={8} className="text-gray-300" />
                           <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{item.time}</p>
                        </div>
                      </div>
                    </button>
                    <button 
                      onClick={() => setIntakeItem(item)}
                      className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                        item.status === 'Waiting' ? "bg-orange-50 text-white shadow-lg shadow-orange-500/20" : "bg-gray-50 text-gray-300"
                      )}
                    >
                      <ClipboardList size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-gray-100 pb-2">
            <Tabs value={posTab} onValueChange={setPosTab} className="w-full sm:w-auto">
              <TabsList className="bg-[#F5F6FA] p-1 rounded-[20px] flex gap-1 h-auto overflow-x-auto scrollbar-hide">
                <TabsTrigger value="services" className="flex-1 sm:px-6 py-2.5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#1A1F3D] data-[state=active]:shadow-sm text-[10px] font-black uppercase transition-all whitespace-nowrap">
                  <Scissors size={14} className="mr-2" /> Services
                </TabsTrigger>
                <TabsTrigger value="addons" className="flex-1 sm:px-6 py-2.5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#1A1F3D] data-[state=active]:shadow-sm text-[10px] font-black uppercase transition-all whitespace-nowrap">
                  <Zap size={14} className="mr-2" /> Add-ons
                </TabsTrigger>
                <TabsTrigger value="products" className="flex-1 sm:px-6 py-2.5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#1A1F3D] data-[state=active]:shadow-sm text-[10px] font-black uppercase transition-all whitespace-nowrap">
                  <Package size={14} className="mr-2" /> Products
                </TabsTrigger>
                <TabsTrigger value="packages" className="flex-1 sm:px-6 py-2.5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#1A1F3D] data-[state=active]:shadow-sm text-[10px] font-black uppercase transition-all whitespace-nowrap">
                  <Package size={14} className="mr-2" /> Packages
                </TabsTrigger>
                <TabsTrigger value="credits" className="flex-1 sm:px-6 py-2.5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#1A1F3D] data-[state=active]:shadow-sm text-[10px] font-black uppercase transition-all whitespace-nowrap">
                  <Wallet size={14} className="mr-2" /> Credits
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {posTab === 'services' && (
               <div className="flex gap-4 animate-in zoom-in-95">
                 {/* Species Filter */}
                 <div className="bg-white p-1 rounded-2xl border border-gray-100 flex gap-1">
                   <button onClick={() => setSpeciesFilter('Dog')} className={cn("px-5 py-2 rounded-xl text-[9px] font-black flex items-center gap-2 transition-all", speciesFilter === 'Dog' ? "bg-[#1A1F3D] text-white shadow-md" : "text-gray-400")}><Dog size={12} /> DOG</button>
                   <button onClick={() => setSpeciesFilter('Cat')} className={cn("px-5 py-2 rounded-xl text-[9px] font-black flex items-center gap-2 transition-all", speciesFilter === 'Cat' ? "bg-[#1A1F3D] text-white shadow-md" : "text-gray-400")}><Cat size={12} /> CAT</button>
                 </div>

                 {/* Coat Filter */}
                 <div className="bg-white p-1 rounded-2xl border border-gray-100 flex gap-1">
                   <button onClick={() => setCoatFilter('Short')} className={cn("px-5 py-2 rounded-xl text-[9px] font-black transition-all", coatFilter === 'Short' ? "bg-[#1A1F3D] text-white shadow-md" : "text-gray-400")}>SHORT COAT</button>
                   <button onClick={() => setCoatFilter('Long')} className={cn("px-5 py-2 rounded-xl text-[9px] font-black transition-all", coatFilter === 'Long' ? "bg-[#1A1F3D] text-white shadow-md" : "text-gray-400")}>LONG COAT</button>
                 </div>
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

        {/* คำแนะนำการใช้งานเมื่อยังไม่ได้เลือกลูกค้า */}
        {!selectedOwner && (
          <div className="mx-6 lg:mx-10 mb-6 p-6 bg-indigo-50 border border-indigo-100 rounded-[32px] flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-sm font-black text-indigo-950">
                  {language === 'th' ? 'กรุณาเลือกข้อมูลลูกค้าก่อนทำรายการ' : 'Please select a customer to start'}
                </h3>
                <p className="text-xs text-indigo-800/70 font-medium mt-0.5">
                  {language === 'th' ? 'ค้นหาชื่อลูกค้าด้านบน หรือคลิกปุ่ม "ขายด่วน" เพื่อทำรายการให้ลูกค้าทั่วไปทันที' : 'Search for a customer above or click "Quick Sale" for walk-in clients.'}
                </p>
              </div>
            </div>
            <button 
              onClick={handleQuickSale}
              className="bg-[#1A1F3D] text-white px-6 py-3 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-[#2A3152] transition-all shrink-0 shadow-md"
            >
              {language === 'th' ? 'เปิดโหมดขายด่วน' : 'Quick Sale'} <ArrowRight size={14} />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-24 lg:pb-10 scrollbar-hide">
          <Tabs value={posTab} className="h-full">
            <TabsContent value="services" className="m-0 h-full">
              {filteredServices.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                  <ShoppingBag size={48} className="mb-4" />
                  <h2 className="text-xl font-black">{language === 'th' ? 'ไม่พบบริการ' : 'No services found'}</h2>
                  <p className="text-xs font-bold uppercase">For {speciesFilter} - {coatFilter} category</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 lg:gap-6 animate-in fade-in zoom-in-95 duration-500">
                  {filteredServices.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="addons" className="m-0 h-full">
               {addons.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                    <Zap size={48} className="mb-4" />
                    <h2 className="text-xl font-black">No Add-ons Configured</h2>
                    <p className="text-xs font-bold uppercase">Go to Settings to add global add-ons</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6 animate-in fade-in zoom-in-95 duration-500">
                    {addons.map(addon => {
                      const Icon = getIcon(addon.icon);
                      return (
                        <button
                          key={addon.id}
                          onClick={() => setSelectedAddOn({ ...addon, defaultPrice: addon.price, icon: Icon })}
                          className="bg-white rounded-[40px] p-8 border border-transparent hover:border-gray-100 hover:shadow-2xl transition-all duration-300 flex flex-col items-center text-center group"
                        >
                          <div className={cn("w-20 h-20 rounded-[28px] flex items-center justify-center mb-6 shadow-sm transition-transform group-hover:scale-110 bg-blue-50")}>
                            <Icon className={cn("w-10 h-10 text-blue-600")} />
                          </div>
                          <h3 className="text-xl font-black text-[#1A1F3D] mb-1">{addon.name}</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">Service Add-on</p>
                          <div className="mt-auto w-full pt-6 border-t border-gray-50 flex justify-between items-center">
                            <span className="text-[10px] font-black text-gray-300 uppercase">Default</span>
                            <span className="text-lg font-black text-[#1A1F3D]">฿{addon.price}</span>
                          </div>
                        </button>
                      );
                    })}
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

            <TabsContent value="packages" className="m-0 h-full">
              {packageTemplates.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                  <Package size={48} className="mb-4" />
                  <h2 className="text-xl font-black">{language === 'th' ? 'ไม่มีแพ็กเกจบริการ' : 'No packages found'}</h2>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 lg:gap-6 animate-in fade-in zoom-in-95 duration-500">
                  {packageTemplates.map((pkg) => {
                    const targetService = services.find(s => s.id === pkg.serviceId);
                    return (
                      <div key={pkg.id} className="bg-white rounded-[40px] p-8 flex flex-col h-full transition-all duration-300 border border-transparent group hover:shadow-2xl hover:border-gray-100">
                        <div className="flex justify-between items-start mb-6">
                          <div className="w-14 h-14 bg-indigo-50 rounded-[20px] flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-110">
                            <Package className="w-7 h-7" />
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Price</p>
                            <p className="text-3xl font-black text-[#1A1F3D]">{currency}{pkg.price.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="mb-8 flex-1">
                          <h3 className="text-2xl font-black text-[#1A1F3D] mb-1">{pkg.name}</h3>
                          <p className="text-xs text-gray-400 leading-relaxed">
                            {targetService?.title || 'บริการทั่วไป'} • จำนวน {pkg.paidSlots + pkg.freeSlots} ครั้ง (จ่าย {pkg.paidSlots} แถม {pkg.freeSlots})
                          </p>
                          {pkg.bonusType && pkg.bonusType !== 'none' && (
                            <p className="text-[10px] text-indigo-600 font-black uppercase mt-2 flex items-center gap-1">
                              <Sparkles size={12} /> 
                              {pkg.bonusType === 'recurring' ? `แถมฟรี: ${pkg.bonusName} (ทุกครั้ง)` : `แถมฟรี: ${pkg.bonusName} (${pkg.bonusCount} ครั้ง)`}
                            </p>
                          )}
                        </div>

                        <button 
                          onClick={() => {
                            if (!selectedOwner) {
                              toast.error("Please select a customer first");
                              return;
                            }
                            addToCart({
                              id: `package-${pkg.id}`,
                              title: pkg.name,
                              price: pkg.price,
                              quantity: 1,
                              ownerName: selectedOwner.name,
                              type: 'Package'
                            });
                            toast.success(`Added ${pkg.name} to cart`);
                          }}
                          className="w-full bg-[#1A1F3D] text-white font-black py-5 rounded-[24px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-[#1A1F3D]/10"
                        >
                          <Plus size={20} /> {language === 'th' ? 'เพิ่มลงตะกร้า' : 'Add to Cart'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="credits" className="m-0 h-full">
              {creditPackages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                  <Wallet size={48} className="mb-4" />
                  <h2 className="text-xl font-black">{language === 'th' ? 'ไม่มีแพ็กเกจเครดิต' : 'No credit packages found'}</h2>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 lg:gap-6 animate-in fade-in zoom-in-95 duration-500">
                  {creditPackages.map((pkg) => (
                    <div key={pkg.id} className="bg-white rounded-[40px] p-8 flex flex-col h-full transition-all duration-300 border border-transparent group hover:shadow-2xl hover:border-gray-100">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-14 h-14 bg-amber-50 rounded-[20px] flex items-center justify-center text-amber-600 transition-transform group-hover:scale-110">
                          <Wallet className="w-7 h-7" />
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Price</p>
                          <p className="text-3xl font-black text-[#1A1F3D]">{currency}{pkg.price.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="mb-8 flex-1">
                        <h3 className="text-2xl font-black text-[#1A1F3D] mb-1">{pkg.name}</h3>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          เติมเงิน {currency}{pkg.price.toLocaleString()} ได้รับเครดิตมูลค่า {currency}{pkg.creditValue.toLocaleString()}
                        </p>
                      </div>

                      <button 
                        onClick={() => {
                          if (!selectedOwner) {
                            toast.error("Please select a customer first");
                            return;
                          }
                          addToCart({
                            id: `credit-${pkg.id}`,
                            title: pkg.name,
                            price: pkg.price,
                            quantity: 1,
                            ownerName: selectedOwner.name,
                            type: 'Credit'
                          });
                          toast.success(`Added ${pkg.name} to cart`);
                        }}
                        className="w-full bg-[#1A1F3D] text-white font-black py-5 rounded-[24px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-[#1A1F3D]/10"
                      >
                        <Plus size={20} /> {language === 'th' ? 'เพิ่มลงตะกร้า' : 'Add to Cart'}
                      </button>
                    </div>
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

      {intakeItem && (
        <GroomingServiceModal item={intakeItem} onClose={() => setIntakeItem(null)} />
      )}

      {selectedAddOn && (
        <AddOnModal addOn={selectedAddOn} onClose={() => setSelectedAddOn(null)} />
      )}
    </div>
  );
};

export default Index;