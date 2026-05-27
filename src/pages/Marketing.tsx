"use client";

import React, { useState, useMemo } from 'react';
import { Plus, Tag, Ticket, Edit3, Trash2, Search, Clock, Gift, Star, Award, Zap, Heart, Megaphone, Wallet, Crown, Gem, Percent, Save, Scissors, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore, TierRule, Service, AddonItem } from '@/store/useStore';
import { translations } from '@/utils/translations';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CouponModal from '@/components/CouponModal';
import PromotionModal from '@/components/PromotionModal';
import CreditPackageModal from '@/components/CreditPackageModal';
import ServiceModal from '@/components/ServiceModal';
import PackageModal from '@/components/PackageModal';
import AddonSettingsModal from '@/components/AddonSettingsModal';

const Marketing = () => {
  const queryClient = useQueryClient();
  const { 
    language, creditPackages, deleteCreditPackage, currency, tierRules, updateTierRules,
    services, toggleServiceActive, deleteService, addons, deleteAddon, packageTemplates, deletePackageTemplate
  } = useStore();
  const t = translations[language];
  
  const [activeTab, setActiveTab] = useState('promotions');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedAddon, setSelectedAddon] = useState<AddonItem | null>(null);

  // Local state for editing tier rules
  const [localTierRules, setLocalTierRules] = useState<TierRule[]>(tierRules);

  // Service Filter States
  const [speciesTab, setSpeciesTab] = useState<'Dog' | 'Cat'>('Dog');
  const [coatFilter, setCoatFilter] = useState<'All' | 'Short' | 'Long'>('All');

  // Fetch Promotions
  const { data: promotions, isLoading: promosLoading } = useQuery({
    queryKey: ['deal_templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deal_templates')
        .select('*')
        .order('created_at', { ascending: false })
        .order('id', { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  // Fetch Coupons
  const { data: coupons, isLoading: couponsLoading } = useQuery({
    queryKey: ['coupon_templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupon_templates')
        .select('*')
        .order('created_at', { ascending: false })
        .order('id', { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  // Mutation for Toggle Switch
  const toggleMutation = useMutation({
    mutationFn: async ({ table, id, is_active }: { table: string, id: string, is_active: boolean }) => {
      const { error } = await supabase
        .from(table)
        .update({ is_active: is_active })
        .eq('id', id);
      if (error) throw error;
      return { table, is_active };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [data.table] });
      toast.success(language === 'th' ? "อัปเดตสถานะสำเร็จ" : "Status updated successfully");
    },
    onError: (error) => {
      console.error('Toggle Error:', error);
      toast.error(language === 'th' ? "ไม่สามารถอัปเดตสถานะได้" : "Failed to update status");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ table, id }: { table: string, id: string }) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      return { table };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [data.table] });
      toast.success(language === 'th' ? "ลบรายการเรียบร้อย" : "Item deleted successfully");
    }
  });

  const getCouponIcon = (name: string) => {
    switch (name) {
      case 'Gift': return Gift;
      case 'Star': return Star;
      case 'Award': return Award;
      case 'Zap': return Zap;
      case 'Heart': return Heart;
      default: return Ticket;
    }
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    if (activeTab === 'promotions') setIsPromoModalOpen(true);
    else if (activeTab === 'coupons') setIsCouponModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedItem(null);
    if (activeTab === 'promotions') setIsPromoModalOpen(true);
    else if (activeTab === 'coupons') setIsCouponModalOpen(true);
    else if (activeTab === 'credits') setIsCreditModalOpen(true);
    else if (activeTab === 'services') {
      setSelectedService(null);
      setIsServiceModalOpen(true);
    }
    else if (activeTab === 'bundles') setIsPackageModalOpen(true);
  };

  const handleEditService = (s: Service) => {
    setSelectedService(s);
    setIsServiceModalOpen(true);
  };

  const handleSaveTiers = () => {
    updateTierRules(localTierRules);
    toast.success(language === 'th' ? "บันทึกเกณฑ์ระดับสมาชิกเรียบร้อย" : "Membership tiers updated successfully");
  };

  const filteredPromos = promotions?.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredCoupons = coupons?.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredCredits = creditPackages.filter(pkg => pkg.name.toLowerCase().includes(searchQuery.toLowerCase()));
  
  const filteredServices = useMemo(() => {
    return services.filter(s => 
      s.targetSpecies === speciesTab && 
      (coatFilter === 'All' || s.coatType === coatFilter) &&
      s.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [services, speciesTab, coatFilter, searchQuery]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8F9FD]">
      <header className="px-6 lg:px-12 py-10 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pl-14 lg:pl-12">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Megaphone size={16} className="text-[#D9ED5F]" />
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">{t.marketing}</p>
          </div>
          <h1 className="text-4xl font-black text-[#1A1F3D]">{t.marketing}</h1>
        </div>
        {activeTab !== 'tiers' && (
          <button 
            onClick={handleAdd}
            className="bg-[#1A1F3D] text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-[#1A1F3D]/10 active:scale-95 transition-all"
          >
            <Plus size={20} /> {
              activeTab === 'promotions' ? t.createPromo : 
              activeTab === 'coupons' ? t.createCoupon : 
              activeTab === 'credits' ? 'สร้างแพ็กเกจเครดิต' : 
              activeTab === 'services' ? 'เพิ่มบริการใหม่' : 
              'สร้างแพ็กเกจบริการ'
            }
          </button>
        )}
      </header>

      <div className="px-6 lg:px-12 mb-8 flex flex-col lg:flex-row justify-between items-center gap-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full lg:w-auto">
          <TabsList className="bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm flex gap-1 h-auto overflow-x-auto scrollbar-hide">
            <TabsTrigger value="promotions" className="flex-1 lg:px-8 py-3 rounded-xl data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white text-xs font-bold transition-all whitespace-nowrap">
              <Tag size={16} className="mr-2" /> {t.promotions}
            </TabsTrigger>
            <TabsTrigger value="coupons" className="flex-1 lg:px-8 py-3 rounded-xl data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white text-xs font-bold transition-all whitespace-nowrap">
              <Ticket size={16} className="mr-2" /> {t.coupons}
            </TabsTrigger>
            <TabsTrigger value="credits" className="flex-1 lg:px-8 py-3 rounded-xl data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white text-xs font-bold transition-all whitespace-nowrap">
              <Wallet size={16} className="mr-2" /> แพ็กเกจเครดิต
            </TabsTrigger>
            <TabsTrigger value="tiers" className="flex-1 lg:px-8 py-3 rounded-xl data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white text-xs font-bold transition-all whitespace-nowrap">
              <Crown size={16} className="mr-2" /> {t.membershipTierLogic}
            </TabsTrigger>
            <TabsTrigger value="services" className="flex-1 lg:px-8 py-3 rounded-xl data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white text-xs font-bold transition-all whitespace-nowrap">
              <Scissors size={16} className="mr-2" /> บริการและบริการเสริม
            </TabsTrigger>
            <TabsTrigger value="bundles" className="flex-1 lg:px-8 py-3 rounded-xl data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white text-xs font-bold transition-all whitespace-nowrap">
              <Package size={16} className="mr-2" /> แพ็กเกจบริการ
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab !== 'tiers' && (
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold shadow-sm"
              placeholder={t.search}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-12 pb-10 scrollbar-hide">
        <Tabs value={activeTab} className="w-full">
          <TabsContent value="promotions" className="m-0">
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
               {filteredPromos?.map((promo) => (
                  <div key={promo.id} className={cn(
                    "bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm transition-all hover:shadow-xl group",
                    !promo.is_active && "opacity-60"
                  )}>
                    <div className="flex justify-between items-start mb-6">
                      <div className={cn("w-14 h-14 rounded-3xl flex items-center justify-center", promo.bg_color || "bg-blue-50")}>
                        <Tag className="text-blue-600" size={24} />
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch 
                          checked={promo.is_active} 
                          onCheckedChange={(val) => toggleMutation.mutate({ table: 'deal_templates', id: promo.id, is_active: val })}
                          className="data-[state=checked]:bg-blue-500"
                        />
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(promo)} className="p-2 text-gray-400 hover:text-[#1A1F3D] rounded-xl"><Edit3 size={16}/></button>
                          <button 
                            onClick={() => {
                              if(window.confirm(language === 'th' ? "ยืนยันการลบโปรโมชั่น?" : "Confirm deletion?")) {
                                deleteMutation.mutate({ table: 'deal_templates', id: promo.id });
                              }
                            }} 
                            className="p-2 text-gray-400 hover:text-red-500 rounded-xl"
                          >
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      </div>
                    </div>
                    <h3 className="text-xl font-black mb-2">{promo.title}</h3>
                    <p className="text-xs text-gray-400 mb-6 leading-relaxed line-clamp-2">{promo.description || "No description provided."}</p>
                    <div className="pt-6 border-t border-gray-50 flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-gray-400">{t.pointsRequired}</span>
                      <span className="text-lg font-black text-[#1A1F3D]">{promo.points_required} PTS</span>
                    </div>
                  </div>
               ))}
               {promosLoading && <div className="col-span-full py-20 text-center font-black opacity-20 animate-pulse">Loading Promotions...</div>}
               {(!promosLoading && filteredPromos?.length === 0) && <div className="col-span-full py-20 text-center opacity-20 font-black">No Promotions Found</div>}
             </div>
          </TabsContent>

          <TabsContent value="coupons" className="m-0">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCoupons?.map((coupon) => {
                const Icon = getCouponIcon(coupon.icon_name);
                return (
                  <div key={coupon.id} className={cn(
                    "bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm transition-all hover:shadow-xl relative overflow-hidden group",
                    !coupon.is_active && "opacity-60"
                  )}>
                    <div className="flex justify-between items-start mb-6">
                      <div className={cn("w-14 h-14 rounded-3xl flex items-center justify-center", coupon.bg_color || "bg-pink-50")}>
                        <Icon className={cn(coupon.bg_color?.replace('bg-', 'text-').replace('-50', '-600') || "text-pink-600")} size={24} />
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch 
                          checked={coupon.is_active} 
                          onCheckedChange={(val) => toggleMutation.mutate({ table: 'coupon_templates', id: coupon.id, is_active: val })}
                          className="data-[state=checked]:bg-green-500"
                        />
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(coupon)} className="p-2 text-gray-400 hover:text-[#1A1F3D] rounded-xl"><Edit3 size={16}/></button>
                          <button 
                            onClick={() => {
                              if(window.confirm(language === 'th' ? "ยืนยันการลบคูปอง?" : "Confirm deletion?")) {
                                deleteMutation.mutate({ table: 'coupon_templates', id: coupon.id });
                              }
                            }} 
                            className="p-2 text-gray-400 hover:text-red-500 rounded-xl"
                          >
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      </div>
                    </div>
                    <h3 className="text-xl font-black mb-2">{coupon.title}</h3>
                    <p className="text-xs text-gray-400 mb-6 leading-relaxed line-clamp-2">{coupon.description || "No description provided."}</p>
                    
                    <div className="space-y-4 pt-6 border-t border-gray-50">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t.pointsRequired}</span>
                        <span className="text-lg font-black text-[#1A1F3D]">{coupon.points_required} PTS</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Clock size={12} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{t.expiryDays}</span>
                        </div>
                        <span className="text-xs font-bold text-[#1A1F3D]">{coupon.expiry_days} Days</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {couponsLoading && <div className="col-span-full py-20 text-center font-black opacity-20 animate-pulse">Loading Coupons...</div>}
              {(!couponsLoading && filteredCoupons?.length === 0) && <div className="col-span-full py-20 text-center opacity-20 font-black">No Coupons Found</div>}
            </div>
          </TabsContent>

          <TabsContent value="credits" className="m-0">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCredits.map((pkg) => (
                <div key={pkg.id} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm transition-all hover:shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 rounded-3xl flex items-center justify-center bg-amber-50">
                      <Wallet className="text-amber-600" size={24} />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setSelectedItem(pkg);
                          setIsCreditModalOpen(true);
                        }} 
                        className="p-2 text-gray-400 hover:text-[#1A1F3D] rounded-xl"
                      >
                        <Edit3 size={16}/>
                      </button>
                      <button 
                        onClick={() => {
                          if(window.confirm(language === 'th' ? "ยืนยันการลบแพ็กเกจเครดิต?" : "Confirm deletion?")) {
                            deleteCreditPackage(pkg.id);
                            toast.success(language === 'th' ? "ลบแพ็กเกจเครดิตเรียบร้อย" : "Credit package deleted");
                          }
                        }} 
                        className="p-2 text-gray-400 hover:text-red-500 rounded-xl"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </div>
                  <h3 className="text-xl font-black mb-2">{pkg.name}</h3>
                  <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                    จ่ายเพียง {currency}{pkg.price.toLocaleString()} ได้รับเครดิตมูลค่า {currency}{pkg.creditValue.toLocaleString()}
                  </p>
                  <div className="pt-6 border-t border-gray-50 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-gray-400">ราคาขาย</span>
                    <span className="text-lg font-black text-[#1A1F3D]">{currency}{pkg.price.toLocaleString()}</span>
                  </div>
                </div>
              ))}
              {filteredCredits.length === 0 && (
                <div className="col-span-full py-20 text-center opacity-20 border-2 border-dashed border-gray-200 rounded-[40px]">
                  <Wallet size={48} className="mx-auto mb-4" />
                  <p className="font-black">ไม่พบแพ็กเกจเครดิต</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="tiers" className="m-0">
            <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm space-y-12">
               <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black text-[#1A1F3D] mb-1">{t.membershipTierLogic}</h3>
                    <p className="text-xs text-gray-400 font-medium">{t.membershipDesc}</p>
                  </div>
                  <button 
                    onClick={handleSaveTiers} 
                    className="bg-[#1A1F3D] text-white px-8 py-3 rounded-xl font-black text-xs flex items-center gap-2 shadow-md hover:scale-105 active:scale-95 transition-all"
                  >
                    <Save size={16} /> {t.saveChanges}
                  </button>
               </div>
               <div className="space-y-6">
                  {localTierRules.map((rule, idx) => (
                    <div key={rule.level} className="flex flex-col lg:flex-row items-center gap-8 p-8 bg-[#F5F6FA] rounded-[40px] relative overflow-hidden transition-all hover:shadow-md border border-transparent hover:border-gray-200">
                       <div className="absolute top-0 left-0 w-2 h-full bg-[#1A1F3D]" />
                       <div className="w-16 h-16 bg-white rounded-[24px] flex items-center justify-center shadow-sm shrink-0">
                          {rule.level === 'VIP' ? <Gem className="text-purple-500" size={32} /> : rule.level === 'Gold' ? <Crown className="text-amber-500" size={32} /> : rule.level === 'Silver' ? <Star className="text-blue-500" size={32} /> : <Award className="text-gray-400" size={32} />}
                       </div>
                       <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Label</label>
                             <input className="w-full bg-white border-none rounded-2xl px-5 py-3 text-sm font-bold shadow-sm" value={rule.label} onChange={e => { const r = [...localTierRules]; r[idx].label = e.target.value; setLocalTierRules(r); }} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Min. Spent ({currency})</label>
                             <input type="number" className="w-full bg-white border-none rounded-2xl px-5 py-3 text-sm font-bold shadow-sm" value={rule.minSpent} onChange={e => { const r = [...localTierRules]; r[idx].minSpent = Number(e.target.value); setLocalTierRules(r); }} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Discount (%)</label>
                             <div className="relative">
                                <Percent className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                                <input type="number" className="w-full bg-white border-none rounded-2xl px-5 py-3 text-sm font-bold shadow-sm" value={rule.discount} onChange={e => { const r = [...localTierRules]; r[idx].discount = Number(e.target.value); setLocalTierRules(r); }} />
                             </div>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </TabsContent>

          <TabsContent value="services" className="m-0 space-y-12">
             <section className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                   <div>
                      <h3 className="text-xl font-black text-[#1A1F3D] mb-1">Service Catalog</h3>
                      <p className="text-xs text-gray-400 font-medium">Define your specialized grooming treatments.</p>
                   </div>
                   <div className="flex flex-wrap gap-3">
                      <div className="bg-[#F5F6FA] p-1 rounded-2xl flex gap-1">
                         <button onClick={() => setSpeciesTab('Dog')} className={cn("px-4 py-2 rounded-xl text-[10px] font-black transition-all", speciesTab === 'Dog' ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400")}>DOG</button>
                         <button onClick={() => setSpeciesTab('Cat')} className={cn("px-4 py-2 rounded-xl text-[10px] font-black transition-all", speciesTab === 'Cat' ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400")}>CAT</button>
                      </div>
                      <div className="bg-[#F5F6FA] p-1 rounded-2xl flex gap-1">
                         {(['All', 'Short', 'Long'] as const).map(type => (
                           <button
                             key={type}
                             onClick={() => setCoatFilter(type)}
                             className={cn(
                               "px-4 py-2 rounded-xl text-[10px] font-black transition-all",
                               coatFilter === type ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400"
                             )}
                           >
                             {type === 'All' ? 'ALL' : type === 'Short' ? 'SHORT' : 'LONG'}
                           </button>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {filteredServices.map(s => (
                      <div key={s.id} className="p-5 bg-white border border-gray-100 rounded-[32px] flex items-center justify-between group hover:shadow-lg transition-all">
                         <div className="flex items-center gap-4">
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm", s.targetSpecies === 'Dog' ? "bg-blue-500" : "bg-pink-500")}><Scissors size={20}/></div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-black text-[#1A1F3D] text-sm">{s.title}</h4>
                                {s.coatType && (
                                  <span className={cn(
                                    "text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase",
                                    s.coatType === 'Short' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                                  )}>
                                    {s.coatType === 'Short' ? 'Short' : 'Long'}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">{s.category}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-3">
                            <Switch checked={s.isActive} onCheckedChange={() => toggleServiceActive(s.id)} className="data-[state=checked]:bg-[#1A1F3D]" />
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => handleEditService(s)} className="p-2 text-gray-300 hover:text-[#1A1F3D] bg-gray-50 rounded-lg"><Edit3 size={16}/></button>
                               <button onClick={() => { if(confirm('Delete service?')) deleteService(s.id); }} className="p-2 text-gray-300 hover:text-red-500 bg-gray-50 rounded-lg"><Trash2 size={16}/></button>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </section>

             <section className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm space-y-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black text-[#1A1F3D] mb-1">Global Add-ons</h3>
                    <p className="text-xs text-gray-400 font-medium">Extra items that can be added to any order.</p>
                  </div>
                  <button onClick={() => { setSelectedAddon(null); setIsAddonModalOpen(true); }} className="bg-[#1A1F3D] text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2"><Plus size={16} /> Add Add-on</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {addons.map(addon => (
                     <div key={addon.id} className="p-6 bg-[#F5F6FA] rounded-[32px] flex justify-between items-center group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm"><Zap size={18} /></div>
                           <div><p className="text-sm font-black text-[#1A1F3D]">{addon.name}</p><p className="text-[10px] text-gray-400 font-bold uppercase">{currency}{addon.price}</p></div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => { setSelectedAddon(addon); setIsAddonModalOpen(true); }} className="p-2 text-gray-300 hover:text-[#1A1F3D]"><Edit3 size={16}/></button>
                           <button onClick={() => deleteAddon(addon.id)} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                        </div>
                     </div>
                   ))}
                </div>
             </section>
          </TabsContent>

          <TabsContent value="bundles" className="m-0">
             <section className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm space-y-8">
                <div className="flex justify-between items-center">
                   <div>
                     <h3 className="text-xl font-black text-[#1A1F3D] mb-1">Service Bundle Templates</h3>
                     <p className="text-xs text-gray-400 font-medium">Configure multi-session packages (e.g., Buy 8 Get 2 Free).</p>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {packageTemplates.map(t => (
                      <div key={t.id} className="p-8 bg-[#F5F6FA] rounded-[40px] flex justify-between items-center group relative overflow-hidden">
                         <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
                         <div>
                           <h4 className="font-black text-[#1A1F3D] text-lg">{t.name}</h4>
                           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{t.paidSlots}+{t.freeSlots} Sessions • {currency}{t.price.toLocaleString()}</p>
                         </div>
                         <button onClick={() => deletePackageTemplate(t.id)} className="p-3 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-xl shadow-sm"><Trash2 size={18} /></button>
                      </div>
                   ))}
                   {packageTemplates.length === 0 && (
                     <div className="col-span-full py-20 text-center opacity-20"><Package size={48} className="mx-auto mb-4"/><p className="font-black">No bundles created yet</p></div>
                   )}
                </div>
             </section>
          </TabsContent>
        </Tabs>
      </div>

      {isCouponModalOpen && <CouponModal coupon={selectedItem} onClose={() => setIsCouponModalOpen(false)} />}
      {isPromoModalOpen && <PromotionModal promotion={selectedItem} onClose={() => setIsPromoModalOpen(false)} />}
      {isCreditModalOpen && <CreditPackageModal onClose={() => setIsCreditModalOpen(false)} />}
      {isServiceModalOpen && <ServiceModal service={selectedService} defaultSpecies={speciesTab} onClose={() => setIsServiceModalOpen(false)} />}
      {isAddonModalOpen && <AddonSettingsModal addon={selectedAddon} onClose={() => setIsAddonModalOpen(false)} />}
      {isPackageModalOpen && <PackageModal onClose={() => setIsPackageModalOpen(false)} />}
    </div>
  );
};

export default Marketing;