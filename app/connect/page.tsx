"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import styles from "./page.module.css";

const CHECK_ICON = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="7" fill="rgba(0,201,80,0.12)" stroke="#00c950" strokeWidth="1" />
        <path d="M5 8l2 2 4-4" stroke="#00c950" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const SHIELD_LOGO = (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-label="QuickPatch logo">
        <path d="M12 2L3 7V12C3 17.25 6.975 22.1 12 23C17.025 22.1 21 17.25 21 12V7L12 2Z" fill="rgba(0,112,243,0.15)" stroke="#0070f3" strokeWidth="1.5" />
        <path d="M9 12L11 14L15 10" stroke="#0070f3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const GITHUB_ICON = (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
);

const PERMISSIONS = [
    "Read repository contents",
    "Read/write Pull Requests",
    "Read repository metadata",
];

export default function ConnectPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // If already authenticated, redirect to dashboard
    useEffect(() => {
        if (status === "authenticated") {
            router.push("/dashboard");
        }
    }, [status, router]);

    const handleSignIn = () => {
        signIn("github", { callbackUrl: "/dashboard" });
    };

    return (
        <div className={styles.wrapper}>
            <div className={`card ${styles.connectCard}`}>
                <div className={styles.logo}>{SHIELD_LOGO}</div>

                <h2 className={styles.heading}>Connect your GitHub account</h2>

                <p className={styles.body}>
                    QuickPatch needs read access to your repositories and write access to
                    open Pull Requests.
                </p>

                <ul className={styles.permissions}>
                    {PERMISSIONS.map((perm) => (
                        <li key={perm} className={styles.permissionItem}>
                            {CHECK_ICON}
                            <span>{perm}</span>
                        </li>
                    ))}
                </ul>

                <button
                    onClick={handleSignIn}
                    className={`btn btn-primary btn-lg btn-full ${styles.githubBtn}`}
                >
                    {GITHUB_ICON}
                    <span>Continue with GitHub</span>
                </button>

                <p className={styles.disclaimer}>We never store your source code.</p>
            </div>
        </div>
    );
}
