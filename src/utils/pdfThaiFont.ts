"use client";

/**
 * ดึงข้อมูลฟอนต์ภาษาไทย (THSarabunNew) และแปลงเป็น Base64 อย่างปลอดภัยด้วย FileReader
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
        const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
        
        // ใช้ FileReader แปลงเป็น Base64 อย่างปลอดภัยและรวดเร็ว ป้องกันปัญหา Call Stack Exceeded
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result as string;
            resolve(base64data.split(',')[1]);
          };
          reader.readAsDataURL(blob);
        });
      }
    } catch (error) {
      console.error(`Failed to fetch Thai font from ${url}:`, error);
    }
  }
  return "";
};