"use client";

import { useMemo } from "react";
import { PredictResult } from "@/lib/api";

const PALETTE = [
    "#33D6C4",
    "#E8A857",
    "#7C93A0",
    "#5B8DEF",
    "#D96C6C",
    "#8CD9A0",
    "#C77DD9",
    "#E0D25B",
    "#6BB8D9",
    "#D98F5B",
    "#9D8CE0",
    "#5BD9B0",
];

export function ResultsPanel({ result }: { result: PredictResult }) {
    // Preserve original class ordering to match SegmentTimeline's color mapping
    const classNames = useMemo(() => Object.keys(result.class_probabilities), [result.class_probabilities]);

    const colorMap = useMemo(
        () => Object.fromEntries(classNames.map((c, i) => [c, PALETTE[i % PALETTE.length]])),
        [classNames],
    );

    const sortedProbabilities = useMemo(() => {
        return Object.entries(result.class_probabilities).sort(([, a], [, b]) => b - a);
    }, [result.class_probabilities]);

    const topClassColor = colorMap[result.predicted_class] ?? "#33D6C4";

    return (
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xl">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="font-display text-3xl font-semibold tracking-tight text-text">
                        {result.predicted_class}
                    </h2>
                    <p className="mt-1 font-mono text-sm text-muted">
                        {result.num_segments} segments · {result.duration_s}s clip
                    </p>
                </div>
                <span className="font-mono text-xl font-medium" style={{ color: topClassColor }}>
                    {(result.confidence * 100).toFixed(1)}%
                </span>
            </div>

            {/* Probability Breakdown */}
            <div className="mt-8 space-y-3.5">
                {sortedProbabilities.map(([className, prob]) => {
                    const pct = Math.round(prob * 100);
                    const color = colorMap[className] ?? "#33D6C4";

                    return (
                        <div key={className} className="flex items-center gap-4 text-sm">
                            {/* Vessel Name + Color Dot */}
                            <div className="flex w-44 items-center gap-2.5 truncate text-muted">
                                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                                <span className="truncate">{className}</span>
                            </div>

                            {/* Dynamic Color Progress Bar */}
                            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-surface-hi">
                                <div
                                    className="h-full rounded-full transition-all duration-500 ease-out"
                                    style={{
                                        width: `${pct}%`,
                                        backgroundColor: color,
                                    }}
                                />
                            </div>

                            {/* Percentage */}
                            <div className="w-10 text-right font-mono text-xs text-muted">{pct}%</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
