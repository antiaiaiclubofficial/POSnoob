import React, { useState, useEffect } from 'react';
import { useStore, PurchaseRequest, PurchaseRequestItem, InventoryItem } from '@/store/useStore';
import { format } from 'date-fns';
import { Plus, Search, FileText, CheckCircle, XCircle, Clock, Trash2, Save, X, Download, Printer, Edit, Truck, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, VerticalAlign } from 'docx';
import { formatBahtText } from '@/lib/bahttext';

interface PRSystemProps {
  reorderItem?: InventoryItem | null;
  clearReorderItem?: () => void;
  initialView?: 'list' | 'create';
  onViewChange?: (view: 'list' | 'create') => void;
}

const PRSystem: React.FC<PRSystemProps> = ({ reorderItem, clearReorderItem, initialView = 'list', onViewChange }) => {
  const {
    purchaseRequests, partners, inventory, currentUser, addPurchaseRequest, updatePurchaseRequest, updatePurchaseRequestStatus,
    companyName, companyAddress, companyTaxId, companyPhone, companyEmail, shopName, shopAddress, shopPhone
  } = useStore();
  const [view, setView] = useState<'list' | 'create'>(initialView);

  React.useEffect(() => {
    if (!reorderItem) {
      setView(initialView);
    }
  }, [initialView, reorderItem]);

  const handleViewChange = (newView: 'list' | 'create') => {
    setView(newView);
    if (onViewChange) onViewChange(newView);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [previewPR, setPreviewPR] = useState<PurchaseRequest | null>(null);

  // Create PO State
  const [editingPRId, setEditingPRId] = useState<string | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [prItems, setPrItems] = useState<PurchaseRequestItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [qtyInput, setQtyInput] = useState('');
  const [priceInput, setPriceInput] = useState('');

  useEffect(() => {
    if (reorderItem) {
      handleViewChange('create');
      const qty = Math.max(reorderItem.minStock - reorderItem.stock, 1);
      setPrItems([{
        productId: reorderItem.id,
        productName: reorderItem.name,
        quantity: qty,
        unitPrice: reorderItem.costPrice || 0,
        total: qty * (reorderItem.costPrice || 0)
      }]);
      if (reorderItem.partnerId) {
        setSelectedPartnerId(reorderItem.partnerId);
      }
      if (clearReorderItem) clearReorderItem();
    }
  }, [reorderItem, clearReorderItem]);

  const totalPRs = purchaseRequests.length;
  const pendingPRs = purchaseRequests.filter(pr => pr.status === 'Pending').length;
  const approvedPRs = purchaseRequests.filter(pr => pr.status === 'Approved').length;
  const cancelledPRs = purchaseRequests.filter(pr => pr.status === 'Cancelled').length;

  const filteredPRs = purchaseRequests.filter(pr => {
    const matchesSearch = pr.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partners.find(p => p.id === pr.partnerId)?.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter ? pr.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-50 text-green-600';
      case 'Cancelled': return 'bg-red-50 text-red-600';
      default: return 'bg-orange-50 text-orange-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved': return <CheckCircle size={14} />;
      case 'Cancelled': return <XCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const handleAddItem = () => {
    if (!selectedProductId || !qtyInput || !priceInput) return;
    const product = inventory.find(i => i.id === selectedProductId);
    if (!product) return;

    const qty = parseInt(qtyInput);
    const price = parseFloat(priceInput);

    if (qty <= 0 || price < 0) return;

    const existingItem = prItems.find(i => i.productId === selectedProductId);
    if (existingItem) {
      setPrItems(prItems.map(i => i.productId === selectedProductId ? {
        ...i,
        quantity: i.quantity + qty,
        total: (i.quantity + qty) * i.unitPrice
      } : i));
    } else {
      setPrItems([...prItems, {
        productId: product.id,
        productName: product.name,
        quantity: qty,
        unitPrice: price,
        total: qty * price
      }]);
    }

    setSelectedProductId('');
    setQtyInput('');
    setPriceInput('');
  };

  const handleRemoveItem = (productId: string) => {
    setPrItems(prItems.filter(i => i.productId !== productId));
  };

  const handleSavePR = () => {
    if (!selectedPartnerId || prItems.length === 0) return;

    if (editingPRId) {
      updatePurchaseRequest(editingPRId, {
        partnerId: selectedPartnerId,
        items: prItems,
        totalAmount: prItems.reduce((sum, item) => sum + item.total, 0),
      });
    } else {
      addPurchaseRequest({
        date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX"),
        partnerId: selectedPartnerId,
        items: prItems,
        status: 'Pending',
        totalAmount: prItems.reduce((sum, item) => sum + item.total, 0),
        createdBy: currentUser?.name || 'Admin'
      });
    }

    handleViewChange('list');
    setSelectedPartnerId('');
    setPrItems([]);
    setEditingPRId(null);
  };

  if (view === 'create') {
    return (
      <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-black text-[#1A1F3D]">{editingPRId ? 'แก้ไขใบขอสั่งซื้อ' : 'สร้างใบขอสั่งซื้อใหม่ (New PR)'}</h2>
              <p className="text-gray-400 font-bold text-sm">ระบุคู่ค้าและรายการสินค้าที่ต้องการสั่งซื้อ</p>
            </div>
            <button onClick={() => {
              handleViewChange('list');
              setEditingPRId(null);
              setSelectedPartnerId('');
              setPrItems([]);
            }} className="p-3 bg-gray-50 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 px-1">ผู้จัดจำหน่าย (Vendor)</label>
                <select
                  className="w-full bg-[#F5F6FA] border-none rounded-xl px-4 py-3 text-sm font-bold"
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                >
                  <option value="">-- เลือกคู่ค้า --</option>
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>{p.companyName}</option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
                <h3 className="font-black text-[#1A1F3D]">เพิ่มรายการสินค้า</h3>

                <div className="space-y-3">
                  <select
                    className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                  >
                    <option value="">-- เลือกสินค้า --</option>
                    {inventory.map(i => (
                      <option key={i.id} value={i.id}>{i.name} (ในสต็อก: {i.stock})</option>
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
                    disabled={!selectedProductId || !qtyInput || !priceInput}
                    className="w-full bg-indigo-50 text-indigo-600 py-3 rounded-xl font-black text-sm hover:bg-indigo-100 transition-colors disabled:opacity-50"
                  >
                    เพิ่มเข้าใบขอสั่งซื้อ
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-gray-100 rounded-3xl p-6 h-full flex flex-col">
                <h3 className="font-black text-[#1A1F3D] mb-4">รายการที่สั่งซื้อ</h3>

                <div className="flex-1 overflow-y-auto">
                  {prItems.length === 0 ? (
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
                        {prItems.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-4 px-2 font-black text-sm">{item.productName}</td>
                            <td className="py-4 px-2 text-right font-bold text-sm">{item.quantity}</td>
                            <td className="py-4 px-2 text-right font-bold text-sm">฿{item.unitPrice.toLocaleString()}</td>
                            <td className="py-4 px-2 text-right font-black text-indigo-600">฿{item.total.toLocaleString()}</td>
                            <td className="py-4 px-2 text-center">
                              <button onClick={() => handleRemoveItem(item.productId)} className="text-red-400 hover:text-red-600 p-1">
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
                      ฿{prItems.reduce((s, i) => s + i.total, 0).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={handleSavePR}
                    disabled={!selectedPartnerId || prItems.length === 0}
                    className="bg-[#1A1F3D] text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-gray-900 transition-colors disabled:opacity-50"
                  >
                    <Save size={18} /> บันทึกใบขอสั่งซื้อ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleExportDocx = async (po: PurchaseRequest) => {
    const partner = partners.find(p => p.id === pr.partnerId);
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
                            new Paragraph({ children: [new TextRun({ text: "Purchase Requisition", bold: true, size: 24, color: "FFFFFF" })], alignment: AlignmentType.CENTER }),
                            new Paragraph({ children: [new TextRun({ text: "ใบขอสั่งซื้อ", size: szNormal, color: "FFFFFF" })], alignment: AlignmentType.CENTER }),
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
                          children: [new Paragraph({ children: [new TextRun({ text: pr.id, bold: true, size: szHeader })], alignment: AlignmentType.CENTER })]
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
                new Paragraph({ children: [new TextRun({ text: "ผู้ขาย : ", bold: true, size: szSmall }), new TextRun({ text: `${partner?.companyName || 'Unknown'}`, size: szSmall })] }),
                new Paragraph({ children: [new TextRun({ text: "Supplier", size: szTiny })] }),
                new Paragraph({ text: "" }),
                new Paragraph({ children: [new TextRun({ text: "เลขที่ผู้เสียภาษี : ", bold: true, size: szSmall }), new TextRun({ text: `${partner?.taxId || '-'} (สำนักงานใหญ่)`, size: szSmall })] }),
                new Paragraph({ children: [new TextRun({ text: "Tax ID", size: szTiny })] }),
                new Paragraph({ text: "" }),
                new Paragraph({ children: [new TextRun({ text: "ที่อยู่ : ", bold: true, size: szSmall }), new TextRun({ text: `${partner?.address || '-'}`, size: szSmall })] }),
                new Paragraph({ children: [new TextRun({ text: "Address", size: szTiny })] }),
              ]
            }),
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              children: [
                new Paragraph({ children: [new TextRun({ text: "วันที่ : ", bold: true, size: szSmall }), new TextRun({ text: `${format(new Date(pr.date), 'dd/MM/yyyy')}`, size: szSmall })] }),
                new Paragraph({ children: [new TextRun({ text: "Issue Date", size: szTiny })] }),
              ]
            }),
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              rowSpan: 4,
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              children: [
                new Paragraph({ children: [new TextRun({ text: "ผู้จัดทำ : ", bold: true, size: szSmall }), new TextRun({ text: `${pr.createdBy}`, size: szSmall })] }),
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
    const itemRows = pr.items.map((item, idx) => {
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

    for (let i = pr.items.length; i < 5; i++) {
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
                    new TextRun({ text: formatBahtText(pr.totalAmount), bold: true, size: szSmall })
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
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: pr.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }), size: szSmall })], alignment: AlignmentType.RIGHT })], margins: { top: 50, bottom: 50, right: 50 }, verticalAlign: VerticalAlign.CENTER }),
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
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: pr.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }), size: szSmall })], alignment: AlignmentType.RIGHT })], margins: { top: 50, bottom: 50, right: 50 }, verticalAlign: VerticalAlign.CENTER }),
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
                        new TableCell({ shading: { fill: "000000" }, children: [new Paragraph({ children: [new TextRun({ text: pr.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }), bold: true, color: "FFFFFF", size: szSmall })], alignment: AlignmentType.RIGHT })], margins: { top: 50, bottom: 50, right: 50 }, verticalAlign: VerticalAlign.CENTER }),
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
    a.download = `PR_${pr.id}.docx`;
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
                  <h3 className="text-xl font-black text-[#1A1F3D]">Purchase Requests</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">จัดการใบขอสั่งซื้อสินค้า</p>
                </div>
              </div>

              <div className="hidden lg:flex items-center gap-2 border-l border-gray-100 pl-6 ml-2">
                <button 
                  onClick={() => setStatusFilter(null)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${statusFilter === null ? 'bg-[#EAFD69]/40 border-[#EAFD69] ring-2 ring-[#EAFD69]/50 shadow-sm' : 'bg-[#EAFD69]/20 border-[#EAFD69]/30 hover:bg-[#EAFD69]/30'}`}
                >
                  <span className="text-[10px] font-bold text-[#1A1F3D] uppercase tracking-wider">Total</span>
                  <span className="text-sm font-black text-[#1A1F3D]">{totalPRs}</span>
                </button>
                <button 
                  onClick={() => setStatusFilter(statusFilter === 'Pending' ? null : 'Pending')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${statusFilter === 'Pending' ? 'bg-orange-100 border-orange-300 ring-2 ring-orange-200 shadow-sm' : 'bg-orange-50 border-orange-100/50 hover:bg-orange-100'}`}
                >
                  <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Pending</span>
                  <span className="text-sm font-black text-orange-600">{pendingPRs}</span>
                </button>
                <button 
                  onClick={() => setStatusFilter(statusFilter === 'Approved' ? null : 'Approved')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${statusFilter === 'Approved' ? 'bg-green-100 border-green-300 ring-2 ring-green-200 shadow-sm' : 'bg-green-50 border-green-100/50 hover:bg-green-100'}`}
                >
                  <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Approved</span>
                  <span className="text-sm font-black text-green-600">{approvedPRs}</span>
                </button>
                <button 
                  onClick={() => setStatusFilter(statusFilter === 'Cancelled' ? null : 'Cancelled')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${statusFilter === 'Cancelled' ? 'bg-red-100 border-red-300 ring-2 ring-red-200 shadow-sm' : 'bg-red-50 border-red-100/50 hover:bg-red-100'}`}
                >
                  <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Cancelled</span>
                  <span className="text-sm font-black text-red-600">{cancelledPRs}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="ค้นหาใบขอสั่งซื้อ..."
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
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">PR Number / Date</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-gray-400">Vendor</th>
                    <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">Items</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-gray-400">Total Amount</th>
                    <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">Status</th>
                    <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <AnimatePresence>
                    {filteredPRs.map(pr => (
                      <motion.tr
                        key={pr.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-gray-50/50"
                      >
                        <td className="px-8 py-6">
                          <p className="text-sm font-black text-[#1A1F3D]">{pr.id}</p>
                          <p className="text-[10px] text-gray-400 font-bold">{format(new Date(pr.date), 'dd MMM yyyy HH:mm')}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-sm font-bold text-gray-700">
                            {partners.find(p => p.id === pr.partnerId)?.companyName || 'Unknown Vendor'}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium">By: {pr.createdBy}</p>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className="inline-flex items-center justify-center bg-gray-100 text-gray-600 rounded-lg px-3 py-1 font-black text-xs">
                            {pr.items.length} รายการ
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right font-black text-[#1A1F3D]">
                          ฿{pr.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider",
                            getStatusColor(pr.status)
                          )}>
                            {getStatusIcon(pr.status)}
                            {pr.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            <button
                              onClick={() => setPreviewPR(pr)}
                              className="bg-[#1A1F3D] text-white px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1.5 hover:bg-gray-900 transition-colors shadow-sm"
                            >
                              <FileText size={14} /> Preview
                            </button>
                            {pr.status === 'Pending' && (
                              <button
                                onClick={() => {
                                  setEditingPRId(pr.id);
                                  setSelectedPartnerId(pr.partnerId);
                                  setPrItems(pr.items);
                                  handleViewChange('create');
                                }}
                                className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1.5 hover:bg-orange-100 transition-colors shadow-sm"
                              >
                                <Edit size={14} /> แก้ไข
                              </button>
                            )}
                            {pr.status === 'Pending' && (
                              <>
                                <button
                                  onClick={() => {
                                    const { approvePurchaseRequestToPO } = useStore.getState();
                                    approvePurchaseRequestToPO(pr.id);
                                  }}
                                  className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1.5 hover:bg-indigo-100 transition-colors shadow-sm"
                                >
                                  <Check size={14} /> อนุมัติ (PO)
                                </button>
                                <button
                                  onClick={() => updatePurchaseRequestStatus(pr.id, 'Cancelled')}
                                  className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1.5 hover:bg-red-100 transition-colors shadow-sm"
                                >
                                  <XCircle size={14} /> ยกเลิก
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {filteredPRs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-20 text-center opacity-40">
                        <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                        <p className="font-black text-gray-500">ไม่พบข้อมูลใบขอสั่งซื้อ</p>
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
      {previewPR && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-[90vw] max-w-[800px] max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-black text-[#1A1F3D]">Preview Purchase Requisition</h2>

                <span className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider",
                  getStatusColor(previewPR.status)
                )}>
                  {getStatusIcon(previewPR.status)}
                  {previewPR.status}
                </span>

                {previewPR.status === 'Pending' && (
                  <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
                    <button
                      onClick={() => {
                        updatePurchaseRequestStatus(previewPR.id, 'To Order');
                        setPreviewPR({ ...previewPR, status: 'To Order' });
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-xs font-bold"
                      title="Mark as To Order"
                    >
                      <Check size={14} /> รอสั่งซื้อ (To Order)
                    </button>
                    <button
                      onClick={() => {
                        updatePurchaseRequestStatus(previewPR.id, 'Cancelled');
                        setPreviewPR({ ...previewPR, status: 'Cancelled' });
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs font-bold"
                      title="Cancel PO"
                    >
                      <XCircle size={14} /> ไม่อนุมัติ (Reject)
                    </button>
                  </div>
                )}
                {previewPR.status === 'To Order' && (
                  <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
                    <button
                      onClick={() => {
                        updatePurchaseRequestStatus(previewPR.id, 'On Order');
                        setPreviewPR({ ...previewPR, status: 'On Order' });
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs font-bold"
                      title="Mark as On Order"
                    >
                      <Truck size={14} /> สั่งซื้อแล้ว (On Order)
                    </button>
                  </div>
                )}
                {previewPR.status === 'On Order' && (
                  <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
                    <button
                      onClick={() => {
                        updatePurchaseRequestStatus(previewPR.id, 'Completed');
                        setPreviewPR({ ...previewPR, status: 'Completed' });
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-xs font-bold"
                      title="Mark as Completed"
                    >
                      <CheckCircle size={14} /> ได้รับสินค้า (Completed)
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setPreviewPR(null)}
                className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
              <style type="text/css" media="print">
                {`
                  body * { visibility: hidden; }
                  #printable-po, #printable-po * { visibility: visible; }
                  #printable-po { position: absolute; left: 0; top: 0; width: 100%; background: white; margin: 0; padding: 20px; }
                  @page { size: A4; margin: 0; }
                `}
              </style>
              <div id="printable-po" className="bg-white p-8 shadow-sm border border-gray-200 mx-auto max-w-[800px] text-[10px] font-sans text-black">
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
                        <h1 className="text-2xl font-bold">Purchase Requisition</h1>
                        <p className="text-sm">ใบขอสั่งซื้อ</p>
                      </div>
                      <div className="w-[120px] flex flex-col border-l border-black bg-white">
                        <div className="text-center text-xs p-1 border-b border-black">ต้นฉบับ / Original</div>
                        <div className="text-center p-3 font-bold">{previewPR.id}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Boxes */}
                <div className="grid grid-cols-12 border border-black mb-4">
                  <div className="col-span-6 border-r border-black p-3 space-y-2">
                    <div className="flex"><span className="w-24 font-bold shrink-0">ผู้ขาย<br /><span className="text-[8px] font-normal">Supplier</span></span> <span className="flex-1 break-words">{partners.find(p => p.id === previewPR.partnerId)?.companyName || 'Unknown Vendor'}</span></div>
                    <div className="flex"><span className="w-24 font-bold shrink-0">เลขที่ผู้เสียภาษี<br /><span className="text-[8px] font-normal">Tax ID</span></span> <span className="flex-1 break-words">{partners.find(p => p.id === previewPR.partnerId)?.taxId || '-'} (สำนักงานใหญ่)</span></div>
                    <div className="flex"><span className="w-24 font-bold shrink-0">ที่อยู่<br /><span className="text-[8px] font-normal">Address</span></span> <span className="flex-1 break-words">{partners.find(p => p.id === previewPR.partnerId)?.address || '-'}</span></div>
                  </div>
                  <div className="col-span-3 border-r border-black p-3 space-y-2">
                    <div className="flex"><span className="w-16 font-bold shrink-0">วันที่<br /><span className="text-[8px] font-normal">Issue Date</span></span> <span className="flex-1 break-words">{format(new Date(previewPR.date), 'dd/MM/yyyy')}</span></div>
                    <div className="flex"><span className="w-16 font-bold shrink-0">การชำระเงิน<br /><span className="text-[8px] font-normal">Credit Term</span></span> <span className="flex-1 break-words">-</span></div>
                    <div className="flex"><span className="w-16 font-bold shrink-0">ผู้ติดต่อ<br /><span className="text-[8px] font-normal">Contact Name</span></span> <span className="flex-1 break-words">-</span></div>
                    <div className="flex"><span className="w-16 font-bold shrink-0">ชื่อโปรเจ็ค<br /><span className="text-[8px] font-normal">Project Name</span></span> <span className="flex-1 break-words">-</span></div>
                  </div>
                  <div className="col-span-3 p-3 space-y-2">
                    <div className="flex"><span className="w-16 font-bold shrink-0">ผู้จัดทำ<br /><span className="text-[8px] font-normal">Prepared By</span></span> <span className="flex-1 break-words">{previewPR.createdBy}</span></div>
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
                    {previewPR.items.map((item, idx) => (
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
                    {Array.from({ length: Math.max(0, 5 - previewPR.items.length) }).map((_, i) => (
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
                      <div className="font-bold text-sm bg-gray-200 px-4 py-1 rounded-sm w-full text-center">{formatBahtText(previewPR.totalAmount)}</div>
                    </div>
                  </div>
                  <div className="w-[300px]">
                    <div className="flex border-b border-black">
                      <div className="flex-1 p-2 bg-[#F8F9FA] text-xs"><span className="font-bold">รวมเป็นเงิน</span><br /><span className="text-[10px]">Subtotal</span></div>
                      <div className="w-[120px] p-2 text-right border-l border-black font-bold">{previewPR.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div className="flex border-b border-black">
                      <div className="flex-1 p-2 bg-[#F8F9FA] text-xs"><span className="font-bold">หักส่วนลดพิเศษ</span><br /><span className="text-[10px]">Special Discount</span></div>
                      <div className="w-[120px] p-2 text-right border-l border-black font-bold">0.00</div>
                    </div>
                    <div className="flex border-b border-black">
                      <div className="flex-1 p-2 bg-[#F8F9FA] text-xs"><span className="font-bold">ยอดรวมหลังหักส่วนลด</span><br /><span className="text-[10px]">After Discount</span></div>
                      <div className="w-[120px] p-2 text-right border-l border-black font-bold">{previewPR.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div className="flex border-b border-black">
                      <div className="flex-1 p-2 bg-[#F8F9FA] text-xs"><span className="font-bold">จำนวนภาษีมูลค่าเพิ่ม 7 %</span><br /><span className="text-[10px]">Value Added Tax</span></div>
                      <div className="w-[120px] p-2 text-right border-l border-black font-bold">0.00</div>
                    </div>
                    <div className="flex bg-black text-white">
                      <div className="flex-1 p-2 text-xs"><span className="font-bold">จำนวนเงินรวมทั้งสิ้น</span><br /><span className="text-[10px]">Total</span></div>
                      <div className="w-[120px] p-2 text-right border-l border-white font-bold">{previewPR.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
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
                onClick={() => setPreviewPR(null)}
                className="px-8 py-3 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-50 transition-colors"
              >
                ปิด
              </button>
              <div className="relative group">
                <button
                  onClick={() => {
                    if (previewPR.status !== 'Pending') {
                      window.print();
                    }
                  }}
                  disabled={previewPR.status === 'Pending'}
                  className={`px-8 py-3 rounded-xl font-black text-sm shadow-xl flex items-center gap-2 transition-all
                    ${previewPR.status === 'Pending'
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-[#1A1F3D] text-white active:scale-95 hover:bg-gray-900'
                    }
                  `}
                >
                  <Printer size={18} /> Print
                </button>
                {previewPR.status === 'Pending' && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max max-w-xs px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                    ต้องรอสถานะ Completed ก่อนถึงจะพิมพ์ได้
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </div>

              <div className="relative group">
                <button
                  onClick={() => {
                    if (previewPR.status !== 'Pending') {
                      handleExportDocx(previewPR);
                      setPreviewPR(null);
                    }
                  }}
                  disabled={previewPR.status === 'Pending'}
                  className={`px-8 py-3 rounded-xl font-black text-sm shadow-xl flex items-center gap-2 transition-all
                    ${previewPR.status === 'Pending'
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-[#1A1F3D] text-white active:scale-95 hover:bg-gray-900'
                    }
                  `}
                >
                  <Download size={18} /> Export Word (.docx)
                </button>
                {previewPR.status === 'Pending' && (
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

export default PRSystem;
