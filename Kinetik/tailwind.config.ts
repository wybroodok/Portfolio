import type { Config } from "tailwindcss";

export default {
  darkMode: "class", // Linear-style light/dark toggled via a `dark` class on <html>
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
