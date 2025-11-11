import type { Config } from "tailwindcss";
import daisyui from "daisyui";

type DaisyUIConfig = Config & {
  daisyui?: {
    themes?: string[];
  };
};

const config: DaisyUIConfig = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/styles/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      colors: {
        brand: "#FF5A2F",
        accent: "#FFD07F",
        dark: "#1E1E1E",
        light: "#FFFFFF",
        cream: "#FCEFE5",
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, #FF5A2F 0%, #FF914D 100%)",
        "hero-overlay":
          "radial-gradient(120% 120% at 50% 0%, rgba(255, 208, 127, 0.4) 0%, rgba(30, 30, 30, 0.75) 55%, rgba(30, 30, 30, 0.9) 100%)",
        "grid-overlay":
          "linear-gradient(0deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px)",
      },
      boxShadow: {
        glow: "0 0 25px rgba(255, 90, 47, 0.6)",
        "glow-strong": "0 0 55px rgba(255, 90, 47, 0.72)",
        "glow-soft": "0 15px 45px rgba(255, 90, 47, 0.25)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "pulse-slow": "pulse-slow 3s ease-in-out infinite",
        shimmer: "shimmer 4s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.035)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" },
        },
      },
    },
  },
  plugins: [daisyui],
  daisyui: { themes: ["light", "dark"] },
};

export default config;

