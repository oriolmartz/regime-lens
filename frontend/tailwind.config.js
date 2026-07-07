/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F7F4EF",
        ivory: "#FAF8F3",
        ink: "#111827",
        muted: "#4B5563",
        subdued: "#6B7280",
        line: "#E4DDD2",
        brand: "#14213D",
        accent: "#2A6F68",
        soft: "#E3F1EE",
        dark: "#14213D",
        positive: "#3F7D58",
        warning: "#B7791F",
        danger: "#A04444",
        neutral: "#64748B"
      },
      boxShadow: {
        premium: "0 8px 24px rgba(20, 33, 61, 0.045)",
        panel: "0 18px 50px rgba(20, 33, 61, 0.08)"
      }
    }
  },
  plugins: []
}
