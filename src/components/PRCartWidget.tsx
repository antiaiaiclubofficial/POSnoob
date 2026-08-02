import React, { useState } from 'react';
import { ShoppingCart, X, ChevronRight, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { useNavigate } from 'react-router-dom';

const PRCartWidget = () => {
  const { prCart, removeFromPrCart, partners, addPurchaseRequest, clearPrCart } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const totalItems = prCart.reduce((sum, draft) => sum + draft.items.length, 0);

  const handleProceed = () => {
    // Convert drafts to real PurchaseRequests
    prCart.forEach(draft => {
      const totalAmount = draft.items.reduce((sum, item) => sum + item.total, 0);
      addPurchaseRequest({
        date: new Date().toISOString(),
        partnerId: draft.partnerId,
        items: draft.items,
        status: 'Pending',
        totalAmount,
        createdBy: 'Admin', // In real app, get from currentUser
      });
    });

    clearPrCart();
    setIsOpen(false);
    navigate('/sales-procurement', { state: { action: 'pr-list' } });
  };

  return (
    <motion.div layout className="relative flex items-center h-[52px]">
      {/* Button */}
      <AnimatePresence>
        {prCart.length > 0 && !isOpen && (
          <motion.button
            layout
            initial={{ opacity: 0, scale: 0.8, x: 20, width: 0 }}
            animate={{ opacity: 1, scale: 1, x: 0, width: 'auto' }}
            exit={{ opacity: 0, scale: 0.8, x: 20, width: 0 }}
            onClick={() => setIsOpen(true)}
            className="h-full bg-[#1A1F3D] text-white px-6 rounded-[28px] shadow-sm flex items-center justify-center gap-3 hover:bg-[#2A3152] transition-colors group shrink-0 overflow-hidden whitespace-nowrap"
          >
            <div className="relative shrink-0">
              <ShoppingCart size={18} />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-[#1A1F3D] group-hover:border-[#2A3152]">
                {totalItems}
              </span>
            </div>
            <span className="font-black text-xs pr-1">PR ตะกร้า ({prCart.length} ใบ)</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cart Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.85 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="origin-top-right absolute top-[calc(100%+16px)] right-0 z-[95] bg-white rounded-3xl shadow-2xl w-[360px] max-w-[90vw] border border-gray-100 overflow-hidden flex flex-col max-h-[70vh]"
          >
            <div className="p-5 bg-[#1A1F3D] text-white flex justify-between items-center relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <ShoppingCart size={20} />
                </div>
                <div>
                  <h3 className="font-black text-lg">ตะกร้าขอซื้อ (PR)</h3>
                  <p className="text-[10px] text-blue-200 uppercase tracking-widest font-bold">
                    {prCart.length} ใบ • {totalItems} รายการ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="relative z-10 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {prCart.map((draft, idx) => {
                const partnerName = partners.find(p => p.id === draft.partnerId)?.companyName || 'ไม่มีข้อมูลคู่ค้า / ขายเอง';
                return (
                  <div key={draft.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-[10px] font-black uppercase text-gray-400">PR ใบที่ {idx + 1}</p>
                        <p className="text-sm font-black text-[#1A1F3D] line-clamp-1">{partnerName}</p>
                      </div>
                      <button 
                        onClick={() => removeFromPrCart(draft.id)}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {draft.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-600 line-clamp-1 flex-1 pr-2">- {item.productName}</span>
                          <span className="font-black text-[#1A1F3D] shrink-0">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-white border-t border-gray-100 shrink-0">
              <button
                onClick={handleProceed}
                className="w-full bg-[#1A1F3D] text-white py-4 rounded-2xl font-black text-[13px] shadow-lg hover:bg-[#2A3152] transition-colors flex items-center justify-center gap-2"
              >
                ดำเนินการสร้าง PR ทั้งหมด <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PRCartWidget;
