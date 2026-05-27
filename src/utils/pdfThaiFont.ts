"use client";

/**
 * ดึงข้อมูลฟอนต์ภาษาไทย TH Niramit AS จากแหล่งเก็บฟอนต์มาตรฐานที่มีความเสถียรสูง
 */
export const fetchThaiFontBase64 = async (): Promise<string> => {
  const urls = [
    'https://cdn.jsdelivr.net/gh/thaifonts/thai-fonts@master/TH%20Niramit%20AS.ttf', // TH Niramit AS Primary
    'https://cdn.jsdelivr.net/gh/python-thai/thai-fonts/TH_Niramit_AS.ttf', // Fallback 1
    'https://cdn.jsdelivr.net/gh/ChampS/TH-Sarabun-New-TrueType-Font@master/THSarabunNew.ttf' // Fallback 2 (Sarabun)
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
      console.error(`Failed to fetch TH Niramit AS font from ${url}:`, error);
    }
  }
  return "";
};