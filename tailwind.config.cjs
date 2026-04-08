/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{js,jsx}"],
    theme: {
        extend: {
            borderRadius: {
                lg: '0px',
                md: '0px',
                sm: '0px'
            },
            fontFamily: {
                tight: ['Inter Tight', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            colors: {
                void: '#050505',
                slab: '#0F0F12',
                stroke: '#1E1E24',
                mercury: '#88888D',
            },
        }
    },
    plugins: [require("tailwindcss-animate")],
}
