"use client";
import { useState } from "react";

const FAQS = [
    {
        q: "What audio formats are supported?",
        a: "WAV, MP3, FLAC, and OGG. Files are resampled to 22,050 Hz mono before classification, matching the model's training data.",
    },
    {
        q: "How accurate is the model?",
        a: "97.2% on held-out ShipsEar test segments. Real-world recordings from different hydrophones or environments may perform differently.",
    },
    {
        q: "What's a 75ms segment, and why does it matter?",
        a: "The model never sees a whole clip at once - it classifies 75-millisecond windows independently, then the results are averaged. The timeline strip on the results page shows every one of those windows.",
    },
    {
        q: "Is there a limit on file length?",
        a: "Yes. 30 seconds. Longer clips are rejected before any processing starts, to keep classification fast and predictable.",
    },
];

export function FAQAccordion() {
    const [open, setOpen] = useState<number | null>(0);

    return (
        <section className="mx-auto max-w-3xl px-6 py-24">
            <p className="mb-2 font-mono text-sm uppercase tracking-[0.2em] text-accent">FAQs</p>
            <h2 className="font-display text-3xl text-text sm:text-4xl">Common questions</h2>
            <div className="mt-8 divide-y divide-border border-y border-border">
                {FAQS.map((item, i) => {
                    const isOpen = open === i;
                    return (
                        <div key={item.q}>
                            <button
                                onClick={() => setOpen(isOpen ? null : i)}
                                className="flex w-full items-center justify-between py-5 text-left"
                                aria-expanded={isOpen}
                            >
                                <span className="font-body text-text">{item.q}</span>
                                <span className="font-mono text-accent">{isOpen ? "-" : "+"}</span>
                            </button>
                            {isOpen && <p className="pb-5 text-sm text-muted">{item.a}</p>}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
