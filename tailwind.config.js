module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
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
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"SF Mono"', 'SFMono-Regular', 'ui-monospace', 'Menlo', 'Consolas', '"Liberation Mono"', 'monospace'],
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
        /* Extended semantic tokens */
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground, 0 0% 100%))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground, 0 0% 100%))",
        },
      },
      borderRadius: {
        /* Radius scale — applied by component type */
        xs: "var(--radius-xs)",           /* 4px — token pills, inline badges */
        sm: "var(--radius-sm)",           /* 6px — inputs, textareas */
        md: "var(--radius-md)",           /* 8px — standard buttons, menu items */
        lg: "var(--radius-lg)",           /* 10px — cards, nav items, search */
        xl: "var(--radius-xl)",           /* 14px — panels, elevated surfaces */
        "2xl": "var(--radius-2xl)",       /* 20px — modals, sheets */
        full: "var(--radius-full)",       /* 9999px — avatars, circular controls */
      },
      boxShadow: {
        /* Shadow scale — subtle, physically plausible */
        'hairline': 'var(--shadow-hairline)',
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        /* Legacy aliases — TODO: migrate to scale */
        'macos-window': 'var(--shadow-md)',
        'macos-popover': 'var(--shadow-lg)',
        'macos-button': 'var(--shadow-sm)',
        'macos-inset': 'inset 0 1px 2px rgba(0, 0, 0, 0.06)',
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
}
