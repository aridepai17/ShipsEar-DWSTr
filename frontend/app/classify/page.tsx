"use client";

import { useEffect, useState } from "react";
import { UploadPanel } from "@/components/UploadPanel";
import { ResultsPanel } from "@/components/ResultsPanel";
import { SegmentTimeline } from "@/components/SegmentTimeline";
import { PredictResult } from "@/lib/api";

export default function ClassifyPage() {
    const [result, setResult] = useState<PredictResult | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    // Revoke object URL on component unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, [audioUrl]);

    function handleUploadStart() {
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        setAudioUrl(null);
        setResult(null);
        setCurrentTime(0);
    }

    function handleResult(r: PredictResult, file: File) {
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        setAudioUrl(URL.createObjectURL(file));
        setResult(r);
        setCurrentTime(0);
    }

    return (
        <main className="mx-auto max-w-3xl space-y-8 px-6 py-24">
            <div>
                <h1 className="font-display text-3xl text-text">Classify a recording</h1>
                <p className="mt-2 text-muted">
                    Drop a hydrophone clip — up to 30 seconds — to see what the model hears.
                </p>
            </div>

            <UploadPanel onUploadStart={handleUploadStart} onResult={handleResult} />

            {result && (
                <div className="space-y-6">
                    <audio
                        src={audioUrl ?? undefined}
                        controls
                        className="w-full"
                        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                    />
                    <SegmentTimeline
                        timeline={result.timeline}
                        classNames={Object.keys(result.class_probabilities)}
                        currentTime={currentTime}
                    />
                    <ResultsPanel result={result} />
                </div>
            )}
        </main>
    );
}
