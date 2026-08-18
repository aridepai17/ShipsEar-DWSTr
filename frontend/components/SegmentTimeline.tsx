"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const playheadRef = useRef<HTMLCanvasElement>(null);

    const [zoom, setZoom] = useState(1); // 1x to 10x
    const [panX, setPanX] = useState(0); // Normalized offset [0, 1 - 1/zoom]
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef<{ clientX: number; startPanX: number } | null>(null);

    const [hover, setHover] = useState<{ entry: TimelineEntry; x: number } | null>(null);
    const [size, setSize] = useState({ w: 0, h: 0 });

    const colorMap = useMemo(
        () => Object.fromEntries(classNames.map((c, i) => [c, PALETTE[i % PALETTE.length]])),
        [classNames],
    );
    const segmentDuration = (timeline[1]?.start_s ?? 0.075) - (timeline[0]?.start_s ?? 0);
    const displayClasses = useMemo(() => smoothForDisplay(timeline), [timeline]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
            }
        });

        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    const applyZoom = useCallback((newZoom: number, focalPointFraction = 0.5) => {
        setZoom((prevZoom) => {
            const targetZoom = Math.max(1, Math.min(10, newZoom));
            if (targetZoom === 1) {
                setPanX(0);
                return 1;
            }

            setPanX((prevPan) => {
                const currentFocal = prevPan + focalPointFraction / prevZoom;
                const newPan = currentFocal - focalPointFraction / targetZoom;
                const maxPan = 1 - 1 / targetZoom;
                return Math.max(0, Math.min(maxPan, newPan));
            });

            return targetZoom;
        });
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            const isZoomingIn = e.deltaY < 0;
            const isZoomingOut = e.deltaY > 0;

            if ((!isZoomingIn && !isZoomingOut) || (zoom <= 1 && isZoomingOut) || (zoom >= 10 && isZoomingIn)) {
                return;
            }

            e.preventDefault();
            const rect = container.getBoundingClientRect();
            const focalFraction = (e.clientX - rect.left) / rect.width;
            const delta = isZoomingIn ? 1.25 : 0.8;
            applyZoom(zoom * delta, focalFraction);
        };

        container.addEventListener("wheel", handleWheel, { passive: false });
        return () => container.removeEventListener("wheel", handleWheel);
    }, [zoom, applyZoom]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const { width, height } = canvas.getBoundingClientRect();
        if (width === 0 || height === 0) return;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);

        const totalSegments = timeline.length;
        const segW = (width * zoom) / totalSegments;
        const startPixelOffset = -panX * zoom * width;

        timeline.forEach((seg, i) => {
            const x = startPixelOffset + i * segW;
            if (x + segW < 0 || x > width) return;

            ctx.fillStyle = colorMap[displayClasses[i]] ?? "#33D6C4";
            ctx.globalAlpha = 0.35 + seg.confidence * 0.65;
            ctx.fillRect(x, 0, Math.ceil(segW) + 0.5, height);
        });
    }, [timeline, displayClasses, colorMap, size, zoom, panX]);

    useEffect(() => {
        const canvas = playheadRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const { width, height } = canvas.getBoundingClientRect();
        if (width === 0 || height === 0) return;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);

        const totalDuration = timeline.length * segmentDuration;
        const timeFraction = Math.min(currentTime / totalDuration, 1);
        const x = (timeFraction - panX) * zoom * width;

        if (x >= 0 && x <= width) {
            ctx.fillStyle = "#EAF2F4";
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = 4;
            ctx.fillRect(x - 1.5, 0, 3, height);
        }
    }, [currentTime, timeline.length, segmentDuration, size, zoom, panX]);

    function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
        if (zoom <= 1) return;
        setIsDragging(true);
        dragStartRef.current = { clientX: e.clientX, startPanX: panX };
    }

    function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
        const rect = e.currentTarget.getBoundingClientRect();
        const clientX = e.clientX - rect.left;

        if (isDragging && dragStartRef.current) {
            const deltaPx = e.clientX - dragStartRef.current.clientX;
            const deltaPan = -deltaPx / (rect.width * zoom);
            const maxPan = 1 - 1 / zoom;
            setPanX(Math.max(0, Math.min(maxPan, dragStartRef.current.startPanX + deltaPan)));
            setHover(null);
            return;
        }

        const normalizedPos = panX + (clientX / rect.width) * (1 / zoom);
        const idx = Math.min(timeline.length - 1, Math.max(0, Math.floor(normalizedPos * timeline.length)));

        setHover({
            entry: timeline[idx],
            x: clientX,
        });
    }

    function handleMouseUp() {
        setIsDragging(false);
        dragStartRef.current = null;
    }

    const containerWidth = size.w || 300;

    return (
        <div className="group relative w-full select-none">
            <div className="absolute right-3 top-3 z-30 flex items-center gap-1 rounded-lg border border-border/80 bg-surface-hi/90 p-1 backdrop-blur-md shadow-md">
                <button
                    type="button"
                    onClick={() => applyZoom(zoom + 0.5)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-sm font-semibold text-text transition hover:bg-surface hover:text-accent"
                    title="Zoom In"
                >
                    +
                </button>
                <button
                    type="button"
                    onClick={() => applyZoom(zoom - 0.5)}
                    disabled={zoom <= 1}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-sm font-semibold text-text transition hover:bg-surface hover:text-accent disabled:opacity-40"
                    title="Zoom Out"
                >
                    −
                </button>
                {zoom > 1 && (
                    <button
                        type="button"
                        onClick={() => applyZoom(1)}
                        className="px-2 py-0.5 font-mono text-xs text-muted hover:text-text transition"
                        title="Reset Zoom"
                    >
                        {zoom.toFixed(1)}x Reset
                    </button>
                )}
            </div>

            <div
                ref={containerRef}
                className={`relative h-36 w-full overflow-hidden rounded-xl border border-border bg-surface sm:h-44 md:h-48 ${
                    zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-crosshair"
                }`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => {
                    handleMouseUp();
                    setHover(null);
                }}
            >
                <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
                <canvas ref={playheadRef} className="pointer-events-none absolute inset-0 h-full w-full" />
            </div>

            {hover && !isDragging && (
                <div
                    className="pointer-events-none absolute -top-11 z-40 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-surface-hi px-3 py-1.5 font-mono text-xs font-medium text-text shadow-xl backdrop-blur-sm"
                    style={{
                        left: `${Math.max(65, Math.min(hover.x, containerWidth - 65))}px`,
                    }}
                >
                    <span style={{ color: colorMap[hover.entry.class] }}>● </span>
                    {hover.entry.class} · {hover.entry.start_s.toFixed(2)}s ·{" "}
                    {(hover.entry.confidence * 100).toFixed(0)}%
                </div>
            )}
        </div>
    );
}
