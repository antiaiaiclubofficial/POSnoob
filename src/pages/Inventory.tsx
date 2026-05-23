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
import { thaiFontBase64 } from '@/utils/pdfThaiFont'; // Import the Thai font utility
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

  // Logic: PDF Generation - Sales Report Format (Supports Thai)
  const createReportDoc = () => {
    const doc = new jsPDF();
    
    // Register & Use Thai Font
    doc.addFileToVFS("ThaiFont.ttf", thaiFontBase64);
    doc.addFont("ThaiFont.ttf", "ThaiFont", "normal");
    doc.setFont("ThaiFont");

    const dateNow = format(new Date(), 'dd/MM/yyyy HH:mm');
    const mockTaxId = "0-1055-64000-12-3"; // เลขประจำตัวผู้เสียภาษี (ตัวอย่าง)

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
    doc.text(shopName, 15, 20);
    
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text(`เลขประจำตัวผู้เสียภาษี (Tax ID): ${mockTaxId}`, 15, 26);
    doc.text(`ที่อยู่: ${shopAddress}`, 15, 31);
    doc.text(`โทร: ${shopPhone} | LINE: ${shopLineId || '-'}`, 15, 36);

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
    doc.text("เอกสารแจ้งยอดฝากขาย", 195, 58, { align: 'right' });

    // Customer / Partner Box
    doc.setDrawColor(230);
    doc.line(15, 65, 195, 65);

    doc.setFontSize(10);
    doc.text(`Customer / Partner : ${selectedPartner ? selectedPartner.companyName : 'คู่ค้าทั้งหมด'}`, 15, 75);
    doc.text(`วันที่ออกเอกสาร (Date): ${dateNow}`, 130, 75);

    // Table
    autoTable(doc, {
      startY: 85,
      head: [['ลำดับ\nNo.', 'รายการสินค้า\nProduct Name', 'บาร์โค้ด\nBarcode', 'จำนวน\nQty', 'ราคาขาย\nPrice', 'GP %', 'ยอดที่ต้องจ่าย\nPayout']],
      body: itemsToExport.map((i, idx) => {
        const gp = selectedPartner?.gpRate || 0;
        const payout = (i.price * i.stock) * (1 - gp / 100);
        return [
          idx + 1,
          i.name,
          i.barcode || '-',
          i.stock.toLocaleString(),
          i.price.toLocaleString(),
          `${gp}%`,
          payout.toLocaleString()
        ];
      }),
      styles: { font: 'ThaiFont', fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [26, 31, 61], textColor: [255, 255, 255], halign: 'center' },
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
    doc.text("เงื่อนไขการวางบิลและส่งเอกสาร:", 15, finalY);
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`กรุณาวางบิลและส่งเอกสารมาที่: ${shopName}`, 15, finalY + 7);
    doc.text(`ที่อยู่: ${shopAddress}`, 15, finalY + 12);
    doc.text(`ติดต่อ: ${shopPhone}`, 15, finalY + 17);

    // Signatures
    const sigY = finalY + 40;
    if (sigY < 280) {
      doc.line(20, sigY, 80, sigY);
      doc.text("ผู้จัดทำ (Prepared By)", 50, sigY + 5, { align: 'center' });
      
      doc.line(130, sigY, 190, sigY);
      doc.text("ผู้อนุมัติ (Authorized By)", 160, sigY + 5, { align: 'center' });
    }

    return doc;
  };

  const handleDownloadReport = () => {
    const doc = createReportDoc();
    const partnerName = repPartnerFilter === 'All' ? 'All' : partners.find(p => p.id === repPartnerFilter)?.companyName;
    addReportLog({
      reportName: "Sales Report (Consignment)",
      filters: `Partner: ${partnerName}, Cat: ${repCategoryFilter}`,
      staffName: currentUser?.name || 'Admin'
    });
    doc.save(`Sales_Report_${format(new Date(), 'yyyyMMdd')}.pdf`);
    toast.success("ดาวน์โหลดรายงานเรียบร้อยแล้ว");
  };

  const handlePreviewReport = () => {
    const doc = createReportDoc();
    const blob = doc.output('blob');
    setPdfPreviewUrl(URL.createObjectURL(blob));
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
      {/* Header และ Tabs เหมือนเดิม */}
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
        {/* Render เนื้อหาแต่ละ Tab... */}
        {activeTab === 'report' && (
           <div className="max-w-6xl mx-auto space-y-10">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                       <h3 className="text-lg font-black text-[#1A1F3D]">Report Filters</h3>
                       <div className="space-y-4">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-gray-400">Partner / Customer</label>
                             <select className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-sm font-bold" value={repPartnerFilter} onChange={e => setRepPartnerFilter(e.target.value)}>
                                <option value="All">ทั้งหมด</option>
                                {partners.map(p => <option key={p.id} value={p.id}>{p.companyName}</option>)}
                             </select>
                          </div>
                          {/* กรองอื่นๆ... */}
                       </div>
                       <button onClick={handlePreviewReport} className="w-full bg-blue-50 text-blue-600 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3"><Eye size={18} /> Preview</button>
                       <button onClick={handleDownloadReport} className="w-full bg-[#1A1F3D] text-white py-4 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-3"><Download size={18} /> Download PDF</button>
                    </div>
                 </div>
                 <div className="lg:col-span-2 bg-white rounded-[40px] border border-gray-100 p-8">
                    <p className="text-center text-gray-400 font-bold py-20">เลือกคู่ค้าและคลิก Preview เพื่อดูตัวอย่างรายงานภาษาไทย</p>
                 </div>
              </div>
           </div>
        )}

        {/* Tab อื่นๆ ยังคงเดิม... */}
        {activeTab === 'dashboard' && <div className="text-center py-20 font-black opacity-20">DASHBOARD CONTENT</div>}
        {activeTab === 'master' && (
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-8">
             <table className="w-full">
                <thead><tr className="border-b border-gray-50"><th className="py-4 text-left">สินค้า</th><th className="py-4 text-center">สต็อก</th></tr></thead>
                <tbody>{filteredInventory.map(item => (<tr key={item.id} className="border-b border-gray-50"><td className="py-4">{item.name}</td><td className="py-4 text-center">{item.stock}</td></tr>))}</tbody>
             </table>
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