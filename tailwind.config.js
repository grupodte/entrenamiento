/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],

    theme: {
        extend: {
            borderRadius: {
                '10px': '10px',
            },
            fontFamily: {
                inter: ['Inter', 'sans-serif'],
                product: ['ProductSans', 'sans-serif'],
            },
            colors: {
                'teal-light': '#dbfdff',
                'teal-medium': '#6ea0a0',
                'teal-dark': '#3a7c7c',
                greyburger: '#d9d9d9',
                skyblue: '#0071E3',
                green: '#0DD122',
                crem: '#ACACAC',
                skysoft: '#AEE4F8',
            },
            keyframes: {
                'slide-up': {
                    '0%': { transform: 'translateY(100%)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                'fade-in': {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                kenburns: {
                    '0%': {
                        transform: 'scale(1) translate(0, 0)',
                        filter: 'blur(0px)',
                    },
                    '100%': {
                        transform: 'scale(1.1) translate(-10px, 5px)',
                        filter: 'blur(1px)',
                    },
                },
            },
            animation: {
                'slide-up': 'slide-up 1s ease-out',
                'fade-in': 'fade-in 1s ease-out',
                'spin-slow': 'spin 20s linear infinite',
                kenburns: 'kenburns 20s ease-in-out infinite alternate',
            },
        },
    },

    plugins: [require('@tailwindcss/forms')],
};
  