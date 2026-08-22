"use client";

import { FormEvent, useEffect, useState } from "react";
import { authCallbackPath } from "../../lib/auth-redirect";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";

type AuthMode = "sign-in" | "sign-up" | "forgot" | "update";

const labels: Record<AuthMode, string> = {
  "sign-in": "Sign in",
  "sign-up": "Create account",
  forgot: "Reset password",
  update: "Choose a new password",
};

export function AuthForm({ mode: initialMode }: { mode: AuthMode }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [recoverySession, setRecoverySession] = useState(
    initialMode !== "update",
  );

  useEffect(() => {
    if (mode !== "update") return;
    let mounted = true;
    let client: ReturnType<typeof createSupabaseBrowserClient>;
    try {
      client = createSupabaseBrowserClient();
    } catch (cause) {
      if (mounted)
        setError(
          cause instanceof Error ? cause.message : "Supabase is not configured",
        );
      return;
    }
    void client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return;
      setRecoverySession(Boolean(data.session));
      if (sessionError || !data.session) {
        setError(
          "This password-reset link is invalid, expired, or already used.",
        );
      }
    });
    const { data } = client.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setRecoverySession(true);
        setError(null);
      }
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [mode]);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
    setMessage(null);
    setPassword("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const client = createSupabaseBrowserClient();
      if (mode === "sign-in") {
        const { data, error: signInError } =
          await client.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
        if (signInError) throw signInError;
        if (!data.user?.email_confirmed_at && !data.user?.confirmed_at) {
          await client.auth.signOut();
          throw new Error(
            "Please confirm your email address before signing in.",
          );
        }
        window.location.assign("/");
      } else if (mode === "sign-up") {
        const { data, error: signUpError } = await client.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${authCallbackPath("/")}`,
          },
        });
        if (signUpError) throw signUpError;
        if (
          data.session &&
          (data.user?.email_confirmed_at || data.user?.confirmed_at)
        ) {
          window.location.assign("/");
        } else {
          setMessage(
            "Check your email for a confirmation link, then return here to sign in.",
          );
        }
      } else if (mode === "forgot") {
        const { error: resetError } = await client.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo: `${window.location.origin}${authCallbackPath("/auth/update-password")}`,
          },
        );
        // Deliberately show the same message for registered and unregistered
        // addresses so this form does not disclose account existence.
        if (resetError) throw resetError;
        setMessage(
          "If an account uses that email, we sent a password-reset link. Check your inbox.",
        );
      } else {
        if (!recoverySession) {
          throw new Error(
            "This password-reset link is invalid, expired, or already used.",
          );
        }
        if (password.length < 8)
          throw new Error("Use a password with at least 8 characters.");
        const { error: updateError } = await client.auth.updateUser({
          password,
        });
        if (updateError) throw updateError;
        setMessage("Your password has been updated. You can now sign in.");
        setPassword("");
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  const isPasswordMode = mode === "sign-in" || mode === "sign-up";
  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="auth-title">
        <p className="eyebrow">Climbing Tracker</p>
        <h1 id="auth-title">{labels[mode]}</h1>
        {mode === "update" && !recoverySession ? (
          <p role="alert" className="auth-error">
            {error ?? "This reset link is no longer valid."}
          </p>
        ) : (
          <form onSubmit={submit}>
            {mode !== "update" && (
              <label>
                Email
                <input
                  autoComplete="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
            )}
            {isPasswordMode && (
              <label>
                Password
                <input
                  autoComplete={
                    mode === "sign-in" ? "current-password" : "new-password"
                  }
                  minLength={8}
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
            )}
            {mode === "update" && (
              <label>
                New password
                <input
                  autoComplete="new-password"
                  minLength={8}
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
            )}
            {error && (
              <p role="alert" className="auth-error">
                {error}
              </p>
            )}
            {message && (
              <p role="status" className="auth-message">
                {message}
              </p>
            )}
            <button type="submit" disabled={busy}>
              {busy ? "Working…" : labels[mode]}
            </button>
          </form>
        )}
        <nav className="auth-links" aria-label="Authentication">
          {mode === "sign-in" && (
            <>
              <button
                type="button"
                className="link-button"
                onClick={() => switchMode("sign-up")}
              >
                Create an account
              </button>
              <button
                type="button"
                className="link-button"
                onClick={() => switchMode("forgot")}
              >
                Forgot your password?
              </button>
            </>
          )}
          {mode === "sign-up" && (
            <button
              type="button"
              className="link-button"
              onClick={() => switchMode("sign-in")}
            >
              Already have an account? Sign in
            </button>
          )}
          {mode === "forgot" && (
            <button
              type="button"
              className="link-button"
              onClick={() => switchMode("sign-in")}
            >
              Back to sign in
            </button>
          )}
          {mode === "update" && (
            <button
              type="button"
              className="link-button"
              onClick={() => switchMode("forgot")}
            >
              Request another reset link
            </button>
          )}
        </nav>
      </section>
    </main>
  );
}

export function SignOutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function signOut() {
    setBusy(true);
    setError(null);
    try {
      await createSupabaseBrowserClient().auth.signOut();
      window.location.assign("/auth/sign-in");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not sign out. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <button type="button" onClick={() => void signOut()} disabled={busy}>
        {busy ? "Signing out…" : "Sign out"}
      </button>
      {error && (
        <p role="alert" className="auth-error">
          {error}
        </p>
      )}
    </div>
  );
}
