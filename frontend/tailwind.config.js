
/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,jsx}"],
    theme: {
        extend: {
            fontFamily: {
                display: ["'Syne'", "sans-serif"],
                mono: ["'JetBrains Mono'", "monospace"],
                body: ["'DM Sans'", "sans-serif"],
            },
            colors: {
                ox: {
                    bg: "#080910",
                    surface: "#0e1018",
                    card: "#121520",
                    border: "#1e2235",
                    green: "#00e5a0",
                    teal: "#00b4d8",
                    red: "#ff4d6d",
                    yellow: "#ffd60a",
                    muted: "#4a5068",
                    sub: "#2a2f45",
                },
            },
            animation: {
                "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "fade-up": "fadeUp 0.4s ease forwards",
                "shimmer": "shimmer 2s infinite linear",
            },
            keyframes: {
                fadeUp: {
                    "0%": { opacity: 0, transform: "translateY(12px)" },
                    "100%": { opacity: 1, transform: "translateY(0)" },
                },
                shimmer: {
                    "0%": { backgroundPosition: "-200% 0" },
                    "100%": { backgroundPosition: "200% 0" },
                },
            },
        },
    },
    plugins: [],
};