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

const SYSTEM_INSTRUCTION = `You are a security auditor. Analyze the codebase and return a JSON object.

IMPORTANT: Keep fixes minimal and targeted. Do NOT rewrite entire files.

FALSE POSITIVE RULES — do NOT flag these:
- Environment variable REFERENCES like process.env.*, import.meta.env.*, os.environ are CORRECT patterns. They are NOT exposed secrets. Only flag if an actual secret VALUE is hardcoded (e.g. "sk-abc123...").
- Do NOT downgrade dependency versions in package.json unless there is a specific known CVE. A newer version is not a vulnerability.
- Do NOT flag .env files that are in .gitignore. Only flag .env files that would be committed.
- Do NOT flag code patterns that are merely "best practice" suggestions. Only flag actual exploitable vulnerabilities.
- Do NOT replace API key loading code with null or empty strings. The code that loads keys from environment variables is the CORRECT pattern.

WHAT TO ACTUALLY FLAG:
- Hardcoded secrets, API keys, passwords (actual values, not env var references)
- SQL injection vulnerabilities
- XSS vulnerabilities
- Missing authentication/authorization on sensitive endpoints
- Insecure CORS configurations allowing any origin
- Missing input validation/sanitization on user inputs
- Insecure default configurations
- Path traversal vulnerabilities
- Command injection vulnerabilities

Return this exact JSON shape:
{
  "score": number (0-100, higher = more secure),
  "findings": [{
    "id": string,
    "severity": "critical" | "high" | "medium" | "low",
    "file": string (exact file path as given),
    "line": number (1-indexed start line of the vulnerable code),
    "endLine": number (1-indexed end line of the vulnerable code),
    "action": "replace" | "add" | "delete",
    "title": string (short vulnerability name),
    "description": string (explain the issue and the fix),
    "fix": string (ONLY the replacement code snippet for lines line..endLine — raw code, no markdown, no prose)
  }]
}

Rules for the "fix" field:
- For "replace": "fix" is the code that replaces lines [line, endLine]. Keep it minimal — just the fixed lines.
- For "add": "fix" is the code to INSERT AFTER the line number. "line" and "endLine" should be the same.
- For "delete": "fix" should be an empty string "". The lines [line, endLine] will be removed.
- NEVER put explanations or prose in "fix". Only raw code.
- NEVER rewrite the entire file. Only include the changed lines.

Return ONLY valid JSON, no markdown fences or extra text.`;

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

    // 3. Fetch file contents (with line numbers for context)
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
                const lines = decoded.split("\n").slice(0, MAX_LINES_PER_FILE);
                // Add line numbers so the AI can reference them
                const numbered = lines.map((line, i) => `${i + 1}: ${line}`).join("\n");
                fileContents.push({ path: file.path!, content: numbered });
            }
        } catch {
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

    // 5. Call Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("Missing GEMINI_API_KEY environment variable");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: SYSTEM_INSTRUCTION,
    });

    const result = await model.generateContent({
        contents: [
            {
                role: "user",
                parts: [
                    {
                        text: `Analyze this codebase for security vulnerabilities. Reference exact line numbers.\n\n${prompt}`,
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

        if (typeof parsed.score !== "number" || !Array.isArray(parsed.findings)) {
            throw new Error("Invalid response shape from Gemini");
        }

        parsed.score = Math.max(0, Math.min(100, Math.round(parsed.score)));

        parsed.findings = parsed.findings.map((f, i) => ({
            id: f.id || `finding-${i + 1}`,
            severity: f.severity || "medium",
            file: f.file || "unknown",
            line: f.line || 1,
            endLine: f.endLine || f.line || 1,
            action: f.action || "replace",
            title: f.title || "Untitled finding",
            description: f.description || "",
            fix: f.fix ?? "",
        }));

        return parsed;
    } catch (parseError) {
        throw new Error(
            `Failed to parse Gemini response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`
        );
    }
}
