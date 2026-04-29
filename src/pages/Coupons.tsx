"use client";

import React, { useState } from 'react';
import { Plus, Ticket, Edit3, Trash2, Search, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { translations } from '@/utils/translations';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Switch } from "@/components/ui/switch";

const Coupons = () => {
  const queryClient = useQueryClient();
  const { language } = useStore();
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState('');

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['coupon_templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('coupon_templates').select('*');
      if (error) throw error;
      return data;
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string, is_active: boolean }) => {
      const { error } = await supabase.from('coupon_templates').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupon_templates'] });
      toast.success("Status updated");
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

  const filtered = coupons?.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <div className="p-10">Loading...</div>;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8F9FD]">
      <header className="px-10 py-10 shrink-0 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black mb-1">{t.coupons}</h1>
          <p className="text-gray-400 font-medium">{t.couponTemplates}</p>
        </div>
        <button className="bg-[#1A1F3D] text-white px-6 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-[#1A1F3D]/10">
          <Plus size={20} /> {t.createCoupon}
        </button>
      </header>

      <div className="px-10 mb-8">
         <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
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
          {filtered?.map((coupon) => (
            <div key={coupon.id} className={cn(
              "bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm transition-all hover:shadow-xl",
              !coupon.is_active && "opacity-60"
            )}>
              <div className="flex justify-between items-start mb-6">
                <div className={cn("w-14 h-14 rounded-3xl flex items-center justify-center", coupon.bg_color || "bg-pink-50")}>
                  <Ticket className="text-pink-600" size={24} />
                </div>
                <div className="flex gap-2">
                  <Switch 
                    checked={coupon.is_active} 
                    onCheckedChange={(val) => toggleMutation.mutate({ id: coupon.id, is_active: val })}
                  />
                  <button onClick={() => deleteMutation.mutate(coupon.id)} className="p-2 text-gray-300 hover:text-red-500 rounded-xl transition-all"><Trash2 size={16}/></button>
                </div>
              </div>
              <h3 className="text-xl font-black mb-2">{coupon.title}</h3>
              <p className="text-xs text-gray-400 mb-6 leading-relaxed line-clamp-2">{coupon.description}</p>
              
              <div className="space-y-4 pt-6 border-t border-gray-50">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-gray-400">{t.pointsRequired}</span>
                  <span className="text-lg font-black text-[#1A1F3D]">{coupon.points_required} PTS</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Clock size={12} />
                    <span className="text-[10px] font-black uppercase">{t.expiryDays}</span>
                  </div>
                  <span className="text-xs font-bold text-[#1A1F3D]">{coupon.expiry_days} Days</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Coupons;