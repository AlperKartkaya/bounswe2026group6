import "../styles/globals.css";
import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageTransition } from "@/components/layout/PageTransition";

export const metadata: Metadata = {
    title: "NEPH",
    description: "Neighborhood Emergency Preparedness Hub",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="root-layout-body">
                <main className="root-layout-content">
                    <PageTransition>{children}</PageTransition>
                </main>
                <SiteFooter />
            </body>
        </html>
    );
}