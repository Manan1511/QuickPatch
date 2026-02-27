import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

import type { NextAuthConfig } from "next-auth";

const authConfig: NextAuthConfig = {
    providers: [
        GitHub({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: "read:user repo",
                },
            },
        }),
    ],

    callbacks: {
        async jwt({ token, account, profile }) {
            if (account && profile) {
                token.accessToken = account.access_token;
                token.githubId = String(profile.id ?? "");
                token.username = (profile as Record<string, unknown>).login as string ?? "";
                token.avatarUrl = (profile as Record<string, unknown>).avatar_url as string ?? "";
            }
            return token;
        },

        async session({ session, token }) {
            session.accessToken = token.accessToken as string;
            session.user.id = token.githubId as string;
            session.user.name = token.username as string;
            session.user.image = token.avatarUrl as string;
            return session;
        },
    },

    pages: {
        signIn: "/connect",
    },

    session: {
        strategy: "jwt",
    },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
