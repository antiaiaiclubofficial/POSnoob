"use client";

import React, { useState, useMemo } from 'react';
import { 
  LayoutGrid, AlertTriangle, PlusCircle, FileText, Users, BarChart3, 
  Search, Edit3, Package, Download, Save, Printer, Trash2, ArrowRight,
  TrendingUp, DollarSign, PieChart as PieIcon, LineChart as LineIcon, BarChart as BarIcon,
  ChevronRight, Camera, CheckCircle2, Plus, Tag, Building2, Filter,
  AlertCircle, ArrowUpRight, RotateCcw
} from 'lucide-react';
import { useStore, InventoryItem, StockLog } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
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
  
  const [activeTab, setActiveTab] = useState<WmsTab>('master');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');

  // States for 'Check' tab
  const [checkSearch, setCheckSearch] = useState('');
  const [checkStatusFilter, setCheckStatusFilter] = useState<'All' | 'Low' | 'Out'>('All');

  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<any>(null);

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

  const categories = useMemo(() => {
    return Array.from(new Set(inventory.map(i => i.category))).filter(Boolean);
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    return inventory.filter(i => {
      const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           i.barcode?.includes(searchQuery);
      const matchesCategory = !categoryFilter || i.category === categoryFilter;
      const matchesPartner = !partnerFilter || i.partnerId === partnerFilter;
      
      return matchesSearch && matchesCategory && matchesPartner;
    });
  }, [inventory, searchQuery, categoryFilter, partnerFilter]);

  const filteredCheckItems = useMemo(() => {
    return inventory.filter(i => {
      const matchesSearch = i.name.toLowerCase().includes(checkSearch.toLowerCase()) || i.barcode?.includes(checkSearch);
      const status = i.stock === 0 ? 'Out' : i.stock <= i.minStock ? 'Low' : 'OK';
      const matchesStatus = checkStatusFilter === 'All' || status === checkStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [inventory, checkSearch, checkStatusFilter]);

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

  const handleQuickAdjust = (id: string) => {
    const newQty = prompt("ระบุจำนวนสต็อกที่ถูกต้อง:");
    if (newQty !== null && !isNaN(Number(newQty))) {
      adjustStock(id, Number(newQty), 'Set', 'Physical Audit Adjustment');
      toast.success("อัปเดตสต็อกเรียบร้อย");
    }
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

        {activeTab === 'master' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
               <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 w-full">
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
            </div>

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
                     </tbody>
                  </table>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'check' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
             <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex-1 w-full relative">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                   <input 
                      className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-6 py-4 text-sm font-bold"
                      placeholder="ค้นหาสินค้าเพื่อเช็คสต็อก..."
                      value={checkSearch}
                      onChange={e => setCheckSearch(e.target.value)}
                   />
                </div>
                <div className="flex bg-[#F5F6FA] p-1 rounded-2xl gap-1 shrink-0">
                   {(['All', 'Low', 'Out'] as const).map(status => (
                     <button
                        key={status}
                        onClick={() => setCheckStatusFilter(status)}
                        className={cn(
                          "px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all",
                          checkStatusFilter === status ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400"
                        )}
                     >
                        {status === 'All' ? 'ทั้งหมด' : status === 'Low' ? 'สต็อกต่ำ' : 'สินค้าหมด'}
                     </button>
                   ))}
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCheckItems.map(item => {
                  const status = item.stock === 0 ? 'Out' : item.stock <= item.minStock ? 'Low' : 'OK';
                  const progress = Math.min(100, (item.stock / (item.minStock * 2)) * 100);
                  
                  return (
                    <div key={item.id} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
                       <div className={cn(
                         "absolute top-0 left-0 w-2 h-full",
                         status === 'Out' ? "bg-red-500" : status === 'Low' ? "bg-orange-500" : "bg-green-500"
                       )} />
                       
                       <div className="flex justify-between items-start mb-6">
                          <div className="w-12 h-12 bg-[#F5F6FA] rounded-2xl flex items-center justify-center text-[#1A1F3D] group-hover:scale-110 transition-transform">
                             <Package size={24} />
                          </div>
                          <div className={cn(
                            "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter shadow-sm",
                            status === 'Out' ? "bg-red-50 text-red-600" : status === 'Low' ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600"
                          )}>
                             {status === 'Out' ? 'Out of Stock' : status === 'Low' ? 'Low Stock' : 'Optimal'}
                          </div>
                       </div>

                       <h3 className="text-lg font-black text-[#1A1F3D] mb-1 line-clamp-1">{item.name}</h3>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">{item.category}</p>

                       <div className="space-y-4">
                          <div className="flex justify-between items-end">
                             <div>
                                <p className="text-[9px] font-black text-gray-300 uppercase mb-1">Current Balance</p>
                                <p className="text-2xl font-black text-[#1A1F3D]">{item.stock} <span className="text-xs text-gray-400">{item.unit}</span></p>
                             </div>
                             <div className="text-right">
                                <p className="text-[9px] font-black text-gray-300 uppercase mb-1">Min. Required</p>
                                <p className="text-sm font-bold text-gray-400">{item.minStock}</p>
                             </div>
                          </div>

                          <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                             <div 
                                className={cn("h-full transition-all duration-1000", status === 'Out' ? "w-0" : status === 'Low' ? "bg-orange-400" : "bg-[#1A1F3D]")}
                                style={{ width: `${progress}%` }}
                             />
                          </div>

                          <div className="pt-4 border-t border-gray-50 flex gap-2">
                             <button 
                                onClick={() => handleQuickAdjust(item.id)}
                                className="flex-1 bg-[#F5F6FA] hover:bg-[#1A1F3D] hover:text-white text-[#1A1F3D] font-black text-[10px] uppercase py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                             >
                                <RotateCcw size={14} /> ปรับยอด
                             </button>
                             {status !== 'OK' && (
                               <button 
                                  onClick={() => { setSelectedAdjustId(item.id); setAdjustMode('Add'); setActiveTab('adjust'); }}
                                  className="flex-1 bg-[#D9ED5F] text-[#1A1F3D] font-black text-[10px] uppercase py-3 rounded-xl shadow-lg shadow-[#D9ED5F]/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
                               >
                                  <Plus size={14} /> เติมของ
                               </button>
                             )}
                          </div>
                       </div>
                    </div>
                  );
                })}
             </div>
             
             {filteredCheckItems.length === 0 && (
               <div className="py-32 flex flex-col items-center justify-center opacity-20 text-center">
                  <AlertCircle size={64} className="mb-4" />
                  <h2 className="text-2xl font-black uppercase">No Alerts Found</h2>
                  <p className="text-sm font-bold">All inventory items are currently above safety levels</p>
               </div>
             )}
          </div>
        )}
      </div>

      {isItemModalOpen && <InventoryModal item={editingItem} onClose={() => setIsItemModalOpen(false)} />}
      {isVendorModalOpen && <VendorModal vendor={editingPartner} onClose={() => setIsVendorModalOpen(false)} />}
    </div>
  );
};

export default Inventory;