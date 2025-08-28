// tailwind.config.js actualizado con estilo iOS 26 y mejoras para el dashboard
module.exports = {
    content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}", "*.{js,ts,jsx,tsx,mdx}"],
    theme: {
        extend: {
            colors: {
                'app-bg': '#121212',
                'app-surface': '#1E1E1E',
                ios: {
                    primary: '#007AFF', // Azul Apple
                    secondary: '#5856D6', // Morado iOS moderno
                    accent: '#FF2D55',
                    neutral: {
                        100: '#F5F5F5',
                        200: '#E5E5EA',
                        800: '#2C2C2E',
                        900: '#1C1C1E'
                    },
                    glass: 'rgba(255, 255, 255, 0.1)',
                },
                // Colores adicionales para el dashboard
                dashboard: {
                    bg: '#121212',
                    surface: '#1f1f1f',
                    card: 'rgba(31, 41, 55, 0.4)',
                    'card-hover': 'rgba(55, 65, 81, 0.6)',
                    text: {
                        primary: '#ffffff',
                        secondary: '#9ca3af',
                        muted: '#6b7280'
                    },
                    accent: {
                        cyan: '#06b6d4',
                        green: '#10b981',
                        red: '#ef4444'
                    }
                }
            },
            fontFamily: {
                ios: ['"SF Pro"', 'system-ui', '-apple-system', 'sans-serif'],
                product: ['ProductSans', 'sans-serif'],
                inter: ['Inter', 'sans-serif'],
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'], // Fallback mejorado
            },
            fontSize: {
                'ios-title': ['1.8rem', { lineHeight: '2.2rem', fontWeight: '700' }],
                'ios-body': ['1rem', { lineHeight: '1.5rem' }],
                'ios-caption': ['0.8rem', { lineHeight: '1rem' }],
                // Tamaños adicionales para el dashboard
                'dashboard-title': ['1.5rem', { lineHeight: '2rem', fontWeight: '700' }],
                'dashboard-subtitle': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '600' }],
                'dashboard-body': ['0.875rem', { lineHeight: '1.25rem' }],
                'dashboard-caption': ['0.75rem', { lineHeight: '1rem' }],
            },
            borderRadius: {
                'ios-sm': '0.5rem',
                'ios-md': '1rem',
                'ios-lg': '1.5rem',
                // Radius adicionales
                'dashboard': '0.75rem',
                'dashboard-lg': '1rem',
            },
            boxShadow: {
                ios: '0 4px 12px rgba(0, 0, 0, 0.1)',
                'ios-hover': '0 8px 24px rgba(0, 0, 0, 0.15)',
                // Sombras para el dashboard
                'dashboard': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                'dashboard-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                'dashboard-card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            },
            backdropBlur: {
                'dashboard': '12px',
            },
            spacing: {
                // Espaciado específico para safe areas y márgenes
                'safe-top': 'env(safe-area-inset-top)',
                'safe-bottom': 'env(safe-area-inset-bottom)',
                'safe-left': 'env(safe-area-inset-left)',
                'safe-right': 'env(safe-area-inset-right)',
                // Espaciado para navbar flotante
                'navbar': '80px',
                'navbar-safe': 'calc(80px + env(safe-area-inset-bottom))',
            },
            minHeight: {
                'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
                'content': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 80px)',
            },
            maxWidth: {
                'dashboard': '1024px',
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'scale-in': 'scaleIn 0.2s ease-out',
                'shine': 'shine 5s linear infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                shine: {
                    '0%': { 'background-position': '100%' },
                    '100%': { 'background-position': '-100%' },
                },
            },
            transitionTimingFunction: {
                'ios': 'cubic-bezier(0.23, 1, 0.32, 1)',
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        // Plugin personalizado para clases utilitarias
        function ({ addUtilities, theme }) {
            const newUtilities = {
                // Clases para safe areas
                '.pt-safe': {
                    paddingTop: 'env(safe-area-inset-top)',
                },
                '.pb-safe': {
                    paddingBottom: 'env(safe-area-inset-bottom)',
                },
                '.pl-safe': {
                    paddingLeft: 'env(safe-area-inset-left)',
                },
                '.pr-safe': {
                    paddingRight: 'env(safe-area-inset-right)',
                },
                '.px-safe': {
                    paddingLeft: 'env(safe-area-inset-left)',
                    paddingRight: 'env(safe-area-inset-right)',
                },
                '.py-safe': {
                    paddingTop: 'env(safe-area-inset-top)',
                    paddingBottom: 'env(safe-area-inset-bottom)',
                },
                '.p-safe': {
                    paddingTop: 'env(safe-area-inset-top)',
                    paddingBottom: 'env(safe-area-inset-bottom)',
                    paddingLeft: 'env(safe-area-inset-left)',
                    paddingRight: 'env(safe-area-inset-right)',
                },
                // Clases para márgenes con safe areas
                '.mt-safe': {
                    marginTop: 'max(20px, env(safe-area-inset-top))',
                },
                '.mb-safe': {
                    marginBottom: 'max(24px, env(safe-area-inset-bottom))',
                },
                '.mx-safe': {
                    marginLeft: 'max(16px, env(safe-area-inset-left))',
                    marginRight: 'max(16px, env(safe-area-inset-right))',
                },
                '.m-safe': {
                    marginTop: 'max(20px, env(safe-area-inset-top))',
                    marginBottom: 'max(24px, env(safe-area-inset-bottom))',
                    marginLeft: 'max(16px, env(safe-area-inset-left))',
                    marginRight: 'max(16px, env(safe-area-inset-right))',
                },
                // Clases para scroll sin barra
                '.scrollbar-hide': {
                    'scrollbar-width': 'none',
                    '-ms-overflow-style': 'none',
                    '&::-webkit-scrollbar': {
                        display: 'none',
                    },
                },
                '.scroll-smooth-hidden': {
                    'overflow-y': 'auto',
                    'scrollbar-width': 'none',
                    '-ms-overflow-style': 'none',
                    '-webkit-overflow-scrolling': 'touch',
                    'scroll-behavior': 'smooth',
                    '&::-webkit-scrollbar': {
                        display: 'none',
                    },
                },
                // Clases para glass effect
                '.glass': {
                    'backdrop-filter': 'blur(12px)',
                    'background-color': 'rgba(255, 255, 255, 0.1)',
                },
                '.glass-dark': {
                    'backdrop-filter': 'blur(12px)',
                    'background-color': 'rgba(0, 0, 0, 0.2)',
                },
            };

            addUtilities(newUtilities, ['responsive']);
        },
    ],
};
