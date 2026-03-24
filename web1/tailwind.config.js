/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#040d1e",
          900: "#071428",
          800: "#0d1f3c",
          700: "#122550",
        },
      },
      keyframes: {
        "bar-wave": {
          "0%, 100%": { transform: "scaleY(0.25)" },
          "50%": { transform: "scaleY(1)" },
        },
        "ring-pulse": {
          "0%, 100%": { transform: "scale(0.88)", opacity: "0.5" },
          "50%": { transform: "scale(1.08)", opacity: "0.15" },
        },
        "glow-breathe": {
          "0%, 100%": { boxShadow: "0 0 30px rgba(59,130,246,0.3), 0 0 60px rgba(59,130,246,0.15)" },
          "50%": { boxShadow: "0 0 60px rgba(59,130,246,0.55), 0 0 120px rgba(59,130,246,0.25), 0 0 180px rgba(59,130,246,0.1)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-7px)" },
        },
        "typing-dot": {
          "0%, 80%, 100%": { transform: "scale(0.5)", opacity: "0.3" },
          "40%": { transform: "scale(1)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
        "command-pop": {
          "0%": { opacity: "0", transform: "scale(0.85) translateY(6px)" },
          "15%": { opacity: "1", transform: "scale(1) translateY(0)" },
          "85%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "bar-wave": "bar-wave 0.9s ease-in-out infinite",
        "ring-pulse": "ring-pulse 2.8s ease-in-out infinite",
        "glow-breathe": "glow-breathe 3s ease-in-out infinite",
        "fade-up": "fade-up 0.4s ease-out forwards",
        "slide-right": "slide-right 0.3s ease-out forwards",
        float: "float 4s ease-in-out infinite",
        "typing-dot": "typing-dot 1.4s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "spin-slow": "spin-slow 3s linear infinite",
        "command-pop": "command-pop 2.2s ease-in-out forwards",
        "fade-in": "fade-in 0.3s ease-out forwards",
      },
      backdropBlur: {
        xs: "4px",
      },
    },
  },
  plugins: [],
};
