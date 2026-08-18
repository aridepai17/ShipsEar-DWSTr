"use client";
import { useState } from "react";
import { UploadPanel } from "@/components/UploadPanel";
import { PredictResult } from "@/lib/api";

export default function ClassifyPage() {
    const [result, setResult] = useState<PredictResult | null>(null);

    return (
        <main className="mx-auto max-w-3xl px-6 py-24">
            <h1 className="font-display text-3xl text-text">Classify a recording</h1>
            <p className="mt-2 text-muted">Drop a hydrophone clip — up to 30 seconds — to see what the model hears.</p>

            <div className="mt-10">
                <UploadPanel onResult={(r) => setResult(r)} />
            </div>

            {result && (
                <pre className="mt-8 overflow-x-auto rounded-lg border border-border bg-surface p-4 font-mono text-xs text-muted">
                    {JSON.stringify(result, null, 2)}
                </pre>
            )}
        </main>
    );
}
