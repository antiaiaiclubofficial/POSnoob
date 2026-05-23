"use client";

/**
 * ดึงข้อมูลฟอนต์ภาษาไทย (Sarabun) จาก CDN และแปลงเป็น Base64 สำหรับใช้ใน jsPDF
 */
export const fetchThaiFontBase64 = async (): Promise<string> => {
  try {
    const response = await fetch('https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/sarabun/Sarabun-Regular.ttf');
    if (!response.ok) {
      throw new Error("Failed to fetch Thai font from CDN");
    }
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // แปลง ArrayBuffer เป็น Binary String อย่างปลอดภัย
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return window.btoa(binary);
  } catch (error) {
    console.error("Error loading Thai font, PDF might not display Thai characters correctly:", error);
    return "";
  }
};