import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/app/context/theme-context';
import { ModalProvider } from '@/app/context/modal-context';
import { ToastProvider } from '@/app/context/toast-context';
// Remove ThemeToggle import from here
// import ThemeToggle from '@/app/components/theme-toggle';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'i-menu - Restaurant Management System',
  description: 'Manage your restaurant menu and orders',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} transition-colors duration-300`}>
        <ThemeProvider>
          <ModalProvider>
            <ToastProvider>
              {/* REMOVED: The floating theme toggle from here */}
              {/* <div className="fixed top-4 right-4 z-50">
                <ThemeToggle />
              </div> */}
              {children}
            </ToastProvider>
          </ModalProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}