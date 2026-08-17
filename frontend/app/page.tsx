// frontend/app/page.tsx
import { Hero } from "@/components/Hero";
import { ModelStats } from "@/components/ModelStats";
import { HowItListens } from "@/components/HowItListens";
import { FAQAccordion } from "@/components/FAQAccordion";
import { Footer } from "@/components/Footer";

export default function LandingPage() {
    return (
        <main>
            <Hero />
            <ModelStats />
            <HowItListens />
            <FAQAccordion />
            <Footer />
        </main>
    );
}
