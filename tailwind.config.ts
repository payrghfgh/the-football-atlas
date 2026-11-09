import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pitch: {
          DEFAULT: "var(--accent)",
          soft: "var(--accent-soft)",
          ink: "var(--accent-ink)",
        },
        base: "var(--bg)",
        surface: "var(--surface)",
        raised: "var(--surface-raised)",
        line: "var(--line)",
        ink: "var(--text)",
        muted: "var(--muted)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "10xl": ["9rem", { lineHeight: "0.85", letterSpacing: "-0.02em" }],
      },
      maxWidth: { shell: "1360px" },
      transitionTimingFunction: { out: "cubic-bezier(0.22, 0.61, 0.36, 1)" },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s infinite",
        rise: "rise 0.22s cubic-bezier(0.22, 0.61, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
