"use client";

/**
 * ดึงข้อมูลฟอนต์ภาษาไทย TH Niramit AS จากแหล่งเก็บฟอนต์มาตรฐานที่มีความเสถียรสูง
 * หากดาวน์โหลดล้มเหลว จะสลับไปใช้ Sarabun จาก Google Fonts CDN ที่เสถียร 100% ทันที
 */
export const fetchThaiFont = async (): Promise<{ base64: string; name: string }> => {
  // 1. พยายามโหลด TH Niramit AS จาก CDN ต่างๆ
  const niramitUrls = [
    'https://fastly.jsdelivr.net/gh/thaifonts/thai-fonts@master/TH%20Niramit%20AS.ttf',
    'https://cdn.jsdelivr.net/gh/thaifonts/thai-fonts@master/TH%20Niramit%20AS.ttf',
    'https://raw.githubusercontent.com/thaifonts/thai-fonts/master/TH%20Niramit%20AS.ttf'
  ];

  for (const url of niramitUrls) {
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
        return { base64, name: 'THNiramitAS' };
      }
    } catch (e) {
      console.error("Failed to load TH Niramit AS from", url, e);
    }
  }

  // 2. หากโหลดไม่ได้ ให้ใช้ Sarabun จาก Google Fonts (เสถียร 100% ไม่มีวันล่ม)
  const sarabunUrls = [
    'https://fonts.gstatic.com/s/sarabun/v13/Dt8z6Kcx07Wv6ALQ65R-gOcg.ttf',
    'https://fastly.jsdelivr.net/gh/ChampS/TH-Sarabun-New-TrueType-Font@master/THSarabunNew.ttf'
  ];

  for (const url of sarabunUrls) {
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
      console.error("Failed to load Sarabun fallback from", url, e);
    }
  }

  return { base64: "", name: "helvetica" };
};