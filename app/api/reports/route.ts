import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
    try {
        const session = await auth();

        if (!session?.accessToken || !session.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { data: analyses, error } = await getSupabase()
            .from("analyses")
            .select("*")
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: false });

        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }

        return NextResponse.json(analyses);
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Failed to fetch reports";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
