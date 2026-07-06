import React, { useState, useEffect } from 'react';
import { useStore, GoodsReceipt, GoodsReceiptItem, PurchaseOrder } from '@/store/useStore';
import { format } from 'date-fns';
import { Plus, Search, FileText, CheckCircle, XCircle, Clock, Trash2, Save, X, Download, Printer, Check, Search as SearchIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { formatBahtText } from '@/lib/bahttext';
import { toast } from 'sonner';

interface GRSystemProps {
  initialView?: 'list' | 'create';
  onViewChange?: (view: 'list' | 'create') => void;
}

const GRSystem: React.FC<GRSystemProps> = ({ initialView = 'list', onViewChange }) => {
  const {
    goodsReceipts, purchaseOrders, partners, inventory, currentUser,
    addGoodsReceipt, updateGoodsReceipt, updateGoodsReceiptStatus,
    companyName, companyAddress, companyTaxId, companyPhone, companyEmail
  } = useStore();

  const [view, setView] = useState<'list' | 'create'>(initialView);

  const handleViewChange = (newView: 'list' | 'create') => {
    setView(newView);
    if (onViewChange) onViewChange(newView);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [previewGR, setPreviewGR] = useState<GoodsReceipt | null>(null);

  // Create GR State
  const [editingGRId, setEditingGRId] = useState<string | null>(null);
  const [selectedPOId, setSelectedPOId] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [manualVendorName, setManualVendorName] = useState('');
  const [grItems, setGrItems] = useState<GoodsReceiptItem[]>([]);
  
  // Custom item addition state (if not using PO)
  const [selectedProductId, setSelectedProductId] = useState('');
  const [manualItemName, setManualItemName] = useState('');
  const [qtyInput, setQtyInput] = useState('');
  const [priceInput, setPriceInput] = useState('');

  const [vendorInputMode, setVendorInputMode] = useState<'system' | 'manual'>('system');
  const [itemInputMode, setItemInputMode] = useState<'system' | 'manual'>('system');

  const totalGRs = goodsReceipts.length;
  const onOrderGRs = goodsReceipts.filter(gr => gr.status === 'On Order').length;
  const completedGRs = goodsReceipts.filter(gr => gr.status === 'Completed').length;
  const cancelledGRs = goodsReceipts.filter(gr => gr.status === 'Cancelled').length;

  const filteredGRs = goodsReceipts.filter(gr => {
    const matchesSearch = gr.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partners.find(p => p.id === gr.partnerId)?.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter ? gr.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-50 text-green-600';
      case 'On Order': return 'bg-blue-50 text-blue-600';
      case 'Cancelled': return 'bg-red-50 text-red-600';
      default: return 'bg-orange-50 text-orange-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle size={14} />;
      case 'On Order': return <Clock size={14} />;
      case 'Cancelled': return <XCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const handlePOSelection = (poId: string) => {
    setSelectedPOId(poId);
    const po = purchaseOrders.find(p => p.id === poId);
    if (po) {
      setSelectedPartnerId(po.partnerId);
      setVendorInputMode('system');
      setGrItems(po.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantityExpected: item.quantity,
        quantityReceived: item.quantity, // Default to receiving all expected
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
        remarks: ''
      })));
    } else {
      setGrItems([]);
    }
  };

  const handleItemReceiveQtyChange = (productId: string, qty: number) => {
    setGrItems(grItems.map(item => {
      if (item.productId === productId) {
        return {
          ...item,
          quantityReceived: qty,
          total: qty * item.unitPrice
        };
      }
      return item;
    }));
  };

  const handleItemRemarksChange = (productId: string, remarks: string) => {
    setGrItems(grItems.map(item => {
      if (item.productId === productId) {
        return { ...item, remarks };
      }
      return item;
    }));
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

    const existingItem = grItems.find(i => i.productId === productId);
    if (existingItem) {
      setGrItems(grItems.map(i => i.productId === productId ? {
        ...i,
        quantityExpected: i.quantityExpected + qty,
        quantityReceived: i.quantityReceived + qty,
        total: (i.quantityReceived + qty) * i.unitPrice
      } : i));
    } else {
      setGrItems([...grItems, {
        productId: productId,
        productName: productName,
        quantityExpected: qty,
        quantityReceived: qty,
        unitPrice: price,
        total: qty * price,
        remarks: ''
      }]);
    }

    setSelectedProductId('');
    setManualItemName('');
    setQtyInput('');
    setPriceInput('');
  };

  const handleRemoveItem = (productId: string) => {
    setGrItems(grItems.filter(i => i.productId !== productId));
  };

  const handleSaveGR = async () => {
    let finalPartnerId = selectedPartnerId;
    
    if (!selectedPOId && vendorInputMode === 'manual') {
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

    if (!selectedPOId && vendorInputMode === 'system' && !finalPartnerId) return;
    if (!finalPartnerId || grItems.length === 0) return;

    if (editingGRId) {
      updateGoodsReceipt(editingGRId, {
        poId: selectedPOId || undefined,
        partnerId: finalPartnerId,
        items: grItems,
        totalAmount: grItems.reduce((sum, item) => sum + item.total, 0),
      });
    } else {
      addGoodsReceipt({
        date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX"),
        poId: selectedPOId || undefined,
        partnerId: finalPartnerId,
        items: grItems,
        status: 'On Order',
        totalAmount: grItems.reduce((sum, item) => sum + item.total, 0),
        receiverName: currentUser?.name || 'Admin'
      });
    }

    handleViewChange('list');
    setSelectedPOId('');
    setSelectedPartnerId('');
    setManualVendorName('');
    setGrItems([]);
    setEditingGRId(null);
  };

  if (view === 'create') {
    return (
      <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-black text-[#1A1F3D]">{editingGRId ? 'แก้ไขใบรับสินค้า' : 'สร้างใบรับสินค้าใหม่ (New Goods Receipt)'}</h2>
              <p className="text-gray-400 font-bold text-sm">บันทึกการรับสินค้าเข้าสต็อก อ้างอิงจากใบสั่งซื้อ (PO) หรือสร้างใหม่</p>
            </div>
            <button onClick={() => {
              handleViewChange('list');
              setEditingGRId(null);
              setSelectedPOId('');
              setSelectedPartnerId('');
              setManualVendorName('');
              setGrItems([]);
            }} className="p-3 bg-gray-50 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 px-1">อ้างอิงใบสั่งซื้อ (PO Reference - Optional)</label>
                <select
                  className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-sm font-bold"
                  value={selectedPOId}
                  onChange={(e) => handlePOSelection(e.target.value)}
                >
                  <option value="">-- ไม่ระบุ (รับโดยตรง) --</option>
                  {purchaseOrders.filter(po => {
                    if (po.status === 'Cancelled') return false;
                    if (editingGRId) {
                      const currentGR = goodsReceipts.find(gr => gr.id === editingGRId);
                      if (currentGR && currentGR.poId === po.id) return true;
                    }
                    return !goodsReceipts.some(gr => gr.poId === po.id && gr.status !== 'Cancelled');
                  }).map(p => (
                    <option key={p.id} value={p.id}>{p.id} - {partners.find(pt => pt.id === p.partnerId)?.companyName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black uppercase text-gray-400">ผู้จัดจำหน่าย (Vendor)</label>
                </div>
                
                {!selectedPOId && (
                  <div className="flex bg-gray-100 p-1 rounded-xl mb-2">
                    <button onClick={() => setVendorInputMode('system')} className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg transition-all ${vendorInputMode === 'system' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>เลือกจากระบบ</button>
                    <button onClick={() => setVendorInputMode('manual')} className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg transition-all ${vendorInputMode === 'manual' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>ระบุเอง (สร้างใหม่)</button>
                  </div>
                )}

                {vendorInputMode === 'system' || selectedPOId ? (
                  <select
                    className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-50"
                    value={selectedPartnerId}
                    onChange={(e) => {
                      setSelectedPartnerId(e.target.value);
                      setSelectedProductId('');
                      if (selectedPOId) {
                         setSelectedPOId('');
                         setGrItems([]);
                      }
                    }}
                    disabled={!!selectedPOId}
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

              {!selectedPOId && (
                <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
                  <h3 className="font-black text-[#1A1F3D]">เพิ่มรายการสินค้าด้วยตนเอง</h3>

                  <div className="space-y-3">
                    <div className="flex bg-gray-100 p-1 rounded-xl mb-2">
                      <button onClick={() => setItemInputMode('system')} className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg transition-all ${itemInputMode === 'system' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>เลือกจากระบบ</button>
                      <button onClick={() => setItemInputMode('manual')} className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg transition-all ${itemInputMode === 'manual' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>ระบุเอง (ชั่วคราว)</button>
                    </div>

                    {itemInputMode === 'system' ? (
                      <select
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold"
                        value={selectedProductId}
                        onChange={(e) => {
                          setSelectedProductId(e.target.value);
                          const p = inventory.find(i => i.id === e.target.value);
                          if (p) setPriceInput(p.costPrice.toString());
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
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold"
                        value={qtyInput}
                        onChange={(e) => setQtyInput(e.target.value)}
                        min="1"
                      />
                      <input
                        type="number"
                        placeholder="ราคาต่อหน่วย"
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold"
                        value={priceInput}
                        onChange={(e) => setPriceInput(e.target.value)}
                        min="0"
                      />
                    </div>
                    <button
                      onClick={handleAddItem}
                      disabled={(itemInputMode === 'system' && !selectedProductId) || (itemInputMode === 'manual' && !manualItemName.trim()) || !qtyInput || !priceInput}
                      className="w-full bg-indigo-50 text-indigo-600 py-3 rounded-xl font-black text-sm hover:bg-indigo-100 transition-colors disabled:opacity-50"
                    >
                      เพิ่มรายการ
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-black text-[#1A1F3D] flex items-center gap-2">
                    <FileText size={18} className="text-[#C5C3EA]" />
                    รายการรับสินค้า
                  </h3>
                  <span className="text-sm font-bold text-gray-400">{grItems.length} รายการ</span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase">สินค้า</th>
                        <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase text-right">จำนวนที่สั่ง</th>
                        <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase text-right w-32">รับจริง</th>
                        <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase w-48">หมายเหตุ/สภาพ</th>
                        <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase text-right">รวม (฿)</th>
                        <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase text-center w-20"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {grItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                              <SearchIcon size={24} />
                            </div>
                            <p className="text-gray-400 font-bold">ยังไม่มีรายการสินค้า</p>
                            <p className="text-sm text-gray-400 mt-1">เลือก PO หรือเพิ่มสินค้าด้วยตนเอง</p>
                          </td>
                        </tr>
                      ) : (
                        grItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-bold text-[#1A1F3D]">{item.productName}</p>
                              <p className="text-xs text-gray-400">฿{item.unitPrice.toLocaleString()}/ชิ้น</p>
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-gray-500">{item.quantityExpected}</td>
                            <td className="px-6 py-4">
                              <input
                                type="number"
                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-right focus:border-[#1A1F3D] focus:ring-1 focus:ring-[#1A1F3D] outline-none transition-all"
                                value={item.quantityReceived}
                                onChange={(e) => handleItemReceiveQtyChange(item.productId, parseInt(e.target.value) || 0)}
                                min="0"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input
                                type="text"
                                placeholder="ปกติ..."
                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#1A1F3D] focus:ring-1 focus:ring-[#1A1F3D] outline-none transition-all"
                                value={item.remarks || ''}
                                onChange={(e) => handleItemRemarksChange(item.productId, e.target.value)}
                              />
                            </td>
                            <td className="px-6 py-4 text-right font-black text-[#1A1F3D]">
                              {item.total.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => handleRemoveItem(item.productId)}
                                className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {grItems.length > 0 && (
                      <tfoot className="bg-gray-50/50">
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-right font-black text-gray-500">ยอดรวมทั้งสิ้น</td>
                          <td className="px-6 py-4 text-right font-black text-2xl text-[#1A1F3D]">
                            ฿{grItems.reduce((sum, item) => sum + item.total, 0).toLocaleString()}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSaveGR}
                  disabled={(!selectedPOId && vendorInputMode === 'system' && !selectedPartnerId) || (!selectedPOId && vendorInputMode === 'manual' && !manualVendorName.trim()) || grItems.length === 0}
                  className="bg-[#1A1F3D] text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-gray-900 transition-colors disabled:opacity-50"
                >
                  <Save size={18} /> บันทึกใบรับสินค้า
                </button>
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
                <div className="p-2.5 bg-[#C5C3EA]/20 text-[#1A1F3D] rounded-xl"><FileText size={20} /></div>
                <div>
                  <h3 className="text-xl font-black text-[#1A1F3D]">Goods Receipts</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">จัดการใบรับสินค้า</p>
                </div>
              </div>

              <div className="hidden lg:flex items-center gap-2 border-l border-gray-100 pl-6 ml-2">
                <button 
                  onClick={() => setStatusFilter(null)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${statusFilter === null ? 'bg-[#EAFD69]/40 border-[#EAFD69] ring-2 ring-[#EAFD69]/50 shadow-sm' : 'bg-[#EAFD69]/20 border-[#EAFD69]/30 hover:bg-[#EAFD69]/30'}`}
                >
                  <span className="text-[10px] font-bold text-[#1A1F3D] uppercase tracking-wider">Total</span>
                  <span className="text-sm font-black text-[#1A1F3D]">{totalGRs}</span>
                </button>
                <button 
                  onClick={() => setStatusFilter(statusFilter === 'On Order' ? null : 'On Order')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${statusFilter === 'On Order' ? 'bg-blue-100 border-blue-300 ring-2 ring-blue-200 shadow-sm' : 'bg-blue-50 border-blue-100/50 hover:bg-blue-100'}`}
                >
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">On Order</span>
                  <span className="text-sm font-black text-blue-600">{onOrderGRs}</span>
                </button>
                <button 
                  onClick={() => setStatusFilter(statusFilter === 'Completed' ? null : 'Completed')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${statusFilter === 'Completed' ? 'bg-green-100 border-green-300 ring-2 ring-green-200 shadow-sm' : 'bg-green-50 border-green-100/50 hover:bg-green-100'}`}
                >
                  <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Completed</span>
                  <span className="text-sm font-black text-green-600">{completedGRs}</span>
                </button>
                <button 
                  onClick={() => setStatusFilter(statusFilter === 'Cancelled' ? null : 'Cancelled')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${statusFilter === 'Cancelled' ? 'bg-red-100 border-red-300 ring-2 ring-red-200 shadow-sm' : 'bg-red-50 border-red-100/50 hover:bg-red-100'}`}
                >
                  <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Cancelled</span>
                  <span className="text-sm font-black text-red-600">{cancelledGRs}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="ค้นหาใบ GR..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-3 bg-[#F5F6FA] border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#C5C3EA] transition-all w-[250px]"
                />
              </div>
              <button 
                onClick={() => handleViewChange('create')}
                className="bg-[#C5C3EA] text-[#1A1F3D] px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 hover:opacity-90 transition-all shadow-sm"
              >
                <Plus size={18} /> สร้างใบรับสินค้า (GR)
              </button>
            </div>
          </div>

          <div className="bg-white rounded-b-[40px] rounded-t-xl border border-gray-100 shadow-sm flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-white border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 whitespace-nowrap">GR Number</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 whitespace-nowrap">Date</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400">Vendor</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">Total Amount</th>
                    <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">Status</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredGRs.map((gr) => (
                    <tr key={gr.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <p className="font-black text-[#1A1F3D]">{gr.id}</p>
                        {gr.poId && <p className="text-xs font-bold text-[#1A1F3D]/60">Ref: {gr.poId}</p>}
                      </td>
                      <td className="px-8 py-5">
                        <p className="font-bold text-gray-600">{format(new Date(gr.date), 'dd/MM/yyyy')}</p>
                        <p className="text-xs text-gray-400">{format(new Date(gr.date), 'HH:mm')}</p>
                      </td>
                      <td className="px-8 py-5">
                        <p className="font-bold text-[#1A1F3D]">{partners.find(p => p.id === gr.partnerId)?.companyName || 'Unknown Vendor'}</p>
                      </td>
                      <td className="px-8 py-5 text-right font-black text-[#1A1F3D]">
                        ฿{gr.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold",
                          getStatusColor(gr.status)
                        )}>
                          {getStatusIcon(gr.status)} {gr.status}
                        </span>
                      </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <button
                              onClick={() => setPreviewGR(gr)}
                              className="bg-[#1A1F3D] text-white px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1.5 hover:bg-gray-900 transition-colors shadow-sm"
                            >
                              <FileText size={14} /> Preview
                            </button>
                            {(gr.status === 'Pending' || gr.status === 'On Order') && (
                              <button
                                onClick={() => updateGoodsReceiptStatus(gr.id, 'Completed')}
                                className="bg-green-50 text-green-600 px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1.5 hover:bg-green-100 transition-colors shadow-sm"
                              >
                                <CheckCircle size={14} /> รับเข้าสต็อก
                              </button>
                            )}
                          </div>
                        </td>
                    </tr>
                  ))}
                  {filteredGRs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-8 py-16 text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                          <SearchIcon size={32} />
                        </div>
                        <h3 className="text-lg font-black text-[#1A1F3D] mb-1">ไม่พบข้อมูล</h3>
                        <p className="text-gray-400">ยังไม่มีประวัติการรับสินค้า หรือไม่พบรายการที่ค้นหา</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewGR && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#F9F9F9]">
                <div>
                  <h3 className="text-2xl font-black text-[#1A1F3D] flex items-center gap-2">
                    <FileText className="text-[#C5C3EA]" /> ใบรับสินค้า (Goods Receipt)
                  </h3>
                  <p className="text-gray-500 font-bold">{previewGR.id}</p>
                </div>
                <button onClick={() => setPreviewGR(null)} className="p-3 hover:bg-white rounded-2xl text-gray-400 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
                <style type="text/css" media="print">
                  {`
                    body * { visibility: hidden; }
                    #printable-gr, #printable-gr * { visibility: visible; }
                    #printable-gr { position: absolute; left: 0; top: 0; width: 100%; background: white; margin: 0; padding: 20px; }
                    @page { size: A4; margin: 0; }
                  `}
                </style>
                <div id="printable-gr" className="bg-white p-8 shadow-sm border border-gray-200 mx-auto max-w-[800px] text-[10px] font-sans text-black">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="text-2xl font-black tracking-tighter text-[#1A1F3D]">{companyName || "Company Name"}</div>
                    <div className="text-right text-[10px] text-gray-600 space-y-1">
                      <p className="font-bold">{companyName || "Company Name"}</p>
                      <p>{companyAddress || "111 อาคารเอไอเอ แคปปิตอล เซ็นเตอร์ แขวงดินแดง เขตดินแดง กรุงเทพฯ 10400"}</p>
                      <p>เลขที่ผู้เสียภาษี {companyTaxId || "0105555555555"} (สำนักงานใหญ่)</p>
                    </div>
                  </div>

                  {/* Title Box */}
                  <div className="flex justify-end mb-4">
                    <div className="w-[300px] border border-black flex flex-col">
                      <div className="flex">
                        <div className="bg-black text-white flex-1 p-3 text-center flex flex-col justify-center">
                          <h1 className="text-2xl font-bold">Goods Receipt</h1>
                          <p className="text-sm">ใบรับสินค้า</p>
                        </div>
                        <div className="w-[120px] flex flex-col border-l border-black bg-white">
                          <div className="text-center text-xs p-1 border-b border-black">ต้นฉบับ / Original</div>
                          <div className="text-center p-3 font-bold">{previewGR.id}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info Boxes */}
                  <div className="grid grid-cols-12 border border-black mb-4">
                    <div className="col-span-6 border-r border-black p-3 space-y-2">
                      <div className="flex"><span className="w-24 font-bold shrink-0">ผู้ขาย<br /><span className="text-[8px] font-normal">Supplier</span></span> <span className="flex-1 break-words">{partners.find(p => p.id === previewGR.partnerId)?.companyName || 'Unknown Vendor'}</span></div>
                      <div className="flex"><span className="w-24 font-bold shrink-0">เลขที่ผู้เสียภาษี<br /><span className="text-[8px] font-normal">Tax ID</span></span> <span className="flex-1 break-words">{partners.find(p => p.id === previewGR.partnerId)?.taxId || '-'} (สำนักงานใหญ่)</span></div>
                      <div className="flex"><span className="w-24 font-bold shrink-0">ที่อยู่<br /><span className="text-[8px] font-normal">Address</span></span> <span className="flex-1 break-words">{partners.find(p => p.id === previewGR.partnerId)?.address || '-'}</span></div>
                    </div>
                    <div className="col-span-3 border-r border-black p-3 space-y-2">
                      <div className="flex"><span className="w-16 font-bold shrink-0">วันที่<br /><span className="text-[8px] font-normal">Date</span></span> <span className="flex-1 break-words">{format(new Date(previewGR.date), 'dd/MM/yyyy')}</span></div>
                      <div className="flex"><span className="w-16 font-bold shrink-0">อ้างอิง PO<br /><span className="text-[8px] font-normal">Ref PO</span></span> <span className="flex-1 break-words">{previewGR.poId || '-'}</span></div>
                    </div>
                    <div className="col-span-3 p-3 space-y-2">
                      <div className="flex"><span className="w-16 font-bold shrink-0">ผู้รับ<br /><span className="text-[8px] font-normal">Receiver</span></span> <span className="flex-1 break-words">{previewGR.receiverName}</span></div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <table className="w-full border-collapse border border-black mb-4">
                    <thead>
                      <tr className="bg-black text-white text-[10px]">
                        <th className="border border-black p-2 font-normal w-12">เลขที่<br />No.</th>
                        <th className="border border-black p-2 font-normal text-left">รายการ<br />Description</th>
                        <th className="border border-black p-2 font-normal w-16">จำนวนสั่ง<br />Expected</th>
                        <th className="border border-black p-2 font-normal w-16">จำนวนรับ<br />Received</th>
                        <th className="border border-black p-2 font-normal w-24">ราคา/หน่วย<br />Unit Price</th>
                        <th className="border border-black p-2 font-normal w-24">จำนวนเงิน (THB)<br />Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewGR.items.map((item, idx) => (
                        <tr key={idx} className="text-[10px]">
                          <td className="border-l border-r border-black p-2 text-center align-top">{idx + 1}</td>
                          <td className="border-l border-r border-black p-2 align-top">{item.productName} {item.remarks && <span className="text-gray-500 block">หมายเหตุ: {item.remarks}</span>}</td>
                          <td className="border-l border-r border-black p-2 text-center align-top text-gray-500">{item.quantityExpected}</td>
                          <td className="border-l border-r border-black p-2 text-center align-top font-bold">{item.quantityReceived}</td>
                          <td className="border-l border-r border-black p-2 text-right align-top">{item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="border-l border-r border-black p-2 text-right align-top">{item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                      {/* Fill empty rows */}
                      {Array.from({ length: Math.max(0, 5 - previewGR.items.length) }).map((_, i) => (
                        <tr key={`empty-${i}`}>
                          <td className="border-l border-r border-black p-2 text-center text-transparent">.</td>
                          <td className="border-l border-r border-black p-2 text-transparent">.</td>
                          <td className="border-l border-r border-black p-2 text-transparent">.</td>
                          <td className="border-l border-r border-black p-2 text-transparent">.</td>
                          <td className="border-l border-r border-black p-2 text-transparent">.</td>
                          <td className="border-l border-r border-black p-2 text-transparent">.</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Summary Table */}
                  <div className="flex border border-black mb-4">
                    <div className="flex-1 p-3 bg-[#F8F9FA] flex flex-col justify-end border-r border-black">
                      <div className="flex items-center gap-4">
                        <div className="font-bold text-xs">จำนวนเงิน<br /><span className="text-[10px] font-normal">Amount</span></div>
                        <div className="font-bold text-sm bg-gray-200 px-4 py-1 rounded-sm w-full text-center">{formatBahtText(previewGR.totalAmount)}</div>
                      </div>
                    </div>
                    <div className="w-[300px]">
                      <div className="flex border-b border-black">
                        <div className="flex-1 p-2 bg-[#F8F9FA] text-xs"><span className="font-bold">รวมเป็นเงิน</span><br /><span className="text-[10px]">Subtotal</span></div>
                        <div className="w-[120px] p-2 text-right border-l border-black font-bold">{previewGR.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      </div>
                      <div className="flex border-b border-black">
                        <div className="flex-1 p-2 bg-[#F8F9FA] text-xs"><span className="font-bold">จำนวนภาษีมูลค่าเพิ่ม 7 %</span><br /><span className="text-[10px]">Value Added Tax</span></div>
                        <div className="w-[120px] p-2 text-right border-l border-black font-bold">0.00</div>
                      </div>
                      <div className="flex bg-black text-white">
                        <div className="flex-1 p-2 text-xs"><span className="font-bold">จำนวนเงินรวมทั้งสิ้น</span><br /><span className="text-[10px]">Total</span></div>
                        <div className="w-[120px] p-2 text-right border-l border-white font-bold">{previewGR.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      </div>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="grid grid-cols-2 gap-8 border border-black p-4 text-center text-xs">
                    <div className="flex flex-col justify-end pt-12 space-y-2">
                      <div className="border-b border-dashed border-gray-400 mx-8"></div>
                      <div><span className="font-bold">ผู้ส่งมอบสินค้า / Delivered By</span></div>
                      <div>วันที่ / Date ........................................</div>
                    </div>
                    <div className="flex flex-col justify-end pt-12 space-y-2">
                      <div className="text-lg font-black mb-2">{previewGR.receiverName}</div>
                      <div className="border-b border-dashed border-gray-400 mx-8"></div>
                      <div><span className="font-bold">ผู้รับสินค้า / Received By</span></div>
                      <div>วันที่ / Date ....{format(new Date(previewGR.date), 'dd/MM/yyyy')}....</div>
                    </div>
                  </div>

                  <div className="text-center text-[10px] text-gray-500 mt-4 bg-black text-white py-1">
                    {companyName || "Company Name"} {companyAddress || "111 อาคารเอไอเอ แคปปิตอล เซ็นเตอร์ แขวงดินแดง เขตดินแดง กรุงเทพฯ 10400"}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => window.print()} className="px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors">
                   <Printer size={18} /> พิมพ์
                </button>
                <button onClick={() => setPreviewGR(null)} className="px-6 py-3 bg-[#1A1F3D] text-white rounded-xl font-black">
                  ปิด
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GRSystem;
