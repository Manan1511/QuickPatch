"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import styles from "./page.module.css";

/* ===== Types ===== */

type Severity = "critical" | "high" | "medium" | "low";

interface Finding {
    id: string;
    severity: Severity;
    file: string;
    line: number;
    endLine: number;
    action: "replace" | "add" | "delete";
    title: string;
    description: string;
    fix: string;
}

interface AnalysisData {
    id: string;
    score: number;
    findings: Finding[];
    repo_full_name: string;
    created_at: string;
    pr_url: string | null;
    pr_number: number | null;
}

/* ===== Score Circle Component ===== */

function ScoreCircle({ score }: { score: number }) {
    const RADIUS = 54;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
    const offset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;

    const color =
        score < 50
            ? "var(--error)"
            : score < 75
                ? "var(--warning)"
                : "var(--success)";

    return (
        <div className={styles.scoreCircle}>
            <svg width="140" height="140" viewBox="0 0 140 140" aria-label={`Security score: ${score} out of 100`}>
                <circle
                    cx="70"
                    cy="70"
                    r={RADIUS}
                    fill="none"
                    stroke="var(--border-subtle)"
                    strokeWidth="8"
                />
                <circle
                    cx="70"
                    cy="70"
                    r={RADIUS}
                    fill="none"
                    stroke={color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={offset}
                    transform="rotate(-90 70 70)"
                    className={styles.scoreArc}
                />
                <text
                    x="70"
                    y="70"
                    textAnchor="middle"
                    dy="0.35em"
                    fill={color}
                    className={styles.scoreValue}
                >
                    {score}
                </text>
            </svg>
            <span className={styles.scoreLabel}>Security Score</span>
        </div>
    );
}

/* ===== Inner Page Component (uses useSearchParams) ===== */

function ReportPageInner() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    const repoName = (params.repo as string) || "repo";
    const analysisId = searchParams.get("analysisId");
    const owner = searchParams.get("owner") ?? "";

    const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [creatingPR, setCreatingPR] = useState(false);

    const fetchAnalysis = useCallback(async () => {
        if (!analysisId) {
            setError("No analysis ID provided");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/reports");
            if (!res.ok) throw new Error("Failed to fetch reports");
            const reports: AnalysisData[] = await res.json();
            const found = reports.find((r) => r.id === analysisId);
            if (!found) {
                setError("Analysis not found");
            } else {
                setAnalysis(found);
                // Auto-expand first finding
                if (found.findings.length > 0) {
                    setExpandedId(found.findings[0].id);
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load analysis");
        } finally {
            setLoading(false);
        }
    }, [analysisId]);

    useEffect(() => {
        fetchAnalysis();
    }, [fetchAnalysis]);

    const toggleExpand = (id: string) => {
        setExpandedId((prev) => (prev === id ? null : id));
    };

    const handleCreatePR = async () => {
        if (!analysis || !owner) return;
        setCreatingPR(true);
        try {
            const res = await fetch("/api/pr", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    owner,
                    repo: repoName,
                    analysisId: analysis.id,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to create PR");
            }

            const data = await res.json();
            router.push(
                `/report/${repoName}/pr?prUrl=${encodeURIComponent(data.pr_url)}&prNumber=${data.pr_number}&analysisId=${analysis.id}&owner=${owner}`
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create PR");
            setCreatingPR(false);
        }
    };

    if (loading) {
        return (
            <>
                <Navbar variant="app" />
                <div className={styles.wrapper}>
                    <div className={`container ${styles.content}`} style={{ display: "flex", justifyContent: "center", paddingTop: "4rem" }}>
                        <div className="skel skel-heading" style={{ width: 300 }} />
                    </div>
                </div>
            </>
        );
    }

    if (error || !analysis) {
        return (
            <>
                <Navbar variant="app" />
                <div className={styles.wrapper}>
                    <div className={`container ${styles.content}`} style={{ textAlign: "center", paddingTop: "4rem" }}>
                        <p style={{ color: "var(--error)" }}>{error || "Analysis not found"}</p>
                        <Link href="/dashboard" className="btn btn-ghost" style={{ marginTop: "var(--space-md)" }}>
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    const severityCounts: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const f of analysis.findings) {
        severityCounts[f.severity]++;
    }

    const filesScanned = new Set(analysis.findings.map((f) => f.file)).size;

    return (
        <>
            <Navbar variant="app" />

            <div className={styles.wrapper}>
                <div className={`container ${styles.content}`}>
                    {/* Header */}
                    <div className={styles.header}>
                        <div className={styles.headerLeft}>
                            <nav className={styles.breadcrumb}>
                                <Link href="/dashboard" className={styles.breadcrumbLink}>
                                    Dashboard
                                </Link>
                                <span className={styles.breadcrumbSep}>→</span>
                                <span>{analysis.repo_full_name}</span>
                            </nav>

                            <h1 className={styles.pageTitle}>
                                Security Report:{" "}
                                <span className={styles.repoHighlight}>{analysis.repo_full_name}</span>
                            </h1>

                            <p className={styles.meta}>
                                Analyzed {new Date(analysis.created_at).toLocaleString()} ·{" "}
                                {filesScanned} files with issues ·{" "}
                                {severityCounts.critical} critical issues
                            </p>
                        </div>

                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleCreatePR}
                            disabled={creatingPR}
                        >
                            {creatingPR ? "Creating PR..." : "Open Pull Request"}
                        </button>
                    </div>

                    {error && (
                        <div style={{ color: "var(--error)", marginBottom: "var(--space-md)", fontSize: "14px" }}>
                            {error}
                        </div>
                    )}

                    {/* Score Section */}
                    <div className={styles.scoreSection}>
                        <ScoreCircle score={analysis.score} />
                        <div className={styles.severityPills}>
                            <span className="badge badge-critical">{severityCounts.critical} Critical</span>
                            <span className="badge badge-high">{severityCounts.high} High</span>
                            <span className="badge badge-medium">{severityCounts.medium} Medium</span>
                            <span className="badge badge-low">{severityCounts.low} Low</span>
                        </div>
                    </div>

                    {/* Findings Table */}
                    <section className={styles.findings}>
                        <h2 className={styles.findingsTitle}>Vulnerabilities Found</h2>

                        <div className={styles.tableHeader}>
                            <span className={styles.colSeverity}>Severity</span>
                            <span className={styles.colFile}>File</span>
                            <span className={styles.colIssue}>Issue</span>
                            <span className={styles.colFix}>Fix</span>
                        </div>

                        {analysis.findings.map((finding) => (
                            <div key={finding.id} className={styles.findingRow}>
                                <div
                                    className={styles.findingMain}
                                    onClick={() => toggleExpand(finding.id)}
                                    role="button"
                                    tabIndex={0}
                                    aria-expanded={expandedId === finding.id}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            toggleExpand(finding.id);
                                        }
                                    }}
                                >
                                    <span className={`badge badge-${finding.severity} ${styles.colSeverity}`}>
                                        {finding.severity}
                                    </span>
                                    <span className={`${styles.colFile} ${styles.filePath}`}>
                                        {finding.file}:{finding.line}{finding.endLine !== finding.line ? `-${finding.endLine}` : ""}
                                    </span>
                                    <span className={styles.colIssue}>{finding.title}</span>
                                    <span className={`${styles.colFix} ${styles.viewFix}`}>
                                        {expandedId === finding.id ? "Hide" : "View Fix"}
                                    </span>
                                </div>

                                {expandedId === finding.id && (
                                    <div className={styles.diffPanel}>
                                        <div className={styles.diffHeader}>
                                            <span>Proposed Fix</span>
                                            <button
                                                className={styles.copyBtn}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigator.clipboard.writeText(finding.fix);
                                                }}
                                                aria-label="Copy fix to clipboard"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
                                                    <rect x="4" y="4" width="9" height="9" rx="1.5" />
                                                    <path d="M10 4V2.5A1.5 1.5 0 008.5 1h-6A1.5 1.5 0 001 2.5v6A1.5 1.5 0 002.5 10H4" />
                                                </svg>
                                                Copy
                                            </button>
                                        </div>
                                        <div className={styles.diffContent}>
                                            <div className={styles.diffOld}>
                                                <div className={styles.diffLabel}>Issue</div>
                                                <pre>{finding.description}</pre>
                                            </div>
                                            {finding.fix && (
                                                <div className={styles.diffNew}>
                                                    <div className={styles.diffLabel}>
                                                        {finding.action === "add" ? "Add after line" : finding.action === "delete" ? "Lines to remove" : "Replace with"} (L{finding.line}{finding.endLine !== finding.line ? `-${finding.endLine}` : ""})
                                                    </div>
                                                    <pre>{finding.fix}</pre>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </section>
                </div>

                {/* Sticky CTA */}
                <div className={styles.stickyBar}>
                    <div className={`container ${styles.stickyBarInner}`}>
                        <span className={styles.stickyText}>
                            {severityCounts.critical} Critical, {severityCounts.high} High issues found.
                        </span>
                        <button
                            className="btn btn-primary"
                            onClick={handleCreatePR}
                            disabled={creatingPR}
                        >
                            {creatingPR ? "Creating PR..." : "Auto-fix all — Open Pull Request"}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

/* ===== Page Wrapper with Suspense ===== */

export default function ReportPage() {
    return (
        <Suspense fallback={
            <>
                <Navbar variant="app" />
                <div className={styles.wrapper}>
                    <div className={`container ${styles.content}`} style={{ display: "flex", justifyContent: "center", paddingTop: "4rem" }}>
                        <div className="skel skel-heading" style={{ width: 300 }} />
                    </div>
                </div>
            </>
        }>
            <ReportPageInner />
        </Suspense>
    );
}
