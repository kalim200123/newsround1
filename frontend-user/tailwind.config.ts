import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border-hsl))",
        input: "hsl(var(--input-hsl))",
        ring: "hsl(var(--ring-hsl))",
        background: "hsl(var(--background-hsl))",
        foreground: "hsl(var(--foreground-hsl))",
        primary: {
          DEFAULT: "hsl(var(--primary-hsl))",
          foreground: "hsl(var(--primary-foreground-hsl))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary-hsl))",
          foreground: "hsl(var(--secondary-foreground-hsl))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive-hsl))",
          foreground: "hsl(var(--destructive-foreground-hsl))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted-hsl))",
          foreground: "hsl(var(--muted-foreground-hsl))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent-hsl))",
          foreground: "hsl(var(--accent-foreground-hsl))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover-hsl))",
          foreground: "hsl(var(--popover-foreground-hsl))",
        },
        card: {
          DEFAULT: "hsl(var(--card-hsl))",
          foreground: "hsl(var(--card-foreground-hsl))",
        },
        "card-elevated": {
          DEFAULT: "hsl(var(--card-elevated-hsl))",
          foreground: "hsl(var(--card-elevated-foreground-hsl))",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)"],
        mono: ["var(--font-geist-mono)"],
      },
      keyframes: {
        "final-punch-left": {
          "0%, 100%": { transform: "translateX(0) rotate(0deg)" },
          "50%": { transform: "translateX(35vw) rotate(10deg) scale(1.1)" },
        },
        "final-punch-right": {
          "0%, 100%": { transform: "translateX(0) rotate(0deg)" },
          "50%": { transform: "translateX(-35vw) rotate(-10deg) scale(1.1)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0) rotate(0)" },
          "10%, 30%, 50%": { transform: "translateX(-6px) rotate(-3deg)" },
          "20%, 40%": { transform: "translateX(6px) rotate(3deg)" },
          "60%": { transform: "rotate(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "25%": { transform: "translateY(-15px) rotate(5deg)" },
          "75%": { transform: "translateY(15px) rotate(-5deg)" },
        },
      },
      animation: {
        "final-punch-left": "final-punch-left 2s ease-in-out infinite",
        "final-punch-right": "final-punch-right 2s ease-in-out infinite",
        shake: "shake 0.4s ease-in-out",
        float: "float 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
