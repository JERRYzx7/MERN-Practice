import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        pixel: ['"Press Start 2P"', "monospace"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      colors: {
        brand: {
          bg: "#0a0e1e",
          surface: "#111827",
          card: "rgba(17, 24, 39, 0.7)",
          border: "rgba(148, 163, 184, 0.12)",
        },
        neon: {
          teal: "#2dd4bf",
          purple: "#a78bfa",
          green: "#34d399",
          red: "#fb7185",
          amber: "#fbbf24",
          sky: "#38bdf8",
        },
      },
      borderRadius: {
        DEFAULT: "12px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.3)",
        "glass-sm": "0 4px 16px rgba(0, 0, 0, 0.2)",
        "glow-teal": "0 0 20px rgba(45, 212, 191, 0.15)",
        "glow-teal-lg": "0 0 40px rgba(45, 212, 191, 0.2)",
        "glow-purple": "0 0 20px rgba(167, 139, 250, 0.15)",
        "glow-green": "0 0 20px rgba(52, 211, 153, 0.15)",
        "glow-red": "0 0 20px rgba(251, 113, 133, 0.15)",
        "glow-amber": "0 0 20px rgba(251, 191, 36, 0.15)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "float": "float 6s ease-in-out infinite",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(45, 212, 191, 0.1)" },
          "50%": { boxShadow: "0 0 40px rgba(45, 212, 191, 0.25)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
