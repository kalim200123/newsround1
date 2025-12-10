import { AuthProvider } from "@/app/context/AuthContext";
import { SocketProvider } from "@/app/context/SocketContext";
import { NotificationProvider } from "@/app/context/NotificationContext";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ScrollToTopButton from "./components/common/ScrollToTopButton";
import Footer from "./components/Footer";
import Header from "./components/Header";
import NotificationSidePanel from "./components/notifications/NotificationSidePanel";
import NotificationToastManager from "./components/NotificationToastManager"; // Import the new component

import { ThemeProvider } from "./components/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NEWSROUND1",
  description: "뉴스라운드 메인 페이지",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <NotificationProvider>
              <SocketProvider>
                <Header />
                <main className="flex-1 w-full">{children}</main>
                <Footer />
                <ScrollToTopButton />
                <NotificationToastManager />
              </SocketProvider>
              <NotificationSidePanel />
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
