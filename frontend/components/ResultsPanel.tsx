"use client";

import { PredictResult } from "@/lib/api";

export function ResultsPanel({ result }: { result: PredictResult }) {
    const sorted = Object.entries(result.class_probabilities).sort((a, b) => b[1] - a[1]);

    return (
        <div className="rounded-2xl border border-border bg-surface p-8">
            <div className="flex items-baseline justify-between">
                <h2 className="font-display text-3xl text-text">{result.predicted_class}</h2>
                <span className="font-mono text-accent">{(result.confidence * 100).toFixed(1)}%</span>
            </div>
            <p className="mt-1 text-sm text-muted">
                {result.num_segments} segments · {result.duration_s}s clip
            </p>

            <div className="mt-6 space-y-2">
                {sorted.map(([cls, prob]) => (
                    <div key={cls} className="flex items-center gap-3">
                        <span className="w-32 shrink-0 text-sm text-muted">{cls}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-hi">
                            <div className="h-full bg-accent" style={{ width: `${prob * 100}%` }} />
                        </div>
                        <span className="w-12 text-right font-mono text-xs text-muted">{(prob * 100).toFixed(0)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
