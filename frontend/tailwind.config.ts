import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', "monospace"],
        vt: ["VT323", "monospace"],
      },
      colors: {
        pixel: {
          bg: "#0a0e1a",
          panel: "#1a1f35",
          card: "#0d1117",
          border: "#2a3054",
          gold: "#fbbf24",
          "gold-dark": "#d97706",
          cyan: "#22d3ee",
          green: "#4ade80",
          red: "#f87171",
          yellow: "#fde047",
          purple: "#a78bfa",
          text: "#f0f0f0",
          muted: "#8892a4",
        },
      },
      borderRadius: {
        DEFAULT: "0px",
        none: "0px",
        sm: "0px",
        md: "0px",
        lg: "0px",
        xl: "0px",
        "2xl": "0px",
        full: "0px",
      },
      boxShadow: {
        pixel: "4px 4px 0px #000000",
        "pixel-sm": "2px 2px 0px #000000",
        "pixel-lg": "6px 6px 0px #000000",
        "pixel-gold": "4px 4px 0px #d97706",
        "pixel-green": "4px 4px 0px #16a34a",
        "pixel-red": "4px 4px 0px #dc2626",
        "pixel-inset": "inset 2px 2px 0px rgba(0,0,0,0.5)",
      },
      fontSize: {
        "pixel-xs": ["8px", { lineHeight: "16px" }],
        "pixel-sm": ["10px", { lineHeight: "20px" }],
        "pixel-base": ["12px", { lineHeight: "24px" }],
        "pixel-lg": ["16px", { lineHeight: "28px" }],
        "pixel-xl": ["20px", { lineHeight: "32px" }],
        "vt-sm": ["18px", { lineHeight: "1.2" }],
        "vt-base": ["22px", { lineHeight: "1.3" }],
        "vt-lg": ["28px", { lineHeight: "1.3" }],
        "vt-xl": ["36px", { lineHeight: "1.2" }],
        "vt-2xl": ["48px", { lineHeight: "1.1" }],
      },
      animation: {
        blink: "blink 1s step-end infinite",
        "pixel-bounce": "pixelBounce 0.3s steps(2) infinite",
        "float-pixel": "floatPixel 3s steps(6) infinite",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        pixelBounce: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        floatPixel: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      spacing: {
        "pixel-1": "4px",
        "pixel-2": "8px",
        "pixel-3": "12px",
        "pixel-4": "16px",
        "pixel-6": "24px",
        "pixel-8": "32px",
      },
    },
  },
  plugins: [],
} satisfies Config;
