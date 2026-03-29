import { AppShell } from "@/components/layout/AppShell";
import { SectionCard } from "@/components/ui/display/SectionCard";
import { SectionHeader } from "@/components/ui/display/SectionHeader";

export default function WhoWeArePage() {
    return (
        <AppShell title="Who We Are">
            <div className="who-we-are-grid">
                <SectionCard>
                    <SectionHeader
                        title="CMPE354 - Group 6"
                        subtitle="Neighborhood Emergency Preparedness Hub"
                    />

                    <p className="project-paragraph">
                        We are Computer Engineering students working on an offline-first
                        disaster preparedness and mutual aid platform for CMPE354.
                    </p>
                </SectionCard>

                <SectionCard>
                    <SectionHeader title="Team Members" subtitle="Group 6" />

                    <ul className="team-members-list">
                        <li>Berat Sayin</li>
                        <li>Rojhat Delibas</li>
                        <li>Ethem Erinc Cengiz</li>
                        <li>Gulce Tahtasiz</li>
                        <li>Kagan Can</li>
                        <li>Mehmet Can Gurbuz</li>
                        <li>Alper Kartkaya</li>
                    </ul>
                </SectionCard>
            </div>
        </AppShell>
    );
}
