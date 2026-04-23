"use client";

import { toast } from 'sonner';

export type MessageChannel = 'LINE' | 'SMS' | 'Both';

interface SendMessageProps {
  to: string;
  message: string;
  channel: MessageChannel;
}

export const sendNotification = async ({ to, message, channel }: SendMessageProps) => {
  // ในสถานการณ์จริง ส่วนนี้จะเรียกใช้ LINE Messaging API หรือ SMS Gateway Provider
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