import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#DC2626",
          600: "#C41E1E",
          700: "#991B1B",
          800: "#7F1D1D",
          900: "#450A0A",
        },
        dark: {
          50: "#f8f8f8",
          100: "#e8e8e8",
          200: "#d0d0d0",
          300: "#b0b0b0",
          400: "#888888",
          500: "#666666",
          600: "#444444",
          700: "#2D2D2D",
          800: "#1A1A1A",
          900: "#0D0D0D",
          950: "#050505",
        },
      },
    },
  },
  plugins: [],
};
export default config;
