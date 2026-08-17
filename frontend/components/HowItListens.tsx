import { Card } from "@/components/ui/Card";

const STEPS = [
    {
        title: "Depthwise-separable convolution",
        body: "Each 75ms mel-spectrogram slice passes through a lightweight convolution block that picks out local frequency-time texture - the acoustic equivalent of edge detection.",
    },
    {
        title: "Patch embedding",
        body: "The convolution's output is split into 32 patches and projected into a 64-dimensional sequence, the same way a vision transformer treats an image as a sequence of patches.",
    },
    {
        title: "Transformer encoder",
        body: "Six self-attention blocks let every patch weigh every other patch - the model learns which frequency bands matter together, not just which are loud.",
    },
    {
        title: "Classification head",
        body: "A learned class token gathers context from the whole sequence and is projected down to a probability across the 12 ShipsEar vessel types.",
    },
];

export function HowItListens() {
    return (
        <section className="mx-auto max-w-5xl px-6 py-24">
            <p className="mb-2 font-mono text-sm uppercase tracking-[0.2em] text-accent">How it listens</p>
            <h2 className="font-display text-3xl text-text sm:text-4xl">
                Four stages, from raw waveform to vessel class.
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
                {STEPS.map((step, i) => (
                    <Card key={step.title}>
                        <span className="font-mono text-xs text-muted">0{i + 1}</span>
                        <h3 className="mt-2 font-display text-xl text-text">{step.title}</h3>
                        <p className="mt-2 text-sm text-muted">{step.body}</p>
                    </Card>
                ))}
            </div>
        </section>
    );
}
