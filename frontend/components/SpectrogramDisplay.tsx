"use client";

import { motion } from "framer-motion";

export function SpectrogramDisplay({ b64 }: { b64: string | null }) {
    if (!b64) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            className="h-44 w-full overflow-hidden rounded-lg border border-border sm:h-64"
        >
            {/* eslint-disable-next-line @next/next/no-img-element -- base64 data URI */}
            <img
                src={`data:image/png;base64,${b64}`}
                alt="Log-mel spectrogram of the uploaded clip"
                className="h-full w-full object-cover"
                draggable={false}
            />
        </motion.div>
    );
}
