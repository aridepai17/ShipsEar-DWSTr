"use client";

import { useCallback, useState } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { useMutation } from "@tanstack/react-query";
import { classifyAudio, PredictResult } from "@/lib/api";

interface UploadPanelProps {
    onResult: (r: PredictResult, file: File) => void;
    onUploadStart?: () => void;
}

export function UploadPanel({ onResult, onUploadStart }: UploadPanelProps) {
    const [error, setError] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: classifyAudio,
        onError: (e: Error) => setError(e.message),
    });

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            setError(null);
            const file = acceptedFiles[0];
            if (!file) return;

            onUploadStart?.();
            mutation.mutate(file, { onSuccess: (result) => onResult(result, file) });
        },
        [mutation, onResult, onUploadStart],
    );

    const onDropRejected = useCallback(
        (fileRejections: FileRejection[]) => {
            const rejection = fileRejections[0];
            if (!rejection) return;

            onUploadStart?.();
            const errorMsg =
                rejection.errors[0]?.code === "too-many-files"
                    ? "Please upload only one audio file at a time."
                    : rejection.errors[0]?.message ||
                      "Unsupported file format. Please upload .wav, .mp3, .flac, or .ogg.";

            setError(errorMsg);
        },
        [onUploadStart],
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        onDropRejected,
        accept: { "audio/*": [".wav", ".mp3", ".flac", ".ogg"] },
        maxFiles: 1,
        disabled: mutation.isPending,
    });

    return (
        <div
            {...getRootProps()}
            className={`rounded-2xl border-2 border-dashed p-16 text-center transition ${
                mutation.isPending
                    ? "cursor-not-allowed border-border/50 bg-surface/50 opacity-75"
                    : isDragActive
                      ? "cursor-pointer border-accent bg-surface-hi"
                      : "cursor-pointer border-border bg-surface"
            }`}
        >
            <input {...getInputProps()} />
            {mutation.isPending ? (
                <p className="font-mono text-accent">Listening in 75ms slices...</p>
            ) : (
                <>
                    <p className="text-text">Drop a vessel recording here, or click to browse</p>
                    <p className="mt-2 text-sm text-muted">.wav, .mp3, .flac, .ogg</p>
                </>
            )}
            {error && <p className="mt-4 text-sm text-warn">{error}</p>}
        </div>
    );
}
