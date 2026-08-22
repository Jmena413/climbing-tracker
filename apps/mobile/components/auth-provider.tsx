import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { webAuthUrl } from "../lib/auth-redirect";
import { supabase } from "../supabase";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function messageFor(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

function isConfirmed(session: Session | null): boolean {
  return Boolean(
    session?.user.email_confirmed_at ?? session?.user.confirmed_at,
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setError(
        "Supabase is not configured. Add the EXPO_PUBLIC variables and restart Expo.",
      );
      setLoading(false);
      return;
    }
    const client = supabase;
    let mounted = true;
    void client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return;
      setSession(isConfirmed(data.session) ? data.session : null);
      if (sessionError) setError(messageFor(sessionError));
      setLoading(false);
    });
    const { data } = client.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;
      setSession(isConfirmed(nextSession) ? nextSession : null);
      if (nextSession && !isConfirmed(nextSession)) void client.auth.signOut();
      if (event === "SIGNED_OUT") setError(null);
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      error,
      clearError: () => setError(null),
      async signIn(email, password) {
        if (!supabase) throw new Error("Supabase is not configured");
        const { data, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
        if (signInError) throw signInError;
        if (!data.user?.email_confirmed_at && !data.user?.confirmed_at) {
          await supabase.auth.signOut();
          throw new Error(
            "Please confirm your email address before signing in.",
          );
        }
      },
      async signUp(email, password) {
        if (!supabase) throw new Error("Supabase is not configured");
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: webAuthUrl("/"),
          },
        });
        if (signUpError) throw signUpError;
        return Boolean(data.session && isConfirmed(data.session));
      },
      async resetPassword(email) {
        if (!supabase) throw new Error("Supabase is not configured");
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo: webAuthUrl("/auth/update-password"),
          },
        );
        if (resetError) throw resetError;
      },
      async signOut() {
        if (!supabase) return;
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;
      },
    }),
    [error, loading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
