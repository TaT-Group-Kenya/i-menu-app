"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";

export interface OrderItem {
  id: number;
  menu_id: number;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  id: number;
  order_number: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
  items: OrderItem[];
  cashier_name?: string;
  customer_name?: string;
  tax_amount?: number;
  discount_amount?: number;
}

interface ReceiptProps {
  order: Order;
  onPrintComplete?: () => void;
}

export default function Receipt({ order, onPrintComplete }: ReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Receipt_${order.order_number}`,
    onAfterPrint: () => {
      if (onPrintComplete) onPrintComplete();
    },
  });

  const calculateSubtotal = () => {
    return order.items.reduce((sum, item) => sum + item.total, 0);
  };

  const subtotal = calculateSubtotal();
  const tax = order.tax_amount || subtotal * 0.1; // 10% tax if not provided
  const discount = order.discount_amount || 0;
  const total = order.total_amount;

  return (
    <div>
      {/* Hidden Printable Receipt */}
      <div className="hidden">
        <div ref={receiptRef} className="p-4 text-sm bg-white w-80 font-mono">
          {/* Header */}
          <div className="text-center mb-4">
            <h2 className="font-bold text-lg">🍽️ i-MENU</h2>
            <p className="text-xs">Restaurant Management System</p>
            <p className="text-xs mt-1">123 Main Street, City</p>
            <p className="text-xs">Tel: +123 456 7890</p>
            <p className="text-xs">VAT: 123456789</p>
            <div className="border-t border-dashed my-2"></div>
          </div>

          {/* Receipt Info */}
          <div className="mb-3 text-xs">
            <p><strong>Receipt #:</strong> {order.order_number}</p>
            <p><strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()}</p>
            <p><strong>Time:</strong> {new Date(order.created_at).toLocaleTimeString()}</p>
            <p><strong>Cashier:</strong> {order.cashier_name || "Admin"}</p>
            {order.customer_name && <p><strong>Customer:</strong> {order.customer_name}</p>}
          </div>

          <div className="border-t border-dashed my-2"></div>

          {/* Items Header */}
          <div className="grid grid-cols-4 gap-1 text-xs font-bold mb-1">
            <div className="col-span-2">Item</div>
            <div className="text-center">Qty</div>
            <div className="text-right">Total</div>
          </div>

          <div className="border-t border-dashed my-1"></div>

          {/* Items List */}
          {order.items.map((item) => (
            <div key={item.id} className="grid grid-cols-4 gap-1 text-xs mb-1">
              <div className="col-span-2">{item.name}</div>
              <div className="text-center">{item.quantity}</div>
              <div className="text-right">${item.total.toFixed(2)}</div>
            </div>
          ))}

          <div className="border-t border-dashed my-2"></div>

          {/* Totals */}
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {tax > 0 && (
              <div className="flex justify-between">
                <span>Tax (10%):</span>
                <span>${tax.toFixed(2)}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm pt-1 border-t">
              <span>TOTAL:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t border-dashed my-2"></div>

          {/* Payment Info */}
          <div className="text-xs">
            <div className="flex justify-between">
              <span>Payment Method:</span>
              <span className="uppercase">{order.payment_method}</span>
            </div>
            <div className="flex justify-between">
              <span>Amount Paid:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t border-dashed my-2"></div>

          {/* Footer */}
          <div className="text-center text-xs mt-4">
            <p>Thank you for dining with us!</p>
            <p className="text-xs mt-1">This is a computer generated receipt</p>
            <p className="text-xs">Valid for exchange within 7 days</p>
            <p className="text-xs mt-2">✨ Follow us on social media ✨</p>
          </div>

          {/* ETR Information (for compliance) */}
          <div className="border-t border-dashed my-2 text-[10px] text-center">
            <p>ETR Serial: ETR-2024-001</p>
            <p>Receipt #: {order.order_number}</p>
            <p>Date/Time: {new Date(order.created_at).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Print Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handlePrint}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Receipt
        </button>
      </div>
    </div>
  );
}