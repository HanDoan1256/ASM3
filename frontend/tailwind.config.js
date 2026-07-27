export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2f7ff",
          100: "#d3e4fe",
          200: "#b7d0fb",
          500: "#0058be",
          700: "#00489a",
          900: "#0b1c30"
        },
        background: "#f8f9ff",
        surface: "#ffffff",
        border: "#d3e4fe",
        text: {
          primary: "#0b1c30",
          secondary: "#64748b"
        },
        success: "#16a34a",
        warning: "#f59e0b",
        danger: "#dc2626"
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"]
      },
      boxShadow: {
        panel: "0 14px 40px rgba(11, 28, 48, 0.08)",
        soft: "0 8px 24px rgba(0, 88, 190, 0.08)"
      }
    },
  },
  plugins: [],
};
