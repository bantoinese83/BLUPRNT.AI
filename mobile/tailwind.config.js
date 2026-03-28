/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#0f172a",
        "primary-hover": "#020617",
        "primary-muted": "#f8fafc",
        surface: "#f9fafb",
        accent: "#4f46e5",
        border: "#f1f5f9",
        "border-focus": "#334155",
        "slate-950": "#020617",
        "slate-900": "#0f172a",
        "slate-800": "#1e293b",
        "slate-700": "#334155",
        "slate-600": "#475569",
        "slate-500": "#64748b",
        "slate-400": "#94a3b8",
        "slate-300": "#cbd5e1",
        "slate-200": "#e2e8f0",
        "slate-100": "#f1f5f9",
        "slate-50": "#f8fafc",

      },
      fontFamily: {
        sans: ["Outfit", "sans-serif"],
      },
    },
  },
  plugins: [],
};
