import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  daisyui: {
    themes: ["light", "dark", "cupcake"],
  },
  theme: {
    fontFamily: {
      sans: ["'Geist Sans'", "system-ui", "sans-serif"],
      mono: ["'Geist Mono'", "monospace"],
    },
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        // Custom orange color with different shades
        orange: {
          50: "#FEF4ED",
          100: "#FEEADB",
          200: "#FCD5B7",
          300: "#FABC8A",
          400: "#F7945D",
          500: "#F26208", // Main orange color
          600: "#C64E06",
          700: "#993D05",
          800: "#6D2C04",
          900: "#401A02",
          950: "#250F01",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      typography: {
        DEFAULT: {
          css: {
            "--tw-prose-body": "#ffffff" /* Pure white */,
            "--tw-prose-headings": "#ffffff" /* Pure white */,
            "--tw-prose-lead": "#ffffff" /* Pure white */,
            "--tw-prose-links": "#F26208" /* Orange links */,
            "--tw-prose-bold": "#ffffff" /* Pure white */,
            "--tw-prose-counters": "#ffffff" /* Pure white */,
            "--tw-prose-bullets": "#ffffff" /* Pure white */,
            "--tw-prose-hr": "#333333" /* Dark dividers */,
            "--tw-prose-quotes": "#ffffff" /* Pure white */,
            "--tw-prose-quote-borders": "#333333" /* Dark border */,
            "--tw-prose-captions": "#ffffff" /* Pure white */,
            "--tw-prose-code": "#ffffff" /* Pure white */,
            "--tw-prose-pre-code": "#ffffff" /* Pure white */,
            "--tw-prose-pre-bg":
              "#0a0a0a" /* Very dark, not pure black for contrast */,
            "--tw-prose-th-borders": "#333333",
            "--tw-prose-td-borders": "#333333",

            // Dark mode overwrites (same as light mode since we want consistent black/white theme)
            "--tw-prose-invert-body": "#ffffff",
            "--tw-prose-invert-headings": "#ffffff",
            "--tw-prose-invert-lead": "#ffffff",
            "--tw-prose-invert-links":
              "#F26208" /* Orange links in dark mode */,
            "--tw-prose-invert-bold": "#ffffff",
            "--tw-prose-invert-counters": "#ffffff",
            "--tw-prose-invert-bullets": "#ffffff",
            "--tw-prose-invert-hr": "#333333",
            "--tw-prose-invert-quotes": "#ffffff",
            "--tw-prose-invert-quote-borders": "#333333",
            "--tw-prose-invert-captions": "#ffffff",
            "--tw-prose-invert-code": "#ffffff",
            "--tw-prose-invert-pre-code": "#ffffff",
            "--tw-prose-invert-pre-bg": "#0a0a0a",
            "--tw-prose-invert-th-borders": "#333333",
            "--tw-prose-invert-td-borders": "#333333",

            // Additional specific styling
            color: "var(--tw-prose-body)",
            a: {
              color: "var(--tw-prose-links)",
              "&:hover": {
                color: "var(--tw-prose-links)",
                textDecoration: "underline",
              },
            },
            h1: {
              color: "var(--tw-prose-headings)",
              fontWeight: "500",
            },
            h2: {
              color: "var(--tw-prose-headings)",
              fontWeight: "500",
            },
            h3: {
              color: "var(--tw-prose-headings)",
              fontWeight: "500",
            },
            h4: {
              color: "var(--tw-prose-headings)",
              fontWeight: "500",
            },
            strong: {
              color: "var(--tw-prose-bold)",
              fontWeight: "600",
            },
            code: {
              color: "var(--tw-prose-code)",
              backgroundColor: "var(--tw-prose-pre-bg)",
              fontWeight: "400",
              borderRadius: "0.25rem",
              paddingTop: "0.125rem",
              paddingRight: "0.25rem",
              paddingBottom: "0.125rem",
              paddingLeft: "0.25rem",
            },
            pre: {
              color: "var(--tw-prose-pre-code)",
              backgroundColor: "var(--tw-prose-pre-bg)",
              borderRadius: "0.375rem",
              padding: "0.75rem 1rem",
            },
          },
        },
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    require("daisyui"),
  ],
} satisfies Config;
