"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import Navbar from "../../../components/Navbar";
import styles from "./page.module.css";

/* ===== Types ===== */

interface Finding {
    id: string;
    severity: "critical" | "high" | "medium" | "low";
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
    pr_url: string | null;
    pr_number: number | null;
}

/* ===== Icons ===== */

const GREEN_CHECK = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M4 8l3 3 5-5" stroke="#00c950" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const CHEVRON_DOWN = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

/* ===== Inner Page Component ===== */

function PrConfirmationInner() {
    const params = useParams();
    const searchParams = useSearchParams();

    const repoName = (params.repo as string) || "repo";
    const prUrl = searchParams.get("prUrl") ?? "";
    const prNumber = searchParams.get("prNumber") ?? "";
    const analysisId = searchParams.get("analysisId");
    const owner = searchParams.get("owner") ?? "";

    const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
    const [loading, setLoading] = useState(true);
    const [fixesOpen, setFixesOpen] = useState(true);

    const fetchAnalysis = useCallback(async () => {
        if (!analysisId) {
            setLoading(false);
            return;
        }
        try {
            const res = await fetch("/api/reports");
            if (!res.ok) throw new Error("Failed to fetch");
            const reports: AnalysisData[] = await res.json();
            const found = reports.find((r) => r.id === analysisId);
            if (found) setAnalysis(found);
        } catch {
            // Non-critical — we still have prUrl/prNumber from params
        } finally {
            setLoading(false);
        }
    }, [analysisId]);

    useEffect(() => {
        fetchAnalysis();
    }, [fetchAnalysis]);

    const findings = analysis?.findings ?? [];
    const fixCount = findings.length;
    const filesChanged = new Set(findings.map((f) => f.file)).size;

    return (
        <>
            <Navbar variant="app" />

            <div className={styles.wrapper}>
                <div className={styles.content}>
                    {/* Success Icon */}
                    <div className={styles.successIcon} aria-hidden="true">
                        <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
                            <circle
                                cx="36"
                                cy="36"
                                r="32"
                                fill="rgba(0,201,80,0.08)"
                                stroke="#00c950"
                                strokeWidth="2"
                                className={styles.checkCircle}
                            />
                            <path
                                d="M24 36L32 44L48 28"
                                stroke="#00c950"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={styles.checkPath}
                            />
                        </svg>
                        <div className={styles.successGlow} />
                    </div>

                    {/* Heading */}
                    <h2 className={styles.heading}>Pull Request Opened!</h2>

                    <p className={styles.body}>
                        QuickPatch has opened PR #{prNumber} on{" "}
                        <strong>{owner}/{repoName}</strong> with {fixCount} security
                        fixes.
                    </p>

                    {/* PR Preview Card */}
                    <div className={`card ${styles.prCard}`}>
                        <div className={styles.prTitle}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#00c950" strokeWidth="1.5" aria-hidden="true">
                                <circle cx="5" cy="4" r="2" />
                                <circle cx="5" cy="12" r="2" />
                                <circle cx="12" cy="4" r="2" />
                                <path d="M5 6v4M12 6c0 4-7 4-7 4" />
                            </svg>
                            <span>fix: apply {fixCount} security patches via QuickPatch</span>
                        </div>

                        <div className={styles.prBranch}>
                            <code>quickpatch/fix-*</code>
                            <span className={styles.arrow}>→</span>
                            <code>main</code>
                        </div>

                        <div className={styles.prStats}>
                            <span className={styles.filesChanged}>
                                {filesChanged} files changed
                            </span>
                        </div>

                        <div className={styles.prLabels}>
                            <span className="badge badge-blue">security</span>
                            <span className="badge badge-blue">automated</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className={styles.actions}>
                        {prUrl && (
                            <a
                                href={prUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary btn-lg"
                            >
                                View on GitHub
                            </a>
                        )}
                        <Link href="/dashboard" className="btn btn-ghost btn-lg">
                            Analyze Another Repo
                        </Link>
                    </div>

                    {/* What was fixed */}
                    {findings.length > 0 && (
                        <div className={styles.fixesSection}>
                            <button
                                className={styles.fixesToggle}
                                onClick={() => setFixesOpen(!fixesOpen)}
                                aria-expanded={fixesOpen}
                            >
                                <span className={styles.fixesTitle}>What was fixed</span>
                                <span
                                    className={`${styles.chevron} ${fixesOpen ? styles.chevronOpen : ""}`}
                                >
                                    {CHEVRON_DOWN}
                                </span>
                            </button>

                            {fixesOpen && (
                                <ul className={styles.fixesList}>
                                    {findings.map((fix) => (
                                        <li key={fix.id} className={styles.fixItem}>
                                            {GREEN_CHECK}
                                            <span>{fix.title} — <code style={{ fontSize: "12px", color: "var(--text-muted)" }}>{fix.file}</code></span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

/* ===== Page Wrapper with Suspense ===== */

export default function PrConfirmationPage() {
    return (
        <Suspense fallback={
            <>
                <Navbar variant="app" />
                <div className={styles.wrapper}>
                    <div className={styles.content} style={{ display: "flex", justifyContent: "center", paddingTop: "4rem" }}>
                        <div className="skel skel-heading" style={{ width: 300 }} />
                    </div>
                </div>
            </>
        }>
            <PrConfirmationInner />
        </Suspense>
    );
}
