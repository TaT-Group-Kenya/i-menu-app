"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/sidebar";
import { useTheme } from "@/app/context/theme-context";
import { useModal } from "@/app/context/modal-context";
import { useToast } from "@/app/context/toast-context";
import ThemeToggle from "../components/theme-toggle";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { theme } = useTheme();
  const { showModal } = useModal();
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    
    // Check authentication
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token) {
      router.replace('/login');
      return;
    }
    
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'ADMIN') {
        showModal('Access Denied', 'You do not have permission to access this page.', 'error');
        router.replace('/login');
        return;
      }
      setUser(parsedUser);
      showToast(`Welcome back, ${parsedUser.name}!`, 'success');
    }
  }, [router, showModal, showToast]);

  async function handleLogout() {
    const confirmed = await showModal(
      'Confirm Logout',
      'Are you sure you want to logout?',
      'warning'
    );
    
    if (confirmed) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      showToast('Logged out successfully!', 'success');
      router.replace("/login");
    }
  }

  if (!mounted) return null;

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
    }`}>
      
      {/* Sidebar */}
      <Sidebar role="ADMIN" />

      <div className="flex-1 flex flex-col">
        
        {/* Top Bar - Removed Theme Toggle from here */}
        <div className={`flex justify-between items-center shadow px-8 py-4 transition-colors duration-300 ${
          theme === 'dark' 
            ? 'bg-gray-800 border-b border-gray-700' 
            : 'bg-white'
        }`}>
          {/* Left side - Welcome message */}
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-3 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm font-medium">
                Welcome, {user?.name || 'Admin'}
              </span>
            </div>
          </div>

          {/* Right side - Logout only (Theme Toggle moved to bottom right) */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-semibold transition-all duration-300 hover:scale-105 shadow-md"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Page Content */}
        <main className={`flex-1 p-8 overflow-auto transition-colors duration-300 ${
          theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
        }`}>
          {children}
        </main>

      </div>

      {/* Floating Theme Toggle - Bottom Right */}
      <div className="fixed bottom-6 right-6 z-50">
        <ThemeToggle />
      </div>
    </div>
  );
}