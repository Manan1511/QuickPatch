import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { analyzeRepo } from "@/lib/analyzer";
import { supabase } from "@/lib/supabase";

interface AnalyzeRequest {
    owner: string;
    repo: string;
    defaultBranch: string;
}

export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.accessToken || !session.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body: AnalyzeRequest = await request.json();

        if (!body.owner || !body.repo || !body.defaultBranch) {
            return NextResponse.json(
                { error: "Missing required fields: owner, repo, defaultBranch" },
                { status: 400 }
            );
        }

        // Upsert user record
        await supabase
            .from("users")
            .upsert(
                {
                    github_id: session.user.id,
                    username: session.user.name ?? "",
                    avatar_url: session.user.image ?? null,
                },
                { onConflict: "github_id" }
            );

        // Run security analysis
        const analysis = await analyzeRepo(
            session.accessToken,
            body.owner,
            body.repo,
            body.defaultBranch
        );

        // Save to database
        const { data: savedAnalysis, error: dbError } = await supabase
            .from("analyses")
            .insert({
                user_id: session.user.id,
                repo_full_name: `${body.owner}/${body.repo}`,
                score: analysis.score,
                findings: analysis.findings,
            })
            .select()
            .single();

        if (dbError) {
            throw new Error(`Database error: ${dbError.message}`);
        }

        return NextResponse.json({
            id: savedAnalysis.id,
            score: analysis.score,
            findings: analysis.findings,
            repo_full_name: savedAnalysis.repo_full_name,
            created_at: savedAnalysis.created_at,
        });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Analysis failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
