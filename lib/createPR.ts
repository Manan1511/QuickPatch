import { Octokit } from "@octokit/rest";
import type { Finding } from "./supabase";

/* ===== Types ===== */

export interface PRResult {
    pr_url: string;
    pr_number: number;
    branch: string;
}

/* ===== Main Function ===== */

export async function createFixPR(
    accessToken: string,
    owner: string,
    repo: string,
    defaultBranch: string,
    findings: Finding[]
): Promise<PRResult> {
    const octokit = new Octokit({ auth: accessToken });

    // 1. Get latest commit SHA for default branch
    const { data: refData } = await octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${defaultBranch}`,
    });
    const latestCommitSha = refData.object.sha;

    // 2. Get the commit's tree SHA
    const { data: commitData } = await octokit.git.getCommit({
        owner,
        repo,
        commit_sha: latestCommitSha,
    });
    const baseTreeSha = commitData.tree.sha;

    // 3. Create a new branch
    const branchName = `quickpatch/fix-${Date.now()}`;
    await octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: latestCommitSha,
    });

    // 4. Group actionable findings by file
    const actionableFindings = findings.filter(
        (f) => f.file && (f.action === "delete" || (f.fix && f.fix.trim()))
    );

    if (actionableFindings.length === 0) {
        throw new Error("No actionable findings to apply");
    }

    const findingsByFile = new Map<string, Finding[]>();
    for (const finding of actionableFindings) {
        const existing = findingsByFile.get(finding.file) ?? [];
        existing.push(finding);
        findingsByFile.set(finding.file, existing);
    }

    // 5. For each file: fetch original → apply patches → create blob
    const treeEntries: {
        path: string;
        mode: "100644";
        type: "blob";
        sha: string;
    }[] = [];

    for (const [filePath, fileFindings] of findingsByFile) {
        // Fetch original file content
        let originalContent: string;
        try {
            const { data } = await octokit.repos.getContent({
                owner,
                repo,
                path: filePath,
                ref: defaultBranch,
            });
            if (!("content" in data) || !data.content) continue;
            originalContent = Buffer.from(data.content, "base64").toString("utf-8");
        } catch {
            continue; // Skip files that can't be fetched
        }

        // Apply patches (process from bottom to top to keep line numbers stable)
        const lines = originalContent.split("\n");
        const sortedFindings = [...fileFindings].sort(
            (a, b) => b.line - a.line // Bottom-first
        );

        for (const finding of sortedFindings) {
            const startIdx = finding.line - 1; // Convert to 0-indexed
            const endIdx = finding.endLine - 1;

            if (startIdx < 0 || startIdx >= lines.length) continue;

            const fixLines = finding.fix ? finding.fix.split("\n") : [];

            switch (finding.action) {
                case "replace":
                    // Replace lines [startIdx, endIdx] with fix content
                    lines.splice(
                        startIdx,
                        Math.min(endIdx - startIdx + 1, lines.length - startIdx),
                        ...fixLines
                    );
                    break;

                case "add":
                    // Insert fix content AFTER the specified line
                    lines.splice(startIdx + 1, 0, ...fixLines);
                    break;

                case "delete":
                    // Remove lines [startIdx, endIdx]
                    lines.splice(
                        startIdx,
                        Math.min(endIdx - startIdx + 1, lines.length - startIdx)
                    );
                    break;
            }
        }

        const patchedContent = lines.join("\n");

        // Create blob with patched content
        const { data: blobData } = await octokit.git.createBlob({
            owner,
            repo,
            content: patchedContent,
            encoding: "utf-8",
        });

        treeEntries.push({
            path: filePath,
            mode: "100644",
            type: "blob",
            sha: blobData.sha,
        });
    }

    if (treeEntries.length === 0) {
        throw new Error("No files were modified");
    }

    // 6. Create a new tree
    const { data: newTree } = await octokit.git.createTree({
        owner,
        repo,
        base_tree: baseTreeSha,
        tree: treeEntries,
    });

    // 7. Create a commit
    const { data: newCommit } = await octokit.git.createCommit({
        owner,
        repo,
        message: "fix: QuickPatch automated security fixes",
        tree: newTree.sha,
        parents: [latestCommitSha],
    });

    // 8. Update the branch ref
    await octokit.git.updateRef({
        owner,
        repo,
        ref: `heads/${branchName}`,
        sha: newCommit.sha,
    });

    // 9. Build PR body
    const prBody = buildPRBody(findings);

    // 10. Open the Pull Request
    const { data: prData } = await octokit.pulls.create({
        owner,
        repo,
        title: "[QuickPatch] Automated Security Fixes",
        body: prBody,
        head: branchName,
        base: defaultBranch,
    });

    return {
        pr_url: prData.html_url,
        pr_number: prData.number,
        branch: branchName,
    };
}

/* ===== PR Body Builder ===== */

function buildPRBody(findings: Finding[]): string {
    const SEVERITY_ORDER = ["critical", "high", "medium", "low"] as const;
    const SEVERITY_EMOJI: Record<string, string> = {
        critical: "🔴",
        high: "🟠",
        medium: "🔵",
        low: "⚪",
    };

    const ACTION_LABEL: Record<string, string> = {
        replace: "Modified",
        add: "Added",
        delete: "Removed",
    };

    let body = `## 🔒 QuickPatch Automated Security Fixes\n\n`;
    body += `This PR was automatically generated by [QuickPatch](https://quickpatch.dev) to address security vulnerabilities.\n\n`;

    for (const severity of SEVERITY_ORDER) {
        const group = findings.filter((f) => f.severity === severity);
        if (group.length === 0) continue;

        const emoji = SEVERITY_EMOJI[severity];
        body += `### ${emoji} ${severity.charAt(0).toUpperCase() + severity.slice(1)} (${group.length})\n\n`;

        for (const finding of group) {
            const action = ACTION_LABEL[finding.action] ?? "Fixed";
            body += `- [ ] **${finding.title}** — \`${finding.file}:${finding.line}\` (${action})\n`;
            if (finding.description) {
                body += `  ${finding.description}\n`;
            }
        }
        body += "\n";
    }

    body += `---\n_Generated by QuickPatch • [Learn more](https://quickpatch.dev)_\n`;

    return body;
}
