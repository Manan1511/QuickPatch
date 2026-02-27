"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import styles from "./Navbar.module.css";

const SHIELD_ICON = (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        <path
            d="M12 2L3 7V12C3 17.25 6.975 22.1 12 23C17.025 22.1 21 17.25 21 12V7L12 2Z"
            fill="rgba(0,112,243,0.15)"
            stroke="#0070f3"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M9 12L11 14L15 10"
            stroke="#0070f3"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const GITHUB_ICON = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
);

const HAMBURGER_ICON = (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

interface NavbarProps {
    variant?: "landing" | "app";
    username?: string;
    avatarUrl?: string;
}

export default function Navbar({
    variant = "landing",
    username,
    avatarUrl,
}: NavbarProps) {
    const pathname = usePathname();

    return (
        <nav className={styles.navbar} role="navigation" aria-label="Main navigation">
            <div className={styles.inner}>
                <Link href="/" className={styles.logo} aria-label="QuickPatch home">
                    {SHIELD_ICON}
                    <span className={styles.logoText}>QuickPatch</span>
                </Link>

                {variant === "landing" ? (
                    <div className={styles.actions}>
                        <Link href="/connect" className="btn btn-ghost">
                            {GITHUB_ICON}
                            <span>Sign in with GitHub</span>
                        </Link>
                        <Link href="/connect" className="btn btn-primary">
                            Get Started
                        </Link>
                    </div>
                ) : (
                    <div className={styles.actions}>
                        <div className={styles.userInfo}>
                            <div
                                className={styles.avatar}
                                style={{
                                    backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined,
                                }}
                                aria-hidden="true"
                            >
                                {!avatarUrl && (username?.[0]?.toUpperCase() ?? "U")}
                            </div>
                            <span className={styles.username}>{username ?? "user"}</span>
                        </div>
                        <Link href="/" className="btn btn-ghost">
                            Sign out
                        </Link>
                    </div>
                )}

                <button
                    className={styles.mobileToggle}
                    aria-label="Toggle navigation menu"
                >
                    {HAMBURGER_ICON}
                </button>
            </div>
        </nav>
    );
}
