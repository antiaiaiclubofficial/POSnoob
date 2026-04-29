"use client";

import React, { useState } from 'react';
import { Plus, Tag, Edit3, Trash2, Search, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { translations } from '@/utils/translations';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Switch } from "@/components/ui/switch";

const Promotions = () => {
  const queryClient = useQueryClient();
  const { language } = useStore();
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState('');

  const { data: promotions, isLoading } = useQuery({
    queryKey: ['deal_templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('deal_templates').select('*');
      if (error) throw error;
      return data;
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string, is_active: boolean }) => {
      const { error } = await supabase.from('deal_templates').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal_templates'] });
      toast.success("Status updated");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('deal_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal_templates'] });
      toast.success("Promotion deleted");
    }
  });

  const filtered = promotions?.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <div className="p-10">Loading...</div>;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8F9FD]">
      <header className="px-10 py-10 shrink-0 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black mb-1">{t.promotions}</h1>
          <p className="text-gray-400 font-medium">{t.activePromos}</p>
        </div>
        <button className="bg-[#1A1F3D] text-white px-6 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-[#1A1F3D]/10">
          <Plus size={20} /> {t.createPromo}
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
          {filtered?.map((promo) => (
            <div key={promo.id} className={cn(
              "bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm transition-all hover:shadow-xl",
              !promo.is_active && "opacity-60"
            )}>
              <div className="flex justify-between items-start mb-6">
                <div className={cn("w-14 h-14 rounded-3xl flex items-center justify-center", promo.bg_color || "bg-blue-50")}>
                  <Tag className="text-blue-600" size={24} />
                </div>
                <div className="flex gap-2">
                  <Switch 
                    checked={promo.is_active} 
                    onCheckedChange={(val) => toggleMutation.mutate({ id: promo.id, is_active: val })}
                  />
                  <button onClick={() => deleteMutation.mutate(promo.id)} className="p-2 text-gray-300 hover:text-red-500 rounded-xl transition-all"><Trash2 size={16}/></button>
                </div>
              </div>
              <h3 className="text-xl font-black mb-2">{promo.title}</h3>
              <p className="text-xs text-gray-400 mb-6 leading-relaxed line-clamp-2">{promo.description}</p>
              <div className="pt-6 border-t border-gray-50 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-gray-400">{t.pointsRequired}</span>
                <span className="text-lg font-black text-[#1A1F3D]">{promo.points_required} PTS</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Promotions;