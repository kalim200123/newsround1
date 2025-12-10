// src/components/auth/RingLayout.tsx
import React from "react";

interface RingLayoutProps {
  children: React.ReactNode;
  title: string;
}

/**
 * 회원가입/로그인 페이지를 위한 "복싱 링" 스타일 레이아웃 컴포넌트
 * - "테두리"에 집중하여 3단 로프와 코너 패드를 시각화한 디자인
 */
const RingLayout: React.FC<RingLayoutProps> = ({ children, title }) => {
  return (
    <div className="h-full text-foreground flex items-start justify-center p-4 pt-12 md:pt-16 transition-colors duration-300">
      {/* THE RING CONTAINER */}
      <div className="relative w-full max-w-[400px] mx-auto">
        {/* --- ROPES (The Border) --- */}
        {/* We create a 'cage' effect using absolute positioned lines around the content */}
        <div className="absolute -inset-4 pointer-events-none hidden sm:block">
          {/* Top Rope (Red) */}
          <div className="absolute top-0 left-2 right-2 h-3 bg-linear-to-b from-red-500 to-red-700 rounded-full shadow-md z-20"></div>

          {/* Middle Rope REMOVED as per user request */}

          {/* Bottom Rope (Blue) */}
          <div className="absolute bottom-0 left-2 right-2 h-3 bg-linear-to-b from-blue-500 to-blue-700 rounded-full shadow-md z-20"></div>

          {/* Left Side Ropes (Vertical connectors) */}
          <div className="absolute top-2 bottom-2 left-0 w-3 bg-linear-to-b from-neutral-300 to-neutral-400 rounded-full shadow-md z-10"></div>
          {/* Right Side Ropes */}
          <div className="absolute top-2 bottom-2 right-0 w-3 bg-linear-to-b from-neutral-300 to-neutral-400 rounded-full shadow-md z-10"></div>
        </div>

        {/* --- CORNER PADS (Turnbuckles) --- */}
        {/* Top Left - Red */}
        <div className="absolute -top-6 -left-6 w-12 h-12 bg-red-600 rounded-lg shadow-lg z-30 items-center justify-center border-2 border-red-800 hidden sm:flex">
          <div className="w-8 h-8 rounded-full border-2 border-red-400/50"></div>
        </div>
        {/* Top Right - Red */}
        <div className="absolute -top-6 -right-6 w-12 h-12 bg-red-600 rounded-lg shadow-lg z-30 items-center justify-center border-2 border-red-800 hidden sm:flex">
          <div className="w-8 h-8 rounded-full border-2 border-red-400/50"></div>
        </div>
        {/* Bottom Left - Blue */}
        <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-blue-600 rounded-lg shadow-lg z-30 items-center justify-center border-2 border-blue-800 hidden sm:flex">
          <div className="w-8 h-8 rounded-full border-2 border-blue-400/50"></div>
        </div>
        {/* Bottom Right - Blue */}
        <div className="absolute -bottom-6 -right-6 w-12 h-12 bg-blue-600 rounded-lg shadow-lg z-30 items-center justify-center border-2 border-blue-800 hidden sm:flex">
          <div className="w-8 h-8 rounded-full border-2 border-blue-400/50"></div>
        </div>

        {/* --- CANVAS (Content Box) --- */}
        <div className="relative bg-white dark:bg-black border-4 border-border rounded-xl shadow-2xl overflow-hidden">
          {/* Canvas Texture Overlay - REMOVED FOR PURE BLACK */}
          {/* <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] dark:invert pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/concrete-wall.png')]"></div> */}

          <div className="relative z-10 p-6 bg-background">
            {/* Header */}
            <div className="text-center mb-4">
              <h1 className="text-3xl font-black text-foreground uppercase tracking-tighter">{title}</h1>
              {/* Divider Line */}
              <div className="w-full h-px bg-linear-to-r from-transparent via-border to-transparent mt-4"></div>
            </div>

            {/* Form Content */}
            {children}
          </div>
        </div>

        {/* Mobile-only border fallback (since ropes are hidden on small screens) */}
        <div className="absolute inset-0 border-4 border-red-500/20 rounded-xl sm:hidden pointer-events-none"></div>
      </div>
    </div>
  );
};

export default RingLayout;
