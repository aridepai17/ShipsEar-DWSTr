"use client";
import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";

export function WaveformPlayer({ file, onTimeUpdate }: { file: File; onTimeUpdate: (t: number) => void }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<WaveSurfer | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const ws = WaveSurfer.create({
            container: containerRef.current,
            waveColor: "#1D2831",
            progressColor: "#33D6C4",
            cursorColor: "#EAF2F4",
            height: 64,
            barWidth: 2,
            barGap: 1,
            normalize: true,
        });
        ws.loadBlob(file);
        ws.on("audioprocess", () => onTimeUpdate(ws.getCurrentTime()));
        ws.on("interaction", () => onTimeUpdate(ws.getCurrentTime()));
        wsRef.current = ws;
        return () => ws.destroy();
    }, [file, onTimeUpdate]);

    return (
        <div className="rounded-lg border border-border bg-surface p-2">
            <div ref={containerRef} />
            <button
                onClick={() => wsRef.current?.playPause()}
                className="mt-2 rounded-md bg-surface-hi px-3 py-1 text-sm text-text hover:bg-border"
            >
                Play / Pause
            </button>
        </div>
    );
}
