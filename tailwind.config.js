/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f2933",
        slate: "#52606d",
        frost: "#f7f4ee",
        signal: "#2d6a4f",
        aurora: "#3b82f6",
        ember: "#c05621",
      },
      fontFamily: {
        sans: ["'Space Grotesk'", "sans-serif"],
        serif: ["'Source Serif 4'", "serif"],
      },
      boxShadow: {
        halo: "0 18px 45px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};
