"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function Hero() {
    return (
        <section className="mx-auto max-w-5xl px-6 pt-32 pb-24 text-center">
            <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-4 font-mono text-sm uppercase tracking-[0.2em] text-accent"
            >
                Underwater Acoustic Classification
            </motion.p>
            <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-display text-5xl sm:text-6xl font-medium leading-[1.05] text-text"
            >
                Twelve vessel classes
                <br />
                <span className="text-muted">Heard in 75-millisecond slices.</span>
            </motion.h1>
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="mx-auto mt-6 max-w-2xl text-muted"
            >
                A depthwise-separable convolution and transformer model trained on ShipsEar, reading log-mel
                spectrograms at 75-millisecond window at a time.
            </motion.p>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-8"
            >
                <Link
                    href="/classify"
                    className="inline-flex items-center rounded-full bg-accent px-6 py-3 font-medium text-bg transition hover:opacity-90"
                >
                    Classify Audio
                </Link>
            </motion.div>
        </section>
    );
}
