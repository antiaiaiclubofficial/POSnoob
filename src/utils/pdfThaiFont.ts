"use client";

/**
 * ดึงข้อมูลฟอนต์ภาษาไทย THSarabunNew จาก CDN ซึ่งรองรับตาราง PUA (Private Use Area)
 * เพื่อแก้ไขปัญหาสระลอย สระซ้อน และวรรณยุกต์ทับซ้อนกันในไฟล์ PDF ได้อย่างสมบูรณ์แบบ
 */
export const fetchThaiFontBase64 = async (): Promise<string> => {
  const urls = [
    'https://cdn.jsdelivr.net/gh/ChampS/TH-Sarabun-New-TrueType-Font@master/THSarabunNew.ttf', // THSarabunNew (Primary for PUA support)
    'https://fonts.gstatic.com/s/sarabun/v13/Dt8z6Kcx07Wv6ALQ65R-gOcg.ttf', // Google Fonts Official CDN (Sarabun Regular)
    'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/sarabun/Sarabun-Regular.ttf' // jsDelivr Fallback
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
        
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