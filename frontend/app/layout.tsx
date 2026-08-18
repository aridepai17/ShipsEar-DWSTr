import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
const body = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono" });

export const metadata = {
    title: "ShipsEar-DWSTr Underwater Acoustic Classification",
    description: "A DWSTr model classifying ShipsEar vessel recordings, 75ms at a time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html
            lang="en"
            data-scroll-behavior="smooth"
            className={`${display.variable} ${body.variable} ${mono.variable}`}
        >
            <body className="bg-bg text-text font-body antialiased">
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
