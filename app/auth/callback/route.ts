import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        `${origin}/forgot-password?error=${encodeURIComponent(
          "This reset link is invalid or has expired. Please request a new one."
        )}`
      );
    }
  }

  return NextResponse.redirect(`${origin}/auth/reset-password`);
}