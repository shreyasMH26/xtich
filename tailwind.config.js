/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./rail-mount.tsx",
    "./app.js",
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        background: "var(--background, #080807)",
        foreground: "var(--foreground, #fbfaf6)",
        card: {
          DEFAULT: "var(--card, #10100e)",
          foreground: "var(--card-foreground, #fbfaf6)",
        },
        muted: {
          DEFAULT: "var(--muted, #181815)",
          foreground: "var(--muted-foreground, #a5a297)",
        },
        border: "var(--border, rgba(251, 250, 246, 0.12))",
        ring: "var(--ring, #fbfaf6)",
      },
    },
  },
  plugins: [],
};
