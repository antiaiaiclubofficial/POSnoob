"use client";

/**
 * ดึงข้อมูลฟอนต์ภาษาไทย (Sarabun) จาก Google Fonts CDN ซึ่งรองรับ jsPDF 100%
 */
export const fetchThaiFontBase64 = async (): Promise<string> => {
  const urls = [
    'https://fonts.gstatic.com/s/sarabun/v12/DT80R2OfY09M_Yg_zD3m69v_9A.ttf', // Google Fonts Sarabun Regular (เสถียรที่สุดสำหรับ jsPDF)
    'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/sarabun/Sarabun-Regular.ttf' // Fallback
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