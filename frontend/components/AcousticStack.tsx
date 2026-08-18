"use client";
import { useState } from "react";
import { WaveformPlayer } from "./WaveformPlayer";
import { SpectrogramDisplay } from "./SpectrogramDisplay";
import { SegmentTimeline } from "./SegmentTimeline";
import { PredictResult } from "@/lib/api";

export function AcousticStack({ file, result }: { file: File; result: PredictResult }) {
    const [currentTime, setCurrentTime] = useState(0);

    return (
        <div className="space-y-2">
            <WaveformPlayer file={file} onTimeUpdate={setCurrentTime} />
            <SpectrogramDisplay b64={result.spectrogram_b64} />
            <SegmentTimeline
                timeline={result.timeline}
                classNames={Object.keys(result.class_probabilities)}
                currentTime={currentTime}
            />
        </div>
    );
}
