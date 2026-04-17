"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/context/theme-context";
import { useToast } from "@/app/context/toast-context";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

interface Movement {
  id: number;
  type: string;
  quantity: number;
  old_quantity: number;  // Changed from 'before'
  new_quantity: number;  // Changed from 'after'
  order_id?: number | null;
  created_at: string;
  reason?: string;
  reference?: string;
  performed_by?: number;
  stock?: {
    stock_item?: {
      name: string;
      unit_of_measure: string;
    };
  };
}

interface Stats {
  totalMovements: number;
  totalDeductions: number;
  totalAdditions: number;
  uniqueItems: number;
}

export default function StockMovementsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState<Stats>({
    totalMovements: 0,
    totalDeductions: 0,
    totalAdditions: 0,
    uniqueItems: 0,
  });

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const calculateStats = (movementsData: Movement[]) => {
    // Updated to match new type names
    const deductions = movementsData
      .filter(m => m.type === "DEDUCTION" || m.type === "ADJUSTMENT" || m.type === "OUT")
      .reduce((sum, m) => sum + Number(m.quantity), 0);
    
    const additions = movementsData
      .filter(m => m.type === "PURCHASE" || m.type === "RESTORATION" || m.type === "IN")
      .reduce((sum, m) => sum + Number(m.quantity), 0);
    
    const uniqueItems = new Set(
      movementsData.map(m => m.stock?.stock_item?.name).filter(Boolean)
    ).size;

    setStats({
      totalMovements: movementsData.length,
      totalDeductions: deductions,
      totalAdditions: additions,
      uniqueItems: uniqueItems,
    });
  };

  const fetchMovements = async () => {
    if (!token) {
      showToast("Please login to view stock movements", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/stock-movements`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          showToast("Session expired. Please login again.", "error");
          router.push("/login");
          return;
        }
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      const movementsData = data.data ?? data;
      const movementsArray = Array.isArray(movementsData) ? movementsData : [];
      
      setMovements(movementsArray);
      calculateStats(movementsArray);
      
      if (movementsArray.length === 0) {
        showToast("No stock movements found", "info");
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      showToast(err.message || "Failed to load stock movements", "error");
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMovements();
    } else {
      router.push("/login");
    }
  }, []);

  const getTypeStyle = (type: string) => {
    const typeUpper = type?.toUpperCase();
    
    switch (typeUpper) {
      case "DEDUCTION":
      case "OUT":
        return {
          bg: "bg-red-100 dark:bg-red-900/30",
          text: "text-red-700 dark:text-red-300",
          badge: "bg-red-500",
          icon: "📉",
          label: "Stock Out"
        };
      case "RESTORATION":
        return {
          bg: "bg-yellow-100 dark:bg-yellow-900/30",
          text: "text-yellow-700 dark:text-yellow-300",
          badge: "bg-yellow-500",
          icon: "↩️",
          label: "Restored"
        };
      case "PURCHASE":
      case "IN":
        return {
          bg: "bg-green-100 dark:bg-green-900/30",
          text: "text-green-700 dark:text-green-300",
          badge: "bg-green-500",
          icon: "📦",
          label: "Stock In"
        };
      case "ADJUSTMENT":
        return {
          bg: "bg-blue-100 dark:bg-blue-900/30",
          text: "text-blue-700 dark:text-blue-300",
          badge: "bg-blue-500",
          icon: "⚙️",
          label: "Adjustment"
        };
      default:
        return {
          bg: "bg-gray-100 dark:bg-gray-700",
          text: "text-gray-700 dark:text-gray-300",
          badge: "bg-gray-500",
          icon: "📊",
          label: type || "Unknown"
        };
    }
  };

  const getFilterButtonStyle = (buttonFilter: string) => {
    const isActive = filter === buttonFilter;
    const baseStyle = "px-4 py-2 rounded-lg transition-all duration-200 font-medium";
    
    if (isActive) {
      if (buttonFilter === "deduction") return `${baseStyle} bg-red-600 text-white shadow-lg shadow-red-500/30`;
      if (buttonFilter === "purchase") return `${baseStyle} bg-green-600 text-white shadow-lg shadow-green-500/30`;
      if (buttonFilter === "today") return `${baseStyle} bg-indigo-600 text-white shadow-lg shadow-indigo-500/30`;
      if (buttonFilter === "week") return `${baseStyle} bg-purple-600 text-white shadow-lg shadow-purple-500/30`;
      return `${baseStyle} bg-gray-800 dark:bg-gray-700 text-white`;
    }
    
    return `${baseStyle} ${
      theme === "dark" 
        ? "bg-gray-800 text-gray-300 hover:bg-gray-700" 
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`;
  };

  const filteredMovements = movements.filter((m) => {
    // Apply type filter - updated to match new type names
    if (filter === "deduction" && !["DEDUCTION", "OUT"].includes(m.type)) return false;
    if (filter === "purchase" && !["PURCHASE", "IN", "RESTORATION"].includes(m.type)) return false;
    if (filter === "today") {
      const today = new Date().toDateString();
      if (new Date(m.created_at).toDateString() !== today) return false;
    }
    if (filter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      if (new Date(m.created_at) < weekAgo) return false;
    }
    
    // Apply search filter
    if (searchTerm) {
      const itemName = m.stock?.stock_item?.name?.toLowerCase() || "";
      const type = m.type?.toLowerCase() || "";
      const reason = m.reason?.toLowerCase() || "";
      const reference = m.reference?.toLowerCase() || "";
      const search = searchTerm.toLowerCase();
      return itemName.includes(search) || 
             type.includes(search) || 
             reason.includes(search) || 
             reference.includes(search);
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
          <p className={`mt-4 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            Loading stock movements...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                Stock Movements
              </h1>
              <p className={`mt-2 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                Track and monitor all inventory changes with complete audit trail
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={fetchMovements}
                className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                  theme === "dark"
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                } shadow-lg shadow-indigo-500/30`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              
              <button
                onClick={() => router.push("/admin/stocks")}
                className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                  theme === "dark"
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Stocks
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`rounded-xl p-6 transition-all duration-300 hover:scale-105 ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          } shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                  Total Movements
                </p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">
                  {stats.totalMovements}
                </p>
              </div>
              <div className="h-12 w-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-6 transition-all duration-300 hover:scale-105 ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          } shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                  Items Affected
                </p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {stats.uniqueItems}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-6 transition-all duration-300 hover:scale-105 ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          } shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                  Total Deductions
                </p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {stats.totalDeductions.toFixed(2)}
                </p>
              </div>
              <div className="h-12 w-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-6 transition-all duration-300 hover:scale-105 ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          } shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                  Total Additions
                </p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {stats.totalAdditions.toFixed(2)}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setFilter("all")} className={getFilterButtonStyle("all")}>
              All
            </button>
            <button onClick={() => setFilter("today")} className={getFilterButtonStyle("today")}>
              Today
            </button>
            <button onClick={() => setFilter("week")} className={getFilterButtonStyle("week")}>
              This Week
            </button>
            <button onClick={() => setFilter("deduction")} className={getFilterButtonStyle("deduction")}>
              Stock Out
            </button>
            <button onClick={() => setFilter("purchase")} className={getFilterButtonStyle("purchase")}>
              Stock In
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by item name, movement type, reason, or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full px-4 py-2 pl-10 rounded-lg transition-colors duration-200 ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-indigo-500"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500"
              } border focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Movements Table */}
        <div className={`rounded-xl overflow-hidden shadow-lg transition-colors duration-300 ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={theme === "dark" ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Item</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Before</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">After</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Reference</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredMovements.length === 0 && (
                  <tr>
                    <td colSpan={7} className={`px-6 py-12 text-center ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}>
                      <div className="flex flex-col items-center gap-2">
                        <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p>No stock movements found</p>
                        <p className="text-sm">Try adjusting your filters or search term</p>
                      </div>
                    </td>
                  </tr>
                )}
                
                {filteredMovements.map((movement, index) => {
                  const typeStyle = getTypeStyle(movement.type);
                  const date = new Date(movement.created_at);
                  const isToday = date.toDateString() === new Date().toDateString();
                  const itemName = movement.stock?.stock_item?.name ?? "Unknown Item";
                  const unit = movement.stock?.stock_item?.unit_of_measure ?? "units";
                  const isDeduction = ["DEDUCTION", "OUT"].includes(movement.type);
                  const quantityChange = isDeduction ? "-" : "+";
                  const quantityColor = isDeduction ? "text-red-600" : "text-green-600";
                  
                  return (
                    <tr
                      key={movement.id}
                      className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                        index % 2 === 0 ? (theme === "dark" ? "bg-gray-800/50" : "bg-white") : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium">{itemName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{unit}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${typeStyle.bg} ${typeStyle.text}`}>
                          <span>{typeStyle.icon}</span>
                          <span>{typeStyle.label}</span>
                        </span>
                        {movement.reason && (
                          <div className="text-xs text-gray-400 mt-1">{movement.reason}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${quantityColor}`}>
                          {quantityChange} {Number(movement.quantity).toFixed(2)} {unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {Number(movement.old_quantity).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {Number(movement.new_quantity).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        {movement.reference ? (
                          <span className="inline-flex items-center gap-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {movement.reference}
                          </span>
                        ) : movement.order_id ? (
                          <span className="inline-flex items-center gap-1">
                            <svg className="h-4 w-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            #{movement.order_id}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className={isToday ? "font-semibold text-indigo-600 dark:text-indigo-400" : ""}>
                            {date.toLocaleDateString()}
                          </span>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {date.toLocaleTimeString()}
                          </div>
                        </div>
                        {isToday && (
                          <span className="inline-block mt-1 text-xs bg-green-500 text-white px-1.5 py-0.5 rounded">
                            Today
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Summary */}
        {filteredMovements.length > 0 && (
          <div className={`mt-6 p-4 rounded-lg text-center transition-colors duration-300 ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          } shadow-md`}>
            <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
              Showing <span className="font-semibold text-indigo-600">{filteredMovements.length}</span>{" "}
              movement{filteredMovements.length !== 1 ? "s" : ""}
              {searchTerm && ` matching "${searchTerm}"`}
              {filter === "deduction" && ` of type Stock Out`}
              {filter === "purchase" && ` of type Stock In`}
              {(filter === "today" || filter === "week") && ` for ${filter === "today" ? "today" : "this week"}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}