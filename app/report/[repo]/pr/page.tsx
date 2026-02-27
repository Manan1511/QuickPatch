"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "../../../components/Navbar";
import styles from "./page.module.css";

/* ===== Constants ===== */

const FIXES = [
    "Added authentication middleware to 3 API routes",
    "Removed exposed credentials from .env.example",
    "Parameterized 2 SQL queries",
    "Updated lodash to 4.17.21 (CVE-2021-23337)",
    "Added rate limiting to express server",
    "Restricted CORS to specific origins",
    "Added input validation to user routes",
    "Sanitized error messages for production",
];

const FIX_COUNT = 16;
const PR_NUMBER = 42;
const ADDITIONS = 284;
const DELETIONS = 12;
const FILES_CHANGED = 16;

/* ===== Check Icon ===== */

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

/* ===== Page ===== */

export default function PrConfirmationPage() {
    const params = useParams();
    const repoName = (params.repo as string) || "repo";
    const [fixesOpen, setFixesOpen] = useState(true);

    return (
        <>
            <Navbar variant="app" username="manan-dev" />

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
                        QuickPatch has opened PR #{PR_NUMBER} on{" "}
                        <strong>manan-dev/{repoName}</strong> with {FIX_COUNT} security
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
                            <span>fix: apply {FIX_COUNT} security patches via QuickPatch</span>
                        </div>

                        <div className={styles.prBranch}>
                            <code>quickpatch/security-fixes</code>
                            <span className={styles.arrow}>→</span>
                            <code>main</code>
                        </div>

                        <div className={styles.prStats}>
                            <span className={styles.filesChanged}>
                                {FILES_CHANGED} files changed
                            </span>
                            <span className={styles.additions}>+{ADDITIONS}</span>
                            <span className={styles.deletions}>-{DELETIONS}</span>
                        </div>

                        <div className={styles.prLabels}>
                            <span className="badge badge-blue">security</span>
                            <span className="badge badge-blue">automated</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className={styles.actions}>
                        <a
                            href={`https://github.com/manan-dev/${repoName}/pull/${PR_NUMBER}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary btn-lg"
                        >
                            View on GitHub
                        </a>
                        <Link href="/dashboard" className="btn btn-ghost btn-lg">
                            Analyze Another Repo
                        </Link>
                    </div>

                    {/* What was fixed */}
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
                                {FIXES.map((fix) => (
                                    <li key={fix} className={styles.fixItem}>
                                        {GREEN_CHECK}
                                        <span>{fix}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
