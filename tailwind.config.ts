import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    fontFamily: {
      sans: ["Geist Sans", "system-ui", "sans-serif"],
      mono: ["Geist Mono", "monospace"],
    },
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
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
            '--tw-prose-body': '#fff',
            '--tw-prose-headings': '#fff',
            '--tw-prose-lead': '#d1d5db',
            '--tw-prose-links': 'hsl(217.2, 91.2%, 59.8%)',
            '--tw-prose-bold': '#fff',
            '--tw-prose-counters': '#d1d5db',
            '--tw-prose-bullets': '#d1d5db',
            '--tw-prose-hr': '#333',
            '--tw-prose-quotes': '#d1d5db',
            '--tw-prose-quote-borders': '#333',
            '--tw-prose-captions': '#d1d5db',
            '--tw-prose-code': '#d1d5db',
            '--tw-prose-pre-code': '#d1d5db',
            '--tw-prose-pre-bg': '#111',
            '--tw-prose-th-borders': '#333',
            '--tw-prose-td-borders': '#333',
            
            // Dark mode overwrites
            '--tw-prose-invert-body': '#fff',
            '--tw-prose-invert-headings': '#fff',
            '--tw-prose-invert-lead': '#d1d5db',
            '--tw-prose-invert-links': 'hsl(217.2, 91.2%, 59.8%)',
            '--tw-prose-invert-bold': '#fff',
            '--tw-prose-invert-counters': '#d1d5db',
            '--tw-prose-invert-bullets': '#d1d5db',
            '--tw-prose-invert-hr': '#333',
            '--tw-prose-invert-quotes': '#d1d5db',
            '--tw-prose-invert-quote-borders': '#333',
            '--tw-prose-invert-captions': '#d1d5db',
            '--tw-prose-invert-code': '#d1d5db',
            '--tw-prose-invert-pre-code': '#d1d5db',
            '--tw-prose-invert-pre-bg': '#111',
            '--tw-prose-invert-th-borders': '#333',
            '--tw-prose-invert-td-borders': '#333',
            
            // Additional specific styling
            color: 'var(--tw-prose-body)',
            a: {
              color: 'var(--tw-prose-links)',
              '&:hover': {
                color: 'var(--tw-prose-links)',
                textDecoration: 'underline',
              },
            },
            h1: {
              color: 'var(--tw-prose-headings)',
              fontWeight: '500',
            },
            h2: {
              color: 'var(--tw-prose-headings)',
              fontWeight: '500',
            },
            h3: {
              color: 'var(--tw-prose-headings)',
              fontWeight: '500',
            },
            h4: {
              color: 'var(--tw-prose-headings)',
              fontWeight: '500',
            },
            strong: {
              color: 'var(--tw-prose-bold)',
              fontWeight: '600',
            },
            code: {
              color: 'var(--tw-prose-code)',
              backgroundColor: 'var(--tw-prose-pre-bg)',
              fontWeight: '400',
              borderRadius: '0.25rem',
              paddingTop: '0.125rem',
              paddingRight: '0.25rem',
              paddingBottom: '0.125rem',
              paddingLeft: '0.25rem',
            },
            pre: {
              color: 'var(--tw-prose-pre-code)',
              backgroundColor: 'var(--tw-prose-pre-bg)',
              borderRadius: '0.375rem',
              padding: '0.75rem 1rem',
            },
          },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
