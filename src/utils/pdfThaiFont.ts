"use client";

/**
 * ดึงข้อมูลฟอนต์ภาษาไทย Sarabun-Regular จาก Google Fonts CDN (gstatic)
 * ซึ่งมีความเสถียรสูงสุดและเปิด CORS 100% ป้องกันปัญหาโหลดฟอนต์ล้มเหลวใน Sandbox
 */
export const fetchThaiFontBase64 = async (): Promise<string> => {
  const urls = [
    'https://fonts.gstatic.com/s/sarabun/v13/Dt8z6Kcx07Wv6ALQ65R-gOcg.ttf', // Google Fonts Official CDN (Sarabun Regular)
    'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/sarabun/Sarabun-Regular.ttf', // jsDelivr Fallback
    'https://cdn.jsdelivr.net/gh/ChampS/TH-Sarabun-New-TrueType-Font@master/THSarabunNew.ttf' // THSarabunNew Fallback
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