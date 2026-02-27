import { createClient } from "@supabase/supabase-js";

/* ===== Database Types ===== */

export interface DbUser {
    id: string;
    github_id: string;
    username: string;
    avatar_url: string | null;
    created_at: string;
}

export interface Finding {
    id: string;
    severity: "critical" | "high" | "medium" | "low";
    file: string;
    line: number | null;
    title: string;
    description: string;
    fix: string;
}

export interface AnalysisRow {
    id: string;
    user_id: string;
    repo_full_name: string;
    score: number;
    findings: Finding[];
    pr_url: string | null;
    pr_number: number | null;
    created_at: string;
}

/* ===== Supabase Client ===== */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable"
    );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
