"use client";

// พยัญชนะที่มีหางยาวขึ้นไปด้านบน (ป, ฝ, ฟ, ฬ)
const isAscender = (ch: string): boolean => ['ป', 'ฝ', 'ฟ', 'ฬ'].includes(ch);

// สระบน (ิ, ี, ึ, ื, ั, ็, ํ)
const isUpperVowel = (ch: string): boolean => ['\u0E31', '\u0E34', '\u0E35', '\u0E36', '\u0E37', '\u0E47', '\u0E4D'].includes(ch);

// วรรณยุกต์ (่, ้, ๊, ๋, ์)
const isToneMark = (ch: string): boolean => ['\u0E48', '\u0E49', '\u0E4A', '\u0E4B', '\u0E4C'].includes(ch);

// ตารางแปลงวรรณยุกต์ลอยสูงขึ้น (เมื่อมีสระบนรองอยู่ด้านล่าง เช่น "ทั้ง", "เงื่อน")
const TONE_SHIFT_UP: Record<string, string> = {
  '\u0E48': '\uF705', // ่ -> ไม้เอกลอยสูง
  '\u0E49': '\uF706', // ้ -> ไม้โทลอยสูง
  '\u0E4A': '\uF707', // ๊ -> ไม้ตรีลอยสูง
  '\u0E4B': '\uF708', // ๋ -> ไม้จัตวาลอยสูง
  '\u0E4C': '\uF709', // ์ -> การันต์ลอยสูง
};

// ตารางแปลงวรรณยุกต์หลบหางพยัญชนะ ป ฝ ฟ ฬ (เมื่อไม่มีสระบน)
const TONE_SHIFT_LEFT: Record<string, string> = {
  '\u0E48': '\uF70A', // ่ -> ไม้เอกหลบหาง
  '\u0E49': '\uF70B', // ้ -> ไม้โทหลบหาง
  '\u0E4A': '\uF70C', // ๊ -> ไม้ตรีหลบหาง
  '\u0E4B': '\uF70D', // ๋ -> ไม้จัตวาหลบหาง
  '\u0E4C': '\uF70E', // ์ -> การันต์หลบหาง
};

// ตารางแปลงสระบนหลบหางพยัญชนะ ป ฝ ฟ ฬ
const VOWEL_SHIFT_LEFT: Record<string, string> = {
  '\u0E31': '\uF716', // ั -> ไม้หันอากาศหลบหาง
  '\u0E34': '\uF710', // ิ -> สระอิหลบหาง
  '\u0E35': '\uF711', // ี -> สระอีหลบหาง
  '\u0E36': '\uF712', // ึ -> สระอึหลบหาง
  '\u0E37': '\uF713', // ื -> สระอือหลบหาง
  '\u0E47': '\uF714', // ็ -> ไม้ไต่คู้หลบหาง
  '\u0E4D': '\uF715', // ํ -> หยาดน้ำค้างหลบหาง
};

// ตารางแปลงวรรณยุกต์ลอยสูงขึ้น + หลบหางพยัญชนะ ป ฝ ฟ ฬ (เมื่อมีทั้งสระบนและพยัญชนะหางยาว)
const TONE_SHIFT_UP_LEFT: Record<string, string> = {
  '\u0E48': '\uF718', // ่ -> ไม้เอกลอยสูงหลบหาง
  '\u0E49': '\uF719', // ้ -> ไม้โทลอยสูงหลบหาง
  '\u0E4A': '\uF71A', // ๊ -> ไม้ตรีลอยสูงหลบหาง
  '\u0E4B': '\uF71B', // ๋ -> ไม้จัตวาลอยสูงหลบหาง
  '\u0E4C': '\uF71C', // ์ -> การันต์ลอยสูงหลบหาง
};

/**
 * จัดตำแหน่งวรรณยุกต์และสระภาษาไทย (Thai Glyph Shaping) สำหรับใช้ใน PDF
 * ป้องกันปัญหาวรรณยุกต์ลอย ซ้อนทับกัน หรือโดนตัดขาดได้อย่างสมบูรณ์แบบ
 */
export const shapeThai = (text: string, usePUA: boolean = true): string => {
  if (!text) return "";
  if (!usePUA) return text; // หากไม่ได้ใช้ฟอนต์ THSarabunNew ให้ส่งคืนข้อความปกติเพื่อป้องกันภาษาเพี้ยน
  
  const chars = Array.from(text);
  const result: string[] = [];

  for (let i = 0; i < chars.length; i++) {
    const curr = chars[i];
    const prev1 = i > 0 ? chars[i - 1] : "";
    const prev2 = i > 1 ? chars[i - 2] : "";

    if (isToneMark(curr)) {
      if (isUpperVowel(prev1)) {
        // มีสระบนรองอยู่ด้านล่าง
        if (isAscender(prev2)) {
          // พยัญชนะต้นเป็น ป ฝ ฟ ฬ -> ลอยสูง + หลบหาง
          result.push(TONE_SHIFT_UP_LEFT[curr] || curr);
        } else {
          // พยัญชนะต้นปกติ -> ลอยสูงขึ้นไปชั้น 3
          result.push(TONE_SHIFT_UP[curr] || curr);
        }
      } else if (isAscender(prev1)) {
        // ไม่มีสระบน แต่พยัญชนะต้นเป็น ป ฝ ฟ ฬ -> หลบหาง
        result.push(TONE_SHIFT_LEFT[curr] || curr);
      } else {
        result.push(curr);
      }
    } else if (isUpperVowel(curr)) {
      if (isAscender(prev1)) {
        // สระบนเจอกับพยัญชนะ ป ฝ ฟ ฬ -> หลบหาง
        result.push(VOWEL_SHIFT_LEFT[curr] || curr);
      } else {
        result.push(curr);
      }
    } else {
      result.push(curr);
    }
  }

  return result.join("");
};