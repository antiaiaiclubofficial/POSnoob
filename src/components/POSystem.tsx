import React, { useState, useEffect } from 'react';
import { useStore, PurchaseOrder, PurchaseOrderItem, InventoryItem } from '@/store/useStore';
import { format } from 'date-fns';
import { Plus, Search, FileText, CheckCircle, XCircle, Clock, Trash2, Save, X, Download, Printer, Edit, Truck, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, VerticalAlign } from 'docx';
import { formatBahtText } from '@/lib/bahttext';
import { toast } from 'sonner';
import { POPreviewModal } from './POPreviewModal';

interface POSystemProps {
  reorderItem?: InventoryItem | null;
  clearReorderItem?: () => void;
  initialView?: 'list' | 'create';
  onViewChange?: (view: 'list' | 'create') => void;
}

const POSystem: React.FC<POSystemProps> = ({ reorderItem, clearReorderItem, initialView = 'list', onViewChange }) => {
  const {
    purchaseOrders, partners, inventory, currentUser, addPurchaseOrder, updatePurchaseOrder, updatePurchaseOrderStatus,
    companyName, companyAddress, companyTaxId, companyPhone, companyEmail, shopName, shopAddress, shopPhone
  } = useStore();
  const [view, setView] = useState<'list' | 'create'>(initialView);

  React.useEffect(() => {
    if (!reorderItem) {
      setView(initialView);
    }
  }, [initialView, reorderItem]);

  const handleViewChange = (newView: 'list' | 'create') => {
    setView(newView);
    if (onViewChange) onViewChange(newView);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [previewPO, setPreviewPO] = useState<PurchaseOrder | null>(null);

  // Create PO State
  const [editingPOId, setEditingPOId] = useState<string | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [manualVendorName, setManualVendorName] = useState('');
  const [poItems, setPoItems] = useState<PurchaseOrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [manualItemName, setManualItemName] = useState('');
  const [qtyInput, setQtyInput] = useState('');
  const [priceInput, setPriceInput] = useState('');
  
  const [vendorInputMode, setVendorInputMode] = useState<'system' | 'manual'>('system');
  const [itemInputMode, setItemInputMode] = useState<'system' | 'manual'>('system');
  const [duplicateItemConfirm, setDuplicateItemConfirm] = useState<{ productId: string, productName: string, qty: number, price: number } | null>(null);

  useEffect(() => {
    if (reorderItem) {
      handleViewChange('create');
      const qty = Math.max(reorderItem.minStock - reorderItem.stock, 1);
      setPoItems([{
        productId: reorderItem.id,
        productName: reorderItem.name,
        quantity: qty,
        unitPrice: reorderItem.costPrice || 0,
        total: qty * (reorderItem.costPrice || 0)
      }]);
      if (reorderItem.partnerId) {
        setSelectedPartnerId(reorderItem.partnerId);
      }
      if (clearReorderItem) clearReorderItem();
    }
  }, [reorderItem, clearReorderItem]);

  const totalPOs = purchaseOrders.length;
  const pendingPOs = purchaseOrders.filter(po => po.status === 'Pending').length;
  const toOrderPOs = purchaseOrders.filter(po => po.status === 'To Order').length;
  const completedPOs = purchaseOrders.filter(po => po.status === 'Completed').length;
  const cancelledPOs = purchaseOrders.filter(po => po.status === 'Cancelled').length;

  const filteredPOs = purchaseOrders
    .filter(po => {
      if (statusFilter && po.status !== statusFilter) return false;
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        return po.id.toLowerCase().includes(search) || 
               partners.find(p => p.id === po.partnerId)?.companyName.toLowerCase().includes(search);
      }
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-50 text-green-600';
      case 'On Order': return 'bg-blue-50 text-blue-600'; // Legacy
      case 'To Order': return 'bg-purple-50 text-purple-600';
      case 'Cancelled': return 'bg-red-50 text-red-600';
      default: return 'bg-orange-50 text-orange-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle size={14} />;
      case 'On Order': return <Truck size={14} />; // Legacy
      case 'To Order': return <Check size={14} />;
      case 'Cancelled': return <XCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const handleAddItem = () => {
    if (!qtyInput || !priceInput) return;
    
    let productId = '';
    let productName = '';
    
    if (itemInputMode === 'manual') {
      if (!manualItemName.trim()) {
         toast.error('กรุณาระบุชื่อสินค้า');
         return;
      }
      productId = `MANUAL_${Date.now()}`;
      productName = manualItemName;
    } else {
      if (!selectedProductId) return;
      const product = inventory.find(i => i.id === selectedProductId);
      if (!product) return;
      productId = product.id;
      productName = product.name;
    }

    const qty = parseInt(qtyInput);
    const price = parseFloat(priceInput);

    if (qty <= 0 || price < 0) return;

    const existingItem = poItems.find(i => i.productId === productId);
    if (existingItem) {
      setDuplicateItemConfirm({
        productId,
        productName,
        qty,
        price
      });
      return;
    } else {
      setPoItems([...poItems, {
        productId: productId,
        productName: productName,
        quantity: qty,
        unitPrice: price,
        total: qty * price
      }]);
    }

    setSelectedProductId('');
    setManualItemName('');
    setQtyInput('');
    setPriceInput('');
  };

  const handleConfirmDuplicate = (action: 'add' | 'replace') => {
    if (!duplicateItemConfirm) return;
    const { productId, qty, price } = duplicateItemConfirm;
    
    if (action === 'add') {
      setPoItems(poItems.map(i => i.productId === productId ? {
        ...i,
        quantity: i.quantity + qty,
        unitPrice: price,
        total: (i.quantity + qty) * price
      } : i));
    } else {
      setPoItems(poItems.map(i => i.productId === productId ? {
        ...i,
        quantity: qty,
        unitPrice: price,
        total: qty * price
      } : i));
    }
    
    setDuplicateItemConfirm(null);
    setSelectedProductId('');
    setManualItemName('');
    setQtyInput('');
    setPriceInput('');
  };

  const handleRemoveItem = (productId: string) => {
    setPoItems(poItems.filter(i => i.productId !== productId));
  };

  const handleSavePO = async () => {
    let finalPartnerId = selectedPartnerId;
    
    if (vendorInputMode === 'manual') {
      if (!manualVendorName.trim()) {
        toast.error('กรุณาระบุชื่อคู่ค้า');
        return;
      }
      const newPartner = await useStore.getState().addPartner({
        companyName: manualVendorName,
        type: 'Vendor',
      });
      if (newPartner) {
        finalPartnerId = newPartner.id;
      } else {
        toast.error('ไม่สามารถสร้างคู่ค้าใหม่ได้');
        return;
      }
    }

    if (vendorInputMode === 'system' && !finalPartnerId) return;
    if (!finalPartnerId || poItems.length === 0) return;

    if (editingPOId) {
      updatePurchaseOrder(editingPOId, {
        partnerId: finalPartnerId,
        items: poItems,
        totalAmount: poItems.reduce((sum, item) => sum + item.total, 0),
      });
    } else {
      addPurchaseOrder({
        date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX"),
        partnerId: finalPartnerId,
        items: poItems,
        status: 'Pending',
        totalAmount: poItems.reduce((sum, item) => sum + item.total, 0),
        createdBy: currentUser?.name || 'Admin'
      });
    }

    handleViewChange('list');
    setSelectedPartnerId('');
    setManualVendorName('');
    setPoItems([]);
    setEditingPOId(null);
  };

  if (view === 'create') {
    return (
      <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-500">
        <AnimatePresence>
          {duplicateItemConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full"
              >
                <h3 className="text-xl font-black text-[#1A1F3D] mb-2">พบสินค้านี้ในรายการแล้ว</h3>
                <p className="text-sm text-gray-500 mb-6">
                  <span className="font-bold text-[#1A1F3D]">{duplicateItemConfirm.productName}</span> มีอยู่ในรายการแล้ว คุณต้องการบวกจำนวนเพิ่ม หรือแทนที่รายการเดิมด้วยจำนวนและราคาใหม่?
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => handleConfirmDuplicate('add')}
                    className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-colors"
                  >
                    บวกจำนวนเพิ่ม
                  </button>
                  <button
                    onClick={() => handleConfirmDuplicate('replace')}
                    className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                  >
                    แทนที่รายการเดิม
                  </button>
                  <button
                    onClick={() => setDuplicateItemConfirm(null)}
                    className="w-full py-3 text-gray-400 font-bold hover:text-gray-600 transition-colors"
                  >
                    ยกเลิก
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-black text-[#1A1F3D]">{editingPOId ? 'แก้ไขใบสั่งซื้อ' : 'สร้างใบสั่งซื้อใหม่ (New PO)'}</h2>
              <p className="text-gray-400 font-bold text-sm">ระบุคู่ค้าและรายการสินค้าที่ต้องการสั่งซื้อ</p>
            </div>
            <button onClick={() => {
              handleViewChange('list');
              setEditingPOId(null);
              setSelectedPartnerId('');
              setManualVendorName('');
              setPoItems([]);
            }} className="p-3 bg-gray-50 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black uppercase text-gray-400">ผู้จัดจำหน่าย (Vendor)</label>
                </div>
                
                <div className="flex bg-gray-100 p-1 rounded-xl mb-2">
                  <button onClick={() => setVendorInputMode('system')} className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg transition-all ${vendorInputMode === 'system' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>เลือกจากระบบ</button>
                  <button onClick={() => setVendorInputMode('manual')} className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg transition-all ${vendorInputMode === 'manual' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>ระบุเอง (สร้างใหม่)</button>
                </div>

                {vendorInputMode === 'system' ? (
                  <select
                    className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-sm font-bold"
                    value={selectedPartnerId}
                    onChange={(e) => {
                      setSelectedPartnerId(e.target.value);
                      setSelectedProductId('');
                    }}
                  >
                    <option value="">-- เลือกคู่ค้า --</option>
                    {partners.map(p => (
                      <option key={p.id} value={p.id}>{p.companyName}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="ระบุชื่อคู่ค้าใหม่"
                    className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-100 transition-all"
                    value={manualVendorName}
                    onChange={(e) => setManualVendorName(e.target.value)}
                    autoFocus
                  />
                )}
              </div>

              <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
                <h3 className="font-black text-[#1A1F3D]">เพิ่มรายการสินค้า</h3>

                <div className="space-y-3">
                  <div className="flex bg-gray-100 p-1 rounded-xl mb-2">
                    <button onClick={() => setItemInputMode('system')} className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg transition-all ${itemInputMode === 'system' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>เลือกจากระบบ</button>
                    <button onClick={() => setItemInputMode('manual')} className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg transition-all ${itemInputMode === 'manual' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>ระบุเอง (ชั่วคราว)</button>
                  </div>

                  {itemInputMode === 'system' ? (
                    <select
                      className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold"
                      value={selectedProductId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedProductId(val);
                        if (val) {
                          const product = inventory.find(i => i.id === val);
                          if (product) {
                            setPriceInput(product.costPrice?.toString() || '0');
                            if (!qtyInput) setQtyInput('1');
                          }
                        } else {
                          setPriceInput('');
                        }
                      }}
                    >
                      <option value="">-- เลือกสินค้า --</option>
                      {inventory
                        .filter(i => {
                          if (vendorInputMode === 'system' && selectedPartnerId) {
                            return i.partnerId === selectedPartnerId;
                          }
                          return true;
                        })
                        .map(i => (
                        <option key={i.id} value={i.id}>{i.name} (ในสต็อก: {i.stock})</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="ระบุชื่อสินค้าใหม่"
                      className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-100 transition-all"
                      value={manualItemName}
                      onChange={(e) => setManualItemName(e.target.value)}
                      autoFocus
                    />
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="จำนวน"
                      className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold"
                      value={qtyInput}
                      onChange={(e) => setQtyInput(e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="ราคาต่อหน่วย"
                      className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold"
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                    />
                  </div>

                  <button
                    onClick={handleAddItem}
                    disabled={(itemInputMode === 'system' && !selectedProductId) || (itemInputMode === 'manual' && !manualItemName.trim()) || !qtyInput || !priceInput}
                    className="w-full bg-indigo-50 text-indigo-600 py-3 rounded-xl font-black text-sm hover:bg-indigo-100 transition-colors disabled:opacity-50"
                  >
                    เพิ่มเข้าใบสั่งซื้อ
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-gray-100 rounded-3xl p-6 h-full flex flex-col">
                <h3 className="font-black text-[#1A1F3D] mb-4">รายการที่สั่งซื้อ</h3>

                <div className="flex-1 overflow-y-auto">
                  {poItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50 space-y-3 py-12">
                      <FileText size={48} />
                      <p className="font-black">ยังไม่มีรายการสินค้า</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-50 text-[10px] font-black uppercase text-gray-400 text-left">
                          <th className="pb-3 px-2">สินค้า</th>
                          <th className="pb-3 px-2 text-right">จำนวน</th>
                          <th className="pb-3 px-2 text-right">ราคา/หน่วย</th>
                          <th className="pb-3 px-2 text-right">รวม</th>
                          <th className="pb-3 px-2 text-center">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {poItems.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-4 px-2 font-black text-sm">{item.productName}</td>
                            <td className="py-4 px-2 text-right font-bold text-sm">{item.quantity}</td>
                            <td className="py-4 px-2 text-right font-bold text-sm">฿{item.unitPrice.toLocaleString()}</td>
                            <td className="py-4 px-2 text-right font-black text-indigo-600">฿{item.total.toLocaleString()}</td>
                            <td className="py-4 px-2 text-center">
                              <button onClick={() => handleRemoveItem(item.productId)} className="text-red-400 hover:text-red-600 p-1">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-400">ยอดรวมทั้งสิ้น</p>
                    <p className="text-3xl font-black text-[#1A1F3D]">
                      ฿{poItems.reduce((s, i) => s + i.total, 0).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={handleSavePO}
                    disabled={(vendorInputMode === 'system' && !selectedPartnerId) || (vendorInputMode === 'manual' && !manualVendorName.trim()) || poItems.length === 0}
                    className="bg-[#1A1F3D] text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-gray-900 transition-colors disabled:opacity-50"
                  >
                    <Save size={18} /> บันทึกใบสั่งซื้อ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      <div className="lg:col-span-12">
        <div className="flex flex-col gap-[4px] min-h-[600px]">
          <div className="bg-white rounded-t-[40px] rounded-b-xl border border-gray-100 shadow-sm p-8 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><FileText size={20} /></div>
                <div>
                  <h3 className="text-xl font-black text-[#1A1F3D]">Purchase Orders</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">จัดการใบสั่งซื้อสินค้า</p>
                </div>
              </div>

              <div className="hidden lg:flex items-center gap-2 border-l border-gray-100 pl-6 ml-2">
                <button 
                  onClick={() => setStatusFilter(null)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${statusFilter === null ? 'bg-[#EAFD69]/40 border-[#EAFD69] ring-2 ring-[#EAFD69]/50 shadow-sm' : 'bg-[#EAFD69]/20 border-[#EAFD69]/30 hover:bg-[#EAFD69]/30'}`}
                >
                  <span className="text-[10px] font-bold text-[#1A1F3D] uppercase tracking-wider">Total</span>
                  <span className="text-sm font-black text-[#1A1F3D]">{totalPOs}</span>
                </button>
                <button 
                  onClick={() => setStatusFilter(statusFilter === 'Pending' ? null : 'Pending')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${statusFilter === 'Pending' ? 'bg-orange-100 border-orange-300 ring-2 ring-orange-200 shadow-sm' : 'bg-orange-50 border-orange-100/50 hover:bg-orange-100'}`}
                >
                  <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Pending</span>
                  <span className="text-sm font-black text-orange-600">{pendingPOs}</span>
                </button>
                <button 
                  onClick={() => setStatusFilter(statusFilter === 'To Order' ? null : 'To Order')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${statusFilter === 'To Order' ? 'bg-purple-100 border-purple-300 ring-2 ring-purple-200 shadow-sm' : 'bg-purple-50 border-purple-100/50 hover:bg-purple-100'}`}
                >
                  <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">To Order</span>
                  <span className="text-sm font-black text-purple-600">{toOrderPOs}</span>
                </button>
                <button 
                  onClick={() => setStatusFilter(statusFilter === 'Completed' ? null : 'Completed')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${statusFilter === 'Completed' ? 'bg-green-100 border-green-300 ring-2 ring-green-200 shadow-sm' : 'bg-green-50 border-green-100/50 hover:bg-green-100'}`}
                >
                  <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Completed</span>
                  <span className="text-sm font-black text-green-600">{completedPOs}</span>
                </button>
                <button 
                  onClick={() => setStatusFilter(statusFilter === 'Cancelled' ? null : 'Cancelled')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${statusFilter === 'Cancelled' ? 'bg-red-100 border-red-300 ring-2 ring-red-200 shadow-sm' : 'bg-red-50 border-red-100/50 hover:bg-red-100'}`}
                >
                  <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Cancelled</span>
                  <span className="text-sm font-black text-red-600">{cancelledPOs}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="ค้นหาใบสั่งซื้อ..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-3 bg-[#F5F6FA] border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-100 transition-all w-[250px]"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-b-[40px] rounded-t-xl border border-gray-100 shadow-sm flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white border-b border-gray-100">
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">PO Number / Date</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">Vendor</th>
                    <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">Items</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">Total Amount</th>
                    <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">Status</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <AnimatePresence>
                    {filteredPOs.map(po => (
                      <motion.tr
                        key={po.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-gray-50/50"
                      >
                        <td className="px-8 py-6">
                          <p className="text-sm font-black text-[#1A1F3D]">{po.id}</p>
                          <p className="text-[10px] text-gray-400 font-bold">{format(new Date(po.date), 'dd MMM yyyy HH:mm')}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-sm font-bold text-gray-700">
                            {partners.find(p => p.id === po.partnerId)?.companyName || 'Unknown Vendor'}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium">By: {po.createdBy}</p>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className="inline-flex items-center justify-center bg-gray-100 text-gray-600 rounded-lg px-3 py-1 font-black text-xs">
                            {po.items.length} รายการ
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right font-black text-[#1A1F3D]">
                          ฿{po.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider",
                            getStatusColor(po.status)
                          )}>
                            {getStatusIcon(po.status)}
                            {po.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <button
                              onClick={() => setPreviewPO(po)}
                              className="bg-[#1A1F3D] text-white px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1.5 hover:bg-gray-900 transition-colors shadow-sm"
                            >
                              <FileText size={14} /> Preview
                            </button>
                            {po.status === 'Pending' && (
                              <button
                                onClick={() => {
                                  setEditingPOId(po.id);
                                  setSelectedPartnerId(po.partnerId);
                                  setPoItems(po.items);
                                  handleViewChange('create');
                                }}
                                className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1.5 hover:bg-orange-100 transition-colors shadow-sm"
                              >
                                <Edit size={14} /> แก้ไข
                              </button>
                            )}
                            {po.status === 'Pending' && (
                              <>
                                <button
                                  onClick={() => updatePurchaseOrderStatus(po.id, 'To Order')}
                                  className="bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1.5 hover:bg-purple-100 transition-colors shadow-sm"
                                >
                                  <Check size={14} /> อนุมัติ Approved
                                </button>
                                <button
                                  onClick={() => updatePurchaseOrderStatus(po.id, 'Cancelled')}
                                  className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1.5 hover:bg-red-100 transition-colors shadow-sm"
                                >
                                  <XCircle size={14} /> ยกเลิก
                                </button>
                              </>
                            )}
                            {(po.status === 'To Order' || (po.status as string) === 'On Order') && (
                              <>
                                <button
                                  onClick={() => updatePurchaseOrderStatus(po.id, 'Completed')}
                                  className="bg-green-50 text-green-600 px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1.5 hover:bg-green-100 transition-colors shadow-sm"
                                >
                                  <CheckCircle size={14} /> สั่งสินค้าแล้ว
                                </button>
                                <button
                                  onClick={() => updatePurchaseOrderStatus(po.id, 'Cancelled')}
                                  className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1.5 hover:bg-red-100 transition-colors shadow-sm"
                                >
                                  <XCircle size={14} /> ยกเลิก
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {filteredPOs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-20 text-center opacity-40">
                        <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                        <p className="font-black text-gray-500">ไม่พบข้อมูลใบสั่งซื้อ</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* PO Preview Modal */}
      {previewPO && (
        <POPreviewModal
          previewPO={previewPO}
          onClose={() => setPreviewPO(null)}
          onStatusChange={(updatedPO) => setPreviewPO(updatedPO)}
        />
      )}
    </div>
  );
};

export default POSystem;
