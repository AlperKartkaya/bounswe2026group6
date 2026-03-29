import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionCard } from "@/components/ui/display/SectionCard";
import { SectionHeader } from "@/components/ui/display/SectionHeader";

type TermsOfServicePageProps = {
    searchParams?: Promise<{
        from?: string;
    }>;
};

export default async function TermsOfServicePage({
    searchParams,
}: TermsOfServicePageProps) {
    const params = await searchParams;
    const isFromHome = params?.from === "home";
    const backHref = isFromHome
        ? "/home"
        : params?.from === "signup"
          ? "/signup?restore=1"
          : "/signup";
    const backLabel = isFromHome ? "Back to Home" : "Back to Sign Up";

    return (
        <div className="policy-page">
            <PageContainer>
                <div className="policy-content-wrap">
                    <Link
                        href={backHref}
                        className="policy-back-link"
                    >
                        ← {backLabel}
                    </Link>

                    <SectionCard className="policy-card">
                        <SectionHeader
                            title="Terms of Service"
                            subtitle="Last updated: March 2026"
                        />

                        <div className="policy-body">
                            <p>
                                This page is a placeholder Terms of Service for the
                                NEPH MVP. It explains the general expectations for using
                                the platform during the early development phase.
                            </p>

                            <div>
                                <h3 className="policy-section-title">
                                    1. Use of the platform
                                </h3>
                                <p className="policy-section-text">
                                    NEPH is intended to support emergency preparedness and
                                    neighborhood coordination. Users should provide
                                    accurate information and use the platform responsibly.
                                </p>
                            </div>

                            <div>
                                <h3 className="policy-section-title">
                                    2. Account responsibility
                                </h3>
                                <p className="policy-section-text">
                                    Users are responsible for maintaining the accuracy of
                                    their account information and keeping their credentials
                                    secure.
                                </p>
                            </div>

                            <div>
                                <h3 className="policy-section-title">
                                    3. Platform limitations
                                </h3>
                                <p className="policy-section-text">
                                    NEPH is an academic MVP and may not include full
                                    production-grade guarantees, legal protections, or
                                    emergency service integration at this stage.
                                </p>
                            </div>

                            <div>
                                <h3 className="policy-section-title">
                                    4. Future updates
                                </h3>
                                <p className="policy-section-text">
                                    These terms may be revised as the project evolves and
                                    more complete platform policies are defined.
                                </p>
                            </div>
                        </div>
                    </SectionCard>
                </div>
            </PageContainer>
        </div>
    );
}