"use client";

/**
 * จัดการตำแหน่งสระและวรรณยุกต์ภาษาไทย (Thai Shaping) สำหรับฟอนต์ TH Sarabun New
 * ป้องกันปัญหาสระลอย สระซ้อน และสระตกหล่นในเอกสาร PDF อย่างสมบูรณ์แบบ
 */
export const shapeThai = (text: string): string => {
  if (!text) return "";
  
  const chars = Array.from(text);
  const result: string[] = [];
  
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const code = char.charCodeAt(0);
    
    // ตรวจสอบวรรณยุกต์และเครื่องหมายด้านบน: ่, ้, ๊, ๋, ์, ํ, ็
    if (code >= 0x0E47 && code <= 0x0E4D) {
      const prevCode = i > 0 ? chars[i - 1].charCodeAt(0) : 0;
      const prevPrevCode = i > 1 ? chars[i - 2].charCodeAt(0) : 0;
      
      // ตรวจสอบว่ามีสระบนอยู่ก่อนหน้าหรือไม่: ิ, ี, ึ, ื, ั, ็
      const hasAboveVowel = (prevCode >= 0x0E34 && prevCode <= 0x0E37) || prevCode === 0x0E31 || prevCode === 0x0E47;
      
      // พยัญชนะต้น
      const baseConsonant = hasAboveVowel ? prevPrevCode : prevCode;
      const isTall = baseConsonant === 0x0E1B || baseConsonant === 0x0E1D || baseConsonant === 0x0E1F || baseConsonant === 0x0E2C; // ป, ฝ, ฟ, ฬ
      
      if (hasAboveVowel) {
        // วรรณยุกต์ซ้อนบนสระบนอีกที
        if (isTall) {
          // พยัญชนะหางยาว (ป, ฝ, ฟ, ฬ) + สระบน + วรรณยุกต์ -> หลบหางไปทางซ้าย
          if (code === 0x0E48) result.push(String.fromCharCode(0xF713));
          else if (code === 0x0E49) result.push(String.fromCharCode(0xF714));
          else if (code === 0x0E4A) result.push(String.fromCharCode(0xF715));
          else if (code === 0x0E4B) result.push(String.fromCharCode(0xF716));
          else if (code === 0x0E4C) result.push(String.fromCharCode(0xF717));
          else result.push(char);
        } else {
          result.push(char);
        }
      } else {
        // วรรณยุกต์อยู่บนพยัญชนะโดยตรง (ไม่มีสระบน) -> ดึงลงมาไม่ให้ลอยสูงเกินไป
        if (isTall) {
          // พยัญชนะหางยาว + วรรณยุกต์ -> หลบหางไปทางซ้ายและดึงลงมา
          if (code === 0x0E48) result.push(String.fromCharCode(0xF713));
          else if (code === 0x0E49) result.push(String.fromCharCode(0xF714));
          else if (code === 0x0E4A) result.push(String.fromCharCode(0xF715));
          else if (code === 0x0E4B) result.push(String.fromCharCode(0xF716));
          else if (code === 0x0E4C) result.push(String.fromCharCode(0xF717));
          else result.push(char);
        } else {
          // พยัญชนะปกติ + วรรณยุกต์ -> ดึงลงมาที่ระดับปกติ
          if (code === 0x0E48) result.push(String.fromCharCode(0xF70A));
          else if (code === 0x0E49) result.push(String.fromCharCode(0xF70B));
          else if (code === 0x0E4A) result.push(String.fromCharCode(0xF70C));
          else if (code === 0x0E4B) result.push(String.fromCharCode(0xF70D));
          else if (code === 0x0E4C) result.push(String.fromCharCode(0xF70E));
          else result.push(char);
        }
      }
    } 
    // ตรวจสอบสระบน: ิ, ี, ึ, ื, ั, ็, ํ
    else if ((code >= 0x0E34 && code <= 0x0E37) || code === 0x0E31 || code === 0x0E47 || code === 0x0E4D) {
      const prevCode = i > 0 ? chars[i - 1].charCodeAt(0) : 0;
      const isTall = prevCode === 0x0E1B || prevCode === 0x0E1D || prevCode === 0x0E1F || prevCode === 0x0E2C; // ป, ฝ, ฟ, ฬ
      
      if (isTall) {
        // พยัญชนะหางยาว + สระบน -> หลบหางไปทางซ้าย
        if (code === 0x0E31) result.push(String.fromCharCode(0xF710));
        else if (code === 0x0E34) result.push(String.fromCharCode(0xF701));
        else if (code === 0x0E35) result.push(String.fromCharCode(0xF702));
        else if (code === 0x0E36) result.push(String.fromCharCode(0xF703));
        else if (code === 0x0E37) result.push(String.fromCharCode(0xF704));
        else if (code === 0x0E47) result.push(String.fromCharCode(0xF712));
        else if (code === 0x0E4D) result.push(String.fromCharCode(0xF711));
        else result.push(char);
      } else {
        result.push(char);
      }
    }
    // ตรวจสอบสระล่าง: ุ, ู, ฺ
    else if (code === 0x0E38 || code === 0x0E39 || code === 0x0E3A) {
      const prevCode = i > 0 ? chars[i - 1].charCodeAt(0) : 0;
      const isDescender = prevCode === 0x0E03 || prevCode === 0x0E10; // ญ, ฐ
      const isBelowTall = prevCode === 0x0E0E || prevCode === 0x0E0F; // ฎ, ฏ
      
      if (isDescender) {
        // พยัญชนะมีหางล่าง (ญ, ฐ) + สระล่าง -> ตัดหางล่างออกและขยับสระขึ้นมาแทนที่
        if (code === 0x0E38) result.push(String.fromCharCode(0xF718));
        else if (code === 0x0E39) result.push(String.fromCharCode(0xF719));
        else if (code === 0x0E3A) result.push(String.fromCharCode(0xF71A));
        else result.push(char);
      } else if (isBelowTall) {
        // พยัญชนะหางล่างยาว (ฎ, ฏ) + สระล่าง -> หลบหางไปทางซ้าย
        if (code === 0x0E38) result.push(String.fromCharCode(0xF705));
        else if (code === 0x0E39) result.push(String.fromCharCode(0xF706));
        else result.push(char);
      } else {
        result.push(char);
      }
    }
    // ตรวจสอบพยัญชนะมีหางล่าง: ญ, ฐ
    else if (code === 0x0E03 || code === 0x0E10) {
      const nextCode = i < chars.length - 1 ? chars[i + 1].charCodeAt(0) : 0;
      const hasBelowVowel = nextCode === 0x0E38 || nextCode === 0x0E39 || nextCode === 0x0E3A;
      
      if (hasBelowVowel) {
        // ใช้พยัญชนะเวอร์ชันตัดหางล่างออก
        if (code === 0x0E03) result.push(String.fromCharCode(0xF70F));
        else if (code === 0x0E10) result.push(String.fromCharCode(0xF700));
      } else {
        result.push(char);
      }
    }
    else {
      result.push(char);
    }
  }
  
  return result.join('');
};