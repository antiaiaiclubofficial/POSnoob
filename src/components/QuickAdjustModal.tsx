"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, Package, RotateCcw } from 'lucide-react';
import { InventoryItem } from '@/store/useStore';
import { toast } from 'sonner';

interface QuickAdjustModalProps {
  item: InventoryItem | null;
  onClose: () => void;
  onSave: (qty: number, reason: string) => void;
}

const QuickAdjustModal = ({ item, onClose, onSave }: QuickAdjustModalProps) => {
  const [newQty, setNewQty] = useState<string>('');
  const [reason, setReason] = useState<string>('Physical Audit');

  useEffect(() => {
    if (item) {
      setNewQty(item.stock.toString());
    }
  }, [item]);

  if (!item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(newQty);
    if (isNaN(qty) || newQty.trim() === '') {
      toast.error("กรุณาระบุจำนวนสต็อกที่ถูกต้อง");
      return;
    }
    onSave(qty, reason || 'Physical Audit');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[250] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1A1F3D] rounded-2xl flex items-center justify-center text-[#D9ED5F]">
              <RotateCcw size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1A1F3D]">ปรับยอดสต็อกด่วน</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Quick Stock Adjustment</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="p-5 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm shrink-0">
              <Package size={24} />
            </div>
            <div>
              <p className="text-xs font-black text-[#1A1F3D]">{item.name}</p>
              <p className="text-[10px] text-blue-600 font-black uppercase">สต็อกปัจจุบัน: {item.stock} {item.unit}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 px-2">จำนวนสต็อกใหม่ที่ถูกต้อง</label>
              <input 
                type="number"
                autoFocus
                className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-xl font-black text-center focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all"
                value={newQty}
                onChange={e => setNewQty(e.target.value)}
                placeholder="0"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 px-2">เหตุผลในการปรับยอด</label>
              <input 
                className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="เช่น ตรวจนับสต็อกประจำเดือน, สินค้าชำรุด"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl text-xs font-black text-gray-400 hover:bg-gray-50 transition-all"
            >
              ยกเลิก
            </button>
            <button 
              type="submit"
              className="flex-[2] bg-[#1A1F3D] text-white font-black py-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#1A1F3D]/10 active:scale-95 transition-all"
            >
              <Save size={16} /> บันทึกการปรับยอด
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickAdjustModal;