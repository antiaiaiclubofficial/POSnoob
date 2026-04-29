"use client";

import React, { useState } from 'react';
import { Plus, Tag, Ticket, Edit3, Trash2, Search, Clock, Gift, Star, Award, Zap, Heart, Megaphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { translations } from '@/utils/translations';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CouponModal from '@/components/CouponModal';
import PromotionModal from '@/components/PromotionModal';

const Marketing = () => {
  const queryClient = useQueryClient();
  const { language } = useStore();
  const t = translations[language];
  
  const [activeTab, setActiveTab] = useState('promotions');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Fetch Promotions
  const { data: promotions, isLoading: promosLoading } = useQuery({
    queryKey: ['deal_templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('deal_templates').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Fetch Coupons
  const { data: coupons, isLoading: couponsLoading } = useQuery({
    queryKey: ['coupon_templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('coupon_templates').select('*').order('created_at', { ascending: false });
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
      // Refresh the specific table data
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
    else setIsCouponModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedItem(null);
    if (activeTab === 'promotions') setIsPromoModalOpen(true);
    else setIsCouponModalOpen(true);
  };

  const filteredPromos = promotions?.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredCoupons = coupons?.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));

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
        <button 
          onClick={handleAdd}
          className="bg-[#1A1F3D] text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-[#1A1F3D]/10 active:scale-95 transition-all"
        >
          <Plus size={20} /> {activeTab === 'promotions' ? t.createPromo : t.createCoupon}
        </button>
      </header>

      <div className="px-6 lg:px-12 mb-8 flex flex-col lg:flex-row justify-between items-center gap-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full lg:w-auto">
          <TabsList className="bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm flex gap-1 h-auto">
            <TabsTrigger value="promotions" className="flex-1 lg:px-8 py-3 rounded-xl data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white text-xs font-bold transition-all">
              <Tag size={16} className="mr-2" /> {t.promotions}
            </TabsTrigger>
            <TabsTrigger value="coupons" className="flex-1 lg:px-8 py-3 rounded-xl data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white text-xs font-bold transition-all">
              <Ticket size={16} className="mr-2" /> {t.coupons}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full lg:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
          <input 
            className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold shadow-sm"
            placeholder={t.search}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
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
        </Tabs>
      </div>

      {isCouponModalOpen && <CouponModal coupon={selectedItem} onClose={() => setIsCouponModalOpen(false)} />}
      {isPromoModalOpen && <PromotionModal promotion={selectedItem} onClose={() => setIsPromoModalOpen(false)} />}
    </div>
  );
};

export default Marketing;