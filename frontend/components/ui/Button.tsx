import Link from "next/link";
import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost";
const BASE = "inline-flex items-center justify-center rounded-full px-6 py-3 font-medium transition";
const VARIANTS: Record<Variant, string> = {
    primary: "bg-accent text-bg hover:opacity-90",
    ghost: "border border-border text-text hover:bg-surface-hi",
};

export function Button({
    variant = "primary",
    className = "",
    children,
    ...props
}: { variant?: Variant; className?: string; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button className={`${BASE} ${VARIANTS[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
}

export function LinkButton({
    href,
    variant = "primary",
    className = "",
    children,
}: {
    href: string;
    variant?: Variant;
    className?: string;
    children: ReactNode;
}) {
    return (
        <Link href={href} className={`${BASE} ${VARIANTS[variant]} ${className}`}>
            {children}
        </Link>
    );
}
