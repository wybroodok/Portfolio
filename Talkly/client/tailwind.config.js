/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Cyberpunk Corporate / Industrial Dark
        charcoal: '#0D0F12', // глубокий угольный фон
        panel: '#16191E', // мягкие контрастные панели
        'panel-hi': '#1E232B', // приподнятые элементы / hover
        // Акцент — неоновый фиолетовый (токен исторически зовётся `cyber`).
        cyber: '#A855F7', // активный статус / фокус
        'cyber-dim': '#7C3AED', // приглушённый фиолетовый для градиентов
        electric: '#00B0FF', // системные уведомления — электрический синий
        muted: '#6B7280',
        hairline: '#242A32', // тонкие разделители
      },
      boxShadow: {
        'cyber-glow': '0 0 0 1px rgba(168,85,247,0.45), 0 0 16px rgba(168,85,247,0.28)',
        'electric-glow': '0 0 12px rgba(0,176,255,0.35)',
      },
      keyframes: {
        'typing-bounce': {
          '0%, 80%, 100%': { transform: 'translateY(0)', opacity: '0.4' },
          '40%': { transform: 'translateY(-3px)', opacity: '1' },
        },
      },
      animation: {
        'typing-bounce': 'typing-bounce 1.2s infinite ease-in-out',
      },
    },
  },
  plugins: [],
};
