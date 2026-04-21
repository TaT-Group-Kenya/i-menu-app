"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Receipt from "@/app/components/Receipt";
import { etrService } from "@/app/lib/etr";

interface Order {
  id: number;
  order_number: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
  items: Array<{
    id: number;
    menu_id: number;
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
}

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fiscalNumber, setFiscalNumber] = useState<string | null>(null);

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8000/api/orders/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch order");

      const data = await response.json();
      setOrder(data);

      // Fiscalize receipt with ETR
      const etrResult = await etrService.fiscalizeReceipt({
        receipt_number: data.order_number,
        order_number: data.order_number,
        date: new Date(data.created_at).toLocaleDateString(),
        time: new Date(data.created_at).toLocaleTimeString(),
        cashier: "Cashier Name",
        items: data.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
        subtotal: data.items.reduce((sum: number, item: any) => sum + item.total, 0),
        tax: 0,
        discount: 0,
        total: data.total_amount,
        payment_method: data.payment_method,
      });

      if (etrResult.fiscal_number) {
        setFiscalNumber(etrResult.fiscal_number);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching order");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading receipt...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || "Order not found"}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-indigo-600 hover:text-indigo-800"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <Receipt order={order} />
            
            {fiscalNumber && (
              <div className="mt-4 p-3 bg-green-50 text-green-700 rounded text-sm text-center">
                ✅ Fiscalized: {fiscalNumber}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}