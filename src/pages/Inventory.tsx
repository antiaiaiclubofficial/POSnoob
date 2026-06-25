"use client";

import React, { useState, useMemo } from 'react';
import { 
  LayoutGrid, AlertTriangle, PlusCircle, FileText, Users, BarChart3, 
  Search, Edit3, Package, Download, Save, Trash2,
  DollarSign, PieChart as PieIcon, LineChart as LineIcon, BarChart as BarIcon,
  ChevronRight, Camera, CheckCircle2, Plus, Tag, Building2, Filter,
  AlertCircle, ArrowUpRight, RotateCcw, History, ArrowDown, ArrowUp, Info, Eye, Clock, X, Calendar, User
} from 'lucide-react';
import { useStore, InventoryItem, Partner } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { format, subDays, startOfMonth } from 'date-fns';
import { toast } from 'sonner';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx';
import InventoryModal from '@/components/InventoryModal';
import VendorModal from '@/components/VendorModal';
import VendorInventoryView from '@/components/VendorInventoryView';
import InventoryReportLivePreview from '@/components/InventoryReportLivePreview';
import QuickAdjustModal from '@/components/QuickAdjustModal';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

type WmsTab = 'master' | 'check' | 'adjust' | 'report' | 'consignment' | 'dashboard';

const Inventory = () => {
  const { 
    inventory, partners, stockLogs, reportHistory, shopName, shopAddress, shopPhone, shopLineId,
    companyName, companyAddress, companyTaxId, companyPhone, companyEmail,
    adjustStock, deletePartner, currency, currentUser, addReportLog, transactions,
    deleteInventoryItem
  } = useStore();
  
  const [activeTab, setActiveTab] = useState<WmsTab>('dashboard');
  const [repPartnerFilter, setRepPartnerFilter] = useState('All');
  const [repCategoryFilter, setRepCategoryFilter] = useState('All');
  const [repStatusFilter, setRepStatusFilter] = useState('All');

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

  const [dashStartDate, setDashStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dashEndDate, setDashEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [selectedVendorForView, setSelectedVendorForView] = useState<Partner | null>(null);
  
  // Quick Adjust Modal State
  const [quickAdjustItem, setQuickAdjustItem] = useState<InventoryItem | null>(null);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'master', label: 'สินค้าทั้งหมด', icon: LayoutGrid },
    { id: 'check', label: 'เช็คสต็อก/แจ้งเตือน', icon: AlertTriangle },
    { id: 'adjust', label: 'เติม/ปรับยอด', icon: PlusCircle },
    { id: 'report', label: 'รายงาน Word', icon: FileText },
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

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => tx.date >= dashStartDate && tx.date <= dashEndDate);
  }, [transactions, dashStartDate, dashEndDate]);

  const productSales = useMemo(() => {
    const salesList: {
      txId: string;
      date: string;
      productName: string;
      quantity: number;
      price: number;
      total: number;
      customerName: string;
      paymentMethod: string;
      staffName: string;
    }[] = [];

    filteredTransactions.forEach(tx => {
      tx.items.forEach(item => {
        if (item.type === 'Product') {
          salesList.push({
            txId: tx.id,
            date: tx.date,
            productName: item.title,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity,
            customerName: tx.customerName,
            paymentMethod: tx.paymentMethod,
            staffName: tx.staffName || 'Admin'
          });
        }
      });
    });

    return salesList;
  }, [filteredTransactions]);

  const chartData = useMemo(() => {
    const agg: Record<string, { name: string; qty: number; revenue: number }> = {};
    productSales.forEach(sale => {
      if (!agg[sale.productName]) {
        agg[sale.productName] = { name: sale.productName, qty: 0, revenue: 0 };
      }
      agg[sale.productName].qty += sale.quantity;
      agg[sale.productName].revenue += sale.total;
    });
    return Object.values(agg).sort((a, b) => b.revenue - a.revenue);
  }, [productSales]);

  const totalProductRevenue = useMemo(() => {
    return productSales.reduce((acc, s) => acc + s.total, 0);
  }, [productSales]);

  const totalProductsSold = useMemo(() => {
    return productSales.reduce((acc, s) => acc + s.quantity, 0);
  }, [productSales]);

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

  const handleDeleteItem = async (id: string) => {
    if (window.confirm("ต้องการลบสินค้านี้หรือไม่?")) {
      await deleteInventoryItem(id);
      toast.success("ลบสินค้าเรียบร้อยแล้ว");
    }
  };

  const reportItems = useMemo(() => {
    let itemsToExport = [...inventory];
    if (repPartnerFilter !== 'All') itemsToExport = itemsToExport.filter(i => i.partnerId === repPartnerFilter);
    if (repCategoryFilter !== 'All') itemsToExport = itemsToExport.filter(i => i.category === repCategoryFilter);
    if (repStatusFilter === 'Low') itemsToExport = itemsToExport.filter(i => i.stock > 0 && i.stock <= i.minStock);
    if (repStatusFilter === 'Out') itemsToExport = itemsToExport.filter(i => i.stock === 0);
    return itemsToExport;
  }, [inventory, repPartnerFilter, repCategoryFilter, repStatusFilter]);

  const selectedReportPartner = useMemo(() => {
    return partners.find(p => p.id === repPartnerFilter);
  }, [partners, repPartnerFilter]);

  const handleDownloadWordReport = async () => {
    const toastId = toast.loading("กำลังสร้างเอกสาร Word (.docx) ภาษาไทย...");
    try {
      const dateNow = format(new Date(), 'dd/MM/yyyy HH:mm');

      const tableRows = [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "ชื่อสินค้า", bold: true, color: "FFFFFF", size: 20 })] })], shading: { fill: "1A1F3D" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "SKU", bold: true, color: "FFFFFF", size: 20 })] })], shading: { fill: "1A1F3D" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "จำนวนที่ขาย", bold: true, color: "FFFFFF", size: 20 })] })], shading: { fill: "1A1F3D" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "ราคาสินค้า", bold: true, color: "FFFFFF", size: 20 })] })], shading: { fill: "1A1F3D" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "ราคาหลังหัก GP", bold: true, color: "FFFFFF", size: 20 })] })], shading: { fill: "1A1F3D" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "รวม", bold: true, color: "FFFFFF", size: 20 })] })], shading: { fill: "1A1F3D" } }),
          ]
        })
      ];

      reportItems.forEach(i => {
        const gp = selectedReportPartner?.gpRate || 0;
        const priceAfterGP = i.price * (1 - gp / 100);
        const total = priceAfterGP * i.stock;

        tableRows.push(new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: i.name, size: 18 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: i.barcode || '-', size: 18 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: i.stock.toLocaleString(), size: 18 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: i.price.toLocaleString(), size: 18 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: priceAfterGP.toLocaleString(), size: 18 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: total.toLocaleString(), size: 18 })] })] }),
          ]
        }));
      });

      const itemsTable = new Table({
        rows: tableRows,
        width: {
          size: 100,
          type: WidthType.PERCENTAGE,
        }
      });

      const sigTable = new Table({
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: "auto" },
          bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
          left: { style: BorderStyle.NONE, size: 0, color: "auto" },
          right: { style: BorderStyle.NONE, size: 0, color: "auto" },
          insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
          insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
        },
        width: {
          size: 100,
          type: WidthType.PERCENTAGE,
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({ text: "" }),
                  new Paragraph({ text: "__________________________________", alignment: AlignmentType.CENTER }),
                  new Paragraph({ children: [new TextRun({ text: "ผู้จัดทำ (Prepared By)", bold: true, size: 18 })], alignment: AlignmentType.CENTER }),
                ]
              }),
              new TableCell({
                children: [
                  new Paragraph({ text: "" }),
                  new Paragraph({ text: "__________________________________", alignment: AlignmentType.CENTER }),
                  new Paragraph({ children: [new TextRun({ text: "ผู้อนุมัติ (Authorized By)", bold: true, size: 18 })], alignment: AlignmentType.CENTER }),
                ]
              }),
            ]
          })
        ]
      });

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: companyName || shopName, bold: true, size: 32, color: "1A1F3D" }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `เลขประจำตัวผู้เสียภาษี: ${companyTaxId || '-'}`, size: 18, color: "555555" }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `ที่อยู่: ${companyAddress || shopAddress}`, size: 18, color: "555555" }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `โทร: ${companyPhone || shopPhone} ${companyEmail ? `| อีเมล: ${companyEmail}` : ''}`, size: 18, color: "555555" }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { before: 200 },
              children: [
                new TextRun({ text: "Sales Report", bold: true, size: 36, color: "1A1F3D" }),
              ]
            }),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: "เอกสารแจ้งยอดฝากขาย", size: 22, color: "555555" }),
              ]
            }),
            new Paragraph({ text: "_________________________________________________________________________________", spacing: { before: 100, after: 200 } }),
            new Paragraph({
              children: [
                new TextRun({ text: selectedReportPartner ? `ข้อมูลคู่ค้า: ${selectedReportPartner.companyName}` : "คู่ค้า: คู่ค้าทั้งหมด", bold: true, size: 22, color: "1A1F3D" }),
              ]
            }),
            ...(selectedReportPartner ? [
              new Paragraph({ children: [new TextRun({ text: `เลขประจำตัวผู้เสียภาษี: ${selectedReportPartner.taxId || '-'}`, size: 18, color: "555555" })] }),
              new Paragraph({ children: [new TextRun({ text: `ที่อยู่: ${selectedReportPartner.address || '-'}`, size: 18, color: "555555" })] }),
              new Paragraph({ children: [new TextRun({ text: `โทร: ${selectedReportPartner.phone || '-'} ${selectedReportPartner.email ? `| อีเมล: ${selectedReportPartner.email}` : ''}`, size: 18, color: "555555" })] }),
            ] : []),
            new Paragraph({
              children: [
                new TextRun({ text: `วันที่ออกเอกสาร: ${dateNow}`, size: 18, color: "555555" }),
              ],
              spacing: { before: 100, after: 300 }
            }),
            itemsTable,
            new Paragraph({ text: "", spacing: { before: 400, after: 200 } }),
            sigTable,
            new Paragraph({
              spacing: { before: 400 },
              children: [
                new TextRun({ text: "*เงื่อนไขการวางบิล :", bold: true, size: 22, color: "1A1F3D" }),
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "ผู้ขายสามารถวางบิลได้ตั้งแต่วันที่ได้รับรายงานยอดขาย จนถึงภายในวันที่ 20 ของเดือน ในกรณีที่วางบิลไม่ตรงรอบหรือเอกสารไม่ครบ จะมีการดำเนินการชำระค่าสินค้าให้ในรอบถัดไป", size: 18, color: "555555" }),
              ]
            }),
            new Paragraph({
              spacing: { before: 300 },
              children: [
                new TextRun({ text: "วางบิลและส่งเอกสารมาที่ :", bold: true, size: 22, color: "1A1F3D" }),
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: companyName || shopName, bold: true, size: 18, color: "1A1F3D" }),
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `ที่อยู่: ${companyAddress || shopAddress}`, size: 18, color: "555555" }),
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `ติดต่อ: ${companyPhone || shopPhone} ${companyEmail ? `| อีเมล: ${companyEmail}` : ''}`, size: 18, color: "555555" }),
              ]
            }),
          ]
        }]
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Sales_Report_${format(new Date(), 'yyyyMMdd')}.docx`;
      a.click();

      const partnerName = repPartnerFilter === 'All' ? 'All' : partners.find(p => p.id === repPartnerFilter)?.companyName;
      addReportLog({
        reportName: "Sales Report (Consignment)",
        filters: `Partner: ${partnerName}, Cat: ${repCategoryFilter}`,
        staffName: currentUser?.name || 'Admin'
      });

      toast.success("ดาวน์โหลดรายงาน Word (.docx) เรียบร้อยแล้ว!", { id: toastId });
    } catch (error: any) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการสร้างเอกสาร Word: " + error.message, { id: toastId });
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
    const item = inventory.find(i => i.id === id);
    if (item) {
      setQuickAdjustItem(item);
    }
  };

  const handleSaveQuickAdjust = (qty: number, reason: string) => {
    if (quickAdjustItem) {
      adjustStock(quickAdjustItem.id, qty, 'Set', reason);
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
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-indigo-500" />
                <span className="text-xs font-black text-[#1A1F3D] uppercase tracking-wider">ช่วงเวลาวิเคราะห์ยอดขายสินค้า</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex bg-[#F5F6FA] p-1 rounded-xl gap-1">
                  <button 
                    onClick={() => {
                      setDashStartDate(format(new Date(), 'yyyy-MM-dd'));
                      setDashEndDate(format(new Date(), 'yyyy-MM-dd'));
                    }}
                    className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all", dashStartDate === format(new Date(), 'yyyy-MM-dd') ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400")}
                  >
                    วันนี้
                  </button>
                  <button 
                    onClick={() => {
                      setDashStartDate(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
                      setDashEndDate(format(new Date(), 'yyyy-MM-dd'));
                    }}
                    className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all", dashStartDate === format(subDays(new Date(), 7), 'yyyy-MM-dd') ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400")}
                  >
                    7 วันที่ผ่านมา
                  </button>
                  <button 
                    onClick={() => {
                      setDashStartDate(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
                      setDashEndDate(format(new Date(), 'yyyy-MM-dd'));
                    }}
                    className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all", dashStartDate === format(startOfMonth(new Date()), 'yyyy-MM-dd') ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400")}
                  >
                    เดือนนี้
                  </button>
                </div>
                <div className="flex items-center gap-2 bg-[#F5F6FA] p-1.5 rounded-xl border border-gray-100">
                  <input 
                    type="date" 
                    className="bg-transparent border-none text-xs font-bold p-1 focus:ring-0" 
                    value={dashStartDate} 
                    onChange={e => setDashStartDate(e.target.value)} 
                  />
                  <span className="text-xs text-gray-400 font-bold">ถึง</span>
                  <input 
                    type="date" 
                    className="bg-transparent border-none text-xs font-bold p-1 focus:ring-0" 
                    value={dashEndDate} 
                    onChange={e => setDashEndDate(e.target.value)} 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                <Package size={24} className="text-blue-500 mb-6"/>
                <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Total SKUs</p>
                <h2 className="text-4xl font-black">{inventory.length}</h2>
              </div>
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                <DollarSign size={24} className="text-green-500 mb-6"/>
                <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Inventory Value</p>
                <h2 className="text-4xl font-black">{currency}{inventory.reduce((a,b) => a+(b.costPrice*b.stock), 0).toLocaleString()}</h2>
              </div>
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                <ArrowUpRight size={24} className="text-indigo-500 mb-6"/>
                <p className="text-[10px] font-black uppercase text-gray-400 mb-1">ยอดขายสินค้า (ช่วงที่เลือก)</p>
                <h2 className="text-4xl font-black text-indigo-600">{currency}{totalProductRevenue.toLocaleString()}</h2>
              </div>
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                <CheckCircle2 size={24} className="text-emerald-500 mb-6"/>
                <p className="text-[10px] font-black uppercase text-gray-400 mb-1">จำนวนชิ้นที่ขายได้</p>
                <h2 className="text-4xl font-black text-emerald-600">{totalProductsSold} ชิ้น</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col">
                <div className="mb-6">
                  <h3 className="text-lg font-black text-[#1A1F3D]">ยอดขายแยกตามสินค้า</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">จัดอันดับสินค้าขายดี</p>
                </div>
                <div className="h-[300px] w-full flex-1">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#1A1F3D', fontSize: 10, fontWeight: 700 }} width={100} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="revenue" radius={[0, 8, 8, 0]} barSize={16}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#1A1F3D' : '#3b82f6'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                      <BarIcon size={48} className="mb-2" />
                      <p className="text-xs font-black uppercase">ไม่มีข้อมูลยอดขายในช่วงเวลานี้</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-2 bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-black text-[#1A1F3D]">รายการขายสินค้า</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">รายละเอียดธุรกรรมการขายสินค้า</p>
                  </div>
                  <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-3 py-1.5 rounded-full uppercase">
                    {productSales.length} รายการ
                  </span>
                </div>
                <div className="overflow-x-auto flex-1 max-h-[380px] scrollbar-hide">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100">
                        <th className="px-8 py-4 text-left text-[10px] font-black uppercase text-gray-400">วันที่ / สินค้า</th>
                        <th className="px-8 py-4 text-center text-[10px] font-black uppercase text-gray-400">จำนวน</th>
                        <th className="px-8 py-4 text-right text-[10px] font-black uppercase text-gray-400">ยอดรวม</th>
                        <th className="px-8 py-4 text-left text-[10px] font-black uppercase text-gray-400">ลูกค้า / ช่องทาง</th>
                        <th className="px-8 py-4 text-right text-[10px] font-black uppercase text-gray-400">ผู้ขาย</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {productSales.map((sale, idx) => (
                        <tr key={`${sale.txId}-${idx}`} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-8 py-5">
                            <p className="text-xs font-black text-[#1A1F3D]">{sale.productName}</p>
                            <p className="text-[9px] text-gray-400 font-bold">{sale.date}</p>
                          </td>
                          <td className="px-8 py-5 text-center font-bold text-gray-600">{sale.quantity}</td>
                          <td className="px-8 py-5 text-right font-black text-[#1A1F3D]">฿{sale.total.toLocaleString()}</td>
                          <td className="px-8 py-5">
                            <p className="text-xs font-bold text-gray-700">{sale.customerName}</p>
                            <span className="text-[8px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-black uppercase">
                              {sale.paymentMethod}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <User size={10} className="text-gray-400" />
                              <span className="text-xs font-black text-gray-500">{sale.staffName}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {productSales.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-20 text-center opacity-20 font-black">
                            ไม่มีรายการขายสินค้าในช่วงเวลานี้
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
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
                              <td className="px-8 py-6 text-right">
                                 <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => { setEditingItem(item); setIsItemModalOpen(true); }} className="p-3 text-gray-300 hover:text-[#1A1F3D] hover:bg-white rounded-xl transition-all shadow-sm"><Edit3 size={16}/></button>
                                    <button onClick={() => handleDeleteItem(item.id)} className="p-3 text-gray-300 hover:text-red-600 hover:bg-white rounded-xl transition-all shadow-sm"><Trash2 size={16}/></button>
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

        {activeTab === 'check' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
             <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex-1 w-full relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} /><input className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-6 py-4 text-sm font-bold shadow-inner" placeholder="ค้นหาสินค้าเพื่อเช็คสต็อก..." value={checkSearch} onChange={e => setCheckSearch(e.target.value)} /></div>
                <div className="flex bg-[#F5F6FA] p-1 rounded-2xl gap-1 shrink-0">{(['All', 'Low', 'Out'] as const).map(status => (<button key={status} onClick={() => setCheckStatusFilter(status)} className={cn("px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", checkStatusFilter === status ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400")}>{status === 'All' ? 'ทั้งหมด' : status === 'Low' ? 'สต็อกต่ำ' : 'สินค้าหมด'}</button>))}</div>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredCheckItems.map(item => {
                  const status = item.stock === 0 ? 'Out' : item.stock <= item.minStock ? 'Low' : 'OK';
                  return (
                    <div 
                      key={item.id} 
                      className={cn(
                        "p-5 rounded-[24px] border transition-all group hover:shadow-xl relative overflow-hidden",
                        status === 'Out' ? "bg-red-50/40 border-red-100/80 hover:border-red-200" : 
                        status === 'Low' ? "bg-amber-50/40 border-amber-100/80 hover:border-amber-200" : 
                        "bg-emerald-50/20 border-emerald-100/60 hover:border-emerald-200"
                      )}
                    >
                       {/* Top Accent Line */}
                       <div className={cn(
                         "absolute top-0 left-0 right-0 h-1.5",
                         status === 'Out' ? "bg-red-500" : 
                         status === 'Low' ? "bg-amber-500" : 
                         "bg-emerald-500"
                       )} />
                       
                       <div className="flex justify-between items-start mb-4 relative z-10">
                         <div className={cn(
                           "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                           status === 'Out' ? "bg-red-100 text-red-700" :
                           status === 'Low' ? "bg-amber-100 text-amber-700" :
                           "bg-emerald-100 text-emerald-700"
                         )}>
                           <Package size={20} />
                         </div>
                         <div className={cn(
                           "px-2.5 py-0.5 rounded-md text-[8px] font-black uppercase shadow-sm", 
                           status === 'Out' ? "bg-red-500 text-white" : 
                           status === 'Low' ? "bg-amber-500 text-white" : 
                           "bg-emerald-600 text-white"
                         )}>
                           {status === 'Out' ? 'Out of Stock' : status === 'Low' ? 'Low Stock' : 'Optimal'}
                         </div>
                       </div>

                       <h3 className="text-sm font-black text-[#1A1F3D] mb-0.5 line-clamp-1 relative z-10">{item.name}</h3>
                       
                       <p className={cn(
                         "text-[9px] font-black uppercase tracking-widest mb-4 relative z-10",
                         status === 'Out' ? "text-red-600/80" :
                         status === 'Low' ? "text-amber-700/80" :
                         "text-emerald-700/80"
                       )}>
                         {item.category}
                       </p>

                       <div className="space-y-3 relative z-10">
                          <div className="flex justify-between items-end">
                            <div>
                              <p className={cn(
                                "text-[9px] font-black uppercase mb-0.5 tracking-wider",
                                status === 'Out' ? "text-red-900/50" :
                                status === 'Low' ? "text-amber-900/50" :
                                "text-emerald-900/50"
                              )}>
                                Current Balance
                              </p>
                              <p className={cn(
                                "text-xl font-black",
                                status === 'Out' ? "text-red-950" :
                                status === 'Low' ? "text-amber-950" :
                                "text-emerald-950"
                              )}>
                                {item.stock} <span className="text-[10px] opacity-60">{item.unit}</span>
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={cn(
                                "text-[9px] font-black uppercase mb-0.5 tracking-wider",
                                status === 'Out' ? "text-red-900/50" :
                                status === 'Low' ? "text-amber-900/50" :
                                "text-emerald-900/50"
                              )}>
                                Min. Required
                              </p>
                              <p className={cn(
                                "text-xs font-black",
                                status === 'Out' ? "text-red-900" :
                                status === 'Low' ? "text-amber-900" :
                                "text-emerald-900"
                              )}>
                                {item.minStock}
                              </p>
                            </div>
                          </div>

                          <div className={cn(
                            "pt-3 border-t flex gap-2",
                            status === 'Out' ? "border-red-100" :
                            status === 'Low' ? "border-amber-100" :
                            "border-emerald-100"
                          )}>
                            <button 
                              onClick={() => handleQuickAdjust(item.id)} 
                              className={cn(
                                "flex-1 font-black text-[9px] uppercase py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm",
                                status === 'Out' ? "bg-white hover:bg-red-500 hover:text-white text-red-600 border border-red-200" :
                                status === 'Low' ? "bg-white hover:bg-amber-500 hover:text-white text-amber-600 border border-amber-200" :
                                "bg-white hover:bg-emerald-600 hover:text-white text-emerald-600 border border-emerald-200"
                              )}
                            >
                              <RotateCcw size={12} /> ปรับยอด
                            </button>
                          </div>
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
           <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
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
                       <button onClick={handleDownloadWordReport} className="w-full bg-[#1A1F3D] text-white py-4 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                          <Download size={18} /> Download Word Report (.docx)
                       </button>
                    </div>
                 </div>
              </div>
              <div className="lg:col-span-2">
                 <InventoryReportLivePreview
                   reportItems={reportItems}
                   selectedReportPartner={selectedReportPartner}
                   shopName={shopName}
                   shopAddress={shopAddress}
                   companyName={companyName}
                   companyAddress={companyAddress}
                   companyTaxId={companyTaxId}
                   companyPhone={companyPhone}
                   companyEmail={companyEmail}
                   currency={currency}
                 />
              </div>
              <div className="lg:col-span-3">
                <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                   <div className="p-8 border-b border-gray-50 bg-gray-50/20 flex items-center justify-between">
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

      {isItemModalOpen && <InventoryModal item={editingItem} onClose={() => setIsItemModalOpen(false)} />}
      {isVendorModalOpen && <VendorModal partner={editingPartner} onClose={() => setIsVendorModalOpen(false)} />}
      {selectedVendorForView && <VendorInventoryView vendor={selectedVendorForView} onClose={() => setSelectedVendorForView(null)} />}
      
      {/* Quick Adjust Modal */}
      {quickAdjustItem && (
        <QuickAdjustModal 
          item={quickAdjustItem} 
          onClose={() => setQuickAdjustItem(null)} 
          onSave={handleSaveQuickAdjust} 
        />
      )}
    </div>
  );
};

export default Inventory;