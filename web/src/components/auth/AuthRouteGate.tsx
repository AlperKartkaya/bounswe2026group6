"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getAccessToken } from "@/lib/auth";

type AuthRouteGateProps = {
    children: React.ReactNode;
    mode: "protected" | "guest-only";
    defaultAuthenticatedRoute?: string;
};

const AUTH_ROUTES = new Set(["/", "/login", "/signup", "/forgot-password", "/verify-email"]);

function getSafeInternalPath(candidate: string | null): string | null {
    if (!candidate) {
        return null;
    }

    if (!candidate.startsWith("/") || candidate.startsWith("//")) {
        return null;
    }

    return candidate;
}

function isAuthRoute(pathname: string) {
    return AUTH_ROUTES.has(pathname);
}

function buildReturnTo(pathname: string, searchParams: URLSearchParams) {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
}

export function AuthRouteGate({
    children,
    mode,
    defaultAuthenticatedRoute = "/home",
}: AuthRouteGateProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [ready, setReady] = React.useState(false);

    React.useEffect(() => {
        const token = getAccessToken();
        const hasToken = Boolean(token && token.trim());

        if (mode === "protected") {
            if (!hasToken) {
                const returnTo = buildReturnTo(pathname, searchParams);
                router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
                return;
            }

            setReady(true);
            return;
        }

        if (hasToken) {
            const requestedReturnTo = getSafeInternalPath(searchParams.get("returnTo"));
            const target =
                requestedReturnTo && !isAuthRoute(requestedReturnTo)
                    ? requestedReturnTo
                    : defaultAuthenticatedRoute;

            router.replace(target);
            return;
        }

        setReady(true);
    }, [defaultAuthenticatedRoute, mode, pathname, router, searchParams]);

    if (!ready) {
        return null;
    }

    return <>{children}</>;
}