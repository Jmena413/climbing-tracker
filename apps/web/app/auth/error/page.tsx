import { AuthForm } from "../auth-form";

export default function AuthErrorPage() {
  return (
    <>
      <main className="auth-shell">
        <section className="auth-card">
          <p className="eyebrow">Authentication link</p>
          <h1>Link not valid</h1>
          <p role="alert">This link is invalid, expired, or already used.</p>
          <p>Request a new link and check your inbox, or return to sign in.</p>
        </section>
      </main>
      <AuthForm mode="forgot" />
    </>
  );
}
