"use client";

/**
 * ส่งคืนข้อความภาษาไทยปกติ (Unicode) เพื่อใช้งานร่วมกับฟอนต์ Sarabun มาตรฐานของ Google Fonts
 * ป้องกันปัญหาตัวอักษรต่างดาวหรือสี่เหลี่ยมว่างเปล่าได้อย่างสมบูรณ์แบบ
 */
export const shapeThai = (text: string, usePUA: boolean = true): string => {
  if (!text) return "";
  return text;
};