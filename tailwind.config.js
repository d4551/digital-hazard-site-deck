import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./present.html",
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Inter'", "system-ui", "sans-serif"],
        display: ["'Rajdhani'", "'Inter'", "system-ui", "sans-serif"],
      },
      animation: {
        float: "float 4s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-18px)" },
        },
      },
      boxShadow: {
        brand: "0 20px 50px -22px rgba(8, 145, 178, 0.45)",
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        hazard: {
          primary: "#f97316",
          "primary-content": "#0f172a",
          secondary: "#38bdf8",
          "secondary-content": "#020617",
          accent: "#facc15",
          "accent-content": "#0f172a",
          neutral: "#0f172a",
          "neutral-content": "#e2e8f0",
          "base-100": "#020617",
          "base-200": "#0b1120",
          "base-300": "#111827",
          info: "#38bdf8",
          success: "#22c55e",
          warning: "#f59e0b",
          error: "#ef4444",
        },
      },
      "dark",
    ],
    darkTheme: "hazard",
    base: true,
    styled: true,
    utils: true,
    logs: false,
    themeRoot: ":root",
  },
};
