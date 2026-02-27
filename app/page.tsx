import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Link from "next/link";
import styles from "./page.module.css";

const LOCK_ICON = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0070f3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
);

const SHIELD_CHECK_ICON = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0070f3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>
);

const CODE_ICON = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0070f3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
);

const STEPS = [
  { num: "01", label: "Connect GitHub" },
  { num: "02", label: "Select a Repo" },
  { num: "03", label: "Run Analysis" },
  { num: "04", label: "Merge the PR" },
];

const STATS = [
  "1,240+ PRs opened",
  "98% of fixes merge clean",
  "Avg 4.2 vulnerabilities fixed per repo",
];

export default function LandingPage() {
  return (
    <>
      <Navbar variant="landing" />

      <main>
        {/* ===== Hero ===== */}
        <section className={styles.hero}>
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.heroContent}>
            <span className={`badge badge-blue ${styles.eyebrow}`}>
              Automated Security
            </span>

            <h1 className="text-hero">Ship fast. Stay secure.</h1>

            <p className={styles.subtitle}>
              QuickPatch scans your AI-generated repositories and opens a Pull
              Request with every security fix — automatically.
            </p>

            <div className={styles.ctaRow}>
              <Link href="/connect" className="btn btn-primary btn-lg">
                Connect GitHub
              </Link>
              <Link href="/report/ai-chatbot" className="btn btn-ghost btn-lg">
                See a Sample Report
              </Link>
            </div>

            <p className={styles.trustLine}>
              Zero config. No agents. Just a PR.
            </p>
          </div>
        </section>

        {/* ===== Social Proof ===== */}
        <section className={styles.socialProof}>
          <div className={`container ${styles.socialProofInner}`}>
            <p className={styles.socialProofLabel}>
              Trusted by vibe-coded apps in production
            </p>
            <div className={styles.statPills}>
              {STATS.map((stat) => (
                <span key={stat} className={styles.statPill}>
                  {stat}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Features ===== */}
        <section className={`section ${styles.features}`} id="features">
          <div className="container">
            <h2 className={`text-3xl ${styles.sectionTitle}`}>
              Everything a vibe-coded app is missing.
            </h2>

            <div className={styles.featureGrid}>
              <div className={`card ${styles.featureCard}`}>
                <div className={styles.featureIcon}>{LOCK_ICON}</div>
                <h3 className={styles.featureTitle}>Secret Detection</h3>
                <p className={styles.featureBody}>
                  Finds exposed API keys, tokens, and credentials hiding in your
                  codebase — before they hit production.
                </p>
              </div>

              <div className={`card ${styles.featureCard}`}>
                <div className={styles.featureIcon}>{SHIELD_CHECK_ICON}</div>
                <h3 className={styles.featureTitle}>Dependency Audit</h3>
                <p className={styles.featureBody}>
                  Flags vulnerable npm and pip packages with direct CVE links and
                  safe upgrade paths.
                </p>
              </div>

              <div className={`card ${styles.featureCard}`}>
                <div className={styles.featureIcon}>{CODE_ICON}</div>
                <h3 className={styles.featureTitle}>Code Hardening</h3>
                <p className={styles.featureBody}>
                  Adds auth middleware, CORS headers, rate limiting, and input
                  sanitization — automatically.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== How It Works ===== */}
        <section className={`section ${styles.howItWorks}`} id="how-it-works">
          <div className="container">
            <h2 className={`text-3xl ${styles.sectionTitle}`}>How it works</h2>

            <div className={styles.stepsRow}>
              {STEPS.map((step, i) => (
                <div key={step.num} className={styles.step}>
                  <span className={styles.stepNum}>{step.num}</span>
                  <span className={styles.stepLabel}>{step.label}</span>
                  {i < STEPS.length - 1 && (
                    <div className={styles.stepConnector} aria-hidden="true" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
