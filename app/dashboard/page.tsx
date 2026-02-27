"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import styles from "./page.module.css";
import type { Metadata } from "next";

interface Repo {
    name: string;
    visibility: "Public" | "Private";
    language: string;
    languageColor: string;
    updatedAt: string;
}

const MOCK_REPOS: Repo[] = [
    { name: "weather-dashboard", visibility: "Public", language: "JavaScript", languageColor: "#f1e05a", updatedAt: "Updated 2 days ago" },
    { name: "ai-chatbot", visibility: "Private", language: "TypeScript", languageColor: "#3178c6", updatedAt: "Updated 5 hours ago" },
    { name: "portfolio-site", visibility: "Public", language: "React", languageColor: "#61dafb", updatedAt: "Updated 1 week ago" },
    { name: "api-backend", visibility: "Private", language: "Python", languageColor: "#3572A5", updatedAt: "Updated 3 days ago" },
    { name: "ml-pipeline", visibility: "Public", language: "Python", languageColor: "#3572A5", updatedAt: "Updated 2 weeks ago" },
    { name: "mobile-app", visibility: "Private", language: "Dart", languageColor: "#00B4AB", updatedAt: "Updated 1 day ago" },
];

const FOLDER_ICON = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
        <path d="M2 3h4l2 2h6v8H2V3z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const SEARCH_ICON = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" aria-hidden="true">
        <circle cx="7" cy="7" r="5" />
        <path d="M11 11l3 3" strokeLinecap="round" />
    </svg>
);

type FilterTab = "all" | "public" | "private";

export default function DashboardPage() {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<FilterTab>("all");
    const [loadingRepo, setLoadingRepo] = useState<string | null>(null);

    const filtered = MOCK_REPOS.filter((repo) => {
        const matchSearch = repo.name.toLowerCase().includes(search.toLowerCase());
        const matchFilter =
            filter === "all" ||
            (filter === "public" && repo.visibility === "Public") ||
            (filter === "private" && repo.visibility === "Private");
        return matchSearch && matchFilter;
    });

    const handleAnalyze = (repoName: string) => {
        setLoadingRepo(repoName);
        // Simulate then navigate
        setTimeout(() => {
            window.location.href = `/report/${repoName}`;
        }, 800);
    };

    return (
        <>
            <Navbar variant="app" username="manan-dev" />

            <div className={styles.layout}>
                {/* Sidebar */}
                <aside className={styles.sidebar}>
                    <nav className={styles.sideNav}>
                        <Link href="/dashboard" className={`${styles.navItem} ${styles.navItemActive}`}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="2" y="2" width="12" height="12" rx="2" /><path d="M2 6h12" /></svg>
                            Repositories
                        </Link>
                        <Link href="#" className={styles.navItem}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 2v12M4 2l4 3-4 3" /></svg>
                            Past Reports
                        </Link>
                        <Link href="#" className={styles.navItem}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="8" cy="8" r="6" /><path d="M8 5v3l2 2" /></svg>
                            Settings
                        </Link>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className={styles.main}>
                    <h1 className={styles.pageTitle}>Your Repositories</h1>

                    <div className={styles.searchWrapper}>
                        <span className={styles.searchIcon}>{SEARCH_ICON}</span>
                        <input
                            type="text"
                            className={`input ${styles.searchInput}`}
                            placeholder="Search repositories..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            id="repo-search"
                        />
                    </div>

                    <div className={styles.filterTabs}>
                        {(["all", "public", "private"] as FilterTab[]).map((tab) => (
                            <button
                                key={tab}
                                className={`${styles.filterTab} ${filter === tab ? styles.filterTabActive : ""}`}
                                onClick={() => setFilter(tab)}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div className={styles.repoList}>
                        {filtered.length === 0 ? (
                            <div className={styles.emptyState}>
                                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" aria-hidden="true">
                                    <rect x="4" y="4" width="32" height="32" rx="4" />
                                    <path d="M4 12h32M14 4v8" />
                                </svg>
                                <p>No repositories found</p>
                            </div>
                        ) : (
                            filtered.map((repo) => (
                                <div key={repo.name} className={styles.repoRow}>
                                    <div className={styles.repoInfo}>
                                        <span className={styles.repoIcon}>{FOLDER_ICON}</span>
                                        <span className={styles.repoName}>{repo.name}</span>
                                        <span className={`badge badge-muted`}>{repo.visibility}</span>
                                    </div>

                                    <div className={styles.repoMeta}>
                                        <span
                                            className={styles.langDot}
                                            style={{ background: repo.languageColor }}
                                            aria-hidden="true"
                                        />
                                        <span className={styles.langName}>{repo.language}</span>
                                        <span className={styles.updatedAt}>{repo.updatedAt}</span>
                                    </div>

                                    <button
                                        className={`btn btn-ghost ${styles.analyzeBtn}`}
                                        onClick={() => handleAnalyze(repo.name)}
                                        disabled={loadingRepo === repo.name}
                                    >
                                        {loadingRepo === repo.name ? (
                                            <span className={styles.spinner} aria-label="Loading" />
                                        ) : (
                                            "Analyze"
                                        )}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}
