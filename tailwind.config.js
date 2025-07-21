// tailwind.config.js actualizado con estilo iOS 26
module.exports = {
    content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
    theme: {
        extend: {
            colors: {
                ios: {
                    primary: '#0A84FF', // Azul Apple moderno
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
                background: {
                    dark: '#121212',
                }
            },
            fontFamily: {
                ios: ['"SF Pro"', 'system-ui', '-apple-system', 'sans-serif'],
                product: ['ProductSans', 'sans-serif'],
                inter: ['Inter', 'sans-serif'],
            },
            fontSize: {
                'ios-title': ['1.8rem', { lineHeight: '2.2rem', fontWeight: '700' }],
                'ios-body': ['1rem', { lineHeight: '1.5rem' }],
                'ios-caption': ['0.8rem', { lineHeight: '1rem' }],
            },
            borderRadius: {
                'ios-sm': '0.5rem',
                'ios-md': '1rem',
                'ios-lg': '1.5rem',
            },
            boxShadow: {
                ios: '0 4px 12px rgba(0, 0, 0, 0.1)',
                'ios-hover': '0 8px 24px rgba(0, 0, 0, 0.15)',
            },


        },
    },
    plugins: [require('@tailwindcss/forms')],
};
