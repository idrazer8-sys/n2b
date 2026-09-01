import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--color-ink)',
        paper: 'var(--color-paper)',
        line: 'var(--color-line)',
        accent: 'var(--color-accent)',
        // N2B brand palette — use directly (bg-n2bNavy, text-n2bPurple, etc.)
        // for anything that needs the brand color regardless of ink/paper
        // scope, e.g. the sidebar shell itself.
        n2bNavy: '#1A134D',
        n2bPurple: '#5B3DFF',
        n2bPurpleLight: '#8B6CFF',
        n2bLavender: '#CDBBFF',
        n2bOffwhite: '#F5F6FA',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
