"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../components/Navbar";
import styles from "./page.module.css";

/* ===== Types ===== */

interface Repo {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    language: string | null;
    updated_at: string;
    default_branch: string;
}

/* ===== Constants ===== */

const LANGUAGE_COLORS: Record<string, string> = {
    JavaScript: "#f1e05a",
    TypeScript: "#3178c6",
    Python: "#3572A5",
    React: "#61dafb",
    Dart: "#00B4AB",
    Go: "#00ADD8",
    Rust: "#dea584",
    Java: "#b07219",
    Ruby: "#701516",
    PHP: "#4F5D95",
    CSS: "#563d7c",
    HTML: "#e34c26",
    Shell: "#89e051",
    C: "#555555",
    "C++": "#f34b7d",
    "C#": "#178600",
    Swift: "#F05138",
    Kotlin: "#A97BFF",
};

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

/* ===== Helpers ===== */

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `Updated ${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Updated ${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `Updated ${days}d ago`;
    const weeks = Math.floor(days / 7);
    return `Updated ${weeks}w ago`;
}

/* ===== Page ===== */

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [repos, setRepos] = useState<Repo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<FilterTab>("all");
    const [analyzingRepo, setAnalyzingRepo] = useState<string | null>(null);

    // Redirect unauthenticated users
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/connect");
        }
    }, [status, router]);

    // Fetch repos on mount
    useEffect(() => {
        if (status !== "authenticated") return;

        async function fetchRepos() {
            try {
                setLoading(true);
                const res = await fetch("/api/repos");
                if (!res.ok) {
                    throw new Error("Failed to fetch repositories");
                }
                const data: Repo[] = await res.json();
                setRepos(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load repos");
            } finally {
                setLoading(false);
            }
        }

        fetchRepos();
    }, [status]);

    const filtered = repos.filter((repo) => {
        const matchSearch = repo.name.toLowerCase().includes(search.toLowerCase());
        const matchFilter =
            filter === "all" ||
            (filter === "public" && !repo.private) ||
            (filter === "private" && repo.private);
        return matchSearch && matchFilter;
    });

    const handleAnalyze = async (repo: Repo) => {
        setAnalyzingRepo(repo.name);
        try {
            const [owner, repoName] = repo.full_name.split("/");
            const res = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    owner,
                    repo: repoName,
                    defaultBranch: repo.default_branch,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Analysis failed");
            }

            const data = await res.json();
            router.push(`/report/${repoName}?analysisId=${data.id}&owner=${owner}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Analysis failed");
            setAnalyzingRepo(null);
        }
    };

    if (status === "loading") {
        return (
            <>
                <Navbar variant="app" />
                <div className={styles.layout}>
                    <div className={styles.main} style={{ display: "flex", justifyContent: "center", paddingTop: "4rem" }}>
                        <span className={styles.spinner} aria-label="Loading" />
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar variant="app" />

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

                    {error && (
                        <div style={{ color: "var(--error)", marginBottom: "var(--space-md)", fontSize: "14px" }}>
                            {error}
                        </div>
                    )}

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
                        {loading ? (
                            <div className={styles.emptyState}>
                                <span className={styles.spinner} aria-label="Loading" />
                                <p>Loading repositories...</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className={styles.emptyState}>
                                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" aria-hidden="true">
                                    <rect x="4" y="4" width="32" height="32" rx="4" />
                                    <path d="M4 12h32M14 4v8" />
                                </svg>
                                <p>No repositories found</p>
                            </div>
                        ) : (
                            filtered.map((repo) => (
                                <div key={repo.id} className={styles.repoRow}>
                                    <div className={styles.repoInfo}>
                                        <span className={styles.repoIcon}>{FOLDER_ICON}</span>
                                        <span className={styles.repoName}>{repo.name}</span>
                                        <span className={`badge badge-muted`}>{repo.private ? "Private" : "Public"}</span>
                                    </div>

                                    <div className={styles.repoMeta}>
                                        {repo.language && (
                                            <>
                                                <span
                                                    className={styles.langDot}
                                                    style={{ background: LANGUAGE_COLORS[repo.language] ?? "#888" }}
                                                    aria-hidden="true"
                                                />
                                                <span className={styles.langName}>{repo.language}</span>
                                            </>
                                        )}
                                        <span className={styles.updatedAt}>{timeAgo(repo.updated_at)}</span>
                                    </div>

                                    <button
                                        className={`btn btn-ghost ${styles.analyzeBtn}`}
                                        onClick={() => handleAnalyze(repo)}
                                        disabled={analyzingRepo === repo.name}
                                    >
                                        {analyzingRepo === repo.name ? (
                                            <span className={styles.spinner} aria-label="Analyzing" />
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
