"use client";

/**
 * แปลงพยัญชนะ สระ และวรรณยุกต์ภาษาไทยให้อยู่ในตำแหน่งที่ถูกต้อง (SIPA PUA Mapping)
 * เพื่อแก้ไขปัญหาสระลอย สระซ้อน และวรรณยุกต์ทับซ้อนกันในไฟล์ PDF
 */
export const shapeThai = (text: string, usePUA: boolean = true): string => {
  if (!text) return "";
  if (!usePUA) return text;

  const chars = Array.from(text);
  const result: string[] = [];

  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    const code = c.charCodeAt(0);

    // ตรวจสอบว่าเป็นสระหรือวรรณยุกต์ที่ต้องจัดตำแหน่งหรือไม่ (ช่วง 0x0E30 ถึง 0x0E4E)
    if (code >= 0x0E30 && code <= 0x0E4E) {
      const prev = i > 0 ? chars[i - 1] : "";
      const prevCode = prev ? prev.charCodeAt(0) : 0;
      const prevPrev = i > 1 ? chars[i - 2] : "";
      const prevPrevCode = prevPrev ? prevPrev.charCodeAt(0) : 0;

      // พยัญชนะที่มีหางยาวขึ้นด้านบน (ป, ฝ, ฟ, ฬ)
      const isAscender = prevCode === 0x0E1B || prevCode === 0x0E1D || prevCode === 0x0E1F || prevCode === 0x0E25;
      const isDoubleAscender = prevPrevCode === 0x0E1B || prevPrevCode === 0x0E1D || prevPrevCode === 0x0E1F || prevPrevCode === 0x0E25;

      // พยัญชนะที่มีหางลงด้านล่าง (ญ, ฐ)
      const isDescender = prevCode === 0x0E03 || prevCode === 0x0E10;

      // สระบนและเครื่องหมายบน: ั (0x0E31), ิ (0x0E34), ี (0x0E35), ึ (0x0E36), ื (0x0E37), ็ (0x0E47), ์ (0x0E4C), ํ (0x0E4D)
      const isUpperVowel = code === 0x0E34 || code === 0x0E35 || code === 0x0E36 || code === 0x0E37 || code === 0x0E31 || code === 0x0E47 || code === 0x0E4C || code === 0x0E4D;

      // วรรณยุกต์: ่ (0x0E48), ้ (0x0E49), ๊ (0x0E4A), ๋ (0x0E4B)
      const isToneMark = code >= 0x0E48 && code <= 0x0E4B;

      // สระล่าง: ุ (0x0E38), ู (0x0E39), ฺ (0x0E3A)
      const isLowerVowel = code === 0x0E38 || code === 0x0E39 || code === 0x0E3A;

      if (isUpperVowel) {
        if (isAscender) {
          // หลบหางพยัญชนะขึ้นบน (เลื่อนซ้าย)
          if (code === 0x0E31) result.push(String.fromCharCode(0xF710)); // ั
          else if (code === 0x0E34) result.push(String.fromCharCode(0xF701)); // ิ
          else if (code === 0x0E35) result.push(String.fromCharCode(0xF702)); // ี
          else if (code === 0x0E36) result.push(String.fromCharCode(0xF703)); // ึ
          else if (code === 0x0E37) result.push(String.fromCharCode(0xF704)); // ื
          else if (code === 0x0E47) result.push(String.fromCharCode(0xF713)); // ็
          else if (code === 0x0E4C) result.push(String.fromCharCode(0xF717)); // ์
          else result.push(c);
        } else {
          result.push(c);
        }
      } else if (isToneMark) {
        // ตรวจสอบว่ามีสระบนอยู่ก่อนหน้าวรรณยุกต์หรือไม่
        const hasUpperVowelBefore = prevCode === 0x0E31 || prevCode === 0x0E34 || prevCode === 0x0E35 || prevCode === 0x0E36 || prevCode === 0x0E37 || prevCode === 0x0E47 || prevCode === 0x0E4D;

        if (hasUpperVowelBefore) {
          if (isDoubleAscender) {
            // หลบหางพยัญชนะและยกสูงขึ้น
            if (code === 0x0E48) result.push(String.fromCharCode(0xF715)); // ่
            else if (code === 0x0E49) result.push(String.fromCharCode(0xF716)); // ้
            else if (code === 0x0E4A) result.push(String.fromCharCode(0xF717)); // ๊
            else if (code === 0x0E4B) result.push(String.fromCharCode(0xF718)); // ๋
            else result.push(c);
          } else {
            // ยกสูงขึ้นอย่างเดียวเพื่อไม่ให้ทับสระบน
            if (code === 0x0E48) result.push(String.fromCharCode(0xF711)); // ่
            else if (code === 0x0E49) result.push(String.fromCharCode(0xF712)); // ้
            else if (code === 0x0E4A) result.push(String.fromCharCode(0xF713)); // ๊
            else if (code === 0x0E4B) result.push(String.fromCharCode(0xF714)); // ๋
            else result.push(c);
          }
        } else {
          if (isAscender) {
            // หลบหางพยัญชนะ (เลื่อนซ้าย)
            if (code === 0x0E48) result.push(String.fromCharCode(0xF719)); // ่
            else if (code === 0x0E49) result.push(String.fromCharCode(0xF71A)); // ้
            else if (code === 0x0E4A) result.push(String.fromCharCode(0xF71B)); // ๊
            else if (code === 0x0E4B) result.push(String.fromCharCode(0xF71C)); // ๋
            else result.push(c);
          } else {
            // ไม่มีสระบนและไม่มีหางพยัญชนะขึ้นบน ให้ใช้ตัวอักษรมาตรฐานเพื่อความปลอดภัยและคมชัดสูงสุด
            result.push(c);
          }
        }
      } else if (isLowerVowel) {
        if (isDescender) {
          // หลบหางพยัญชนะลงล่าง (ญ, ฐ)
          if (code === 0x0E38) result.push(String.fromCharCode(0xF718)); // ุ
          else if (code === 0x0E39) result.push(String.fromCharCode(0xF719)); // ู
          else result.push(c);
        } else {
          result.push(c);
        }
      } else {
        result.push(c);
      }
    } else {
      result.push(c);
    }
  }

  return result.join("");
};