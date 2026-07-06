import React, { useState, useEffect } from 'react';
import { useStore, BillingDocument, BillingDocumentItem, BillingDocumentType, Partner, Customer } from '@/store/useStore';
import { format } from 'date-fns';
import { Plus, Search, FileText, CheckCircle, XCircle, Clock, Trash2, Save, X, Printer, Receipt, FileSpreadsheet, Building2, User, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { formatBahtText } from '@/lib/bahttext';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, VerticalAlign } from 'docx';
import ReceiptPreview from '../ReceiptPreview';

const BillingSystem = () => {
  const { 
    billingDocuments, 
    partners,
    customers,
    inventory, 
    services, addons, packageTemplates, creditPackages,
    currentUser, 
    addBillingDocument, 
    updateBillingDocument, 
    updateBillingDocumentStatus,
    companyName, companyAddress, companyTaxId,
    shopName, shopLogo, shopAddress, shopPhone,
    receiptHeader, receiptFooter, receiptPaperSize,
    vatEnabled: globalVatEnabled, vatRate, vatInclusive
  } = useStore();

  const [activeTab, setActiveTab] = useState<string>('receipt_all');
  const [createType, setCreateType] = useState<BillingDocumentType>('receipt');
  const [receiptFilter, setReceiptFilter] = useState<'all' | 'receipt' | 'short_receipt'>('all');
  const [view, setView] = useState<'list' | 'create'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewDoc, setPreviewDoc] = useState<BillingDocument | null>(null);
  
  // Form State
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [customerAddressInput, setCustomerAddressInput] = useState('');
  const [customerTaxIdInput, setCustomerTaxIdInput] = useState('');
  const [docItems, setDocItems] = useState<BillingDocumentItem[]>([]);
  const [selectedItemType, setSelectedItemType] = useState<'product' | 'service' | 'addon' | 'package' | 'credit'>('product');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [qtyInput, setQtyInput] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [vatEnabled, setVatEnabled] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [remarks, setRemarks] = useState('');
  const [selectedReceiptId, setSelectedReceiptId] = useState('');

  useEffect(() => {
    if (selectedReceiptId) {
      const receipt = billingDocuments.find(d => d.id === selectedReceiptId);
      if (receipt) {
        setDocItems(receipt.items);
        setSelectedCustomerId(receipt.customerId || '');
        setSelectedPartnerId(receipt.partnerId || '');
        setCustomerNameInput(receipt.customerName || '');
        setCustomerAddressInput(receipt.customerAddress || '');
        setCustomerTaxIdInput(receipt.customerTaxId || '');
        setVatEnabled(receipt.vatAmount > 0);
        setPaymentMethod(receipt.paymentMethod || '');
        setRemarks(`ใบกำกับภาษีฉบับนี้ได้ออกแทนใบเสร็จรับเงินเลขที่ ${receipt.documentNo}`);
      }
    }
  }, [selectedReceiptId, billingDocuments]);

  useEffect(() => {
    if (!selectedProductId) {
      setPriceInput('');
      return;
    }

    let defaultPrice = 0;
    if (selectedItemType === 'product') {
      const product = inventory.find(i => i.id === selectedProductId);
      if (product) defaultPrice = product.price;
    } else if (selectedItemType === 'service') {
      const service = services.find(s => s.id === selectedProductId);
      if (service && service.prices) {
        const firstPrice = Object.values(service.prices)[0];
        if (firstPrice) defaultPrice = firstPrice.price;
      }
    } else if (selectedItemType === 'addon') {
      const addon = addons.find(a => a.id === selectedProductId);
      if (addon) defaultPrice = addon.price;
    } else if (selectedItemType === 'package') {
      const pkg = packageTemplates.find(p => p.id === selectedProductId);
      if (pkg) defaultPrice = pkg.price;
    } else if (selectedItemType === 'credit') {
      const credit = creditPackages.find(c => c.id === selectedProductId);
      if (credit) defaultPrice = credit.price;
    }

    setPriceInput(defaultPrice.toString());
  }, [selectedProductId, selectedItemType, inventory, services, addons, packageTemplates, creditPackages]);

  const tabs = [
    { id: 'receipt_all', label: 'ใบเสร็จรับเงิน (ทั้งหมด)', icon: Receipt },
    { id: 'tax_invoice', label: 'ใบกำกับภาษี (Tax Invoice)', icon: Building2 },
    { id: 'invoice', label: 'ใบแจ้งหนี้ (Invoice)', icon: FileSpreadsheet },
  ];

  const currentDocs = billingDocuments.filter(doc => {
    if (activeTab === 'receipt_all') {
      if (receiptFilter === 'all') return doc.type === 'receipt' || doc.type === 'short_receipt';
      return doc.type === receiptFilter;
    }
    return doc.type === activeTab;
  });
  
  const filteredDocs = currentDocs.filter(doc => {
    const matchesSearch = doc.documentNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.customerName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-50 text-green-600';
      case 'Cancelled': return 'bg-red-50 text-red-600';
      default: return 'bg-orange-50 text-orange-600';
    }
  };

  const hasTaxInvoice = (docNo: string) => {
    return billingDocuments.some(d => d.type === 'tax_invoice' && d.referenceDocumentNo === docNo && d.status !== 'Cancelled');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid': return <CheckCircle size={14} />;
      case 'Cancelled': return <XCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const handleAddItem = () => {
    if (!selectedProductId || !qtyInput || !priceInput) return;

    let itemName = '';
    if (selectedItemType === 'product') {
      const product = inventory.find(i => i.id === selectedProductId);
      if (!product) return;
      itemName = product.name;
    } else if (selectedItemType === 'service') {
      const service = services.find(s => s.id === selectedProductId);
      if (!service) return;
      itemName = service.title;
    } else if (selectedItemType === 'addon') {
      const addon = addons.find(a => a.id === selectedProductId);
      if (!addon) return;
      itemName = addon.name;
    } else if (selectedItemType === 'package') {
      const pkg = packageTemplates.find(p => p.id === selectedProductId);
      if (!pkg) return;
      itemName = pkg.name;
    } else if (selectedItemType === 'credit') {
      const credit = creditPackages.find(c => c.id === selectedProductId);
      if (!credit) return;
      itemName = credit.name;
    }

    const qty = parseInt(qtyInput);
    const price = parseFloat(priceInput);

    if (qty <= 0 || price < 0) return;

    const existingItem = docItems.find(i => i.productId === selectedProductId && i.itemType === selectedItemType);
    if (existingItem) {
      setDocItems(docItems.map(i => (i.productId === selectedProductId && i.itemType === selectedItemType) ? {
        ...i,
        quantity: i.quantity + qty,
        total: (i.quantity + qty) * i.unitPrice
      } : i));
    } else {
      setDocItems([...docItems, {
        productId: selectedProductId,
        productName: itemName,
        quantity: qty,
        unitPrice: price,
        total: qty * price,
        itemType: selectedItemType
      }]);
    }

    setSelectedProductId('');
    setQtyInput('');
    setPriceInput('');
  };

  const handleRemoveItem = (productId: string, itemType?: string) => {
    setDocItems(docItems.filter(i => !(i.productId === productId && i.itemType === itemType)));
  };

  const calculateTotals = () => {
    const rawSubtotal = docItems.reduce((sum, item) => sum + item.total, 0);
    const isVatForced = createType === 'tax_invoice';
    const isTaxable = vatEnabled || isVatForced;
    const currentVatRate = vatRate || 7;

    let subtotal = rawSubtotal;
    let vatAmount = 0;
    let totalAmount = rawSubtotal;

    if (isTaxable) {
      if (vatInclusive) {
        totalAmount = rawSubtotal;
        vatAmount = totalAmount * currentVatRate / (100 + currentVatRate);
        subtotal = totalAmount - vatAmount;
      } else {
        vatAmount = rawSubtotal * currentVatRate / 100;
        totalAmount = rawSubtotal + vatAmount;
        subtotal = rawSubtotal;
      }
    }

    return { subtotal, vatAmount, totalAmount };
  };

  const handleSaveDoc = () => {
    if (docItems.length === 0) return;

    let targetCustomerName = customerNameInput;
    let targetCustomerAddress = customerAddressInput;
    let targetCustomerTaxId = customerTaxIdInput;

    const { subtotal, vatAmount, totalAmount } = calculateTotals();
    const docNo = `${createType === 'receipt' ? 'REC' : createType === 'short_receipt' ? 'ABB' : createType === 'tax_invoice' ? 'TAX' : 'INV'}-${format(new Date(), 'yyyyMM')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    if (editingDocId) {
      updateBillingDocument(editingDocId, {
        type: createType,
        partnerId: selectedPartnerId || undefined,
        customerId: selectedCustomerId || undefined,
        customerName: targetCustomerName,
        customerAddress: targetCustomerAddress,
        customerTaxId: targetCustomerTaxId,
        items: docItems,
        subtotal,
        vatAmount,
        totalAmount,
        paymentMethod: paymentMethod || undefined,
        remarks,
        referenceDocumentNo: selectedReceiptId ? billingDocuments.find(d => d.id === selectedReceiptId)?.documentNo : undefined,
      });
    } else {
      addBillingDocument({
        documentNo: docNo,
        type: createType,
        date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX"),
        partnerId: selectedPartnerId || undefined,
        customerId: selectedCustomerId || undefined,
        customerName: targetCustomerName,
        customerAddress: targetCustomerAddress,
        customerTaxId: targetCustomerTaxId,
        items: docItems,
        subtotal,
        vatAmount,
        totalAmount,
        paymentMethod: paymentMethod || undefined,
        status: (createType === 'receipt' || createType === 'short_receipt') ? 'Paid' : 'Pending',
        remarks,
        referenceDocumentNo: selectedReceiptId ? billingDocuments.find(d => d.id === selectedReceiptId)?.documentNo : undefined,
        createdBy: currentUser?.name || 'Admin'
      });
    }

    setView('list');
    resetForm();
  };

  const resetForm = () => {
    setEditingDocId(null);
    setSelectedPartnerId('');
    setSelectedCustomerId('');
    setCustomerNameInput('');
    setCustomerAddressInput('');
    setCustomerTaxIdInput('');
    setDocItems([]);
    setVatEnabled(false);
    setPaymentMethod('');
    setRemarks('');
    setSelectedReceiptId('');
  };

  const handleEdit = (doc: BillingDocument) => {
    setEditingDocId(doc.id);
    setCreateType(doc.type);
    setSelectedPartnerId(doc.partnerId || '');
    setSelectedCustomerId(doc.customerId || '');
    setCustomerNameInput(doc.customerName || '');
    setCustomerAddressInput(doc.customerAddress || '');
    setCustomerTaxIdInput(doc.customerTaxId || '');
    setDocItems(doc.items);
    setVatEnabled(doc.vatAmount > 0);
    setPaymentMethod(doc.paymentMethod || '');
    setRemarks(doc.remarks || '');
    setView('create');
  };

  const handleCustomerChange = (id: string) => {
    setSelectedCustomerId(id);
    setSelectedPartnerId('');
    const cust = customers.find(c => c.id === id);
    if (cust) {
      setCustomerNameInput(cust.name);
      setCustomerAddressInput(cust.address || '');
      setCustomerTaxIdInput(cust.taxId || '');
    } else {
      setCustomerNameInput('');
      setCustomerAddressInput('');
      setCustomerTaxIdInput('');
    }
  };

  const handlePartnerChange = (id: string) => {
    setSelectedPartnerId(id);
    setSelectedCustomerId('');
    const part = partners.find(p => p.id === id);
    if (part) {
      setCustomerNameInput(part.companyName);
      setCustomerAddressInput(part.address || '');
      setCustomerTaxIdInput(part.taxId || '');
    } else {
      setCustomerNameInput('');
      setCustomerAddressInput('');
      setCustomerTaxIdInput('');
    }
  };

  const handleExportDocx = async (docData: BillingDocument) => {
    const compName = companyName || "Company Name";
    const compAddress = companyAddress || "111 อาคารเอไอเอ แคปปิตอล เซ็นเตอร์ แขวงดินแดง เขตดินแดง กรุงเทพฯ 10400";
    const compTaxId = companyTaxId || "0105555555555";
    const docTitle = docData.type === 'receipt' ? 'ใบเสร็จรับเงิน (Receipt)' : docData.type === 'short_receipt' ? 'ใบกำกับภาษีอย่างย่อ (Abbreviated Tax Invoice)' : docData.type === 'tax_invoice' ? 'ใบกำกับภาษี (Tax Invoice)' : 'ใบแจ้งหนี้ (Invoice)';

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: compName, bold: true, size: 32 })],
            alignment: AlignmentType.LEFT,
          }),
          new Paragraph({
            children: [new TextRun({ text: compAddress, size: 24 })],
          }),
          new Paragraph({
            children: [new TextRun({ text: `เลขประจำตัวผู้เสียภาษี: ${compTaxId}`, size: 24 })],
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [new TextRun({ text: docTitle, bold: true, size: 40 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          ...(docData.paymentMethod ? [
            new Paragraph({
              children: [new TextRun({ text: `ช่องทางการชำระเงิน: ${docData.paymentMethod}`, size: 24, bold: true })],
              spacing: { after: 200 },
            })
          ] : []),
          ...(docData.remarks ? [
            new Paragraph({
              children: [new TextRun({ text: `หมายเหตุ: ${docData.remarks}`, size: 24, bold: true })],
              spacing: { after: 200 },
            })
          ] : []),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: `ลูกค้า: ${docData.customerName || '-'}`, bold: true })] }),
                      new Paragraph({ children: [new TextRun({ text: `ที่อยู่: ${docData.customerAddress || '-'}` })] }),
                      new Paragraph({ children: [new TextRun({ text: `เลขประจำตัวผู้เสียภาษี: ${docData.customerTaxId || '-'}` })] }),
                    ],
                    borders: { top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } }
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: `เลขที่เอกสาร: ${docData.documentNo}`, bold: true })] }),
                      new Paragraph({ children: [new TextRun({ text: `วันที่: ${format(new Date(docData.date), 'dd/MM/yyyy')}` })] }),
                    ],
                    borders: { top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } }
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({ spacing: { before: 200 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "ลำดับ", bold: true })], alignment: AlignmentType.CENTER })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "รายการ", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "จำนวน", bold: true })], alignment: AlignmentType.CENTER })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "ราคา/หน่วย", bold: true })], alignment: AlignmentType.RIGHT })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "จำนวนเงิน", bold: true })], alignment: AlignmentType.RIGHT })] }),
                ]
              }),
              ...docData.items.map((item, idx) => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: (idx + 1).toString() })], alignment: AlignmentType.CENTER })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.productName })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.quantity.toString() })], alignment: AlignmentType.CENTER })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 }) })], alignment: AlignmentType.RIGHT })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.total.toLocaleString(undefined, { minimumFractionDigits: 2 }) })], alignment: AlignmentType.RIGHT })] }),
                ]
              })),
              new TableRow({
                children: [
                  new TableCell({ columnSpan: 4, children: [new Paragraph({ children: [new TextRun({ text: "มูลค่ารวม", bold: true })], alignment: AlignmentType.RIGHT })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: docData.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 }), bold: true })], alignment: AlignmentType.RIGHT })] }),
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ columnSpan: 4, children: [new Paragraph({ children: [new TextRun({ text: `ภาษีมูลค่าเพิ่ม ${vatRate || 7}%`, bold: true })], alignment: AlignmentType.RIGHT })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: docData.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }), bold: true })], alignment: AlignmentType.RIGHT })] }),
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ columnSpan: 4, children: [new Paragraph({ children: [new TextRun({ text: "ยอดสุทธิ", bold: true })], alignment: AlignmentType.RIGHT })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: docData.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }), bold: true })], alignment: AlignmentType.RIGHT })] }),
                ]
              }),
            ],
          }),
        ],
      }],
    });

    Packer.toBlob(doc).then((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${docData.documentNo}.docx`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setView('list');
              resetForm();
            }}
            className={cn(
              "px-6 py-3 rounded-2xl text-[12px] font-bold transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === tab.id
                ? "bg-[#1A1F3D] text-white shadow-lg shadow-[#1A1F3D]/20"
                : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-100"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {view === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col min-h-0"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-4 items-center">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="ค้นหาเลขที่เอกสาร, ชื่อลูกค้า..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 py-3 bg-white rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 w-80 text-sm shadow-sm"
                  />
                </div>
                {activeTab === 'receipt_all' && (
                  <select
                    value={receiptFilter}
                    onChange={(e) => setReceiptFilter(e.target.value as any)}
                    className="px-4 py-3 bg-white rounded-2xl border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm font-medium"
                  >
                    <option value="all">แสดงทั้งหมด</option>
                    <option value="receipt">เฉพาะใบเสร็จรับเงิน</option>
                    <option value="short_receipt">เฉพาะอย่างย่อ (POS)</option>
                  </select>
                )}
              </div>
              
              {activeTab === 'receipt_all' ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setCreateType('receipt'); setView('create'); }}
                    className="px-6 py-3 bg-[#1A1F3D] text-white rounded-full text-sm font-bold flex items-center gap-2 hover:bg-gray-900 transition-colors shadow-lg shadow-[#1A1F3D]/20"
                  >
                    <Plus size={18} /> สร้างใบเสร็จเต็ม
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setCreateType(activeTab as BillingDocumentType); setView('create'); }}
                  className="px-6 py-3 bg-[#1A1F3D] text-white rounded-full text-sm font-bold flex items-center gap-2 hover:bg-gray-900 transition-colors shadow-lg shadow-[#1A1F3D]/20"
                >
                  <Plus size={18} />
                  สร้าง{tabs.find(t => t.id === activeTab)?.label.split(' ')[0]}
                </button>
              )}
            </div>

            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-[#F9F9F9]/50">
                      <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-left whitespace-nowrap">เลขที่เอกสาร / วันที่</th>
                      <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-left whitespace-nowrap">ลูกค้า/คู่ค้า</th>
                      <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center whitespace-nowrap">จำนวนรายการ</th>
                      <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center whitespace-nowrap">ยอดรวม</th>
                      <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center whitespace-nowrap">สถานะ</th>
                      <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center whitespace-nowrap">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocs.map(doc => (
                      <tr key={doc.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                        <td className="py-2 px-4 whitespace-nowrap text-left">
                          <div className="font-bold text-sm text-[#1A1F3D]">{doc.documentNo}</div>
                          <div className="text-[10px] text-gray-500">{format(new Date(doc.date), 'dd MMM yyyy HH:mm')}</div>
                        </td>
                        <td className="py-2 px-4 whitespace-nowrap text-left">
                          <div className="font-bold text-xs text-[#1A1F3D]">{doc.customerName || '-'}</div>
                          {doc.customerTaxId && <div className="text-[10px] text-gray-400">เลขผู้เสียภาษี: {doc.customerTaxId}</div>}
                        </td>
                        <td className="py-2 px-4 text-center whitespace-nowrap">
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-[10px] font-bold">
                            {doc.items.length} รายการ
                          </span>
                        </td>
                        <td className="py-2 px-4 font-black text-sm text-[#1A1F3D] text-center whitespace-nowrap">
                          ฿{doc.totalAmount.toLocaleString()}
                        </td>
                        <td className="py-2 px-4">
                          <div className="flex flex-col justify-center items-center">
                            <span className={cn("px-2.5 py-1 rounded-full text-[9px] uppercase tracking-wider font-black flex items-center gap-1 w-max", getStatusColor(doc.status))}>
                              {getStatusIcon(doc.status)}
                              {doc.status}
                            </span>
                            {activeTab === 'receipt_all' && hasTaxInvoice(doc.documentNo) && (
                              <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full text-[8px] font-bold mt-1">ออกใบกำกับภาษีแล้ว</span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-4">
                          <div className="flex flex-wrap items-center justify-center gap-1.5">
                            <button
                              onClick={() => setPreviewDoc(doc)}
                              className="bg-[#1A1F3D] text-white px-3 py-1.5 rounded-full font-bold text-[10px] flex items-center gap-1 hover:bg-gray-900 transition-colors shadow-sm"
                            >
                              <FileText size={12} /> พรีวิว
                            </button>
                            <button
                              onClick={() => handleEdit(doc)}
                              className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full font-bold text-[10px] flex items-center gap-1 hover:bg-orange-100 transition-colors shadow-sm"
                            >
                              <Search size={12} /> แก้ไข
                            </button>
                            {doc.status === 'Pending' && (
                              <button
                                onClick={() => updateBillingDocumentStatus(doc.id, 'Paid')}
                                className="bg-green-50 text-green-600 px-3 py-1.5 rounded-full font-bold text-[10px] flex items-center gap-1 hover:bg-green-100 transition-colors shadow-sm"
                              >
                                <CheckCircle size={12} /> ชำระแล้ว
                              </button>
                            )}
                            {doc.status !== 'Cancelled' && (
                              <button
                                onClick={() => updateBillingDocumentStatus(doc.id, 'Cancelled')}
                                className="bg-red-50 text-red-600 px-3 py-1.5 rounded-full font-bold text-[10px] flex items-center gap-1 hover:bg-red-100 transition-colors shadow-sm"
                              >
                                <XCircle size={12} /> ยกเลิก
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredDocs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-gray-400">
                          ไม่พบเอกสาร
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-4">
                <button onClick={() => { setView('list'); resetForm(); }} className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                  <X size={20} />
                </button>
                <div>
                  <h2 className="text-xl font-black text-[#1A1F3D]">
                    {editingDocId ? 'แก้ไข' : 'สร้าง'}{createType === 'receipt' ? 'ใบเสร็จรับเงิน (เต็มรูปแบบ)' : createType === 'short_receipt' ? 'ใบเสร็จรับเงินอย่างย่อ' : createType === 'tax_invoice' ? 'ใบกำกับภาษี' : 'ใบแจ้งหนี้'}
                  </h2>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                    {createType === 'receipt' ? 'Receipt Generation' : createType === 'short_receipt' ? 'Abbreviated Receipt' : createType === 'tax_invoice' ? 'Tax Invoice Generation' : 'Invoice Generation'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSaveDoc}
                disabled={docItems.length === 0 || (!customerNameInput && !selectedPartnerId && !selectedCustomerId)}
                className="px-6 py-3 bg-gradient-to-br from-[#18234A] to-[#020D35] text-white rounded-[3rem] text-sm font-bold flex items-center gap-2 shadow-lg shadow-[#18234A]/20 ring-1 ring-white/10 shadow-inner hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                บันทึกเอกสาร
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {createType === 'tax_invoice' && !editingDocId && (
                <div className="bg-blue-50 rounded-[24px] p-6 border border-blue-100">
                  <h3 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <Receipt size={16} /> อ้างอิงจากใบเสร็จรับเงิน (Reference Receipt)
                  </h3>
                  <select
                    value={selectedReceiptId}
                    onChange={(e) => setSelectedReceiptId(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-blue-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium text-blue-900"
                  >
                    <option value="">-- เลือกใบเสร็จรับเงินที่ต้องการออกใบกำกับภาษีแทน (ถ้ามี) --</option>
                    {billingDocuments.filter(d => (d.type === 'receipt' || d.type === 'short_receipt') && !hasTaxInvoice(d.documentNo) && d.status !== 'Cancelled').map(r => (
                      <option key={r.id} value={r.id}>{r.documentNo} - {r.customerName || 'ลูกค้าทั่วไป'} (฿{r.totalAmount.toLocaleString()})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Customer/Partner Selection */}
              <div className="bg-gray-50 rounded-[24px] p-6 border border-gray-100">
                <h3 className="text-sm font-bold text-[#1A1F3D] mb-4 flex items-center gap-2">
                  <User size={16} /> ข้อมูลลูกค้า / คู่ค้า
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">ดึงข้อมูลลูกค้า (Customers)</label>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => handleCustomerChange(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium"
                    >
                      <option value="">-- เลือกลูกค้าในระบบ --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">หรือ ดึงข้อมูลคู่ค้า (Partners)</label>
                    <select
                      value={selectedPartnerId}
                      onChange={(e) => handlePartnerChange(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium"
                    >
                      <option value="">-- เลือกคู่ค้าในระบบ --</option>
                      {partners.map(p => (
                        <option key={p.id} value={p.id}>{p.companyName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">ชื่อลูกค้า/บริษัท <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={customerNameInput}
                      onChange={(e) => setCustomerNameInput(e.target.value)}
                      placeholder="ระบุชื่อลูกค้าหรือบริษัท"
                      className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">ที่อยู่</label>
                    <input
                      type="text"
                      value={customerAddressInput}
                      onChange={(e) => setCustomerAddressInput(e.target.value)}
                      placeholder="ระบุที่อยู่"
                      className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">เลขประจำตัวผู้เสียภาษี</label>
                    <input
                      type="text"
                      value={customerTaxIdInput}
                      onChange={(e) => setCustomerTaxIdInput(e.target.value)}
                      placeholder="ระบุเลขประจำตัวผู้เสียภาษี"
                      className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Items Section */}
              <div>
                <h3 className="text-sm font-bold text-[#1A1F3D] mb-4">รายการสินค้า/บริการ</h3>
                <div className="flex flex-col gap-2 mb-4 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                  <div className="flex gap-2">
                    <select
                      value={selectedItemType}
                      onChange={(e) => { setSelectedItemType(e.target.value as any); setSelectedProductId(''); }}
                      className="px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none md:w-48"
                    >
                      <option value="product">สินค้าคงคลัง</option>
                      <option value="service">บริการ</option>
                      <option value="addon">บริการเสริม</option>
                      <option value="package">แพ็กเกจ</option>
                      <option value="credit">เติมเครดิต</option>
                    </select>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none"
                    >
                      <option value="">เลือกระบุรายการ</option>
                      {selectedItemType === 'product' && inventory.map(i => <option key={i.id} value={i.id}>{i.name} (สต๊อก: {i.stock})</option>)}
                      {selectedItemType === 'service' && services.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                      {selectedItemType === 'addon' && addons.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      {selectedItemType === 'package' && packageTemplates.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      {selectedItemType === 'credit' && creditPackages.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="จำนวน"
                      value={qtyInput}
                      onChange={(e) => setQtyInput(e.target.value)}
                      className="w-1/2 md:w-32 px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="ราคา/หน่วย"
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      className="w-1/2 md:w-32 px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none"
                    />
                    <button
                      onClick={handleAddItem}
                      className="px-6 py-3 bg-gradient-to-br from-[#18234A] to-[#020D35] text-white rounded-[3rem] text-sm font-bold flex items-center justify-center shadow-lg shadow-[#18234A]/20 ring-1 ring-white/10 shadow-inner hover:opacity-90 transition-all shrink-0"
                    >
                      เพิ่มรายการ
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-[24px] overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="py-4 px-6 text-xs font-bold text-gray-500">ลำดับ</th>
                        <th className="py-4 px-6 text-xs font-bold text-gray-500">รายการ</th>
                        <th className="py-4 px-6 text-xs font-bold text-gray-500 text-right">จำนวน</th>
                        <th className="py-4 px-6 text-xs font-bold text-gray-500 text-right">ราคา/หน่วย</th>
                        <th className="py-4 px-6 text-xs font-bold text-gray-500 text-right">จำนวนเงิน</th>
                        <th className="py-4 px-6 text-xs font-bold text-gray-500 text-center">ลบ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {docItems.map((item, idx) => (
                        <tr key={item.productId} className="border-b border-gray-100 last:border-0">
                          <td className="py-4 px-6 text-sm text-gray-500">{idx + 1}</td>
                          <td className="py-4 px-6 text-sm font-bold text-[#1A1F3D]">{item.productName}</td>
                          <td className="py-4 px-6 text-sm font-medium text-right">{item.quantity}</td>
                          <td className="py-4 px-6 text-sm font-medium text-right">฿{item.unitPrice.toLocaleString()}</td>
                          <td className="py-4 px-6 text-sm font-bold text-blue-600 text-right">฿{item.total.toLocaleString()}</td>
                          <td className="py-4 px-6 text-center">
                            <button onClick={() => handleRemoveItem(item.productId, item.itemType)} className="text-gray-400 hover:text-red-500 transition-colors p-2">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {docItems.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-gray-400">
                            ยังไม่มีรายการสินค้า กรุณาเพิ่มรายการด้านบน
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Section */}
              <div className="flex justify-between items-start pt-4 pb-10">
                <div className="w-80 bg-gray-50 p-6 rounded-[24px] border border-gray-100 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">ช่องทางการชำระเงิน (Payment Method)</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium"
                    >
                      <option value="">-- ระบุช่องทางการชำระ --</option>
                      <option value="Cash">เงินสด (Cash)</option>
                      <option value="Transfer">โอนเงิน (Transfer)</option>
                      <option value="Credit Card">บัตรเครดิต (Credit Card)</option>
                      <option value="Store Credit">เครดิตร้าน (Store Credit)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">หมายเหตุ (Remarks)</label>
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      rows={3}
                      placeholder="เช่น ใบกำกับภาษีฉบับนี้ได้ออกแทนใบเสร็จรับเงิน..."
                    />
                  </div>
                </div>
                <div className="w-80 bg-gray-50 p-6 rounded-[24px] border border-gray-100 space-y-3">
                  <label className="flex items-center gap-2 mb-4 cursor-pointer">
                    <input type="checkbox" checked={vatEnabled || createType === 'tax_invoice'} disabled={createType === 'tax_invoice'} onChange={(e) => setVatEnabled(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 disabled:opacity-50" />
                    <span className="text-sm font-bold text-gray-600">คำนวณ VAT {vatRate || 7}%</span>
                    {createType === 'tax_invoice' && <span className="text-[10px] text-red-500 ml-1">(บังคับสำหรับใบกำกับภาษี)</span>}
                  </label>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-500">มูลค่ารวม</span>
                    <span className="text-sm font-bold text-[#1A1F3D]">฿{calculateTotals().subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  {(vatEnabled || createType === 'tax_invoice') && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-500">ภาษีมูลค่าเพิ่ม {vatRate || 7}%</span>
                      <span className="text-sm font-bold text-[#1A1F3D]">฿{calculateTotals().vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-base font-black text-[#1A1F3D]">ยอดสุทธิ</span>
                    <span className="text-xl font-black text-blue-600">฿{calculateTotals().totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 text-xs font-medium text-gray-400 text-right">
                    ({formatBahtText(calculateTotals().totalAmount)})
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      {previewDoc && previewDoc.type === 'short_receipt' ? (
        <ReceiptPreview 
          transaction={{
            id: previewDoc.documentNo,
            date: previewDoc.date,
            customerName: previewDoc.customerName || 'Walk-in Customer',
            items: previewDoc.items.map(item => ({
              title: item.productName,
              quantity: item.quantity,
              price: item.unitPrice,
              finalPrice: item.unitPrice,
            })),
            amount: previewDoc.totalAmount,
            discountAmount: 0,
            paymentMethod: previewDoc.paymentMethod || 'Cash',
            subtotal: previewDoc.subtotal,
            vatAmount: previewDoc.vatAmount,
            vatRate: 7,
            isTaxInvoice: false,
          }}
          shopName={shopName}
          shopLogo={shopLogo}
          shopAddress={shopAddress}
          shopPhone={shopPhone}
          header={receiptHeader}
          footer={receiptFooter}
          paperSize={(receiptPaperSize as any) || '80mm'}
          onClose={() => setPreviewDoc(null)}
        />
      ) : previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-[90vw] max-w-[800px] max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-black text-[#1A1F3D]">Preview {previewDoc.type === 'receipt' ? 'Receipt' : previewDoc.type === 'short_receipt' ? 'Abbreviated Receipt' : previewDoc.type === 'tax_invoice' ? 'Tax Invoice' : 'Invoice'}</h2>
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider",
                  getStatusColor(previewDoc.status)
                )}>
                  {getStatusIcon(previewDoc.status)}
                  {previewDoc.status}
                </span>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
              <style type="text/css" media="print">
                {`
                  body * { visibility: hidden; }
                  #printable-doc, #printable-doc * { visibility: visible; }
                  #printable-doc { position: absolute; left: 0; top: 0; width: 100%; background: white; margin: 0; padding: 20px; }
                  @page { size: A4; margin: 0; }
                `}
              </style>
              <div id="printable-doc" className="bg-white p-8 shadow-sm border border-gray-200 mx-auto max-w-[800px] text-[10px] font-sans text-black">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="text-2xl font-black tracking-tighter text-[#1A1F3D]">{companyName || "Company Name"}</div>
                  <div className="text-right text-[10px] text-gray-600 space-y-1">
                    <p className="font-bold">{companyName || "Company Name"}</p>
                    <p>{companyAddress || "111 อาคารเอไอเอ แคปปิตอล เซ็นเตอร์ แขวงดินแดง เขตดินแดง กรุงเทพฯ 10400"}</p>
                    <p>เลขที่ผู้เสียภาษี {companyTaxId || "0105555555555"} (สำนักงานใหญ่)</p>
                  </div>
                </div>

                {/* Title Box */}
                <div className="flex justify-end mb-4">
                  <div className="w-[300px] border border-black flex flex-col">
                    <div className="flex">
                      <div className="bg-black text-white flex-1 p-3 text-center flex flex-col justify-center">
                        <h1 className="text-lg font-bold">
                          {previewDoc.type === 'receipt' ? 'ใบเสร็จรับเงิน' : previewDoc.type === 'short_receipt' ? 'ใบกำกับภาษีอย่างย่อ' : previewDoc.type === 'tax_invoice' ? 'ใบกำกับภาษี' : 'ใบแจ้งหนี้'}
                        </h1>
                        <p className="text-xs">
                          {previewDoc.type === 'receipt' ? 'Receipt' : previewDoc.type === 'short_receipt' ? 'Abbreviated Tax Invoice' : previewDoc.type === 'tax_invoice' ? 'Tax Invoice' : 'Invoice'}
                        </p>
                      </div>
                      <div className="w-[120px] flex flex-col border-l border-black bg-white">
                        <div className="text-center text-xs p-1 border-b border-black">ต้นฉบับ / Original</div>
                        <div className="text-center p-3 font-bold">{previewDoc.documentNo}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Boxes */}
                <div className="grid grid-cols-12 border border-black mb-4">
                  <div className="col-span-8 border-r border-black p-3 space-y-2">
                    <div className="flex"><span className="w-24 font-bold shrink-0">ลูกค้า<br /><span className="text-[8px] font-normal">Customer</span></span> <span className="flex-1 break-words">{previewDoc.customerName || '-'}</span></div>
                    <div className="flex"><span className="w-24 font-bold shrink-0">เลขที่ผู้เสียภาษี<br /><span className="text-[8px] font-normal">Tax ID</span></span> <span className="flex-1 break-words">{previewDoc.customerTaxId || '-'} {previewDoc.customerTaxId ? '(สำนักงานใหญ่)' : ''}</span></div>
                    <div className="flex"><span className="w-24 font-bold shrink-0">ที่อยู่<br /><span className="text-[8px] font-normal">Address</span></span> <span className="flex-1 break-words">{previewDoc.customerAddress || '-'}</span></div>
                  </div>
                  <div className="col-span-4 p-3 space-y-2">
                    <div className="flex"><span className="w-16 font-bold shrink-0">วันที่<br /><span className="text-[8px] font-normal">Date</span></span> <span className="flex-1 break-words">{format(new Date(previewDoc.date), 'dd/MM/yyyy')}</span></div>
                    <div className="flex"><span className="w-16 font-bold shrink-0">ผู้จัดทำ<br /><span className="text-[8px] font-normal">Prepared By</span></span> <span className="flex-1 break-words">{previewDoc.createdBy}</span></div>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full border-collapse border border-black mb-4">
                  <thead>
                    <tr className="bg-black text-white text-[10px]">
                      <th className="border border-black p-2 font-normal">เลขที่<br />No.</th>
                      <th className="border border-black p-2 font-normal text-left">รายการ<br />Description</th>
                      <th className="border border-black p-2 font-normal">จำนวน<br />Quantity</th>
                      <th className="border border-black p-2 font-normal">ราคา/หน่วย<br />Unit Price</th>
                      <th className="border border-black p-2 font-normal">จำนวนเงิน (THB)<br />Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewDoc.items.map((item, idx) => (
                      <tr key={idx} className="text-[10px]">
                        <td className="border-l border-r border-black p-2 text-center align-top">{idx + 1}</td>
                        <td className="border-l border-r border-black p-2 align-top">{item.productName}</td>
                        <td className="border-l border-r border-black p-2 text-center align-top">{item.quantity}</td>
                        <td className="border-l border-r border-black p-2 text-right align-top">{item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="border-l border-r border-black p-2 text-right align-top">{item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                    {/* Fill empty rows */}
                    {Array.from({ length: Math.max(0, 5 - previewDoc.items.length) }).map((_, i) => (
                      <tr key={`empty-${i}`}>
                        <td className="border-l border-r border-black p-2 text-center text-transparent">.</td>
                        <td className="border-l border-r border-black p-2 text-transparent">.</td>
                        <td className="border-l border-r border-black p-2 text-transparent">.</td>
                        <td className="border-l border-r border-black p-2 text-transparent">.</td>
                        <td className="border-l border-r border-black p-2 text-transparent">.</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Summary Table */}
                <div className="flex border border-black mb-4">
                  <div className="flex-1 p-4 bg-white flex flex-col justify-end border-r border-black">
                    {previewDoc.paymentMethod && (
                      <div className="mb-4 text-xs font-bold">
                        ช่องทางการชำระเงิน / Payment Method: <span className="font-normal">{previewDoc.paymentMethod}</span>
                      </div>
                    )}
                    {previewDoc.remarks && (
                      <div className="mb-4 text-xs font-bold text-blue-900">
                        หมายเหตุ / Remarks: <span className="font-normal">{previewDoc.remarks}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <div className="font-bold text-xs whitespace-nowrap">จำนวนเงิน<br /><span className="text-[10px] font-normal">Amount</span></div>
                      <div className="font-bold text-sm bg-gray-200 px-6 py-2 rounded-full w-full text-center">{formatBahtText(previewDoc.totalAmount)}</div>
                    </div>
                  </div>
                  <div className="w-[350px]">
                    <div className="flex border-b border-black bg-white">
                      <div className="flex-1 p-2 text-xs"><span className="font-bold">รวมเป็นเงิน</span><br /><span className="text-[10px]">Subtotal</span></div>
                      <div className="w-[120px] p-2 text-right border-l border-black font-bold">{previewDoc.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div className="flex border-b border-black bg-white">
                      <div className="flex-1 p-2 text-xs"><span className="font-bold">หักส่วนลดพิเศษ</span><br /><span className="text-[10px]">Special Discount</span></div>
                      <div className="w-[120px] p-2 text-right border-l border-black font-bold">0.00</div>
                    </div>
                    <div className="flex border-b border-black bg-white">
                      <div className="flex-1 p-2 text-xs"><span className="font-bold">ยอดรวมหลังหักส่วนลด</span><br /><span className="text-[10px]">After Discount</span></div>
                      <div className="w-[120px] p-2 text-right border-l border-black font-bold">{previewDoc.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div className="flex border-b border-black bg-white">
                      <div className="flex-1 p-2 text-xs"><span className="font-bold">จำนวนภาษีมูลค่าเพิ่ม {vatRate || 7}%</span><br /><span className="text-[10px]">Value Added Tax</span></div>
                      <div className="w-[120px] p-2 text-right border-l border-black font-bold">{previewDoc.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div className="flex bg-black text-white">
                      <div className="flex-1 p-2 text-xs"><span className="font-bold">จำนวนเงินรวมทั้งสิ้น</span><br /><span className="text-[10px]">Total</span></div>
                      <div className="w-[120px] p-2 text-right border-l border-white font-bold">{previewDoc.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-3 gap-4 border border-black p-4 text-center text-xs">
                  <div className="flex flex-col justify-end pt-16 space-y-2">
                    <div className="border-b border-dashed border-gray-400 mx-8"></div>
                    <div><span className="font-bold">ผู้ตรวจสอบ / Approver</span></div>
                    <div>วันที่ / Date ........................................</div>
                  </div>
                  <div className="flex items-center justify-center pt-4">
                    <div className="border-4 border-gray-200 border-double text-gray-200 text-2xl font-black tracking-tighter px-4 py-2 opacity-50 rotate-[-5deg] uppercase">
                      {companyName || "APPROVED"}
                    </div>
                  </div>
                  <div className="flex flex-col justify-end pt-16 space-y-2">
                    <div className="border-b border-dashed border-gray-400 mx-8"></div>
                    <div><span className="font-bold">ผู้มีอำนาจลงนาม / Authorized Signature</span></div>
                    <div>วันที่ / Date ....{format(new Date(), 'dd/MM/yyyy')}....</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-white flex justify-end items-center gap-3">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-6 py-3 font-bold text-base text-gray-500 hover:text-gray-700 transition-colors mr-2"
              >
                ปิด
              </button>
              <button
                onClick={() => window.print()}
                className="px-8 py-3 rounded-2xl font-bold text-base bg-[#0B1021] text-white hover:bg-gray-900 shadow-lg shadow-[#0B1021]/20 flex items-center gap-2 transition-all"
              >
                <Printer size={20} strokeWidth={2.5} /> Print
              </button>
              <button
                onClick={() => handleExportDocx(previewDoc)}
                className="px-8 py-3 rounded-2xl font-bold text-base bg-[#0B1021] text-white hover:bg-gray-900 shadow-lg shadow-[#0B1021]/20 flex items-center gap-2 transition-all"
              >
                <Download size={20} strokeWidth={2.5} /> Export Word (.docx)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingSystem;
