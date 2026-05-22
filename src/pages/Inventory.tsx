"use client";

import React, { useState, useMemo } from 'react';
import { 
  Plus, Search, Package, Edit3, Trash2, AlertTriangle, 
  TrendingUp, Download, History, Building2, Filter, 
  ArrowUpCircle, ArrowDownCircle, RefreshCw, Layers
} from 'lucide-react';
import { useStore, InventoryItem, Partner, StockLog } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { translations } from '@/utils/translations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InventoryModal from '@/components/InventoryModal';
import VendorModal from '@/components/VendorModal';
import VendorInventoryView from '@/components/VendorInventoryView';

const Inventory = () => {
  const { 
    inventory, partners, stockLogs, deleteInventoryItem, adjustStock, currency, language 
  } = useStore();
  
  const t = translations[language];
  const [activeTab, setActiveTab] = useState('stock');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');
  
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Partner | null>(null);
  const [viewVendorDetails, setViewVendorDetails] = useState<Partner | null>(null);

  const categories = useMemo(() => 
    Array.from(new Set(inventory.map(i => i.category))).filter(Boolean)
  , [inventory]);

  const filteredItems = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || (item.barcode && item.barcode.includes(searchQuery));
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    const matchesPartner = !partnerFilter || item.partnerId === partnerFilter;
    return matchesSearch && matchesCategory && matchesPartner;
  });

  const stats = useMemo(() => {
    const totalItems = inventory.length;
    const lowStock = inventory.filter(i => i.stock <= i.minStock).length;
    const stockValue = inventory.reduce((acc, i) => acc + (i.stock * (i.costPrice || 0)), 0);
    return { totalItems, lowStock, stockValue };
  }, [inventory]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8F9FD]">
      <header className="px-6 lg:px-12 py-10 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pl-14 lg:pl-12">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Package size={16} className="text-[#D9ED5F]" />
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">{t.inventory}</p>
          </div>
          <h1 className="text-4xl font-black text-[#1A1F3D]">{t.stockManagement}</h1>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={() => { setSelectedItem(null); setIsItemModalOpen(true); }}
             className="bg-[#1A1F3D] text-white px-6 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-[#1A1F3D]/10 active:scale-95 transition-all"
           >
             <Plus size={20} /> {language === 'th' ? 'เพิ่มสินค้า' : 'Add Item'}
           </button>
        </div>
      </header>

      <div className="px-6 lg:px-12 mb-8 flex flex-col lg:flex-row justify-between items-center gap-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full lg:w-auto">
          <TabsList className="bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm flex gap-1 h-auto">
            <TabsTrigger value="stock" className="flex-1 lg:px-8 py-3 rounded-xl data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white text-xs font-bold transition-all">
              <Layers size={16} className="mr-2" /> {t.allInventory}
            </TabsTrigger>
            <TabsTrigger value="vendors" className="flex-1 lg:px-8 py-3 rounded-xl data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white text-xs font-bold transition-all">
              <Building2 size={16} className="mr-2" /> {t.vendorManagement}
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex-1 lg:px-8 py-3 rounded-xl data-[state=active]:bg-[#1A1F3D] data-[state=active]:text-white text-xs font-bold transition-all">
              <History size={16} className="mr-2" /> {language === 'th' ? 'ประวัติสต็อก' : 'Stock Logs'}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === 'stock' && (
          <div className="flex flex-wrap gap-4 w-full lg:w-auto">
             <div className="relative flex-1 lg:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold shadow-sm" placeholder={t.search} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
             </div>
             <select 
              className="bg-white border border-gray-100 rounded-2xl px-6 py-3.5 text-xs font-black uppercase tracking-widest shadow-sm outline-none"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
             >
                <option value="">{language === 'th' ? 'หมวดหมู่ทั้งหมด' : 'All Categories'}</option>
                {(categories as string[]).map(c => <option key={c} value={c}>{c}</option>)}
             </select>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-12 pb-10 scrollbar-hide">
        <Tabs value={activeTab} className="w-full">
          <TabsContent value="stock" className="m-0 space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex items-center gap-6">
                   <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shrink-0"><Package size={28}/></div>
                   <div><p className="text-[10px] font-black uppercase text-gray-400 mb-1">Total Products</p><h3 className="text-3xl font-black text-[#1A1F3D]">{stats.totalItems} Items</h3></div>
                </div>
                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex items-center gap-6">
                   <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center shrink-0"><AlertTriangle size={28}/></div>
                   <div><p className="text-[10px] font-black uppercase text-gray-400 mb-1">{t.lowStockAlert}</p><h3 className="text-3xl font-black text-orange-600">{stats.lowStock} Items</h3></div>
                </div>
                <div className="bg-[#1A1F3D] p-8 rounded-[40px] shadow-xl text-white flex items-center gap-6">
                   <div className="w-14 h-14 bg-white/10 text-[#D9ED5F] rounded-2xl flex items-center justify-center shrink-0"><TrendingUp size={28}/></div>
                   <div><p className="text-[10px] font-black uppercase text-white/40 mb-1">Stock Value (Cost)</p><h3 className="text-3xl font-black">{currency}{stats.stockValue.toLocaleString()}</h3></div>
                </div>
             </div>

             <div className="bg-white rounded-[48px] border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                   <thead>
                      <tr className="bg-gray-50/50">
                         <th className="px-10 py-6 text-left text-[10px] font-black uppercase text-gray-400">Product Details</th>
                         <th className="px-10 py-6 text-center text-[10px] font-black uppercase text-gray-400">Category</th>
                         <th className="px-10 py-6 text-center text-[10px] font-black uppercase text-gray-400">Inventory</th>
                         <th className="px-10 py-6 text-right text-[10px] font-black uppercase text-gray-400">Pricing</th>
                         <th className="px-10 py-6 text-center text-[10px] font-black uppercase text-gray-400">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {filteredItems.map((item) => (
                         <tr key={item.id} className="hover:bg-[#F8F9FD] transition-colors group">
                            <td className="px-10 py-6">
                               <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 bg-[#F5F6FA] rounded-2xl overflow-hidden flex items-center justify-center border border-gray-100">
                                     {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Package size={20} className="text-gray-300" />}
                                  </div>
                                  <div>
                                     <p className="text-sm font-black text-[#1A1F3D]">{item.name}</p>
                                     <div className="flex items-center gap-2 mt-1">
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{item.barcode || 'No Barcode'}</p>
                                        {item.isConsignment && <span className="bg-amber-100 text-amber-700 text-[8px] px-2 py-0.5 rounded-full font-black uppercase">Consignment</span>}
                                     </div>
                                  </div>
                               </div>
                            </td>
                            <td className="px-10 py-6 text-center">
                               <span className="text-[10px] font-black uppercase bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{item.category}</span>
                            </td>
                            <td className="px-10 py-6 text-center">
                               <div className="inline-flex flex-col items-center">
                                  <span className={cn(
                                    "text-lg font-black",
                                    item.stock <= 0 ? "text-red-500" : item.stock <= item.minStock ? "text-orange-500" : "text-[#1A1F3D]"
                                  )}>
                                     {item.stock}
                                  </span>
                                  <span className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter">{item.unit}s left</span>
                               </div>
                            </td>
                            <td className="px-10 py-6 text-right">
                               <p className="text-xs text-gray-400 font-bold">Cost: {currency}{item.costPrice}</p>
                               <p className="text-sm font-black text-blue-600">{currency}{item.price.toFixed(2)}</p>
                            </td>
                            <td className="px-10 py-6 text-center">
                               <div className="flex justify-center gap-1">
                                  <button onClick={() => { setSelectedItem(item); setIsItemModalOpen(true); }} className="p-2.5 bg-[#F5F6FA] text-gray-400 hover:text-[#1A1F3D] hover:bg-white hover:shadow-md rounded-xl transition-all"><Edit3 size={16}/></button>
                                  <button onClick={() => { if(confirm('Delete?')) deleteInventoryItem(item.id); }} className="p-2.5 bg-[#F5F6FA] text-gray-400 hover:text-red-500 hover:bg-white hover:shadow-md rounded-xl transition-all"><Trash2 size={16}/></button>
                               </div>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </TabsContent>

          <TabsContent value="vendors" className="m-0">
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {partners.map(partner => (
                   <div key={partner.id} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm transition-all hover:shadow-xl group">
                      <div className="flex justify-between items-start mb-8">
                         <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[24px] flex items-center justify-center"><Building2 size={28}/></div>
                         <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setSelectedVendor(partner); setIsVendorModalOpen(true); }} className="p-2 text-gray-300 hover:text-[#1A1F3D]"><Edit3 size={18}/></button>
                         </div>
                      </div>
                      <h3 className="text-xl font-black text-[#1A1F3D] mb-2">{partner.companyName}</h3>
                      <div className="space-y-4 pt-6 border-t border-gray-50">
                         <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase text-gray-400">Consignment GP</span>
                            <span className="text-sm font-black text-indigo-600">{partner.gpRate}%</span>
                         </div>
                         <button 
                          onClick={() => setViewVendorDetails(partner)}
                          className="w-full py-3 bg-[#F5F6FA] text-[#1A1F3D] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                         >
                           View Stock List & Accounting
                         </button>
                      </div>
                   </div>
                ))}
                <button 
                  onClick={() => { setSelectedVendor(null); setIsVendorModalOpen(true); }}
                  className="border-2 border-dashed border-gray-100 rounded-[40px] p-10 flex flex-col items-center justify-center text-gray-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all"
                >
                  <Plus size={32} className="mb-4" />
                  <p className="font-black uppercase tracking-widest text-xs">{t.addVendor}</p>
                </button>
             </div>
          </TabsContent>

          <TabsContent value="logs" className="m-0">
             <div className="bg-white rounded-[48px] border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                   <thead>
                      <tr className="bg-gray-50/50">
                         <th className="px-10 py-6 text-left text-[10px] font-black uppercase text-gray-400">Timestamp</th>
                         <th className="px-10 py-6 text-left text-[10px] font-black uppercase text-gray-400">Product</th>
                         <th className="px-10 py-6 text-center text-[10px] font-black uppercase text-gray-400">Movement</th>
                         <th className="px-10 py-6 text-left text-[10px] font-black uppercase text-gray-400">Reason</th>
                         <th className="px-10 py-6 text-right text-[10px] font-black uppercase text-gray-400">Staff</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {[...stockLogs].reverse().map((log) => (
                         <tr key={log.id} className="hover:bg-[#F8F9FD] transition-colors">
                            <td className="px-10 py-6 text-xs text-gray-400 font-bold">{new Date(log.timestamp).toLocaleString()}</td>
                            <td className="px-10 py-6 font-black text-sm text-[#1A1F3D]">{log.productName}</td>
                            <td className="px-10 py-6 text-center">
                               <div className="inline-flex items-center gap-3">
                                  <span className="text-[10px] font-bold text-gray-300">{log.oldQty}</span>
                                  {log.newQty > log.oldQty ? <ArrowUpCircle size={16} className="text-green-500" /> : <ArrowDownCircle size={16} className="text-red-500" />}
                                  <span className="text-sm font-black text-[#1A1F3D]">{log.newQty}</span>
                               </div>
                            </td>
                            <td className="px-10 py-6 text-xs text-gray-500 font-medium">{log.reason}</td>
                            <td className="px-10 py-6 text-right text-[10px] font-black uppercase text-gray-400 tracking-widest">{log.staffName}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </TabsContent>
        </Tabs>
      </div>

      {isItemModalOpen && <InventoryModal item={selectedItem} onClose={() => setIsItemModalOpen(false)} />}
      {isVendorModalOpen && <VendorModal vendor={selectedVendor} onClose={() => setIsVendorModalOpen(false)} />}
      {viewVendorDetails && <VendorInventoryView vendor={viewVendorDetails} onClose={() => setViewVendorDetails(null)} />}
    </div>
  );
};

export default Inventory;