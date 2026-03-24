import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#11100d',
        surface: '#181613',
        'surface-elevated': '#211e1a',
        'border-subtle': '#2f2a24',
        'border-strong': '#4a4137',
        'text-primary': '#f4f1ea',
        'text-secondary': '#c9c1b4',
        'text-tertiary': '#9b9285',
        accent: '#b7862f',
        'accent-muted': '#3b2f1a',
        'accent-foreground': '#1a150d',
        success: '#4f7a4b',
        warning: '#b96c2b',
        error: '#b24a3f',
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
