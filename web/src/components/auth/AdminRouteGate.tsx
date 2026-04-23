"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearAccessToken, fetchCurrentUser, getAccessToken } from "@/lib/auth";

type AdminRouteGateProps = {
    children: React.ReactNode;
};

type AdminAuthStatus = "checking" | "allowed" | "forbidden" | "guest";

export function AdminRouteGate({ children }: AdminRouteGateProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [status, setStatus] = React.useState<AdminAuthStatus>("checking");

    React.useEffect(() => {
        let cancelled = false;

        async function resolveStatus() {
            setStatus("checking");

            const token = getAccessToken();
            if (!token || !token.trim()) {
                if (!cancelled) {
                    setStatus("guest");
                    router.replace(`/login?returnTo=${encodeURIComponent(pathname || "/admin")}`);
                }
                return;
            }

            try {
                const currentUser = await fetchCurrentUser(token);
                if (cancelled) {
                    return;
                }

                if (currentUser.isAdmin) {
                    setStatus("allowed");
                    return;
                }

                setStatus("forbidden");
                router.replace("/home");
            } catch {
                clearAccessToken();
                if (!cancelled) {
                    setStatus("guest");
                    router.replace(`/login?returnTo=${encodeURIComponent(pathname || "/admin")}`);
                }
            }
        }

        void resolveStatus();

        return () => {
            cancelled = true;
        };
    }, [pathname, router]);

    if (status !== "allowed") {
        return null;
    }

    return <>{children}</>;
}
