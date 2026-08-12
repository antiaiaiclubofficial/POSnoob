"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Tag, Ticket, Edit3, Trash2, Search, Clock, Gift, Star, Award, Zap, Heart, Megaphone, Wallet, Crown, Gem, Percent, Save, Scissors, Package, ShieldCheck, FileText, Sparkles, ChevronDown, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore, TierRule, Service, AddonItem } from '@/store/useStore';
import { translations } from '@/utils/translations';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { IconPicker, getIconComponent } from "@/components/ui/IconPicker";
import { CustomColorPicker } from "@/components/hotel/HotelSettingsTab";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import CouponModal from '@/components/CouponModal';
import PromotionModal from '@/components/PromotionModal';
import CreditPackageModal from '@/components/CreditPackageModal';
import PackageModal from '@/components/PackageModal';
import TierEditModal from '@/components/TierEditModal';
import { useLocation } from 'react-router-dom';

const Marketing = () => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { 
    language, creditPackages, deleteCreditPackage, currency, tierRules, updateTierRules,
    services, packageTemplates, deletePackageTemplate, storeId,
    pointsEarnRate, pointsRedeemRate, updateBusinessProfile
  } = useStore();
  const t = translations[language];
  
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'promotions');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isTierEditModalOpen, setIsTierEditModalOpen] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedTierForEdit, setSelectedTierForEdit] = useState<any>(null);

  // Local state for editing tier rules
  const [localTierRules, setLocalTierRules] = useState<TierRule[]>(tierRules);

  // Local state for points settings
  const [localPointsEarnRate, setLocalPointsEarnRate] = useState(pointsEarnRate || 10);
  const [localPointsRedeemRate, setLocalPointsRedeemRate] = useState(pointsRedeemRate || 1);
  const [pointsSaveStatus, setPointsSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    if (localPointsEarnRate === pointsEarnRate && localPointsRedeemRate === pointsRedeemRate) return;

    setPointsSaveStatus('saving');
    const timer = setTimeout(() => {
      updateBusinessProfile({
        pointsEarnRate: localPointsEarnRate,
        pointsRedeemRate: localPointsRedeemRate
      }, false);
      setPointsSaveStatus('saved');
      setTimeout(() => setPointsSaveStatus('idle'), 2000);
    }, 1000);

    return () => clearTimeout(timer);
  }, [localPointsEarnRate, localPointsRedeemRate, pointsEarnRate, pointsRedeemRate, updateBusinessProfile]);

  useEffect(() => {
    if (pointsEarnRate !== undefined) setLocalPointsEarnRate(pointsEarnRate);
    if (pointsRedeemRate !== undefined) setLocalPointsRedeemRate(pointsRedeemRate);
  }, [pointsEarnRate, pointsRedeemRate]);

  // Fetch Promotions
  const { data: promotions, isLoading: promosLoading } = useQuery({
    queryKey: ['deal_templates', storeId],
    queryFn: async () => {
      let query = supabase
        .from('deal_templates')
        .select('*');
      
      if (storeId && storeId !== 'default-store') {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .order('id', { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  // Fetch Coupons
  const { data: coupons, isLoading: couponsLoading } = useQuery({
    queryKey: ['coupon_templates', storeId],
    queryFn: async () => {
      let query = supabase
        .from('coupon_templates')
        .select('*');
      
      if (storeId && storeId !== 'default-store') {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .order('id', { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  // Fetch Membership Tiers directly from DB
  const { data: dbTiers, isLoading: tiersLoading, refetch: refetchTiers } = useQuery({
    queryKey: ['membership_tiers_marketing', storeId],
    queryFn: async () => {
      let query = supabase
        .from('membership_tiers')
        .select('*');
      
      if (storeId && storeId !== 'default-store') {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Sort by min_points ascending
      return (data || []).sort((a, b) => a.min_points - b.min_points);
    }
  });

  const [localDbTiers, setLocalDbTiers] = useState<any[]>([]);
  const [tierSaveStatus, setTierSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    if (!dbTiers || localDbTiers.length === 0) return;
    
    // Check if dirty
    const isDirty = JSON.stringify(localDbTiers) !== JSON.stringify(dbTiers);
    if (!isDirty) return;

    setTierSaveStatus('saving');
    const timer = setTimeout(() => {
      const sorted = [...localDbTiers].sort((a, b) => Number(a.min_points) - Number(b.min_points));
      saveTiersMutation.mutate(sorted, {
        onSuccess: () => {
          setTierSaveStatus('saved');
          setTimeout(() => setTierSaveStatus('idle'), 2000);
        }
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [localDbTiers, dbTiers]);

  useEffect(() => {
    if (dbTiers) {
      setLocalDbTiers(dbTiers);
    }
  }, [dbTiers]);

  // Mutation for saving membership tiers
  const saveTiersMutation = useMutation({
    mutationFn: async (updatedTiers: any[]) => {
      for (const tier of updatedTiers) {
        const { error } = await supabase
          .from('membership_tiers')
          .update({
            name: tier.name,
            min_points: Number(tier.min_points),
            color_class: tier.color_class,
            icon_name: tier.icon_name,
            description: tier.description,
            benefits: tier.benefits
          })
          .eq('id', tier.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membership_tiers_marketing'] });
      queryClient.invalidateQueries({ queryKey: ['membership_tiers'] });
      refetchTiers();
    },
    onError: (error: any) => {
      toast.error(language === 'th' ? "เกิดข้อผิดพลาด: " + error.message : "Error: " + error.message);
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

  // getCouponIcon and getTierIcon have been replaced by getIconComponent from IconPicker

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
    else if (activeTab === 'bundles') setIsPackageModalOpen(true);
  };



  const filteredPromos = promotions?.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredCoupons = coupons?.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredCredits = creditPackages.filter(pkg => pkg.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleOpenTierEditModal = (tier: any, index: number) => {
    setSelectedTierForEdit({ ...tier, index });
    setIsTierEditModalOpen(true);
  };

  const handleSaveTierText = (description: string, benefits: string[]) => {
    if (selectedTierForEdit === null) return;
    const updated = [...localDbTiers];
    updated[selectedTierForEdit.index] = {
      ...updated[selectedTierForEdit.index],
      description,
      benefits
    };
    setLocalDbTiers(updated);
  };

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
        {activeTab !== 'tiers' && activeTab !== 'points' && (
          <button 
            onClick={handleAdd}
            className="bg-[#1A1F3D] text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-[#1A1F3D]/10 active:scale-95 transition-all"
          >
            <Plus size={20} /> {
              activeTab === 'promotions' ? t.createPromo : 
              activeTab === 'coupons' ? t.createCoupon : 
              activeTab === 'credits' ? 'สร้างแพ็กเกจเครดิต' : 
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
            <TabsTrigger value="bundles" className="flex-1 lg:px-8 py-3 rounded-xl data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white text-xs font-bold transition-all whitespace-nowrap">
              <Package size={16} className="mr-2" /> แพ็กเกจบริการ
            </TabsTrigger>
            <TabsTrigger value="tiers" className="flex-1 lg:px-8 py-3 rounded-xl data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white text-xs font-bold transition-all whitespace-nowrap">
              <Crown size={16} className="mr-2" /> {t.membershipTierLogic}
            </TabsTrigger>
            <TabsTrigger value="points" className="flex-1 lg:px-8 py-3 rounded-xl data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white text-xs font-bold transition-all whitespace-nowrap">
              <Star size={16} className="mr-2" /> ตั้งค่าคะแนนสะสม
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab !== 'tiers' && activeTab !== 'points' && (
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
             <section className="relative overflow-hidden bg-[#F9F9F9]/80 p-10 rounded-[3rem] space-y-8 border border-white">
                <div className="absolute inset-0 pointer-events-none z-0">
                  <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 blur-[80px]" />
                  <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-purple-400/20 blur-[80px]" />
                </div>
                <div className="flex justify-between items-center relative z-10">
                   <div>
                     <h3 className="text-xl font-black text-[#1A1F3D] mb-1">Promotions</h3>
                     <p className="text-xs text-gray-500 font-medium">สร้างโปรโมชั่นและส่วนลดพิเศษสำหรับลูกค้าของคุณ</p>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
               {filteredPromos?.map((promo) => (
                  <div key={promo.id} className={cn(
                    "bg-gradient-to-br from-white/90 to-white/40 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/60 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(24,35,74,0.06)] relative overflow-hidden group",
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
                          className="data-[state=checked]:bg-green-500"
                        />
                        <div className="flex gap-1 transition-opacity">
                          <button onClick={() => handleEdit(promo)} className="p-2 text-gray-400 hover:text-[#1A1F3D] hover:bg-gray-50 rounded-xl transition-colors"><Edit3 size={16}/></button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                <Trash2 size={16}/>
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-[2rem]">
                              <AlertDialogHeader>
                                <AlertDialogTitle>{language === 'th' ? 'ยืนยันการลบโปรโมชั่น?' : 'Confirm deletion?'}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {language === 'th' ? 'โปรโมชั่นนี้จะถูกลบอย่างถาวร' : 'This promotion will be permanently deleted.'}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl">{language === 'th' ? 'ยกเลิก' : 'Cancel'}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteMutation.mutate({ table: 'deal_templates', id: promo.id })} className="rounded-xl bg-red-500 hover:bg-red-600 text-white">
                                  {language === 'th' ? 'ลบ' : 'Delete'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                    <h3 className="text-xl font-black mb-2">{promo.title}</h3>
                    <p className="text-xs text-gray-400 mb-6 leading-relaxed line-clamp-2">{promo.description || "No description provided."}</p>
                    
                    <div className="pt-6 border-t border-gray-50 flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t.pointsRequired}</span>
                      <span className="text-lg font-black text-[#1A1F3D]">{promo.points_required} PTS</span>
                    </div>
                  </div>
               ))}
               {promosLoading && <div className="col-span-full py-20 text-center font-black opacity-20 animate-pulse">Loading Promotions...</div>}
               {(!promosLoading && filteredPromos?.length === 0) && (
                 <div className="col-span-full py-24 flex flex-col items-center justify-center gap-8 rounded-[3rem] bg-gradient-to-b from-[#f9f9f9] to-[#f3f3f3] relative overflow-hidden">
                   <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#dce1ff]/60 rounded-full blur-[3rem] pointer-events-none" />
                   <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#daed5b]/30 rounded-full blur-[3rem] pointer-events-none" />
                   
                   <div className="w-24 h-24 bg-white/60 backdrop-blur-xl text-[#18234a] rounded-[2rem] flex items-center justify-center shadow-[0_8px_32px_rgba(24,35,74,0.04)] border border-white/60 relative z-10">
                     <Tag size={48} strokeWidth={1.5} />
                   </div>
                   
                   <div className="text-center relative z-10 space-y-3 px-6">
                     <h4 className="text-[20px] font-medium text-[#020d35]">ยังไม่ได้ตั้งค่าโปรโมชั่น</h4>
                     <p className="text-[16px] text-[#45464E] max-w-lg mx-auto leading-[24px]">
                       เริ่มต้นสร้างโปรโมชั่นเพื่อให้ลูกค้าใช้คะแนนสะสมแลกรับสิทธิพิเศษ
                     </p>
                   </div>
                 </div>
               )}
                </div>
             </section>
          </TabsContent>

          <TabsContent value="coupons" className="m-0">
             <section className="relative overflow-hidden bg-[#F9F9F9]/80 p-10 rounded-[3rem] space-y-8 border border-white">
                <div className="absolute inset-0 pointer-events-none z-0">
                  <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-pink-400/20 blur-[80px]" />
                  <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-rose-400/20 blur-[80px]" />
                </div>
                <div className="flex justify-between items-center relative z-10">
                   <div>
                     <h3 className="text-xl font-black text-[#1A1F3D] mb-1">Coupons</h3>
                     <p className="text-xs text-gray-500 font-medium">สร้างคูปองแทนเงินสดหรือสิทธิพิเศษต่างๆ เพื่อดึงดูดลูกค้า</p>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
               {filteredCoupons?.map((coupon) => {
                 const Icon = getIconComponent(coupon.icon_name);
                 return (
                   <div key={coupon.id} className={cn(
                     "bg-gradient-to-br from-white/90 to-white/40 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/60 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(24,35,74,0.06)] relative overflow-hidden group",
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
                        <div className="flex gap-1 transition-opacity">
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
             </section>
          </TabsContent>


          <TabsContent value="tiers" className="m-0">
            <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm space-y-12">
               <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black text-[#1A1F3D] mb-1">{t.membershipTierLogic}</h3>
                    <p className="text-xs text-gray-400 font-medium">{t.membershipDesc}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-gray-50">
                    {tierSaveStatus === 'saving' && <><Loader2 size={14} className="animate-spin text-indigo-500" /> <span className="text-indigo-500">กำลังบันทึก...</span></>}
                    {tierSaveStatus === 'saved' && <><CheckCircle2 size={14} className="text-green-500" /> <span className="text-green-500">บันทึกอัตโนมัติแล้ว</span></>}
                    {tierSaveStatus === 'idle' && <><CheckCircle2 size={14} className="text-gray-400" /> <span className="text-gray-400">อัปเดตล่าสุด</span></>}
                  </div>
               </div>

               {tiersLoading ? (
                 <div className="py-20 flex flex-col items-center justify-center gap-4">
                   <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                   <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading Tiers...</p>
                 </div>
               ) : (
                 <div className="space-y-6">
                    {localDbTiers.map((tier, idx) => {
                      const IconComponent = getIconComponent(tier.icon_name);

                      return (
                        <div key={tier.id} className="flex flex-col lg:flex-row items-start lg:items-center gap-8 p-8 bg-[#F5F6FA] rounded-[40px] relative overflow-hidden transition-all hover:shadow-md border border-transparent hover:border-gray-200">
                           <div 
                             className={cn("w-16 h-16 rounded-[24px] flex items-center justify-center shadow-sm shrink-0", !tier.color_class?.startsWith('#') ? tier.color_class : '')}
                             style={tier.color_class?.startsWith('#') ? { 
                               backgroundColor: `color-mix(in srgb, ${tier.color_class} 20%, white)`, 
                               color: tier.color_class 
                             } : undefined}
                           >
                              <IconComponent 
                                size={32} 
                                style={{ filter: tier.color_class?.startsWith('#') ? 'drop-shadow(0px 1px 2px rgba(0,0,0,0.1))' : undefined }}
                              />
                           </div>

                           <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block px-2">Tier Name</label>
                                 <input 
                                   className="w-full bg-white border-none rounded-2xl px-5 py-3 text-sm font-bold shadow-sm" 
                                   value={tier.name} 
                                   onChange={e => {
                                     const updated = [...localDbTiers];
                                     updated[idx] = { ...updated[idx], name: e.target.value };
                                     setLocalDbTiers(updated);
                                   }} 
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block px-2">Min. Spent ({currency})</label>
                                 <input 
                                   type="number" 
                                   className="w-full bg-white border-none rounded-2xl px-5 py-3 text-sm font-bold shadow-sm" 
                                   value={tier.min_points} 
                                   onChange={e => {
                                     const updated = [...localDbTiers];
                                     updated[idx] = { ...updated[idx], min_points: Number(e.target.value) };
                                     setLocalDbTiers(updated);
                                   }} 
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block px-2">Description & Benefits</label>
                                 <button
                                   type="button"
                                   onClick={() => handleOpenTierEditModal(tier, idx)}
                                   className="w-full bg-white border-none rounded-2xl px-5 py-3 text-sm font-bold shadow-sm text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                                 >
                                   <span className="truncate text-gray-700">
                                     {tier.description || "คลิกเพื่อแก้ไขคำอธิบายและสิทธิประโยชน์..."}
                                   </span>
                                   <Edit3 size={14} className="text-gray-400 shrink-0 ml-2" />
                                 </button>
                              </div>
                           </div>

                           <div className="flex flex-col sm:flex-row items-end gap-4 w-full lg:w-auto shrink-0 mt-4 sm:mt-0">
                             <div className="space-y-2">
                               <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block px-2">Icon</span>
                               <IconPicker
                                 value={tier.icon_name}
                                 triggerClassName="py-3 px-5 rounded-2xl border-none h-[44px]"
                                 onChange={(iconName) => {
                                   const updated = [...localDbTiers];
                                   updated[idx] = { ...updated[idx], icon_name: iconName };
                                   setLocalDbTiers(updated);
                                 }}
                               />
                             </div>

                             <div className="space-y-2">
                               <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block px-2">Color</span>
                               <Popover>
                                 <PopoverTrigger asChild>
                                   <button className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl border-none shadow-sm text-sm font-bold text-[#1A1F3D] hover:bg-gray-50 transition-colors w-[120px] justify-between h-[44px]">
                                     <div className="flex items-center gap-2">
                                       <div 
                                         className="w-4 h-4 rounded-full border shadow-inner" 
                                         style={{ 
                                           backgroundColor: tier.color_class && tier.color_class.startsWith('#') 
                                             ? tier.color_class 
                                             : (tier.color_class?.includes('blue') ? '#3b82f6' : tier.color_class?.includes('amber') ? '#f59e0b' : tier.color_class?.includes('purple') ? '#a855f7' : tier.color_class?.includes('indigo') ? '#6366f1' : tier.color_class?.includes('rose') ? '#f43f5e' : '#9ca3af')
                                         }} 
                                       />
                                       <span>Color</span>
                                     </div>
                                     <ChevronDown size={14} className="text-gray-400" />
                                   </button>
                                 </PopoverTrigger>
                                 <PopoverContent className="w-auto p-0 border-none shadow-xl rounded-2xl overflow-hidden" align="end">
                                   <CustomColorPicker 
                                     color={tier.color_class && tier.color_class.startsWith('#') ? tier.color_class : '#ffffff'} 
                                     onChange={(hex) => {
                                       const updated = [...localDbTiers];
                                       updated[idx] = { ...updated[idx], color_class: hex };
                                       setLocalDbTiers(updated);
                                     }} 
                                   />
                                 </PopoverContent>
                               </Popover>
                             </div>

                             <div className="space-y-2">
                                <span className="text-[10px] font-black uppercase block px-2 opacity-0 select-none">Delete</span>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <button className="w-[44px] h-[44px] bg-transparent rounded-2xl flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0 border-none group">
                                      <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                                    </button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="rounded-[2rem]">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>{language === 'th' ? 'ยืนยันการลบระดับสมาชิก?' : 'Confirm deletion?'}</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {language === 'th' ? 'ระดับสมาชิกนี้จะถูกลบอย่างถาวร' : 'This tier will be permanently deleted.'}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="rounded-xl">{language === 'th' ? 'ยกเลิก' : 'Cancel'}</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteMutation.mutate({ table: 'membership_tiers', id: tier.id })} className="rounded-xl bg-red-500 hover:bg-red-600 text-white">
                                        {language === 'th' ? 'ลบ' : 'Delete'}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                             </div>
                           </div>
                        </div>
                      );
                    })}
                 </div>
               )}
            </div>
          </TabsContent>

          <TabsContent value="points" className="m-0">
            <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm space-y-10">
               <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black text-[#1A1F3D] mb-1">ตั้งค่าคะแนนสะสม (Points Settings)</h3>
                    <p className="text-xs text-gray-400 font-medium">กำหนดอัตราการได้รับคะแนนสะสมและการแลกคะแนนสะสมของร้านค้า</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-gray-50">
                    {pointsSaveStatus === 'saving' && <><Loader2 size={14} className="animate-spin text-indigo-500" /> <span className="text-indigo-500">กำลังบันทึก...</span></>}
                    {pointsSaveStatus === 'saved' && <><CheckCircle2 size={14} className="text-green-500" /> <span className="text-green-500">บันทึกอัตโนมัติแล้ว</span></>}
                    {pointsSaveStatus === 'idle' && <><CheckCircle2 size={14} className="text-gray-400" /> <span className="text-gray-400">อัปเดตล่าสุด</span></>}
                  </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4 bg-[#F5F6FA] p-8 rounded-[32px] border border-gray-100">
                     <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                           <Plus size={20} />
                        </div>
                        <h4 className="text-sm font-black text-[#1A1F3D]">อัตราการได้รับคะแนน (Earning Rate)</h4>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">จำนวนยอดใช้จ่ายเพื่อรับ 1 คะแนน (บาท)</label>
                        <div className="relative">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">{currency}</span>
                           <input 
                              type="number" 
                              className="w-full bg-white border-none rounded-2xl pl-10 pr-6 py-4 text-sm font-bold shadow-sm" 
                              value={localPointsEarnRate} 
                              onChange={e => setLocalPointsEarnRate(Number(e.target.value))} 
                              placeholder="เช่น 10"
                           />
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium px-2 mt-1">
                           * ตัวอย่าง: หากตั้งค่าเป็น 10 บาท เมื่อลูกค้าใช้จ่ายครบทุกๆ 10 บาท จะได้รับ 1 คะแนนสะสม
                        </p>
                     </div>
                  </div>

                  <div className="space-y-4 bg-[#F5F6FA] p-8 rounded-[32px] border border-gray-100">
                     <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                           <Percent size={20} />
                        </div>
                        <h4 className="text-sm font-black text-[#1A1F3D]">มูลค่าคะแนนสะสม (Redemption Rate)</h4>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">มูลค่าของ 1 คะแนนเมื่อนำมาแลกส่วนลด (บาท)</label>
                        <div className="relative">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">{currency}</span>
                           <input 
                              type="number" 
                              step="0.1"
                              className="w-full bg-white border-none rounded-2xl pl-10 pr-6 py-4 text-sm font-bold shadow-sm" 
                              value={localPointsRedeemRate} 
                              onChange={e => setLocalPointsRedeemRate(Number(e.target.value))} 
                              placeholder="เช่น 1"
                           />
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium px-2 mt-1">
                           * ตัวอย่าง: หากตั้งค่าเป็น 1 บาท เมื่อลูกค้านำคะแนนมาแลกส่วนลด 1 คะแนนจะมีมูลค่าเท่ากับ 1 บาท
                        </p>
                     </div>
                  </div>
               </div>
            </div>
          </TabsContent>

          <TabsContent value="credits" className="m-0">
             <section className="relative overflow-hidden bg-[#F9F9F9]/80 p-10 rounded-[3rem] space-y-8 border border-white">
                <div className="absolute inset-0 pointer-events-none z-0">
                  <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-amber-400/20 blur-[80px]" />
                  <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-orange-400/20 blur-[80px]" />
                </div>
                <div className="flex justify-between items-center relative z-10">
                   <div>
                     <h3 className="text-xl font-black text-[#1A1F3D] mb-1">Credit Packages</h3>
                     <p className="text-xs text-gray-500 font-medium">ตั้งค่าแพ็กเกจเติมเงินล่วงหน้าเพื่อเพิ่มยอดขายและความคุ้มค่าให้ลูกค้า</p>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
               {creditPackages.map((pkg) => (
                 <div key={pkg.id} className={cn(
                   "bg-gradient-to-br from-white/90 to-white/40 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/60 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(24,35,74,0.06)] relative overflow-hidden group",
                   pkg.isActive === false && "opacity-60"
                 )}>
                  <div className="flex justify-between items-start mb-6">
                     <div className="w-14 h-14 rounded-3xl flex items-center justify-center bg-amber-50">
                       <Wallet className="text-amber-600" size={24} />
                     </div>
                     <div className="flex items-center gap-3">
                       <Switch 
                         checked={pkg.isActive !== false} 
                         onCheckedChange={async (val) => {
                           useStore.setState(s => ({
                             creditPackages: s.creditPackages.map(p => p.id === pkg.id ? { ...p, isActive: val } : p)
                           }));
                           const { error } = await supabase.from('credit_packages').update({ is_active: val } as any).eq('id', pkg.id);
                           if (error) {
                             console.error("Toggle error", error);
                           } else {
                             toast.success(language === 'th' ? "อัปเดตสถานะสำเร็จ" : "Status updated successfully");
                           }
                         }}
                         className="data-[state=checked]:bg-green-500"
                       />
                       <div className="flex gap-1 transition-opacity">
                         <button 
                           onClick={() => {
                             setSelectedItem(pkg);
                             setIsCreditModalOpen(true);
                           }} 
                           className="p-2 text-gray-400 hover:text-[#1A1F3D] hover:bg-gray-50 rounded-xl transition-colors"
                         >
                           <Edit3 size={16}/>
                         </button>
                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                             <button className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                               <Trash2 size={16}/>
                             </button>
                           </AlertDialogTrigger>
                           <AlertDialogContent className="rounded-[2rem]">
                             <AlertDialogHeader>
                               <AlertDialogTitle>{language === 'th' ? 'ยืนยันการลบแพ็กเกจเครดิต?' : 'Confirm deletion?'}</AlertDialogTitle>
                               <AlertDialogDescription>
                                 {language === 'th' ? 'แพ็กเกจเครดิตนี้จะถูกลบอย่างถาวร' : 'This credit package will be permanently deleted.'}
                               </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                               <AlertDialogCancel className="rounded-xl">{language === 'th' ? 'ยกเลิก' : 'Cancel'}</AlertDialogCancel>
                               <AlertDialogAction onClick={() => {
                                 deleteCreditPackage(pkg.id);
                                 toast.success(language === 'th' ? "ลบแพ็กเกจเครดิตเรียบร้อย" : "Credit package deleted");
                               }} className="rounded-xl bg-red-500 hover:bg-red-600 text-white">
                                 {language === 'th' ? 'ลบ' : 'Delete'}
                               </AlertDialogAction>
                             </AlertDialogFooter>
                           </AlertDialogContent>
                         </AlertDialog>
                       </div>
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
               {creditPackages.length === 0 && (
                  <div className="col-span-full py-24 flex flex-col items-center justify-center gap-8 rounded-[3rem] bg-gradient-to-b from-[#f9f9f9] to-[#f3f3f3] relative overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#fde68a]/60 rounded-full blur-[3rem] pointer-events-none" />
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#fbbf24]/30 rounded-full blur-[3rem] pointer-events-none" />
                    <div className="w-24 h-24 bg-white/60 backdrop-blur-xl text-[#b45309] rounded-[2rem] flex items-center justify-center shadow-[0_8px_32px_rgba(24,35,74,0.04)] border border-white/60 relative z-10">
                      <Wallet size={48} strokeWidth={1.5} />
                    </div>
                    <div className="text-center relative z-10 space-y-3 px-6">
                      <h4 className="text-[20px] font-medium text-[#78350f]">ยังไม่ได้ตั้งค่าแพ็กเกจเครดิต</h4>
                      <p className="text-[16px] text-[#45464E] max-w-lg mx-auto leading-[24px]">
                        แพ็กเกจเครดิตช่วยกระตุ้นยอดขายล่วงหน้า
                      </p>
                    </div>
                    <button
                      onClick={() => setIsCreditModalOpen(true)}
                      className="relative overflow-hidden group bg-gradient-to-br from-[#b45309] to-[#92400e] text-white px-10 py-4 rounded-[3rem] font-medium text-[16px] shadow-[0_8px_32px_rgba(180,83,9,0.15)] hover:shadow-[0_16px_48px_rgba(180,83,9,0.25)] hover:-translate-y-1 transition-all duration-300 z-10"
                    >
                      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                      <span className="relative z-10 flex items-center gap-2">
                        เพิ่มแพ็กเกจเครดิต
                      </span>
                    </button>
                  </div>
               )}
                </div>
             </section>
          </TabsContent>

          <TabsContent value="bundles" className="m-0">
             <section className="relative overflow-hidden bg-[#F9F9F9]/80 p-10 rounded-[3rem] space-y-8 border border-white">
                <div className="absolute inset-0 pointer-events-none z-0">
                  <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-400/20 blur-[80px]" />
                  <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-violet-400/20 blur-[80px]" />
                </div>
                <div className="flex justify-between items-center relative z-10">
                   <div>
                     <h3 className="text-xl font-black text-[#1A1F3D] mb-1">แพ็กเกจบริการ</h3>
                     <p className="text-xs text-gray-500 font-medium">สร้างและจัดการแพ็กเกจบริการแบบหลายครั้ง (เช่น ซื้อ 5 ครั้ง แถม 1 ครั้ง)</p>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
                   {packageTemplates.map(t => (
                     <div key={t.id} className={cn(
                       "bg-gradient-to-br from-white/90 to-white/40 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/60 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(24,35,74,0.06)] relative overflow-hidden group",
                       t.isActive === false && "opacity-60"
                     )}>
                       <div className="flex justify-between items-start mb-6">
                         <div className="w-14 h-14 rounded-3xl flex items-center justify-center bg-indigo-50">
                           <Package className="text-indigo-600" size={24} />
                         </div>
                         <div className="flex items-center gap-3">
                           <Switch 
                             checked={t.isActive !== false} 
                             onCheckedChange={async (val) => {
                               useStore.setState(s => ({
                                 packageTemplates: s.packageTemplates.map(p => p.id === t.id ? { ...p, isActive: val } : p)
                               }));
                               const { error } = await supabase.from('package_templates').update({ is_active: val } as any).eq('id', t.id);
                               if (error) {
                                 console.error("Toggle error", error);
                               } else {
                                 toast.success(language === 'th' ? "อัปเดตสถานะสำเร็จ" : "Status updated successfully");
                               }
                             }}
                             className="data-[state=checked]:bg-green-500"
                           />
                           <div className="flex gap-1 transition-opacity">
                             <button 
                               onClick={() => {
                                 setSelectedItem(t);
                                 setIsPackageModalOpen(true);
                               }} 
                               className="p-2 text-gray-400 hover:text-[#1A1F3D] hover:bg-gray-50 rounded-xl transition-colors"
                             >
                               <Edit3 size={16}/>
                             </button>
                             <AlertDialog>
                               <AlertDialogTrigger asChild>
                                 <button className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                   <Trash2 size={16}/>
                                 </button>
                               </AlertDialogTrigger>
                               <AlertDialogContent className="rounded-[2rem]">
                                 <AlertDialogHeader>
                                   <AlertDialogTitle>{language === 'th' ? 'ยืนยันการลบเทมเพลตแพ็กเกจบริการ?' : 'Confirm deletion?'}</AlertDialogTitle>
                                   <AlertDialogDescription>
                                     {language === 'th' ? 'เทมเพลตนี้จะถูกลบอย่างถาวร' : 'This template will be permanently deleted.'}
                                   </AlertDialogDescription>
                                 </AlertDialogHeader>
                                 <AlertDialogFooter>
                                   <AlertDialogCancel className="rounded-xl">{language === 'th' ? 'ยกเลิก' : 'Cancel'}</AlertDialogCancel>
                                   <AlertDialogAction onClick={() => {
                                     deletePackageTemplate(t.id);
                                     toast.success(language === 'th' ? "ลบเทมเพลตเรียบร้อย" : "Template deleted");
                                   }} className="rounded-xl bg-red-500 hover:bg-red-600 text-white">
                                     {language === 'th' ? 'ลบ' : 'Delete'}
                                   </AlertDialogAction>
                                 </AlertDialogFooter>
                               </AlertDialogContent>
                             </AlertDialog>
                           </div>
                         </div>
                       </div>
                       
                       <h3 className="text-xl font-black mb-2">{t.name}</h3>
                       <p className="text-xs text-gray-400 mb-6 leading-relaxed line-clamp-2">
                         แพ็กเกจรวม {t.paidSlots + t.freeSlots} ครั้ง (ซื้อ {t.paidSlots} แถม {t.freeSlots})
                       </p>

                       <div className="pt-6 border-t border-gray-50 flex justify-between items-center">
                         <span className="text-[10px] font-black uppercase text-gray-400">ราคาแพ็กเกจ</span>
                         <div className="flex items-center gap-2">
                           {t.bonusType !== 'none' && (
                             <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-full flex items-center gap-1">
                               <Sparkles size={12} /> BONUS
                             </span>
                           )}
                           <span className="text-lg font-black text-[#1A1F3D]">{currency}{t.price.toLocaleString()}</span>
                         </div>
                       </div>
                     </div>
                   ))}
                   {packageTemplates.length === 0 && (
                     <div className="col-span-full py-24 flex flex-col items-center justify-center gap-8 rounded-[3rem] bg-gradient-to-b from-[#f9f9f9] to-[#f3f3f3] relative overflow-hidden">
                       <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#dce1ff]/60 rounded-full blur-[3rem] pointer-events-none" />
                       <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#daed5b]/30 rounded-full blur-[3rem] pointer-events-none" />
                       <div className="w-24 h-24 bg-white/60 backdrop-blur-xl text-[#18234a] rounded-[2rem] flex items-center justify-center shadow-[0_8px_32px_rgba(24,35,74,0.04)] border border-white/60 relative z-10">
                         <Package size={48} strokeWidth={1.5} />
                       </div>
                       <div className="text-center relative z-10 space-y-3 px-6">
                         <h4 className="text-[20px] font-medium text-[#020d35]">ยังไม่ได้ตั้งค่าแพ็คเกจบริการ</h4>
                         <p className="text-[16px] text-[#45464E] max-w-lg mx-auto leading-[24px]">
                           ขายบริการเป็นคอร์สหรือแพ็คเกจเพื่อกระตุ้นให้ลูกค้ากลับมาใช้บริการต่อเนื่อง (เช่น ซื้อ 10 ฟรี 2)
                         </p>
                       </div>
                       <button
                         onClick={() => setIsPackageModalOpen(true)}
                         className="relative overflow-hidden group bg-gradient-to-br from-[#18234a] to-[#020d35] text-white px-10 py-4 rounded-[3rem] font-medium text-[16px] shadow-[0_8px_32px_rgba(24,35,74,0.15)] hover:shadow-[0_16px_48px_rgba(24,35,74,0.25)] hover:-translate-y-1 transition-all duration-300 z-10"
                       >
                         <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                         <span className="relative z-10 flex items-center gap-2">
                           เพิ่มแพ็กเกจบริการ
                         </span>
                       </button>
                     </div>
                   )}
                </div>
             </section>
          </TabsContent>
        </Tabs>
      </div>

      {isCouponModalOpen && <CouponModal coupon={selectedItem} onClose={() => setIsCouponModalOpen(false)} />}
      {isPromoModalOpen && <PromotionModal promotion={selectedItem} onClose={() => setIsPromoModalOpen(false)} />}
      {isCreditModalOpen && <CreditPackageModal onClose={() => setIsCreditModalOpen(false)} />}
      {isPackageModalOpen && <PackageModal onClose={() => setIsPackageModalOpen(false)} />}
      
      {isTierEditModalOpen && selectedTierForEdit && (
        <TierEditModal 
          tier={selectedTierForEdit} 
          onClose={() => {
            setIsTierEditModalOpen(false);
            setSelectedTierForEdit(null);
          }} 
          onSave={handleSaveTierText}
        />
      )}
    </div>
  );
};

export default Marketing;