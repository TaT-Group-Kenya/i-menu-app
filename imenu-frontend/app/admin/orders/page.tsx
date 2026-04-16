"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/lib/api";
import { useTheme } from "@/app/context/theme-context";
import { useModal } from "@/app/context/modal-context";
import { useToast } from "@/app/context/toast-context";

interface Order {
  id: number;
  order_number: string;
  status: string;
  fiscal_status: string;
  total: string;
  created_at: string;
}

interface OrderItem {
  id: number;
  order_id: number;
  menu_id: number;
  quantity: number;
  price: number;
  tax_rate: number;
  tax_amount: number;
  subtotal: number;
  created_at: string;
  updated_at: string;
  menu?: {
    name: string;
  };
}

export default function OrdersPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { showModal } = useModal();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [confirmAction, setConfirmAction] = useState<null | {
    type: "approve" | "cancel" | "delete" | "update";
    payload: any;
  }>(null);

  const ordersPerPage = 5;
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchOrders();
  }, []);

  function buildError(err: any, fallback: string) {
    const res = err.response?.data;
    let msg = res?.message || fallback;

    if (res?.stock_errors?.length) {
      msg += "\nInsufficient stock for: " + res.stock_errors.join(", ");
    }

    return msg;
  }

  async function fetchOrders() {
    try {
      const res = await api.get("/orders");
      setOrders(res.data);
    } catch (err: any) {
      setErrorMessage(buildError(err, "Failed to load orders"));
      setMessage(null);
      showToast("Failed to load orders", "error");
    } finally {
      setLoading(false);
    }
  }

  async function fetchOrderItems(orderId: number) {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      setOrderItems([]);
      return;
    }

    try {
      const res = await api.get("/order-items");
      const filtered = res.data.filter(
        (item: OrderItem) => item.order_id === orderId
      );
      setOrderItems(filtered);
      setExpandedOrderId(orderId);
    } catch (err: any) {
      setErrorMessage(buildError(err, "Failed to load order items"));
      setMessage(null);
      showToast("Failed to load order items", "error");
    }
  }

  async function handleConfirmedAction() {
    if (!confirmAction) return;

    const { type, payload } = confirmAction;
    setConfirmAction(null);

    try {
      if (type === "approve") {
        const res = await api.post(`/orders/${payload.id}/pay`);
        setMessage(res.data.message);
        showToast(res.data.message, "success");
      }

      if (type === "cancel") {
        const res = await api.post(`/orders/${payload.id}/cancel`);
        setMessage(res.data.message);
        showToast(res.data.message, "warning");
      }

      if (type === "delete") {
        const res = await api.delete(`/order-items/${payload.id}`);
        setMessage(res.data.message);
        showToast(res.data.message, "success");
      }

      if (type === "update") {
        const res = await api.put(`/order-items/${payload.id}`, {
          quantity: payload.quantity,
        });
        setMessage(res.data.message);
        showToast(res.data.message, "success");
      }

      setErrorMessage(null);
      fetchOrders();
    } catch (err: any) {
      const errorMsg = buildError(err, "Action failed");
      setErrorMessage(errorMsg);
      setMessage(null);
      showToast(errorMsg, "error");
    }
  }

  async function handleConfirmAction(type: "approve" | "cancel" | "delete" | "update", payload: any) {
    const confirmed = await showModal(
      `Confirm ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      `Are you sure you want to ${type} this item?`,
      "warning"
    );
    
    if (confirmed) {
      setConfirmAction({ type, payload });
      await handleConfirmedAction();
    }
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((order) =>
      order.order_number.toLowerCase().includes(search.toLowerCase())
    );
  }, [orders, search]);

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );

  function statusColor(status: string) {
    switch (status) {
      case "PAID":
        return "bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-300";
      case "CANCELLED":
        return "bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-300";
      default:
        return "bg-yellow-200 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300";
    }
  }

  function isLocked(status: string) {
    return status === "PAID" || status === "CANCELLED";
  }

  if (loading) return (
    <div className={`flex items-center justify-center h-64 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
      <div className="text-center">
        <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading orders...
      </div>
    </div>
  );

  return (
    <div className={`p-6 min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
    }`}>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Orders Management
          </h1>
          <p className={`text-sm font-medium mt-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            View, manage and edit existing orders only
          </p>
        </div>

        <button
          onClick={() => router.push("/admin/orders/create")}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 shadow-md"
        >
          + Create Order
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by order number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full md:w-96 px-4 py-2 rounded-lg border transition-colors duration-300 ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
          } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
        />
      </div>

      {message && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border border-green-400 dark:border-green-700 rounded-lg">
          {message}
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-400 dark:border-red-700 rounded-lg whitespace-pre-line">
          {errorMessage}
        </div>
      )}

      <div className={`rounded-xl overflow-hidden shadow-lg transition-colors duration-300 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <table className="w-full text-sm">
          <thead className={`${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <tr>
              <th className="p-4 text-left">Order #</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Fiscal</th>
              <th className="p-4 text-right">Total</th>
              <th className="p-4 text-left">Created</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedOrders.map((order) => {
              const locked = isLocked(order.status);

              return (
                <React.Fragment key={order.id}>
                  <tr className={`border-t transition-colors ${
                    theme === 'dark' 
                      ? 'border-gray-700 hover:bg-gray-700/50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}>
                    <td className={`p-4 font-bold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {order.order_number}
                    </td>

                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>

                    <td className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                      {order.fiscal_status}
                    </td>

                    <td className={`p-4 text-right font-bold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      KES {Number(order.total).toLocaleString()}
                    </td>

                    <td className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                      {new Date(order.created_at).toLocaleString()}
                    </td>

                    <td className="p-4 text-center space-x-2">
                      <button
                        onClick={() => fetchOrderItems(order.id)}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs transition"
                      >
                        {expandedOrderId === order.id ? "Hide" : "Overview"}
                      </button>

                      <button
                        disabled={locked}
                        onClick={() => handleConfirmAction("approve", { id: order.id })}
                        className={`px-3 py-1 text-white rounded text-xs transition ${
                          locked
                            ? "bg-gray-500 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        Approve
                      </button>

                      <button
                        disabled={locked}
                        onClick={() => handleConfirmAction("cancel", { id: order.id })}
                        className={`px-3 py-1 text-white rounded text-xs transition ${
                          locked
                            ? "bg-gray-500 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700"
                        }`}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>

                  {expandedOrderId === order.id && (
                    <tr>
                      <td colSpan={6} className={`p-6 ${
                        theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
                      }`}>
                        <h3 className={`font-bold text-lg mb-4 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          Order Items
                        </h3>
                        
                        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] text-xs font-bold mb-2">
                          <div>Menu</div>
                          <div>Quantity</div>
                          <div>Price</div>
                          <div>Tax Rate</div>
                          <div>Tax Amount</div>
                          <div>Subtotal</div>
                          <div>Actions</div>
                        </div>

                        {orderItems.map((item) => (
                          <div
                            key={item.id}
                            className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] text-xs gap-2 mb-2"
                          >
                            <input 
                              value={item.menu?.name ?? ""} 
                              readOnly 
                              className={`border rounded p-1 text-xs ${
                                theme === 'dark'
                                  ? 'bg-gray-800 border-gray-600 text-gray-300'
                                  : 'bg-white border-gray-300 text-gray-900'
                              }`}
                            />

                            <input
                              type="number"
                              value={item.quantity}
                              disabled={locked}
                              onChange={(e) => {
                                const qty = Number(e.target.value);
                                setOrderItems(orderItems.map(i =>
                                  i.id === item.id ? { ...i, quantity: qty } : i
                                ));
                              }}
                              className={`border rounded p-1 text-xs ${
                                locked 
                                  ? "bg-gray-200 dark:bg-gray-700 cursor-not-allowed" 
                                  : theme === 'dark'
                                    ? 'bg-gray-800 border-gray-600 text-gray-300'
                                    : 'bg-white border-gray-300'
                              }`}
                            />

                            <input 
                              value={item.price} 
                              readOnly 
                              className={`border rounded p-1 text-xs ${
                                theme === 'dark'
                                  ? 'bg-gray-800 border-gray-600 text-gray-300'
                                  : 'bg-white border-gray-300'
                              }`}
                            />
                            
                            <input 
                              value={item.tax_rate} 
                              readOnly 
                              className={`border rounded p-1 text-xs ${
                                theme === 'dark'
                                  ? 'bg-gray-800 border-gray-600 text-gray-300'
                                  : 'bg-white border-gray-300'
                              }`}
                            />
                            
                            <input 
                              value={item.tax_amount} 
                              readOnly 
                              className={`border rounded p-1 text-xs ${
                                theme === 'dark'
                                  ? 'bg-gray-800 border-gray-600 text-gray-300'
                                  : 'bg-white border-gray-300'
                              }`}
                            />
                            
                            <input 
                              value={item.subtotal} 
                              readOnly 
                              className={`border rounded p-1 text-xs ${
                                theme === 'dark'
                                  ? 'bg-gray-800 border-gray-600 text-gray-300'
                                  : 'bg-white border-gray-300'
                              }`}
                            />

                            <div className="flex gap-1">
                              <button
                                disabled={locked}
                                onClick={() => handleConfirmAction("update", { id: item.id, quantity: item.quantity })}
                                className={`px-2 py-1 text-xs rounded text-white transition ${
                                  locked ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                                }`}
                              >
                                Update
                              </button>

                              <button
                                disabled={locked}
                                onClick={() => handleConfirmAction("delete", { id: item.id })}
                                className={`px-2 py-1 text-xs rounded text-white transition ${
                                  locked ? "bg-gray-500 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
                                }`}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredOrders.length > ordersPerPage && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg transition ${
              currentPage === 1
                ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            Previous
          </button>
          <span className={`px-4 py-2 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Page {currentPage} of {Math.ceil(filteredOrders.length / ordersPerPage)}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(Math.ceil(filteredOrders.length / ordersPerPage), currentPage + 1))}
            disabled={currentPage === Math.ceil(filteredOrders.length / ordersPerPage)}
            className={`px-4 py-2 rounded-lg transition ${
              currentPage === Math.ceil(filteredOrders.length / ordersPerPage)
                ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}