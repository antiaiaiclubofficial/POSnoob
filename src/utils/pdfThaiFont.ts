"use client";

/**
 * ดึงข้อมูลฟอนต์ภาษาไทยมาตรฐาน (TH Sarabun New) จาก CDN และแปลงเป็น Base64 สำหรับใช้ใน jsPDF
 * ฟอนต์นี้รองรับการแสดงผลสระและวรรณยุกต์ภาษาไทยใน PDF ได้สมบูรณ์ที่สุด
 */
export const fetchThaiFontBase64 = async (): Promise<string> => {
  const urls = [
    'https://cdn.jsdelivr.net/gh/Chun-Chun/TH-Sarabun-New/THSarabunNew.ttf', // TH Sarabun New (แนะนำสำหรับ PDF ภาษาไทย)
    'https://fonts.gstatic.com/s/sarabun/v12/DT80R2OfY09M_Yg_zD3m69v_9A.ttf' // Google Fonts Sarabun Fallback
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        
        // แปลง ArrayBuffer เป็น Binary String อย่างปลอดภัย
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        
        return window.btoa(binary);
      }
    } catch (error) {
      console.error(`Failed to fetch Thai font from ${url}:`, error);
    }
  }
  return "";
};