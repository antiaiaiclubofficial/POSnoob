import React from 'react';
import { PurchaseOrder, useStore } from '@/store/useStore';
import { format } from 'date-fns';
import { Check, CheckCircle, XCircle, X, Printer, Download, Clock, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatBahtText } from '@/lib/bahttext';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, VerticalAlign } from 'docx';
import { toast } from 'sonner';

interface POPreviewModalProps {
  previewPO: PurchaseOrder;
  onClose: () => void;
  onStatusChange?: (po: PurchaseOrder) => void;
}

export const POPreviewModal: React.FC<POPreviewModalProps> = ({ previewPO, onClose, onStatusChange }) => {
  const {
    partners, updatePurchaseOrderStatus,
    companyName, companyAddress, companyTaxId, shopName, shopAddress
  } = useStore();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-orange-100 text-orange-600';
      case 'To Order': return 'bg-purple-100 text-purple-600';
      case 'On Order': return 'bg-indigo-100 text-indigo-600';
      case 'Completed': return 'bg-green-100 text-green-600';
      case 'Cancelled': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <Clock size={12} />;
      case 'To Order': return <Truck size={12} />;
      case 'On Order': return <Truck size={12} />;
      case 'Completed': return <CheckCircle size={12} />;
      case 'Cancelled': return <XCircle size={12} />;
      default: return null;
    }
  };

  const handleExportDocx = async (po: PurchaseOrder) => {
    const partner = partners.find(p => p.id === po.partnerId);
    const dateNow = format(new Date(), 'dd/MM/yyyy HH:mm');
    const compName = companyName || shopName || "Company Name";
    const compAddr = companyAddress || shopAddress || "111 อาคารเอไอเอ แคปปิตอล เซ็นเตอร์ แขวงดินแดง เขตดินแดง กรุงเทพฯ 10400";
    const compTax = companyTaxId || "0105555555555";

    const szTitle = 36;
    const szHeader = 20;
    const szNormal = 16;
    const szSmall = 14;
    const szTiny = 12;

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
                  borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, left: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, right: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" }, insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" } },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({
                          shading: { fill: "000000" },
                          children: [
                            new Paragraph({ children: [new TextRun({ text: "Purchase Order", bold: true, size: 24, color: "FFFFFF" })], alignment: AlignmentType.CENTER }),
                            new Paragraph({ children: [new TextRun({ text: "ใบสั่งซื้อ", size: szSmall, color: "FFFFFF" })], alignment: AlignmentType.CENTER }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({ children: [new TextRun({ text: "ต้นฉบับ / Original", size: szTiny, color: "000000" })], alignment: AlignmentType.CENTER }),
                            new Paragraph({
                              children: [
                                new TextRun({ text: po.id, bold: true, size: szNormal, color: "000000" })
                              ], alignment: AlignmentType.CENTER,
                              spacing: { before: 100 }
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
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

    const infoTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, left: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, right: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" }, insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" } },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              children: [
                new Paragraph({ children: [new TextRun({ text: "ผู้ขาย Supplier: ", bold: true, size: szTiny }), new TextRun({ text: partner?.companyName || 'Unknown Vendor', size: szTiny })] }),
                new Paragraph({ children: [new TextRun({ text: "เลขที่ผู้เสียภาษี Tax ID: ", bold: true, size: szTiny }), new TextRun({ text: `${partner?.taxId || '-'} (สำนักงานใหญ่)`, size: szTiny })] }),
                new Paragraph({ children: [new TextRun({ text: "ที่อยู่ Address: ", bold: true, size: szTiny }), new TextRun({ text: partner?.address || '-', size: szTiny })] }),
              ]
            }),
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              children: [
                new Paragraph({ children: [new TextRun({ text: "วันที่ Issue Date: ", bold: true, size: szTiny }), new TextRun({ text: format(new Date(po.date), 'dd/MM/yyyy'), size: szTiny })] }),
                new Paragraph({ children: [new TextRun({ text: "การชำระเงิน Credit Term: ", bold: true, size: szTiny }), new TextRun({ text: "-", size: szTiny })] }),
                new Paragraph({ children: [new TextRun({ text: "ผู้ติดต่อ Contact Name: ", bold: true, size: szTiny }), new TextRun({ text: "-", size: szTiny })] }),
                new Paragraph({ children: [new TextRun({ text: "ชื่อโปรเจ็ค Project Name: ", bold: true, size: szTiny }), new TextRun({ text: "-", size: szTiny })] }),
              ]
            }),
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              children: [
                new Paragraph({ children: [new TextRun({ text: "ผู้จัดทำ Prepared By: ", bold: true, size: szTiny }), new TextRun({ text: po.createdBy, size: szTiny })] }),
              ]
            })
          ]
        })
      ]
    });

    const itemsRows = po.items.map((item, idx) => {
      return new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: (idx + 1).toString(), size: szTiny })], alignment: AlignmentType.CENTER })], margins: { top: 100, bottom: 100 } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.productName, size: szTiny })] })], margins: { top: 100, bottom: 100, left: 100 } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.quantity.toString(), size: szTiny })], alignment: AlignmentType.CENTER })], margins: { top: 100, bottom: 100 } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 }), size: szTiny })], alignment: AlignmentType.RIGHT })], margins: { top: 100, bottom: 100, right: 100 } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "0.00", size: szTiny })], alignment: AlignmentType.RIGHT })], margins: { top: 100, bottom: 100, right: 100 } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.total.toLocaleString(undefined, { minimumFractionDigits: 2 }), size: szTiny })], alignment: AlignmentType.RIGHT })], margins: { top: 100, bottom: 100, right: 100 } }),
        ]
      })
    });

    const emptyRowsCount = Math.max(0, 5 - po.items.length);
    for (let i = 0; i < emptyRowsCount; i++) {
      itemsRows.push(new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: " " })], margins: { top: 100, bottom: 100 } }),
          new TableCell({ children: [new Paragraph({ text: " " })], margins: { top: 100, bottom: 100 } }),
          new TableCell({ children: [new Paragraph({ text: " " })], margins: { top: 100, bottom: 100 } }),
          new TableCell({ children: [new Paragraph({ text: " " })], margins: { top: 100, bottom: 100 } }),
          new TableCell({ children: [new Paragraph({ text: " " })], margins: { top: 100, bottom: 100 } }),
          new TableCell({ children: [new Paragraph({ text: " " })], margins: { top: 100, bottom: 100 } }),
        ]
      }));
    }

    const itemsTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, left: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, right: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" }, insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" } },
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            new TableCell({ shading: { fill: "000000" }, children: [new Paragraph({ children: [new TextRun({ text: "เลขที่\nNo.", size: szTiny, color: "FFFFFF" })], alignment: AlignmentType.CENTER })], margins: { top: 100, bottom: 100 } }),
            new TableCell({ shading: { fill: "000000" }, children: [new Paragraph({ children: [new TextRun({ text: "รายการ\nDescription", size: szTiny, color: "FFFFFF" })] })], margins: { top: 100, bottom: 100, left: 100 } }),
            new TableCell({ shading: { fill: "000000" }, children: [new Paragraph({ children: [new TextRun({ text: "จำนวน\nQuantity", size: szTiny, color: "FFFFFF" })], alignment: AlignmentType.CENTER })], margins: { top: 100, bottom: 100 } }),
            new TableCell({ shading: { fill: "000000" }, children: [new Paragraph({ children: [new TextRun({ text: "ราคา/หน่วย\nUnit Price", size: szTiny, color: "FFFFFF" })], alignment: AlignmentType.CENTER })], margins: { top: 100, bottom: 100 } }),
            new TableCell({ shading: { fill: "000000" }, children: [new Paragraph({ children: [new TextRun({ text: "ส่วนลด\nDiscount", size: szTiny, color: "FFFFFF" })], alignment: AlignmentType.CENTER })], margins: { top: 100, bottom: 100 } }),
            new TableCell({ shading: { fill: "000000" }, children: [new Paragraph({ children: [new TextRun({ text: "จำนวนเงิน (THB)\nAmount", size: szTiny, color: "FFFFFF" })], alignment: AlignmentType.CENTER })], margins: { top: 100, bottom: 100 } }),
          ]
        }),
        ...itemsRows
      ]
    });

    const summaryTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, left: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, right: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" }, insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" } },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 70, type: WidthType.PERCENTAGE },
              shading: { fill: "F8F9FA" },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "จำนวนเงิน Amount: ", bold: true, size: szTiny }),
                    new TextRun({ text: `(${formatBahtText(po.totalAmount)})`, bold: true, size: szSmall })
                  ],
                  spacing: { before: 200 }
                })
              ],
              verticalAlign: VerticalAlign.BOTTOM,
              margins: { left: 100, right: 100, bottom: 100 }
            }),
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              children: [
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  borders: { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" }, insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" } },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({ shading: { fill: "F8F9FA" }, children: [new Paragraph({ children: [new TextRun({ text: "รวมเป็นเงิน Subtotal", bold: true, size: szTiny })] })], margins: { left: 100, right: 100, top: 50, bottom: 50 } }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: po.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }), bold: true, size: szTiny })], alignment: AlignmentType.RIGHT })], margins: { left: 100, right: 100, top: 50, bottom: 50 } })
                      ]
                    }),
                    new TableRow({
                      children: [
                        new TableCell({ shading: { fill: "F8F9FA" }, children: [new Paragraph({ children: [new TextRun({ text: "หักส่วนลดพิเศษ Special Discount", bold: true, size: szTiny })] })], margins: { left: 100, right: 100, top: 50, bottom: 50 } }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "0.00", bold: true, size: szTiny })], alignment: AlignmentType.RIGHT })], margins: { left: 100, right: 100, top: 50, bottom: 50 } })
                      ]
                    }),
                    new TableRow({
                      children: [
                        new TableCell({ shading: { fill: "F8F9FA" }, children: [new Paragraph({ children: [new TextRun({ text: "ยอดรวมหลังหักส่วนลด After Discount", bold: true, size: szTiny })] })], margins: { left: 100, right: 100, top: 50, bottom: 50 } }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: po.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }), bold: true, size: szTiny })], alignment: AlignmentType.RIGHT })], margins: { left: 100, right: 100, top: 50, bottom: 50 } })
                      ]
                    }),
                    new TableRow({
                      children: [
                        new TableCell({ shading: { fill: "F8F9FA" }, children: [new Paragraph({ children: [new TextRun({ text: "จำนวนภาษีมูลค่าเพิ่ม 7 % Value Added Tax", bold: true, size: szTiny })] })], margins: { left: 100, right: 100, top: 50, bottom: 50 } }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "0.00", bold: true, size: szTiny })], alignment: AlignmentType.RIGHT })], margins: { left: 100, right: 100, top: 50, bottom: 50 } })
                      ]
                    }),
                    new TableRow({
                      children: [
                        new TableCell({ shading: { fill: "000000" }, children: [new Paragraph({ children: [new TextRun({ text: "จำนวนเงินรวมทั้งสิ้น Total", bold: true, size: szTiny, color: "FFFFFF" })] })], margins: { left: 100, right: 100, top: 50, bottom: 50 } }),
                        new TableCell({ shading: { fill: "000000" }, children: [new Paragraph({ children: [new TextRun({ text: po.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }), bold: true, size: szTiny, color: "FFFFFF" })], alignment: AlignmentType.RIGHT })], margins: { left: 100, right: 100, top: 50, bottom: 50 } })
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

    const signatureTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, left: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, right: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" }, insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" } },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 33, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({ children: [new TextRun({ text: "___________________________", size: szTiny })], alignment: AlignmentType.CENTER, spacing: { before: 800 } }),
                new Paragraph({ children: [new TextRun({ text: "ผู้ตรวจสอบ / Approver", bold: true, size: szTiny })], alignment: AlignmentType.CENTER, spacing: { before: 100 } }),
                new Paragraph({ children: [new TextRun({ text: "วันที่ / Date ........................................", size: szTiny })], alignment: AlignmentType.CENTER, spacing: { before: 100 } }),
              ]
            }),
            new TableCell({
              width: { size: 34, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({ children: [new TextRun({ text: compName, bold: true, size: 28, color: "DDDDDD" })], alignment: AlignmentType.CENTER, spacing: { before: 400 } })
              ],
              verticalAlign: VerticalAlign.CENTER
            }),
            new TableCell({
              width: { size: 33, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({ children: [new TextRun({ text: "___________________________", size: szTiny })], alignment: AlignmentType.CENTER, spacing: { before: 800 } }),
                new Paragraph({ children: [new TextRun({ text: "ผู้มีอำนาจลงนาม / Authorized Signature", bold: true, size: szTiny })], alignment: AlignmentType.CENTER, spacing: { before: 100 } }),
                new Paragraph({ children: [new TextRun({ text: `วันที่ / Date ....${format(new Date(), 'dd/MM/yyyy')}....`, size: szTiny })], alignment: AlignmentType.CENTER, spacing: { before: 100 } }),
              ]
            })
          ]
        })
      ]
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          headerTable,
          new Paragraph({ text: "", spacing: { before: 100 } }),
          titleTable,
          new Paragraph({ text: "", spacing: { before: 100 } }),
          infoTable,
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
    a.download = `PO_${po.id}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ClockIcon = Clock as any;
  const TruckIcon = Truck as any;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] w-[90vw] max-w-[800px] max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black text-[#1A1F3D]">Preview Purchase Order</h2>

            <span className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider",
              getStatusColor(previewPO.status)
            )}>
              {getStatusIcon(previewPO.status)}
              {previewPO.status}
            </span>

            {previewPO.status === 'Pending' && (
              <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
                <button
                  onClick={() => {
                    updatePurchaseOrderStatus(previewPO.id, 'To Order');
                    if (onStatusChange) onStatusChange({ ...previewPO, status: 'To Order' });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-xs font-bold"
                  title="Approve PO"
                >
                  <Check size={14} /> อนุมัติ Approved
                </button>
                <button
                  onClick={() => {
                    updatePurchaseOrderStatus(previewPO.id, 'Cancelled');
                    if (onStatusChange) onStatusChange({ ...previewPO, status: 'Cancelled' });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs font-bold"
                  title="Cancel PO"
                >
                  <XCircle size={14} /> ไม่อนุมัติ (Reject)
                </button>
              </div>
            )}
            {(previewPO.status === 'To Order' || (previewPO.status as string) === 'On Order') && (
              <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
                <button
                  onClick={() => {
                    updatePurchaseOrderStatus(previewPO.id, 'Completed');
                    if (onStatusChange) onStatusChange({ ...previewPO, status: 'Completed' });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-xs font-bold"
                  title="Mark as Ordered"
                >
                  <CheckCircle size={14} /> สั่งสินค้าแล้ว
                </button>
                <button
                  onClick={() => {
                    updatePurchaseOrderStatus(previewPO.id, 'Cancelled');
                    if (onStatusChange) onStatusChange({ ...previewPO, status: 'Cancelled' });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs font-bold"
                  title="Cancel PO"
                >
                  <XCircle size={14} /> ยกเลิก
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
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
                    <h1 className="text-2xl font-bold">Purchase Order</h1>
                    <p className="text-sm">ใบสั่งซื้อ</p>
                  </div>
                  <div className="w-[120px] flex flex-col border-l border-black bg-white">
                    <div className="text-center text-xs p-1 border-b border-black">ต้นฉบับ / Original</div>
                    <div className="text-center p-3 font-bold">{previewPO.id}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Boxes */}
            <div className="grid grid-cols-12 border border-black mb-4">
              <div className="col-span-6 border-r border-black p-3 space-y-2">
                <div className="flex"><span className="w-24 font-bold shrink-0">ผู้ขาย<br /><span className="text-[8px] font-normal">Supplier</span></span> <span className="flex-1 break-words">{partners.find(p => p.id === previewPO.partnerId)?.companyName || 'Unknown Vendor'}</span></div>
                <div className="flex"><span className="w-24 font-bold shrink-0">เลขที่ผู้เสียภาษี<br /><span className="text-[8px] font-normal">Tax ID</span></span> <span className="flex-1 break-words">{partners.find(p => p.id === previewPO.partnerId)?.taxId || '-'} (สำนักงานใหญ่)</span></div>
                <div className="flex"><span className="w-24 font-bold shrink-0">ที่อยู่<br /><span className="text-[8px] font-normal">Address</span></span> <span className="flex-1 break-words">{partners.find(p => p.id === previewPO.partnerId)?.address || '-'}</span></div>
              </div>
              <div className="col-span-3 border-r border-black p-3 space-y-2">
                <div className="flex"><span className="w-16 font-bold shrink-0">วันที่<br /><span className="text-[8px] font-normal">Issue Date</span></span> <span className="flex-1 break-words">{format(new Date(previewPO.date), 'dd/MM/yyyy')}</span></div>
                <div className="flex"><span className="w-16 font-bold shrink-0">การชำระเงิน<br /><span className="text-[8px] font-normal">Credit Term</span></span> <span className="flex-1 break-words">-</span></div>
                <div className="flex"><span className="w-16 font-bold shrink-0">ผู้ติดต่อ<br /><span className="text-[8px] font-normal">Contact Name</span></span> <span className="flex-1 break-words">-</span></div>
                <div className="flex"><span className="w-16 font-bold shrink-0">ชื่อโปรเจ็ค<br /><span className="text-[8px] font-normal">Project Name</span></span> <span className="flex-1 break-words">-</span></div>
              </div>
              <div className="col-span-3 p-3 space-y-2">
                <div className="flex"><span className="w-16 font-bold shrink-0">ผู้จัดทำ<br /><span className="text-[8px] font-normal">Prepared By</span></span> <span className="flex-1 break-words">{previewPO.createdBy}</span></div>
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
                {previewPO.items.map((item, idx) => (
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
                {Array.from({ length: Math.max(0, 5 - previewPO.items.length) }).map((_, i) => (
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
                  <div className="font-bold text-sm bg-gray-200 px-4 py-1 rounded-sm w-full text-center">{formatBahtText(previewPO.totalAmount)}</div>
                </div>
              </div>
              <div className="w-[300px]">
                <div className="flex border-b border-black">
                  <div className="flex-1 p-2 bg-[#F8F9FA] text-xs"><span className="font-bold">รวมเป็นเงิน</span><br /><span className="text-[10px]">Subtotal</span></div>
                  <div className="w-[120px] p-2 text-right border-l border-black font-bold">{previewPO.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="flex border-b border-black">
                  <div className="flex-1 p-2 bg-[#F8F9FA] text-xs"><span className="font-bold">หักส่วนลดพิเศษ</span><br /><span className="text-[10px]">Special Discount</span></div>
                  <div className="w-[120px] p-2 text-right border-l border-black font-bold">0.00</div>
                </div>
                <div className="flex border-b border-black">
                  <div className="flex-1 p-2 bg-[#F8F9FA] text-xs"><span className="font-bold">ยอดรวมหลังหักส่วนลด</span><br /><span className="text-[10px]">After Discount</span></div>
                  <div className="w-[120px] p-2 text-right border-l border-black font-bold">{previewPO.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="flex border-b border-black">
                  <div className="flex-1 p-2 bg-[#F8F9FA] text-xs"><span className="font-bold">จำนวนภาษีมูลค่าเพิ่ม 7 %</span><br /><span className="text-[10px]">Value Added Tax</span></div>
                  <div className="w-[120px] p-2 text-right border-l border-black font-bold">0.00</div>
                </div>
                <div className="flex bg-black text-white">
                  <div className="flex-1 p-2 text-xs"><span className="font-bold">จำนวนเงินรวมทั้งสิ้น</span><br /><span className="text-[10px]">Total</span></div>
                  <div className="w-[120px] p-2 text-right border-l border-white font-bold">{previewPO.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
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
            onClick={onClose}
            className="px-8 py-3 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            ปิด
          </button>
          <div className="relative group">
            <button
              onClick={() => {
                if (previewPO.status !== 'Pending') {
                  window.print();
                }
              }}
              disabled={previewPO.status === 'Pending'}
              className={`px-8 py-3 rounded-xl font-black text-sm shadow-xl flex items-center gap-2 transition-all
                ${previewPO.status === 'Pending'
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-[#1A1F3D] text-white active:scale-95 hover:bg-gray-900'
                }
              `}
            >
              <Printer size={18} /> Print
            </button>
            {previewPO.status === 'Pending' && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max max-w-xs px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                ต้องรอสถานะ Completed ก่อนถึงจะพิมพ์ได้
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-gray-900"></div>
              </div>
            )}
          </div>

          <div className="relative group">
            <button
              onClick={() => {
                if (previewPO.status !== 'Pending') {
                  handleExportDocx(previewPO);
                }
              }}
              disabled={previewPO.status === 'Pending'}
              className={`px-8 py-3 rounded-xl font-black text-sm shadow-xl flex items-center gap-2 transition-all
                ${previewPO.status === 'Pending'
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-[#1A1F3D] text-white active:scale-95 hover:bg-gray-900'
                }
              `}
            >
              <Download size={18} /> Export Word (.docx)
            </button>
            {previewPO.status === 'Pending' && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max max-w-xs px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                ต้องรอสถานะ Completed ก่อนถึงจะดาวน์โหลดได้
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-gray-900"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
