"use client";

import React, { useState, useMemo } from 'react';
import { 
  LayoutGrid, AlertTriangle, PlusCircle, FileText, Users, BarChart3, 
  Search, Edit3, Package, Download, Save, Printer, Trash2, ArrowRight,
  TrendingUp, DollarSign, PieChart as PieIcon, LineChart as LineIcon, BarChart as BarIcon,
  ChevronRight, Camera, CheckCircle2
} from 'lucide-react';
import { useStore, InventoryItem, Partner, StockLog } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, 
  Cell, PieChart, Pie, LineChart, Line, CartesianGrid 
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import InventoryModal from '@/components/InventoryModal';
import VendorModal from '@/components/VendorModal';

type WmsTab = 'master' | 'check' | 'adjust' | 'report' | 'consignment' | 'dashboard';

const Inventory = () => {
  const { 
    inventory, partners, stockLogs, systemSettings, transactions,
    adjustStock, updateSystemSettings, deleteInventoryItem, deletePartner, language 
  } = useStore();
  
  const [activeTab, setActiveTab] = useState<WmsTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

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

  // Logic: Filters
  const filteredInventory = inventory.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    i.barcode?.includes(searchQuery)
  );

  // Logic: Dashboard Stats
  const dashboardStats = useMemo(() => {
    const totalValue = inventory.reduce((acc, i) => acc + (i.costPrice * i.stock), 0);
    const lowStock = inventory.filter(i => i.stock > 0 && i.stock <= i.minStock).length;
    const outOfStock = inventory.filter(i => i.stock === 0).length;
    
    // Mock charts data
    const pieData = [
      { name: 'สินค้าเราเอง', value: inventory.filter(i => !i.isConsignment).length, color: '#1A1F3D' },
      { name: 'สินค้าฝากขาย', value: inventory.filter(i => i.isConsignment).length, color: '#D9ED5F' }
    ];

    return { totalValue, lowStock, outOfStock, pieData };
  }, [inventory]);

  const handleExportCSV = () => {
    const headers = ["Barcode", "Name", "Stock", "Status"];
    const rows = inventory.map(i => [
      i.barcode, 
      i.name, 
      i.stock, 
      i.stock === 0 ? "หมด" : i.stock <= i.minStock ? "ใกล้หมด" : "ปกติ"
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inventory_report.csv");
    document.body.appendChild(link);
    link.click();
    toast.success("ส่งออกไฟล์สำเร็จ");
  };

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
    // Simplified A4 PDF generation demo
    doc.text(systemSettings.billHeader, 10, 10);
    doc.text(systemSettings.address, 10, 20);
    autoTable(doc, {
      startY: 30,
      head: [['Product', 'Qty', 'Unit Price', 'Total']],
      body: inventory.map(i => [i.name, i.stock, i.price, i.stock * i.price])
    });
    doc.save("inventory_report.pdf");
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8F9FD] overflow-hidden">
      {/* Sidebar / Tabs Navigation */}
      <header className="px-10 py-8 bg-white border-b border-gray-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pl-14 lg:pl-10">
        <div>
          <h1 className="text-3xl font-black text-[#1A1F3D] mb-1">Inventory & WMS</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Management System v2.0</p>
        </div>
        <div className="flex bg-[#F5F6FA] p-1.5 rounded-[28px] border border-gray-100 shadow-sm gap-1 overflow-x-auto scrollbar-hide w-full lg:w-auto">
          {menuItems.map((item) => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id as WmsTab)} 
              className={cn(
                "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap", 
                activeTab === item.id ? "bg-[#1A1F3D] text-white shadow-lg" : "text-gray-400 hover:bg-white"
              )}
            >
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
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6"><Package size={24} /></div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Total SKUs</p>
                <h2 className="text-4xl font-black text-[#1A1F3D]">{inventory.length}</h2>
              </div>
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mb-6"><DollarSign size={24} /></div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Inventory Value</p>
                <h2 className="text-4xl font-black text-[#1A1F3D]">฿{dashboardStats.totalValue.toLocaleString()}</h2>
              </div>
              <div className="bg-white p-8 rounded-[40px] border border-orange-100 shadow-sm">
                <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mb-6"><AlertTriangle size={24} /></div>
                <p className="text-[10px] font-black uppercase text-orange-400 tracking-widest mb-1">Low Stock</p>
                <h2 className="text-4xl font-black text-orange-600">{dashboardStats.lowStock}</h2>
              </div>
              <div className="bg-white p-8 rounded-[40px] border border-red-100 shadow-sm">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6"><Trash2 size={24} /></div>
                <p className="text-[10px] font-black uppercase text-red-400 tracking-widest mb-1">Out of Stock</p>
                <h2 className="text-4xl font-black text-red-600">{dashboardStats.outOfStock}</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm">
                  <h3 className="text-xl font-black text-[#1A1F3D] mb-8 flex items-center gap-2"><PieIcon size={20} className="text-blue-500" />สัดส่วนประเภทสินค้า</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={dashboardStats.pieData} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                          {dashboardStats.pieData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                        </Pie>
                        <ChartTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                     {dashboardStats.pieData.map(d => (
                       <div key={d.name} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="text-xs font-bold text-gray-500">{d.name}</span>
                       </div>
                     ))}
                  </div>
               </div>

               <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm">
                  <h3 className="text-xl font-black text-[#1A1F3D] mb-8 flex items-center gap-2"><LineIcon size={20} className="text-indigo-500" />Stock Movement (30 Days)</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[{day: '1', v: 10}, {day: '10', v: 45}, {day: '20', v: 30}, {day: '30', v: 60}]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <ChartTooltip />
                        <Line type="monotone" dataKey="v" stroke="#1A1F3D" strokeWidth={4} dot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* TAB 2: Master List */}
        {activeTab === 'master' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="relative w-full lg:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold shadow-sm" 
                  placeholder="ค้นหาบาร์โค้ด หรือ ชื่อสินค้า..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                onClick={() => { setEditingItem(null); setIsItemModalOpen(true); }}
                className="bg-[#1A1F3D] text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl"
              >
                เพิ่มสินค้าใหม่
              </button>
            </div>

            <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-8 py-6 text-left text-[10px] font-black uppercase text-gray-400">บาร์โค้ด / รูป</th>
                      <th className="px-8 py-6 text-left text-[10px] font-black uppercase text-gray-400">ชื่อสินค้า / หมวดหมู่</th>
                      <th className="px-8 py-6 text-center text-[10px] font-black uppercase text-gray-400">ต้นทุน</th>
                      <th className="px-8 py-6 text-center text-[10px] font-black uppercase text-gray-400">ราคาขาย</th>
                      <th className="px-8 py-6 text-left text-[10px] font-black uppercase text-gray-400">ผู้จัดจำหน่าย</th>
                      <th className="px-8 py-6 text-right text-[10px] font-black uppercase text-gray-400">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredInventory.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-6 flex items-center gap-4">
                           <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                              {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Package className="w-full h-full p-3 text-gray-300" />}
                           </div>
                           <span className="text-xs font-black text-gray-400">{item.barcode || '-'}</span>
                        </td>
                        <td className="px-8 py-6">
                           <p className="text-sm font-black text-[#1A1F3D]">{item.name}</p>
                           <p className="text-[9px] font-black uppercase text-blue-500">{item.category}</p>
                        </td>
                        <td className="px-8 py-6 text-center text-sm font-bold text-gray-400">฿{item.costPrice}</td>
                        <td className="px-8 py-6 text-center text-sm font-black text-[#1A1F3D]">฿{item.price}</td>
                        <td className="px-8 py-6">
                           {item.isConsignment ? (
                             <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[9px] font-black uppercase">ฝากขาย: {partners.find(p => p.id === item.partnerId)?.companyName}</span>
                           ) : (
                             <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[9px] font-black uppercase">สินค้าของเรา</span>
                           )}
                        </td>
                        <td className="px-8 py-6 text-right">
                           <button onClick={() => { setEditingItem(item); setIsItemModalOpen(true); }} className="p-3 text-gray-300 hover:text-[#1A1F3D] hover:bg-white rounded-xl transition-all"><Edit3 size={16}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Stock Check */}
        {activeTab === 'check' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-[#1A1F3D]">Inventory Status & Alerts</h3>
                <button onClick={handleExportCSV} className="bg-white border border-gray-100 text-[#1A1F3D] px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 shadow-sm"><Download size={14}/> Export to Excel (.CSV)</button>
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

        {/* TAB 4: Stock Adjustment */}
        {activeTab === 'adjust' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-300">
             <div className="lg:col-span-1 space-y-8">
                <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm space-y-8">
                   <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl"><PlusCircle size={24} /></div>
                      <h2 className="text-xl font-black">Stock Adjustment</h2>
                   </div>

                   <form onSubmit={handleAdjustSubmit} className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">เลือกสินค้า (Scan หรือ ค้นหา)</label>
                         <select 
                           className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 font-bold text-sm" 
                           value={selectedAdjustId}
                           onChange={e => setSelectedAdjustId(e.target.value)}
                         >
                            <option value="">-- เลือกสินค้า --</option>
                            {inventory.map(i => <option key={i.id} value={i.id}>{i.name} (คงเหลือ: {i.stock})</option>)}
                         </select>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">โหมดการทำงาน</label>
                         <div className="flex bg-[#F5F6FA] p-1.5 rounded-[22px] gap-2">
                            <button 
                              type="button" 
                              onClick={() => setAdjustMode('Add')}
                              className={cn("flex-1 py-3 rounded-[18px] text-[10px] font-black transition-all", adjustMode === 'Add' ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400")}
                            >
                              เติมสินค้า (+)
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setAdjustMode('Set')}
                              className={cn("flex-1 py-3 rounded-[18px] text-[10px] font-black transition-all", adjustMode === 'Set' ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400")}
                            >
                              ปรับยอดใหม่ (=)
                            </button>
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">จำนวน</label>
                         <input 
                           type="number" 
                           className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 font-black text-xl text-blue-600" 
                           placeholder="0.00" 
                           value={adjustQty}
                           onChange={e => setAdjustQty(e.target.value)}
                         />
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">เหตุผลในการปรับยอด</label>
                         <input 
                           className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 font-bold text-sm" 
                           placeholder="เช่น สินค้ามาส่ง, สินค้าชำรุด..." 
                           value={adjustReason}
                           onChange={e => setAdjustReason(e.target.value)}
                         />
                      </div>

                      <button type="submit" className="w-full bg-[#1A1F3D] text-white font-black py-5 rounded-[28px] shadow-xl hover:scale-[1.02] active:scale-95 transition-all">บันทึกรายการ</button>
                   </form>
                </div>
             </div>

             <div className="lg:col-span-2">
                <div className="bg-white rounded-[48px] border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col">
                   <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                      <h3 className="text-sm font-black uppercase tracking-widest text-[#1A1F3D]">ประวัติการเคลื่อนไหวสต็อก (Stock_Log)</h3>
                   </div>
                   <div className="flex-1 overflow-y-auto scrollbar-hide">
                      <table className="w-full">
                         <thead>
                            <tr className="bg-gray-50/30">
                               <th className="px-8 py-5 text-left text-[9px] font-black uppercase text-gray-400">วันที่ / เวลา</th>
                               <th className="px-8 py-5 text-left text-[9px] font-black uppercase text-gray-400">รายการสินค้า</th>
                               <th className="px-8 py-5 text-center text-[9px] font-black uppercase text-gray-400">จำนวนเดิม</th>
                               <th className="px-8 py-5 text-center text-[9px] font-black uppercase text-gray-400">จำนวนใหม่</th>
                               <th className="px-8 py-5 text-left text-[9px] font-black uppercase text-gray-400">เหตุผล</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-50">
                            {stockLogs.map(log => (
                               <tr key={log.id}>
                                  <td className="px-8 py-5 text-[10px] text-gray-400 font-bold uppercase">{format(new Date(log.timestamp), 'dd MMM, HH:mm')}</td>
                                  <td className="px-8 py-5 text-xs font-black text-[#1A1F3D]">{log.productName}</td>
                                  <td className="px-8 py-5 text-center text-xs font-bold text-gray-400">{log.oldQty}</td>
                                  <td className="px-8 py-5 text-center text-xs font-black text-green-600">{log.newQty}</td>
                                  <td className="px-8 py-5 text-[10px] font-bold text-gray-500 italic truncate max-w-[150px]">{log.reason || '-'}</td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* TAB 5: Report Preview A4 */}
        {activeTab === 'report' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 animate-in slide-in-from-bottom-4 duration-300">
             <div className="space-y-8">
                <section className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm space-y-8">
                   <h3 className="text-xl font-black text-[#1A1F3D]">Bill Customization (หัวบิล)</h3>
                   <div className="space-y-6">
                      <div className="flex flex-col items-center mb-6">
                         <div className="w-24 h-24 bg-gray-100 rounded-3xl mb-4 border-2 border-dashed border-gray-200 flex items-center justify-center relative overflow-hidden group">
                            {systemSettings.logo ? <img src={systemSettings.logo} className="w-full h-full object-cover" /> : <Camera className="text-gray-300" />}
                            <button className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Plus size={20}/></button>
                         </div>
                         <p className="text-[10px] font-black uppercase text-gray-300 tracking-widest">Company Logo</p>
                      </div>
                      <div className="space-y-4">
                         <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">ชื่อหัวบิล (บริษัท)</label>
                           <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 font-bold text-sm" value={systemSettings.billHeader} onChange={e => updateSystemSettings({ billHeader: e.target.value })} />
                         </div>
                         <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">เลขผู้เสียภาษี</label>
                           <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 font-bold text-sm" value={systemSettings.taxId} onChange={e => updateSystemSettings({ taxId: e.target.value })} />
                         </div>
                         <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">เบอร์โทรศัพท์</label>
                           <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 font-bold text-sm" value={systemSettings.phone} onChange={e => updateSystemSettings({ phone: e.target.value })} />
                         </div>
                         <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">ที่อยู่บริษัท</label>
                           <textarea className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 font-bold text-sm h-24 resize-none" value={systemSettings.address} onChange={e => updateSystemSettings({ address: e.target.value })} />
                         </div>
                      </div>
                   </div>
                </section>
             </div>

             <div className="flex flex-col items-center">
                <div className="bg-gray-400/20 p-8 rounded-xl shadow-2xl mb-10 w-full max-w-[595px]">
                   <div className="bg-white w-full aspect-[210/297] shadow-2xl p-10 flex flex-col font-serif" id="a4-preview">
                      <div className="flex justify-between items-start border-b-2 border-black pb-8 mb-8">
                         <div className="w-16 h-16 bg-black flex items-center justify-center text-white font-black text-xl rounded-lg">M</div>
                         <div className="text-right flex-1">
                            <h2 className="text-xl font-bold uppercase mb-2">{systemSettings.billHeader}</h2>
                            <p className="text-[8px] leading-relaxed text-gray-600 max-w-[250px] ml-auto">{systemSettings.address}</p>
                            <p className="text-[8px] text-gray-600">Tel: {systemSettings.phone} | TAX: {systemSettings.taxId}</p>
                         </div>
                      </div>

                      <div className="flex justify-between mb-10">
                         <div>
                            <p className="text-[10px] font-bold uppercase mb-2">Billing To:</p>
                            <p className="text-xs font-bold">General Customer</p>
                            <p className="text-[8px] text-gray-500">Walk-in Client</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] font-bold uppercase mb-1">Receipt ID:</p>
                            <p className="text-xs font-black">#INV-{new Date().getFullYear()}-001</p>
                            <p className="text-[9px] font-bold mt-2">Date: {format(new Date(), 'dd/MM/yyyy')}</p>
                         </div>
                      </div>

                      <table className="w-full text-[10px] border-collapse mb-10">
                         <thead>
                            <tr className="border-y border-black">
                               <th className="py-2 text-left">Item Description</th>
                               <th className="py-2 text-center">Qty</th>
                               <th className="py-2 text-right">Unit Price</th>
                               <th className="py-2 text-right">Amount</th>
                            </tr>
                         </thead>
                         <tbody>
                            {inventory.slice(0, 3).map(i => (
                               <tr key={i.id} className="border-b border-gray-100">
                                  <td className="py-3">{i.name}</td>
                                  <td className="py-3 text-center">{i.stock}</td>
                                  <td className="py-3 text-right">฿{i.price}</td>
                                  <td className="py-3 text-right font-bold">฿{(i.stock * i.price).toLocaleString()}</td>
                               </tr>
                            ))}
                         </tbody>
                      </table>

                      <div className="mt-auto border-t-2 border-black pt-6">
                         <div className="flex justify-end gap-10">
                            <div className="text-right space-y-1">
                               <p className="text-[10px] font-bold">Subtotal:</p>
                               <p className="text-[10px] font-bold">Tax (7%):</p>
                               <p className="text-xs font-black pt-2">Total Amount:</p>
                            </div>
                            <div className="text-right space-y-1">
                               <p className="text-[10px]">฿1,500.00</p>
                               <p className="text-[10px]">฿105.00</p>
                               <p className="text-xs font-black pt-2">฿1,605.00</p>
                            </div>
                         </div>

                         <div className="flex justify-between mt-20 gap-20">
                            <div className="flex-1 text-center border-t border-black pt-2">
                               <p className="text-[8px] font-black uppercase">Prepared By</p>
                            </div>
                            <div className="flex-1 text-center border-t border-black pt-2">
                               <p className="text-[8px] font-black uppercase">Receiver Signature</p>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
                <div className="flex gap-4">
                   <button onClick={generatePDF} className="bg-[#1A1F3D] text-white px-10 py-5 rounded-[24px] font-black flex items-center gap-3 shadow-2xl transition-all active:scale-95"><Download size={20}/> Download PDF</button>
                   <button onClick={() => window.print()} className="bg-white border border-gray-100 text-[#1A1F3D] px-10 py-5 rounded-[24px] font-black flex items-center gap-3 shadow-xl hover:bg-gray-50 transition-all active:scale-95"><Printer size={20}/> Print Bill</button>
                </div>
             </div>
          </div>
        )}

        {/* TAB 6: Consignment */}
        {activeTab === 'consignment' && (
           <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-300">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                 <div className="xl:col-span-1">
                    <section className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm space-y-8">
                       <h3 className="text-xl font-black text-[#1A1F3D]">Partner Profile</h3>
                       <form onSubmit={(e) => { e.preventDefault(); toast.success('Partner created'); }} className="space-y-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-gray-400 px-2">ชื่อบริษัท</label>
                             <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 font-bold text-sm" placeholder="เช่น บจก. เอบีซี เทรดดิ้ง" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-gray-400 px-2">ส่วนแบ่งร้าน (GP %)</label>
                             <div className="relative">
                               <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-blue-500">%</span>
                               <input type="number" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 font-black text-xl text-blue-600" placeholder="20" />
                             </div>
                             <p className="text-[9px] text-gray-400 font-bold px-2 italic">* ร้านจะได้รับ GP% และส่วนที่เหลือจ่ายให้คู่ค้า</p>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-gray-400 px-2">เลขประจำตัวผู้เสียภาษี</label>
                             <input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 font-bold text-sm" placeholder="01XXXXXXXXXXX" />
                          </div>
                          <button type="submit" className="w-full bg-[#1A1F3D] text-white font-black py-5 rounded-[28px] shadow-xl">เพิ่มโปรไฟล์คู่ค้า</button>
                       </form>
                    </section>
                 </div>

                 <div className="xl:col-span-2 space-y-8">
                    <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm">
                       <h3 className="text-xl font-black text-[#1A1F3D] mb-8">Settlement Report (สรุปยอดฝากขาย)</h3>
                       <div className="overflow-x-auto">
                          <table className="w-full">
                             <thead>
                                <tr className="bg-gray-50/50">
                                   <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">คู่ค้า</th>
                                   <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">GP (%)</th>
                                   <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">ยอดขายรวม</th>
                                   <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">ส่วนแบ่งร้าน</th>
                                   <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">ยอดที่ต้องจ่าย</th>
                                   <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">Actions</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-50">
                                {partners.map(p => {
                                   const totalSales = 5000; // Mock calculation
                                   const shopShare = totalSales * (p.gpRate / 100);
                                   const partnerPayout = totalSales - shopShare;
                                   return (
                                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                         <td className="px-8 py-6 font-black text-sm">{p.companyName}</td>
                                         <td className="px-8 py-6 text-center text-sm font-bold text-blue-500">{p.gpRate}%</td>
                                         <td className="px-8 py-6 text-right text-sm font-bold">฿{totalSales.toLocaleString()}</td>
                                         <td className="px-8 py-6 text-right text-sm font-black text-green-600">฿{shopShare.toLocaleString()}</td>
                                         <td className="px-8 py-6 text-right text-sm font-black text-[#1A1F3D]">฿{partnerPayout.toLocaleString()}</td>
                                         <td className="px-8 py-6 text-center">
                                            <button onClick={generatePDF} className="bg-[#D9ED5F] text-[#1A1F3D] px-4 py-2 rounded-xl text-[9px] font-black uppercase shadow-sm">ออกใบแจ้งยอด</button>
                                         </td>
                                      </tr>
                                   );
                                })}
                             </tbody>
                          </table>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}
      </div>

      {isItemModalOpen && <InventoryModal item={editingItem} onClose={() => setIsItemModalOpen(false)} />}
    </div>
  );
};

export default Inventory;