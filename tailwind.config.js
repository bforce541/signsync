/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#07111f",
        slate: "#10233d",
        frost: "#e7f0ff",
        signal: "#57f2c7",
        aurora: "#6db8ff",
        ember: "#ff9166",
      },
      fontFamily: {
        sans: ["'Space Grotesk'", "sans-serif"],
        serif: ["'Source Serif 4'", "serif"],
      },
      boxShadow: {
        halo: "0 24px 80px rgba(24, 74, 140, 0.28)",
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(0, -12px, 0)" },
        },
        reveal: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        drift: "drift 8s ease-in-out infinite",
        reveal: "reveal 0.7s ease-out both",
      },
    },
  },
  plugins: [],
};
