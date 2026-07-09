"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const fullName = String(formData.get("fullName") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (fullName.length < 2) {
    redirect("/signup?error=Please%20enter%20your%20full%20name.");
  }

  if (password.length < 6) {
    redirect("/signup?error=Password%20must%20be%20at%20least%206%20characters.");
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  if (!data.user) {
    redirect("/signup?error=Could%20not%20create%20your%20account.");
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    full_name: fullName,
    role: "teacher",
  });

  if (profileError) {
    redirect(
      `/signup?error=${encodeURIComponent(
        "Account created, but the profile could not be created. Please contact support."
      )}`
    );
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") || "").trim();

  const supabase = await createClient();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    redirect(
      "/forgot-password?error=Password%20reset%20is%20not%20configured%20yet."
    );
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback`,
  });

  if (error) {
    redirect(
      `/forgot-password?error=${encodeURIComponent(
        "We could not send the reset email. Please try again."
      )}`
    );
  }

  redirect("/forgot-password?sent=1");
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (password.length < 6) {
    redirect(
      "/auth/reset-password?error=Password%20must%20be%20at%20least%206%20characters."
    );
  }

  if (password !== confirmPassword) {
    redirect("/auth/reset-password?error=Passwords%20do%20not%20match.");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    redirect(
      `/auth/reset-password?error=${encodeURIComponent(
        "This reset link is invalid or has expired. Request a new one."
      )}`
    );
  }

  redirect("/login?message=Password%20updated.%20Please%20sign%20in.");
}