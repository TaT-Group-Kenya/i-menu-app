"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTheme } from "@/app/context/theme-context";
import { useModal } from "@/app/context/modal-context";
import { useToast } from "@/app/context/toast-context";

const API = "http://localhost:8000/api";

export default function MenuIngredientsPage() {
  const params = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  const { showModal } = useModal();
  const { showToast } = useToast();
  const menuId = params.id as string;

  const [menu, setMenu] = useState<any>(null);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [stockItems, setStockItems] = useState<any[]>([]);

  const [stockItemId, setStockItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [editId, setEditId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

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

  const fetchMenu = async () => {
    try {
      const res = await fetch(`${API}/menus/${menuId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMenu(data);
    } catch (error: any) {
      showToast(error.message || "Failed to load menu", "error");
    }
  };

  const fetchIngredients = async () => {
    try {
      const res = await fetch(`${API}/menu-ingredients?menu_id=${menuId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setIngredients(data);
    } catch (error: any) {
      showToast(error.message || "Failed to load ingredients", "error");
    }
  };

  const fetchStockItems = async () => {
    try {
      const res = await fetch(`${API}/stock-items`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setStockItems(data);
      else setStockItems(data.data ?? []);
    } catch (error: any) {
      showToast(error.message || "Failed to load stock items", "error");
    }
  };

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      await fetchMenu();
      await fetchIngredients();
      await fetchStockItems();
      setLoading(false);
    };

    load();
  }, []);

  const sortedStockItems = [...stockItems].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const filteredItems = sortedStockItems.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setEditId(null);
    setStockItemId("");
    setQuantity("");
    setSearch("");
  };

  const handleSelectItem = (item: any) => {
    setStockItemId(String(item.id));
    setSearch(item.name);
    setDropdownOpen(false);

    if (!editId) {
      setQuantity("0.00");
    }
  };

  const getSelectedStock = () => {
    return stockItems.find((s) => s.id == stockItemId);
  };

  const handleQuantityChange = (value: string) => {
    const numeric = value.replace(/[^0-9.]/g, "");
    setQuantity(numeric);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stockItemId || !quantity) {
      showToast("Please fill in all fields", "warning");
      return;
    }

    const method = editId ? "PUT" : "POST";
    const url = editId
      ? `${API}/menu-ingredients/${editId}`
      : `${API}/menu-ingredients`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          menu_id: Number(menuId),
          stock_item_id: Number(stockItemId),
          quantity: Number(quantity),
        }),
      });

      const data = await res.json();

      setMessage(data.message ?? "Saved");
      showToast(data.message ?? (editId ? "Ingredient updated" : "Ingredient added"), "success");

      resetForm();
      fetchIngredients();
    } catch (error: any) {
      showToast(error.message || "Failed to save ingredient", "error");
    }
  };

  const handleEdit = (item: any) => {
    const stock = stockItems.find((s) => s.id === item.stock_item_id);

    setEditId(item.id);
    setStockItemId(String(item.stock_item_id));
    setQuantity(String(item.quantity));
    setSearch(stock?.name ?? "");

    showToast(`Editing ${stock?.name}`, "info");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async () => {
    if (!editId) return;

    const confirmed = await showModal(
      "Delete Ingredient",
      "Are you sure you want to remove this ingredient from the menu?",
      "warning"
    );

    if (!confirmed) return;

    try {
      await fetch(`${API}/menu-ingredients/${editId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage("Ingredient deleted");
      showToast("Ingredient deleted successfully", "success");

      resetForm();
      fetchIngredients();
    } catch (error: any) {
      showToast(error.message || "Failed to delete ingredient", "error");
    }
  };

  const formatQuantity = (q: number) => {
    return Number(q)
      .toFixed(4)
      .replace(/\.?0+$/, "");
  };

  const formatMoney = (value: number) => {
    return `KES ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStockCost = (stock: any) => {
    return Number(
      stock?.cost_price ??
      stock?.unit_cost ??
      stock?.price ??
      0
    );
  };

  // 🔥 COST CALCULATIONS
  const costAnalysis = useMemo(() => {
    let totalCost = 0;

    const items = ingredients.map((item) => {
      const stock = stockItems.find(
        (s) => s.id === item.stock_item_id
      );

      const unitCost = getStockCost(stock);
      const itemCost = unitCost * Number(item.quantity);

      totalCost += itemCost;

      return {
        ...item,
        stock,
        unitCost,
        itemCost,
      };
    });

    const sellingPrice = Number(menu?.price ?? 0);
    const profit = sellingPrice - totalCost;
    const margin = sellingPrice > 0
      ? (profit / sellingPrice) * 100
      : 0;

    return {
      items,
      totalCost,
      sellingPrice,
      profit,
      margin,
    };
  }, [ingredients, stockItems, menu]);

  const selectedStock = getSelectedStock();

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

  return (
    <div className={`p-6 space-y-6 pb-40 transition-colors duration-300 ${
      theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
    }`}>
      <button
        onClick={() => router.push("/admin/menus")}
        className={`px-4 py-2 rounded-lg transition-all duration-300 ${
          theme === "dark"
            ? "bg-gray-700 hover:bg-gray-600 text-white"
            : "bg-gray-700 hover:bg-gray-600 text-white"
        }`}
      >
        ← Back to Menus
      </button>

      <h1 className="text-3xl font-bold">
        {menu?.name} Ingredients
      </h1>

      {/* 🔥 SUMMARY PANEL */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl shadow transition-colors duration-300 ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}>
          <p className={theme === "dark" ? "text-gray-400" : "text-gray-500"}>Production Cost</p>
          <p className="text-xl font-bold">
            {formatMoney(costAnalysis.totalCost)}
          </p>
        </div>

        <div className={`p-4 rounded-xl shadow transition-colors duration-300 ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}>
          <p className={theme === "dark" ? "text-gray-400" : "text-gray-500"}>Selling Price</p>
          <p className="text-xl font-bold">
            {formatMoney(costAnalysis.sellingPrice)}
          </p>
        </div>

        <div className={`p-4 rounded-xl shadow transition-colors duration-300 ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}>
          <p className={theme === "dark" ? "text-gray-400" : "text-gray-500"}>Profit</p>
          <p className={`text-xl font-bold ${costAnalysis.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatMoney(costAnalysis.profit)}
          </p>
        </div>

        <div className={`p-4 rounded-xl shadow transition-colors duration-300 ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}>
          <p className={theme === "dark" ? "text-gray-400" : "text-gray-500"}>Margin</p>
          <p className="text-xl font-bold">
            {costAnalysis.margin.toFixed(2)}%
          </p>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg border ${
          theme === "dark"
            ? "bg-gray-800 border-gray-700 text-gray-300"
            : "bg-gray-100 border-gray-300 text-gray-700"
        }`}>
          {message}
        </div>
      )}

      {/* FORM */}
      <div className={`rounded-xl shadow-lg p-6 transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-800" : "bg-white"
      }`}>
        <h2 className={`text-xl font-semibold mb-6 ${
          theme === "dark" ? "text-white" : "text-black"
        }`}>
          {editId ? "Edit Ingredient" : "Add Ingredient"}
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-6">
          <div className="flex flex-col relative" ref={dropdownRef}>
            <label className={`font-semibold mb-1 ${theme === "dark" ? "text-gray-300" : "text-black"}`}>
              Stock Item
            </label>

            <input
              type="text"
              placeholder="Search stock item..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
              className={`border rounded-lg p-2 transition-colors duration-300 ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-black"
              } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              required
            />

            {dropdownOpen && (
              <div className={`absolute top-full left-0 w-full border rounded-lg shadow-md max-h-60 overflow-y-auto z-50 ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600"
                  : "bg-white border-gray-300"
              }`}>
                {filteredItems.map((item: any) => (
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

          <div className="flex flex-col">
            <label className={`font-semibold mb-1 ${theme === "dark" ? "text-gray-300" : "text-black"}`}>
              Quantity {selectedStock ? `(${selectedStock.unit_of_measure})` : ""}
            </label>

            <input
              className={`border rounded-lg p-2 transition-colors duration-300 ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-black"
              } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              required
            />
          </div>

          <div className="flex items-end gap-3">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300"
            >
              {editId ? "Update" : "Add"}
            </button>

            {editId && (
              <>
                <button
                  type="button"
                  onClick={resetForm}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                    theme === "dark"
                      ? "bg-gray-600 hover:bg-gray-500 text-white"
                      : "bg-gray-400 hover:bg-gray-500 text-white"
                  }`}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all duration-300"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </form>
      </div>

      {/* 🔥 INGREDIENT CARDS WITH COST */}
      {costAnalysis.items.length === 0 ? (
        <div className={`text-center py-16 rounded-xl ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}>
          <p className={theme === "dark" ? "text-gray-400" : "text-gray-500"}>
            No ingredients added yet. Add your first ingredient using the form above.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-4 gap-4">
          {costAnalysis.items.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl shadow-lg p-4 hover:shadow-xl transition-all duration-300 cursor-pointer ${
                theme === "dark"
                  ? "bg-gray-800 hover:bg-gray-700"
                  : "bg-white hover:shadow-xl"
              }`}
              onClick={() => handleEdit(item)}
            >
              <h3 className={`font-bold text-lg ${theme === "dark" ? "text-white" : "text-black"}`}>
                {item.stock?.name ?? "Unknown"}
              </h3>

              <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                {formatQuantity(item.quantity)} {item.stock?.unit_of_measure}
              </p>

              <p className="text-sm font-semibold text-indigo-600">
                Production Cost: {formatMoney(item.itemCost)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}