import { apiRequest } from "@/lib/api";

export type EmergencyOverviewTotals = {
    totalEmergencies: number;
    activeEmergencies: number;
    resolvedEmergencies: number;
    closedEmergencies: number;
};

export type EmergencyOverviewStatusBreakdown = {
    pending: number;
    inProgress: number;
    resolved: number;
    cancelled: number;
};

export type EmergencyOverviewUrgencyBreakdown = {
    low: number;
    medium: number;
    high: number;
};

export type EmergencyOverviewRecentActivity = {
    createdLast24Hours: number;
    createdLast7Days: number;
    resolvedLast24Hours: number;
    resolvedLast7Days: number;
    cancelledLast24Hours: number;
    cancelledLast7Days: number;
};

export type EmergencyOverviewRegionItem = {
    city: string;
    total: number;
    active: number;
    pending: number;
    inProgress: number;
    resolved: number;
    cancelled: number;
};

export type EmergencyOverview = {
    totals: EmergencyOverviewTotals;
    statusBreakdown: EmergencyOverviewStatusBreakdown;
    urgencyBreakdown: EmergencyOverviewUrgencyBreakdown;
    recentActivity: EmergencyOverviewRecentActivity;
    regionSummary?: EmergencyOverviewRegionItem[];
};

type EmergencyOverviewResponse = {
    overview: EmergencyOverview;
};

export async function fetchAdminEmergencyOverview(
    token: string,
    options: { includeRegionSummary?: boolean } = {}
) {
    const query = options.includeRegionSummary ? "?includeRegionSummary=true" : "";
    const response = await apiRequest<EmergencyOverviewResponse>(
        `/admin/emergency-overview${query}`,
        {
            token: token.trim(),
        }
    );

    return response.overview;
}
