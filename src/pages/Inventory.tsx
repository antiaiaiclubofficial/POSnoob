"use client";

import React, { useState, useMemo } from 'react';
import { 
  LayoutGrid, AlertTriangle, PlusCircle, FileText, Users, BarChart3, 
  Search, Edit3, Package, Download, Save, Printer, Trash2, ArrowRight,
  TrendingUp, DollarSign, Building2, Plus, Tag, AlertCircle, History, RotateCcw, ArrowUp, Eye
} from 'lucide-react';
import { useStore, InventoryItem, Partner, StockLog } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import InventoryModal from '@/components/InventoryModal';
import VendorModal from '@/components/VendorModal';
import VendorInventoryView from '@/components/VendorInventoryView';

type WmsTab = 'master' | 'check' | 'adjust' | 'report' | 'consignment' | 'dashboard';

const Inventory = () => {
  const { 
    inventory, partners, stockLogs, shopName, adjustStock, deleteInventoryItem, deleteVendor, currency, language 
  } = useStore();
  
  const [activeTab, setActiveTab] = useState<WmsTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Modals
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Partner | null>(null);
  const [viewVendorDetails, setViewVendorDetails] = useState<Partner | null>(null);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'master', label: 'สินค้าทั้งหมด', icon: LayoutGrid },
    { id: 'check', label: 'สต็อกต่ำ', icon: AlertTriangle },
    { id: 'adjust', label: 'ปรับยอด', icon: PlusCircle },
    { id: 'consignment', label: 'คู่ค้าฝากขาย', icon: Users },
  ];

  const categories = useMemo(() => Array.from(new Set(inventory.map(i => i.category))).filter(Boolean), [inventory]);

  const filteredInventory = useMemo(() => {
    return inventory.filter(i => {
      const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.barcode?.includes(searchQuery);
      const matchesCategory = !categoryFilter || i.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [inventory, searchQuery, categoryFilter]);

  const stats = useMemo(() => {
    const totalValue = inventory.reduce((acc, i) => acc + (i.costPrice * i.stock), 0);
    const retailValue = inventory.reduce((acc, i) => acc + (i.price * i.stock), 0);
    const lowStock = inventory.filter(i => i.stock > 0 && i.stock <= i.minStock).length;
    const outOfStock = inventory.filter(i => i.stock === 0).length;

    return { totalValue, retailValue, lowStock, outOfStock };
  }, [inventory]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Stock Report - ${shopName}`, 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [['Product', 'Category', 'Stock', 'Cost', 'Retail']],
      body: inventory.map(i => [i.name, i.category, `${i.stock} ${i.unit}`, i.costPrice, i.price]),
    });
    doc.save('inventory-report.pdf');
    toast.success("PDF Report Generated");
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8F9FD] overflow-hidden">
      <header className="px-10 py-8 bg-white border-b border-gray-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pl-14 lg:pl-10 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-[#1A1F3D] mb-1">Inventory & WMS</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Global Asset Control</p>
        </div>
        <div className="flex bg-[#F5F6FA] p-1.5 rounded-[28px] border border-gray-100 shadow-sm gap-1 overflow-x-auto scrollbar-hide">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id as WmsTab)} className={cn("px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap", activeTab === item.id ? "bg-[#1A1F3D] text-white shadow-lg" : "text-gray-400 hover:bg-white")}>
              <item.icon size={14} /> {item.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6"><Package size={24}/></div>
                <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Total SKUs</p>
                <h2 className="text-4xl font-black text-[#1A1F3D]">{inventory.length}</h2>
              </div>
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mb-6"><TrendingUp size={24}/></div>
                <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Asset Value (Cost)</p>
                <h2 className="text-4xl font-black text-[#1A1F3D]">{currency}{stats.totalValue.toLocaleString()}</h2>
              </div>
              <div className="bg-white p-8 rounded-[40px] border border-orange-100 shadow-sm">
                <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mb-6"><AlertTriangle size={24}/></div>
                <p className="text-[10px] font-black uppercase text-orange-400 mb-1">Low Stock</p>
                <h2 className="text-4xl font-black text-orange-600">{stats.lowStock}</h2>
              </div>
              <div className="bg-[#1A1F3D] p-8 rounded-[40px] shadow-xl">
                <div className="w-12 h-12 bg-white/10 text-[#D9ED5F] rounded-2xl flex items-center justify-center mb-6"><DollarSign size={24}/></div>
                <p className="text-[10px] font-black uppercase text-white/40 mb-1">Potential Retail Value</p>
                <h2 className="text-4xl font-black text-white">{currency}{stats.retailValue.toLocaleString()}</h2>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[48px] border border-gray-100">
               <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black text-[#1A1F3D]">Stock Operations Center</h3>
                  <button onClick={handleExportPDF} className="flex items-center gap-2 text-xs font-black text-blue-500 uppercase tracking-widest"><FileText size={16}/> Export Stock PDF</button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="p-8 bg-blue-50/50 rounded-[40px] border border-blue-100">
                     <p className="text-[10px] font-black uppercase text-blue-600 mb-4">Quick Adjust Stock</p>
                     <div className="relative mb-4">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300" size={18} />
                        <input className="w-full bg-white border-none rounded-2xl pl-12 pr-6 py-4 text-sm font-bold shadow-sm" placeholder="Search product to adjust..." />
                     </div>
                     <p className="text-[10px] text-blue-400 font-bold italic">* Use Master Tab for full inventory control</p>
                  </div>
                  <div className="p-8 bg-gray-50/50 rounded-[40px] border border-gray-100 flex items-center justify-center gap-6">
                     <div className="text-center">
                        <p className="text-3xl font-black text-[#1A1F3D]">{partners.length}</p>
                        <p className="text-[10px] font-black uppercase text-gray-400">Active Partners</p>
                     </div>
                     <div className="h-10 w-px bg-gray-200" />
                     <div className="text-center">
                        <p className="text-3xl font-black text-[#1A1F3D]">{inventory.filter(i => i.isConsignment).length}</p>
                        <p className="text-[10px] font-black uppercase text-gray-400">Consigned Items</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'master' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
             <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-6 py-4 text-sm font-bold" placeholder="Search by name or barcode..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  </div>
                  <select className="bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold appearance-none" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <button onClick={() => { setEditingItem(null); setIsItemModalOpen(true); }} className="bg-[#1A1F3D] text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all">
                  <Plus size={20} className="inline mr-2" /> New Product
                </button>
             </div>

             <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                   <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50/50">
                           <th className="px-8 py-6 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest">Product / Barcode</th>
                           <th className="px-8 py-6 text-center text-[10px] font-black uppercase text-gray-400 tracking-widest">Category</th>
                           <th className="px-8 py-6 text-center text-[10px] font-black uppercase text-gray-400 tracking-widest">Stock</th>
                           <th className="px-8 py-6 text-center text-[10px] font-black uppercase text-gray-400 tracking-widest">Cost/Retail</th>
                           <th className="px-8 py-6 text-right text-[10px] font-black uppercase text-gray-400 tracking-widest">Manage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                         {filteredInventory.map(item => (
                           <tr key={item.id} className="group hover:bg-[#F8F9FD] transition-colors">
                              <td className="px-8 py-6">
                                 <p className="text-sm font-black text-[#1A1F3D]">{item.name}</p>
                                 <p className="text-[10px] text-gray-400 font-bold">{item.barcode || 'No Barcode'}</p>
                              </td>
                              <td className="px-8 py-6 text-center">
                                 <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">{item.category}</span>
                              </td>
                              <td className="px-8 py-6 text-center">
                                 <p className={cn("text-sm font-black", item.stock <= item.minStock ? "text-orange-500" : "text-[#1A1F3D]")}>{item.stock} {item.unit}</p>
                                 {item.stock <= item.minStock && <p className="text-[8px] font-black text-orange-400 uppercase tracking-tighter">Low Stock</p>}
                              </td>
                              <td className="px-8 py-6 text-center">
                                 <p className="text-[10px] text-gray-400 font-bold">{currency}{item.costPrice.toLocaleString()}</p>
                                 <p className="text-sm font-black text-blue-600">{currency}{item.price.toLocaleString()}</p>
                              </td>
                              <td className="px-8 py-6 text-right">
                                 <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingItem(item); setIsItemModalOpen(true); }} className="p-3 text-gray-400 hover:text-[#1A1F3D] bg-white rounded-xl shadow-sm"><Edit3 size={16}/></button>
                                    <button onClick={() => deleteInventoryItem(item.id)} className="p-3 text-gray-400 hover:text-red-500 bg-white rounded-xl shadow-sm"><Trash2 size={16}/></button>
                                 </div>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'consignment' && (
           <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-center bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                 <div>
                    <h3 className="text-2xl font-black text-[#1A1F3D]">Partners & Consignment</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Manage vendor shares and inventories</p>
                 </div>
                 <button onClick={() => { setSelectedVendor(null); setIsVendorModalOpen(true); }} className="bg-[#1A1F3D] text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl active:scale-95 transition-all">
                    <Plus size={20} /> Add Partner
                 </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                 {partners.map(partner => (
                    <div key={partner.id} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-8 opacity-5 text-[#1A1F3D]"><Building2 size={80} /></div>
                       <div className="flex justify-between items-start mb-8">
                          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[24px] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"><Building2 size={28}/></div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => { setSelectedVendor(partner); setIsVendorModalOpen(true); }} className="p-2 text-gray-400 hover:text-[#1A1F3D] rounded-xl"><Edit3 size={18}/></button>
                             <button onClick={() => deleteVendor(partner.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-xl"><Trash2 size={18}/></button>
                          </div>
                       </div>
                       
                       <div className="mb-8">
                          <h4 className="text-xl font-black text-[#1A1F3D] mb-1 line-clamp-1">{partner.companyName}</h4>
                          <div className="flex items-center gap-2">
                             <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">Share: {partner.gpRate}%</span>
                             <span className="text-[10px] text-gray-400 font-bold uppercase">{partner.mainCategory || 'Supplies'}</span>
                          </div>
                       </div>

                       <div className="pt-6 border-t border-gray-50 flex gap-3">
                          <button onClick={() => setViewVendorDetails(partner)} className="flex-1 bg-[#F5F6FA] hover:bg-[#1A1F3D] hover:text-white text-[#1A1F3D] font-black text-[10px] uppercase py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
                             <Eye size={14} /> View Stock
                          </button>
                       </div>
                    </div>
                 ))}
                 {partners.length === 0 && (
                   <div className="col-span-full py-20 text-center opacity-20"><Users size={48} className="mx-auto mb-4"/><p className="font-black">No partners registered yet</p></div>
                 )}
              </div>
           </div>
        )}
      </div>

      {isItemModalOpen && <InventoryModal item={editingItem} onClose={() => setIsItemModalOpen(false)} />}
      {isVendorModalOpen && <VendorModal vendor={selectedVendor} onClose={() => setIsVendorModalOpen(false)} />}
      {viewVendorDetails && <VendorInventoryView vendor={viewVendorDetails} onClose={() => setViewVendorDetails(null)} />}
    </div>
  );
};

export default Inventory;