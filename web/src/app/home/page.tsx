"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { SectionCard } from "@/components/ui/display/SectionCard";
import { SectionHeader } from "@/components/ui/display/SectionHeader";
import { PrimaryButton } from "@/components/ui/buttons/PrimaryButton";
import { SecondaryButton } from "@/components/ui/buttons/SecondaryButton";
import { mockNews } from "@/lib/news";

const heroSlides = [
    {
        title: "Preparedness starts before emergencies",
        description:
            "Keep your emergency profile, health details, and location preferences current so support teams can coordinate faster.",
        ctaLabel: "Update Profile",
        ctaHref: "/profile",
    },
    {
        title: "Report incidents from the mobile app",
        description:
            "Use the NEPH mobile app to quickly submit emergency requests and stay connected with neighborhood responders.",
        ctaLabel: "Open News",
        ctaHref: "/news",
    },
    {
        title: "Track local updates in one place",
        description:
            "Follow announcements, preparedness updates, and community coordination news from a single dashboard.",
        ctaLabel: "Browse News",
        ctaHref: "/news",
    },
];

export default function HomePage() {
    const router = useRouter();
    const [activeSlide, setActiveSlide] = React.useState(0);

    React.useEffect(() => {
        const timer = setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % heroSlides.length);
        }, 5000);

        return () => clearInterval(timer);
    }, []);

    const currentSlide = heroSlides[activeSlide];
    const previewNews = mockNews.slice(0, 3);

    return (
        <AppShell>
            <div className="home-page">
                <section className="home-hero">
                    <div className="home-hero-grid">
                        <div>
                            <p className="home-hero-eyebrow">NEPH Emergency Hub</p>
                            <h1 className="home-hero-title">{currentSlide.title}</h1>
                            <p className="home-hero-description">{currentSlide.description}</p>

                            <div className="home-hero-actions">
                                <PrimaryButton
                                    className="home-hero-primary-action"
                                    onClick={() => router.push(currentSlide.ctaHref)}
                                >
                                    {currentSlide.ctaLabel}
                                </PrimaryButton>

                                <SecondaryButton
                                    className="home-hero-secondary-action"
                                    onClick={() => router.push("/news")}
                                >
                                    View Announcements
                                </SecondaryButton>
                            </div>
                        </div>

                        <div className="home-slide-panel">
                            <p className="home-slide-panel-title">Slide Overview</p>
                            <div className="home-slide-list">
                                {heroSlides.map((slide, index) => (
                                    <button
                                        key={slide.title}
                                        type="button"
                                        className={`home-slide-item ${index === activeSlide ? "is-active" : ""}`}
                                        onClick={() => setActiveSlide(index)}
                                    >
                                        {slide.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <SectionCard>
                    <SectionHeader
                        title="Latest News"
                        subtitle="A short preview from announcements and community updates."
                    />

                    <div className="home-news-list">
                        {previewNews.map((item) => (
                            <article key={item.id} className="home-news-card">
                                <p className="home-news-category">{item.category}</p>
                                <h3 className="home-news-title">{item.title}</h3>
                                <p className="home-news-summary">{item.summary}</p>
                            </article>
                        ))}
                    </div>

                    <div className="home-news-action-wrap">
                        <SecondaryButton onClick={() => router.push("/news")}>View All News</SecondaryButton>
                    </div>
                </SectionCard>
            </div>
        </AppShell>
    );
}
