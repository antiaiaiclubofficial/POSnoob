import React from 'react';
import { GoodsReceipt, useStore } from '@/store/useStore';
import { format } from 'date-fns';
import { FileText, X, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatBahtText } from '@/lib/bahttext';

interface GRPreviewModalProps {
  previewGR: GoodsReceipt | null;
  onClose: () => void;
}

const GRPreviewModal: React.FC<GRPreviewModalProps> = ({ previewGR, onClose }) => {
  const { companyName, companyAddress, companyTaxId, partners, shopName, shopAddress } = useStore();

  if (!previewGR) return null;

  const displayCompanyName = companyName || shopName || "Company Name";
  const displayCompanyAddress = companyAddress || shopAddress || "111 อาคารเอไอเอ แคปปิตอล เซ็นเตอร์ แขวงดินแดง เขตดินแดง กรุงเทพฯ 10400";

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="bg-white rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        >
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#F9F9F9]">
            <div>
              <h3 className="text-2xl font-black text-[#1A1F3D] flex items-center gap-2">
                <FileText className="text-[#C5C3EA]" /> ใบรับสินค้า (Goods Receipt)
              </h3>
              <p className="text-gray-500 font-bold">{previewGR.id}</p>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl text-gray-400 transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
            <style type="text/css" media="print">
              {`
                body * { visibility: hidden; }
                #printable-gr, #printable-gr * { visibility: visible; }
                #printable-gr { position: absolute; left: 0; top: 0; width: 100%; background: white; margin: 0; padding: 20px; }
                @page { size: A4; margin: 0; }
              `}
            </style>
            <div id="printable-gr" className="bg-white p-8 shadow-sm border border-gray-200 mx-auto max-w-[800px] text-[10px] font-sans text-black">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="text-2xl font-black tracking-tighter text-[#1A1F3D]">{displayCompanyName}</div>
                <div className="text-right text-[10px] text-gray-600 space-y-1">
                  <p className="font-bold">{displayCompanyName}</p>
                  <p>{displayCompanyAddress}</p>
                  <p>เลขที่ผู้เสียภาษี {companyTaxId || "-"} {companyTaxId ? "(สำนักงานใหญ่)" : ""}</p>
                </div>
              </div>

              {/* Title Box */}
              <div className="flex justify-end mb-4">
                <div className="w-[300px] border border-black flex flex-col">
                  <div className="flex">
                    <div className="bg-black text-white flex-1 p-3 text-center flex flex-col justify-center">
                      <h1 className="text-2xl font-bold">Goods Receipt</h1>
                      <p className="text-sm">ใบรับสินค้า</p>
                    </div>
                    <div className="w-[120px] flex flex-col border-l border-black bg-white">
                      <div className="text-center text-xs p-1 border-b border-black">ต้นฉบับ / Original</div>
                      <div className="text-center p-3 font-bold">{previewGR.id}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Boxes */}
              <div className="grid grid-cols-12 border border-black mb-4">
                <div className="col-span-6 border-r border-black p-3 space-y-2">
                  <div className="flex"><span className="w-24 font-bold shrink-0">ผู้ขาย<br /><span className="text-[8px] font-normal">Supplier</span></span> <span className="flex-1 break-words">{partners.find(p => p.id === previewGR.partnerId)?.companyName || 'Unknown Vendor'}</span></div>
                  <div className="flex"><span className="w-24 font-bold shrink-0">เลขที่ผู้เสียภาษี<br /><span className="text-[8px] font-normal">Tax ID</span></span> <span className="flex-1 break-words">{partners.find(p => p.id === previewGR.partnerId)?.taxId || '-'} (สำนักงานใหญ่)</span></div>
                  <div className="flex"><span className="w-24 font-bold shrink-0">ที่อยู่<br /><span className="text-[8px] font-normal">Address</span></span> <span className="flex-1 break-words">{partners.find(p => p.id === previewGR.partnerId)?.address || '-'}</span></div>
                </div>
                <div className="col-span-3 border-r border-black p-3 space-y-2">
                  <div className="flex"><span className="w-16 font-bold shrink-0">วันที่<br /><span className="text-[8px] font-normal">Date</span></span> <span className="flex-1 break-words">{format(new Date(previewGR.date), 'dd/MM/yyyy')}</span></div>
                  <div className="flex"><span className="w-16 font-bold shrink-0">อ้างอิง PO<br /><span className="text-[8px] font-normal">Ref PO</span></span> <span className="flex-1 break-words">{previewGR.poId || '-'}</span></div>
                </div>
                <div className="col-span-3 p-3 space-y-2">
                  <div className="flex"><span className="w-16 font-bold shrink-0">ผู้รับ<br /><span className="text-[8px] font-normal">Receiver</span></span> <span className="flex-1 break-words">{previewGR.receiverName}</span></div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full border-collapse border border-black mb-4">
                <thead>
                  <tr className="bg-black text-white text-[10px]">
                    <th className="border border-black p-2 font-normal w-12">เลขที่<br />No.</th>
                    <th className="border border-black p-2 font-normal text-left">รายการ<br />Description</th>
                    <th className="border border-black p-2 font-normal w-16">ชั้นวาง<br />Shelf</th>
                    <th className="border border-black p-2 font-normal w-16">จำนวนสั่ง<br />Expected</th>
                    <th className="border border-black p-2 font-normal w-16">จำนวนรับ<br />Received</th>
                    <th className="border border-black p-2 font-normal w-24">ราคา/หน่วย<br />Unit Price</th>
                    <th className="border border-black p-2 font-normal w-24">จำนวนเงิน (THB)<br />Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {previewGR.items.map((item, idx) => (
                    <tr key={idx} className="text-[10px]">
                      <td className="border-l border-r border-black p-2 text-center align-top">{idx + 1}</td>
                      <td className="border-l border-r border-black p-2 align-top">{item.productName} {item.remarks && <span className="text-gray-500 block">หมายเหตุ: {item.remarks}</span>}</td>
                      <td className="border-l border-r border-black p-2 text-center align-top font-bold text-gray-500">{item.shelf || '-'}</td>
                      <td className="border-l border-r border-black p-2 text-center align-top text-gray-500">{item.quantityExpected}</td>
                      <td className="border-l border-r border-black p-2 text-center align-top font-bold">{item.quantityReceived}</td>
                      <td className="border-l border-r border-black p-2 text-right align-top">{item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="border-l border-r border-black p-2 text-right align-top">{item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                  {/* Fill empty rows */}
                  {Array.from({ length: Math.max(0, 5 - previewGR.items.length) }).map((_, i) => (
                    <tr key={`empty-${i}`}>
                      <td className="border-l border-r border-black p-2 text-center text-transparent">.</td>
                      <td className="border-l border-r border-black p-2 text-transparent">.</td>
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
                    <div className="font-bold text-sm bg-gray-200 px-4 py-1 rounded-sm w-full text-center">{formatBahtText(previewGR.totalAmount)}</div>
                  </div>
                </div>
                <div className="w-[300px]">
                  <div className="flex border-b border-black">
                    <div className="flex-1 p-2 bg-[#F8F9FA] text-xs"><span className="font-bold">รวมเป็นเงิน</span><br /><span className="text-[10px]">Subtotal</span></div>
                    <div className="w-[120px] p-2 text-right border-l border-black font-bold">{previewGR.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div className="flex border-b border-black">
                    <div className="flex-1 p-2 bg-[#F8F9FA] text-xs"><span className="font-bold">จำนวนภาษีมูลค่าเพิ่ม 7 %</span><br /><span className="text-[10px]">Value Added Tax</span></div>
                    <div className="w-[120px] p-2 text-right border-l border-black font-bold">0.00</div>
                  </div>
                  <div className="flex bg-black text-white">
                    <div className="flex-1 p-2 text-xs"><span className="font-bold">จำนวนเงินรวมทั้งสิ้น</span><br /><span className="text-[10px]">Total</span></div>
                    <div className="w-[120px] p-2 text-right border-l border-white font-bold">{previewGR.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 border border-black p-4 text-center text-xs">
                <div className="flex flex-col justify-end pt-12 space-y-2">
                  <div className="border-b border-dashed border-gray-400 mx-8"></div>
                  <div><span className="font-bold">ผู้ส่งมอบสินค้า / Delivered By</span></div>
                  <div>วันที่ / Date ........................................</div>
                </div>
                <div className="flex flex-col justify-end pt-12 space-y-2">
                  <div className="border-b border-dashed border-gray-400 mx-8"></div>
                  <div><span className="font-bold">ผู้รับสินค้า / Received By</span></div>
                  <div>วันที่ / Date ....{format(new Date(previewGR.date), 'dd/MM/yyyy')}....</div>
                </div>
              </div>

              <div className="text-center text-[10px] text-gray-500 mt-4 bg-black text-white py-1">
                {companyName || "Company Name"} {companyAddress || "111 อาคารเอไอเอ แคปปิตอล เซ็นเตอร์ แขวงดินแดง เขตดินแดง กรุงเทพฯ 10400"}
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <button onClick={() => window.print()} className="px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors">
               <Printer size={18} /> พิมพ์
            </button>
            <button onClick={onClose} className="px-6 py-3 bg-[#1A1F3D] text-white rounded-xl font-black">
              ปิด
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GRPreviewModal;
