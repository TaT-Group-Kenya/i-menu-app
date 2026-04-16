"use client"

import { useEffect, useState } from "react"
import api from "@/app/lib/api"

interface OrderItem {
  id: number
  order_id: number
  menu_id: number
  quantity: number
  price: number
  tax_rate: number
  tax_amount: number
  subtotal: number
  created_at: string
  order?: {
    order_number: string
  }
  menu?: {
    name: string
  }
}

export default function OrderItemsPage() {
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchItems = async () => {
    try {
      const response = await api.get("/order-items")
      setItems(response.data ?? [])
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch order items")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const handleDelete = async (id: number) => {
    const confirmDelete = confirm("Are you sure you want to delete this order item?")
    if (!confirmDelete) return

    try {
      await api.delete(`/order-items/${id}`)
      setItems((prev) => prev.filter((item) => item.id !== id))
    } catch (err: any) {
      alert(err.response?.data?.message || "Delete failed")
    }
  }

  if (loading)
    return (
      <div className="p-6">
        <p className="text-gray-500">Loading order items...</p>
      </div>
    )

  if (error)
    return (
      <div className="p-6">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      </div>
    )

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">
        Order Items Management
      </h1>

      <div className="bg-white shadow-md rounded-2xl border overflow-hidden">
  <table className="w-full text-sm text-black">
    <thead className="bg-gray-200 text-black font-bold">
      <tr>
        <th className="p-4 text-left">ID</th>
        <th className="p-4 text-left">Order</th>
        <th className="p-4 text-left">Menu</th>
        <th className="p-4 text-center">Qty</th>
        <th className="p-4 text-right">Price (KES)</th>
        <th className="p-4 text-right">Tax</th>
        <th className="p-4 text-right">Subtotal</th>
        <th className="p-4 text-left">Created</th>
        <th className="p-4 text-center">Action</th>
      </tr>
    </thead>

          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-6 text-center text-gray-500">
                  No order items found
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="p-4 font-medium">{item.id}</td>

                  <td className="p-4">
                    {item.order?.order_number ?? item.order_id}
                  </td>

                  <td className="p-4">
                    {item.menu?.name ?? item.menu_id}
                  </td>

                  <td className="p-4 text-center">
                    {item.quantity}
                  </td>

                  <td className="p-4 text-right">
                    {Number(item.price).toLocaleString()}
                  </td>

                  <td className="p-4 text-right">
                    {Number(item.tax_amount).toLocaleString()}
                  </td>

                  <td className="p-4 text-right font-semibold">
                    {Number(item.subtotal).toLocaleString()}
                  </td>

                  <td className="p-4 text-gray-500">
                    {new Date(item.created_at).toLocaleString()}
                  </td>

                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}