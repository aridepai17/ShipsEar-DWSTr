export interface TimelineEntry {
    start_s: number;
    class: string;
    confidence: number;
}
export interface PredictResult {
    predicted_class: string;
    confidence: number;
    duration_s: number;
    num_segments: number;
    class_probabilities: Record<string, number>;
    timeline: TimelineEntry[];
    /** Base64 PNG (no data-URI prefix), added in Phase 7. Nullable — the
     *  renderer fails soft server-side so a spectrogram outage never blocks
     *  a real classification result. */
    spectrogram_b64: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function classifyAudio(file: File): Promise<PredictResult> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_URL}/predict`, { method: "POST", body: form });
    if (!res.ok) throw new Error((await res.json()).detail ?? "Classification failed.");
    return res.json();
}
