"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/context/theme-context";
import { useModal } from "@/app/context/modal-context";
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
  stock_item: StockItem;
}

export default function StocksPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { showModal } = useModal();
  const { showToast } = useToast();

  const [stocks, setStocks] = useState<Stock[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);

  const [selectedItem, setSelectedItem] = useState<number | "">("");
  const [quantity, setQuantity] = useState<string>("");
  const [stockWarningCount, setStockWarningCount] = useState<number | "">("");

  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchStocks = async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API}/stocks`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await res.json();
      setStocks(data.data ?? data);
    } catch (error: any) {
      showToast(error.message || "Failed to load stocks", "error");
    }
  };

  const fetchStockItems = async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API}/stock-items`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await res.json();
      setStockItems(data.data ?? data);
      setLoading(false);
    } catch (error: any) {
      showToast(error.message || "Failed to load stock items", "error");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStocks();
      fetchStockItems();
    }
  }, [token]);

  const sortedStockItems = [...stockItems].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const filteredItems = sortedStockItems.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectItem = (item: StockItem) => {
    setSelectedItem(item.id);
    setSearch(item.name);
    setDropdownOpen(false);

    const existingStock = stocks.find((s) => s.stock_item_id === item.id);

    if (existingStock) {
      setSelectedStock(existingStock);
      setQuantity(Number(existingStock.quantity).toFixed(2));
      setStockWarningCount(existingStock.stock_warning_count);
      showToast(`Editing stock for "${item.name}"`, "info");
    } else {
      setSelectedStock(null);
      setQuantity("0.00");
      setStockWarningCount("");
      showToast(`Adding new stock for "${item.name}"`, "info");
    }
  };

  const cancelUpdate = () => {
    setSelectedItem("");
    setQuantity("");
    setStockWarningCount("");
    setSelectedStock(null);
    setSearch("");
  };

  const saveStock = async () => {
    if (selectedItem === "" || quantity === "" || stockWarningCount === "") {
      showToast("Please fill all fields", "warning");
      return;
    }

    if (!token) {
      showToast("Not authenticated", "error");
      return;
    }

    let res;

    try {
      if (selectedStock) {
        res = await fetch(`${API}/stocks/${selectedStock.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: JSON.stringify({
            quantity: Number(quantity),
            stock_warning_count: Number(stockWarningCount),
          }),
        });
      } else {
        res = await fetch(`${API}/stocks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: JSON.stringify({
            stock_item_id: Number(selectedItem),
            quantity: Number(quantity),
            stock_warning_count: Number(stockWarningCount),
          }),
        });
      }

      if (!res.ok) {
        const errorText = await res.text();
        console.error(errorText);
        showToast("Failed to save stock", "error");
        return;
      }

      showToast(
        selectedStock ? "Stock updated successfully" : "Stock added successfully",
        "success"
      );

      cancelUpdate();
      fetchStocks();
    } catch (error: any) {
      showToast(error.message || "Failed to save stock", "error");
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
        Loading...
      </div>
    );
  }

  const selectedStockItem = stockItems.find((s) => s.id === Number(selectedItem));
  const unit = selectedStockItem?.unit_of_measure;

  return (
    <div
      className={`p-6 space-y-6 pb-40 transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
      }`}
    >
      <h1 className="text-2xl font-semibold">Stock Management</h1>

      {/* Navigation Cards */}
      <div className="grid grid-cols-2 gap-6">
        <div
          onClick={() => router.push("/admin/stocks/records")}
          className={`cursor-pointer rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 ${
            theme === "dark"
              ? "bg-gray-800 hover:bg-gray-700"
              : "bg-white hover:shadow-xl"
          }`}
        >
          <h2 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-black"}`}>
            Stock Records
          </h2>
          <p className={`text-sm mt-2 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
            View and manage current stock records
          </p>
        </div>

        <div
          onClick={() => router.push("/admin/stocks/movements")}
          className={`cursor-pointer rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 ${
            theme === "dark"
              ? "bg-gray-800 hover:bg-gray-700"
              : "bg-white hover:shadow-xl"
          }`}
        >
          <h2 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-black"}`}>
            Stock Movements
          </h2>
          <p className={`text-sm mt-2 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
            View stock movement history
          </p>
        </div>
      </div>

      {/* Form */}
      <div
        className={`rounded-xl p-6 space-y-6 shadow-sm transition-colors duration-300 ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}
      >
        <h2 className={`font-semibold text-lg ${theme === "dark" ? "text-white" : "text-black"}`}>
          {selectedStock ? "Edit Stock" : "Add Stock"}
        </h2>

        <div className="grid grid-cols-4 gap-6">
          {/* Searchable Dropdown */}
          <div className="flex flex-col gap-2 relative" ref={dropdownRef}>
            <label className={`font-medium ${theme === "dark" ? "text-gray-300" : "text-black"}`}>
              Stock Item
            </label>

            <input
              type="text"
              placeholder="Search item..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
              className={`border rounded-lg p-2 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500"
                  : "bg-white border-gray-300 text-black focus:border-gray-500"
              }`}
            />

            {dropdownOpen && (
              <div
                className={`absolute top-full left-0 w-full border rounded-lg shadow-md max-h-60 overflow-y-auto z-50 ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600"
                    : "bg-white border-gray-200"
                }`}
              >
                {filteredItems.length === 0 && (
                  <div className={`p-2 text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                    No items found
                  </div>
                )}

                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className={`p-2 cursor-pointer transition-colors ${
                      theme === "dark"
                        ? "hover:bg-gray-600 text-gray-300"
                        : "hover:bg-gray-100 text-black"
                    }`}
                  >
                    {item.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quantity */}
          <div className="flex flex-col gap-2">
            <label className={`font-medium ${theme === "dark" ? "text-gray-300" : "text-black"}`}>
              Quantity {unit && `(${unit})`}
            </label>

            <input
              type="number"
              step="0.0001"
              className={`border rounded-lg p-2 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-black"
              }`}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          {/* Warning */}
          <div className="flex flex-col gap-2">
            <label className={`font-medium ${theme === "dark" ? "text-gray-300" : "text-black"}`}>
              Stock Warning Level
            </label>

            <input
              type="number"
              className={`border rounded-lg p-2 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-black"
              }`}
              value={stockWarningCount === "" ? "" : stockWarningCount}
              onChange={(e) => {
                const val = e.target.value;
                setStockWarningCount(val === "" ? "" : Number(val));
              }}
            />
          </div>

          {/* Buttons */}
          <div className="flex items-end gap-3">
            <button
              onClick={saveStock}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300"
            >
              {selectedStock ? "Update Stock" : "Add Stock"}
            </button>

            {selectedStock && (
              <button
                onClick={cancelUpdate}
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                  theme === "dark"
                    ? "bg-gray-600 hover:bg-gray-500 text-white"
                    : "bg-gray-300 hover:bg-gray-400 text-black"
                }`}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}