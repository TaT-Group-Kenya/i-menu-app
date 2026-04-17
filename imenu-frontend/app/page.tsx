"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/app/lib/auth";

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = getUser();
    
    if (!token || !user) {
      // Not logged in, redirect to login
      router.replace("/login");
    } else {
      // Logged in, redirect based on role
      if (user.role === "ADMIN") {
        router.replace("/admin");
      } else if (user.role === "CASHIER") {
        router.replace("/cashier");
      } else {
        router.replace("/login");
      }
    }
    
    setChecking(false);
  }, [router]);

  // Show loading spinner while checking authentication
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}