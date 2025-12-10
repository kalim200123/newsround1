"use client";

import { useAuth } from "@/app/context/AuthContext";
import { LogIn, LogOut, User as UserIcon, UserPlus } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function AuthStatus() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    router.push("/");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  if (isLoading) {
    return <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />; // Placeholder for avatar
  }

  // Determine colors based on theme, using explicit hex/rgba for reliability
  const isDarkMode = theme === "dark";
  const fgColor = isDarkMode ? "#ffffff" : "#000000"; // Pure white in dark, pure black in light
  const mutedFgColor = isDarkMode ? "#a3a3a3" : "#6b7280"; // neutral-400 in dark, neutral-500 in light
  const redColor = isDarkMode ? "#ef4444" : "#dc2626"; // red-500 dark: red-600

  // Dropdown specific styles
  // Dropdown specific styles
  const dropdownBorderColor = isDarkMode ? "#525252" : "#d4d4d4"; // neutral-700 vs neutral-300

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center gap-2 group p-1 rounded-full hover:bg-accent transition-colors"
      >
        {user ? (
          <div className="relative w-8 h-8">
            <Image
              key={user.profile_image_url}
              src={user.profile_image_url || "/user-placeholder.svg"}
              alt="프로필"
              width={32}
              height={32}
              className={`rounded-full object-cover border-2 border-border ring-2 ${isDarkMode ? "ring-white" : "ring-black"} transition-all`}
              unoptimized={!!user.profile_image_url}
            />
          </div>
        ) : (
          <div className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-border transition-all">
            <UserIcon className="w-5 h-5" style={{ color: fgColor }} />
          </div>
        )}
      </button>

      {isMenuOpen && (
        <div className="absolute left-full ml-3 top-0 animate-slide-right-fade z-50 w-max">
          {user ? (
            // Logged-in menu (Clean UI: Info | Actions)
            <div className="flex items-center gap-3">
              {/* User Info */}
              <div className="flex flex-col items-start justify-center px-1">
                <p className="font-bold text-sm whitespace-nowrap" style={{ color: fgColor }}>
                  {user.nickname || user.name}
                </p>
                <p className="text-[10px] whitespace-nowrap" style={{ color: mutedFgColor }}>
                  {user.email}
                </p>
              </div>

              {/* Divider */}
              <div className="w-px h-8" style={{ backgroundColor: dropdownBorderColor }}></div>

              {/* Actions */}
              <nav className="flex flex-col gap-1">
                <Link
                  href="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 px-1 py-0.5 text-xs transition-transform transform hover:scale-105 hover:opacity-80"
                  style={{ color: fgColor }}
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap font-medium">마이페이지</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-1 py-0.5 text-xs transition-transform transform hover:scale-105 hover:opacity-80"
                  style={{ color: redColor }}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap font-medium">로그아웃</span>
                </button>
              </nav>
            </div>
          ) : (
            // Logged-out menu (Vertical: Login top, Register bottom)
            <div className="flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-1.5 px-1 py-0.5 text-xs transition-transform transform hover:scale-105 hover:opacity-80"
                style={{ color: fgColor }}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="font-medium whitespace-nowrap">로그인</span>
              </Link>
              <Link
                href="/register"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-1.5 px-1 py-0.5 text-xs transition-transform transform hover:scale-105 hover:opacity-80"
                style={{ color: fgColor }}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="font-medium whitespace-nowrap">회원가입</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
