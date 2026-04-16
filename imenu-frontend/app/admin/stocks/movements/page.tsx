"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/context/theme-context";
import { useToast } from "@/app/context/toast-context";

const API = "http://127.0.0.1:8000/api";

interface Movement {
  id: number;
  type: string;
  quantity: number;
  before: number;
  after: number;
  order_id?: number | null;
  created_at: string;
  stock?: {
    stock_item?: {
      name: string;
      unit_of_measure: string;
    };
  };
}

export default function StockMovementsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  const fetchMovements = async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API}/stock-movements`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(errorText);
        showToast("Failed to load stock movements", "error");
        return;
      }

      const data = await res.json();
      setMovements(data.data ?? data);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to load stock movements", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, []);

  const getTypeStyle = (type: string) => {
    switch (type) {
      case "sale":
        return "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300";
      case "cancel":
        return "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300";
      case "restock":
        return "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300";
      case "adjustment":
        return "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
    }
  };

  const getFilterButtonStyle = (buttonFilter: string) => {
    if (filter === buttonFilter) {
      if (buttonFilter === "sale") return "bg-red-600 text-white";
      if (buttonFilter === "restock") return "bg-green-600 text-white";
      return "bg-gray-800 dark:bg-gray-700 text-white";
    }
    
    if (buttonFilter === "sale") return "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300";
    if (buttonFilter === "restock") return "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300";
    return "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600";
  };

  const filteredMovements = movements.filter((m) => {
    if (filter === "all") return true;
    if (filter === "sale") return m.type === "sale";
    if (filter === "restock") return m.type === "restock";
    if (filter === "today") {
      const today = new Date().toDateString();
      return new Date(m.created_at).toDateString() === today;
    }
    if (filter === "week") {
      const now = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      const date = new Date(m.created_at);
      return date >= weekAgo && date <= now;
    }
    return true;
  });

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
        Loading movements...
      </div>
    );
  }

  return (
    <div
      className={`p-6 space-y-6 min-h-screen transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Stock Movements</h1>

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

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1 rounded-lg transition-all duration-200 ${getFilterButtonStyle("all")}`}
        >
          All
        </button>

        <button
          onClick={() => setFilter("today")}
          className={`px-3 py-1 rounded-lg transition-all duration-200 ${getFilterButtonStyle("today")}`}
        >
          Today
        </button>

        <button
          onClick={() => setFilter("week")}
          className={`px-3 py-1 rounded-lg transition-all duration-200 ${getFilterButtonStyle("week")}`}
        >
          This Week
        </button>

        <button
          onClick={() => setFilter("sale")}
          className={`px-3 py-1 rounded-lg transition-all duration-200 ${getFilterButtonStyle("sale")}`}
        >
          Sales
        </button>

        <button
          onClick={() => setFilter("restock")}
          className={`px-3 py-1 rounded-lg transition-all duration-200 ${getFilterButtonStyle("restock")}`}
        >
          Restocks
        </button>
      </div>

      {/* Table */}
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
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Quantity</th>
                <th className="p-3 text-left">Before</th>
                <th className="p-3 text-left">After</th>
                <th className="p-3 text-left">Order</th>
                <th className="p-3 text-left">Date</th>
              </tr>
            </thead>

            <tbody>
              {filteredMovements.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className={`p-6 text-center ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    No stock movements found
                  </td>
                </tr>
              )}

              {filteredMovements.map((m, index) => {
                const itemName =
                  m.stock?.stock_item?.name ?? "Unknown Item";
                const unit = m.stock?.stock_item?.unit_of_measure ?? "";

                return (
                  <tr
                    key={m.id}
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
                      {itemName}
                    </td>

                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getTypeStyle(m.type)}`}
                      >
                        {m.type}
                      </span>
                    </td>

                    <td className={theme === "dark" ? "text-gray-300" : "text-gray-700"}>
                      {Number(m.quantity).toFixed(2)} ({unit})
                    </td>

                    <td className={theme === "dark" ? "text-gray-300" : "text-gray-700"}>
                      {Number(m.before).toFixed(2)}
                    </td>

                    <td className={theme === "dark" ? "text-gray-300" : "text-gray-700"}>
                      {Number(m.after).toFixed(2)}
                    </td>

                    <td className={theme === "dark" ? "text-gray-300" : "text-gray-700"}>
                      {m.order_id ? `#${m.order_id}` : "-"}
                    </td>

                    <td className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                      {new Date(m.created_at).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Section */}
      {filteredMovements.length > 0 && (
        <div
          className={`text-center p-4 rounded-lg transition-colors duration-300 ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          }`}
        >
          <p className={theme === "dark" ? "text-gray-400" : "text-gray-500"}>
            Showing{" "}
            <span className="font-semibold text-indigo-600">
              {filteredMovements.length}
            </span>{" "}
            movement{filteredMovements.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}