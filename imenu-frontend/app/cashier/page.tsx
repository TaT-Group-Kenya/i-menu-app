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
  created_at: string;
}

export default function CashierDashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const { showModal } = useModal();
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayOrders: 0,
    pendingOrders: 0,
  });

  useEffect(() => {
    setMounted(true);
    
    // Check if user is cashier
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token) {
      router.push('/login');
      return;
    }
    
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'CASHIER') {
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
      
      // Get today's date (start of day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Calculate today's orders
      const todayOrdersList = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= today;
      });
      
      // Calculate pending orders (not PAID and not CANCELLED)
      const pendingOrdersList = orders.filter(order => 
        order.status !== "PAID" && order.status !== "CANCELLED"
      );
      
      setStats({
        todayOrders: todayOrdersList.length,
        pendingOrders: pendingOrdersList.length,
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
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
    }`}>
      <div className="p-8">
        {/* HEADER */}
        <div className="mb-10">
          <h1 className={`text-3xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Cashier Dashboard
          </h1>
          <p className={`mt-1 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Welcome back, {user?.name || 'Cashier'}! Quick access to orders and sales
          </p>
        </div>

        {/* STATS CARDS - Removed Today's Revenue as requested */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Today's Orders */}
          <div className={`rounded-xl p-6 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } shadow-lg transition-all duration-300 hover:scale-105`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>Today's Orders</p>
                {loading ? (
                  <div className="h-8 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mt-1"></div>
                ) : (
                  <p className="text-2xl font-bold text-indigo-600">{stats.todayOrders}</p>
                )}
              </div>
              <svg className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            {!loading && stats.todayOrders > 0 && (
              <div className="mt-2 text-xs text-green-600">
                {stats.todayOrders} order{stats.todayOrders !== 1 ? 's' : ''} today
              </div>
            )}
          </div>

          {/* Pending Orders */}
          <div 
            onClick={() => router.push("/cashier/orders")}
            className={`rounded-xl p-6 cursor-pointer ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } shadow-lg transition-all duration-300 hover:scale-105 ${
              stats.pendingOrders > 0 ? 'ring-2 ring-yellow-500' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>Pending Orders</p>
                {loading ? (
                  <div className="h-8 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mt-1"></div>
                ) : (
                  <p className={`text-2xl font-bold ${
                    stats.pendingOrders > 0 ? 'text-yellow-600' : 'text-gray-500'
                  }`}>
                    {stats.pendingOrders}
                  </p>
                )}
              </div>
              <svg className={`h-8 w-8 ${
                stats.pendingOrders > 0 ? 'text-yellow-500' : 'text-gray-400'
              }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            {!loading && stats.pendingOrders > 0 && (
              <div className="mt-2 text-xs text-yellow-600">
                {stats.pendingOrders} order{stats.pendingOrders !== 1 ? 's' : ''} need attention
              </div>
            )}
          </div>
        </div>

        {/* ACTION CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* ORDER DETAILS CARD */}
          <div
            onClick={() => router.push("/cashier/orders")}
            className={`p-10 rounded-2xl shadow-lg cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ${
              theme === 'dark' 
                ? 'bg-gray-800 hover:bg-gray-700' 
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className={`text-2xl font-bold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Order Details
                </h2>
                <p className={`${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  View all orders, statuses, and transaction history
                </p>
              </div>
              <svg className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="mt-4">
              <span className="text-indigo-500 text-sm font-medium">View Orders →</span>
            </div>
          </div>

          {/* CREATE ORDER CARD */}
          <div
            onClick={() => router.push("/cashier/orders/create")}
            className={`p-10 rounded-2xl shadow-lg cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ${
              theme === 'dark' 
                ? 'bg-gray-800 hover:bg-gray-700' 
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className={`text-2xl font-bold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Create Order
                </h2>
                <p className={`${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Start a new order and add items for customers
                </p>
              </div>
              <svg className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="mt-4">
              <span className="text-emerald-500 text-sm font-medium">Create New →</span>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="mt-8">
          <h2 className={`text-xl font-semibold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Recent Activity
          </h2>
          <div className={`rounded-xl p-6 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } shadow-lg`}>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-pulse flex space-x-4">
                  <div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
              </div>
            ) : (
              <>
                {stats.todayOrders === 0 && stats.pendingOrders === 0 ? (
                  <p className={`text-center py-8 ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    No recent activity to display
                  </p>
                ) : (
                  <div className="space-y-3">
                    {stats.todayOrders > 0 && (
                      <div className={`flex items-center space-x-3 p-3 rounded-lg ${
                        theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                      } transition-colors`}>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            {stats.todayOrders} new order{stats.todayOrders !== 1 ? 's' : ''} today
                          </p>
                        </div>
                      </div>
                    )}
                    {stats.pendingOrders > 0 && (
                      <div className={`flex items-center space-x-3 p-3 rounded-lg ${
                        theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                      } transition-colors`}>
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            {stats.pendingOrders} pending order{stats.pendingOrders !== 1 ? 's' : ''} awaiting processing
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}