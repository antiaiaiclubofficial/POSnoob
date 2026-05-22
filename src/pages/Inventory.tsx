"use client";

import React, { useState, useMemo } from 'react';
import { 
  LayoutGrid, AlertTriangle, PlusCircle, FileText, Users, BarChart3, 
  Search, Edit3, Package, Download, Save, Printer, Trash2, ArrowRight,
  TrendingUp, DollarSign, PieChart as PieIcon, LineChart as LineIcon, BarChart as BarIcon,
  ChevronRight, Camera, CheckCircle2, Plus, Tag, Building2, Filter
} from 'lucide-react';
import { useStore, InventoryItem, StockLog } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, ChartTooltip, 
  Cell, PieChart, Pie, LineChart, Line, CartesianGrid 
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import InventoryModal from '@/components/InventoryModal';
import VendorModal from '@/components/VendorModal';

type WmsTab = 'master' | 'check' | 'adjust' | 'report' | 'consignment' | 'dashboard';

const Inventory = () => {
  const { 
    inventory, partners, stockLogs, shopName, shopAddress, shopPhone, shopLogo, receiptHeader, transactions,
    adjustStock, updateBusinessProfile, deleteInventoryItem, deleteVendor, language, currency
  } = useStore();
  
  const [activeTab, setActiveTab] = useState<WmsTab>('master'); // Default to master as requested
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');

  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<any>(null);

  // Adjustment State
  const [selectedAdjustId, setSelectedAdjustId] = useState('');
  const [adjustMode, setAdjustMode] = useState<'Add' | 'Set'>('Add');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'master', label: 'สินค้าทั้งหมด', icon: LayoutGrid },
    { id: 'check', label: 'เช็คสต็อก/แจ้งเตือน', icon: AlertTriangle },
    { id: 'adjust', label: 'เติม/ปรับยอด', icon: PlusCircle },
    { id: 'report', label: 'รายงาน PDF (A4)', icon: FileText },
    { id: 'consignment', label: 'คู่ค้าฝากขาย', icon: Users },
  ];

  // Get unique categories for filter
  const categories = useMemo(() => {
    return Array.from(new Set(inventory.map(i => i.category))).filter(Boolean);
  }, [inventory]);

  // Logic: Combined Filters
  const filteredInventory = useMemo(() => {
    return inventory.filter(i => {
      const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           i.barcode?.includes(searchQuery);
      const matchesCategory = !categoryFilter || i.category === categoryFilter;
      const matchesPartner = !partnerFilter || i.partnerId === partnerFilter;
      
      return matchesSearch && matchesCategory && matchesPartner;
    });
  }, [inventory, searchQuery, categoryFilter, partnerFilter]);

  const dashboardStats = useMemo(() => {
    const totalValue = inventory.reduce((acc, i) => acc + (i.costPrice * i.stock), 0);
    const lowStock = inventory.filter(i => i.stock > 0 && i.stock <= i.minStock).length;
    const outOfStock = inventory.filter(i => i.stock === 0).length;
    const pieData = [
      { name: 'สินค้าเราเอง', value: inventory.filter(i => !i.isConsignment).length, color: '#1A1F3D' },
      { name: 'สินค้าฝากขาย', value: inventory.filter(i => i.isConsignment).length, color: '#D9ED5F' }
    ];
    return { totalValue, lowStock, outOfStock, pieData };
  }, [inventory]);

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdjustId || !adjustQty) return;
    adjustStock(selectedAdjustId, Number(adjustQty), adjustMode, adjustReason);
    toast.success("ปรับยอดสต็อกเรียบร้อย");
    setAdjustQty('');
    setAdjustReason('');
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text(shopName, 10, 10);
    autoTable(doc, { startY: 30, head: [['Product', 'Qty', 'Price']], body: inventory.map(i => [i.name, i.stock, i.price]) });
    doc.save("inventory_report.pdf");
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8F9FD] overflow-hidden">
      <header className="px-10 py-8 bg-white border-b border-gray-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pl-14 lg:pl-10">
        <div>
          <h1 className="text-3xl font-black text-[#1A1F3D] mb-1">Inventory & WMS</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Management System v2.0</p>
        </div>
        <div className="flex bg-[#F5F6FA] p-1.5 rounded-[28px] border border-gray-100 shadow-sm gap-1 overflow-x-auto scrollbar-hide w-full lg:w-auto">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id as WmsTab)} className={cn("px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap", activeTab === item.id ? "bg-[#1A1F3D] text-white shadow-lg" : "text-gray-400 hover:bg-white")}>
              <item.icon size={14} /> {item.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
        {/* TAB 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm"><Package size={24} className="text-blue-500 mb-6"/><p className="text-[10px] font-black uppercase text-gray-400 mb-1">Total SKUs</p><h2 className="text-4xl font-black">{inventory.length}</h2></div>
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm"><DollarSign size={24} className="text-green-500 mb-6"/><p className="text-[10px] font-black uppercase text-gray-400 mb-1">Inventory Value</p><h2 className="text-4xl font-black">{currency}{dashboardStats.totalValue.toLocaleString()}</h2></div>
              <div className="bg-white p-8 rounded-[40px] border border-orange-100 shadow-sm"><AlertTriangle size={24} className="text-orange-500 mb-6"/><p className="text-[10px] font-black uppercase text-orange-400 mb-1">Low Stock</p><h2 className="text-4xl font-black">{dashboardStats.lowStock}</h2></div>
              <div className="bg-white p-8 rounded-[40px] border border-red-100 shadow-sm"><Trash2 size={24} className="text-red-500 mb-6"/><p className="text-[10px] font-black uppercase text-red-400 mb-1">Out of Stock</p><h2 className="text-4xl font-black">{dashboardStats.outOfStock}</h2></div>
            </div>
          </div>
        )}

        {/* TAB 2: Master List (Modified with 3-way Search/Filters) */}
        {activeTab === 'master' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
            {/* Advanced Search & Filter Bar */}
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
               <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 w-full">
                     {/* 1. ค้นหาจากชื่อสินค้าหรือบาร์โค้ด */}
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">ชื่อสินค้า หรือ บาร์โค้ด</label>
                        <div className="relative">
                           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                           <input 
                              className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-6 py-4 text-sm font-bold shadow-inner focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all" 
                              placeholder="ค้นหา..." 
                              value={searchQuery}
                              onChange={e => setSearchQuery(e.target.value)}
                           />
                        </div>
                     </div>

                     {/* 2. จากหมวดหมู่สินค้า */}
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">หมวดหมู่สินค้า</label>
                        <div className="relative">
                           <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                           <select 
                              className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-6 py-4 text-sm font-bold shadow-inner appearance-none focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all"
                              value={categoryFilter}
                              onChange={e => setCategoryFilter(e.target.value)}
                           >
                              <option value="">ทั้งหมดทุกหมวดหมู่</option>
                              {categories.map(cat => (
                                 <option key={cat} value={cat}>{cat}</option>
                              ))}
                           </select>
                        </div>
                     </div>

                     {/* 3. จากบริษัทคู่ค้า */}
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">บริษัทคู่ค้า (สินค้าฝากขาย)</label>
                        <div className="relative">
                           <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                           <select 
                              className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-6 py-4 text-sm font-bold shadow-inner appearance-none focus:ring-4 focus:ring-[#1A1F3D]/5 transition-all"
                              value={partnerFilter}
                              onChange={e => setPartnerFilter(e.target.value)}
                           >
                              <option value="">ทั้งหมดทุกบริษัท</option>
                              {partners.map(p => (
                                 <option key={p.id} value={p.id}>{p.companyName}</option>
                              ))}
                           </select>
                        </div>
                     </div>
                  </div>

                  <button 
                     onClick={() => { setEditingItem(null); setIsItemModalOpen(true); }}
                     className="bg-[#1A1F3D] text-white px-10 py-4 rounded-2xl font-black text-sm shadow-xl shadow-[#1A1F3D]/20 hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
                  >
                     <Plus size={20} className="inline mr-2" /> เพิ่มสินค้าใหม่
                  </button>
               </div>

               {/* Clear Filters Button (Visible only when filtering) */}
               {(searchQuery || categoryFilter || partnerFilter) && (
                  <button 
                     onClick={() => { setSearchQuery(''); setCategoryFilter(''); setPartnerFilter(''); }}
                     className="text-[10px] font-black uppercase text-red-400 hover:text-red-600 transition-colors px-2"
                  >
                     ล้างตัวกรองทั้งหมด
                  </button>
               )}
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
               <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                  <div className="flex items-center gap-3">
                     <Filter size={16} className="text-gray-400" />
                     <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                        พบสินค้า {filteredInventory.length} รายการ
                     </p>
                  </div>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full">
                     <thead>
                        <tr className="bg-gray-50/50">
                           <th className="px-8 py-6 text-left text-[10px] font-black uppercase text-gray-400">บาร์โค้ด / รูป</th>
                           <th className="px-8 py-6 text-left text-[10px] font-black uppercase text-gray-400">ชื่อสินค้า / หมวดหมู่</th>
                           <th className="px-8 py-6 text-center text-[10px] font-black uppercase text-gray-400">ต้นทุน</th>
                           <th className="px-8 py-6 text-center text-[10px] font-black uppercase text-gray-400">ราคาขาย</th>
                           <th className="px-8 py-6 text-left text-[10px] font-black uppercase text-gray-400">สถานะสินค้า</th>
                           <th className="px-8 py-6 text-right text-[10px] font-black uppercase text-gray-400">จัดการ</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                        {filteredInventory.map(item => (
                           <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                              <td className="px-8 py-6 flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-50">
                                    {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Package className="w-full h-full p-3 text-gray-300" />}
                                 </div>
                                 <span className="text-xs font-black text-gray-400 font-mono tracking-tighter">{item.barcode || '-'}</span>
                              </td>
                              <td className="px-8 py-6">
                                 <p className="text-sm font-black text-[#1A1F3D]">{item.name}</p>
                                 <p className="text-[9px] font-black uppercase text-blue-500 tracking-widest mt-0.5">{item.category}</p>
                              </td>
                              <td className="px-8 py-6 text-center text-sm font-bold text-gray-300">฿{item.costPrice}</td>
                              <td className="px-8 py-6 text-center text-sm font-black text-[#1A1F3D]">฿{item.price}</td>
                              <td className="px-8 py-6">
                                 {item.isConsignment ? (
                                    <div className="flex flex-col items-start gap-1">
                                       <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">สินค้าฝากขาย</span>
                                       <p className="text-[8px] font-bold text-gray-400 uppercase italic pl-1">{partners.find(p => p.id === item.partnerId)?.companyName}</p>
                                    </div>
                                 ) : (
                                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">สินค้าของเรา</span>
                                 )}
                              </td>
                              <td className="px-8 py-6 text-right">
                                 <button onClick={() => { setEditingItem(item); setIsItemModalOpen(true); }} className="p-3 text-gray-300 hover:text-[#1A1F3D] hover:bg-white rounded-xl transition-all shadow-sm"><Edit3 size={16}/></button>
                              </td>
                           </tr>
                        ))}
                        {filteredInventory.length === 0 && (
                           <tr>
                              <td colSpan={6} className="py-20 text-center opacity-30">
                                 <Search size={48} className="mx-auto mb-4" />
                                 <p className="font-black uppercase tracking-widest text-xs">ไม่พบรายการสินค้าที่ค้นหา</p>
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
          </div>
        )}

        {/* ... Rest of the tabs stay the same ... */}
        {activeTab === 'check' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-[#1A1F3D]">Inventory Status & Alerts</h3>
                <button onClick={() => toast.success("Exported")} className="bg-white border border-gray-100 text-[#1A1F3D] px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 shadow-sm"><Download size={14}/> Export to Excel (.CSV)</button>
             </div>
             
             <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                   <thead>
                      <tr className="bg-gray-50/50">
                         <th className="px-10 py-6 text-left text-[10px] font-black uppercase text-gray-400">ชื่อสินค้า</th>
                         <th className="px-10 py-6 text-center text-[10px] font-black uppercase text-gray-400">สต็อกปัจจุบัน</th>
                         <th className="px-10 py-6 text-center text-[10px] font-black uppercase text-gray-400">สถานะ</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {inventory.map(item => {
                         const status = item.stock === 0 ? 'Out' : item.stock <= item.minStock ? 'Low' : 'OK';
                         return (
                            <tr key={item.id}>
                               <td className="px-10 py-6 font-black text-sm">{item.name}</td>
                               <td className="px-10 py-6 text-center font-black text-lg">{item.stock} {item.unit}</td>
                               <td className="px-10 py-6 text-center">
                                  {status === 'Out' ? (
                                    <span className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase">สินค้าหมด</span>
                                  ) : status === 'Low' ? (
                                    <span className="bg-orange-50 text-orange-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase">สินค้าใกล้หมด (Min: {item.minStock})</span>
                                  ) : (
                                    <span className="bg-green-50 text-green-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase">ปกติ</span>
                                  )}
                               </td>
                            </tr>
                         );
                      })}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {/* Adjust, Report, Consignment Tabs stay original */}
        {activeTab === 'adjust' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm"><form onSubmit={handleAdjustSubmit} className="space-y-6"><select className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 font-bold" value={selectedAdjustId} onChange={e => setSelectedAdjustId(e.target.value)}><option value="">-- เลือกสินค้า --</option>{inventory.map(i => <option key={i.id} value={i.id}>{i.name} ({i.stock})</option>)}</select><div className="flex bg-[#F5F6FA] p-1.5 rounded-[22px] gap-2"><button type="button" onClick={() => setAdjustMode('Add')} className={cn("flex-1 py-3 rounded-[18px]", adjustMode === 'Add' ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400")}>Add (+)</button><button type="button" onClick={() => setAdjustMode('Set')} className={cn("flex-1 py-3 rounded-[18px]", adjustMode === 'Set' ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400")}>Set (=)</button></div><input type="number" className="w-full bg-[#F5F6FA] rounded-2xl px-6 py-4 text-xl font-black" value={adjustQty} onChange={e => setAdjustQty(e.target.value)}/><button type="submit" className="w-full bg-[#1A1F3D] text-white py-5 rounded-[28px] font-black shadow-xl">บันทึกรายการ</button></form></div>
            <div className="lg:col-span-2 bg-white rounded-[48px] border border-gray-100 overflow-hidden flex flex-col"><div className="p-8 border-b bg-gray-50/50 font-black">STOCK LOG</div><div className="flex-1 overflow-y-auto"><table className="w-full"><thead><tr className="bg-gray-50/30"><th>Time</th><th>Item</th><th>Old</th><th>New</th><th>Reason</th></tr></thead><tbody className="divide-y">{stockLogs.map(log => (<tr key={log.id}><td className="p-5">{format(new Date(log.timestamp), 'HH:mm')}</td><td className="font-black">{log.productName}</td><td className="text-center">{log.oldQty}</td><td className="text-center font-black">{log.newQty}</td><td>{log.reason}</td></tr>))}</tbody></table></div></div>
          </div>
        )}

        {activeTab === 'report' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <section className="bg-white p-10 rounded-[48px] space-y-8"><h3 className="text-xl font-black">Bill Customization</h3><div className="space-y-4"><div><label className="text-[10px] font-black uppercase text-gray-400 px-2">ชื่อหัวบิล</label><input className="w-full bg-[#F5F6FA] rounded-2xl px-6 py-4" value={shopName} onChange={e => updateBusinessProfile({ shopName: e.target.value })}/></div></div></section>
            <div className="flex flex-col items-center"><div className="bg-white w-full aspect-[210/297] shadow-2xl p-10 flex flex-col font-serif" id="a4-preview"><div className="border-b-2 border-black pb-8 mb-8"><h2 className="text-xl font-bold uppercase">{shopName}</h2><p className="text-[8px] text-gray-600">{shopAddress}</p></div><table className="w-full text-[10px] border-collapse mb-10"><thead><tr className="border-y border-black"><th className="py-2 text-left">Item</th><th className="py-2 text-center">Qty</th><th className="py-2 text-right">Price</th></tr></thead><tbody>{inventory.slice(0, 3).map(i => (<tr key={i.id}><td className="py-3">{i.name}</td><td className="py-3 text-center">{i.stock}</td><td className="py-3 text-right">฿{i.price}</td></tr>))}</tbody></table></div><div className="flex gap-4 mt-10"><button onClick={generatePDF} className="bg-[#1A1F3D] text-white px-10 py-5 rounded-[24px] font-black flex items-center gap-3"><Download size={20}/> Download PDF</button></div></div>
          </div>
        )}

        {activeTab === 'consignment' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{partners.map(v => (
            <div key={v.id} className="bg-white p-8 rounded-[40px] border shadow-sm relative overflow-hidden"><div className="flex justify-between items-start mb-6"><div className="w-16 h-16 bg-[#1A1F3D] text-white rounded-[24px] flex items-center justify-center"><Users size={24}/></div><div className="flex gap-1"><button onClick={() => { setEditingPartner(v); setIsVendorModalOpen(true); }} className="p-2 text-gray-300 hover:text-[#1A1F3D]"><Edit3 size={18}/></button><button onClick={() => deleteVendor(v.id)} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={18}/></button></div></div><h3 className="text-xl font-black text-[#1A1F3D]">{v.companyName}</h3></div>
          ))}</div>
        )}
      </div>

      {isItemModalOpen && <InventoryModal item={editingItem} onClose={() => setIsItemModalOpen(false)} />}
      {isVendorModalOpen && <VendorModal vendor={editingPartner} onClose={() => setIsVendorModalOpen(false)} />}
    </div>
  );
};

export default Inventory;