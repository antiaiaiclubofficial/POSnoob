"use client";

import { toast } from 'sonner';

export type MessageChannel = 'LINE';

interface SendMessageProps {
  to: string;
  message: string;
  channel: MessageChannel;
}

export const sendNotification = async ({ to, message, channel }: SendMessageProps) => {
  // ในสถานการณ์จริง ส่วนนี้จะเรียกใช้ LINE Messaging API
  console.log(`[Messaging] Sending to ${to} via ${channel}: ${message}`);
  
  // จำลองการทำงานของ API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 800);
  });
};

export const formatAppointmentMessage = (petName: string, date: string, time: string) => {
  return `สวัสดีครับ/ค่ะ ยืนยันนัดหมายสำหรับ ${petName} ในวันที่ ${date} เวลา ${time} แล้วพบกันนะครับ/คะ`;
};

export const sendCreditUpdateFlex = async (customerName: string, prev: number, used: number, current: number) => {
  const flexData = {
    type: "flex",
    altText: "Wallet Balance Update",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "WALLET UPDATE", weight: "bold", color: "#1DB446", size: "sm" },
          { type: "text", text: `สวัสดีคุณ ${customerName}`, weight: "bold", size: "xxl", margin: "md" },
          { type: "separator", margin: "xxl" },
          { 
            type: "box", layout: "vertical", margin: "xxl", spacing: "sm",
            contents: [
              { type: "box", layout: "horizontal", contents: [{ type: "text", text: "ยอดก่อนหน้า", size: "sm", color: "#555555" }, { type: "text", text: `฿${prev.toLocaleString()}`, size: "sm", color: "#111111", align: "end" }] },
              { type: "box", layout: "horizontal", contents: [{ type: "text", text: "ใช้ไปวันนี้", size: "sm", color: "#555555" }, { type: "text", text: `-฿${Math.abs(used).toLocaleString()}`, size: "sm", color: "#FF3B30", align: "end", weight: "bold" }] },
              { type: "box", layout: "horizontal", contents: [{ type: "text", text: "คงเหลือปัจจุบัน", size: "md", color: "#555555", weight: "bold" }, { type: "text", text: `฿${current.toLocaleString()}`, size: "md", color: "#007AFF", align: "end", weight: "bold" }] }
            ]
          }
        ]
      }
    }
  };
  
  console.log("[LINE Flex Message Sent]", flexData);
  toast.success(`Flex Message sent to client via LINE`);
  return true;
};