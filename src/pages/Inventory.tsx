"use client";

import React, { useState, useMemo } from 'react';
import { 
  Package, Plus, Search, Edit3, Trash2, History, 
  AlertTriangle, Users, DollarSign, Clock, ArrowUpRight, 
  ArrowDownRight, CheckCircle2, FileText, LayoutGrid, 
  PackagePlus, ClipboardCheck, BarChart3, Receipt, Tag, FileSearch
} from 'lucide-react';
import { useStore, InventoryItem, Vendor, StockMovement, StockTakeRecord } from '@/store/useStore';
import { translations } from '@/utils/translations';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import InventoryModal from '@/components/InventoryModal';
import VendorModal from '@/components/VendorModal';
import VendorInventoryView from '@/components/VendorInventoryView';

type InventoryTab = 'all' | 'low' | 'restock' | 'stocktake' | 'sales' | 'pdf' | 'vendors';

const Inventory = () => {
  const { 
    inventory, vendors, stockMovements, stockTakeHistory, transactions,
    deleteInventoryItem, deleteVendor, currency, language, currentUser 
  } = useStore();
  
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<InventoryTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal States
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [selectedViewVendor, setSelectedViewVendor] = useState<Vendor | null>(null);
  
  // States for Stock Take
  const [stockTakeValues, setStockTakeValues] = useState<Record<string, number>>({});

  // Filters
  const filteredStock = inventory.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.barcode?.includes(searchQuery));
  const lowStockItems = inventory.filter(i => i.stock <= i.minStock);
  const filteredVendors = vendors.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Handlers
  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setIsInventoryModalOpen(true);
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setIsInventoryModalOpen(true);
  };

  const handleEditVendor = (v: Vendor) => {
    setEditingVendor(v);
    setIsVendorModalOpen(true);
  };

  const handleAddVendor = () => {
    setEditingVendor(null);
    setIsVendorModalOpen(true);
  };

  const handleQuickRestock = (id: string) => {
    const { adjustStock } = useStore.getState();
    const amount = prompt("Enter quantity to add:");
    if (amount && !isNaN(Number(amount))) {
      adjustStock(id, Number(amount), 'In', "Quick Restock");
      toast.success("Stock received successfully");
    }
  };

  const handleSaveStockTake = () => {
    const { saveStockTake } = useStore.getState();
    if (Object.keys(stockTakeValues).length === 0) return;
    
    const items = Object.entries(stockTakeValues).map(([itemId, actualStock]) => {
      const item = inventory.find(i => i.id === itemId)!;
      return {
        itemId,
        itemName: item.name,
        systemStock: item.stock,
        actualStock,
        difference: actualStock - item.stock
      };
    });

    saveStockTake({
      date: new Date().toISOString(),
      staffName: currentUser?.name || "System",
      items,
      notes: "Monthly Stock Take"
    });

    setStockTakeValues({});
    toast.success("Monthly stock take recorded and inventory updated");
  };

  const menuItems = [
    { id: 'all', label: t.allInventory, icon: LayoutGrid },
    { id: 'low', label: t.lowStockAlert, icon: AlertTriangle, count: lowStockItems.length },
    { id: 'restock', label: t.restockInbound, icon: PackagePlus },
    { id: 'stocktake', label: t.monthlyStockTake, icon: ClipboardCheck },
    { id: 'sales', label: t.salesReport, icon: BarChart3 },
    { id: 'pdf', label: t.pdfHistory, icon: Receipt },
    { id: 'vendors', label: t.vendorManagement, icon: Users },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8F9FD]">
      {/* Header */}
      <header className="px-10 py-10 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pl-14 lg:pl-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Package size={16} className="text-[#D9ED5F]" />
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">{t.inventory}</p>
          </div>
          <h1 className="text-4xl font-black text-[#1A1F3D]">
            {menuItems.find(m => m.id === activeTab)?.label}
          </h1>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm text-gray-400 hover:text-[#1A1F3D] transition-all">
             <Receipt size={20} />
          </button>
          <button 
            onClick={() => {
              if(activeTab === 'vendors') {
                handleAddVendor();
              } else {
                handleAddItem();
              }
            }}
            className="bg-[#1A1F3D] text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl"
          >
            <Plus size={20} /> {activeTab === 'vendors' ? 'Add Partner' : t.add}
          </button>
        </div>
      </header>

      {/* Main Navigation (Sub-modules) */}
      <div className="px-10 mb-8 overflow-x-auto scrollbar-hide">
         <div className="flex bg-white p-1.5 rounded-[28px] border border-gray-100 shadow-sm gap-1 w-fit">
            {menuItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id as InventoryTab)}
                className={cn(
                  "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap",
                  activeTab === item.id ? "bg-[#1A1F3D] text-white shadow-lg" : "text-gray-400 hover:bg-gray-50"
                )}
              >
                <item.icon size={14} />
                {item.label}
                {item.count !== undefined && item.count > 0 && (
                  <span className={cn("px-1.5 py-0.5 rounded-md text-[8px]", activeTab === item.id ? "bg-white text-[#1A1F3D]" : "bg-red-500 text-white")}>
                    {item.count}
                  </span>
                )}
              </button>
            ))}
         </div>
      </div>

      <div className="flex-1 overflow-y-auto px-10 pb-10 scrollbar-hide">
        {/* Module 1: All Inventory */}
        {activeTab === 'all' && (
          <div className="space-y-6">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold shadow-sm" placeholder={t.search} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStock.map(item => {
                const vendor = vendors.find(v => v.id === item.vendorId);
                const payout = item.isConsignment ? item.price * (1 - (item.consignmentRate || 0) / 100) : item.costPrice || 0;

                return (
                  <div key={item.id} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm group transition-all hover:shadow-lg relative overflow-hidden">
                    {item.isConsignment && (
                      <div className="absolute top-0 right-0">
                         <div className="bg-amber-500 text-white text-[8px] font-black uppercase px-4 py-1.5 rounded-bl-2xl shadow-sm">Consignment</div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center"><Package size={24} /></div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditItem(item)} className="p-2 text-gray-300 hover:text-[#1A1F3D]"><Edit3 size={16}/></button>
                        <button onClick={() => deleteInventoryItem(item.id)} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                      </div>
                    </div>
                    <h3 className="text-xl font-black mb-1">{item.name}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">{item.category} • {item.barcode || 'NO BARCODE'}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-[#F5F6FA] p-4 rounded-2xl">
                        <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Price</p>
                        <p className="text-lg font-black">{currency}{item.price.toLocaleString()}</p>
                      </div>
                      <div className="bg-[#F5F6FA] p-4 rounded-2xl">
                        <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Stock</p>
                        <p className={cn("text-lg font-black", item.stock <= item.minStock ? "text-red-500" : "text-[#1A1F3D]")}>{item.stock} {item.unit}</p>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-50 flex justify-between items-center">
                       <div>
                          <p className="text-[8px] font-black text-gray-400 uppercase">{item.isConsignment ? 'Vendor Payout' : 'Cost'}</p>
                          <p className="text-sm font-black text-gray-400">{currency}{payout.toLocaleString()}</p>
                       </div>
                       {item.isConsignment && vendor && (
                         <div className="text-right">
                            <p className="text-[8px] font-black text-gray-400 uppercase">Partner</p>
                            <div className="flex items-center gap-1 justify-end">
                               <Users size={10} className="text-amber-500" />
                               <span className="text-[10px] font-bold text-[#1A1F3D]">{vendor.name}</span>
                            </div>
                         </div>
                       )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Module 2: Low Stock */}
        {activeTab === 'low' && (
          <div className="bg-white rounded-[40px] border border-red-100 shadow-sm overflow-hidden">
             <div className="p-8 border-b border-red-50 bg-red-50/30 flex items-center gap-3">
               <AlertTriangle className="text-red-500" size={24} />
               <div>
                  <h2 className="text-lg font-black text-[#1A1F3D]">Restock Required</h2>
                  <p className="text-xs text-gray-400">The following items are below minimum safety levels.</p>
               </div>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full">
                 <thead>
                   <tr className="bg-gray-50/50">
                     <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">Product</th>
                     <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">Min. Stock</th>
                     <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">Current</th>
                     <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">Action</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                   {lowStockItems.map(item => (
                     <tr key={item.id}>
                       <td className="px-8 py-6 font-black">{item.name}</td>
                       <td className="px-8 py-6 text-center text-gray-400 font-bold">{item.minStock}</td>
                       <td className="px-8 py-6 text-center"><span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-black">{item.stock}</span></td>
                       <td className="px-8 py-6 text-right"><button onClick={() => handleQuickRestock(item.id)} className="bg-[#1A1F3D] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">Restock</button></td>
                     </tr>
                   ))}
                   {lowStockItems.length === 0 && (
                     <tr><td colSpan={4} className="py-20 text-center opacity-20 font-black">All stock levels are safe</td></tr>
                   )}
                 </tbody>
               </table>
             </div>
          </div>
        )}

        {/* Module 3: Restock History */}
        {activeTab === 'restock' && (
           <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">Time</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">Product</th>
                    <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">Action</th>
                    <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">Qty</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">Staff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stockMovements.map(log => (
                    <tr key={log.id}>
                      <td className="px-8 py-6 text-xs text-gray-400">{format(new Date(log.timestamp), 'dd MMM, HH:mm')}</td>
                      <td className="px-8 py-6 font-black">{log.itemName}</td>
                      <td className="px-8 py-6 text-center"><span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase", log.type === 'In' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700")}>{log.type}</span></td>
                      <td className="px-8 py-6 text-center font-black text-lg">{log.type === 'In' ? '+' : '-'}{log.quantity}</td>
                      <td className="px-8 py-6 text-xs font-bold text-gray-500">{log.staffName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        )}

        {/* Module 4: Stock Take */}
        {activeTab === 'stocktake' && (
           <div className="space-y-8">
              <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
                 <div className="flex justify-between items-center mb-8">
                    <div>
                       <h2 className="text-xl font-black">Record Stock Take</h2>
                       <p className="text-xs text-gray-400">Enter actual physical count for each item.</p>
                    </div>
                    <button onClick={handleSaveStockTake} className="bg-green-500 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-lg shadow-green-500/20">Finalize Counts</button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {inventory.map(item => (
                       <div key={item.id} className="flex items-center justify-between p-4 bg-[#F5F6FA] rounded-2xl">
                          <span className="font-bold text-sm">{item.name} <span className="text-[10px] text-gray-400">(System: {item.stock})</span></span>
                          <input 
                             type="number" 
                             className="w-24 bg-white border-none rounded-xl px-4 py-2 text-center font-black"
                             placeholder="Count"
                             value={stockTakeValues[item.id] || ''}
                             onChange={e => setStockTakeValues({...stockTakeValues, [item.id]: Number(e.target.value)})}
                          />
                       </div>
                    ))}
                 </div>
              </div>

              <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                 <div className="p-8 border-b border-gray-50 font-black">Previous Records</div>
                 <table className="w-full">
                    <tbody className="divide-y divide-gray-50">
                       {stockTakeHistory.map(record => (
                          <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                             <td className="px-8 py-6">
                                <p className="font-black">{format(new Date(record.date), 'MMMM yyyy')}</p>
                                <p className="text-[10px] text-gray-400 uppercase font-bold">{record.staffName}</p>
                             </td>
                             <td className="px-8 py-6 text-right">
                                <span className="text-xs font-bold text-gray-400">{record.items.length} Items Checked</span>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {/* Module 5: Sales Report (Product Specific) */}
        {activeTab === 'sales' && (
           <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                 <h2 className="text-xl font-black">Inventory Revenue</h2>
              </div>
              <table className="w-full">
                 <thead>
                    <tr className="bg-gray-50/50">
                       <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">Product</th>
                       <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">Units Sold</th>
                       <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">Revenue</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {inventory.map(item => {
                       const sold = transactions.reduce((acc, tx) => {
                          const product = tx.items.find(i => i.id === item.id);
                          return acc + (product?.quantity || 0);
                       }, 0);
                       return (
                          <tr key={item.id}>
                             <td className="px-8 py-6 font-black">{item.name}</td>
                             <td className="px-8 py-6 text-center font-bold">{sold}</td>
                             <td className="px-8 py-6 text-right font-black">{currency}{(sold * item.price).toLocaleString()}</td>
                          </tr>
                       );
                    })}
                 </tbody>
              </table>
           </div>
        )}

        {/* Module 6: PDF History (Simulated) */}
        {activeTab === 'pdf' && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3].map(i => (
                 <div key={i} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex items-center gap-6 group hover:shadow-lg transition-all">
                    <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center shrink-0"><FileText size={24} /></div>
                    <div>
                       <p className="font-black text-[#1A1F3D]">Inventory_Report_0{i}_24</p>
                       <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Generated: 0{i}/04/24</p>
                       <button className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-4 hover:underline">Download PDF</button>
                    </div>
                 </div>
              ))}
           </div>
        )}

        {/* Module 7: Vendor Management */}
        {activeTab === 'vendors' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map(vendor => (
              <div key={vendor.id} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm group transition-all hover:shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-16 h-16 bg-[#1A1F3D] text-white rounded-[24px] flex items-center justify-center shadow-lg"><Users size={24} /></div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditVendor(vendor)} className="p-2 text-gray-300 hover:text-[#1A1F3D]"><Edit3 size={18}/></button>
                    <button onClick={() => deleteVendor(vendor.id)} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={18}/></button>
                  </div>
                </div>

                <div className="mb-6">
                   <h3 className="text-xl font-black text-[#1A1F3D] mb-1">{vendor.name}</h3>
                   <div className="flex items-center gap-2">
                      <span className="bg-indigo-50 text-indigo-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                         {vendor.mainCategory || 'General Partner'}
                      </span>
                   </div>
                </div>

                <div className="space-y-3 pt-6 border-t border-gray-50 mb-8">
                   <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-gray-400">Contact:</span>
                      <span className="text-[#1A1F3D]">{vendor.contactPerson}</span>
                   </div>
                   <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-gray-400">Phone:</span>
                      <span className="text-[#1A1F3D]">{vendor.phone}</span>
                   </div>
                </div>

                <button 
                  onClick={() => setSelectedViewVendor(vendor)}
                  className="w-full bg-[#F5F6FA] hover:bg-[#1A1F3D] hover:text-white text-[#1A1F3D] font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <FileSearch size={16} /> ตรวจสอบสินค้า
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {isInventoryModalOpen && <InventoryModal item={editingItem} onClose={() => setIsInventoryModalOpen(false)} />}
      {isVendorModalOpen && <VendorModal vendor={editingVendor} onClose={() => setIsVendorModalOpen(false)} />}
      {selectedViewVendor && <VendorInventoryView vendor={selectedViewVendor} onClose={() => setSelectedViewVendor(null)} />}
    </div>
  );
};

export default Inventory;