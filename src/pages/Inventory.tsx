"use client";

import React, { useState, useMemo } from 'react';
import { 
  LayoutGrid, AlertTriangle, PlusCircle, FileText, Users, BarChart3, 
  Search, Edit3, Package, Download, Save, Printer, Trash2, ArrowRight,
  TrendingUp, DollarSign, PieChart as PieIcon, LineChart as LineIcon, BarChart as BarIcon,
  ChevronRight, Camera, CheckCircle2, Plus, Tag, Building2, Filter,
  AlertCircle, ArrowUpRight, RotateCcw, History, ArrowDown, ArrowUp, Info, Eye
} from 'lucide-react';
import { useStore, InventoryItem, StockLog, Partner } from '@/store/useStore';
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
import VendorInventoryView from '@/components/VendorInventoryView';

type WmsTab = 'master' | 'check' | 'adjust' | 'report' | 'consignment' | 'dashboard';

const Inventory = () => {
  const { 
    inventory, partners, stockLogs, shopName, shopAddress, shopPhone, shopLogo,
    adjustStock, deleteInventoryItem, deletePartner, currency, currentUser
  } = useStore();
  
  const [activeTab, setActiveTab] = useState<WmsTab>('master');
  
  // States for Master Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');

  // States for Check Tab
  const [checkSearch, setCheckSearch] = useState('');
  const [checkStatusFilter, setCheckStatusFilter] = useState<'All' | 'Low' | 'Out'>('All');

  // States for Adjust Tab
  const [adjustSearch, setAdjustSearch] = useState('');
  const [selectedAdjustId, setSelectedAdjustId] = useState('');
  const [adjustMode, setAdjustMode] = useState<'Add' | 'Set'>('Add');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  // Modals
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [selectedVendorForView, setSelectedVendorForView] = useState<Partner | null>(null);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'master', label: 'สินค้าทั้งหมด', icon: LayoutGrid },
    { id: 'check', label: 'เช็คสต็อก/แจ้งเตือน', icon: AlertTriangle },
    { id: 'adjust', label: 'เติม/ปรับยอด', icon: PlusCircle },
    { id: 'report', label: 'รายงาน PDF', icon: FileText },
    { id: 'consignment', label: 'คู่ค้าฝากขาย', icon: Users },
  ];

  // Logic: Filters
  const categories = useMemo(() => Array.from(new Set(inventory.map(i => i.category))).filter(Boolean), [inventory]);

  const filteredInventory = useMemo(() => {
    return inventory.filter(i => {
      const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.barcode?.includes(searchQuery);
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

  const adjustSearchItems = useMemo(() => {
    if (!adjustSearch) return [];
    return inventory.filter(i => i.name.toLowerCase().includes(adjustSearch.toLowerCase()) || i.barcode?.includes(adjustSearch)).slice(0, 5);
  }, [inventory, adjustSearch]);

  const selectedItemForAdjust = inventory.find(i => i.id === selectedAdjustId);

  // Logic: PDF Generation
  const generatePDFReport = () => {
    const doc = new jsPDF();
    const dateNow = format(new Date(), 'dd/MM/yyyy HH:mm');
    
    // Header
    doc.setFontSize(20);
    doc.text("รายงานสรุปสต็อกสินค้าคงเหลือ", 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(shopName, 105, 22, { align: 'center' });
    doc.text(`วันที่ออกรายงาน: ${dateNow}`, 105, 27, { align: 'center' });
    
    // Summary Stats
    const totalItems = inventory.length;
    const totalValue = inventory.reduce((acc, i) => acc + (i.costPrice * i.stock), 0);
    doc.text(`จำนวนรายการสินค้าทั้งหมด: ${totalItems} รายการ`, 10, 40);
    doc.text(`มูลค่าต้นทุนรวม: ${currency}${totalValue.toLocaleString()}`, 10, 45);

    // Table
    autoTable(doc, {
      startY: 55,
      head: [['รหัส/บาร์โค้ด', 'ชื่อสินค้า', 'ประเภท', 'จำนวน', 'หน่วย', 'ต้นทุน', 'ราคาขาย']],
      body: inventory.map(i => [
        i.barcode || '-',
        i.name,
        i.category,
        i.stock,
        i.unit,
        i.costPrice.toLocaleString(),
        i.price.toLocaleString()
      ]),
      styles: { font: 'helvetica', fontSize: 8 },
      headStyles: { fillColor: [26, 31, 61] }
    });

    doc.save(`Stock_Report_${format(new Date(), 'yyyyMMdd')}.pdf`);
    toast.success("ดาวน์โหลดรายงาน PDF เรียบร้อยแล้ว");
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdjustId || !adjustQty) {
      toast.error("กรุณาเลือกสินค้าและระบุจำนวน");
      return;
    }
    adjustStock(selectedAdjustId, Number(adjustQty), adjustMode, adjustReason || 'Manual Adjustment');
    toast.success("บันทึกการปรับยอดเรียบร้อย");
    setAdjustQty('');
    setAdjustReason('');
    setAdjustSearch('');
    setSelectedAdjustId('');
  };

  const handleQuickAdjust = (id: string) => {
    const newQty = prompt("ระบุจำนวนสต็อกที่ถูกต้อง:");
    if (newQty !== null && !isNaN(Number(newQty))) {
      adjustStock(id, Number(newQty), 'Set', 'Physical Audit');
      toast.success("อัปเดตสต็อกเรียบร้อย");
    }
  };

  const handleEditPartner = (p: Partner) => {
    setEditingPartner(p);
    setIsVendorModalOpen(true);
  };

  const handleDeletePartner = (id: string) => {
    if (window.confirm('ยืนยันการลบคู่ค้า? ข้อมูลสินค้าที่เกี่ยวข้องจะไม่ถูกลบแต่จะไม่มีผู้จัดจำหน่ายระบุไว้')) {
      deletePartner(id);
      toast.success('ลบข้อมูลคู่ค้าเรียบร้อย');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8F9FD] overflow-hidden">
      <header className="px-10 py-8 bg-white border-b border-gray-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pl-14 lg:pl-10 shrink-0">
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
        {/* Tab: Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm"><Package size={24} className="text-blue-500 mb-6"/><p className="text-[10px] font-black uppercase text-gray-400 mb-1">Total SKUs</p><h2 className="text-4xl font-black">{inventory.length}</h2></div>
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm"><DollarSign size={24} className="text-green-500 mb-6"/><p className="text-[10px] font-black uppercase text-gray-400 mb-1">Inventory Value</p><h2 className="text-4xl font-black">{currency}{inventory.reduce((a,b) => a+(b.costPrice*b.stock), 0).toLocaleString()}</h2></div>
              <div className="bg-white p-8 rounded-[40px] border border-orange-100 shadow-sm"><AlertTriangle size={24} className="text-orange-500 mb-6"/><p className="text-[10px] font-black uppercase text-orange-400 mb-1">Low Stock</p><h2 className="text-4xl font-black">{inventory.filter(i => i.stock > 0 && i.stock <= i.minStock).length}</h2></div>
              <div className="bg-white p-8 rounded-[40px] border border-red-100 shadow-sm"><Trash2 size={24} className="text-red-500 mb-6"/><p className="text-[10px] font-black uppercase text-red-400 mb-1">Out of Stock</p><h2 className="text-4xl font-black">{inventory.filter(i => i.stock === 0).length}</h2></div>
            </div>
          </div>
        )}

        {/* Tab: Master List */}
        {activeTab === 'master' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
               <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 w-full">
                     <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 px-2">ค้นหาสินค้า</label><div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} /><input className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-6 py-4 text-sm font-bold shadow-inner" placeholder="ค้นหา..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div></div>
                     <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 px-2">หมวดหมู่</label><select className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold shadow-inner appearance-none" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}><option value="">ทั้งหมด</option>{categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}</select></div>
                     <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 px-2">คู่ค้า</label><select className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold shadow-inner appearance-none" value={partnerFilter} onChange={e => setPartnerFilter(e.target.value)}><option value="">ทั้งหมด</option>{partners.map(p => (<option key={p.id} value={p.id}>{p.companyName}</option>))}</select></div>
                  </div>
                  <button onClick={() => { setEditingItem(null); setIsItemModalOpen(true); }} className="bg-[#1A1F3D] text-white px-10 py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all"><Plus size={20} className="inline mr-2" /> เพิ่มสินค้าใหม่</button>
               </div>
            </div>

            <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="w-full">
                     <thead><tr className="bg-gray-50/50"><th className="px-8 py-6 text-left text-[10px] font-black uppercase text-gray-400">สินค้า</th><th className="px-8 py-6 text-center text-[10px] font-black uppercase text-gray-400">ราคาขาย</th><th className="px-8 py-6 text-center text-[10px] font-black uppercase text-gray-400">สต็อก</th><th className="px-8 py-6 text-right text-[10px] font-black uppercase text-gray-400">จัดการ</th></tr></thead>
                     <tbody className="divide-y divide-gray-50">
                        {filteredInventory.map(item => (
                           <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-8 py-6 flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-50">{item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Package className="w-full h-full p-3 text-gray-300" />}</div><div><p className="text-sm font-black text-[#1A1F3D]">{item.name}</p><p className="text-[9px] font-black uppercase text-blue-500">{item.category}</p></div></td>
                              <td className="px-8 py-6 text-center text-sm font-black">฿{item.price.toLocaleString()}</td>
                              <td className="px-8 py-6 text-center font-black text-blue-600">{item.stock} {item.unit}</td>
                              <td className="px-8 py-6 text-right"><button onClick={() => { setEditingItem(item); setIsItemModalOpen(true); }} className="p-3 text-gray-300 hover:text-[#1A1F3D] hover:bg-white rounded-xl transition-all shadow-sm"><Edit3 size={16}/></button></td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          </div>
        )}

        {/* Tab: Check & Alerts */}
        {activeTab === 'check' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
             <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex-1 w-full relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} /><input className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-6 py-4 text-sm font-bold shadow-inner" placeholder="ค้นหาสินค้าเพื่อเช็คสต็อก..." value={checkSearch} onChange={e => setCheckSearch(e.target.value)} /></div>
                <div className="flex bg-[#F5F6FA] p-1 rounded-2xl gap-1 shrink-0">{(['All', 'Low', 'Out'] as const).map(status => (<button key={status} onClick={() => setCheckStatusFilter(status)} className={cn("px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all", checkStatusFilter === status ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400")}>{status === 'All' ? 'ทั้งหมด' : status === 'Low' ? 'สต็อกต่ำ' : 'สินค้าหมด'}</button>))}</div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCheckItems.map(item => {
                  const status = item.stock === 0 ? 'Out' : item.stock <= item.minStock ? 'Low' : 'OK';
                  return (
                    <div key={item.id} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
                       <div className={cn("absolute top-0 left-0 w-2 h-full", status === 'Out' ? "bg-red-500" : status === 'Low' ? "bg-orange-500" : "bg-green-500")} />
                       <div className="flex justify-between items-start mb-6"><div className="w-12 h-12 bg-[#F5F6FA] rounded-2xl flex items-center justify-center text-[#1A1F3D]"><Package size={24} /></div><div className={cn("px-3 py-1 rounded-lg text-[9px] font-black uppercase shadow-sm", status === 'Out' ? "bg-red-50 text-red-600" : status === 'Low' ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600")}>{status === 'Out' ? 'Out of Stock' : status === 'Low' ? 'Low Stock' : 'Optimal'}</div></div>
                       <h3 className="text-lg font-black text-[#1A1F3D] mb-1 line-clamp-1">{item.name}</h3>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">{item.category}</p>
                       <div className="space-y-4">
                          <div className="flex justify-between items-end"><div><p className="text-[9px] font-black text-gray-300 uppercase mb-1">Current Balance</p><p className="text-2xl font-black text-[#1A1F3D]">{item.stock} <span className="text-xs text-gray-400">{item.unit}</span></p></div><div className="text-right"><p className="text-[9px] font-black text-gray-300 uppercase mb-1">Min. Required</p><p className="text-sm font-bold text-gray-400">{item.minStock}</p></div></div>
                          <div className="pt-4 border-t border-gray-50 flex gap-2"><button onClick={() => handleQuickAdjust(item.id)} className="flex-1 bg-[#F5F6FA] hover:bg-[#1A1F3D] hover:text-white text-[#1A1F3D] font-black text-[10px] uppercase py-3 rounded-xl transition-all flex items-center justify-center gap-2"><RotateCcw size={14} /> ปรับยอด</button></div>
                       </div>
                    </div>
                  );
                })}
             </div>
          </div>
        )}

        {/* Tab: Adjust/Restock */}
        {activeTab === 'adjust' && (
           <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in slide-in-from-bottom-4 duration-300">
              <div className="lg:col-span-1"><div className="bg-white p-8 rounded-[48px] border border-gray-100 shadow-sm space-y-8"><div><h3 className="text-xl font-black text-[#1A1F3D] mb-1">Update Balance</h3><p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Add stock or set quantity</p></div><form onSubmit={handleAdjustSubmit} className="space-y-6"><div className="space-y-2 relative"><label className="text-[10px] font-black uppercase text-gray-400 px-2">1. ค้นหาสินค้า</label><div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} /><input className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-6 py-4 text-sm font-bold shadow-inner" placeholder="พิมพ์ชื่อหรือบาร์โค้ด..." value={adjustSearch} onChange={e => setAdjustSearch(e.target.value)} /></div>{adjustSearchItems.length > 0 && !selectedAdjustId && (<div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">{adjustSearchItems.map(item => (<button key={item.id} type="button" onClick={() => { setSelectedAdjustId(item.id); setAdjustSearch(item.name); }} className="w-full px-5 py-4 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0 flex justify-between items-center transition-colors"><div><p className="text-sm font-black text-[#1A1F3D]">{item.name}</p><p className="text-[10px] text-gray-400 font-bold uppercase">{item.barcode || 'No Barcode'}</p></div><p className="text-xs font-black text-blue-500">Stock: {item.stock}</p></button>))}</div>)}</div>{selectedItemForAdjust && (<div className="p-5 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-center gap-4 animate-in zoom-in-95"><div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm shrink-0"><Package size={24} /></div><div><p className="text-xs font-black text-[#1A1F3D]">{selectedItemForAdjust.name}</p><p className="text-[10px] text-blue-600 font-black uppercase">Current: {selectedItemForAdjust.stock}</p></div><button type="button" onClick={() => setSelectedAdjustId('')} className="ml-auto p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button></div>)}<div className="space-y-3"><label className="text-[10px] font-black uppercase text-gray-400 px-2">2. ประเภทการทำงาน</label><div className="flex bg-[#F5F6FA] p-1.5 rounded-[22px] gap-2"><button type="button" onClick={() => setAdjustMode('Add')} className={cn("flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2", adjustMode === 'Add' ? "bg-white text-green-600 shadow-sm" : "text-gray-400")}><ArrowUp size={12} /> เติมเพิ่ม</button><button type="button" onClick={() => setAdjustMode('Set')} className={cn("flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2", adjustMode === 'Set' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}><RotateCcw size={12} /> ปรับตามจริง</button></div></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 px-2">3. จำนวน</label><input type="number" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-xl font-black text-center" placeholder="0" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} /></div><div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 px-2">4. หมายเหตุ</label><input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" placeholder="..." value={adjustReason} onChange={e => setAdjustReason(e.target.value)} /></div></div><button type="submit" disabled={!selectedAdjustId || !adjustQty} className="w-full bg-[#1A1F3D] text-white font-black py-5 rounded-[28px] shadow-xl shadow-[#1A1F3D]/20 flex items-center justify-center gap-3 transition-all active:scale-95"><Save size={20} /> บันทึกการปรับสต็อก</button></form></div></div>
              <div className="lg:col-span-2"><div className="bg-white rounded-[48px] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full"><div className="p-8 border-b border-gray-50 flex items-center gap-3 bg-gray-50/20"><div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><History size={20} /></div><div><h3 className="text-xl font-black text-[#1A1F3D]">Movement History</h3><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Audit Trail</p></div></div><div className="flex-1 overflow-y-auto scrollbar-hide"><table className="w-full"><thead><tr className="bg-white border-b border-gray-50"><th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">Timestamp</th><th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">Product</th><th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">Action</th><th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">New Bal</th></tr></thead><tbody className="divide-y divide-gray-50">{stockLogs.map((log) => (<tr key={log.id} className="hover:bg-[#F8F9FD]"><td className="px-8 py-6"><p className="text-xs font-black text-[#1A1F3D]">{format(new Date(log.timestamp), 'HH:mm • dd MMM')}</p><p className="text-[9px] text-gray-400 font-bold uppercase">{log.staffName}</p></td><td className="px-8 py-6"><p className="text-sm font-black text-[#1A1F3D]">{log.productName}</p><p className="text-[9px] text-gray-400 font-bold italic line-clamp-1">"{log.reason}"</p></td><td className="px-8 py-6 text-center"><span className={cn("px-3 py-1 rounded-lg text-[8px] font-black uppercase", log.action === 'Add' || log.action === 'In' ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600")}>{log.action}</span></td><td className="px-8 py-6 text-right font-black text-[#1A1F3D]">{log.newQty}</td></tr>))}</tbody></table></div></div></div>
           </div>
        )}

        {/* Tab: Report (PDF) */}
        {activeTab === 'report' && (
           <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
              <div className="bg-white p-12 rounded-[48px] border border-gray-100 shadow-sm text-center space-y-8">
                 <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/10">
                    <FileText size={48} />
                 </div>
                 <div>
                    <h2 className="text-3xl font-black text-[#1A1F3D] mb-2">สรุปรายงานสินค้าคงเหลือ (PDF)</h2>
                    <p className="text-sm text-gray-400 font-medium max-w-md mx-auto leading-relaxed">
                       สร้างรายงานสรุปสินค้าทั้งหมดในสต็อกปัจจุบัน รวมถึงมูลค่าต้นทุนคงเหลือ เพื่อใช้สำหรับการตรวจสอบสต็อกประจำเดือนหรือส่งฝ่ายบัญชี
                    </p>
                 </div>
                 <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
                    <button onClick={generatePDFReport} className="bg-[#1A1F3D] text-white px-10 py-5 rounded-[24px] font-black text-sm flex items-center justify-center gap-3 shadow-2xl hover:scale-105 active:scale-95 transition-all">
                       <Download size={20} /> ดาวน์โหลดรายงาน A4
                    </button>
                    <button onClick={() => window.print()} className="bg-white border-2 border-gray-100 text-[#1A1F3D] px-10 py-5 rounded-[24px] font-black text-sm flex items-center justify-center gap-3 hover:bg-gray-50 transition-all">
                       <Printer size={20} /> พิมพ์ผ่านเครื่องพิมพ์
                    </button>
                 </div>
              </div>

              <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm">
                 <h3 className="text-xl font-black text-[#1A1F3D] mb-8">ตัวอย่างหัวข้อรายงาน</h3>
                 <div className="space-y-4 opacity-50 select-none grayscale">
                    <div className="h-6 bg-gray-100 rounded-full w-3/4" />
                    <div className="h-4 bg-gray-50 rounded-full w-full" />
                    <div className="h-4 bg-gray-50 rounded-full w-5/6" />
                    <div className="h-20 bg-gray-50 rounded-[24px] w-full" />
                 </div>
              </div>
           </div>
        )}

        {/* Tab: Consignment/Partners */}
        {activeTab === 'consignment' && (
           <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-center bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                 <div>
                    <h3 className="text-2xl font-black text-[#1A1F3D]">บริษัทคู่ค้า (Partners)</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">จัดการรายชื่อผู้จัดจำหน่ายและคู่ค้าฝากขาย</p>
                 </div>
                 <button onClick={() => { setEditingPartner(null); setIsVendorModalOpen(true); }} className="bg-[#1A1F3D] text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-[#1A1F3D]/10 active:scale-95 transition-all">
                    <Plus size={20} /> เพิ่มคู่ค้าใหม่
                 </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                 {partners.map(partner => (
                    <div key={partner.id} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-8 opacity-5 text-[#1A1F3D] pointer-events-none select-none z-0"><Building2 size={80} /></div>
                       <div className="flex justify-between items-start mb-6 relative z-10">
                          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[20px] flex items-center justify-center"><Building2 size={28}/></div>
                          <div className="flex gap-1">
                             <button onClick={() => handleEditPartner(partner)} className="p-2 text-gray-400 hover:text-[#1A1F3D] hover:bg-gray-50 rounded-xl transition-all"><Edit3 size={18}/></button>
                             <button onClick={() => handleDeletePartner(partner.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                          </div>
                       </div>
                       <div className="relative z-10">
                         <h4 className="text-xl font-black text-[#1A1F3D] mb-1">{partner.companyName}</h4>
                         <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mb-6">GP: {partner.gpRate}% (ส่วนแบ่งคู่ค้า)</p>
                         
                         <div className="pt-6 border-t border-gray-50 flex gap-3">
                            <button onClick={() => setSelectedVendorForView(partner)} className="flex-1 bg-[#F5F6FA] hover:bg-[#1A1F3D] hover:text-white text-[#1A1F3D] font-black text-[10px] uppercase py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
                               <Eye size={14} /> ดูสต็อกที่นี่
                            </button>
                         </div>
                       </div>
                    </div>
                 ))}
                 {partners.length === 0 && (
                   <div className="col-span-full py-20 text-center opacity-20"><Users size={48} className="mx-auto mb-4"/><p className="font-black">ไม่พบข้อมูลคู่ค้า</p></div>
                 )}
              </div>
           </div>
        )}
      </div>

      {isItemModalOpen && <InventoryModal item={editingItem} onClose={() => setIsItemModalOpen(false)} />}
      {isVendorModalOpen && <VendorModal partner={editingPartner} onClose={() => setIsVendorModalOpen(false)} />}
      {selectedVendorForView && <VendorInventoryView vendor={selectedVendorForView} onClose={() => setSelectedVendorForView(null)} />}
    </div>
  );
};

export default Inventory;