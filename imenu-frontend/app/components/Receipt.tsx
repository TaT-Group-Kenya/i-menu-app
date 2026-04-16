"use client";

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
}

interface ReceiptProps {
  order: Order;
}

export default function Receipt({ order }: ReceiptProps) {
  return (
    <div className="p-4 text-sm bg-white w-80">
      <h2 className="text-center font-bold text-lg mb-2">
        RECEIPT
      </h2>

      <div className="mb-2">
        <p>Order #: {order.order_number}</p>
        <p>Date: {new Date(order.created_at).toLocaleString()}</p>
      </div>

      <table className="w-full mb-2">
        <thead>
          <tr className="border-b">
            <th className="text-left">Item</th>
            <th>Qty</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td className="text-center">{item.quantity}</td>
              <td className="text-right">
                {item.total.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t pt-2 font-bold flex justify-between">
        <span>Total</span>
        <span>{order.total_amount.toFixed(2)}</span>
      </div>

      <div className="mt-2 text-center">
        Paid via {order.payment_method}
      </div>
    </div>
  );
}
