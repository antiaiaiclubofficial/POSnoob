"use client";

import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, Package, ClipboardCheck, PlusCircle, FileText, Users,
  Search, Filter, AlertTriangle, ArrowUpRight, ArrowDownRight, Download,
  Printer, Save, Edit3, Trash2, Barcode, DollarSign, TrendingUp, PieChart as PieIcon,
  ChevronRight, CheckCircle2, History, PackagePlus, ArrowDownCircle, Plus
} from 'lucide-react';
import { useStore, InventoryItem, Vendor, StockLog } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import InventoryModal from '@/components/InventoryModal';
import VendorModal from '@/components/VendorModal';

type WmsTab = 'dashboard' | 'master' | 'check' | 'adjust' | 'report' | 'partners';

const Inventory = () => {
  const { 
    inventory, vendors, stockLogs, transactions, systemSettings, currency, language,
    adjustStock, updateSystemSettings, deleteVendor
  } = useStore();
  
  const [activeTab, setActiveTab] = useState<WmsTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterOwner, setFilterOwner] = useState('All');

  // Adjustment Form State
  const [selectedAdjustId, setSelectedAdjustId] = useState('');
  const [adjustMode, setAdjustMode] = useState<'Add' | 'Adjust'>('Add');
  const [adjustValue, setAdjustValue] = useState('');
  const [adjustReason, setAdjustNote] = useState('');

  // Modals
  const [isInvModalOpen, setIsInvModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  // --- Calculations & Logic ---
  const filteredItems = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.barcode?.includes(searchQuery);
      const matchesCat = filterCategory === 'All' || item.category === filterCategory;
      const matchesOwner = filterOwner === 'All' || 
                          (filterOwner === 'Self' && !item.isConsignment) || 
                          (filterOwner === 'Partner' && item.isConsignment);
      return matchesSearch && matchesCat && matchesOwner;
    });
  }, [inventory, searchQuery, filterCategory, filterOwner]);

  const stats = useMemo(() => {
    const totalValue = inventory.reduce((acc, i) => acc + (i.costPrice * i.stock), 0);
    const lowStock = inventory.filter(i => i.stock > 0 && i.stock <= i.minStock).length;
    const outOfStock = inventory.filter(i => i.stock === 0).length;
    return { totalValue, lowStock, outOfStock, totalSKUs: inventory.length };
  }, [inventory]);

  const handleExportCSV = () => {
    const headers = ["Barcode", "Name", "Stock", "Status"];
    const rows = inventory.map(i => [
      i.barcode || '-', 
      i.name, 
      i.stock, 
      i.stock === 0 ? "Out of Stock" : i.stock <= i.minStock ? "Low Stock" : "Normal"
    ]);
    const content = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_status_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success("Inventory exported to CSV");
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdjustId || !adjustValue || !adjustReason) {
      toast.error("Please fill all fields");
      return;
    }
    adjustStock(selectedAdjustId, Number(adjustValue), adjustMode, adjustReason);
    toast.success("Stock updated successfully");
    setAdjustValue(''); setAdjustNote('');
  };

  // --- UI Components ---

  const SidebarItem = ({ id, label, icon: Icon }: { id: WmsTab, label: string, icon: any }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-2xl transition-all group",
        activeTab === id ? "bg-[#1A1F3D] text-white shadow-lg" : "text-gray-400 hover:bg-gray-50 hover:text-[#1A1F3D]"
      )}
    >
      <Icon size={20} className={cn(activeTab === id ? "text-[#D9ED5F]" : "group-hover:scale-110 transition-transform")} />
      <span className="text-xs font-black uppercase tracking-wider">{label}</span>
    </button>
  );

  return (
    <div className="flex-1 flex overflow-hidden bg-[#F8F9FD]">
      {/* Module Navigation */}
      <aside className="w-72 border-r border-gray-100 bg-white flex flex-col shrink-0 p-6 pt-24 lg:pt-10">
        <div className="mb-10 px-4">
          <h1 className="text-2xl font-black text-[#1A1F3D] mb-1">WMS & Consign</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Inventory Management</p>
        </div>
        <nav className="space-y-1">
          <SidebarItem id="dashboard" label="Dashboard" icon={LayoutDashboard} />
          <SidebarItem id="master" label="Product Master" icon={Package} />
          <SidebarItem id="check" label="Stock Check" icon={ClipboardCheck} />
          <SidebarItem id="adjust" label="Adjustment" icon={PlusCircle} />
          <SidebarItem id="partners" label="Partners" icon={Users} />
          <SidebarItem id="report" label="A4 Report" icon={FileText} />
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="px-10 py-8 shrink-0 bg-white border-b border-gray-100 flex justify-between items-center z-10">
           <h2 className="text-xl font-black text-[#1A1F3D] uppercase tracking-tight">
             {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module
           </h2>
           <button 
             onClick={() => activeTab === 'partners' ? setIsVendorModalOpen(true) : setIsInvModalOpen(true)}
             className="bg-[#1A1F3D] text-white px-6 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 shadow-xl"
           >
             <Plus size={16} /> {activeTab === 'partners' ? 'Add Partner' : 'Add Product'}
           </button>
        </header>

        <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
          {/* หน้าที่ 6: Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6"><Package size={24} /></div>
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Total SKUs</p>
                    <h2 className="text-4xl font-black text-[#1A1F3D]">{stats.totalSKUs}</h2>
                 </div>
                 <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                    <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mb-6"><DollarSign size={24} /></div>
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Stock Value</p>
                    <h2 className="text-3xl font-black text-[#1A1F3D]">{currency}{stats.totalValue.toLocaleString()}</h2>
                 </div>
                 <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                    <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mb-6"><AlertTriangle size={24} /></div>
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Low Stock</p>
                    <h2 className="text-4xl font-black text-orange-500">{stats.lowStock}</h2>
                 </div>
                 <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                    <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6"><Trash2 size={24} /></div>
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Out of Stock</p>
                    <h2 className="text-4xl font-black text-red-500">{stats.outOfStock}</h2>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-black mb-8 flex items-center gap-2"><TrendingUp size={20} className="text-blue-500" /> Best Sellers</h3>
                    <div className="h-64">
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={inventory.slice(0, 5)}>
                             <XAxis dataKey="name" hide />
                             <Tooltip />
                             <Bar dataKey="price" fill="#1A1F3D" radius={[10, 10, 0, 0]} />
                          </BarChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
                 <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-black mb-8 flex items-center gap-2"><PieIcon size={20} className="text-purple-500" /> Stock Split</h3>
                    <div className="h-64">
                       <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                             <Pie data={[{ name: 'Self', value: inventory.filter(i=>!i.isConsignment).length }, { name: 'Partners', value: inventory.filter(i=>i.isConsignment).length }]} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                <Cell fill="#1A1F3D" /><Cell fill="#D9ED5F" />
                             </Pie>
                             <Tooltip />
                          </PieChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* หน้าที่ 1: Product Master List */}
          {activeTab === 'master' && (
            <div className="space-y-6">
               <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold shadow-sm" placeholder="Search by name or barcode..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  </div>
                  <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
                     <button onClick={() => setFilterOwner('All')} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all", filterOwner === 'All' ? "bg-[#1A1F3D] text-white" : "text-gray-400")}>All</button>
                     <button onClick={() => setFilterOwner('Self')} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all", filterOwner === 'Self' ? "bg-[#1A1F3D] text-white" : "text-gray-400")}>Shop</button>
                     <button onClick={() => setFilterOwner('Partner')} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all", filterOwner === 'Partner' ? "bg-[#1A1F3D] text-white" : "text-gray-400")}>Partner</button>
                  </div>
               </div>

               <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full">
                     <thead>
                        <tr className="bg-gray-50/50">
                           <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">Product</th>
                           <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">Category</th>
                           <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">Cost</th>
                           <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">Retail</th>
                           <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">Ownership</th>
                           <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">Action</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                        {filteredItems.map(item => (
                          <tr key={item.id} className="hover:bg-gray-50/30 transition-colors">
                             <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                   <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                                      {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Package className="w-full h-full p-3 text-gray-300" />}
                                   </div>
                                   <div>
                                      <p className="font-black text-[#1A1F3D] text-sm">{item.name}</p>
                                      <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1"><Barcode size={10} /> {item.barcode || 'N/A'}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="px-8 py-6 text-xs font-bold text-gray-500">{item.category}</td>
                             <td className="px-8 py-6 text-center font-bold text-gray-400">{currency}{item.costPrice.toLocaleString()}</td>
                             <td className="px-8 py-6 text-center font-black text-[#1A1F3D]">{currency}{item.price.toLocaleString()}</td>
                             <td className="px-8 py-6 text-center">
                                <span className={cn(
                                   "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter",
                                   item.isConsignment ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                                )}>
                                   {item.isConsignment ? "Consignment" : "Internal"}
                                </span>
                             </td>
                             <td className="px-8 py-6 text-right">
                                <button onClick={() => { setEditingItem(item); setIsInvModalOpen(true); }} className="p-2 text-gray-300 hover:text-[#1A1F3D] transition-colors"><Edit3 size={16}/></button>
                             </td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          )}

          {/* หน้าที่ 2: Stock Check & Alerts */}
          {activeTab === 'check' && (
            <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                     <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Real-time Stock Monitoring</p>
                  </div>
                  <button onClick={handleExportCSV} className="bg-[#1A1F3D] text-[#D9ED5F] px-5 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg"><Download size={14}/> Export CSV</button>
               </div>

               <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full">
                     <thead>
                        <tr className="bg-gray-50/50">
                           <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">Product Name</th>
                           <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">Min. Alert</th>
                           <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">In Stock</th>
                           <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">Status</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                        {inventory.map(item => {
                          const status = item.stock === 0 ? 'Out' : item.stock <= item.minStock ? 'Low' : 'Normal';
                          return (
                            <tr key={item.id}>
                               <td className="px-8 py-6 font-black text-[#1A1F3D] text-sm">{item.name}</td>
                               <td className="px-8 py-6 text-center font-bold text-gray-400">{item.minStock}</td>
                               <td className="px-8 py-6 text-center">
                                  <span className={cn("text-lg font-black", status === 'Out' ? "text-red-500" : status === 'Low' ? "text-orange-500" : "text-[#1A1F3D]")}>
                                     {item.stock} <span className="text-[10px] uppercase font-bold text-gray-300 ml-1">{item.unit}</span>
                                  </span>
                               </td>
                               <td className="px-8 py-6 text-right">
                                  <span className={cn(
                                     "px-3 py-1 rounded-full text-[9px] font-black uppercase",
                                     status === 'Out' ? "bg-red-50 text-red-600 border border-red-100" : status === 'Low' ? "bg-orange-50 text-orange-600 border border-orange-100" : "bg-green-50 text-green-600 border border-green-100"
                                  )}>
                                     {status === 'Out' ? 'Empty' : status === 'Low' ? 'Low Stock' : 'Stable'}
                                  </span>
                               </td>
                            </tr>
                          );
                        })}
                     </tbody>
                  </table>
               </div>
            </div>
          )}

          {/* หน้าที่ 3: Stock Adjustment */}
          {activeTab === 'adjust' && (
            <div className="space-y-10">
               <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm max-w-2xl mx-auto">
                  <div className="flex items-center gap-4 mb-10">
                     <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[20px] flex items-center justify-center"><PackagePlus size={28} /></div>
                     <div><h3 className="text-xl font-black text-[#1A1F3D]">Update Inventory</h3><p className="text-xs text-gray-400">Add stock or adjust actual count manually.</p></div>
                  </div>

                  <form onSubmit={handleAdjustSubmit} className="space-y-8">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">1. Select Product</label>
                        <select className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 font-bold text-sm" value={selectedAdjustId} onChange={e => setSelectedAdjustId(e.target.value)}>
                           <option value="">-- Choose Item --</option>
                           {inventory.map(i => <option key={i.id} value={i.id}>{i.name} (Current: {i.stock})</option>)}
                        </select>
                     </div>

                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">2. Select Mode</label>
                        <div className="flex gap-2 bg-[#F5F6FA] p-1.5 rounded-[22px]">
                           <button type="button" onClick={() => setAdjustMode('Add')} className={cn("flex-1 py-3 rounded-[18px] text-[10px] font-black uppercase transition-all", adjustMode === 'Add' ? "bg-[#1A1F3D] text-white shadow-lg" : "text-gray-400")}>Mode: Add (+)</button>
                           <button type="button" onClick={() => setAdjustMode('Adjust')} className={cn("flex-1 py-3 rounded-[18px] text-[10px] font-black uppercase transition-all", adjustMode === 'Adjust' ? "bg-[#1A1F3D] text-white shadow-lg" : "text-gray-400")}>Mode: Adjust (=)</button>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">3. New Quantity</label>
                           <input type="number" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 font-black text-lg text-center" placeholder="0" value={adjustValue} onChange={e => setAdjustValue(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">4. Reason</label>
                           <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 font-bold text-sm" placeholder="e.g. Broken, Restock..." value={adjustReason} onChange={e => setAdjustNote(e.target.value)} />
                        </div>
                     </div>

                     <button type="submit" className="w-full bg-[#1A1F3D] text-white font-black py-5 rounded-[28px] shadow-xl shadow-[#1A1F3D]/20 active:scale-95 transition-all">Execute Adjustment</button>
                  </form>
               </div>

               <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-gray-50 flex items-center justify-between"><h4 className="text-sm font-black uppercase tracking-widest">Adjustment Logs</h4><History className="text-gray-300" size={18} /></div>
                  <table className="w-full">
                     <tbody className="divide-y divide-gray-50">
                        {[...stockLogs].reverse().map(log => (
                          <tr key={log.id}>
                             <td className="px-8 py-5 text-[10px] font-bold text-gray-300">{format(new Date(log.timestamp), 'dd MMM HH:mm')}</td>
                             <td className="px-8 py-5 font-black text-sm">{log.productName}</td>
                             <td className="px-8 py-5 text-center">
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-gray-50 text-gray-400">
                                   {log.action}
                                </span>
                             </td>
                             <td className="px-8 py-5 text-center"><span className="text-xs font-bold text-gray-400">{log.previousStock}</span> <ChevronRight size={10} className="inline mx-2 text-gray-200" /> <span className="text-sm font-black text-[#1A1F3D]">{log.newStock}</span></td>
                             <td className="px-8 py-5 text-xs text-gray-500 font-medium italic">{log.reason}</td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          )}

          {/* หน้าที่ 4: Report Preview (A4 Sim) */}
          {activeTab === 'report' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
               {/* Setting Section */}
               <div className="lg:col-span-1 space-y-8">
                  <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                     <h3 className="text-lg font-black border-b border-gray-50 pb-4">Bill Settings</h3>
                     <div className="space-y-4">
                        <div className="space-y-1">
                           <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Company Name</label>
                           <input className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-xs font-bold" value={systemSettings.billHeader} onChange={e => updateSystemSettings({ billHeader: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Tax ID</label>
                           <input className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-xs font-bold" value={systemSettings.taxId} onChange={e => updateSystemSettings({ taxId: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Address</label>
                           <textarea className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-xs font-bold h-24 resize-none" value={systemSettings.companyAddress} onChange={e => updateSystemSettings({ companyAddress: e.target.value })} />
                        </div>
                     </div>
                  </div>
               </div>

               {/* A4 Preview Section */}
               <div className="lg:col-span-2 flex flex-col items-center">
                  <div className="mb-6 flex gap-4">
                     <button className="bg-white text-[#1A1F3D] px-6 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 border border-gray-100 shadow-sm"><Download size={14}/> Download PDF</button>
                     <button className="bg-[#1A1F3D] text-[#D9ED5F] px-6 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-xl"><Printer size={14}/> Print Bill</button>
                  </div>
                  
                  {/* A4 Canvas Simulation */}
                  <div className="bg-white w-[210mm] min-h-[297mm] shadow-2xl p-16 flex flex-col font-serif text-[#1A1F3D] transform scale-75 origin-top lg:scale-100 overflow-hidden">
                     {/* A4 Header */}
                     <div className="flex justify-between items-start border-b-2 border-[#1A1F3D] pb-10 mb-10">
                        <div>
                           <h1 className="text-3xl font-bold uppercase mb-2">{systemSettings.billHeader}</h1>
                           <p className="text-[12px] opacity-70 leading-relaxed max-w-[400px]">{systemSettings.companyAddress}</p>
                           <p className="text-[12px] font-bold mt-2">TAX ID: {systemSettings.taxId}</p>
                        </div>
                        <div className="text-right">
                           <h2 className="text-2xl font-bold text-gray-300 mb-4">INVENTORY REPORT</h2>
                           <p className="text-xs font-bold uppercase">Date: {format(new Date(), 'dd MMMM yyyy')}</p>
                           <p className="text-[10px] opacity-40">Ref: INV-{Math.floor(Math.random()*10000)}</p>
                        </div>
                     </div>

                     {/* A4 Table */}
                     <div className="flex-1">
                        <table className="w-full border-collapse">
                           <thead>
                              <tr className="bg-[#F5F6FA] text-[11px] font-bold">
                                 <th className="border border-gray-200 px-4 py-3 text-left">ITEM DESCRIPTION</th>
                                 <th className="border border-gray-200 px-4 py-3 text-center">QTY</th>
                                 <th className="border border-gray-200 px-4 py-3 text-right">UNIT PRICE</th>
                                 <th className="border border-gray-200 px-4 py-3 text-right">TOTAL</th>
                              </tr>
                           </thead>
                           <tbody className="text-[11px]">
                              {inventory.slice(0, 8).map(i => (
                                 <tr key={i.id}>
                                    <td className="border border-gray-200 px-4 py-3 uppercase">{i.name}</td>
                                    <td className="border border-gray-200 px-4 py-3 text-center">{i.stock}</td>
                                    <td className="border border-gray-200 px-4 py-3 text-right">{i.price.toLocaleString()}</td>
                                    <td className="border border-gray-200 px-4 py-3 text-right">{(i.stock * i.price).toLocaleString()}</td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>

                     {/* A4 Footer */}
                     <div className="mt-10 pt-10 border-t border-dashed border-gray-200">
                        <div className="flex justify-between items-end">
                           <div className="space-y-16">
                              <div className="flex gap-20">
                                 <div className="text-center">
                                    <div className="w-40 border-b border-[#1A1F3D] mb-2" />
                                    <p className="text-[10px] font-bold">PREPARED BY</p>
                                 </div>
                                 <div className="text-center">
                                    <div className="w-40 border-b border-[#1A1F3D] mb-2" />
                                    <p className="text-[10px] font-bold">RECEIVER SIGNATURE</p>
                                 </div>
                              </div>
                           </div>
                           <div className="text-right bg-[#F5F6FA] p-6 rounded-xl min-w-[200px]">
                              <p className="text-[10px] font-bold opacity-40 uppercase mb-1">Grand Total</p>
                              <p className="text-2xl font-bold">{currency}{inventory.reduce((acc, i) => acc + (i.price * i.stock), 0).toLocaleString()}</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* หน้าที่ 5: Consignment Management */}
          {activeTab === 'partners' && (
            <div className="space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {vendors.map(v => (
                    <div key={v.id} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
                       <div className="flex justify-between items-start mb-6">
                          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[20px] flex items-center justify-center font-black text-xl">{v.name.charAt(0)}</div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => { setEditingVendor(v); setIsVendorModalOpen(true); }} className="p-2 text-gray-300 hover:text-[#1A1F3D]"><Edit3 size={16}/></button>
                             <button onClick={() => deleteVendor(v.id)} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                          </div>
                       </div>
                       <h3 className="text-xl font-black text-[#1A1F3D] mb-1">{v.name}</h3>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">TAX ID: {v.taxId}</p>
                       
                       <div className="space-y-4 pt-6 border-t border-gray-50">
                          <div className="flex justify-between items-center bg-[#F5F6FA] px-4 py-3 rounded-2xl">
                             <span className="text-[10px] font-black uppercase text-gray-400">Shop Share (GP)</span>
                             <span className="text-sm font-black text-indigo-600">{v.consignmentRate}%</span>
                          </div>
                          <div className="flex justify-between px-2">
                             <span className="text-[9px] font-bold text-gray-300">Partner Payout</span>
                             <span className="text-[10px] font-black text-[#1A1F3D]">{100 - v.consignmentRate}%</span>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>
      </div>

      {isInvModalOpen && <InventoryModal item={editingItem} onClose={() => setIsInvModalOpen(false)} />}
      {isVendorModalOpen && <VendorModal vendor={editingVendor} onClose={() => setIsVendorModalOpen(false)} />}
    </div>
  );
};

export default Inventory;