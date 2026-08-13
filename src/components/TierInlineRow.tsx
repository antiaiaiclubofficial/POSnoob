"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Gift, Edit3, Trash2, CheckCircle2, Loader2, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IconPicker, getIconComponent } from '@/components/ui/IconPicker';
import { CustomColorPicker } from '@/components/hotel/HotelSettingsTab';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
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
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TierInlineRowProps {
  tier: any;
  currency: string;
  onEdit: () => void;
  onDelete: () => void;
}

const TierInlineRow = ({ tier, currency, onEdit, onDelete }: TierInlineRowProps) => {
  const queryClient = useQueryClient();
  const { language } = useStore();
  
  // Local state for inline editing to prevent cursor jumping
  const [localData, setLocalData] = useState({
    name: tier.name || '',
    min_points: tier.min_points || 0,
    color_class: tier.color_class || '#f59e0b',
    icon_name: tier.icon_name || 'Crown'
  });
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  // Sync with prop when it changes (but only if we aren't currently editing, or if it's identical to avoid unnecessary updates)
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Update local state if tier prop changes externally (e.g. from modal edit)
  useEffect(() => {
    // Only update if it actually differs to prevent resetting while typing
    if (
      (tier.name !== localData.name || tier.min_points !== localData.min_points || tier.color_class !== localData.color_class || tier.icon_name !== localData.icon_name) && 
      saveStatus === 'idle'
    ) {
      setLocalData({
        name: tier.name || '',
        min_points: tier.min_points || 0,
        color_class: tier.color_class || '#f59e0b',
        icon_name: tier.icon_name || 'Crown'
      });
    }
  }, [tier, localData.name, localData.min_points, localData.color_class, localData.icon_name, saveStatus]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('membership_tiers')
        .update({
          name: data.name,
          min_points: Number(data.min_points),
          color_class: data.color_class,
          icon_name: data.icon_name
        })
        .eq('id', tier.id);
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate silently in the background
      queryClient.invalidateQueries({ queryKey: ['membership_tiers_marketing'] });
      queryClient.invalidateQueries({ queryKey: ['membership_tiers'] });
      
      if (isMounted.current) {
        setSaveStatus('saved');
        setTimeout(() => {
          if (isMounted.current) setSaveStatus('idle');
        }, 2000);
      }
    },
    onError: (error) => {
      console.error("Auto-save error:", error);
      toast.error(language === 'th' ? "บันทึกข้อมูลไม่สำเร็จ" : "Failed to save data");
      if (isMounted.current) setSaveStatus('idle');
    }
  });

  const handleChange = (field: string, value: any) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
    setSaveStatus('saving');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      // Create fresh snapshot for saving by referencing the latest local state
      setLocalData(current => {
        updateMutation.mutate(current);
        return current;
      });
    }, 1000); // 1 second debounce
  };

  const IconComponent = getIconComponent(localData.icon_name);
  const color = localData.color_class && localData.color_class.startsWith('#') 
    ? localData.color_class 
    : (localData.color_class?.includes('blue') ? '#3b82f6' : localData.color_class?.includes('amber') ? '#f59e0b' : localData.color_class?.includes('purple') ? '#a855f7' : localData.color_class?.includes('indigo') ? '#6366f1' : localData.color_class?.includes('rose') ? '#f43f5e' : '#9ca3af');

  const benefitCount = (() => {
    if (Array.isArray(tier.benefits)) return tier.benefits.length;
    if (typeof tier.benefits === 'string') {
      try {
        const parsed = JSON.parse(tier.benefits || '[]');
        if (Array.isArray(parsed)) return parsed.length;
      } catch (e) {}
    }
    return 0;
  })();

  return (
    <div className="grid grid-cols-12 gap-4 items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-50 transition-all hover:shadow-md hover:border-gray-100 group">
      <div className="col-span-1 flex flex-col items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <button 
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
              style={{ backgroundColor: `color-mix(in srgb, ${color} 20%, white)`, color: color }}
            >
              <IconComponent size={18} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3 rounded-2xl z-[100]" align="start">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400">เปลี่ยนไอคอน</label>
                <IconPicker 
                  value={localData.icon_name} 
                  onChange={(val) => handleChange('icon_name', val)} 
                  triggerClassName="w-full bg-gray-50 border-none shadow-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400">เปลี่ยนสี</label>
                <CustomColorPicker 
                  color={color} 
                  onChange={(hex) => handleChange('color_class', hex)} 
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="col-span-4 flex items-center gap-3">
        <input 
          type="text"
          value={localData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className="font-bold text-[#1A1F3D] bg-gray-50/80 border border-gray-100/80 px-4 py-2 rounded-full hover:bg-gray-100 focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50 outline-none w-full transition-all"
          style={{ color: color }}
          placeholder="ชื่อระดับสมาชิก"
        />
        <div className="text-[10px] font-medium text-gray-400 flex items-center gap-1 shrink-0">
          <Gift size={10} />
          {benefitCount} สิทธิประโยชน์
        </div>
      </div>

      <div className="col-span-2 flex items-center gap-2">
        <input 
          type="number"
          value={localData.min_points}
          onChange={(e) => handleChange('min_points', e.target.value)}
          className="font-bold text-[#1A1F3D] text-center bg-gray-50/80 border border-gray-100/80 px-4 py-2 rounded-full hover:bg-gray-100 focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50 outline-none w-full transition-all"
          placeholder="0"
        />
        <span className="font-black text-gray-400 text-xs uppercase tracking-widest shrink-0">{currency}</span>
      </div>

      <div className="col-span-4 pl-4 border-l border-gray-100 flex items-center justify-between">
        <p className="text-xs text-gray-500 line-clamp-1">{tier.description || "-"}</p>
        
        {/* Save Status Indicator */}
        <div className="flex items-center gap-1 min-w-[60px] justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          {saveStatus === 'saving' && <Loader2 size={12} className="animate-spin text-indigo-500" />}
          {saveStatus === 'saved' && <CheckCircle2 size={12} className="text-green-500" />}
        </div>
      </div>

      <div className="col-span-1 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-2 text-gray-400 hover:text-[#1A1F3D] hover:bg-gray-50 rounded-xl transition-colors">
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
              <AlertDialogTitle>{language === 'th' ? 'ยืนยันการลบระดับสมาชิก?' : 'Confirm deletion?'}</AlertDialogTitle>
              <AlertDialogDescription>
                {language === 'th' ? 'ระดับสมาชิกนี้จะถูกลบอย่างถาวร' : 'This tier will be permanently deleted.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">{language === 'th' ? 'ยกเลิก' : 'Cancel'}</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="rounded-xl bg-red-500 hover:bg-red-600 text-white">
                {language === 'th' ? 'ลบ' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default TierInlineRow;
