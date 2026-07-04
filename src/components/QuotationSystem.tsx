import React, { useState } from 'react';
import { useStore, Quotation, QuotationItem } from '@/store/useStore';
import { format } from 'date-fns';
import { Plus, Search, FileText, CheckCircle, XCircle, Clock, Trash2, Save, X, Download, Printer, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, VerticalAlign } from 'docx';
import { formatBahtText } from '@/lib/bahttext';

interface QuotationSystemProps {
  initialView?: 'list' | 'create';
  onViewChange?: (view: 'list' | 'create') => void;
}

const QuotationSystem: React.FC<QuotationSystemProps> = ({ initialView = 'list', onViewChange }) => {
  const {
    quotations, partners, inventory, services, addons, packageTemplates, creditPackages,
    currentUser, addQuotation, updateQuotation, updateQuotationStatus,
    companyName, companyAddress, companyTaxId, companyPhone, companyEmail, shopName, shopAddress, shopPhone
  } = useStore();
  const [view, setView] = useState<'list' | 'create'>(initialView);

  React.useEffect(() => {
    setView(initialView);
  }, [initialView]);

  const handleViewChange = (newView: 'list' | 'create') => {
    setView(newView);
    if (onViewChange) onViewChange(newView);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [previewQT, setPreviewQT] = useState<Quotation | null>(null);

  // Create QT State
  const [editingQTId, setEditingQTId] = useState<string | null>(null);

  // Customer State
  const [isManualCustomer, setIsManualCustomer] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [manualCustomer, setManualCustomer] = useState({
    name: '',
    address: '',
    taxId: '',
    phone: ''
  });

  // Item State
  const [qtItems, setQtItems] = useState<QuotationItem[]>([]);
  const [selectedItemType, setSelectedItemType] = useState<'product' | 'service' | 'addon' | 'package' | 'credit'>('product');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [qtyInput, setQtyInput] = useState('');
  const [priceInput, setPriceInput] = useState('');

  React.useEffect(() => {
    if (!selectedItemId) {
      setPriceInput('');
      return;
    }

    let defaultPrice = 0;
    if (selectedItemType === 'product') {
      const product = inventory.find(i => i.id === selectedItemId);
      if (product) defaultPrice = product.price;
    } else if (selectedItemType === 'service') {
      const service = services.find(s => s.id === selectedItemId);
      if (service && service.prices) {
        const firstPrice = Object.values(service.prices)[0];
        if (firstPrice) defaultPrice = firstPrice.price;
      }
    } else if (selectedItemType === 'addon') {
      const addon = addons.find(a => a.id === selectedItemId);
      if (addon) defaultPrice = addon.price;
    } else if (selectedItemType === 'package') {
      const pkg = packageTemplates.find(p => p.id === selectedItemId);
      if (pkg) defaultPrice = pkg.price;
    } else if (selectedItemType === 'credit') {
      const credit = creditPackages.find(c => c.id === selectedItemId);
      if (credit) defaultPrice = credit.price;
    }

    setPriceInput(defaultPrice.toString());
  }, [selectedItemId, selectedItemType, inventory, services, addons, packageTemplates, creditPackages]);

  const totalQTs = quotations.length;
  const pendingQTs = quotations.filter(qt => qt.status === 'Pending').length;
  const completedQTs = quotations.filter(qt => qt.status === 'Completed').length;
  const cancelledQTs = quotations.filter(qt => qt.status === 'Cancelled').length;

  const filteredQTs = quotations.filter(qt =>
    qt.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (qt.partnerId ? partners.find(p => p.id === qt.partnerId)?.companyName.toLowerCase().includes(searchQuery.toLowerCase()) : false) ||
    (qt.customerName && qt.customerName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-50 text-green-600';
      case 'Cancelled': return 'bg-red-50 text-red-600';
      default: return 'bg-orange-50 text-orange-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle size={14} />;
      case 'Cancelled': return <XCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const handleAddItem = () => {
    if (!selectedItemId || !qtyInput || !priceInput) return;

    let itemName = '';

    if (selectedItemType === 'product') {
      const product = inventory.find(i => i.id === selectedItemId);
      if (!product) return;
      itemName = product.name;
    } else if (selectedItemType === 'service') {
      const service = services.find(s => s.id === selectedItemId);
      if (!service) return;
      itemName = service.title;
    } else if (selectedItemType === 'addon') {
      const addon = addons.find(a => a.id === selectedItemId);
      if (!addon) return;
      itemName = addon.name;
    } else if (selectedItemType === 'package') {
      const pkg = packageTemplates.find(p => p.id === selectedItemId);
      if (!pkg) return;
      itemName = pkg.name;
    } else if (selectedItemType === 'credit') {
      const credit = creditPackages.find(c => c.id === selectedItemId);
      if (!credit) return;
      itemName = credit.name;
    }

    const qty = parseInt(qtyInput);
    const price = parseFloat(priceInput);

    if (qty <= 0 || price < 0) return;

    const existingItem = qtItems.find(i => i.productId === selectedItemId && i.itemType === selectedItemType);
    if (existingItem) {
      setQtItems(qtItems.map(i => (i.productId === selectedItemId && i.itemType === selectedItemType) ? {
        ...i,
        quantity: i.quantity + qty,
        total: (i.quantity + qty) * i.unitPrice
      } : i));
    } else {
      setQtItems([...qtItems, {
        productId: selectedItemId,
        productName: itemName,
        quantity: qty,
        unitPrice: price,
        total: qty * price,
        itemType: selectedItemType
      }]);
    }

    setSelectedItemId('');
    setQtyInput('');
    setPriceInput('');
  };

  const handleRemoveItem = (productId: string, itemType?: string) => {
    setQtItems(qtItems.filter(i => !(i.productId === productId && i.itemType === itemType)));
  };

  const handleSaveQT = () => {
    if ((!isManualCustomer && !selectedPartnerId) || (isManualCustomer && !manualCustomer.name) || qtItems.length === 0) return;

    if (editingQTId) {
      updateQuotation(editingQTId, {
        partnerId: isManualCustomer ? undefined : selectedPartnerId,
        customerName: isManualCustomer ? manualCustomer.name : undefined,
        customerAddress: isManualCustomer ? manualCustomer.address : undefined,
        customerTaxId: isManualCustomer ? manualCustomer.taxId : undefined,
        customerPhone: isManualCustomer ? manualCustomer.phone : undefined,
        items: qtItems,
        totalAmount: qtItems.reduce((sum, item) => sum + item.total, 0),
      });
    } else {
      addQuotation({
        date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX"),
        partnerId: isManualCustomer ? undefined : selectedPartnerId,
        customerName: isManualCustomer ? manualCustomer.name : undefined,
        customerAddress: isManualCustomer ? manualCustomer.address : undefined,
        customerTaxId: isManualCustomer ? manualCustomer.taxId : undefined,
        customerPhone: isManualCustomer ? manualCustomer.phone : undefined,
        items: qtItems,
        status: 'Pending',
        totalAmount: qtItems.reduce((sum, item) => sum + item.total, 0),
        createdBy: currentUser?.name || 'Admin'
      });
    }

    handleViewChange('list');
    setSelectedPartnerId('');
    setIsManualCustomer(false);
    setManualCustomer({ name: '', address: '', taxId: '', phone: '' });
    setQtItems([]);
    setEditingQTId(null);
  };

  if (view === 'create') {
    return (
      <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-black text-[#1A1F3D]">{editingQTId ? 'แก้ไขใบเสนอราคา' : 'สร้างใบเสนอราคา (Quotation)'}</h2>
              <p className="text-gray-400 font-bold text-sm">ระบุคู่ค้าและรายการสินค้าที่ต้องการสั่งซื้อ</p>
            </div>
            <button onClick={() => {
              handleViewChange('list');
              setEditingQTId(null);
              setSelectedPartnerId('');
              setQtItems([]);
            }} className="p-3 bg-gray-50 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="space-y-4 bg-gray-50 p-6 rounded-2xl">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-black text-[#1A1F3D]">ข้อมูลลูกค้า / คู่ค้า</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs font-bold text-gray-500">กรอกข้อมูลเอง</span>
                    <input
                      type="checkbox"
                      className="rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 w-4 h-4"
                      checked={isManualCustomer}
                      onChange={(e) => setIsManualCustomer(e.target.checked)}
                    />
                  </label>
                </div>

                {isManualCustomer ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="ชื่อลูกค้า / บริษัท"
                      className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold"
                      value={manualCustomer.name}
                      onChange={(e) => setManualCustomer({ ...manualCustomer, name: e.target.value })}
                    />
                    <textarea
                      placeholder="ที่อยู่"
                      className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold resize-none"
                      rows={2}
                      value={manualCustomer.address}
                      onChange={(e) => setManualCustomer({ ...manualCustomer, address: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="เลขประจำตัวผู้เสียภาษี"
                      className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold"
                      value={manualCustomer.taxId}
                      onChange={(e) => setManualCustomer({ ...manualCustomer, taxId: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="เบอร์โทรศัพท์"
                      className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold"
                      value={manualCustomer.phone}
                      onChange={(e) => setManualCustomer({ ...manualCustomer, phone: e.target.value })}
                    />
                  </div>
                ) : (
                  <select
                    className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold"
                    value={selectedPartnerId}
                    onChange={(e) => setSelectedPartnerId(e.target.value)}
                  >
                    <option value="">-- เลือกลูกค้า/คู่ค้าจากระบบ --</option>
                    {partners.map(p => (
                      <option key={p.id} value={p.id}>{p.companyName}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
                <h3 className="font-black text-[#1A1F3D]">เพิ่มรายการในใบเสนอราคา</h3>

                <div className="space-y-3">
                  <select
                    className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold"
                    value={selectedItemType}
                    onChange={(e) => setSelectedItemType(e.target.value as any)}
                  >
                    <option value="product">สินค้า (Product)</option>
                    <option value="service">บริการ (Service)</option>
                    <option value="addon">บริการเสริม (Add-on)</option>
                    <option value="package">แพ็กเกจ (Package Template)</option>
                    <option value="credit">เครดิตแพ็กเกจ (Credit Package)</option>
                  </select>

                  <select
                    className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold"
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                  >
                    <option value="">-- เลือกรายการ --</option>
                    {selectedItemType === 'product' && inventory.map(i => (
                      <option key={i.id} value={i.id}>{i.name} (ในสต็อก: {i.stock})</option>
                    ))}
                    {selectedItemType === 'service' && services.map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                    {selectedItemType === 'addon' && addons.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                    {selectedItemType === 'package' && packageTemplates.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                    {selectedItemType === 'credit' && creditPackages.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="จำนวน"
                      className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold"
                      value={qtyInput}
                      onChange={(e) => setQtyInput(e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="ราคาต่อหน่วย"
                      className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold"
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                    />
                  </div>

                  <button
                    onClick={handleAddItem}
                    disabled={!selectedItemId || !qtyInput || !priceInput}
                    className="w-full bg-indigo-50 text-indigo-600 py-3 rounded-xl font-black text-sm hover:bg-indigo-100 transition-colors disabled:opacity-50"
                  >
                    เพิ่มเข้าใบเสนอราคา
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-gray-100 rounded-3xl p-6 h-full flex flex-col">
                <h3 className="font-black text-[#1A1F3D] mb-4">รายการที่สั่งซื้อ</h3>

                <div className="flex-1 overflow-y-auto">
                  {qtItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50 space-y-3 py-12">
                      <FileText size={48} />
                      <p className="font-black">ยังไม่มีรายการสินค้า</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-50 text-[10px] font-black uppercase text-gray-400 text-left">
                          <th className="pb-3 px-2">สินค้า</th>
                          <th className="pb-3 px-2 text-right">จำนวน</th>
                          <th className="pb-3 px-2 text-right">ราคา/หน่วย</th>
                          <th className="pb-3 px-2 text-right">รวม</th>
                          <th className="pb-3 px-2 text-center">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {qtItems.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-4 px-2 font-black text-sm">{item.productName}</td>
                            <td className="py-4 px-2 text-right font-bold text-sm">{item.quantity}</td>
                            <td className="py-4 px-2 text-right font-bold text-sm">฿{item.unitPrice.toLocaleString()}</td>
                            <td className="py-4 px-2 text-right font-black text-indigo-600">฿{item.total.toLocaleString()}</td>
                            <td className="py-4 px-2 text-center">
                              <button onClick={() => handleRemoveItem(item.productId, item.itemType)} className="text-red-400 hover:text-red-600 p-1">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-400">ยอดรวมทั้งสิ้น</p>
                    <p className="text-3xl font-black text-[#1A1F3D]">
                      ฿{qtItems.reduce((s, i) => s + i.total, 0).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={handleSaveQT}
                    disabled={(!isManualCustomer && !selectedPartnerId) || (isManualCustomer && !manualCustomer.name) || qtItems.length === 0}
                    className="bg-[#1A1F3D] text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-gray-900 transition-colors disabled:opacity-50"
                  >
                    <Save size={18} /> บันทึกใบเสนอราคา
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleExportDocx = async (qt: Quotation) => {
    const partner = partners.find(p => p.id === qt.partnerId);
    const dateNow = format(new Date(), 'dd/MM/yyyy HH:mm');
    const compName = companyName || shopName || "Company Name";
    const compAddr = companyAddress || shopAddress || "111 อาคารเอไอเอ แคปปิตอล เซ็นเตอร์ แขวงดินแดง เขตดินแดง กรุงเทพฯ 10400";
    const compTax = companyTaxId || "0105555555555";

    // Adjusted Sizes (in half-points)
    const szTitle = 36; // 18pt
    const szHeader = 20; // 10pt
    const szNormal = 16; // 8pt
    const szSmall = 14;  // 7pt
    const szTiny = 12;   // 6pt

    // Header Table (Logo and Company Info)
    const headerTable = new Table({
      borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" }, insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" }, insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" } },
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({ children: [new TextRun({ text: compName, bold: true, size: szTitle, color: "000000" })] }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              children: [
                new Paragraph({ children: [new TextRun({ text: compName, bold: true, size: szHeader, color: "000000" })], alignment: AlignmentType.RIGHT }),
                new Paragraph({ children: [new TextRun({ text: compAddr, size: szNormal, color: "000000" })], alignment: AlignmentType.RIGHT }),
                new Paragraph({ children: [new TextRun({ text: `เลขที่ผู้เสียภาษี ${compTax} (สำนักงานใหญ่)`, size: szNormal, color: "000000" })], alignment: AlignmentType.RIGHT }),
              ],
              verticalAlign: VerticalAlign.CENTER,
            }),
          ]
        })
      ]
    });

    // Title Box Table
    const titleTable = new Table({
      borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" }, insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" }, insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" } },
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "" })], width: { size: 50, type: WidthType.PERCENTAGE } }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({
                          shading: { fill: "000000" },
                          verticalAlign: VerticalAlign.CENTER,
                          rowSpan: 2,
                          children: [
                            new Paragraph({ children: [new TextRun({ text: "Quotation", bold: true, size: 24, color: "FFFFFF" })], alignment: AlignmentType.CENTER }),
                            new Paragraph({ children: [new TextRun({ text: "ใบเสนอราคา", size: szNormal, color: "FFFFFF" })], alignment: AlignmentType.CENTER }),
                          ]
                        }),
                        new TableCell({
                          verticalAlign: VerticalAlign.CENTER,
                          children: [new Paragraph({ children: [new TextRun({ text: "ต้นฉบับ / Original", size: szTiny })], alignment: AlignmentType.CENTER })]
                        })
                      ]
                    }),
                    new TableRow({
                      children: [
                        new TableCell({
                          verticalAlign: VerticalAlign.CENTER,
                          children: [new Paragraph({ children: [new TextRun({ text: qt.id, bold: true, size: szHeader })], alignment: AlignmentType.CENTER })]
                        })
                      ]
                    })
                  ]
                })
              ]
            })
          ]
        })
      ]
    });

    // Vendor and Detail Table
    const vendorTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              rowSpan: 4,
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              children: [
                new Paragraph({ children: [new TextRun({ text: "ผู้ซื้อ : ", bold: true, size: szSmall }), new TextRun({ text: `${partner?.companyName || qt.customerName || 'Unknown'}`, size: szSmall })] }),
                new Paragraph({ children: [new TextRun({ text: "Customer", size: szTiny })] }),
                new Paragraph({ text: "" }),
                new Paragraph({ children: [new TextRun({ text: "เลขที่ผู้เสียภาษี : ", bold: true, size: szSmall }), new TextRun({ text: `${partner?.taxId || qt.customerTaxId || '-'} (สำนักงานใหญ่)`, size: szSmall })] }),
                new Paragraph({ children: [new TextRun({ text: "Tax ID", size: szTiny })] }),
                new Paragraph({ text: "" }),
                new Paragraph({ children: [new TextRun({ text: "ที่อยู่ : ", bold: true, size: szSmall }), new TextRun({ text: `${partner?.address || qt.customerAddress || '-'}`, size: szSmall })] }),
                new Paragraph({ children: [new TextRun({ text: "Address", size: szTiny })] }),
                new Paragraph({ children: [new TextRun({ text: "เบอร์โทรศัพท์ : ", bold: true, size: szSmall }), new TextRun({ text: `${partner?.phone || qt.customerPhone || '-'}`, size: szSmall })] }),
                new Paragraph({ children: [new TextRun({ text: "Phone", size: szTiny })] }),
              ]
            }),
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              children: [
                new Paragraph({ children: [new TextRun({ text: "วันที่ : ", bold: true, size: szSmall }), new TextRun({ text: `${format(new Date(qt.date), 'dd/MM/yyyy')}`, size: szSmall })] }),
                new Paragraph({ children: [new TextRun({ text: "Issue Date", size: szTiny })] }),
              ]
            }),
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              rowSpan: 4,
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              children: [
                new Paragraph({ children: [new TextRun({ text: "ผู้จัดทำ : ", bold: true, size: szSmall }), new TextRun({ text: `${qt.createdBy}`, size: szSmall })] }),
                new Paragraph({ children: [new TextRun({ text: "Prepared By", size: szTiny })] }),
              ]
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              children: [
                new Paragraph({ children: [new TextRun({ text: "การชำระเงิน : ", bold: true, size: szSmall }), new TextRun({ text: `-`, size: szSmall })] }),
                new Paragraph({ children: [new TextRun({ text: "Credit Term", size: szTiny })] }),
              ]
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              children: [
                new Paragraph({ children: [new TextRun({ text: "ผู้ติดต่อ : ", bold: true, size: szSmall }), new TextRun({ text: `${partner?.contactPerson || '-'}`, size: szSmall })] }),
                new Paragraph({ children: [new TextRun({ text: "Contact Name", size: szTiny })] }),
              ]
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              children: [
                new Paragraph({ children: [new TextRun({ text: "ชื่อโปรเจ็ค : ", bold: true, size: szSmall }), new TextRun({ text: `-`, size: szSmall })] }),
                new Paragraph({ children: [new TextRun({ text: "Project Name", size: szTiny })] }),
              ]
            })
          ]
        })
      ]
    });

    // Items Table
    const itemRows = qt.items.map((item, idx) => {
      return new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: (idx + 1).toString(), size: szSmall })], alignment: AlignmentType.CENTER })], margins: { top: 100, bottom: 100 } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.productName, size: szSmall })] })], margins: { top: 100, bottom: 100, left: 100 } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.quantity.toString(), size: szSmall })], alignment: AlignmentType.CENTER })], margins: { top: 100, bottom: 100 } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 }), size: szSmall })], alignment: AlignmentType.RIGHT })], margins: { top: 100, bottom: 100, right: 100 } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "0.00", size: szSmall })], alignment: AlignmentType.RIGHT })], margins: { top: 100, bottom: 100, right: 100 } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.total.toLocaleString(undefined, { minimumFractionDigits: 2 }), size: szSmall })], alignment: AlignmentType.RIGHT })], margins: { top: 100, bottom: 100, right: 100 } }),
        ]
      });
    });

    for (let i = qt.items.length; i < 5; i++) {
      itemRows.push(new TableRow({
        children: Array(6).fill(0).map(() => new TableCell({ children: [new Paragraph({ text: "" })], margins: { top: 200, bottom: 200 } }))
      }));
    }

    const itemsTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            new TableCell({ shading: { fill: "000000" }, margins: { top: 100, bottom: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "เลขที่", bold: true, color: "FFFFFF", size: szSmall })], alignment: AlignmentType.CENTER }), new Paragraph({ children: [new TextRun({ text: "No.", color: "FFFFFF", size: szTiny })], alignment: AlignmentType.CENTER })] }),
            new TableCell({ shading: { fill: "000000" }, margins: { top: 100, bottom: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "รายการ", bold: true, color: "FFFFFF", size: szSmall })], alignment: AlignmentType.CENTER }), new Paragraph({ children: [new TextRun({ text: "Description", color: "FFFFFF", size: szTiny })], alignment: AlignmentType.CENTER })] }),
            new TableCell({ shading: { fill: "000000" }, margins: { top: 100, bottom: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "จำนวน", bold: true, color: "FFFFFF", size: szSmall })], alignment: AlignmentType.CENTER }), new Paragraph({ children: [new TextRun({ text: "Quantity", color: "FFFFFF", size: szTiny })], alignment: AlignmentType.CENTER })] }),
            new TableCell({ shading: { fill: "000000" }, margins: { top: 100, bottom: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "ราคา/หน่วย", bold: true, color: "FFFFFF", size: szSmall })], alignment: AlignmentType.CENTER }), new Paragraph({ children: [new TextRun({ text: "Unit Price", color: "FFFFFF", size: szTiny })], alignment: AlignmentType.CENTER })] }),
            new TableCell({ shading: { fill: "000000" }, margins: { top: 100, bottom: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "ส่วนลด", bold: true, color: "FFFFFF", size: szSmall })], alignment: AlignmentType.CENTER }), new Paragraph({ children: [new TextRun({ text: "Discount", color: "FFFFFF", size: szTiny })], alignment: AlignmentType.CENTER })] }),
            new TableCell({ shading: { fill: "000000" }, margins: { top: 100, bottom: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "จำนวนเงิน (THB)", bold: true, color: "FFFFFF", size: szSmall })], alignment: AlignmentType.CENTER }), new Paragraph({ children: [new TextRun({ text: "Amount", color: "FFFFFF", size: szTiny })], alignment: AlignmentType.CENTER })] }),
          ]
        }),
        ...itemRows
      ]
    });

    // Summary Section Table
    const summaryTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 70, type: WidthType.PERCENTAGE },
              margins: { top: 100, left: 100 },
              borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "จำนวนเงิน\t\t\t", bold: true, size: szSmall }),
                    new TextRun({ text: formatBahtText(qt.totalAmount), bold: true, size: szSmall })
                  ]
                }),
                new Paragraph({ children: [new TextRun({ text: "Amount", size: szTiny })] })
              ]
            }),
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } },
              children: [
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "รวมเป็นเงิน", bold: true, size: szSmall })] }), new Paragraph({ children: [new TextRun({ text: "Subtotal", size: 8 })] })], margins: { top: 50, bottom: 50, left: 50 } }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: qt.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }), size: szSmall })], alignment: AlignmentType.RIGHT })], margins: { top: 50, bottom: 50, right: 50 }, verticalAlign: VerticalAlign.CENTER }),
                      ]
                    }),
                    new TableRow({
                      children: [
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "หักส่วนลดพิเศษ", bold: true, size: szSmall })] }), new Paragraph({ children: [new TextRun({ text: "Special Discount", size: 8 })] })], margins: { top: 50, bottom: 50, left: 50 } }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "0.00", size: szSmall })], alignment: AlignmentType.RIGHT })], margins: { top: 50, bottom: 50, right: 50 }, verticalAlign: VerticalAlign.CENTER }),
                      ]
                    }),
                    new TableRow({
                      children: [
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "ยอดรวมหลังหักส่วนลด", bold: true, size: szSmall })] }), new Paragraph({ children: [new TextRun({ text: "After Discount", size: 8 })] })], margins: { top: 50, bottom: 50, left: 50 } }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: qt.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }), size: szSmall })], alignment: AlignmentType.RIGHT })], margins: { top: 50, bottom: 50, right: 50 }, verticalAlign: VerticalAlign.CENTER }),
                      ]
                    }),
                    new TableRow({
                      children: [
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "จำนวนภาษีมูลค่าเพิ่ม 7 %", bold: true, size: szSmall })] }), new Paragraph({ children: [new TextRun({ text: "Value Added Tax", size: 8 })] })], margins: { top: 50, bottom: 50, left: 50 } }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "0.00", size: szSmall })], alignment: AlignmentType.RIGHT })], margins: { top: 50, bottom: 50, right: 50 }, verticalAlign: VerticalAlign.CENTER }),
                      ]
                    }),
                    new TableRow({
                      children: [
                        new TableCell({ shading: { fill: "000000" }, children: [new Paragraph({ children: [new TextRun({ text: "จำนวนเงินรวมทั้งสิ้น", bold: true, color: "FFFFFF", size: szSmall })] }), new Paragraph({ children: [new TextRun({ text: "Total", color: "FFFFFF", size: 8 })] })], margins: { top: 50, bottom: 50, left: 50 } }),
                        new TableCell({ shading: { fill: "000000" }, children: [new Paragraph({ children: [new TextRun({ text: qt.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }), bold: true, color: "FFFFFF", size: szSmall })], alignment: AlignmentType.RIGHT })], margins: { top: 50, bottom: 50, right: 50 }, verticalAlign: VerticalAlign.CENTER }),
                      ]
                    })
                  ]
                })
              ]
            })
          ]
        })
      ]
    });

    // Signatures Table
    const signatureTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 33, type: WidthType.PERCENTAGE },
              margins: { top: 800, bottom: 100, left: 200, right: 200 },
              children: [
                new Paragraph({ text: "........................................................", alignment: AlignmentType.CENTER }),
                new Paragraph({ children: [new TextRun({ text: "ผู้ตรวจสอบ / Approver", bold: true, size: szTiny })], alignment: AlignmentType.CENTER }),
                new Paragraph({ text: "วันที่ / Date ........................................", alignment: AlignmentType.CENTER, spacing: { before: 200 } }),
              ]
            }),
            new TableCell({
              width: { size: 34, type: WidthType.PERCENTAGE },
              margins: { top: 200, bottom: 200 },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({ children: [new TextRun({ text: compName, bold: true, size: szHeader, color: "CCCCCC" })], alignment: AlignmentType.CENTER })
              ]
            }),
            new TableCell({
              width: { size: 33, type: WidthType.PERCENTAGE },
              margins: { top: 800, bottom: 100, left: 200, right: 200 },
              children: [
                new Paragraph({ text: "........................................................", alignment: AlignmentType.CENTER }),
                new Paragraph({ children: [new TextRun({ text: "ผู้มีอำนาจลงนาม / Authorized Signature", bold: true, size: szTiny })], alignment: AlignmentType.CENTER }),
                new Paragraph({ text: `วันที่ / Date ....${format(new Date(), 'dd/MM/yyyy')}....`, alignment: AlignmentType.CENTER, spacing: { before: 200 } }),
              ]
            }),
          ]
        })
      ]
    });

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 700, right: 700, bottom: 700, left: 700 }
          }
        },
        children: [
          headerTable,
          new Paragraph({ text: "", spacing: { before: 100 } }),
          titleTable,
          new Paragraph({ text: "", spacing: { before: 100 } }),
          vendorTable,
          new Paragraph({ text: "", spacing: { before: 100 } }),
          itemsTable,
          new Paragraph({ text: "", spacing: { before: 100 } }),
          summaryTable,
          new Paragraph({ text: "", spacing: { before: 100 } }),
          signatureTable,
          new Paragraph({
            spacing: { before: 300 },
            shading: { fill: "000000" },
            children: [
              new TextRun({ text: compName, bold: true, color: "FFFFFF", size: szTiny }),
            ],
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({
            shading: { fill: "000000" },
            children: [
              new TextRun({ text: compAddr, color: "FFFFFF", size: 8 }),
            ],
            alignment: AlignmentType.CENTER
          })
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QT_${qt.id}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      <div className="lg:col-span-12">
        <div className="flex flex-col gap-[4px] min-h-[600px]">
          <div className="bg-white rounded-t-[40px] rounded-b-xl border border-gray-100 shadow-sm p-8 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><FileText size={20} /></div>
                <div>
                  <h3 className="text-xl font-black text-[#1A1F3D]">Quotations</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">จัดการใบเสนอราคาสินค้า</p>
                </div>
              </div>

              <div className="hidden lg:flex items-center gap-2 border-l border-gray-100 pl-6 ml-2">
                <div className="flex items-center gap-2 bg-[#EAFD69]/20 px-3 py-1.5 rounded-xl border border-[#EAFD69]/30">
                  <span className="text-[10px] font-bold text-[#1A1F3D] uppercase tracking-wider">Total</span>
                  <span className="text-sm font-black text-[#1A1F3D]">{totalQTs}</span>
                </div>
                <div className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100/50">
                  <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Pending</span>
                  <span className="text-sm font-black text-orange-600">{pendingQTs}</span>
                </div>
                <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100/50">
                  <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Completed</span>
                  <span className="text-sm font-black text-green-600">{completedQTs}</span>
                </div>
                <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-xl border border-red-100/50">
                  <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Cancelled</span>
                  <span className="text-sm font-black text-red-600">{cancelledQTs}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="ค้นหาใบเสนอราคา..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-3 bg-[#F5F6FA] border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-100 transition-all w-[250px]"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-b-[40px] rounded-t-xl border border-gray-100 shadow-sm flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white border-b border-gray-100">
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">Quotation Number / Date</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">Customer</th>
                    <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">Items</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">Total Amount</th>
                    <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">Status</th>
                    <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <AnimatePresence>
                    {filteredQTs.map(qt => (
                      <motion.tr
                        key={qt.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-gray-50/50"
                      >
                        <td className="px-8 py-6">
                          <p className="text-sm font-black text-[#1A1F3D]">{qt.id}</p>
                          <p className="text-[10px] text-gray-400 font-bold">{format(new Date(qt.date), 'dd MMM yyyy HH:mm')}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-sm font-bold text-gray-700">
                            {qt.partnerId ? (partners.find(p => p.id === qt.partnerId)?.companyName || 'Unknown Vendor') : (qt.customerName || 'Unknown Customer')}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium">By: {qt.createdBy}</p>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className="inline-flex items-center justify-center bg-gray-100 text-gray-600 rounded-lg px-3 py-1 font-black text-xs">
                            {qt.items.length} รายการ
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right font-black text-[#1A1F3D]">
                          ฿{qt.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider",
                            getStatusColor(qt.status)
                          )}>
                            {getStatusIcon(qt.status)}
                            {qt.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-center">
                          {qt.status === 'Pending' && (
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <button
                                onClick={() => updateQuotationStatus(qt.id, 'Completed')}
                                className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                                title="Mark as Completed"
                              >
                                <CheckCircle size={16} />
                              </button>
                              <button
                                onClick={() => updateQuotationStatus(qt.id, 'Cancelled')}
                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                                title="Cancel Quotation"
                              >
                                <XCircle size={16} />
                              </button>
                            </div>
                          )}
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => setPreviewQT(qt)}
                              className="bg-[#1A1F3D] text-white px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1.5 hover:bg-gray-900 transition-colors shadow-sm"
                            >
                              <FileText size={12} /> Preview
                            </button>
                            {qt.status === 'Pending' && (
                              <button
                                onClick={() => {
                                  setEditingQTId(qt.id);
                                  setSelectedPartnerId(qt.partnerId);
                                  setQtItems(qt.items);
                                  handleViewChange('create');
                                }}
                                className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1.5 hover:bg-orange-100 transition-colors shadow-sm"
                              >
                                <Edit size={12} /> แก้ไข
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {filteredQTs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-20 text-center opacity-40">
                        <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                        <p className="font-black text-gray-500">ไม่พบข้อมูลใบเสนอราคา</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* PO Preview Modal */}
      {previewQT && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-[90vw] max-w-[800px] max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-black text-[#1A1F3D]">Preview Quotation</h2>

                <span className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider",
                  getStatusColor(previewQT.status)
                )}>
                  {getStatusIcon(previewQT.status)}
                  {previewQT.status}
                </span>

                {previewQT.status === 'Pending' && (
                  <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
                    <button
                      onClick={() => {
                        updateQuotationStatus(previewQT.id, 'Completed');
                        setPreviewQT({ ...previewQT, status: 'Completed' });
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-xs font-bold"
                      title="Mark as Completed"
                    >
                      <CheckCircle size={14} /> อนุมัติ (Approve)
                    </button>
                    <button
                      onClick={() => {
                        updateQuotationStatus(previewQT.id, 'Cancelled');
                        setPreviewQT({ ...previewQT, status: 'Cancelled' });
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs font-bold"
                      title="Cancel Quotation"
                    >
                      <XCircle size={14} /> ไม่อนุมัติ (Reject)
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setPreviewQT(null)}
                className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
              <style type="text/css" media="print">
                {`
                  body * { visibility: hidden; }
                  #printable-qt, #printable-qt * { visibility: visible; }
                  #printable-qt { position: absolute; left: 0; top: 0; width: 100%; background: white; margin: 0; padding: 20px; }
                  @page { size: A4; margin: 0; }
                `}
              </style>
              <div id="printable-qt" className="bg-white p-8 shadow-sm border border-gray-200 mx-auto max-w-[800px] text-[10px] font-sans text-black">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="text-2xl font-black tracking-tighter text-[#1A1F3D]">{companyName || shopName || "Company Name"}</div>
                  <div className="text-right text-[10px] text-gray-600 space-y-1">
                    <p className="font-bold">{companyName || shopName || "Company Name"}</p>
                    <p>{companyAddress || shopAddress || "111 อาคารเอไอเอ แคปปิตอล เซ็นเตอร์ แขวงดินแดง เขตดินแดง กรุงเทพฯ 10400"}</p>
                    <p>เลขที่ผู้เสียภาษี {companyTaxId || "0105555555555"} (สำนักงานใหญ่)</p>
                  </div>
                </div>

                {/* Title Box */}
                <div className="flex justify-end mb-4">
                  <div className="w-[300px] border border-black flex flex-col">
                    <div className="flex">
                      <div className="bg-black text-white flex-1 p-3 text-center flex flex-col justify-center">
                        <h1 className="text-2xl font-bold">Quotation</h1>
                        <p className="text-sm">ใบเสนอราคา</p>
                      </div>
                      <div className="w-[120px] flex flex-col border-l border-black bg-white">
                        <div className="text-center text-xs p-1 border-b border-black">ต้นฉบับ / Original</div>
                        <div className="text-center p-3 font-bold">{previewQT.id}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Boxes */}
                <div className="grid grid-cols-12 border border-black mb-4">
                  <div className="col-span-6 border-r border-black p-3 space-y-2">
                    <div className="flex"><span className="w-24 font-bold shrink-0">ผู้ซื้อ<br /><span className="text-[8px] font-normal">Customer</span></span> <span className="flex-1 break-words">{previewQT.partnerId ? (partners.find(p => p.id === previewQT.partnerId)?.companyName || 'Unknown Vendor') : (previewQT.customerName || 'Unknown Customer')}</span></div>
                    <div className="flex"><span className="w-24 font-bold shrink-0">เลขที่ผู้เสียภาษี<br /><span className="text-[8px] font-normal">Tax ID</span></span> <span className="flex-1 break-words">{previewQT.partnerId ? (partners.find(p => p.id === previewQT.partnerId)?.taxId || '-') : (previewQT.customerTaxId || '-')} {previewQT.partnerId || previewQT.customerTaxId ? '(สำนักงานใหญ่)' : ''}</span></div>
                    <div className="flex"><span className="w-24 font-bold shrink-0">ที่อยู่<br /><span className="text-[8px] font-normal">Address</span></span> <span className="flex-1 break-words">{previewQT.partnerId ? (partners.find(p => p.id === previewQT.partnerId)?.address || '-') : (previewQT.customerAddress || '-')}</span></div>
                    <div className="flex"><span className="w-24 font-bold shrink-0">เบอร์โทรศัพท์<br /><span className="text-[8px] font-normal">Phone</span></span> <span className="flex-1 break-words">{previewQT.partnerId ? (partners.find(p => p.id === previewQT.partnerId)?.phone || '-') : (previewQT.customerPhone || '-')}</span></div>
                  </div>
                  <div className="col-span-3 border-r border-black p-3 space-y-2">
                    <div className="flex"><span className="w-16 font-bold shrink-0">วันที่<br /><span className="text-[8px] font-normal">Issue Date</span></span> <span className="flex-1 break-words">{format(new Date(previewQT.date), 'dd/MM/yyyy')}</span></div>
                    <div className="flex"><span className="w-16 font-bold shrink-0">การชำระเงิน<br /><span className="text-[8px] font-normal">Credit Term</span></span> <span className="flex-1 break-words">-</span></div>
                    <div className="flex"><span className="w-16 font-bold shrink-0">ผู้ติดต่อ<br /><span className="text-[8px] font-normal">Contact Name</span></span> <span className="flex-1 break-words">-</span></div>
                    <div className="flex"><span className="w-16 font-bold shrink-0">ชื่อโปรเจ็ค<br /><span className="text-[8px] font-normal">Project Name</span></span> <span className="flex-1 break-words">-</span></div>
                  </div>
                  <div className="col-span-3 p-3 space-y-2">
                    <div className="flex"><span className="w-16 font-bold shrink-0">ผู้จัดทำ<br /><span className="text-[8px] font-normal">Prepared By</span></span> <span className="flex-1 break-words">{previewQT.createdBy}</span></div>
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
                      <th className="border border-black p-2 font-normal">ส่วนลด<br />Discount</th>
                      <th className="border border-black p-2 font-normal">จำนวนเงิน (THB)<br />Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewQT.items.map((item, idx) => (
                      <tr key={idx} className="text-[10px]">
                        <td className="border-l border-r border-black p-2 text-center align-top">{idx + 1}</td>
                        <td className="border-l border-r border-black p-2 align-top">{item.productName}</td>
                        <td className="border-l border-r border-black p-2 text-center align-top">{item.quantity}</td>
                        <td className="border-l border-r border-black p-2 text-right align-top">{item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="border-l border-r border-black p-2 text-right align-top">0.00</td>
                        <td className="border-l border-r border-black p-2 text-right align-top">{item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                    {/* Fill empty rows */}
                    {Array.from({ length: Math.max(0, 5 - previewQT.items.length) }).map((_, i) => (
                      <tr key={`empty-${i}`}>
                        <td className="border-l border-r border-black p-2 text-center text-transparent">.</td>
                        <td className="border-l border-r border-black p-2 text-transparent">.</td>
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
                  <div className="flex-1 p-3 bg-[#F8F9FA] flex flex-col justify-end border-r border-black">
                    <div className="flex items-center gap-4">
                      <div className="font-bold text-xs">จำนวนเงิน<br /><span className="text-[10px] font-normal">Amount</span></div>
                      <div className="font-bold text-sm bg-gray-200 px-4 py-1 rounded-sm w-full text-center">{formatBahtText(previewQT.totalAmount)}</div>
                    </div>
                  </div>
                  <div className="w-[300px]">
                    <div className="flex border-b border-black">
                      <div className="flex-1 p-2 bg-[#F8F9FA] text-xs"><span className="font-bold">รวมเป็นเงิน</span><br /><span className="text-[10px]">Subtotal</span></div>
                      <div className="w-[120px] p-2 text-right border-l border-black font-bold">{previewQT.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div className="flex border-b border-black">
                      <div className="flex-1 p-2 bg-[#F8F9FA] text-xs"><span className="font-bold">หักส่วนลดพิเศษ</span><br /><span className="text-[10px]">Special Discount</span></div>
                      <div className="w-[120px] p-2 text-right border-l border-black font-bold">0.00</div>
                    </div>
                    <div className="flex border-b border-black">
                      <div className="flex-1 p-2 bg-[#F8F9FA] text-xs"><span className="font-bold">ยอดรวมหลังหักส่วนลด</span><br /><span className="text-[10px]">After Discount</span></div>
                      <div className="w-[120px] p-2 text-right border-l border-black font-bold">{previewQT.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div className="flex border-b border-black">
                      <div className="flex-1 p-2 bg-[#F8F9FA] text-xs"><span className="font-bold">จำนวนภาษีมูลค่าเพิ่ม 7 %</span><br /><span className="text-[10px]">Value Added Tax</span></div>
                      <div className="w-[120px] p-2 text-right border-l border-black font-bold">0.00</div>
                    </div>
                    <div className="flex bg-black text-white">
                      <div className="flex-1 p-2 text-xs"><span className="font-bold">จำนวนเงินรวมทั้งสิ้น</span><br /><span className="text-[10px]">Total</span></div>
                      <div className="w-[120px] p-2 text-right border-l border-white font-bold">{previewQT.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-3 gap-4 border border-black p-4 text-center text-xs">
                  <div className="flex flex-col justify-end pt-12 space-y-2">
                    <div className="border-b border-dashed border-gray-400 mx-8"></div>
                    <div><span className="font-bold">ผู้ตรวจสอบ / Approver</span></div>
                    <div>วันที่ / Date ........................................</div>
                  </div>
                  <div className="flex items-center justify-center pt-4">
                    <div className="border-4 border-gray-200 border-double text-gray-200 text-2xl font-black tracking-tighter px-4 py-2 opacity-50 rotate-[-5deg] uppercase">{companyName || shopName || "APPROVED"}</div>
                  </div>
                  <div className="flex flex-col justify-end pt-12 space-y-2">
                    <div className="border-b border-dashed border-gray-400 mx-8"></div>
                    <div><span className="font-bold">ผู้มีอำนาจลงนาม / Authorized Signature</span></div>
                    <div>วันที่ / Date ....{format(new Date(), 'dd/MM/yyyy')}....</div>
                  </div>
                </div>

                <div className="text-center text-[10px] text-gray-500 mt-4 bg-black text-white py-1">
                  {companyName || shopName || "Company Name"} {companyAddress || shopAddress || "111 อาคารเอไอเอ แคปปิตอล เซ็นเตอร์ แขวงดินแดง เขตดินแดง กรุงเทพฯ 10400"} โทร. |
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3">
              <button
                onClick={() => setPreviewQT(null)}
                className="px-8 py-3 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-50 transition-colors"
              >
                ปิด
              </button>
              <div className="relative group">
                <button
                  onClick={() => {
                    if (previewQT.status !== 'Pending') {
                      window.print();
                    }
                  }}
                  disabled={previewQT.status === 'Pending'}
                  className={`px-8 py-3 rounded-xl font-black text-sm shadow-xl flex items-center gap-2 transition-all
                    ${previewQT.status === 'Pending'
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-[#1A1F3D] text-white active:scale-95 hover:bg-gray-900'
                    }
                  `}
                >
                  <Printer size={18} /> Print
                </button>
                {previewQT.status === 'Pending' && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max max-w-xs px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                    ต้องรอสถานะ Completed ก่อนถึงจะพิมพ์ได้
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </div>

              <div className="relative group">
                <button
                  onClick={() => {
                    if (previewQT.status !== 'Pending') {
                      handleExportDocx(previewQT);
                      setPreviewQT(null);
                    }
                  }}
                  disabled={previewQT.status === 'Pending'}
                  className={`px-8 py-3 rounded-xl font-black text-sm shadow-xl flex items-center gap-2 transition-all
                    ${previewQT.status === 'Pending'
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-[#1A1F3D] text-white active:scale-95 hover:bg-gray-900'
                    }
                  `}
                >
                  <Download size={18} /> Export Word (.docx)
                </button>
                {previewQT.status === 'Pending' && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max max-w-xs px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                    ต้องรอสถานะ Completed ก่อนถึงจะดาวน์โหลดได้
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationSystem;
