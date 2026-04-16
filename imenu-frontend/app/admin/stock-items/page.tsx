"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/app/context/theme-context";
import { useModal } from "@/app/context/modal-context";
import { useToast } from "@/app/context/toast-context";

const API = "http://127.0.0.1:8000/api";
const CURRENCY = "KES";

type StockItem = {
  id: number;
  name: string;
  unit_of_measure: string;
  unit_cost: number;
  currency: string;
};

export default function StockItemsPage() {
  const { theme } = useTheme();
  const { showModal } = useModal();
  const { showToast } = useToast();

  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [unitOfMeasure, setUnitOfMeasure] = useState("");
  const [unitCost, setUnitCost] = useState<number | "">("");

  const [selectedId, setSelectedId] = useState<number | "">("");
  const [message, setMessage] = useState<string | null>(null);

  const [confirmAction, setConfirmAction] = useState<null | {
    type: "update" | "delete";
  }>(null);

  const getToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  };

  const fetchItems = async () => {
    try {
      const token = getToken();

      const res = await fetch(`${API}/stock-items`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      let itemsArray: StockItem[] = [];

      if (Array.isArray(data)) itemsArray = data;
      else if (Array.isArray(data.data)) itemsArray = data.data;

      itemsArray.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );

      setItems(itemsArray);
    } catch (error) {
      console.error(error);
      showToast("Failed to load stock items", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSelect = (id: number) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    setSelectedId(id);
    setName(item.name);
    setUnitOfMeasure(item.unit_of_measure);
    setUnitCost(item.unit_cost);

    showToast(`Editing "${item.name}"`, "info");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setSelectedId("");
    setName("");
    setUnitOfMeasure("");
    setUnitCost("");
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast("Item name is required", "warning");
      return;
    }

    if (!unitOfMeasure.trim()) {
      showToast("Unit of measure is required", "warning");
      return;
    }

    if (!unitCost || Number(unitCost) <= 0) {
      showToast("Please enter a valid unit cost", "warning");
      return;
    }

    try {
      const token = getToken();

      const res = await fetch(`${API}/stock-items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.toUpperCase(),
          unit_of_measure: unitOfMeasure,
          unit_cost: Number(unitCost),
          currency: CURRENCY,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          const errorMsg = Object.values(data.errors).flat().join(", ");
          setMessage(errorMsg);
          showToast(errorMsg, "error");
          return;
        }
        setMessage(data.message || "Failed to add item");
        showToast(data.message || "Failed to add item", "error");
        return;
      }

      setMessage(data.message || "Stock item added");
      showToast(data.message || "Stock item added successfully", "success");
      resetForm();
      fetchItems();
    } catch {
      setMessage("Unexpected error occurred");
      showToast("Unexpected error occurred", "error");
    }
  };

  const handleConfirmedAction = async () => {
    if (!confirmAction || !selectedId) return;

    try {
      const token = getToken();

      if (confirmAction.type === "update") {
        const res = await fetch(`${API}/stock-items/${selectedId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: name.toUpperCase(),
            unit_of_measure: unitOfMeasure,
            unit_cost: Number(unitCost),
            currency: CURRENCY,
          }),
        });

        const data = await res.json();
        setMessage(data.message || "Updated");
        showToast(data.message || "Stock item updated successfully", "success");
      }

      if (confirmAction.type === "delete") {
        const res = await fetch(`${API}/stock-items/${selectedId}`, {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        setMessage(data.message || "Deleted");
        showToast(data.message || "Stock item deleted successfully", "success");
      }

      setConfirmAction(null);
      resetForm();
      fetchItems();
    } catch {
      setMessage("Action failed");
      showToast("Action failed", "error");
    }
  };

  const handleUpdateClick = async () => {
    const confirmed = await showModal(
      "Confirm Update",
      `Are you sure you want to update "${name}"?`,
      "warning"
    );
    if (confirmed) {
      setConfirmAction({ type: "update" });
      await handleConfirmedAction();
    }
  };

  const handleDeleteClick = async () => {
    const confirmed = await showModal(
      "Confirm Delete",
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      "warning"
    );
    if (confirmed) {
      setConfirmAction({ type: "delete" });
      await handleConfirmedAction();
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
        Loading stock items...
      </div>
    );
  }

  return (
    <div
      className={`p-6 space-y-6 min-h-screen transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stock Items</h1>
          <p className={`text-sm mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
            Manage your inventory stock items
          </p>
        </div>
        <div className={`text-sm px-3 py-1 rounded-full ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
          Total: {items.length} items
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg border ${
            theme === "dark"
              ? "bg-gray-800 border-gray-700 text-gray-300"
              : "bg-gray-100 border-gray-300 text-gray-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* Form */}
      <div
        className={`rounded-xl shadow-lg p-6 transition-colors duration-300 ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}
      >
        <h2
          className={`text-xl font-semibold mb-4 ${
            theme === "dark" ? "text-white" : "text-black"
          }`}
        >
          {selectedId ? "Edit Stock Item" : "Add Stock Item"}
        </h2>

        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* NAME */}
          <div className="flex flex-col">
            <label className={`text-sm font-semibold mb-1 ${theme === "dark" ? "text-gray-300" : "text-black"}`}>
              Item Name
            </label>
            <input
              className={`border rounded-lg p-2 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-black"
              }`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Tomato Sauce"
            />
          </div>

          {/* UNIT */}
          <div className="flex flex-col">
            <label className={`text-sm font-semibold mb-1 ${theme === "dark" ? "text-gray-300" : "text-black"}`}>
              Unit of Measure
            </label>
            <input
              className={`border rounded-lg p-2 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-black"
              }`}
              value={unitOfMeasure}
              onChange={(e) => setUnitOfMeasure(e.target.value)}
              required
              placeholder="e.g., kg, liter, piece"
            />
          </div>

          {/* COST */}
          <div className="flex flex-col">
            <label className={`text-sm font-semibold mb-1 ${theme === "dark" ? "text-gray-300" : "text-black"}`}>
              Unit Cost (KES)
            </label>
            <input
              type="number"
              step="0.01"
              className={`border rounded-lg p-2 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-black"
              }`}
              value={unitCost ?? ""}
              onChange={(e) =>
                setUnitCost(e.target.value === "" ? "" : Number(e.target.value))
              }
              required
              placeholder="0.00"
            />
          </div>

          {/* ACTIONS */}
          <div className="flex items-end">
            {!selectedId ? (
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300"
              >
                Add Item
              </button>
            ) : (
              <div className="flex gap-2 w-full">
                <button
                  type="button"
                  onClick={handleUpdateClick}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300"
                >
                  Update
                </button>

                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300"
                >
                  Delete
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                    theme === "dark"
                      ? "bg-gray-600 hover:bg-gray-500 text-white"
                      : "bg-gray-400 hover:bg-gray-500 text-white"
                  }`}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* LIST - Stock Items Grid */}
      {items.length === 0 ? (
        <div
          className={`text-center py-16 rounded-xl ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          }`}
        >
          <svg
            className="w-16 h-16 mx-auto mb-4 opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <p className={theme === "dark" ? "text-gray-400" : "text-gray-500"}>
            No stock items found
          </p>
          <p className={`text-sm mt-1 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>
            Add your first stock item using the form above
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`cursor-pointer rounded-xl shadow-md p-4 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] ${
                theme === "dark"
                  ? "bg-gray-800 hover:bg-gray-700"
                  : "bg-white hover:shadow-xl"
              }`}
            >
              <h3
                className={`font-bold text-lg ${
                  theme === "dark" ? "text-white" : "text-black"
                }`}
              >
                {item.name}
              </h3>
              <p className={`text-sm mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                {item.unit_of_measure}
              </p>
              <p className={`text-lg font-semibold mt-2 ${
                theme === "dark" ? "text-indigo-400" : "text-indigo-600"
              }`}>
                {item.currency} {Number(item.unit_cost).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}