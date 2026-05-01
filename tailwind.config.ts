import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          950: "#07120d",
          900: "#0b1b14",
          800: "#123225",
          700: "#184a36",
          600: "#21654b"
        },
        glacier: {
          100: "#dff8ff",
          300: "#8ed7ed",
          500: "#3c9ec0"
        },
        gold: {
          200: "#ead7a6",
          400: "#c7a14a",
          600: "#8d6b24"
        },
        ivory: "#fbf5e7",
        charcoal: "#111210"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        serif: ["var(--font-serif)", "Georgia", "serif"]
      },
      boxShadow: {
        glow: "0 0 80px rgba(142, 215, 237, 0.18)",
        gold: "0 18px 70px rgba(199, 161, 74, 0.18)"
      },
      backgroundImage: {
        "radial-light": "radial-gradient(circle at 20% 20%, rgba(234, 215, 166, 0.20), transparent 35%), radial-gradient(circle at 80% 0%, rgba(142, 215, 237, 0.15), transparent 30%)"
      }
    }
  },
  plugins: [typography]
};

export default config;
