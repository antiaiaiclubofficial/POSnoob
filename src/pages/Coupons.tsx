"use client";

import React, { useState } from 'react';
import { Plus, Ticket, Edit3, Trash2, Search, Clock, Gift, Star, Award, Zap, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { translations } from '@/utils/translations';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Switch } from "@/components/ui/switch";
import CouponModal from '@/components/CouponModal';

const Coupons = () => {
  const queryClient = useQueryClient();
  const { language } = useStore();
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['coupon_templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('coupon_templates').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string, is_active: boolean }) => {
      const { error } = await supabase
        .from('coupon_templates')
        .update({ is_active: is_active }) // ตรวจสอบชื่อ column ใน DB
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupon_templates'] });
      toast.success("Status updated");
    },
    onError: (error) => {
      toast.error("Failed to update status");
      console.error(error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('coupon_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupon_templates'] });
      toast.success("Coupon deleted");
    }
  });

  const getIcon = (name: string) => {
    switch (name) {
      case 'Gift': return Gift;
      case 'Star': return Star;
      case 'Award': return Award;
      case 'Zap': return Zap;
      case 'Heart': return Heart;
      default: return Ticket;
    }
  };

  const handleEdit = (coupon: any) => {
    setSelectedCoupon(coupon);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedCoupon(null);
    setIsModalOpen(true);
  };

  const filtered = coupons?.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <div className="p-10 text-center font-black opacity-20">Loading Coupons...</div>;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8F9FD]">
      <header className="px-10 py-10 shrink-0 flex justify-between items-end">
        <div className="pl-14 lg:pl-0">
          <h1 className="text-4xl font-black mb-1">{t.coupons}</h1>
          <p className="text-gray-400 font-medium">{t.couponTemplates}</p>
        </div>
        <button 
          onClick={handleAdd}
          className="bg-[#1A1F3D] text-white px-6 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-[#1A1F3D]/10 active:scale-95 transition-all"
        >
          <Plus size={20} /> {t.createCoupon}
        </button>
      </header>

      <div className="px-10 mb-8">
         <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold shadow-sm"
              placeholder={t.search}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
         </div>
      </div>

      <div className="flex-1 overflow-y-auto px-10 pb-10 scrollbar-hide">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered?.map((coupon) => {
            const Icon = getIcon(coupon.icon_name);
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
                      onCheckedChange={(val) => toggleMutation.mutate({ id: coupon.id, is_active: val })}
                      className="data-[state=checked]:bg-green-500"
                    />
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(coupon)} className="p-2 text-gray-400 hover:text-[#1A1F3D] rounded-xl"><Edit3 size={16}/></button>
                      <button onClick={() => deleteMutation.mutate(coupon.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-xl"><Trash2 size={16}/></button>
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

          {filtered?.length === 0 && (
            <div className="col-span-full py-20 text-center opacity-20 flex flex-col items-center">
              <Ticket size={48} className="mb-4" />
              <p className="font-black">No coupons found.</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <CouponModal 
          coupon={selectedCoupon} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default Coupons;