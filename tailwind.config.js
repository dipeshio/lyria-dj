/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                paper: '#F5F3EE',
                charcoal: '#1F1E1D',
                terracotta: '#C15F3C',
                muted: '#B1ADA1',
            },
            fontFamily: {
                serif: ['Merriweather', 'Georgia', 'serif'],
            },
            borderWidth: {
                '1': '1px',
            },
        },
    },
    plugins: [],
}
