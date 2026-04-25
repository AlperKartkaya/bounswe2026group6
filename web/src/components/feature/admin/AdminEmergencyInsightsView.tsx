"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { getAccessToken, clearAccessToken } from "@/lib/auth";
import {
    fetchAdminEmergencyAnalytics,
    type EmergencyAnalytics,
    type EmergencyAnalyticsComparisonMetric,
} from "@/lib/admin";
import { formatOperationalLabel } from "@/lib/formatters";
import { SectionCard } from "@/components/ui/display/SectionCard";
import { SectionHeader } from "@/components/ui/display/SectionHeader";
import { PrimaryButton } from "@/components/ui/buttons/PrimaryButton";

function formatPercentChange(metric: EmergencyAnalyticsComparisonMetric) {
    if (metric.percentChange === null) {
        return "n/a";
    }
    const sign = metric.percentChange > 0 ? "+" : "";
    return `${sign}${metric.percentChange.toFixed(1)}%`;
}

function getTrend(metric: EmergencyAnalyticsComparisonMetric): "up" | "down" | "flat" {
    if (metric.delta > 0) return "up";
    if (metric.delta < 0) return "down";
    return "flat";
}

function trendArrow(trend: "up" | "down" | "flat") {
    if (trend === "up") return "▲";
    if (trend === "down") return "▼";
    return "■";
}

function ComparisonTile({
    label,
    metric,
}: {
    label: string;
    metric: EmergencyAnalyticsComparisonMetric;
}) {
    const trend = getTrend(metric);
    const tone = trend === "up" ? "warning" : trend === "down" ? "success" : "default";
    return (
        <article className={`admin-metric-tile tone-${tone}`}>
            <p className="admin-metric-label">{label}</p>
            <p className="admin-metric-value">{metric.current}</p>
            <p className="admin-recent-line" aria-label={`Trend ${trend}`}>
                <span aria-hidden="true">{trendArrow(trend)}</span>{" "}
                {formatPercentChange(metric)} vs previous ({metric.previous})
            </p>
        </article>
    );
}

function PercentBar({ value, max }: { value: number; max: number }) {
    const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
    const widthPercent = Math.round(ratio * 100);
    return (
        <div
            className="admin-insights-bar"
            role="presentation"
            aria-hidden="true"
        >
            <span
                className="admin-insights-bar-fill"
                style={{ width: `${widthPercent}%` }}
            />
        </div>
    );
}

export default function AdminEmergencyInsightsView() {
    const router = useRouter();
    const pathname = usePathname();
    const [analytics, setAnalytics] = React.useState<EmergencyAnalytics | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");
    const latestRequestIdRef = React.useRef(0);

    const redirectToLogin = React.useCallback(() => {
        clearAccessToken();
        const returnTo = pathname || "/admin";
        router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    }, [pathname, router]);

    const loadAnalytics = React.useCallback(async () => {
        const token = getAccessToken();
        if (!token) {
            setLoading(false);
            redirectToLogin();
            return;
        }

        setLoading(true);
        setError("");
        const requestId = latestRequestIdRef.current + 1;
        latestRequestIdRef.current = requestId;

        try {
            const result = await fetchAdminEmergencyAnalytics(token);
            if (requestId !== latestRequestIdRef.current) {
                return;
            }
            setAnalytics(result);
        } catch (err) {
            if (requestId !== latestRequestIdRef.current) {
                return;
            }
            if (err instanceof ApiError && err.status === 401) {
                redirectToLogin();
                return;
            }
            if (err instanceof ApiError && err.status === 403) {
                router.replace("/home");
                return;
            }
            const message =
                err instanceof Error
                    ? err.message
                    : "Could not load emergency analytics.";
            setError(message);
        } finally {
            if (requestId === latestRequestIdRef.current) {
                setLoading(false);
            }
        }
    }, [redirectToLogin, router]);

    React.useEffect(() => {
        void loadAnalytics();
    }, [loadAnalytics]);

    React.useEffect(() => {
        if (!loading) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setLoading(false);
            setError((current) => current || "Request timed out. Please try again.");
        }, 16_000);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [loading]);

    if (loading) {
        return (
            <SectionCard>
                <SectionHeader
                    title="Emergency Insights"
                    subtitle="Loading region, type, and trend analytics..."
                />
                <div className="admin-empty-state">
                    <p className="admin-subtle">
                        If this takes too long, retry the analytics request.
                    </p>
                    <PrimaryButton onClick={() => void loadAnalytics()}>
                        Retry Analytics
                    </PrimaryButton>
                </div>
            </SectionCard>
        );
    }

    if (!analytics) {
        return (
            <SectionCard>
                <SectionHeader
                    title="Emergency Insights"
                    subtitle="Could not load analytics data."
                />
                <div className="admin-empty-state">
                    <p>{error || "No analytics data available right now."}</p>
                    <PrimaryButton onClick={() => void loadAnalytics()}>
                        Retry Analytics
                    </PrimaryButton>
                </div>
            </SectionCard>
        );
    }

    const { regionBreakdown, typeBreakdown, dailyTrend, periodComparison } = analytics;
    const regionMaxTotal = regionBreakdown.reduce((max, row) => Math.max(max, row.total), 0);
    const typeMaxTotal = typeBreakdown.reduce((max, row) => Math.max(max, row.total), 0);
    const trendMax = dailyTrend.reduce(
        (max, row) => Math.max(max, row.created, row.resolved, row.cancelled),
        0
    );
    const totalAcrossBreakdowns =
        regionBreakdown.length === 0 && typeBreakdown.length === 0;

    return (
        <div className="admin-overview-grid">
            {error ? (
                <SectionCard>
                    <p className="admin-error-text">
                        Showing previous data. Latest refresh failed: {error}
                    </p>
                </SectionCard>
            ) : null}

            <SectionCard>
                <SectionHeader
                    title={`Period Comparison (last ${periodComparison.windowDays} days vs previous ${periodComparison.windowDays})`}
                    subtitle="Recent activity compared to the previous equivalent period."
                />
                <div className="admin-metric-grid">
                    <ComparisonTile label="Created" metric={periodComparison.created} />
                    <ComparisonTile label="Resolved" metric={periodComparison.resolved} />
                    <ComparisonTile label="Cancelled" metric={periodComparison.cancelled} />
                </div>
            </SectionCard>

            <SectionCard>
                <SectionHeader
                    title="Region Breakdown"
                    subtitle="Top cities by total emergency volume."
                />
                {regionBreakdown.length > 0 ? (
                    <div className="admin-region-table-wrap">
                        <table className="admin-region-table">
                            <thead>
                                <tr>
                                    <th>City</th>
                                    <th>Total</th>
                                    <th>Distribution</th>
                                    <th>Active</th>
                                    <th>Resolved</th>
                                    <th>Cancelled</th>
                                </tr>
                            </thead>
                            <tbody>
                                {regionBreakdown.map((row) => (
                                    <tr key={row.city}>
                                        <td>{formatOperationalLabel(row.city)}</td>
                                        <td>{row.total}</td>
                                        <td>
                                            <PercentBar value={row.total} max={regionMaxTotal} />
                                        </td>
                                        <td>{row.active}</td>
                                        <td>{row.resolved}</td>
                                        <td>{row.cancelled}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="admin-subtle">No regional data available yet.</p>
                )}
            </SectionCard>

            <SectionCard>
                <SectionHeader
                    title="Type / Category Breakdown"
                    subtitle="Emergency volume grouped by need type."
                />
                {typeBreakdown.length > 0 ? (
                    <div className="admin-region-table-wrap">
                        <table className="admin-region-table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Total</th>
                                    <th>Share</th>
                                    <th>Distribution</th>
                                    <th>Active</th>
                                    <th>Resolved</th>
                                    <th>Cancelled</th>
                                </tr>
                            </thead>
                            <tbody>
                                {typeBreakdown.map((row) => (
                                    <tr key={row.needType}>
                                        <td>{formatOperationalLabel(row.needType)}</td>
                                        <td>{row.total}</td>
                                        <td>{row.percentage.toFixed(1)}%</td>
                                        <td>
                                            <PercentBar value={row.total} max={typeMaxTotal} />
                                        </td>
                                        <td>{row.active}</td>
                                        <td>{row.resolved}</td>
                                        <td>{row.cancelled}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="admin-subtle">No type data available yet.</p>
                )}
            </SectionCard>

            <SectionCard>
                <SectionHeader
                    title={`Daily Trend (last ${dailyTrend.length} days)`}
                    subtitle="Created, resolved, and cancelled emergencies per day."
                />
                {dailyTrend.length > 0 ? (
                    <div className="admin-region-table-wrap">
                        <table className="admin-region-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Created</th>
                                    <th>Resolved</th>
                                    <th>Cancelled</th>
                                    <th>Activity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dailyTrend.map((row) => (
                                    <tr key={row.date}>
                                        <td>{row.date}</td>
                                        <td>{row.created}</td>
                                        <td>{row.resolved}</td>
                                        <td>{row.cancelled}</td>
                                        <td>
                                            <PercentBar
                                                value={row.created + row.resolved + row.cancelled}
                                                max={trendMax * 3 || 1}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="admin-subtle">No trend data available yet.</p>
                )}
            </SectionCard>

            {totalAcrossBreakdowns ? (
                <SectionCard>
                    <p className="admin-subtle">
                        No emergency records yet. Insights will populate as activity is recorded.
                    </p>
                </SectionCard>
            ) : null}
        </div>
    );
}
