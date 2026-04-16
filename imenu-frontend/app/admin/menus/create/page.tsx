"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/context/theme-context";
import { useModal } from "@/app/context/modal-context";
import { useToast } from "@/app/context/toast-context";

const API = "http://localhost:8000/api";

export default function ManageMenusPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { showModal } = useModal();
  const { showToast } = useToast();

  const [menus, setMenus] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  const fetchMenus = async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API}/menus`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to fetch menus");

      const data = await res.json();
      setMenus(data);
    } catch (error: any) {
      showToast(error.message || "Failed to load menus", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const resetForm = () => {
    setName("");
    setPrice("");
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!token) return;

    if (!name.trim()) {
      showToast("Menu name is required", "warning");
      return;
    }

    if (!price || Number(price) <= 0) {
      showToast("Please enter a valid price", "warning");
      return;
    }

    const url = editingId ? `${API}/menus/${editingId}` : `${API}/menus`;
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          price: Number(price),
        }),
      });

      if (!res.ok) throw new Error("Failed to save menu");

      showToast(
        editingId ? "Menu updated successfully" : "Menu created successfully",
        "success"
      );
      resetForm();
      fetchMenus();
    } catch (error: any) {
      showToast(error.message || "Failed to save menu", "error");
    }
  };

  const handleEdit = (menu: any) => {
    setEditingId(menu.id);
    setName(menu.name);
    setPrice(menu.price);
    setSelectedMenu(null);
    showToast(`Editing "${menu.name}"`, "info");
  };

  const handleDelete = async (id: number, menuName: string) => {
    const confirmed = await showModal(
      "Delete Menu",
      `Are you sure you want to delete "${menuName}"? This action cannot be undone.`,
      "warning"
    );

    if (!confirmed) return;

    if (!token) return;

    try {
      const res = await fetch(`${API}/menus/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to delete menu");

      showToast(`"${menuName}" has been deleted`, "success");
      fetchMenus();
      setSelectedMenu(null);
    } catch (error: any) {
      showToast(error.message || "Failed to delete menu", "error");
    }
  };

  if (loading) {
    return (
      <div className={`p-6 ${theme === "dark" ? "text-gray-400" : "text-black"}`}>
        <div className="flex items-center gap-2">
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
          Loading menus...
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-8 min-h-screen transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-900" : "bg-gray-100"
      }`}
    >
      <div className="flex justify-between mb-8">
        <h1
          className={`text-3xl font-bold transition-colors duration-300 ${
            theme === "dark" ? "text-white" : "text-black"
          }`}
        >
          Manage Menus
        </h1>

        <button
          onClick={() => router.push("/admin/menus")}
          className={`px-5 py-2 rounded-lg font-semibold transition-all duration-300 ${
            theme === "dark"
              ? "bg-gray-700 hover:bg-gray-600 text-white"
              : "bg-gray-800 hover:bg-gray-700 text-white"
          }`}
        >
          Back
        </button>
      </div>

      {/* FORM */}
      <div
        className={`p-6 rounded-xl shadow mb-10 space-y-4 max-w-md transition-colors duration-300 ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}
      >
        <h2
          className={`text-xl font-bold transition-colors duration-300 ${
            theme === "dark" ? "text-white" : "text-black"
          }`}
        >
          {editingId ? "Edit Menu" : "Create Menu"}
        </h2>

        <input
          type="text"
          placeholder="Menu Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`w-full border rounded-lg p-2 transition-colors duration-300 ${
            theme === "dark"
              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              : "bg-white border-gray-300 text-black"
          } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
        />

        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className={`w-full border rounded-lg p-2 transition-colors duration-300 ${
            theme === "dark"
              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              : "bg-white border-gray-300 text-black"
          } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
        />

        <button
          onClick={handleSubmit}
          className={`w-full px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
            theme === "dark"
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : "bg-gray-800 hover:bg-gray-700 text-white"
          }`}
        >
          {editingId ? "Update Menu" : "Create Menu"}
        </button>
      </div>

      {/* MENU CARDS */}
      {menus.length === 0 ? (
        <div
          className={`text-center py-16 rounded-xl ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          }`}
        >
          <p className={theme === "dark" ? "text-gray-400" : "text-gray-500"}>
            No menus found. Create your first menu using the form above.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {menus.map((menu: any) => (
            <div
              key={menu.id}
              onClick={() => setSelectedMenu(menu.id)}
              className={`p-6 rounded-xl shadow hover:shadow-lg cursor-pointer transition-all duration-300 ${
                theme === "dark"
                  ? "bg-gray-800 hover:bg-gray-700"
                  : "bg-white hover:shadow-xl"
              }`}
            >
              <h2
                className={`text-xl font-bold transition-colors duration-300 ${
                  theme === "dark" ? "text-white" : "text-black"
                }`}
              >
                {menu.name}
              </h2>

              <p
                className={`mt-2 transition-colors duration-300 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Price: KES {Number(menu.price).toLocaleString()}
              </p>

              {/* ACTION BUTTONS */}
              {selectedMenu === menu.id && (
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(menu);
                    }}
                    className={`px-3 py-1 rounded transition-all duration-300 ${
                      theme === "dark"
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                        : "bg-gray-800 hover:bg-gray-700 text-white"
                    }`}
                  >
                    Edit
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(menu.id, menu.name);
                    }}
                    className={`px-3 py-1 rounded transition-all duration-300 ${
                      theme === "dark"
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-red-600 hover:bg-red-700 text-white"
                    }`}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}