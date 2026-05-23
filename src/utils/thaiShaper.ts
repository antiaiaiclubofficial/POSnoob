"use client";

/**
 * ส่งคืนข้อความภาษาไทยปกติ (Unicode) เพื่อให้ PDF Reader ใช้เอนจินการจัดตำแหน่งสระ/วรรณยุกต์อัตโนมัติ
 * ป้องกันปัญหาวรรณยุกต์หาย (เช่น ไม้เอกในคำว่า 'เงื่อน') เนื่องจากฟอนต์มาตรฐานไม่มีรหัส PUA
 */
export const shapeThai = (text: string): string => {
  if (!text) return "";
  return text;
};