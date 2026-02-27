import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";
import { createFixPR } from "@/lib/createPR";

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
        const { data: analysis, error: fetchError } = await supabase
            .from("analyses")
            .select("*")
            .eq("id", body.analysisId)
            .eq("user_id", session.user.id)
            .single();

        if (fetchError || !analysis) {
            return NextResponse.json(
                { error: "Analysis not found" },
                { status: 404 }
            );
        }

        // Get default branch from GitHub
        const { Octokit } = await import("@octokit/rest");
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
        const { error: updateError } = await supabase
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
