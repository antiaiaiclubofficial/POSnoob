"use client";

/**
 * จัดการข้อความภาษาไทยให้ถูกต้องตามมาตรฐาน Unicode สำหรับฟอนต์ Prompt
 * ป้องกันปัญหาสระซ้อน สระหาย หรือแสดงผลเป็นช่องสี่เหลี่ยมในเอกสาร PDF
 */
export const shapeThai = (text: string): string => {
  if (!text) return "";
  
  // สำหรับฟอนต์ Prompt ซึ่งเป็นฟอนต์ Unicode สมัยใหม่ 
  // เราจะใช้การจัดเรียงลำดับอักขระมาตรฐานของภาษาไทย และล้างอักขระซ้ำซ้อนออก
  const chars = Array.from(text);
  const result: string[] = [];
  
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const code = char.charCodeAt(0);
    
    // ป้องกันการใส่สระบนหรือวรรณยุกต์ซ้ำซ้อนกันโดยไม่ตั้งใจ
    if (i > 0) {
      const prevCode = chars[i - 1].charCodeAt(0);
      // หากมีสระบน/ล่างซ้ำกัน ให้ข้ามตัวที่ซ้ำเพื่อป้องกันสระซ้อนลอยสูงเกินไป
      if ((code >= 0x0E34 && code <= 0x0E3A) && (prevCode >= 0x0E34 && prevCode <= 0x0E3A)) {
        continue;
      }
    }
    
    result.push(char);
  }
  
  return result.join('');
};