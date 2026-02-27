import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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
    line: number;
    endLine: number;
    action: "replace" | "add" | "delete";
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

/* ===== Supabase Client (Lazy) ===== */

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
    if (_supabase) return _supabase;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        throw new Error(
            "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
        );
    }

    _supabase = createClient(url, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    return _supabase;
}
