"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation } from "@tanstack/react-query";
import { classifyAudio, PredictResult } from "@/lib/api";

export function UploadPanel({ onResult }: { onResult: (r: PredictResult, file: File) => void }) {
    const [error, setError] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: classifyAudio,
        onError: (e: Error) => setError(e.message),
    });

    const onDrop = useCallback(
        (files: File[]) => {
            setError(null);
            const file = files[0];
            if (!file) return;
            mutation.mutate(file, { onSuccess: (result) => onResult(result, file) });
        },
        [mutation, onResult],
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "audio/*": [".wav", ".mp3", ".flac", ".ogg"] },
        maxFiles: 1,
    });

    return (
        <div
            {...getRootProps()}
            className={`rounded-2xl border-2 border-dashed p-16 text-center transition ${isDragActive ? "border-accent bg-surface-hi" : "border-border bg-surface"}`}
        >
            <input {...getInputProps()} />
            {mutation.isPending ? (
                <p className="font-mono text-accent">Listening in 75ms slices...</p>
            ) : (
                <>
                    <p className="text-text">Drop a vessel recording here, or click to browse</p>
                    <p className="mt-2 text-sm text-muted">.wav, .mp3, .flac</p>
                </>
            )}
            {error && <p className="mt-4 text-sm text-warn">{error}</p>}
        </div>
    );
}
