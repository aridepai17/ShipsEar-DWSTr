"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TimelineEntry } from "@/lib/api";

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

function smoothForDisplay(timeline: TimelineEntry[], windowSize = 5): string[] {
    const half = Math.floor(windowSize / 2);
    return timeline.map((_, i) => {
        const start = Math.max(0, i - half);
        const end = Math.min(timeline.length, i + half + 1);
        const counts: Record<string, number> = {};
        for (let j = start; j < end; j++) {
            counts[timeline[j].class] = (counts[timeline[j].class] ?? 0) + 1;
        }
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    });
}

export function SegmentTimeline({
    timeline,
    classNames,
    currentTime,
}: {
    timeline: TimelineEntry[];
    classNames: string[];
    currentTime: number;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const playheadRef = useRef<HTMLCanvasElement>(null);
    const [hover, setHover] = useState<TimelineEntry | null>(null);

    const colorMap = useMemo(
        () => Object.fromEntries(classNames.map((c, i) => [c, PALETTE[i % PALETTE.length]])),
        [classNames],
    );
    const segmentDuration = (timeline[1]?.start_s ?? 0.075) - (timeline[0]?.start_s ?? 0);
    const displayClasses = useMemo(() => smoothForDisplay(timeline), [timeline]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const { width, height } = canvas.getBoundingClientRect();
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        const segW = width / timeline.length;
        timeline.forEach((seg, i) => {
            ctx.fillStyle = colorMap[displayClasses[i]];
            ctx.globalAlpha = 0.35 + seg.confidence * 0.65;
            ctx.fillRect(i * segW, 0, Math.ceil(segW) + 0.5, height);
        });
    }, [timeline, displayClasses, colorMap]);

    useEffect(() => {
        const canvas = playheadRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const dpr = window.devicePixelRatio || 1;
        const { width, height } = canvas.getBoundingClientRect();
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);

        const totalDuration = timeline.length * segmentDuration;
        const x = Math.min(currentTime / totalDuration, 1) * width;
        ctx.fillStyle = "#EAF2F4";
        ctx.fillRect(x - 1, 0, 2, height);
    }, [currentTime, timeline.length, segmentDuration]);

    function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        const idx = Math.min(timeline.length - 1, Math.max(0, Math.floor(ratio * timeline.length)));
        setHover(timeline[idx]);
    }

    return (
        <div
            className="relative h-16 overflow-hidden rounded-lg border border-border bg-surface"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHover(null)}
        >
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
            <canvas ref={playheadRef} className="absolute inset-0 h-full w-full pointer-events-none" />
            {hover && (
                <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-surface-hi px-2 py-1 font-mono text-xs text-text">
                    {hover.class} · {hover.start_s}s · {(hover.confidence * 100).toFixed(0)}%
                </div>
            )}
        </div>
    );
}
