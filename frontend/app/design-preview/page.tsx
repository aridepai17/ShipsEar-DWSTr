import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const SWATCHES = [
    { name: "bg", hex: "#070B10" },
    { name: "surface", hex: "#0F161D" },
    { name: "surface-hi", hex: "#161F28" },
    { name: "text", hex: "#EAF2F4" },
    { name: "muted", hex: "#7C93A0" },
    { name: "accent", hex: "#33D6C4" },
    { name: "warn", hex: "#E8A857" },
    { name: "border", hex: "#1D2831" },
];

export default function DesignPreviewPage() {
    return (
        <div className="mx-auto max-w-3xl space-y-12 px-6 py-16">
            <section>
                <h1 className="font-display text-4xl text-text">Design tokens</h1>
                <p className="mt-2 font-body text-muted">Space Grotesk display, Inter body, IBM Plex Mono data.</p>
                <p className="mt-4 font-mono text-sm text-accent">95.1% · 12 classes · 75ms</p>
            </section>

            <section className="grid grid-cols-4 gap-4">
                {SWATCHES.map((s) => (
                    <div key={s.name} className="text-center">
                        <div
                            className="h-16 w-full rounded-lg border border-border"
                            style={{ backgroundColor: s.hex }}
                        />
                        <p className="mt-2 font-mono text-xs text-muted">{s.name}</p>
                    </div>
                ))}
            </section>

            <section className="space-y-4">
                <Card>
                    <p className="text-text">Card primitive with body text inside it.</p>
                </Card>
                <div className="flex gap-4">
                    <Button>Primary</Button>
                    <Button variant="ghost">Ghost</Button>
                    <LinkButton href="/classify">Link button</LinkButton>
                </div>
            </section>
        </div>
    );
}
