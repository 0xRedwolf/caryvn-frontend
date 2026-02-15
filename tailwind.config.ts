import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Caryvn Brand Colors
        primary: {
          DEFAULT: "#39E079",
          hover: "#2bc966",
          light: "#39E079/10",
        },
        // Dark Theme
        background: {
          light: "#f6f8f7",
          dark: "#122017",
        },
        surface: {
          dark: "#1a202c",
          darker: "#111318",
        },
        border: {
          dark: "#282e39",
          light: "#334155",
        },
        "text-secondary": "#9da6b9",
      },
      fontFamily: {
        display: ["Inter", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "1rem",
        xl: "1.5rem",
        "2xl": "2rem",
      },
      boxShadow: {
        glow: "0 0 20px rgba(57, 224, 121, 0.3)",
        "glow-lg": "0 0 40px rgba(57, 224, 121, 0.4)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "pulse-slow": "pulse 3s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
