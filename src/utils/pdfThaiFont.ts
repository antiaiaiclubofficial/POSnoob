"use client";

/**
 * ดึงข้อมูลฟอนต์ Prompt (Regular) ซึ่งรองรับทั้งภาษาไทยและภาษาอังกฤษสไตล์โมเดิร์น
 * จากแหล่งเก็บฟอนต์อย่างเป็นทางการของ Google Fonts
 */
export const fetchThaiFontBase64 = async (): Promise<string> => {
  const urls = [
    'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/prompt/Prompt-Regular.ttf', // Google Fonts GitHub CDN (Prompt Regular)
    'https://fonts.gstatic.com/s/prompt/v10/-9rQ5Qs6LT9Fp6502g.ttf' // Google Fonts Official Direct Link Fallback
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
      console.error(`Failed to fetch Prompt font from ${url}:`, error);
    }
  }
  return "";
};