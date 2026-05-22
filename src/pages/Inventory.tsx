"use client";

import React, { useState } from 'react';
import { 
  Package, Plus, Search, Edit3, Trash2, History, 
  AlertTriangle, Users, FileText, LayoutGrid, 
  PackagePlus, ClipboardCheck, BarChart3, Receipt, FileSearch, Download,
  PlusCircle
} from 'lucide-react';
import { useStore, InventoryItem, Vendor } from '@/store/useStore';
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
    deleteInventoryItem, deleteVendor, adjustStock, currency, language, currentUser 
  } = useStore();
  
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<InventoryTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [restockItemId, setRestockItemId] = useState('');
  const [restockQty, setRestockQty] = useState('');
  const [restockNote, setRestockNote] = useState('');

  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [selectedViewVendor, setSelectedViewVendor] = useState<Vendor | null>(null);
  
  const [stockTakeValues, setStockTakeValues] = useState<Record<string, number>>({});

  const filteredStock = inventory.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.barcode?.includes(searchQuery));
  const lowStockItems = inventory.filter(i => i.stock <= i.minStock);
  const filteredVendors = vendors.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setIsInventoryModalOpen(true);
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setIsInventoryModalOpen(true);
  };

  const handleAddVendor = () => {
    setEditingVendor(null);
    setIsVendorModalOpen(true);
  };

  const handleEditVendor = (v: Vendor) => {
    setEditingVendor(v);
    setIsVendorModalOpen(true);
  };

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItemId || !restockQty || Number(restockQty) <= 0) {
      toast.error("Please select a product and enter valid quantity");
      return;
    }
    adjustStock(restockItemId, Number(restockQty), 'In', restockNote || "Manual Restock");
    toast.success("Stock received successfully");
    setRestockItemId(''); setRestockQty(''); setRestockNote('');
  };

  const handleSaveStockTake = () => {
    const { saveStockTake } = useStore.getState();
    const items = Object.entries(stockTakeValues).map(([itemId, actualStock]) => {
      const item = inventory.find(i => i.id === itemId)!;
      return { itemId, itemName: item.name, systemStock: item.stock, actualStock, difference: actualStock - item.stock };
    });
    saveStockTake({ date: new Date().toISOString(), staffName: currentUser?.name || "System", items, notes: "Monthly Stock Take" });
    setStockTakeValues({});
    toast.success("Stock take recorded");
  };

  const menuItems = [
    { id: 'all', label: t.allInventory, icon: LayoutGrid },
    { id: 'low', label: t.lowStockAlert, icon: AlertTriangle, count: lowStockItems.length },
    { id: 'restock', label: 'รับเข้าสินค้า', icon: PackagePlus },
    { id: 'stocktake', label: t.monthlyStockTake, icon: ClipboardCheck },
    { id: 'sales', label: t.salesReport, icon: BarChart3 },
    { id: 'pdf', label: t.pdfHistory, icon: Receipt },
    { id: 'vendors', label: t.vendorManagement, icon: Users },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8F9FD]">
      <header className="px-10 py-10 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pl-14 lg:pl-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Package size={16} className="text-[#D9ED5F]" />
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">{t.inventory}</p>
          </div>
          <h1 className="text-4xl font-black text-[#1A1F3D]">{menuItems.find(m => m.id === activeTab)?.label}</h1>
        </div>
        <button 
          onClick={() => activeTab === 'vendors' ? handleAddVendor() : handleAddItem()}
          className="bg-[#1A1F3D] text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl"
        >
          <Plus size={20} /> {activeTab === 'vendors' ? 'Add Partner' : t.add}
        </button>
      </header>

      <div className="px-10 mb-8 overflow-x-auto scrollbar-hide">
         <div className="flex bg-white p-1.5 rounded-[28px] border border-gray-100 shadow-sm gap-1 w-fit">
            {menuItems.map((item) => (
              <button key={item.id} onClick={() => setActiveTab(item.id as InventoryTab)} className={cn("px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap", activeTab === item.id ? "bg-[#1A1F3D] text-white shadow-lg" : "text-gray-400 hover:bg-gray-50")}>
                <item.icon size={14} /> {item.label}
                {item.count !== undefined && item.count > 0 && <span className={cn("px-1.5 py-0.5 rounded-md text-[8px]", activeTab === item.id ? "bg-white text-[#1A1F3D]" : "bg-red-500 text-white")}>{item.count}</span>}
              </button>
            ))}
         </div>
      </div>

      <div className="flex-1 overflow-y-auto px-10 pb-10 scrollbar-hide">
        {activeTab === 'all' && (
          <div className="space-y-6">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold shadow-sm" placeholder={t.search} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStock.map(item => (
                <div key={item.id} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm group transition-all hover:shadow-lg relative overflow-hidden">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center"><Package size={24} /></div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditItem(item)} className="p-2 text-gray-300 hover:text-[#1A1F3D]"><Edit3 size={16}/></button>
                      <button onClick={() => deleteInventoryItem(item.id)} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                    </div>
                  </div>
                  <h3 className="text-xl font-black mb-1">{item.name}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">{item.category} • {item.barcode || 'NO BARCODE'}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#F5F6FA] p-4 rounded-2xl"><p className="text-[8px] font-black text-gray-400 uppercase mb-1">Price</p><p className="text-lg font-black">{currency}{item.price.toLocaleString()}</p></div>
                    <div className="bg-[#F5F6FA] p-4 rounded-2xl"><p className="text-[8px] font-black text-gray-400 uppercase mb-1">Stock</p><p className={cn("text-lg font-black", item.stock <= item.minStock ? "text-red-500" : "text-[#1A1F3D]")}>{item.stock} {item.unit}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'restock' && (
           <div className="space-y-10">
              <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
                 <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-green-50 text-green-500 rounded-2xl"><PlusCircle size={24} /></div>
                    <div><h2 className="text-xl font-black">รับสินค้าเข้าสต็อก</h2><p className="text-xs text-gray-400">ระบุสินค้าและจำนวนที่ต้องการเพิ่มเข้าคลัง</p></div>
                 </div>
                 <form onSubmit={handleRestockSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-2 space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase ml-2">เลือกสินค้า</label>
                       <select className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 font-bold text-sm" value={restockItemId} onChange={(e) => setRestockItemId(e.target.value)}>
                          <option value="">-- เลือกรายการสินค้า --</option>
                          {inventory.map(item => <option key={item.id} value={item.id}>{item.name} (คงเหลือ: {item.stock})</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase ml-2">จำนวน</label>
                       <input type="number" placeholder="0" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 font-bold text-sm" value={restockQty} onChange={(e) => setRestockQty(e.target.value)} />
                    </div>
                    <div className="flex items-end"><button type="submit" className="w-full bg-[#1A1F3D] text-white py-4 rounded-2xl font-black text-sm">รับเข้า</button></div>
                    <div className="md:col-span-4 space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase ml-2">หมายเหตุ</label>
                       <input type="text" placeholder="หมายเหตุ..." className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 font-bold text-sm" value={restockNote} onChange={(e) => setRestockNote(e.target.value)} />
                    </div>
                 </form>
              </div>
              <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                 <div className="p-8 border-b border-gray-50 flex items-center justify-between"><h2 className="text-lg font-black">ประวัติสต็อก</h2><History size={18} className="text-gray-300" /></div>
                 <table className="w-full">
                    <thead><tr className="bg-gray-50/50"><th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">วัน/เวลา</th><th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">รายการ</th><th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">จำนวน</th><th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">หมายเหตุ</th></tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {[...stockMovements].reverse().map(log => (
                        <tr key={log.id}>
                          <td className="px-8 py-6 text-xs text-gray-400">{format(new Date(log.timestamp), 'dd MMM, HH:mm')}</td>
                          <td className="px-8 py-6 font-black">{log.itemName}</td>
                          <td className="px-8 py-6 text-center font-black">{log.type === 'In' ? '+' : '-'}{log.quantity}</td>
                          <td className="px-8 py-6 text-xs font-bold text-gray-500">{(log as any).notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {activeTab === 'pdf' && (
           <div className="flex flex-col gap-4">
              {[1,2,3,4,5].map(i => (
                 <div key={i} className="bg-white px-8 py-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                       <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center"><FileText size={22} /></div>
                       <p className="font-black text-[#1A1F3D] text-base truncate">Inventory_Report_Monthly_Summary_0{i}_May_2024</p>
                    </div>
                    <button className="bg-[#1A1F3D] text-[#D9ED5F] px-8 py-3 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2"><Download size={14} /> Download PDF</button>
                 </div>
              ))}
           </div>
        )}

        {activeTab === 'vendors' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map(vendor => (
              <div key={vendor.id} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-16 h-16 bg-[#1A1F3D] text-white rounded-[24px] flex items-center justify-center"><Users size={24} /></div>
                  <div className="flex gap-1"><button onClick={() => handleEditVendor(vendor)} className="p-2 text-gray-300 hover:text-[#1A1F3D]"><Edit3 size={18}/></button><button onClick={() => deleteVendor(vendor.id)} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={18}/></button></div>
                </div>
                <h3 className="text-xl font-black text-[#1A1F3D] mb-6">{vendor.name}</h3>
                <button onClick={() => setSelectedViewVendor(vendor)} className="w-full bg-[#F5F6FA] text-[#1A1F3D] font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all"><FileSearch size={16} /> ตรวจสอบสินค้า</button>
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