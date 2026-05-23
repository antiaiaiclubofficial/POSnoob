"use client";

import React, { useState, useMemo } from 'react';
import { 
  LayoutGrid, AlertTriangle, PlusCircle, FileText, Users, BarChart3, 
  Search, Edit3, Package, Download, Save, Trash2,
  DollarSign, PieChart as PieIcon, LineChart as LineIcon, BarChart as BarIcon,
  ChevronRight, Camera, CheckCircle2, Plus, Tag, Building2, Filter,
  AlertCircle, ArrowUpRight, RotateCcw, History, ArrowDown, ArrowUp, Info, Eye, Clock, X
} from 'lucide-react';
import { useStore, InventoryItem, Partner } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fetchThaiFontBase64 } from '@/utils/pdfThaiFont';
import { shapeThai } from '@/utils/thaiShaper';
import InventoryModal from '@/components/InventoryModal';
import VendorModal from '@/components/VendorModal';
import VendorInventoryView from '@/components/VendorInventoryView';

type WmsTab = 'master' | 'check' | 'adjust' | 'report' | 'consignment' | 'dashboard';

const Inventory = () => {
  const { 
    inventory, partners, stockLogs, reportHistory, shopName, shopAddress, shopPhone, shopLogo, shopLineId,
    adjustStock, deletePartner, currency, currentUser, addReportLog
  } = useStore();
  
  const [activeTab, setActiveTab] = useState<WmsTab>('master');
  const [repPartnerFilter, setRepPartnerFilter] = useState('All');
  const [repCategoryFilter, setRepCategoryFilter] = useState('All');
  const [repStatusFilter, setRepStatusFilter] = useState('All');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');
  const [checkSearch, setCheckSearch] = useState('');
  const [checkStatusFilter, setCheckStatusFilter] = useState<'All' | 'Low' | 'Out'>('All');
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

  // Partner Actions
  const handleEditPartner = (partner: Partner) => {
    setEditingPartner(partner);
    setIsVendorModalOpen(true);
  };

  const handleDeletePartner = (id: string) => {
    if (window.confirm("ต้องการลบข้อมูลคู่ค้านี้หรือไม่?")) {
      deletePartner(id);
      toast.success("ลบข้อมูลคู่ค้าเรียบร้อยแล้ว");
    }
  };

  // Logic: PDF Generation - Sales Report Format (Supports Thai)
  const createReportDoc = async () => {
    const doc = new jsPDF();
    
    // Load Thai Font dynamically
    const thaiFont = await fetchThaiFontBase64();
    const fontName = thaiFont ? "ThaiFont" : "helvetica";
    const usePUA = !!thaiFont; // เปิดใช้งาน PUA เฉพาะเมื่อโหลดฟอนต์ THSarabunNew สำเร็จเท่านั้น

    if (thaiFont) {
      doc.addFileToVFS("ThaiFont.ttf", thaiFont);
      doc.addFont("ThaiFont.ttf", "ThaiFont", "normal");
      doc.addFont("ThaiFont.ttf", "ThaiFont", "bold");
      doc.setFont("ThaiFont", "normal");
    }

    const dateNow = format(new Date(), 'dd/MM/yyyy HH:mm');
    const mockTaxId = "0-1055-64000-12-3";

    // Apply Filters
    let itemsToExport = [...inventory];
    if (repPartnerFilter !== 'All') itemsToExport = itemsToExport.filter(i => i.partnerId === repPartnerFilter);
    if (repCategoryFilter !== 'All') itemsToExport = itemsToExport.filter(i => i.category === repCategoryFilter);
    if (repStatusFilter === 'Low') itemsToExport = itemsToExport.filter(i => i.stock > 0 && i.stock <= i.minStock);
    if (repStatusFilter === 'Out') itemsToExport = itemsToExport.filter(i => i.stock === 0);

    const selectedPartner = partners.find(p => p.id === repPartnerFilter);

    // Header Left: Company Info
    doc.setFontSize(14);
    doc.setTextColor(26, 31, 61);
    doc.text(shapeThai(shopName, usePUA), 15, 20);
    
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text(shapeThai(`เลขประจำตัวผู้เสียภาษี (Tax ID): ${mockTaxId}`, usePUA), 15, 26);
    doc.text(shapeThai(`ที่อยู่: ${shopAddress}`, usePUA), 15, 31);
    doc.text(shapeThai(`โทร: ${shopPhone} | LINE: ${shopLineId || '-'}`, usePUA), 15, 36);

    // Header Right: Logo & Title
    if (shopLogo) {
      try {
        doc.addImage(shopLogo, 'PNG', 160, 10, 35, 35);
      } catch (e) { console.error(e); }
    }

    doc.setFontSize(18);
    doc.setTextColor(26, 31, 61);
    doc.text("Sales Report", 195, 52, { align: 'right' });
    doc.setFontSize(11);
    doc.text(shapeThai("เอกสารแจ้งยอดฝากขาย", usePUA), 195, 58, { align: 'right' });

    // Customer / Partner Box
    doc.setDrawColor(230);
    doc.line(15, 65, 195, 65);

    doc.setFontSize(10);
    doc.text(shapeThai(`Customer / Partner : ${selectedPartner ? selectedPartner.companyName : 'คู่ค้าทั้งหมด'}`, usePUA), 15, 75);
    doc.text(shapeThai(`วันที่ออกเอกสาร (Date): ${dateNow}`, usePUA), 130, 75);

    // Table
    autoTable(doc, {
      startY: 85,
      head: [[
        shapeThai('ลำดับ\nNo.', usePUA), 
        shapeThai('รายการสินค้า\nProduct Name', usePUA), 
        shapeThai('บาร์โค้ด\nBarcode', usePUA), 
        shapeThai('จำนวน\nQty', usePUA), 
        shapeThai('ราคาขาย\nPrice', usePUA), 
        shapeThai('GP %', usePUA), 
        shapeThai('ยอดที่ต้องจ่าย\nPayout', usePUA)
      ]],
      body: itemsToExport.map((i, idx) => {
        const gp = selectedPartner?.gpRate || 0;
        const payout = (i.price * i.stock) * (1 - gp / 100);
        return [
          idx + 1,
          shapeThai(i.name, usePUA),
          shapeThai(i.barcode || '-', usePUA),
          i.stock.toLocaleString(),
          i.price.toLocaleString(),
          `${gp}%`,
          payout.toLocaleString()
        ];
      }),
      styles: { 
        font: fontName, 
        fontSize: 9, 
        cellPadding: { top: 10, bottom: 6, left: 4, right: 4 },
        valign: 'middle'
      },
      headStyles: { 
        fillColor: [26, 31, 61], 
        textColor: [255, 255, 255], 
        halign: 'center',
        font: fontName,
        fontStyle: 'bold',
        fontSize: 9,
        cellPadding: { top: 10, bottom: 6, left: 4, right: 4 }
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        3: { halign: 'center' },
        4: { halign: 'right' },
        5: { halign: 'center' },
        6: { halign: 'right' }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;

    // Conditions & Billing
    doc.setFontSize(10);
    doc.setTextColor(26, 31, 61);
    doc.text(shapeThai("เงื่อนไขการวางบิลและส่งเอกสาร:", usePUA), 15, finalY);
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(shapeThai(`กรุณาวางบิลและส่งเอกสารมาที่: ${shopName}`, usePUA), 15, finalY + 7);
    doc.text(shapeThai(`ที่อยู่: ${shopAddress}`, usePUA), 15, finalY + 12);
    doc.text(shapeThai(`ติดต่อ: ${shopPhone}`, usePUA), 15, finalY + 17);

    // Signatures
    const sigY = finalY + 40;
    if (sigY < 280) {
      doc.line(20, sigY, 80, sigY);
      doc.text(shapeThai("ผู้จัดทำ (Prepared By)", usePUA), 50, sigY + 5, { align: 'center' });
      
      doc.line(130, sigY, 190, sigY);
      doc.text(shapeThai("ผู้อนุมัติ (Authorized By)", usePUA), 160, sigY + 5, { align: 'center' });
    }

    return doc;
  };

  const handleDownloadReport = async () => {
    const toastId = toast.loading("กำลังเตรียมเอกสาร PDF ภาษาไทย...");
    try {
      const doc = await createReportDoc();
      const partnerName = repPartnerFilter === 'All' ? 'All' : partners.find(p => p.id === repPartnerFilter)?.companyName;
      addReportLog({
        reportName: "Sales Report (Consignment)",
        filters: `Partner: ${partnerName}, Cat: ${repCategoryFilter}`,
        staffName: currentUser?.name || 'Admin'
      });
      doc.save(`Sales_Report_${format(new Date(), 'yyyyMMdd')}.pdf`);
      toast.success("ดาวน์โหลดรายงานเรียบร้อยแล้ว", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการสร้าง PDF", { id: toastId });
    }
  };

  const handlePreviewReport = async () => {
    const toastId = toast.loading("กำลังเตรียมตัวอย่างเอกสาร...");
    try {
      const doc = await createReportDoc();
      const blob = doc.output('blob');
      setPdfPreviewUrl(URL.createObjectURL(blob));
      toast.success("โหลดตัวอย่างเรียบร้อย", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการโหลดตัวอย่าง", { id: toastId });
    }
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdjustId || !adjustQty) return toast.error("กรุณาเลือกสินค้าและระบุจำนวน");
    adjustStock(selectedAdjustId, Number(adjustQty), adjustMode, adjustReason || 'Manual Adjustment');
    toast.success("บันทึกการปรับยอดเรียบร้อย");
    setAdjustQty(''); setAdjustReason(''); setAdjustSearch(''); setSelectedAdjustId('');
  };

  const handleQuickAdjust = (id: string) => {
    const newQty = prompt("ระบุจำนวนสต็อกที่ถูกต้อง:");
    if (newQty !== null && !isNaN(Number(newQty))) {
      adjustStock(id, Number(newQty), 'Set', 'Physical Audit');
      toast.success("อัปเดตสต็อกเรียบร้อย");
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

        {activeTab === 'master' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
               <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 w-full">
                     <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 px-2">ค้นหาสินค้า</label><div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} /><input className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-6 py-4 text-sm font-bold shadow-inner" placeholder="ค้นหา..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div></div>
                     <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 px-2">หมวดหมู่</label><select className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold shadow-inner appearance-none" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}><option value="">ทั้งหมด</option>{categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}</select></div>
                     <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 px-2">คู่ค้า</label><select className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold shadow-inner appearance-none" value={partnerFilter} onChange={e => setPartnerFilter(e.target.value)}><option value="">ทั้งหมด</option>{partners.map(p => <option key={p.id} value={p.id}>{p.companyName}</option>)}</select></div>
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

        {activeTab === 'adjust' && (
           <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in slide-in-from-bottom-4 duration-300">
              <div className="lg:col-span-1"><div className="bg-white p-8 rounded-[48px] border border-gray-100 shadow-sm space-y-8"><div><h3 className="text-xl font-black text-[#1A1F3D] mb-1">Update Balance</h3><p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Add stock or set quantity</p></div><form onSubmit={handleAdjustSubmit} className="space-y-6"><div className="space-y-2 relative"><label className="text-[10px] font-black uppercase text-gray-400 px-2">1. ค้นหาสินค้า</label><div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} /><input className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-6 py-4 text-sm font-bold shadow-inner" placeholder="พิมพ์ชื่อหรือบาร์โค้ด..." value={adjustSearch} onChange={e => setAdjustSearch(e.target.value)} /></div>{adjustSearchItems.length > 0 && !selectedAdjustId && (<div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">{adjustSearchItems.map(item => (<button key={item.id} type="button" onClick={() => { setSelectedAdjustId(item.id); setAdjustSearch(item.name); }} className="w-full px-5 py-4 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0 flex justify-between items-center transition-colors"><div><p className="text-sm font-black text-[#1A1F3D]">{item.name}</p><p className="text-[10px] text-gray-400 font-bold uppercase">{item.barcode || 'No Barcode'}</p></div><p className="text-xs font-black text-blue-500">Stock: {item.stock}</p></button>))}</div>)}</div>{selectedItemForAdjust && (<div className="p-5 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-center gap-4 animate-in zoom-in-95"><div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm shrink-0"><Package size={24} /></div><div><p className="text-xs font-black text-[#1A1F3D]">{selectedItemForAdjust.name}</p><p className="text-[10px] text-blue-600 font-black uppercase">Current: {selectedItemForAdjust.stock}</p></div><button type="button" onClick={() => setSelectedAdjustId('')} className="ml-auto p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button></div>)}<div className="space-y-3"><label className="text-[10px] font-black uppercase text-gray-400 px-2">2. ประเภทการทำงาน</label><div className="flex bg-[#F5F6FA] p-1.5 rounded-[22px] gap-2"><button type="button" onClick={() => setAdjustMode('Add')} className={cn("flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2", adjustMode === 'Add' ? "bg-white text-green-600 shadow-sm" : "text-gray-400")}><ArrowUp size={12} /> เติมเพิ่ม</button><button type="button" onClick={() => setAdjustMode('Set')} className={cn("flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2", adjustMode === 'Set' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}><RotateCcw size={12} /> ปรับตามจริง</button></div></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 px-2">3. จำนวน</label><input type="number" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-xl font-black text-center" placeholder="0" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} /></div><div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 px-2">4. หมายเหตุ</label><input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" placeholder="..." value={adjustReason} onChange={e => setAdjustReason(e.target.value)} /></div></div><button type="submit" disabled={!selectedAdjustId || !adjustQty} className="w-full bg-[#1A1F3D] text-white font-black py-5 rounded-[28px] shadow-xl shadow-[#1A1F3D]/20 flex items-center justify-center gap-3 transition-all active:scale-95"><Save size={20} /> บันทึกการปรับสต็อก</button></form></div></div>
              <div className="lg:col-span-2"><div className="bg-white rounded-[48px] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full"><div className="p-8 border-b border-gray-50 flex items-center gap-3 bg-gray-50/20"><div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><History size={20} /></div><div><h3 className="text-xl font-black text-[#1A1F3D]">Movement History</h3><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Audit Trail</p></div></div><div className="flex-1 overflow-y-auto scrollbar-hide"><table className="w-full"><thead><tr className="bg-white border-b border-gray-50"><th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">Timestamp</th><th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">Product</th><th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">Action</th><th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">New Bal</th></tr></thead><tbody className="divide-y divide-gray-50">{stockLogs.map((log) => (<tr key={log.id} className="hover:bg-[#F8F9FD]"><td className="px-8 py-6"><p className="text-xs font-black text-[#1A1F3D]">{format(new Date(log.timestamp), 'HH:mm • dd MMM')}</p><p className="text-[9px] text-gray-400 font-bold uppercase">{log.staffName}</p></td><td className="px-8 py-6"><p className="text-sm font-black text-[#1A1F3D]">{log.productName}</p><p className="text-[9px] text-gray-400 font-bold italic line-clamp-1">"{log.reason}"</p></td><td className="px-8 py-6 text-center"><span className={cn("px-3 py-1 rounded-lg text-[8px] font-black uppercase", log.action === 'Add' || log.action === 'In' ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600")}>{log.action}</span></td><td className="px-8 py-6 text-right font-black text-[#1A1F3D]">{log.newQty}</td></tr>))}</tbody></table></div></div></div>
           </div>
        )}

        {activeTab === 'report' && (
           <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                             <Filter size={20} />
                          </div>
                          <h3 className="text-lg font-black text-[#1A1F3D]">Report Filters</h3>
                       </div>

                       <div className="space-y-4">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-gray-400 px-1">Partner / Vendor</label>
                             <select className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-sm font-bold" value={repPartnerFilter} onChange={e => setRepPartnerFilter(e.target.value)}>
                                <option value="All">ทั้งหมด (All Partners)</option>
                                {partners.map(p => <option key={p.id} value={p.id}>{p.companyName}</option>)}
                             </select>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-gray-400 px-1">Category</label>
                             <select className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-sm font-bold" value={repCategoryFilter} onChange={e => setRepCategoryFilter(e.target.value)}>
                                <option value="All">ทั้งหมด (All Categories)</option>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                             </select>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-gray-400 px-1">Stock Status</label>
                             <select className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-sm font-bold" value={repStatusFilter} onChange={e => setRepStatusFilter(e.target.value)}>
                                <option value="All">ทั้งหมด (All Items)</option>
                                <option value="Low">ใกล้หมด (Low Stock Only)</option>
                                <option value="Out">สินค้าหมด (Out of Stock Only)</option>
                             </select>
                          </div>
                       </div>

                       <div className="space-y-3 pt-2">
                          <button onClick={handlePreviewReport} className="w-full bg-blue-50 text-blue-600 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 active:scale-95 transition-all">
                             <Eye size={18} /> Preview Report
                          </button>
                          <button onClick={handleDownloadReport} className="w-full bg-[#1A1F3D] text-white py-4 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                             <Download size={18} /> Download PDF
                          </button>
                       </div>
                    </div>
                 </div>

                 <div className="lg:col-span-2">
                    <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
                       <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
                          <div className="flex items-center gap-3">
                             <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><History size={20} /></div>
                             <div>
                                <h3 className="text-xl font-black text-[#1A1F3D]">Report History</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Recent exports</p>
                             </div>
                          </div>
                       </div>
                       
                       <div className="flex-1 overflow-y-auto scrollbar-hide max-h-[500px]">
                          <table className="w-full">
                             <thead>
                                <tr className="bg-white border-b border-gray-50">
                                   <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">Timestamp</th>
                                   <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">Filters Applied</th>
                                   <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">Staff</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-50">
                                {reportHistory.map((rep) => (
                                   <tr key={rep.id} className="hover:bg-gray-50/50">
                                      <td className="px-8 py-6">
                                         <p className="text-xs font-black text-[#1A1F3D]">{format(new Date(rep.timestamp), 'dd MMM yyyy')}</p>
                                         <p className="text-[9px] text-gray-400 font-bold">{format(new Date(rep.timestamp), 'HH:mm')}</p>
                                      </td>
                                      <td className="px-8 py-6">
                                         <p className="text-[10px] font-medium text-gray-500 line-clamp-1">{rep.filters}</p>
                                      </td>
                                      <td className="px-8 py-6 text-right font-black text-[10px] text-[#1A1F3D] uppercase">{rep.staffName}</td>
                                   </tr>
                                ))}
                                {reportHistory.length === 0 && (
                                   <tr><td colSpan={3} className="py-20 text-center opacity-20 font-black">No export history found</td></tr>
                                )}
                             </tbody>
                          </table>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'consignment' && (
           <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-300">
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

      {/* PDF Preview Modal */}
      {pdfPreviewUrl && (
        <div className="fixed inset-0 bg-[#1A1F3D]/60 backdrop-blur-md z-[300] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[48px] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
               <h3 className="text-sm font-black text-[#1A1F3D]">Sales Report Preview (รองรับภาษาไทย)</h3>
               <button onClick={() => setPdfPreviewUrl(null)}><X size={20} /></button>
            </div>
            <iframe src={pdfPreviewUrl} className="flex-1 w-full" title="PDF Preview" />
            <div className="p-6 flex justify-end gap-4"><button onClick={handleDownloadReport} className="bg-[#1A1F3D] text-white px-10 py-3 rounded-xl font-black text-sm">Download PDF</button></div>
          </div>
        </div>
      )}

      {isItemModalOpen && <InventoryModal item={editingItem} onClose={() => setIsItemModalOpen(false)} />}
      {isVendorModalOpen && <VendorModal partner={editingPartner} onClose={() => setIsVendorModalOpen(false)} />}
      {selectedVendorForView && <VendorInventoryView vendor={selectedVendorForView} onClose={() => setSelectedVendorForView(null)} />}
    </div>
  );
};

export default Inventory;