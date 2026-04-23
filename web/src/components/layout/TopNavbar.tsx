"use client";

import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { clearAccessToken, fetchCurrentUser, getAccessToken } from "@/lib/auth";

const navItemsOrdered = [
    { label: "Home", href: "/home" },
    { label: "News", href: "/news" },
    { label: "Emergency Numbers", href: "/emergency-numbers" },
    { label: "Admin", href: "/admin", requiresAdmin: true },
    { label: "Profile", href: "/profile" },
    { label: "Privacy & Security", href: "/privacy-security" },
];

const guestAllowedPaths = new Set(["/home", "/news", "/emergency-numbers"]);

export function TopNavbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [isAdmin, setIsAdmin] = React.useState(false);
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const menuRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        let cancelled = false;

        const syncAuthState = async () => {
            const token = getAccessToken();

            if (!token) {
                if (!cancelled) {
                    setIsAuthenticated(false);
                    setIsAdmin(false);
                }
                return;
            }

            if (!cancelled) {
                setIsAuthenticated(true);
            }

            try {
                const user = await fetchCurrentUser(token);
                if (!cancelled) {
                    setIsAdmin(Boolean(user.isAdmin));
                }
            } catch {
                clearAccessToken();
                if (!cancelled) {
                    setIsAuthenticated(false);
                    setIsAdmin(false);
                }
            }
        };

        const handleStorage = (event: StorageEvent) => {
            if (event.key === null || event.key === "neph_access_token") {
                void syncAuthState();
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                void syncAuthState();
            }
        };
        const handleFocus = () => {
            void syncAuthState();
        };
        const handleAuthChanged = () => {
            void syncAuthState();
        };

        void syncAuthState();

        window.addEventListener("storage", handleStorage);
        window.addEventListener("focus", handleFocus);
        window.addEventListener("neph-auth-changed", handleAuthChanged);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            cancelled = true;
            window.removeEventListener("storage", handleStorage);
            window.removeEventListener("focus", handleFocus);
            window.removeEventListener("neph-auth-changed", handleAuthChanged);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    React.useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);

    React.useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (!menuRef.current) return;
            if (!menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener("click", handleOutsideClick);
        return () => {
            document.removeEventListener("click", handleOutsideClick);
        };
    }, []);

    const handleLogout = () => {
        clearAccessToken();
        setIsAuthenticated(false);
        router.replace("/login");
    };

    const navItems = navItemsOrdered.filter((item) => {
        if (!isAuthenticated) {
            return guestAllowedPaths.has(item.href);
        }

        if (item.requiresAdmin) {
            return isAdmin;
        }

        return true;
    });

    return (
        <header className="top-navbar">
            <PageContainer className="top-navbar-inner">
                <Link href="/home" className="top-navbar-brand">
                    NEPH
                </Link>

                <nav className="top-navbar-nav">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`top-navbar-nav-item${pathname === item.href || pathname.startsWith(`${item.href}/`) ? " is-active" : ""}`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="top-navbar-user-menu" ref={menuRef}>
                    <button
                        type="button"
                        className="top-navbar-avatar-button"
                        onClick={(event) => {
                            event.stopPropagation();
                            setIsMenuOpen((prev) => !prev);
                        }}
                        aria-label="Open user menu"
                        aria-expanded={isMenuOpen}
                    >
                        {isAuthenticated ? (
                            "NP"
                        ) : (
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                            >
                                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
                                <path d="M4.5 20C5.2 16.8 8.2 14.5 12 14.5C15.8 14.5 18.8 16.8 19.5 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                        )}
                    </button>

                    {isMenuOpen ? (
                        <div className="top-navbar-dropdown" onClick={(event) => event.stopPropagation()}>
                            {isAuthenticated ? (
                                <>
                                    <Link
                                        href="/profile"
                                        className="top-navbar-dropdown-item"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Profile
                                    </Link>

                                    <button
                                        type="button"
                                        className="top-navbar-dropdown-item"
                                        onClick={() => {
                                            clearAccessToken();
                                            setIsAuthenticated(false);
                                            setIsMenuOpen(false);
                                            router.push("/login");
                                        }}
                                    >
                                        Switch Account
                                    </button>

                                    <button
                                        type="button"
                                        className="top-navbar-dropdown-item is-danger"
                                        onClick={handleLogout}
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        className="top-navbar-dropdown-item is-login"
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            router.push(`/login?returnTo=${encodeURIComponent(pathname)}`);
                                        }}
                                    >
                                        Log In
                                    </button>

                                    <button
                                        type="button"
                                        className="top-navbar-dropdown-item is-signup"
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            router.push("/signup");
                                        }}
                                    >
                                        Create Account
                                    </button>
                                </>
                            )}
                        </div>
                    ) : null}
                </div>
            </PageContainer>
        </header>
    );
}
