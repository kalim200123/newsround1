import { cn } from "@/lib/utils";
import Image from "next/image";
import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  variant?: "default" | "gloves";
  focusedField?: string | null;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, variant = "default", focusedField = null }) => {
  return (
    <div className="min-h-screen w-full flex items-start justify-center p-4 pt-12 relative overflow-hidden">
      {/* Gloves Container - Positioned relative to screen */}
      {/* Blue Glove (Left) */}
      <div className="absolute top-1/2 left-4 md:left-10 z-50 pointer-events-none -translate-y-1/2">
        <div className="relative w-40 h-40 md:w-52 md:h-52 drop-shadow-2xl animate-final-punch-left">
          <Image src="/blue--glove.svg" alt="Blue Glove" fill className="object-contain" priority />
        </div>
      </div>

      {/* Red Glove (Right) */}
      <div className="absolute top-1/2 right-4 md:right-10 z-50 pointer-events-none -translate-y-1/2">
        <div
          className="relative w-40 h-40 md:w-52 md:h-52 drop-shadow-2xl animate-final-punch-right animation-delay-1000"
          style={{ animationDelay: "1s" }}
        >
          <Image src="/red--glove.svg" alt="Red Glove" fill className="object-contain" priority />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center group">
        {/* Chain / Hanging Mechanism */}
        <div className="w-2 h-32 bg-linear-to-b from-neutral-600 to-neutral-800 border-x border-neutral-900 mb-[-10px] relative z-0">
          {/* Chain links pattern (simulated) */}
          <div className="absolute inset-0 flex flex-col items-center justify-around py-1">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-4 h-6 border-2 border-neutral-400 rounded-full bg-transparent shadow-sm" />
            ))}
          </div>
        </div>

        {/* Punching Bag */}
        <div
          className={cn(
            "relative w-full bg-neutral-950 text-neutral-100 rounded-[3rem] shadow-2xl transition-transform duration-100",
            focusedField && "animate-shake"
          )}
          style={{
            minHeight: "550px",
            // Removed background gradient
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {/* Bag Texture/Stitching Details */}
          <div
            className="absolute top-0 left-0 w-full h-full rounded-[3rem] pointer-events-none opacity-20"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 3h1v1H1V3zm2-2h1v1H3V1z' fill='%23ffffff' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E\")",
            }}
          />

          {/* Top Cap of Bag */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-32 h-8 bg-neutral-800 rounded-t-lg border-t border-neutral-700 shadow-lg" />

          {/* Content Container */}
          <div className="relative z-10 p-8 pt-12 flex flex-col items-center">
            {/* Brand / Title Area */}
            <div className="mb-8 text-center">
              <div className="inline-block px-4 py-1 mb-2 border border-red-600/30 bg-red-900/10 rounded text-[10px] font-bold tracking-[0.2em] text-red-500 uppercase">
                Security Check
              </div>
              <h1 className="text-4xl font-black tracking-tighter text-white uppercase drop-shadow-md">{title}</h1>
              <div className="w-12 h-1 bg-red-600 mx-auto mt-2 rounded-full" />
            </div>

            <div className="w-full space-y-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
