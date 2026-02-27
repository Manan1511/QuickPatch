import { Octokit } from "@octokit/rest";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Finding } from "./supabase";

/* ===== Constants ===== */

const MAX_FILES = 40;
const MAX_LINES_PER_FILE = 500;

const FILE_PATTERNS = [
    /\.(ts|tsx|js|jsx|py)$/,
    /\.env/,
    /package\.json$/,
    /requirements\.txt$/,
    /Dockerfile$/,
    /\.(yaml|yml)$/,
];

const SYSTEM_INSTRUCTION = `You are a security auditor specializing in AI-generated code. Analyze the provided codebase and return ONLY a valid JSON object with this exact shape: { "score": number (0-100, lower is worse), "findings": [{ "id": string, "severity": "critical"|"high"|"medium"|"low", "file": string, "line": number|null, "title": string, "description": string, "fix": string (the complete corrected code for that file or snippet) }] }. Do not include markdown, explanation, or any text outside the JSON.`;

/* ===== Types ===== */

export interface AnalysisResult {
    score: number;
    findings: Finding[];
}

interface TreeItem {
    path?: string;
    type?: string;
    size?: number;
}

/* ===== Main Function ===== */

export async function analyzeRepo(
    accessToken: string,
    owner: string,
    repo: string,
    defaultBranch: string
): Promise<AnalysisResult> {
    const octokit = new Octokit({ auth: accessToken });

    // 1. Fetch recursive file tree
    const { data: treeData } = await octokit.git.getTree({
        owner,
        repo,
        tree_sha: defaultBranch,
        recursive: "1",
    });

    // 2. Filter relevant files
    const relevantFiles = treeData.tree
        .filter((item: TreeItem) => {
            if (item.type !== "blob" || !item.path) return false;
            return FILE_PATTERNS.some((pattern) => pattern.test(item.path!));
        })
        .slice(0, MAX_FILES);

    if (relevantFiles.length === 0) {
        return {
            score: 100,
            findings: [],
        };
    }

    // 3. Fetch file contents
    const fileContents: { path: string; content: string }[] = [];

    for (const file of relevantFiles) {
        try {
            const { data } = await octokit.repos.getContent({
                owner,
                repo,
                path: file.path!,
                ref: defaultBranch,
            });

            if ("content" in data && data.content) {
                const decoded = Buffer.from(data.content, "base64").toString("utf-8");
                const lines = decoded.split("\n");
                const truncated = lines.slice(0, MAX_LINES_PER_FILE).join("\n");
                fileContents.push({ path: file.path!, content: truncated });
            }
        } catch {
            // Skip files that can't be fetched (binary, too large, etc.)
            continue;
        }
    }

    // 4. Build prompt
    const prompt = fileContents
        .map(
            (f) =>
                `--- FILE: ${f.path} ---\n${f.content}\n--- END FILE ---`
        )
        .join("\n\n");

    // 5. Call Gemini 2.5 Pro
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("Missing GEMINI_API_KEY environment variable");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-pro",
        systemInstruction: SYSTEM_INSTRUCTION,
    });

    const result = await model.generateContent({
        contents: [
            {
                role: "user",
                parts: [
                    {
                        text: `Analyze the following codebase for security vulnerabilities:\n\n${prompt}`,
                    },
                ],
            },
        ],
        generationConfig: {
            responseMimeType: "application/json",
        },
    });

    const responseText = result.response.text();

    // 6. Parse JSON response
    try {
        const parsed: AnalysisResult = JSON.parse(responseText);

        // Validate shape
        if (typeof parsed.score !== "number" || !Array.isArray(parsed.findings)) {
            throw new Error("Invalid response shape from Gemini");
        }

        // Ensure score is in range
        parsed.score = Math.max(0, Math.min(100, Math.round(parsed.score)));

        // Ensure each finding has required fields
        parsed.findings = parsed.findings.map((f, i) => ({
            id: f.id || `finding-${i + 1}`,
            severity: f.severity || "medium",
            file: f.file || "unknown",
            line: f.line ?? null,
            title: f.title || "Untitled finding",
            description: f.description || "",
            fix: f.fix || "",
        }));

        return parsed;
    } catch (parseError) {
        throw new Error(
            `Failed to parse Gemini response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`
        );
    }
}
