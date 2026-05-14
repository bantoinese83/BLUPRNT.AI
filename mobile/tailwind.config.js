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
        /** Shared `slate700` — do not remap; `Theme.colors.text.onSoft` */
        "slate-700": "#334155",
        /**
         * Between shared `slate500` (#475569) and `slate700` (#334155).
         * Do not reuse #475569 here — that hex is `slate-500` (bumped “muted body” parity with web).
         */
        "slate-600": "#3d4b5f",
        /** Shared `slate500` — bumped for contrast vs default Tailwind slate-500 */
        "slate-500": "#475569",
        /** Shared `slate400` */
        "slate-400": "#64748b",
        /** Shared `slate300` */
        "slate-300": "#cbd5e1",
        /** Shared `borderDefault` */
        "slate-200": "#e2e8f0",
        /** Shared `slate100` */
        "slate-100": "#f1f5f9",
        /** Shared `slate50` */
        "slate-50": "#f8fafc",
      },
      fontFamily: {
        sans: ["Outfit", "sans-serif"],
      },
    },
  },
  plugins: [],
};
