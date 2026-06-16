"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Building2, FileText, Phone, Mail } from 'lucide-react';
import { InventoryItem, Partner } from '@/store/useStore';

interface InventoryReportLivePreviewProps {
  reportItems: InventoryItem[];
  selectedReportPartner: Partner | null;
  shopName: string;
  shopAddress: string;
  companyName?: string;
  companyAddress?: string;
  companyTaxId?: string;
  companyPhone?: string;
  companyEmail?: string;
  currency: string;
}

const InventoryReportLivePreview = ({
  reportItems,
  selectedReportPartner,
  shopName,
  shopAddress,
  companyName,
  companyAddress,
  companyTaxId,
  companyPhone,
  companyEmail,
  currency,
}: InventoryReportLivePreviewProps) => {
  const dateNow = format(new Date(), 'dd/MM/yyyy HH:mm');

  return (
    <div className="bg-white w-full rounded-[40px] shadow-xl border border-gray-100 font-sans text-[#1A1F3D] text-xs space-y-8 p-8 lg:p-10 overflow-y-auto max-h-[700px] scrollbar-hide">
      {/* Company Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-black text-[#1A1F3D]">{companyName || shopName}</h2>
        {companyTaxId && <p className="text-gray-500">เลขประจำตัวผู้เสียภาษี: {companyTaxId}</p>}
        {companyAddress && <p className="text-gray-500">ที่อยู่: {companyAddress}</p>}
        {(companyPhone || companyEmail) && (
          <p className="text-gray-500">
            {companyPhone && `โทร: ${companyPhone}`}
            {companyPhone && companyEmail && ` | `}
            {companyEmail && `อีเมล: ${companyEmail}`}
          </p>
        )}
      </div>

      {/* Document Title */}
      <div className="text-right space-y-1">
        <h1 className="text-2xl font-black text-[#1A1F3D] uppercase tracking-tight">Sales Report</h1>
        <p className="text-sm font-bold text-gray-400">เอกสารแจ้งยอดฝากขาย</p>
      </div>

      <div className="border-t border-gray-200 my-6" />

      {/* Partner Info */}
      <div className="space-y-1">
        <h3 className="text-sm font-black text-[#1A1F3D]">
          {selectedReportPartner ? `ข้อมูลคู่ค้า: ${selectedReportPartner.companyName}` : "คู่ค้า: คู่ค้าทั้งหมด"}
        </h3>
        {selectedReportPartner && (
          <div className="text-gray-500 space-y-0.5">
            {selectedReportPartner.taxId && <p>เลขประจำตัวผู้เสียภาษี: {selectedReportPartner.taxId}</p>}
            {selectedReportPartner.address && <p>ที่อยู่: {selectedReportPartner.address}</p>}
            {(selectedReportPartner.phone || selectedReportPartner.email) && (
              <p>
                {selectedReportPartner.phone && `โทร: ${selectedReportPartner.phone}`}
                {selectedReportPartner.phone && selectedReportPartner.email && ` | `}
                {selectedReportPartner.email && `อีเมล: ${selectedReportPartner.email}`}
              </p>
            )}
          </div>
        )}
        <p className="text-gray-400 text-[10px] font-bold uppercase pt-1">วันที่ออกเอกสาร: {dateNow}</p>
      </div>

      {/* Items Table */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#1A1F3D] text-white">
              <th className="px-4 py-3 font-black text-[10px] uppercase">ชื่อสินค้า</th>
              <th className="px-4 py-3 font-black text-[10px] uppercase text-center">SKU</th>
              <th className="px-4 py-3 font-black text-[10px] uppercase text-center">จำนวนที่ขาย</th>
              <th className="px-4 py-3 font-black text-[10px] uppercase text-right">ราคาสินค้า</th>
              <th className="px-4 py-3 font-black text-[10px] uppercase text-right">ราคาหลังหัก GP</th>
              <th className="px-4 py-3 font-black text-[10px] uppercase text-right">รวม</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reportItems.length > 0 ? (
              reportItems.map((item, idx) => {
                const gp = selectedReportPartner?.gpRate || 0;
                const priceAfterGP = item.price * (1 - gp / 100);
                const total = priceAfterGP * item.stock;

                return (
                  <tr key={item.id || idx} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-bold text-gray-800">{item.name}</td>
                    <td className="px-4 py-3 text-center text-gray-500">{item.barcode || '-'}</td>
                    <td className="px-4 py-3 text-center font-bold text-gray-600">{item.stock.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{currency}{item.price.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{currency}{priceAfterGP.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-black text-[#1A1F3D]">{currency}{total.toLocaleString()}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-400 font-bold">
                  ไม่มีรายการสินค้าที่ตรงตามเงื่อนไขตัวกรอง
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-12 pt-12">
        <div className="text-center space-y-8">
          <div className="border-b border-gray-300 w-48 mx-auto" />
          <p className="font-black text-gray-500">ผู้จัดทำ (Prepared By)</p>
        </div>
        <div className="text-center space-y-8">
          <div className="border-b border-gray-300 w-48 mx-auto" />
          <p className="font-black text-gray-500">ผู้อนุมัติ (Authorized By)</p>
        </div>
      </div>

      {/* Billing Conditions */}
      <div className="space-y-4 pt-8 border-t border-gray-100">
        <div className="space-y-1">
          <h4 className="font-black text-[#1A1F3D]">*เงื่อนไขการวางบิล :</h4>
          <p className="text-gray-500 leading-relaxed">
            ผู้ขายสามารถวางบิลได้ตั้งแต่วันที่ได้รับรายงานยอดขาย จนถึงภายในวันที่ 20 ของเดือน ในกรณีที่วางบิลไม่ตรงรอบหรือเอกสารไม่ครบ จะมีการดำเนินการชำระค่าสินค้าให้ในรอบถัดไป
          </p>
        </div>

        <div className="space-y-1">
          <h4 className="font-black text-[#1A1F3D]">วางบิลและส่งเอกสารมาที่ :</h4>
          <p className="font-bold text-gray-800">{companyName || shopName}</p>
          <p className="text-gray-500">ที่อยู่: {companyAddress || shopAddress}</p>
          {(companyPhone || companyEmail) && (
            <p className="text-gray-500">
              {companyPhone && `ติดต่อ: ${companyPhone}`}
              {companyPhone && companyEmail && ` | `}
              {companyEmail && `อีเมล: ${companyEmail}`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryReportLivePreview;