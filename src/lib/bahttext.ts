export function formatBahtText(number: number): string {
  if (number === 0) return "ศูนย์บาทถ้วน";

  const thaiNumbers = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
  const positions = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];

  let numberStr = number.toFixed(2);
  let [integerPart, decimalPart] = numberStr.split(".");

  let result = "";

  const convertPart = (str: string) => {
    let text = "";
    let len = str.length;
    for (let i = 0; i < len; i++) {
      let digit = parseInt(str[i]);
      let position = len - 1 - i;

      if (digit !== 0) {
        if (position === 0 && digit === 1 && len > 1 && str[len - 2] !== "0") {
          text += "เอ็ด";
        } else if (position === 1 && digit === 2) {
          text += "ยี่สิบ";
        } else if (position === 1 && digit === 1) {
          text += "สิบ";
        } else {
          text += thaiNumbers[digit] + positions[position];
        }
      }
    }
    return text;
  };

  if (parseInt(integerPart) > 0) {
    result += convertPart(integerPart) + "บาท";
  }

  if (parseInt(decimalPart) > 0) {
    result += convertPart(decimalPart) + "สตางค์";
  } else {
    result += "ถ้วน";
  }

  return result;
}
