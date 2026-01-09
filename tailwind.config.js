/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#3B82F6", // Vibrant Blue
                secondary: "#64748B", // Slate
                accent: "#10B981", // Emerald
                dark: "#1E293B",
                light: "#F8FAFC",
            },
            fontFamily: {
                sans: ['Outfit', 'sans-serif'],
            },
            animation: {
                'spin-pause': 'spin-vertical-pause 3s ease-in-out infinite',
            }
        },
    },
    plugins: [],
}
