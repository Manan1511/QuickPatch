"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import styles from "./page.module.css";

/* ===== Types & Constants ===== */

type Severity = "critical" | "high" | "medium" | "low";

interface Finding {
    id: string;
    severity: Severity;
    file: string;
    issue: string;
    oldCode: string;
    newCode: string;
}

const SECURITY_SCORE = 34;
const FILES_SCANNED = 47;

const SEVERITY_COUNTS: Record<Severity, number> = {
    critical: 3,
    high: 5,
    medium: 8,
    low: 4,
};

const FINDINGS: Finding[] = [
    {
        id: "f1",
        severity: "critical",
        file: "src/api/auth.js",
        issue: "No authentication middleware",
        oldCode: `// No auth middleware applied
app.get('/api/users', (req, res) => {
  const users = db.query('SELECT * FROM users');
  res.json(users);
});`,
        newCode: `import { requireAuth } from './middleware/auth';

app.get('/api/users', requireAuth, (req, res) => {
  const users = db.query('SELECT * FROM users');
  res.json(users);
});`,
    },
    {
        id: "f2",
        severity: "critical",
        file: ".env.example",
        issue: "Exposed database credentials",
        oldCode: `DB_HOST=production-db.us-east-1.rds.amazonaws.com
DB_PASSWORD=super_secret_pass_123
API_KEY=sk-live-abc123def456`,
        newCode: `DB_HOST=<your-db-host>
DB_PASSWORD=<your-db-password>
API_KEY=<your-api-key>`,
    },
    {
        id: "f3",
        severity: "critical",
        file: "src/db/queries.js",
        issue: "SQL injection vulnerability",
        oldCode: `const getUser = (id) => {
  return db.query(\`SELECT * FROM users 
    WHERE id = '\${id}'\`);
};`,
        newCode: `const getUser = (id) => {
  return db.query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
};`,
    },
    {
        id: "f4",
        severity: "high",
        file: "package.json",
        issue: "Vulnerable dependency: lodash@4.17.15",
        oldCode: `"lodash": "^4.17.15"`,
        newCode: `"lodash": "^4.17.21"`,
    },
    {
        id: "f5",
        severity: "high",
        file: "src/server.js",
        issue: "Missing rate limiting",
        oldCode: `const app = express();
app.use(cors());
app.use(express.json());`,
        newCode: `import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

const app = express();
app.use(limiter);
app.use(cors());
app.use(express.json());`,
    },
    {
        id: "f6",
        severity: "high",
        file: "src/api/cors.js",
        issue: "Permissive CORS configuration",
        oldCode: `app.use(cors({ origin: '*' }));`,
        newCode: `app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true
}));`,
    },
    {
        id: "f7",
        severity: "medium",
        file: "src/routes/users.js",
        issue: "Missing input validation",
        oldCode: `router.post('/users', (req, res) => {
  const { email, name } = req.body;
  db.createUser(email, name);
});`,
        newCode: `import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100)
});

router.post('/users', (req, res) => {
  const { email, name } = userSchema.parse(req.body);
  db.createUser(email, name);
});`,
    },
    {
        id: "f8",
        severity: "medium",
        file: "src/middleware/error.js",
        issue: "Verbose error messages in production",
        oldCode: `app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message,
    stack: err.stack
  });
});`,
        newCode: `app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});`,
    },
];

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

/* ===== Page Component ===== */

export default function ReportPage() {
    const params = useParams();
    const repoName = (params.repo as string) || "repo";
    const [expandedId, setExpandedId] = useState<string | null>("f1");

    const toggleExpand = (id: string) => {
        setExpandedId((prev) => (prev === id ? null : id));
    };

    const totalCritical = SEVERITY_COUNTS.critical;
    const totalHigh = SEVERITY_COUNTS.high;

    return (
        <>
            <Navbar variant="app" username="manan-dev" />

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
                                <span>manan-dev/{repoName}</span>
                            </nav>

                            <h1 className={styles.pageTitle}>
                                Security Report: <span className={styles.repoHighlight}>manan-dev/{repoName}</span>
                            </h1>

                            <p className={styles.meta}>
                                Analyzed 2m ago · {FILES_SCANNED} files scanned ·{" "}
                                {totalCritical} critical issues
                            </p>
                        </div>

                        <Link
                            href={`/report/${repoName}/pr`}
                            className="btn btn-primary btn-lg"
                        >
                            Open Pull Request
                        </Link>
                    </div>

                    {/* Score Section */}
                    <div className={styles.scoreSection}>
                        <ScoreCircle score={SECURITY_SCORE} />

                        <div className={styles.severityPills}>
                            <span className="badge badge-critical">
                                {SEVERITY_COUNTS.critical} Critical
                            </span>
                            <span className="badge badge-high">
                                {SEVERITY_COUNTS.high} High
                            </span>
                            <span className="badge badge-medium">
                                {SEVERITY_COUNTS.medium} Medium
                            </span>
                            <span className="badge badge-low">
                                {SEVERITY_COUNTS.low} Low
                            </span>
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

                        {FINDINGS.map((finding) => (
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
                                        {finding.file}
                                    </span>
                                    <span className={styles.colIssue}>{finding.issue}</span>
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
                                                    navigator.clipboard.writeText(finding.newCode);
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
                                                <div className={styles.diffLabel}>Before</div>
                                                <pre>{finding.oldCode}</pre>
                                            </div>
                                            <div className={styles.diffNew}>
                                                <div className={styles.diffLabel}>After</div>
                                                <pre>{finding.newCode}</pre>
                                            </div>
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
                            {totalCritical} Critical, {totalHigh} High issues found.
                        </span>
                        <Link
                            href={`/report/${repoName}/pr`}
                            className="btn btn-primary"
                        >
                            Auto-fix all — Open Pull Request
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
