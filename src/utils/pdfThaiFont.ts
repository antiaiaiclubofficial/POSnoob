"use client";

/**
 * ดึงข้อมูลฟอนต์ภาษาไทย (THSarabunNew) ซึ่งมีตาราง PUA ครบถ้วนสมบูรณ์
 * รองรับการหลบวรรณยุกต์และสระซ้อนใน jsPDF ได้ 100%
 */
export const fetchThaiFontBase64 = async (): Promise<string> => {
  const urls = [
    'https://cdn.jsdelivr.net/gh/ChampS/TH-Sarabun-New-TrueType-Font@master/THSarabunNew.ttf', // THSarabunNew แท้ที่มี PUA Glyphs
    'https://cdn.jsdelivr.net/gh/fontuni/thai-font/THSarabunNew.ttf' // Fallback
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