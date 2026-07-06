/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0F172A",
        muted: "#475569",
        line: "#E2E8F0",
        brand: "#2563EB",
        soft: "#DBEAFE",
        dark: "#0B1120"
      },
      boxShadow: {
        premium: "0 8px 30px rgba(15, 23, 42, 0.05)"
      }
    }
  },
  plugins: []
}
