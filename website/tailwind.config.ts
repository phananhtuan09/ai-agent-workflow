import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./data/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: "#09090b",
          900: "#0d0d0f",
          850: "#111114",
          800: "#17171d",
          700: "#27272f"
        },
        accent: {
          violet: "#7c3aed",
          blue: "#2563eb",
          cyan: "#06b6d4",
          success: "#4ade80"
        }
      },
      fontFamily: {
        sans: ["var(--font-body)", "sans-serif"],
        heading: ["var(--font-heading)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"]
      },
      boxShadow: {
        glow: "0 20px 60px rgba(37, 99, 235, 0.22)",
        violet: "0 24px 70px rgba(124, 58, 237, 0.28)"
      },
      backgroundImage: {
        "hero-gradient":
          "linear-gradient(135deg, rgba(124,58,237,0.95), rgba(37,99,235,0.9), rgba(6,182,212,0.88))",
        "glass-border":
          "linear-gradient(135deg, rgba(124,58,237,0.8), rgba(37,99,235,0.7), rgba(6,182,212,0.7))"
      },
      maxWidth: {
        shell: "1280px"
      }
    }
  },
  plugins: [require("@tailwindcss/typography")]
};

export default config;
