import type { Config } from "tailwindcss";

export default {
    content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
    theme: {
        extend: {
            colors: {
                bg: "#070B10",
                surface: "#0F161D",
                "surface-hi": "#161F28",
                text: "#EAF2F4",
                muted: "#7C93A0",
                accent: "#33D6C4",
                warn: "#E8A857",
                border: "#1D2831",
            },
            fontFamily: {
                display: ["var(--font-space-grotesk)"],
                body: ["var(--font-inter)"],
                mono: ["var(--font-plex-mono)"],
            },
        },
    },
    plugins: [],
} satisfies Config;
