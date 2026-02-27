import { NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import { auth } from "@/auth";
import { getSupabase } from "@/lib/supabase";
import { createFixPR } from "@/lib/createPR";
import type { AnalysisRow } from "@/lib/supabase";

interface PRRequest {
    owner: string;
    repo: string;
    analysisId: string;
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

        const body: PRRequest = await request.json();

        if (!body.owner || !body.repo || !body.analysisId) {
            return NextResponse.json(
                { error: "Missing required fields: owner, repo, analysisId" },
                { status: 400 }
            );
        }

        // Fetch the analysis from Supabase
        const { data, error: fetchError } = await getSupabase()
            .from("analyses")
            .select("*")
            .eq("id", body.analysisId)
            .eq("user_id", session.user.id)
            .single();

        if (fetchError || !data) {
            return NextResponse.json(
                { error: "Analysis not found" },
                { status: 404 }
            );
        }

        const analysis = data as unknown as AnalysisRow;

        // Get default branch from GitHub
        const octokit = new Octokit({ auth: session.accessToken });
        const { data: repoData } = await octokit.repos.get({
            owner: body.owner,
            repo: body.repo,
        });

        // Create the PR
        const prResult = await createFixPR(
            session.accessToken,
            body.owner,
            body.repo,
            repoData.default_branch,
            analysis.findings
        );

        // Update the analysis with PR info
        const { error: updateError } = await getSupabase()
            .from("analyses")
            .update({
                pr_url: prResult.pr_url,
                pr_number: prResult.pr_number,
            })
            .eq("id", body.analysisId);

        if (updateError) {
            console.error("Failed to update analysis with PR info:", updateError);
        }

        return NextResponse.json({
            pr_url: prResult.pr_url,
            pr_number: prResult.pr_number,
        });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Failed to create PR";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
