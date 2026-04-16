"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type Menu = {
  id: number
  name: string
  price: number
}

type OrderItem = {
  menu_id: number
  name: string
  price: number
  quantity: number
}

export default function CashierDashboard() {
  const router = useRouter()

  const [menus, setMenus] = useState<Menu[]>([])
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const storedToken = localStorage.getItem("token")

    if (!storedToken) {
      router.push("/login")
    } else {
      setToken(storedToken)
    }
  }, [router])

  useEffect(() => {
    if (!token) return

    async function fetchMenus() {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/menus", {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) throw new Error("Failed to fetch menus")

        const data = await res.json()
        setMenus(data)
      } catch (error) {
        console.error("Menu fetch error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMenus()
  }, [token])

  function handleLogout() {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  function addToOrder(menu: Menu) {
    const existing = orderItems.find((i) => i.menu_id === menu.id)

    if (existing) {
      setOrderItems((prev) =>
        prev.map((item) =>
          item.menu_id === menu.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      )
    } else {
      setOrderItems((prev) => [
        ...prev,
        {
          menu_id: menu.id,
          name: menu.name,
          price: Number(menu.price),
          quantity: 1,
        },
      ])
    }
  }

  function updateQuantity(menu_id: number, qty: number) {
    if (qty < 1) return

    setOrderItems((prev) =>
      prev.map((item) =>
        item.menu_id === menu_id ? { ...item, quantity: qty } : item
      )
    )
  }

  function removeItem(menu_id: number) {
    setOrderItems((prev) => prev.filter((i) => i.menu_id !== menu_id))
  }

  function calculateTotal() {
    return orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
  }

  async function createOrder() {
    if (orderItems.length === 0) {
      alert("No items in order")
      return
    }

    if (!token) {
      alert("Authentication missing")
      return
    }

    setCreating(true)

    try {
      const res = await fetch("http://127.0.0.1:8000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: orderItems.map((item) => ({
            menu_id: item.menu_id,
            quantity: item.quantity,
          })),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to create order")
      }

      alert("Order created successfully")

      setOrderItems([])
    } catch (error: any) {
      console.error("Order creation error:", error)
      alert(error.message)
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <p className="p-8 text-black">Loading menus...</p>

  return (
    <div className="min-h-screen bg-gray-100 text-black">

      {/* HEADER */}
      <div className="flex justify-between items-center bg-white shadow px-8 py-4">
        <h1 className="text-2xl font-bold">POS - Create Order</h1>

        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
        >
          Logout
        </button>
      </div>

      <div className="p-8 grid grid-cols-3 gap-6">

        {/* MENU */}
        <div className="col-span-2 bg-white p-6 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-bold mb-6">Menu</h2>

          <div className="grid grid-cols-3 gap-4">
            {menus.map((menu) => (
              <div
                key={menu.id}
                className="bg-gray-100 p-4 rounded-lg cursor-pointer hover:bg-gray-200 transition"
                onClick={() => addToOrder(menu)}
              >
                <h3 className="font-semibold text-lg">{menu.name}</h3>

                <p className="font-bold">
                  KES {Number(menu.price).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ORDER SUMMARY */}
        <div className="bg-white p-6 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

          {orderItems.length === 0 ? (
            <p>No items in order</p>
          ) : (
            <div className="space-y-4">

              {orderItems.map((item) => (
                <div
                  key={item.menu_id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>

                    <p className="text-sm">
                      KES {item.price.toFixed(2)} each
                    </p>
                  </div>

                  <div className="flex items-center gap-2">

                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(
                          item.menu_id,
                          parseInt(e.target.value)
                        )
                      }
                      className="w-16 border rounded text-center"
                    />

                    <button
                      onClick={() => removeItem(item.menu_id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>

                  </div>
                </div>
              ))}

              <div className="border-t pt-4 font-bold flex justify-between">
                <span>Total</span>
                <span>KES {calculateTotal().toFixed(2)}</span>
              </div>

              <button
                onClick={createOrder}
                disabled={creating}
                className="bg-gray-800 text-white w-full p-3 rounded mt-4 hover:bg-gray-700 disabled:opacity-50"
              >
                {creating ? "Creating Order..." : "Create Order"}
              </button>

            </div>
          )}
        </div>

      </div>
    </div>
  )
}
