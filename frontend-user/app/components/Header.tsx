"use client";

"use client";

import { useNotifications } from "@/app/context/NotificationContext"; // New import
import { getCategoryTheme } from "@/lib/categoryColors";
import { cn } from "@/lib/utils";
import { Headset, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import AuthStatus from "./header/AuthStatus";
import SearchBar from "./header/SearchBar";
import NotificationBadge from "./notifications/NotificationBadge";

const navLinks = [
  { title: "정치", href: "/politics" },
  { title: "경제", href: "/economy" },
  { title: "사회", href: "/social" },
  { title: "문화", href: "/culture" },
  { title: "스포츠", href: "/sports" },
  { title: "ROUND2", href: "/debate" },
];

export default function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { toggleSidePanel } = useNotifications(); // New
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode = theme === "dark";
  // Use a default color for SSR, and theme-dependent colors only after client-side mount
  const headerBorderColor = mounted ? (isDarkMode ? "#27272a" : "#e5e5e5") : "#e5e5e5"; // Default to light mode border for SSR
  const separatorColor = mounted ? (isDarkMode ? "#4a4a4a" : "#d4d4d4") : "#d4d4d4"; // Default to light mode separator for SSR

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b shadow-sm",
        "bg-carbon-fiber" // Apply carbon fiber unconditionally
      )}
      style={{ borderColor: headerBorderColor }}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex flex-col gap-2">
          {/* Top Row: Logo (Centered) and Right Section (Absolute/Flex) */}
          <div className="relative flex justify-center items-center h-10">
            {/* Logo */}
            <Link href="/" className="text-3xl md:text-4xl font-black text-foreground tracking-tighter cursor-pointer">
              NEWSROUND1
            </Link>

            {/* Right Section: Icons and Auth (Absolute Right) */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-4">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-1 rounded-full hover:bg-accent transition-colors group"
                aria-label="Toggle Theme"
              >
                {mounted ? (
                  isDarkMode ? (
                    <Moon className="w-5 h-5 text-(--icon-adaptive) hover:text-foreground transition-transform group-hover:scale-125" />
                  ) : (
                    <Sun className="w-5 h-5 text-(--icon-adaptive) hover:text-foreground transition-transform group-hover:scale-125" />
                  )
                ) : (
                  <div className="w-5 h-5" /> // Render an empty div or a default icon placeholder
                )}
              </button>
              <Link
                href="/inquiry"
                className="p-1 rounded-full hover:bg-accent transition-colors hidden sm:block group"
              >
                <Headset className="w-5 h-5 text-(--icon-adaptive) cursor-pointer hover:text-foreground transition-transform group-hover:scale-125" />
              </Link>
              {/* Changed to button to open side panel */}
              <button
                onClick={() => toggleSidePanel(true)} // Open side panel
                className="p-1 rounded-full hover:bg-accent transition-colors hidden sm:block group"
                aria-label="알림"
              >
                <NotificationBadge />
              </button>
              <div className="hidden sm:block">
                <SearchBar />
              </div>
              <AuthStatus />
            </div>
          </div>

          {/* Bottom Row: Navigation (Centered) */}
          <nav
            className="flex justify-center items-center gap-4 border-t pt-2"
            style={{ borderColor: headerBorderColor }}
          >
            {navLinks.map((link, index) => {
              const isActive = pathname === link.href;
              const theme = getCategoryTheme(link.title);
              let activeLinkClass;

              if (isActive) {
                if (link.title === "ROUND2") {
                  activeLinkClass = "text-red-500"; // Keep ROUND2 as red
                } else {
                  activeLinkClass = theme.text; // Use category-specific color
                }
              } else {
                activeLinkClass = "text-muted-foreground hover:text-foreground";
              }

              return (
                <React.Fragment key={link.title}>
                  <Link
                    href={link.href}
                    className={`text-base font-bold transition-colors transform hover:-translate-y-[3px] ${activeLinkClass}`}
                  >
                    {link.title}
                  </Link>
                  {index < navLinks.length - 1 && <span style={{ color: separatorColor }}>|</span>}
                </React.Fragment>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
