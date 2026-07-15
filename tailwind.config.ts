import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["'IBM Plex Sans Thai'", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        lg: {
          surface: "hsl(var(--lg-surface))",
          "surface-container-low": "hsl(var(--lg-surface-container-low))",
          "surface-container-lowest": "hsl(var(--lg-surface-container-lowest))",
          "surface-variant": "hsl(var(--lg-surface-variant))",
          "on-surface": "hsl(var(--lg-on-surface))",
          "on-surface-variant": "hsl(var(--lg-on-surface-variant))",
          primary: "hsl(var(--lg-primary))",
          "primary-container": "hsl(var(--lg-primary-container))",
          "on-primary-container": "hsl(var(--lg-on-primary-container))",
          "secondary-container": "hsl(var(--lg-secondary-container))",
          "on-secondary-container": "hsl(var(--lg-on-secondary-container))",
          "tertiary-fixed": "hsl(var(--lg-tertiary-fixed))",
          "on-tertiary-fixed": "hsl(var(--lg-on-tertiary-fixed))",
          "accent-red": "hsl(var(--lg-accent-red))",
          "accent-brown": "hsl(var(--lg-accent-brown))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "lg-xl": "var(--lg-radius-xl)",
        "lg-lg": "var(--lg-radius-lg)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;