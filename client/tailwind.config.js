/** @type {import('tailwindcss').Config} */
export default {
  // darkMode 'class' means we control dark mode by adding class="dark" to <html>
  // This is critical — it lets us persist the user's preference to localStorage
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Our custom brand palette — all referenced via Tailwind utilities
        primary: {
          DEFAULT: "#2563EB", // blue-600
          hover: "#1D4ED8", // blue-700
          dark: "#1E40AF", // blue-800
        },
        surface: {
          light: "#F8FAFC", // slate-50  — light mode page bg
          dark: "#0F172A", // slate-900 — dark mode page bg
          card: "#1E293B", // slate-800 — dark mode card bg
        },
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Syne", "system-ui", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
    },
  },
  plugins: [],
};
