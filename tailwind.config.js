/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        card: 'var(--color-card)',
        surface: 'var(--color-surface)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          light: 'var(--color-primary-light)',
          dark: 'var(--color-primary-dark)',
        },
        secondary: 'var(--color-secondary)',
        text: {
          DEFAULT: 'var(--color-text)',
          muted: 'var(--color-text-muted)',
        },
        border: 'var(--color-border)',
        success: 'var(--color-success)',
        danger: 'var(--color-danger)',
        warning: 'var(--color-warning)',
        info: 'var(--color-info)',
      },
      fontFamily: {
        heading: ['BricolageGrotesque_700Bold'],
        headingRegular: ['BricolageGrotesque_400Regular'],
        regular: ['BricolageGrotesque_400Regular'],
        medium: ['BricolageGrotesque_500Medium'],
        semibold: ['BricolageGrotesque_600SemiBold'],
        bold: ['BricolageGrotesque_700Bold'],
        monoRegular: ['JetBrainsMono_400Regular'],
        monoBold: ['JetBrainsMono_700Bold'],
      },
    },
  },
  plugins: [],
}