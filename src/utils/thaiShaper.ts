"use client";

const isAscender = (ch: string): boolean => ['ป', 'ฝ', 'ฟ'].includes(ch);
const isUpperVowel = (ch: string): boolean => ['ั', 'ิ', 'ี', 'ึ', 'ื', '็', 'ํ', '์'].includes(ch);

const TONE_SHIFT_UP: Record<string, string> = {
  '\u0E48': '\uF705', // ่ (ไม้เอก ขยับขึ้นสูง)
  '\u0E49': '\uF706', // ้ (ไม้โท ขยับขึ้นสูง)
  '\u0E4A': '\uF707', // ๊ (ไม้ตรี ขยับขึ้นสูง)
  '\u0E4B': '\uF708', // ๋ (ไม้จัตวา ขยับขึ้นสูง)
  '\u0E4C': '\uF709', // ์ (การันต์ ขยับขึ้นสูง)
};

const TONE_SHIFT_DOWN: Record<string, string> = {
  '\u0E48': '\uF70A', // ่ (ไม้เอก หลบหาง ป ฝ ฟ)
  '\u0E49': '\uF70B', // ้ (ไม้โท หลบหาง ป ฝ ฟ)
  '\u0E4A': '\uF70C', // ๊ (ไม้ตรี หลบหาง ป ฝ ฟ)
  '\u0E4B': '\uF70D', // ๋ (ไม้จัตวา หลบหาง ป ฝ ฟ)
  '\u0E4C': '\uF70E', // ์ (การันต์ หลบหาง ป ฝ ฟ)
};

const TONE_SHIFT_UP_LEFT: Record<string, string> = {
  '\u0E48': '\uF718', // ่ (ไม้เอก ขยับขึ้นสูงและหลบซ้าย)
  '\u0E49': '\uF719', // ้ (ไม้โท ขยับขึ้นสูงและหลบซ้าย)
  '\u0E4A': '\uF71A', // ๊ (ไม้ตรี ขยับขึ้นสูงและหลบซ้าย)
  '\u0E4B': '\uF71B', // ๋ (ไม้จัตวา ขยับขึ้นสูงและหลบซ้าย)
  '\u0E4C': '\uF71C', // ์ (การันต์ ขยับขึ้นสูงและหลบซ้าย)
};

const VOWEL_SHIFT_DOWN: Record<string, string> = {
  '\u0E34': '\uF710', // ิ (สระอิ หลบหาง ป ฝ ฟ)
  '\u0E35': '\uF711', // ี (สระอี หลบหาง ป ฝ ฟ)
  '\u0E36': '\uF712', // ึ (สระอึ หลบหาง ป ฝ ฟ)
  '\u0E37': '\uF713', // ื (สระอือ หลบหาง ป ฝ ฟ)
  '\u0E47': '\uF714', // ็ (ไม้ไต่คู้ หลบหาง ป ฝ ฟ)
  '\u0E4D': '\uF715', // ํ (หยาดน้ำค้าง หลบหาง ป ฝ ฟ)
  '\u0E4C': '\uF717', // ์ (การันต์ หลบหาง ป ฝ ฟ แบบไม่มีสระรอง)
};

/**
 * จัดตำแหน่งวรรณยุกต์และสระภาษาไทย (Thai Glyph Shaping) สำหรับใช้ใน PDF
 * ป้องกันปัญหาวรรณยุกต์ลอย ซ้อนทับกัน หรือโดนตัดขาด
 */
export const shapeThai = (text: string): string => {
  if (!text) return "";
  const chars = Array.from(text);
  const result: string[] = [];

  for (let i = 0; i < chars.length; i++) {
    const curr = chars[i];
    const prev1 = i > 0 ? chars[i - 1] : "";
    const prev2 = i > 1 ? chars[i - 2] : "";

    if (TONE_SHIFT_UP[curr] !== undefined) {
      // กรณีเป็นวรรณยุกต์
      if (isUpperVowel(prev1)) {
        if (isAscender(prev2)) {
          result.push(TONE_SHIFT_UP_LEFT[curr]);
        } else {
          result.push(TONE_SHIFT_UP[curr]);
        }
      } else if (isAscender(prev1)) {
        result.push(TONE_SHIFT_DOWN[curr]);
      } else {
        result.push(curr);
      }
    } else if (VOWEL_SHIFT_DOWN[curr] !== undefined) {
      // กรณีเป็นสระบน
      if (isAscender(prev1)) {
        result.push(VOWEL_SHIFT_DOWN[curr]);
      } else {
        result.push(curr);
      }
    } else {
      result.push(curr);
    }
  }

  return result.join("");
};