"use client";

/**
 * ดึงข้อมูลฟอนต์ภาษาไทยจาก CDN และระบุว่าฟอนต์ที่โหลดได้รองรับตาราง PUA หรือไม่
 */
export const fetchThaiFontBase64 = async (): Promise<{ data: string; isPUA: boolean }> => {
  const urls = [
    { url: 'https://cdn.jsdelivr.net/gh/pruet/TH-Sarabun-New@master/fonts/THSarabunNew.ttf', isPUA: true }, // Official THSarabunNew with PUA support
    { url: 'https://fonts.gstatic.com/s/sarabun/v13/Dt8z6Kcx07Wv6ALQ65R-gOcg.ttf', isPUA: false }, // Google Fonts Sarabun (No PUA)
    { url: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/sarabun/Sarabun-Regular.ttf', isPUA: false } // Fallback
  ];

  for (const item of urls) {
    try {
      const response = await fetch(item.url);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
        
        const base64: string = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result as string;
            resolve(base64data.split(',')[1]);
          };
          reader.readAsDataURL(blob);
        });

        return { data: base64, isPUA: item.isPUA };
      }
    } catch (error) {
      console.error(`Failed to fetch Thai font from ${item.url}:`, error);
    }
  }
  return { data: "", isPUA: false };
};