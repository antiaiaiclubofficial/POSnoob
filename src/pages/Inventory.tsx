"use client";

import React, { useState } from 'react';
import { Package, Plus, Search, Edit3, Trash2, History, AlertTriangle, Users, DollarSign, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useStore, InventoryItem, Vendor, StockMovement } from '@/store/useStore';
import { translations } from '@/utils/translations';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';

const Inventory = () => {
  const { inventory, vendors, stockMovements, deleteInventoryItem, deleteVendor, addInventoryItem, addVendor, updateInventoryItem, adjustStock, currency, language } = useStore();
  const t = translations[language];
  
  const [activeTab, setActiveTab] = useState<'stock' | 'vendors' | 'history'>('stock');
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredStock = inventory.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.barcode?.includes(searchQuery));
  const filteredVendors = vendors.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleAdjustStock = (id: string, current: number) => {
    const amountStr = prompt("Enter amount to adjust (e.g. 5 or -2):");
    if (amountStr !== null) {
      const amount = Number(amountStr);
      if (isNaN(amount)) return;
      
      const reason = prompt("Reason for adjustment:", "Manual Inventory Update") || "Manual Inventory Update";
      adjustStock(id, amount, amount > 0 ? 'In' : 'Adjustment', reason);
      toast.success("Stock updated successfully");
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8F9FD]">
      <header className="px-10 py-10 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pl-14 lg:pl-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Package size={16} className="text-[#D9ED5F]" />
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">{t.inventory}</p>
          </div>
          <h1 className="text-4xl font-black text-[#1A1F3D]">
            {activeTab === 'stock' ? t.stockManagement : activeTab === 'vendors' ? t.vendors : "Stock Audit Logs"}
          </h1>
        </div>
        {activeTab !== 'history' && (
          <button 
            onClick={() => {
              if(activeTab === 'stock') {
                addInventoryItem({ name: 'New Product', stock: 0, minStock: 5, price: 0, unit: 'Unit', category: 'General', isConsignment: false });
              } else {
                addVendor({ name: 'New Partner', contactPerson: '', phone: '', email: '', notes: '' });
              }
            }}
            className="bg-[#1A1F3D] text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl"
          >
            <Plus size={20} /> {activeTab === 'stock' ? t.add : t.addClient}
          </button>
        )}
      </header>

      <div className="px-10 mb-8 flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex bg-white p-1.5 rounded-[22px] border border-gray-100 shadow-sm gap-1 overflow-x-auto scrollbar-hide">
          <button 
            onClick={() => setActiveTab('stock')}
            className={cn("px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'stock' ? "bg-[#1A1F3D] text-white shadow-lg" : "text-gray-400")}
          >
            {t.stockManagement}
          </button>
          <button 
            onClick={() => setActiveTab('vendors')}
            className={cn("px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'vendors' ? "bg-[#1A1F3D] text-white shadow-lg" : "text-gray-400")}
          >
            {t.vendors}
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={cn("px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'history' ? "bg-[#1A1F3D] text-white shadow-lg" : "text-gray-400")}
          >
            <History size={14} className="inline mr-2" /> History
          </button>
        </div>
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
          <input 
            className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold shadow-sm"
            placeholder={t.search}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-10 pb-10 scrollbar-hide">
        {activeTab === 'stock' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStock.map(item => (
              <div key={item.id} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm transition-all hover:shadow-lg group">
                <div className="flex justify-between items-start mb-6">
                  <div className={cn("w-14 h-14 rounded-3xl flex items-center justify-center", item.stock <= item.minStock ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500")}>
                    <Package size={24} />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-gray-300 hover:text-[#1A1F3D] rounded-xl"><Edit3 size={16}/></button>
                    <button onClick={() => deleteInventoryItem(item.id)} className="p-2 text-gray-300 hover:text-red-500 rounded-xl"><Trash2 size={16}/></button>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-black">{item.name}</h3>
                    {item.isConsignment && <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Consigned</span>}
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.category} • {item.barcode || 'No Barcode'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-[#F5F6FA] p-4 rounded-2xl">
                    <p className="text-[9px] font-black text-gray-400 uppercase mb-1">{t.retailPrice}</p>
                    <p className="text-lg font-black text-[#1A1F3D]">{currency}{item.price.toLocaleString()}</p>
                  </div>
                  <div className="bg-[#F5F6FA] p-4 rounded-2xl">
                    <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Stock</p>
                    <p className={cn("text-lg font-black", item.stock <= item.minStock ? "text-red-500" : "text-[#1A1F3D]")}>
                      {item.stock} <span className="text-[10px] text-gray-400 font-bold">{item.unit}</span>
                    </p>
                  </div>
                </div>
                <button onClick={() => handleAdjustStock(item.id, item.stock)} className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-[#1A1F3D] hover:text-white hover:border-[#1A1F3D] transition-all">{t.adjustStock}</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'vendors' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map(vendor => (
              <div key={vendor.id} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm group transition-all hover:shadow-lg">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center"><Users size={24} /></div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-gray-300 hover:text-[#1A1F3D] rounded-xl"><Edit3 size={16}/></button>
                    <button onClick={() => deleteVendor(vendor.id)} className="p-2 text-gray-300 hover:text-red-500 rounded-xl"><Trash2 size={16}/></button>
                  </div>
                </div>
                <h3 className="text-xl font-black mb-1">{vendor.name}</h3>
                <p className="text-xs text-gray-400 font-bold mb-6">{vendor.contactPerson}</p>
                <div className="space-y-3 pt-6 border-t border-gray-50">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-400"><span>Phone</span><span className="text-[#1A1F3D]">{vendor.phone}</span></div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-400"><span>Email</span><span className="text-[#1A1F3D]">{vendor.email}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">Time</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">Product</th>
                    <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">Action</th>
                    <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">Qty</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stockMovements.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <p className="text-xs font-bold text-[#1A1F3D]">{format(new Date(log.timestamp), 'HH:mm')}</p>
                        <p className="text-[9px] text-gray-400 uppercase font-black">{format(new Date(log.timestamp), 'dd MMM yyyy')}</p>
                      </td>
                      <td className="px-8 py-6"><p className="text-sm font-black text-[#1A1F3D]">{log.itemName}</p></td>
                      <td className="px-8 py-6 text-center">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[9px] font-black uppercase",
                          log.type === 'In' ? "bg-green-100 text-green-700" :
                          log.type === 'Out' ? "bg-blue-100 text-blue-700" :
                          "bg-orange-100 text-orange-700"
                        )}>
                          {log.type}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="flex flex-col items-center">
                           <span className={cn("text-xs font-black", log.type === 'In' ? "text-green-600" : "text-red-500")}>
                             {log.type === 'In' ? '+' : '-'}{log.quantity}
                           </span>
                           <span className="text-[8px] text-gray-300 font-bold uppercase">{log.previousStock} ⮕ {log.currentStock}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-[10px] font-bold text-gray-500 leading-tight">{log.reason}</p>
                        <p className="text-[8px] text-gray-300 font-black uppercase mt-1">{log.staffName}</p>
                      </td>
                    </tr>
                  ))}
                  {stockMovements.length === 0 && (
                    <tr><td colSpan={5} className="py-20 text-center opacity-20 font-black">No stock records found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;