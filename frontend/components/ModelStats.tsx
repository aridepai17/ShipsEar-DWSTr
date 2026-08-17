"use client";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

const STATS = [
    { value: 97.17, suffix: "%", label: "Test Accuracy", note: "On held-out ShipsEar segments" },
    { value: 12, suffix: "", label: "Vessel classes", note: "Fine-grained ShipsEar types" },
    { value: 75, suffix: "ms", label: "Segment resolution", note: "Every prediction window" },
];

function Counter({ value }: { value: number }) {
    const mv = useMotionValue(0);
    const rounded = useTransform(mv, (v) => v.toFixed(value % 1 !== 0 ? 1 : 0));
    useEffect(() => {
        const c = animate(mv, value, { duration: 1.2, ease: "easeOut" });
        return c.stop;
    }, [value, mv]);
    return <motion.span>{rounded}</motion.span>;
}

export function ModelStats() {
    return (
        <section className="border-y border-border bg-surface">
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-6 py-16 sm:grid-cols-3">
                {STATS.map((s) => (
                    <div key={s.label} className="text-center">
                        <div className="font-mono text-4xl text-accent">
                            <Counter value={s.value} />
                            {s.suffix}
                        </div>
                        <div className="mt-2 font-medium text-text">{s.label}</div>
                        <div className="mt-1 text-sm text-muted">{s.note}</div>
                    </div>
                ))}
            </div>
        </section>
    );
}
