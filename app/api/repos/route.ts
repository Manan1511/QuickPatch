import { NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import { auth } from "@/auth";

export async function GET() {
    try {
        const session = await auth();

        if (!session?.accessToken) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const octokit = new Octokit({ auth: session.accessToken });

        const { data: repos } = await octokit.repos.listForAuthenticatedUser({
            sort: "updated",
            per_page: 50,
        });

        const mapped = repos.map((r) => ({
            id: r.id,
            name: r.name,
            full_name: r.full_name,
            private: r.private,
            language: r.language,
            updated_at: r.updated_at,
            default_branch: r.default_branch,
        }));

        return NextResponse.json(mapped);
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Failed to fetch repositories";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
