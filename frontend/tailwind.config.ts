import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "seatsnap-bg": "#0c0f0a",
        "seatsnap-surface": "#1a2214",
        "seatsnap-border": "#2a3824",
        "seatsnap-primary": "#7ed957",
        "seatsnap-text": "#e8f0e0",
        "seatsnap-muted": "#7a9068",
        "seatsnap-danger": "#ff6b6b",
        "seatsnap-warning": "#ffc947"
      },
      fontFamily: {
        display: ["var(--font-syne)", "system-ui", "sans-serif"],
        body: ["var(--font-newsreader)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "SFMono-Regular"]
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(126, 217, 87, 0.3), 0 12px 30px rgba(0,0,0,0.35)"
      },
      keyframes: {
        pulseSoft: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.05)", opacity: "0.8" }
        }
      },
      animation: {
        pulseSoft: "pulseSoft 1.6s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
