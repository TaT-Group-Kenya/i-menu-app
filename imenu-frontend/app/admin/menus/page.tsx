"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/app/context/theme-context";
import { useModal } from "@/app/context/modal-context";
import { useToast } from "@/app/context/toast-context";

const API = "http://localhost:8000/api";

export default function MenusPage() {
  const { theme } = useTheme();
  const { showModal } = useModal();
  const { showToast } = useToast();

  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, []);

  const fetchMenus = async (authToken: string) => {
    try {
      const res = await fetch(`${API}/menus`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch menus");
      }

      const data = await res.json();
      setMenus(data);
    } catch (error: any) {
      showToast(error.message || "Failed to load menus", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchMenus(token);
  }, [token]);

  async function handleDeleteMenu(menuId: number, menuName: string) {
    const confirmed = await showModal(
      "Delete Menu",
      `Are you sure you want to delete "${menuName}"? This action cannot be undone.`,
      "warning"
    );

    if (confirmed) {
      try {
        const res = await fetch(`${API}/menus/${menuId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to delete menu");
        }

        showToast(`"${menuName}" has been deleted successfully`, "success");
        // Refresh the menu list
        if (token) fetchMenus(token);
      } catch (error: any) {
        showToast(error.message || "Failed to delete menu", "error");
      }
    }
  }

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
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1
          className={`text-3xl font-bold transition-colors duration-300 ${
            theme === "dark" ? "text-white" : "text-black"
          }`}
        >
          Menus
        </h1>

        <Link href="/admin/menus/create">
          <button
            className={`px-5 py-2 rounded-lg font-semibold transition-all duration-300 hover:scale-105 ${
              theme === "dark"
                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                : "bg-black hover:bg-gray-800 text-white"
            }`}
          >
            + Add Menu
          </button>
        </Link>
      </div>

      {/* Menu Cards */}
      {menus.length === 0 ? (
        <div
          className={`text-center py-16 rounded-xl ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          }`}
        >
          <p className={theme === "dark" ? "text-gray-400" : "text-gray-500"}>
            No menus found. Click "Add Menu" to create your first menu item.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {menus.map((menu: any) => (
            <div key={menu.id} className="relative group">
              <Link href={`/admin/menus/${menu.id}/ingredients`}>
                <div
                  className={`p-6 rounded-xl shadow hover:shadow-xl transition-all duration-300 cursor-pointer ${
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
                </div>
              </Link>

              {/* Delete button - optional, remove if not needed */}
              <button
                onClick={() => handleDeleteMenu(menu.id, menu.name)}
                className={`absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                  theme === "dark"
                    ? "hover:bg-gray-700 text-gray-400 hover:text-red-400"
                    : "hover:bg-gray-100 text-gray-500 hover:text-red-600"
                }`}
                title="Delete menu"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}