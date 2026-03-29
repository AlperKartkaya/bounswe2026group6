"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

type BackButtonProps = {
    className?: string;
    fallbackHref?: string;
};

export function BackButton({ className, fallbackHref = "/home" }: BackButtonProps) {
    const router = useRouter();

    const handleBack = React.useCallback(() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
            return;
        }

        router.push(fallbackHref);
    }, [fallbackHref, router]);

    return (
        <button type="button" className={className} onClick={handleBack}>
            ← Back
        </button>
    );
}
