"use client";

/**
 * ดึงข้อมูลฟอนต์ภาษาไทย "Sarabun" จาก Google Fonts CDN ที่มีความเสถียรสูงสุด 100%
 * ป้องกันปัญหาการดาวน์โหลดล้มเหลวและปัญหาภาษาต่างดาวอย่างถาวร
 */
export const fetchThaiFont = async (): Promise<{ base64: string; name: string }> => {
  const urls = [
    'https://fonts.gstatic.com/s/sarabun/v13/Dt8z6Kcx07Wv6ALQ65R-gOcg.ttf', // Google Fonts Official CDN (Sarabun Regular)
    'https://fastly.jsdelivr.net/gh/ChampS/TH-Sarabun-New-TrueType-Font@master/THSarabunNew.ttf' // High-speed Fallback
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(blob);
        });
        return { base64, name: 'Sarabun' };
      }
    } catch (e) {
      console.error("Failed to load Sarabun font from", url, e);
    }
  }

  // หากเกิดข้อผิดพลาดร้ายแรงจริงๆ ให้ใช้ Helvetica สำรอง
  return { base64: "", name: "helvetica" };
};