"use client";
import { useEffect, useState } from "react";

export function Footer() {
    const [time, setTime] = useState<string | null>(null);

    useEffect(() => {
        const update = () => setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <footer className="border-t border-border px-6 py-10">
            <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
                <p className="font-display text-sm text-text">SonarClass</p>
                <p className="font-mono text-xs text-muted">{time ?? "--:--"} local</p>
            </div>
        </footer>
    );
}
