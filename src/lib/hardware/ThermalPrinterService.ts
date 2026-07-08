export class ThermalPrinterService {
  private port: any = null; // SerialPort is not typed by default
  private writer: any = null; // WritableStreamDefaultWriter
  
  // ESC/POS Commands
  private readonly CMD_INIT = new Uint8Array([0x1b, 0x40]);
  private readonly CMD_ALIGN_LEFT = new Uint8Array([0x1b, 0x61, 0x00]);
  private readonly CMD_ALIGN_CENTER = new Uint8Array([0x1b, 0x61, 0x01]);
  private readonly CMD_ALIGN_RIGHT = new Uint8Array([0x1b, 0x61, 0x02]);
  private readonly CMD_CUT = new Uint8Array([0x1d, 0x56, 0x41, 0x10]);
  private readonly CMD_NEWLINE = new Uint8Array([0x0a]);

  constructor() {}

  async connect(): Promise<boolean> {
    try {
      if (!('serial' in navigator)) {
        throw new Error('Web Serial API is not supported in this browser.');
      }

      // Request a port and open a connection.
      this.port = await (navigator as any).serial.requestPort();
      await this.port.open({ baudRate: 9600 }); // Default baud rate for many serial printers

      this.writer = this.port.writable.getWriter();
      return true;
    } catch (err) {
      console.error('Failed to connect to printer:', err);
      this.port = null;
      this.writer = null;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.writer) {
      await this.writer.releaseLock();
      this.writer = null;
    }
    if (this.port) {
      await this.port.close();
      this.port = null;
    }
  }

  isConnected(): boolean {
    return this.port !== null && this.writer !== null;
  }

  private async sendCommand(cmd: Uint8Array): Promise<void> {
    if (!this.writer) throw new Error('Printer not connected');
    await this.writer.write(cmd);
  }

  private encodeText(text: string): Uint8Array {
    // For a basic implementation, we just use TextEncoder.
    // Note: Thai characters might require TIS-620 or specific printer codepage setup (e.g. ESC t <n>).
    // This uses UTF-8 which works on some newer printers.
    const encoder = new TextEncoder();
    return encoder.encode(text);
  }

  async printText(text: string, align: 'left' | 'center' | 'right' = 'left'): Promise<void> {
    if (!this.writer) throw new Error('Printer not connected');
    
    // Set alignment
    if (align === 'center') await this.sendCommand(this.CMD_ALIGN_CENTER);
    else if (align === 'right') await this.sendCommand(this.CMD_ALIGN_RIGHT);
    else await this.sendCommand(this.CMD_ALIGN_LEFT);

    // Print text
    await this.sendCommand(this.encodeText(text));
    
    // Reset alignment to left
    await this.sendCommand(this.CMD_ALIGN_LEFT);
  }

  async feed(lines: number = 1): Promise<void> {
    for (let i = 0; i < lines; i++) {
      await this.sendCommand(this.CMD_NEWLINE);
    }
  }

  async cut(): Promise<void> {
    // Feed a few lines before cutting so we don't cut the text
    await this.feed(3);
    await this.sendCommand(this.CMD_CUT);
  }

  async printSampleReceipt(shopName: string, shopAddress: string): Promise<boolean> {
    try {
      await this.sendCommand(this.CMD_INIT);
      
      await this.printText("==== TEST RECEIPT ====\n", 'center');
      await this.printText(shopName + "\n", 'center');
      if (shopAddress) {
        await this.printText(shopAddress + "\n", 'center');
      }
      
      await this.feed(1);
      
      await this.printText("Item A                10.00\n", 'left');
      await this.printText("Item B                15.00\n", 'left');
      
      await this.feed(1);
      
      await this.printText("TOTAL                 25.00\n", 'right');
      
      await this.feed(2);
      await this.printText("Thank you!\n", 'center');
      
      await this.cut();
      return true;
    } catch (err) {
      console.error('Error printing sample receipt:', err);
      return false;
    }
  }
}

// Singleton instance for the app
export const thermalPrinter = new ThermalPrinterService();
