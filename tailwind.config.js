/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#04070d',
        abyss: '#060c16',
        deep: '#081120',
        panel: '#0a1524',
        raise: '#0d1b30',
        line: '#15243c',
        edge: '#1e3352',
        ink: '#e8f0f8',
        mist: '#9db4cc',
        dim: '#5f7a96',
        faint: '#3d5570',
        accent: '#22d3ee',
        'accent-soft': '#67e8f9',
        'accent-deep': '#0e7490',
        amberx: '#fbbf24',
        emeraldx: '#34d399',
        rosex: '#fb7185',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        mega: '-0.04em',
        wide2: '0.02em',
      },
      boxShadow: {
        glow: '0 0 24px rgba(34,211,238,0.28)',
        'glow-sm': '0 0 12px rgba(34,211,238,0.35)',
        panel: '0 12px 48px rgba(0,0,0,0.45)',
      },
      keyframes: {
        flowdash: { to: { strokeDashoffset: -24 } },
        pulseglow: {
          '0%,100%': { opacity: '0.45' },
          '50%': { opacity: '1' },
        },
        nodepulse: {
          '0%,100%': { transform: 'scale(1)', opacity: '0.7' },
          '50%': { transform: 'scale(1.35)', opacity: '0' },
        },
        riseup: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        flowdash: 'flowdash 1s linear infinite',
        pulseglow: 'pulseglow 2.4s ease-in-out infinite',
        nodepulse: 'nodepulse 2.6s ease-out infinite',
        riseup: 'riseup 0.6s ease-out both',
      },
    },
  },
  plugins: [],
}
