"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/context/theme-context";
import { useToast } from "@/app/context/toast-context";

const API = "http://127.0.0.1:8000/api";

interface StockItem {
  id: number;
  name: string;
  unit_of_measure: string;
}

interface Stock {
  id: number;
  stock_item_id: number;
  quantity: number;
  stock_warning_count: number;
}

export default function StockRecordsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  const fetchData = async () => {
    if (!token) return;

    try {
      const [itemsRes, stocksRes] = await Promise.all([
        fetch(`${API}/stock-items`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }),
        fetch(`${API}/stocks`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }),
      ]);

      if (!itemsRes.ok || !stocksRes.ok) {
        throw new Error("Failed to fetch stock data");
      }

      const itemsData = await itemsRes.json();
      const stocksData = await stocksRes.json();

      setStockItems(itemsData.data ?? itemsData);
      setStocks(stocksData.data ?? stocksData);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to load stock records", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStockStatus = (quantity: number, warningLevel: number) => {
    if (quantity === 0) return "critical";
    if (quantity <= warningLevel) return "warning";
    return "good";
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "critical":
        return {
          bg: "bg-red-100 dark:bg-red-900/50",
          text: "text-red-700 dark:text-red-300",
          border: "border-red-200 dark:border-red-800",
          indicator: "bg-red-500",
        };
      case "warning":
        return {
          bg: "bg-yellow-100 dark:bg-yellow-900/50",
          text: "text-yellow-700 dark:text-yellow-300",
          border: "border-yellow-200 dark:border-yellow-800",
          indicator: "bg-yellow-500",
        };
      default:
        return {
          bg: "bg-green-100 dark:bg-green-900/50",
          text: "text-green-700 dark:text-green-300",
          border: "border-green-200 dark:border-green-800",
          indicator: "bg-green-500",
        };
    }
  };

  if (loading) {
    return (
      <div className={`p-6 flex items-center gap-2 ${theme === "dark" ? "text-gray-400" : "text-black"}`}>
        <svg
          className="animate-spin h-5 w-5 text-indigo-600"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        Loading stock records...
      </div>
    );
  }

  const lowStockItems = stockItems.filter((item) => {
    const stock = stocks.find((s) => s.stock_item_id === item.id);
    const quantity = stock ? Number(stock.quantity) : 0;
    const warning = stock ? stock.stock_warning_count : 0;
    return quantity <= warning;
  });

  return (
    <div
      className={`p-6 space-y-6 min-h-screen transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Stock Records</h1>
          <p className={`text-sm mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
            Current inventory levels for all stock items
          </p>
        </div>

        <button
          onClick={() => router.push("/admin/stocks")}
          className={`px-4 py-2 rounded-lg transition-all duration-300 ${
            theme === "dark"
              ? "bg-gray-700 hover:bg-gray-600 text-white"
              : "bg-gray-800 hover:bg-gray-700 text-white"
          }`}
        >
          Back to Stock Management
        </button>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div
          className={`p-4 rounded-lg border ${
            theme === "dark"
              ? "bg-yellow-900/30 border-yellow-700 text-yellow-300"
              : "bg-yellow-50 border-yellow-200 text-yellow-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="font-medium">
              Low Stock Alert: {lowStockItems.length} item(s) are at or below warning level
            </span>
          </div>
        </div>
      )}

      {/* Stock Records Table */}
      <div
        className={`rounded-xl overflow-hidden shadow-lg transition-colors duration-300 ${
          theme === "dark" ? "bg-gray-800 border border-gray-700" : "bg-white border"
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead
              className={`${
                theme === "dark" ? "bg-gray-700" : "bg-gray-100"
              }`}
            >
              <tr>
                <th className="p-3 text-left">Item</th>
                <th className="p-3 text-left">Quantity</th>
                <th className="p-3 text-left">Unit</th>
                <th className="p-3 text-left">Warning Level</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>

            <tbody>
              {stockItems.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className={`p-6 text-center ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    No stock items found
                  </td>
                </tr>
              )}

              {stockItems.map((item, index) => {
                const stock = stocks.find((s) => s.stock_item_id === item.id);
                const quantity = stock ? Number(stock.quantity) : 0;
                const warning = stock ? stock.stock_warning_count : 0;
                const status = getStockStatus(quantity, warning);
                const statusStyles = getStatusStyles(status);

                return (
                  <tr
                    key={item.id}
                    className={`border-t transition-colors ${
                      theme === "dark"
                        ? "border-gray-700 hover:bg-gray-700/50"
                        : "border-gray-200 hover:bg-gray-50"
                    } ${index % 2 === 0 ? (theme === "dark" ? "bg-gray-800/50" : "") : ""}`}
                  >
                    <td
                      className={`p-3 font-medium ${
                        theme === "dark" ? "text-white" : "text-black"
                      }`}
                    >
                      {item.name}
                    </td>

                    <td className="p-3">
                      <span
                        className={`font-semibold ${
                          status === "critical"
                            ? "text-red-600 dark:text-red-400"
                            : status === "warning"
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        {quantity.toFixed(2)}
                      </span>
                    </td>

                    <td className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
                      {item.unit_of_measure}
                    </td>

                    <td className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
                      {warning}
                    </td>

                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles.bg} ${statusStyles.text}`}
                      >
                        {status === "critical"
                          ? "Critical"
                          : status === "warning"
                          ? "Low Stock"
                          : "In Stock"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Section */}
      {stockItems.length > 0 && (
        <div
          className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${
            theme === "dark" ? "text-gray-400" : "text-gray-500"
          }`}
        >
          <div
            className={`p-4 rounded-lg text-center transition-colors duration-300 ${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            }`}
          >
            <p className="text-2xl font-bold text-indigo-600">{stockItems.length}</p>
            <p className="text-sm">Total Items</p>
          </div>

          <div
            className={`p-4 rounded-lg text-center transition-colors duration-300 ${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            }`}
          >
            <p className="text-2xl font-bold text-green-600">
              {stockItems.filter((item) => {
                const stock = stocks.find((s) => s.stock_item_id === item.id);
                const quantity = stock ? Number(stock.quantity) : 0;
                const warning = stock ? stock.stock_warning_count : 0;
                return quantity > warning;
              }).length}
            </p>
            <p className="text-sm">In Stock</p>
          </div>

          <div
            className={`p-4 rounded-lg text-center transition-colors duration-300 ${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            }`}
          >
            <p className="text-2xl font-bold text-red-600">{lowStockItems.length}</p>
            <p className="text-sm">Low Stock / Critical</p>
          </div>
        </div>
      )}
    </div>
  );
}