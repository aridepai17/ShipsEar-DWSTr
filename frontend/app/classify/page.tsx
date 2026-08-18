"use client";

import { useState } from "react";
import { UploadPanel } from "@/components/UploadPanel";
import { AcousticStack } from "@/components/AcousticStack";
import { ResultsPanel } from "@/components/ResultsPanel";
import { PredictResult } from "@/lib/api";

export default function ClassifyPage() {
    const [result, setResult] = useState<PredictResult | null>(null);
    const [file, setFile] = useState<File | null>(null);

    function handleUploadStart() {
        setResult(null);
        setFile(null);
    }

    return (
        <main className="mx-auto max-w-3xl space-y-8 px-6 py-24">
            <div>
                <h1 className="font-display text-3xl text-text">Classify a recording</h1>
                <p className="mt-2 text-muted">
                    Drop a hydrophone clip - up to 30 seconds - to see what the model hears.
                </p>
            </div>

            <UploadPanel
                onUploadStart={handleUploadStart}
                onResult={(r, f) => {
                    setResult(r);
                    setFile(f);
                }}
            />

            {result && file && (
                <div className="space-y-6">
                    <AcousticStack file={file} result={result} />
                    <ResultsPanel result={result} />
                </div>
            )}
        </main>
    );
}
