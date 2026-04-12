/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Grocery-style OLED tokens (optional; use with dark mode surfaces)
        element: "#18181A",
        selected: "#2E3135",
        primary: "#134e4a",
        "primary-hover": "#115e59",
        "primary-muted": "#f8fafc",
        surface: "#f9fafb",
        /** Brand teal — must match `@shared/constants/design-tokens` `accent` */
        accent: "#0d9488",
        border: "#f1f5f9",
        "border-focus": "#334155",
        "slate-950": "#020617",
        /** Body ink — matches web `--color-slate-900` / shared `ink` (not default Tailwind slate-900) */
        "slate-900": "#111827",
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
