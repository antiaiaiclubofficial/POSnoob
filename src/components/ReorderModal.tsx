import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Package, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { InventoryItem, useStore, DraftPR } from '@/store/useStore';
import { toast } from 'sonner';

interface ReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
}

const ReorderModal: React.FC<ReorderModalProps> = ({ isOpen, onClose, item }) => {
  const { prCart, addToPrCart, updatePrCart } = useStore();
  const [quantity, setQuantity] = useState<string>('');
  
  const [showMergeConfirm, setShowMergeConfirm] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<{ existingDraft: DraftPR, newPrItem: any, partnerId: string } | null>(null);

  React.useEffect(() => {
    if (isOpen && item) {
      const minQty = Math.max(item.minStock - item.stock, 1);
      setQuantity(minQty.toString());
      setShowMergeConfirm(false);
      setPendingDraft(null);
    } else {
      setQuantity('');
    }
  }, [isOpen, item]);



  const handleConfirm = () => {
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error('กรุณาระบุจำนวนที่ถูกต้อง');
      return;
    }

    const partnerId = item!.partnerId || '';
    const newPrItem = {
      productId: item!.id,
      productName: item!.name,
      quantity: qty,
      unitPrice: item!.costPrice || 0,
      total: qty * (item!.costPrice || 0),
    };

    // Find if there is already a Draft PR for this vendor
    const existingDraft = prCart.find(draft => draft.partnerId === partnerId);
    
    // Also check if there's an active drafting session of a DIFFERENT vendor
    const lastDraft = prCart[prCart.length - 1];
    if (lastDraft && lastDraft.partnerId !== partnerId) {
      toast.warning('สินค้าคนละ Vendor ระบบได้สร้าง Draft PR แยกให้อัตโนมัติ');
    }

    if (existingDraft) {
      // Show custom modal instead of window.confirm
      setPendingDraft({ existingDraft, newPrItem, partnerId });
      setShowMergeConfirm(true);
      return;
    }

    proceedCreateNewDraft(partnerId, newPrItem);
  };
  
  const proceedCreateNewDraft = (partnerId: string, newPrItem: any) => {
    const newDraft: DraftPR = {
      id: `draft-${Date.now()}`,
      partnerId,
      items: [newPrItem],
    };
    addToPrCart(newDraft);
    toast.success('สร้าง Draft PR ใหม่ในตะกร้าเรียบร้อยแล้ว');
    setShowMergeConfirm(false);
    onClose();
  };

  const proceedMergeDraft = () => {
    if (!pendingDraft) return;
    const { existingDraft, newPrItem } = pendingDraft;
    const updatedDraft = {
      ...existingDraft,
      items: [...existingDraft.items, newPrItem]
    };
    updatePrCart(existingDraft.id, updatedDraft);
    toast.success('เพิ่มลงตะกร้า PR ใบเดิมเรียบร้อยแล้ว');
    setShowMergeConfirm(false);
    onClose();
  };

  return typeof document !== 'undefined' ? createPortal(
    <>
      <AnimatePresence>
        {isOpen && item && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
          >
            <div className="p-6 bg-[#1A1F3D] text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <h2 className="text-xl font-black">ระบุจำนวนที่ต้องการสั่ง (Reorder)</h2>
                <p className="text-xs text-blue-200 mt-1 uppercase tracking-widest font-bold">Purchase Request</p>
              </div>
              <button
                onClick={onClose}
                className="relative z-10 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-8 space-y-6 flex-1 overflow-y-auto">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-gray-400 shrink-0">
                  {item.image ? <img src={item.image} className="w-full h-full object-cover rounded-xl" /> : <Package size={24} />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-[#1A1F3D]">{item.name}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">Stock: {item.stock}</span>
                    <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase">Min: {item.minStock}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">จำนวนสั่งซื้อ (Quantity)</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-xl font-black text-[#1A1F3D] shadow-inner text-center"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleConfirm();
                    }
                  }}
                />
                <div className="flex items-center gap-2 text-[10px] text-gray-500 justify-center mt-2 font-bold">
                  <AlertCircle size={12} /> ระบบคำนวณขั้นต่ำให้จากสต็อกที่ขาดหายไป
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50/80 border-t border-gray-100 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-4 rounded-2xl font-black text-[13px] text-gray-500 hover:bg-gray-200 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-6 py-4 rounded-2xl font-black text-[13px] bg-[#1A1F3D] text-white hover:bg-[#2A3152] transition-colors shadow-lg"
              >
                เพิ่มลงตะกร้า PR
              </button>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMergeConfirm && pendingDraft && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col"
            >
              <div className="p-6 bg-[#1A1F3D] text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                  <h2 className="text-xl font-black">พบ PR ของ Vendor นี้</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-600 font-medium">
                  มี PR ของ Vendor นี้อยู่ในตะกร้าแล้ว ต้องการเพิ่มสินค้านี้ลงใน PR ใบเดิมหรือไม่?
                </p>
                <div className="p-4 bg-amber-50 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                  <p className="text-xs font-bold text-amber-700">
                    หากเลือก "สร้างใบใหม่" ระบบจะแยก Draft PR เป็นใบใหม่ให้
                  </p>
                </div>
              </div>
              <div className="p-4 bg-gray-50/80 border-t border-gray-100 flex flex-col gap-2">
                <button
                  onClick={proceedMergeDraft}
                  className="w-full px-6 py-3.5 rounded-2xl font-black text-[13px] bg-[#1A1F3D] text-white hover:bg-[#2A3152] transition-colors shadow-lg"
                >
                  เพิ่มลง PR ใบเดิม
                </button>
                <button
                  onClick={() => proceedCreateNewDraft(pendingDraft.partnerId, pendingDraft.newPrItem)}
                  className="w-full px-6 py-3.5 rounded-2xl font-black text-[13px] bg-white border border-gray-200 text-[#1A1F3D] hover:bg-gray-50 transition-colors"
                >
                  สร้าง Draft PR ใบใหม่
                </button>
                <button
                  onClick={() => setShowMergeConfirm(false)}
                  className="w-full px-6 py-3 rounded-2xl font-black text-[13px] text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors mt-2"
                >
                  ยกเลิก
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body
  ) : null;
};

export default ReorderModal;
