"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "@/app/context/theme-context";
import { useModal } from "@/app/context/modal-context";
import { useToast } from "@/app/context/toast-context";
import { useEffect, useState } from "react";
import api from "@/app/lib/api";

interface Order {
  id: number;
  status: string;
  total: string;
}

interface Menu {
  id: number;
}

interface Stock {
  id: number;
  quantity: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const { showModal } = useModal();
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Stats state
  const [stats, setStats] = useState({
    totalMenus: 0,
    totalStocks: 0,
    totalOrders: 0,
    paidOrders: 0,
    cancelledOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    setMounted(true);
    
    // Check if user is admin
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token) {
      router.push('/login');
      return;
    }
    
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'ADMIN') {
        showModal('Access Denied', 'You do not have permission to access this page.', 'error');
        router.push('/login');
        return;
      }
      setUser(parsedUser);
      showToast(`Welcome back, ${parsedUser.name}!`, 'success');
      fetchStats();
    }
  }, [router, showModal, showToast]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch orders
      const ordersRes = await api.get("/orders");
      const orders: Order[] = ordersRes.data;
      
      // Fetch menus
      const menusRes = await api.get("/menus");
      const menus: Menu[] = menusRes.data;
      
      // Fetch stocks
      const stocksRes = await api.get("/stocks");
      const stocks: Stock[] = stocksRes.data;
      
      // Calculate order stats
      const paidOrders = orders.filter(order => order.status === "PAID");
      const cancelledOrders = orders.filter(order => order.status === "CANCELLED");
      const pendingOrders = orders.filter(order => order.status !== "PAID" && order.status !== "CANCELLED");
      
      // Calculate total revenue (only from paid orders)
      const totalRevenue = paidOrders.reduce((sum, order) => sum + Number(order.total), 0);
      
      // Calculate total stock quantity
      const totalStocks = stocks.reduce((sum, stock) => sum + Number(stock.quantity), 0);
      
      setStats({
        totalMenus: menus.length,
        totalStocks: totalStocks,
        totalOrders: orders.length,
        paidOrders: paidOrders.length,
        cancelledOrders: cancelledOrders.length,
        pendingOrders: pendingOrders.length,
        totalRevenue: totalRevenue,
      });
      
    } catch (error: any) {
      console.error("Failed to fetch stats:", error);
      showToast(error.message || "Failed to load dashboard statistics", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className={`transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="max-w-6xl mx-auto py-10 px-6 space-y-12">
        
        {/* HEADER */}
        <div>
          <h1 className={`text-4xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            Admin Dashboard
          </h1>
          <p className={`mt-2 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Welcome back, {user?.name || 'Admin'}! Full system management control panel
          </p>
        </div>

        {/* STATS CARDS - Now with real data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Menus */}
          <div className={`rounded-xl p-6 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } shadow-lg transition-all duration-300 hover:scale-105`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>Total Menus</p>
                {loading ? (
                  <div className="h-8 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mt-1"></div>
                ) : (
                  <p className="text-2xl font-bold text-indigo-600">{stats.totalMenus}</p>
                )}
              </div>
              <svg className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </div>
          </div>

          {/* Total Stocks */}
          <div className={`rounded-xl p-6 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } shadow-lg transition-all duration-300 hover:scale-105`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>Total Stocks (Units)</p>
                {loading ? (
                  <div className="h-8 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mt-1"></div>
                ) : (
                  <p className="text-2xl font-bold text-emerald-600">{stats.totalStocks.toLocaleString()}</p>
                )}
              </div>
              <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>

          {/* Total Orders */}
          <div className={`rounded-xl p-6 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } shadow-lg transition-all duration-300 hover:scale-105`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>Total Orders</p>
                {loading ? (
                  <div className="h-8 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mt-1"></div>
                ) : (
                  <p className="text-2xl font-bold text-purple-600">{stats.totalOrders}</p>
                )}
              </div>
              <svg className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            {!loading && stats.totalOrders > 0 && (
              <div className="mt-2 flex gap-2 text-xs">
                <span className="text-green-600">Paid: {stats.paidOrders}</span>
                <span className="text-yellow-600">Pending: {stats.pendingOrders}</span>
                <span className="text-red-600">Cancelled: {stats.cancelledOrders}</span>
              </div>
            )}
          </div>

          {/* Total Revenue */}
          <div className={`rounded-xl p-6 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } shadow-lg transition-all duration-300 hover:scale-105`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>Total Revenue</p>
                {loading ? (
                  <div className="h-8 w-24 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mt-1"></div>
                ) : (
                  <p className="text-2xl font-bold text-green-600">
                    KES {stats.totalRevenue.toLocaleString()}
                  </p>
                )}
              </div>
              <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Order Status Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Paid Orders */}
          <div 
            onClick={() => router.push("/admin/orders")}
            className={`rounded-xl p-6 cursor-pointer transition-all duration-300 hover:scale-105 ${
              theme === 'dark' ? 'bg-green-900/30 border border-green-800' : 'bg-green-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-green-400' : 'text-green-600'
                }`}>Paid Orders</p>
                {loading ? (
                  <div className="h-8 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mt-1"></div>
                ) : (
                  <p className="text-2xl font-bold text-green-600">{stats.paidOrders}</p>
                )}
              </div>
              <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* Pending Orders */}
          <div 
            onClick={() => router.push("/admin/orders")}
            className={`rounded-xl p-6 cursor-pointer transition-all duration-300 hover:scale-105 ${
              theme === 'dark' ? 'bg-yellow-900/30 border border-yellow-800' : 'bg-yellow-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
                }`}>Pending Orders</p>
                {loading ? (
                  <div className="h-8 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mt-1"></div>
                ) : (
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</p>
                )}
              </div>
              <svg className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* Cancelled Orders */}
          <div 
            onClick={() => router.push("/admin/orders")}
            className={`rounded-xl p-6 cursor-pointer transition-all duration-300 hover:scale-105 ${
              theme === 'dark' ? 'bg-red-900/30 border border-red-800' : 'bg-red-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-red-400' : 'text-red-600'
                }`}>Cancelled Orders</p>
                {loading ? (
                  <div className="h-8 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mt-1"></div>
                ) : (
                  <p className="text-2xl font-bold text-red-600">{stats.cancelledOrders}</p>
                )}
              </div>
              <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* GRID CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* Menus */}
          <div
            onClick={() => router.push("/admin/menus")}
            className="bg-linear-to-r from-blue-500 to-blue-700 text-white p-8 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition duration-300 cursor-pointer flex flex-col justify-between min-h-40"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-semibold">
                  🍽 Manage Menus
                </h2>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-blue-100">
                Add, edit and delete menu items.
              </p>
            </div>
            <span className="text-blue-200 mt-4 text-sm">
              Open →
            </span>
          </div>

          {/* Stocks */}
          <div
            onClick={() => router.push("/admin/stocks")}
            className="bg-linear-to-r from-emerald-500 to-emerald-700 text-white p-8 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition duration-300 cursor-pointer flex flex-col justify-between min-h-40"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-semibold">
                  📦 Manage Stocks
                </h2>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-emerald-100">
                Monitor and update stock levels.
              </p>
            </div>
            <span className="text-emerald-200 mt-4 text-sm">
              Open →
            </span>
          </div>

          {/* Stock Items */}
          <div
            onClick={() => router.push("/admin/stock-items")}
            className="bg-linear-to-r from-teal-500 to-teal-700 text-white p-8 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition duration-300 cursor-pointer flex flex-col justify-between min-h-40"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-semibold">
                  🗃 Stock Items
                </h2>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-teal-100">
                Control individual stock entries.
              </p>
            </div>
            <span className="text-teal-200 mt-4 text-sm">
              Open →
            </span>
          </div>

          {/* Orders */}
          <div
            onClick={() => router.push("/admin/orders")}
            className="bg-linear-to-r from-purple-500 to-purple-700 text-white p-8 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition duration-300 cursor-pointer flex flex-col justify-between min-h-40"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-semibold">
                  🧾 Orders
                </h2>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-purple-100">
                View and track all orders.
              </p>
            </div>
            <span className="text-purple-200 mt-4 text-sm">
              Open →
            </span>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div>
          <h2 className={`text-xl font-semibold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            Recent Activity
          </h2>
          <div className={`rounded-xl p-6 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } shadow-lg`}>
            <div className="space-y-4">
              <div className={`flex items-center space-x-3 p-3 rounded-lg ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              } transition-colors`}>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    Welcome to your admin dashboard
                  </p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    Just now
                  </p>
                </div>
              </div>
              <div className={`flex items-center space-x-3 p-3 rounded-lg ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              } transition-colors`}>
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    System ready. Start managing your restaurant!
                  </p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    Just now
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}