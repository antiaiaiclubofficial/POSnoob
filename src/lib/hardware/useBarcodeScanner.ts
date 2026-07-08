import { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';

export const useBarcodeScanner = (onScan: (barcode: string) => void) => {
  const { scannerType } = useStore();
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const [isSerialConnected, setIsSerialConnected] = useState(false);
  const serialPortRef = useRef<any>(null); // any for SerialPort
  const serialReaderRef = useRef<any>(null); // any for ReadableStreamDefaultReader

  // 1. Keyboard Emulation (HID) Listener
  useEffect(() => {
    if (scannerType !== 'hid') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field (except if we want global scan anywhere)
      // Usually, it's better to allow global scan, but avoid overriding input fields if they are actively typing.
      // However, scanners type very fast. We can detect speed.
      
      const currentTime = new Date().getTime();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      
      if (timeDiff > 50) {
        // If more than 50ms passed, it's likely human typing. Reset buffer.
        bufferRef.current = '';
      }

      if (e.key === 'Enter' && bufferRef.current.length > 3) {
        // Minimum 4 characters for a valid barcode (usually)
        e.preventDefault(); // Prevent form submission if any
        onScan(bufferRef.current);
        bufferRef.current = '';
      } else if (e.key.length === 1) { // Only printable characters
        bufferRef.current += e.key;
      }

      lastKeyTimeRef.current = currentTime;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [scannerType, onScan]);

  // 2. Web Serial API logic (for Serial scanners)
  const connectSerialScanner = useCallback(async () => {
    try {
      if (!('serial' in navigator)) {
        throw new Error('Web Serial API is not supported in this browser.');
      }
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });
      serialPortRef.current = port;
      setIsSerialConnected(true);
      
      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      serialReaderRef.current = reader;

      // Start reading loop
      readSerialData(reader, onScan);

      return true;
    } catch (err) {
      console.error('Failed to connect to Serial Scanner:', err);
      return false;
    }
  }, [onScan]);

  const disconnectSerialScanner = useCallback(async () => {
    if (serialReaderRef.current) {
      await serialReaderRef.current.cancel();
      serialReaderRef.current = null;
    }
    if (serialPortRef.current) {
      await serialPortRef.current.close();
      serialPortRef.current = null;
    }
    setIsSerialConnected(false);
  }, []);

  return {
    isSerialConnected,
    connectSerialScanner,
    disconnectSerialScanner
  };
};

// Helper for reading serial stream continuously
async function readSerialData(reader: any, onScan: (barcode: string) => void) {
  let buffer = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        buffer += value;
        // Scanners usually send \r or \n or both at the end
        if (buffer.includes('\r') || buffer.includes('\n')) {
          const barcode = buffer.replace(/[\r\n]/g, '').trim();
          if (barcode.length > 0) {
            onScan(barcode);
          }
          buffer = ''; // clear buffer
        }
      }
    }
  } catch (error) {
    console.error('Serial port read error:', error);
  } finally {
    reader.releaseLock();
  }
}
