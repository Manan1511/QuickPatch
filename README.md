# QuickPatch ⚡

**AI-Powered Security Analysis & Automated Patching for Vibe-Coded Apps.**

QuickPatch scans your AI-generated (or any) GitHub repositories, identifies security vulnerabilities using Google Gemini, and automatically generates Pull Requests with the fixes.

## 🚀 Features

- **Automated Security Scanning**: Seamlessly audit your code for vulnerabilities.
- **AI-Driven Finding Analysis**: Uses Google Gemini to score and categorize security issues.
- **One-Click Patching**: Generate Pull Requests with corrected code automatically.
- **Repository Dashboard**: Track security scores across all your connected repositories.
- **Persistent Reports**: View history and insights for every analysis performed.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org) (App Router)
- **Styling**: Vanilla CSS (Vercel-inspired minimalism)
- **AI**: [Google Generative AI (Gemini)](https://ai.google.dev/)
- **Database**: [Supabase](https://supabase.com/)
- **Authentication**: [NextAuth.js v5](https://authjs.dev/)
- **Typography**: [Geist Sans & Mono](https://vercel.com/font)

## 📦 Getting Started

### 1. Prerequisites

- A GitHub OAuth App (for authentication and repo access).
- A Supabase project.
- A Google Gemini API Key.

### 2. Environment Variables

Create a `.env.local` file in the root directory and add the following:

```env
# NextAuth
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-id
GITHUB_CLIENT_SECRET=your-github-secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-key

# Google Gemini
GEMINI_API_KEY=your-gemini-key
```

### 3. Installation & Development

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start using QuickPatch.

## 📄 License

This project is licensed under the MIT License.
