"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "@/app/context/theme-context";

interface SidebarProps {
  role: "ADMIN" | "CASHIER";
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isAdmin = role === "ADMIN";

  // 🎨 Dynamic styles based on role AND theme
  const sidebarBg = isAdmin
    ? theme === 'dark' 
      ? 'bg-gray-900' 
      : 'bg-gray-900' // Admin always dark sidebar
    : theme === 'dark'
      ? 'bg-gray-800 border-r border-gray-700'
      : 'bg-white border-r border-gray-200';

  const headerBg = isAdmin
    ? "bg-gradient-to-r from-blue-600 to-purple-600"
    : theme === 'dark'
      ? "bg-gradient-to-r from-emerald-600 to-teal-600"
      : "bg-gradient-to-r from-green-600 to-emerald-600";

  const headerText = "text-white";

  const sectionTitle = isAdmin
    ? theme === 'dark' ? "text-gray-500" : "text-gray-500"
    : theme === 'dark' ? "text-gray-500" : "text-gray-500";

  const linkClass = (path: string) => {
    const isActive =
      path === "/admin" || path === "/cashier"
        ? pathname === path
        : pathname.startsWith(path);

    if (isAdmin) {
      // ADMIN STYLES (Dark sidebar)
      return `block px-4 py-2 rounded-lg transition-all duration-200 ${
        isActive
          ? "bg-white/10 text-white font-semibold"
          : "text-gray-400 hover:bg-gray-800 hover:text-white"
      }`;
    }

    // CASHIER STYLES (Adapts to theme)
    if (theme === 'dark') {
      return `block px-4 py-2 rounded-lg transition-all duration-200 ${
        isActive
          ? "bg-emerald-600 text-white font-semibold"
          : "text-gray-300 hover:bg-gray-700 hover:text-white"
      }`;
    }
    
    return `block px-4 py-2 rounded-lg transition-all duration-200 ${
      isActive
        ? "bg-green-600 text-white font-semibold"
        : "text-gray-700 hover:bg-green-100 hover:text-green-700"
    }`;
  };

  const footerStyles = isAdmin
    ? theme === 'dark'
      ? "border-t border-gray-800 text-gray-500"
      : "border-t border-gray-800 text-gray-500"
    : theme === 'dark'
      ? "border-t border-gray-700 text-gray-500"
      : "border-t border-gray-200 text-gray-500";

  return (
    <aside className={`w-72 min-h-screen flex flex-col shadow-xl transition-colors duration-300 ${sidebarBg}`}>
      
      {/* Header */}
      <div className={`${headerBg} p-6`}>
        <h2 className={`text-2xl font-bold ${headerText}`}>
          {isAdmin ? "Admin Panel" : "Cashier Panel"}
        </h2>
        <p className={`${headerText} text-sm mt-1 opacity-90`}>
          {isAdmin ? "System Management" : "Order Management"}
        </p>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-6 space-y-8 overflow-y-auto">

        {/* ADMIN MENU */}
        {isAdmin && (
          <>
            <div>
              <p className={`${sectionTitle} text-xs uppercase mb-3 font-semibold tracking-wider`}>
                Core Management
              </p>

              <div className="space-y-1">
                <Link href="/admin" className={linkClass("/admin")}>
                  <span className="flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Dashboard
                  </span>
                </Link>

                <Link href="/admin/menus" className={linkClass("/admin/menus")}>
                  <span className="flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    Menus
                  </span>
                </Link>
              </div>
            </div>

            <div>
              <p className={`${sectionTitle} text-xs uppercase mb-3 font-semibold tracking-wider`}>
                Inventory
              </p>

              <div className="space-y-1">
                <Link href="/admin/stocks" className={linkClass("/admin/stocks")}>
                  <span className="flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Stocks
                  </span>
                </Link>

                <Link href="/admin/stock-items" className={linkClass("/admin/stock-items")}>
                  <span className="flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    Stock Items
                  </span>
                </Link>
              </div>
            </div>

            <div>
              <p className={`${sectionTitle} text-xs uppercase mb-3 font-semibold tracking-wider`}>
                Orders
              </p>

              <div className="space-y-1">
                <Link href="/admin/orders" className={linkClass("/admin/orders")}>
                  <span className="flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Orders
                  </span>
                </Link>
              </div>
            </div>
          </>
        )}

        {/* CASHIER MENU */}
        {!isAdmin && (
          <>
            <div>
              <p className={`${sectionTitle} text-xs uppercase mb-3 font-semibold tracking-wider`}>
                Operations
              </p>

              <div className="space-y-1">
                <Link href="/cashier" className={linkClass("/cashier")}>
                  <span className="flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Dashboard
                  </span>
                </Link>
                          
                <Link href="/cashier/orders" className={linkClass("/cashier/orders")}>
                  <span className="flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Orders
                  </span>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className={`p-6 text-sm ${footerStyles}`}>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span>© 2026 i-menu POS</span>
        </div>
      </div>
    </aside>
  );
}