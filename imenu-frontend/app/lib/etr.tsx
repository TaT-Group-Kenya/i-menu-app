// ETR (Electronic Tax Register) Integration Service

export interface ETRReceiptData {
  receipt_number: string;
  order_number: string;
  date: string;
  time: string;
  cashier: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_method: string;
}

class ETRService {
  private etrUrl = process.env.NEXT_PUBLIC_ETR_API_URL || "http://localhost:8001";
  private etrEnabled = process.env.NEXT_PUBLIC_ETR_ENABLED === "true";

  // Send receipt to ETR for fiscalization
  async fiscalizeReceipt(receiptData: ETRReceiptData): Promise<{
    success: boolean;
    fiscal_number?: string;
    error?: string;
  }> {
    if (!this.etrEnabled) {
      console.log("ETR not enabled, skipping fiscalization");
      return { success: true, fiscal_number: "TEST-" + Date.now() };
    }

    try {
      const response = await fetch(`${this.etrUrl}/api/fiscalize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(receiptData),
      });

      if (!response.ok) {
        throw new Error("ETR fiscalization failed");
      }

      const data = await response.json();
      return {
        success: true,
        fiscal_number: data.fiscal_number,
      };
    } catch (error) {
      console.error("ETR Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "ETR connection failed",
      };
    }
  }

  // Check ETR connection status
  async checkETRStatus(): Promise<{
    connected: boolean;
    serial_number?: string;
    message?: string;
  }> {
    if (!this.etrEnabled) {
      return { connected: false, message: "ETR integration disabled" };
    }

    try {
      const response = await fetch(`${this.etrUrl}/api/status`);
      const data = await response.json();
      return {
        connected: true,
        serial_number: data.serial_number,
      };
    } catch (error) {
      return {
        connected: false,
        message: "ETR device not connected",
      };
    }
  }

  // Print receipt via ETR printer
  async printViaETR(receiptHtml: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    if (!this.etrEnabled) {
      return { success: false, error: "ETR not enabled" };
    }

    try {
      const response = await fetch(`${this.etrUrl}/api/print`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ receipt: receiptHtml }),
      });

      if (!response.ok) {
        throw new Error("Print failed");
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Print failed",
      };
    }
  }
}

export const etrService = new ETRService();