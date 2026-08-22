import { PRODUCT_NAME } from "@climbing-tracker/config";
import { redirect } from "next/navigation";
import { SignOutButton } from "./auth/auth-form";
import { createSupabaseCookieClient } from "../lib/supabase";

export const dynamic = "force-dynamic";

export default async function Home() {
  try {
    const supabase = await createSupabaseCookieClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user?.email_confirmed_at && !data.user?.confirmed_at)
      redirect("/auth/sign-in");
    return (
      <main>
        <div className="home-header">
          <div>
            <p className="eyebrow">Your climbing space</p>
            <h1>{PRODUCT_NAME}</h1>
          </div>
          <SignOutButton />
        </div>
        <p>Fast bouldering session logging, built for the wall.</p>
        <section aria-labelledby="auth-heading">
          <h2 id="auth-heading">You’re signed in</h2>
          <p>{data.user.email}</p>
          <p>Session logging is coming next. Your account is ready.</p>
        </section>
      </main>
    );
  } catch {
    redirect("/auth/sign-in");
  }
}
