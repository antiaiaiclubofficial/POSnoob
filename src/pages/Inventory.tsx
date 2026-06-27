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
import InventoryDashboard from '@/components/InventoryDashboard';
import POSystem from '@/components/POSystem';
import QuotationSystem from '@/components/QuotationSystem';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { motion } from 'framer-motion';

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
  const [repStartDate, setRepStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [repEndDate, setRepEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [repShowOnlySold, setRepShowOnlySold] = useState(false);
  const [docSubTab, setDocSubTab] = useState<'report' | 'po' | 'quotation'>('report');
  const [reorderItem, setReorderItem] = useState<InventoryItem | null>(null);

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
  const [adjustCostPrice, setAdjustCostPrice] = useState('');

  const [dashStartDate, setDashStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dashEndDate, setDashEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [stockSortOrder, setStockSortOrder] = useState<'desc' | 'asc'>('desc');

  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [defaultIsConsignment, setDefaultIsConsignment] = useState<boolean | undefined>(undefined);
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
    { id: 'report', label: 'เอกสาร', icon: FileText },
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

  const sortedStockLogs = useMemo(() => {
    return [...stockLogs].sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return stockSortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [stockLogs, stockSortOrder]);

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

  const reportItems = useMemo<InventoryItem[]>(() => {
    if (repShowOnlySold) {
      const inRangeTransactions = transactions.filter(tx => tx.date >= repStartDate && tx.date <= repEndDate);

      const agg: Record<string, InventoryItem> = {};

      inRangeTransactions.forEach(tx => {
        tx.items.forEach(item => {
          if (item.type === 'Product') {
            const invItem = inventory.find(i => i.id === item.id);
            const partnerId = item.partnerId || invItem?.partnerId;
            const isConsignment = item.isConsignment || invItem?.isConsignment;
            const category = invItem?.category || '';

            if (repPartnerFilter !== 'All' && partnerId !== repPartnerFilter) return;
            if (repCategoryFilter !== 'All' && category !== repCategoryFilter) return;

            const key = item.id || item.title;
            if (!agg[key]) {
              agg[key] = {
                id: item.id,
                name: item.title,
                barcode: item.barcode || invItem?.barcode || '',
                stock: 0,
                minStock: invItem?.minStock || 0,
                price: item.price,
                costPrice: invItem?.costPrice || 0,
                unit: invItem?.unit || 'ชิ้น',
                category,
                isConsignment: !!isConsignment,
                partnerId,
              };
            }
            agg[key].stock += (item.quantity || 1);
          }
        });
      });

      return Object.values(agg);
    } else {
      let itemsToExport = [...inventory];
      if (repPartnerFilter !== 'All') itemsToExport = itemsToExport.filter(i => i.partnerId === repPartnerFilter);
      if (repCategoryFilter !== 'All') itemsToExport = itemsToExport.filter(i => i.category === repCategoryFilter);
      if (repStatusFilter === 'Low') itemsToExport = itemsToExport.filter(i => i.stock > 0 && i.stock <= i.minStock);
      if (repStatusFilter === 'Out') itemsToExport = itemsToExport.filter(i => i.stock === 0);
      return itemsToExport;
    }
  }, [inventory, transactions, repPartnerFilter, repCategoryFilter, repStatusFilter, repStartDate, repEndDate, repShowOnlySold]);

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
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: repShowOnlySold ? "จำนวนที่ขาย" : "จำนวนคงเหลือ", bold: true, color: "FFFFFF", size: 20 })] })], shading: { fill: "1A1F3D" } }),
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
                new TextRun({ text: repShowOnlySold ? "Sales Report" : "Inventory Report", bold: true, size: 36, color: "1A1F3D" }),
              ]
            }),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: repShowOnlySold ? `รายงานยอดขาย (${repStartDate} ถึง ${repEndDate})` : "เอกสารแจ้งยอดฝากขาย", size: 22, color: "555555" }),
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
      a.download = `${repShowOnlySold ? 'Sales' : 'Inventory'}_Report_${format(new Date(), 'yyyyMMdd')}.docx`;
      a.click();

      const partnerName = repPartnerFilter === 'All' ? 'All' : partners.find(p => p.id === repPartnerFilter)?.companyName;
      const dateRangeStr = `Period: ${repStartDate} to ${repEndDate}`;
      const soldStr = repShowOnlySold ? ' (Sold Only)' : '';
      addReportLog({
        reportName: repShowOnlySold ? "Sales Report (Consignment)" : "Inventory Report (Consignment)",
        filters: `Partner: ${partnerName}, Cat: ${repCategoryFilter}, ${dateRangeStr}${soldStr}`,
        staffName: currentUser?.name || 'Admin'
      });

      toast.success("ดาวน์โหลดเอกสาร (.docx) เรียบร้อยแล้ว!", { id: toastId });
    } catch (error: any) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการสร้างเอกสาร Word: " + error.message, { id: toastId });
    }
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdjustId || !adjustQty) return toast.error("กรุณาเลือกสินค้าและระบุจำนวน");
    const costPrice = adjustMode === 'Add' ? (Number(adjustCostPrice) || 0) : undefined;
    adjustStock(selectedAdjustId, Number(adjustQty), adjustMode, adjustReason || 'Manual Adjustment', costPrice);
    toast.success("บันทึกการปรับยอดเรียบร้อย");
    setAdjustQty(''); setAdjustReason(''); setAdjustSearch(''); setSelectedAdjustId(''); setAdjustCostPrice('');
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
          <InventoryDashboard />
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
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setEditingItem(null);
                      setDefaultIsConsignment(false);
                      setIsItemModalOpen(true);
                    }}
                    className="bg-[#1A1F3D] hover:bg-[#2A3152] text-white px-6 py-4 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <Plus size={18} /> เพิ่มสินค้าขายเอง
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setEditingItem(null);
                      setDefaultIsConsignment(true);
                      setIsItemModalOpen(true);
                    }}
                    className="bg-[#EAFD69] hover:brightness-95 text-[#18234A] px-6 py-4 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <Plus size={18} /> เพิ่มสินค้าฝากขาย
                  </motion.button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-8 py-6 text-left text-[10px] font-black uppercase text-gray-400">SKU</th>
                      <th className="px-8 py-6 text-left text-[10px] font-black uppercase text-gray-400">สินค้า</th>
                      <th className="px-8 py-6 text-center text-[10px] font-black uppercase text-gray-400">ราคาขาย</th>
                      <th className="px-8 py-6 text-center text-[10px] font-black uppercase text-gray-400">สต็อก</th>
                      <th className="px-8 py-6 text-center text-[10px] font-black uppercase text-gray-400">ต้นทุนเฉลี่ย</th>
                      <th className="px-8 py-6 text-center text-[10px] font-black uppercase text-gray-400">ต้นทุนทั้งหมด</th>
                      <th className="px-8 py-6 text-center text-[10px] font-black uppercase text-gray-400">สถานะ Reorder</th>
                      <th className="px-8 py-6 text-right text-[10px] font-black uppercase text-gray-400">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredInventory.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-6 text-left text-xs font-bold text-gray-400 font-mono">{item.barcode || '-'}</td>
                        <td className="px-8 py-6 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-50">
                            {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Package className="w-full h-full p-3 text-gray-300" />}
                          </div>
                          <div>
                            <p className="text-sm font-black text-[#1A1F3D]">{item.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-black uppercase text-blue-500">{item.category}</span>
                              <span className={cn(
                                "text-[8px] font-black uppercase px-2 py-0.5 rounded-full border",
                                item.isConsignment
                                  ? "bg-indigo-50 text-indigo-600 border-indigo-100/50"
                                  : "bg-gray-50 text-gray-500 border-gray-100/50"
                              )}>
                                {item.isConsignment ? "ฝากขาย" : "ขายเอง"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center text-sm font-black">฿{item.price.toLocaleString()}</td>
                        <td className="px-8 py-6 text-center font-black text-blue-600">{item.stock} {item.unit}</td>
                        <td className="px-8 py-6 text-center text-sm font-black text-gray-600">
                          ฿{(item.costPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-8 py-6 text-center text-sm font-black text-gray-600">
                          ฿{(item.stock * (item.costPrice || 0)).toLocaleString()}
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className={cn(
                            "text-[9px] font-black uppercase px-2.5 py-1 rounded-md shadow-sm border",
                            item.stock === 0
                              ? "bg-red-50 text-red-700 border-red-100"
                              : item.stock <= item.minStock
                                ? "bg-amber-50 text-amber-700 border-amber-100"
                                : "bg-emerald-50 text-emerald-700 border-emerald-100",
                            (item.stock <= item.minStock) && "cursor-pointer hover:opacity-80 transition-opacity"
                          )}
                          onClick={() => {
                            if (item.stock <= item.minStock) {
                              setReorderItem(item);
                              setActiveTab('report');
                              setDocSubTab('po');
                            }
                          }}
                          >
                            {item.stock === 0
                              ? "สินค้าหมด (สั่งเพิ่ม)"
                              : item.stock <= item.minStock
                                ? `สั่งเพิ่ม (Min ${item.minStock})`
                                : "ปกติ"}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => { setEditingItem(item); setDefaultIsConsignment(item.isConsignment); setIsItemModalOpen(true); }} className="p-3 text-gray-300 hover:text-[#1A1F3D] hover:bg-white rounded-xl transition-all shadow-sm"><Edit3 size={16} /></button>
                            <button onClick={() => handleDeleteItem(item.id)} className="p-3 text-gray-300 hover:text-red-600 hover:bg-white rounded-xl transition-all shadow-sm"><Trash2 size={16} /></button>
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

                    <div className="flex items-center gap-2 mb-4 relative z-10">
                      <p className={cn(
                        "text-[9px] font-black uppercase tracking-widest",
                        status === 'Out' ? "text-red-600/80" :
                          status === 'Low' ? "text-amber-700/80" :
                            "text-emerald-700/80"
                      )}>
                        {item.category}
                      </p>
                      <span className={cn(
                        "text-[8px] font-black uppercase px-2 py-0.5 rounded-full border",
                        item.isConsignment
                          ? "bg-indigo-50 text-indigo-600 border-indigo-100/50"
                          : "bg-gray-50 text-gray-500 border-gray-100/50"
                      )}>
                        {item.isConsignment ? "ฝากขาย" : "ขายเอง"}
                      </span>
                    </div>

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
                        {(status === 'Out' || status === 'Low') && (
                          <button
                            onClick={() => {
                              setReorderItem(item);
                              setActiveTab('report');
                              setDocSubTab('po');
                            }}
                            className={cn(
                              "flex-1 font-black text-[9px] uppercase py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm",
                              "bg-[#1A1F3D] text-white hover:bg-gray-900 border border-[#1A1F3D]"
                            )}
                          >
                            <Plus size={12} /> Reorder
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'adjust' && (
          <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in slide-in-from-bottom-4 duration-300">
            <div className="lg:col-span-4"><div className="bg-white p-8 rounded-[48px] border border-gray-100 shadow-sm space-y-8"><div><h3 className="text-xl font-black text-[#1A1F3D] mb-1">Update Balance</h3><p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Add stock or set quantity</p></div><form onSubmit={handleAdjustSubmit} className="space-y-6"><div className="space-y-2 relative"><label className="text-[10px] font-black uppercase text-gray-400 px-2">1. ค้นหาสินค้า</label><div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} /><input className="w-full bg-[#F5F6FA] border-none rounded-2xl pl-12 pr-6 py-4 text-sm font-bold shadow-inner" placeholder="พิมพ์ชื่อหรือบาร์โค้ด..." value={adjustSearch} onChange={e => setAdjustSearch(e.target.value)} /></div>{adjustSearchItems.length > 0 && !selectedAdjustId && (<div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">{adjustSearchItems.map(item => (<button key={item.id} type="button" onClick={() => { setSelectedAdjustId(item.id); setAdjustSearch(item.name); }} className="w-full px-5 py-4 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0 flex justify-between items-center transition-colors"><div><p className="text-sm font-black text-[#1A1F3D]">{item.name}</p><p className="text-[10px] text-gray-400 font-bold uppercase">{item.barcode || 'No Barcode'}</p></div><p className="text-xs font-black text-blue-500">Stock: {item.stock}</p></button>))}</div>)}</div>{selectedItemForAdjust && (<div className="p-5 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-center gap-4 animate-in zoom-in-95"><div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm shrink-0"><Package size={24} /></div><div><p className="text-xs font-black text-[#1A1F3D]">{selectedItemForAdjust.name}</p><p className="text-[10px] text-blue-600 font-black uppercase">Current: {selectedItemForAdjust.stock}</p></div><button type="button" onClick={() => setSelectedAdjustId('')} className="ml-auto p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button></div>)}<div className="space-y-3"><label className="text-[10px] font-black uppercase text-gray-400 px-2">2. ประเภทการทำงาน</label><div className="flex bg-[#F5F6FA] p-1.5 rounded-[22px] gap-2"><button type="button" onClick={() => setAdjustMode('Add')} className={cn("flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2", adjustMode === 'Add' ? "bg-white text-green-600 shadow-sm" : "text-gray-400")}><ArrowUp size={12} /> เติมเพิ่ม</button><button type="button" onClick={() => setAdjustMode('Set')} className={cn("flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2", adjustMode === 'Set' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}><RotateCcw size={12} /> ปรับตามจริง</button></div></div><div className={cn("grid gap-4", adjustMode === 'Add' ? "grid-cols-3" : "grid-cols-2")}><div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 px-2">3. จำนวน</label><input type="number" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-xl font-black text-center" placeholder="0" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} /></div>{adjustMode === 'Add' && (<div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 px-2">4. ต้นทุนต่อชิ้น ({currency})</label><input type="number" className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-xl font-black text-center" placeholder="0" value={adjustCostPrice} onChange={e => setAdjustCostPrice(e.target.value)} /></div>)}<div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 px-2">{adjustMode === 'Add' ? '5. หมายเหตุ' : '4. หมายเหตุ'}</label><input className="w-full bg-[#F5F6FA] border-none rounded-2xl px-6 py-4 text-sm font-bold" placeholder="..." value={adjustReason} onChange={e => setAdjustReason(e.target.value)} /></div></div><button type="submit" disabled={!selectedAdjustId || !adjustQty} className="w-full bg-[#1A1F3D] text-white font-black py-5 rounded-[28px] shadow-xl shadow-[#1A1F3D]/20 flex items-center justify-center gap-3 transition-all active:scale-95"><Save size={20} /> บันทึกการปรับสต็อก</button></form></div></div>
            <div className="lg:col-span-8">
              <div className="bg-white rounded-[48px] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
                <div className="p-8 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/20">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                      <History size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-[#1A1F3D]">Movement History</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Audit Trail</p>
                    </div>
                  </div>
                  <div className="flex bg-[#F5F6FA] p-1 rounded-xl gap-1 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setStockSortOrder('desc')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1.5",
                        stockSortOrder === 'desc' ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400 hover:text-gray-600"
                      )}
                    >
                      <ArrowDown size={12} /> ใหม่ ไป เก่า
                    </button>
                    <button
                      type="button"
                      onClick={() => setStockSortOrder('asc')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1.5",
                        stockSortOrder === 'asc' ? "bg-white text-[#1A1F3D] shadow-sm" : "text-gray-400 hover:text-gray-600"
                      )}
                    >
                      <ArrowUp size={12} /> เก่า ไป ใหม่
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-white border-b border-gray-50">
                        <th className="px-6 py-5 text-left text-[10px] font-black uppercase text-gray-400">Timestamp</th>
                        <th className="px-6 py-5 text-left text-[10px] font-black uppercase text-gray-400">Product</th>
                        <th className="px-6 py-5 text-center text-[10px] font-black uppercase text-gray-400">Action</th>
                        <th className="px-6 py-5 text-right text-[10px] font-black uppercase text-gray-400">Qty Change</th>
                        <th className="px-6 py-5 text-right text-[10px] font-black uppercase text-gray-400">Cost/Unit</th>
                        <th className="px-6 py-5 text-right text-[10px] font-black uppercase text-gray-400">Total Value</th>
                        <th className="px-6 py-5 text-right text-[10px] font-black uppercase text-gray-400">New Bal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {sortedStockLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-[#F8F9FD]">
                          <td className="px-6 py-6">
                            <p className="text-xs font-black text-[#1A1F3D]">{format(new Date(log.timestamp), 'HH:mm • dd MMM')}</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase">{log.staffName}</p>
                          </td>
                          <td className="px-6 py-6">
                            <p className="text-sm font-black text-[#1A1F3D]">{log.productName}</p>
                            <p className="text-[9px] text-gray-400 font-bold italic line-clamp-1">"{log.reason}"</p>
                          </td>
                          <td className="px-6 py-6 text-center">
                            <span className={cn(
                              "px-3 py-1 rounded-lg text-[8px] font-black uppercase",
                              log.action === 'Add' || log.action === 'In' ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                            )}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-6 text-right font-black text-xs">
                            {(() => {
                              const diff = log.newQty - log.oldQty;
                              if (diff > 0) return <span className="text-green-600">+{diff}</span>;
                              if (diff < 0) return <span className="text-red-500">{diff}</span>;
                              return <span className="text-gray-400">0</span>;
                            })()}
                          </td>
                          <td className="px-6 py-6 text-right font-black text-[#1A1F3D] text-xs">
                            {log.costPrice && log.costPrice > 0 ? `฿${log.costPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                          </td>
                          <td className="px-6 py-6 text-right font-black text-[#1A1F3D] text-xs">
                            {log.costPrice && log.costPrice > 0 ? (
                              `฿${(Math.abs(log.newQty - log.oldQty) * log.costPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            ) : '—'}
                          </td>
                          <td className="px-6 py-6 text-right font-black text-[#1A1F3D] text-xs">{log.newQty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <div className="space-y-6">
            <div className="max-w-[1600px] mx-auto">
              <div className="flex bg-white p-2 rounded-2xl border border-gray-100 shadow-sm w-max space-x-2">
              <button
                onClick={() => setDocSubTab('report')}
                className={cn(
                  "px-8 py-3 rounded-xl font-bold text-sm transition-all duration-300",
                  docSubTab === 'report' ? "bg-[#1A1F3D] text-white shadow-md" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                )}
              >
                รายงานสต็อก
              </button>
              <button
                onClick={() => setDocSubTab('po')}
                className={cn(
                  "px-8 py-3 rounded-xl font-bold text-sm transition-all duration-300",
                  docSubTab === 'po' ? "bg-[#1A1F3D] text-white shadow-md" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                )}
              >
                ใบสั่งซื้อ (PO)
              </button>
              <button
                onClick={() => setDocSubTab('quotation')}
                className={cn(
                  "px-8 py-3 rounded-xl font-bold text-sm transition-all duration-300",
                  docSubTab === 'quotation' ? "bg-[#1A1F3D] text-white shadow-md" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                )}
              >
                ใบเสนอราคา
              </button>
            </div>
          </div>

            {docSubTab === 'report' ? (
              <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
                <div className="lg:col-span-4 space-y-6">
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 px-1">Start Date</label>
                      <input
                        type="date"
                        className="w-full bg-[#F5F6FA] border-none rounded-xl px-3 py-2 text-xs font-bold"
                        value={repStartDate}
                        onChange={e => setRepStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 px-1">End Date</label>
                      <input
                        type="date"
                        className="w-full bg-[#F5F6FA] border-none rounded-xl px-3 py-2 text-xs font-bold"
                        value={repEndDate}
                        onChange={e => setRepEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#F5F6FA] rounded-2xl">
                    <div className="space-y-0.5">
                      <label className="text-xs font-black text-[#1A1F3D]">แสดงเฉพาะสินค้าที่ขายได้</label>
                      <p className="text-[9px] text-gray-400 font-bold">ตามช่วงเวลาที่เลือก</p>
                    </div>
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      checked={repShowOnlySold}
                      onChange={e => setRepShowOnlySold(e.target.checked)}
                    />
                  </div>
                  {!repShowOnlySold && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 px-1">Stock Status</label>
                      <select className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-sm font-bold" value={repStatusFilter} onChange={e => setRepStatusFilter(e.target.value)}>
                        <option value="All">ทั้งหมด (All Items)</option>
                        <option value="Low">ใกล้หมด (Low Stock Only)</option>
                        <option value="Out">สินค้าหมด (Out of Stock Only)</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-2">
                  <button onClick={handleDownloadWordReport} className="w-full bg-[#1A1F3D] text-white py-4 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-gray-900">
                    <Download size={18} /> Preview & Export Word (.docx)
                  </button>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-8">
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
                repStartDate={repStartDate}
                repEndDate={repEndDate}
                repShowOnlySold={repShowOnlySold}
              />
            </div>

            <div className="lg:col-span-12">
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
            ) : docSubTab === 'po' ? (
              <POSystem reorderItem={reorderItem} clearReorderItem={() => setReorderItem(null)} />
            ) : docSubTab === 'quotation' ? (
              <QuotationSystem />
            ) : null}
          </div>
        )}

        {activeTab === 'consignment' && (
          <div className="max-w-[1600px] mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-300">
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
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[20px] flex items-center justify-center"><Building2 size={28} /></div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEditPartner(partner)} className="p-2 text-gray-400 hover:text-[#1A1F3D] hover:bg-gray-50 rounded-xl transition-all"><Edit3 size={18} /></button>
                      <button onClick={() => handleDeletePartner(partner.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
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
                <div className="col-span-full py-20 text-center opacity-20"><Users size={48} className="mx-auto mb-4" /><p className="font-black">ไม่พบข้อมูลคู่ค้า</p></div>
              )}
            </div>
          </div>
        )}
      </div>

      {isItemModalOpen && (
        <InventoryModal
          item={editingItem}
          defaultIsConsignment={defaultIsConsignment}
          onClose={() => setIsItemModalOpen(false)}
        />
      )}
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