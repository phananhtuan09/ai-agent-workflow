import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./data/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          base: "#0B0E18",
          low: "#0F1420",
          mid: "#141926",
          high: "#1A2133",
          border: "#232D42",
        },
        accent: {
          indigo: "#6366F1",
          violet: "#7c3aed",
          blue: "#2563eb",
          teal: "#0D9488",
          success: "#4ade80",
        },
      },
      fontFamily: {
        sans: ["var(--font-body)", "sans-serif"],
        heading: ["var(--font-heading)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2)",
        "btn-primary":
          "0 1px 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12)",
        "btn-white": "0 1px 3px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.15)",
      },
      backgroundImage: {
        "btn-indigo": "linear-gradient(180deg, #6D70F5 0%, #4F52D9 100%)",
      },
      maxWidth: {
        shell: "1280px",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
